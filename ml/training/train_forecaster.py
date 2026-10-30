#!/usr/bin/env python3
"""
Macroeconomic GDP Growth Forecaster Training Pipeline
Trains an interpretable, robust machine learning forecaster on historical panel data,
evaluates out-of-sample accuracy across chronological folds, calculates conformal
prediction intervals (80% and 95%), and exports the model to ONNX and pure JSON
for deterministic server-side and browser Web Worker inference.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "ml" / "data" / "macro_panel_1990_2024.csv"
MODELS_DIR = BASE_DIR / "public" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

ONNX_OUTPUT = MODELS_DIR / "gdp_forecast_v1.onnx"
JSON_OUTPUT = MODELS_DIR / "gdp_forecast_v1.json"
SCHEMA_OUTPUT = MODELS_DIR / "feature_schema_v1.json"

FEATURE_COLS = [
    "lagged_gdp_growth",
    "gdp_growth_ma3",
    "unemployment_rate",
    "unemployment_change",
    "inflation_rate",
    "interest_rate_real",
    "investment_ratio",
    "fiscal_balance_ratio",
    "debt_to_gdp_ratio",
    "trade_openness",
    "population_growth",
    "development_tier",
]

TARGET_COL = "target_gdp_growth"

def rolling_origin_evaluation(df):
    """Evaluates model using rolling chronological time-series splits."""
    splits = [
        {"train_end": 2010, "test_start": 2011, "test_end": 2015},
        {"train_end": 2015, "test_start": 2016, "test_end": 2020},
        {"train_end": 2020, "test_start": 2021, "test_end": 2024},
    ]

    all_residuals = []
    print("\n--- Rolling-Origin Chronological Cross-Validation ---")
    for i, s in enumerate(splits):
        train = df[df["year"] <= s["train_end"]]
        test = df[(df["year"] >= s["test_start"]) & (df["year"] <= s["test_end"])]

        X_train, y_train = train[FEATURE_COLS], train[TARGET_COL]
        X_test, y_test = test[FEATURE_COLS], test[TARGET_COL]

        model = GradientBoostingRegressor(
            n_estimators=50,
            max_depth=3,
            learning_rate=0.08,
            min_samples_split=8,
            subsample=0.85,
            random_state=42
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        residuals = y_test.values - preds
        all_residuals.extend(residuals)

        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        bias = np.mean(residuals)

        print(f"Fold {i+1} (Train <= {s['train_end']}, Test {s['test_start']}-{s['test_end']}): "
              f"MAE={mae:.3f}%, RMSE={rmse:.3f}%, R2={r2:.3f}, Bias={bias:+.3f}%")

    return np.array(all_residuals)

def export_trees_to_json(gbr, feature_names):
    """
    Serializes scikit-learn GradientBoostingRegressor decision trees into a clean,
    portable JSON structure so Node.js and Cloudflare Workers can evaluate it deterministically
    with zero native C++ or external dependencies.
    """
    trees_json = []
    init_val = float(gbr.init_.constant_[0][0])
    learning_rate = float(gbr.learning_rate)

    for est in gbr.estimators_[:, 0]:
        tree = est.tree_
        nodes = []
        for idx in range(tree.node_count):
            is_leaf = tree.children_left[idx] == -1 and tree.children_right[idx] == -1
            nodes.append({
                "id": int(idx),
                "is_leaf": bool(is_leaf),
                "feature": int(tree.feature[idx]) if not is_leaf else None,
                "feature_name": feature_names[tree.feature[idx]] if not is_leaf else None,
                "threshold": float(tree.threshold[idx]) if not is_leaf else None,
                "left": int(tree.children_left[idx]) if not is_leaf else None,
                "right": int(tree.children_right[idx]) if not is_leaf else None,
                "value": float(tree.value[idx][0][0]) if is_leaf else None,
            })
        trees_json.append(nodes)

    return {
        "init_value": init_val,
        "learning_rate": learning_rate,
        "trees": trees_json,
    }

def train_and_export():
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} records from {DATA_PATH}")

    # 1. Chronological Out-of-Sample Validation
    cv_residuals = rolling_origin_evaluation(df)

    # 2. Conformal Prediction Residual Quantiles
    q025 = float(np.percentile(cv_residuals, 2.5))
    q100 = float(np.percentile(cv_residuals, 10.0))
    q900 = float(np.percentile(cv_residuals, 90.0))
    q975 = float(np.percentile(cv_residuals, 97.5))
    print(f"\n--- Conformal Residual Intervals ---")
    print(f"80% Interval Offsets: [{q100:.3f}%, {q900:+.3f}%]")
    print(f"95% Interval Offsets: [{q025:.3f}%, {q975:+.3f}%]")

    # 3. Train Full Model
    X, y = df[FEATURE_COLS], df[TARGET_COL]
    gbr = GradientBoostingRegressor(
        n_estimators=50,
        max_depth=3,
        learning_rate=0.08,
        min_samples_split=8,
        subsample=0.85,
        random_state=42
    )
    gbr.fit(X, y)

    # Linear Ridge model for direct explainability & marginal coefficients
    ridge = Ridge(alpha=1.0)
    ridge.fit(X, y)

    # Full dataset performance
    y_pred = gbr.predict(X)
    print(f"\n--- Full Model In-Sample Performance ---")
    print(f"MAE:  {mean_absolute_error(y, y_pred):.3f}%")
    print(f"RMSE: {np.sqrt(mean_squared_error(y, y_pred)):.3f}%")
    print(f"R²:   {r2_score(y, y_pred):.3f}")

    # Feature Importances & Coefficients
    importances = {name: float(imp) for name, imp in zip(FEATURE_COLS, gbr.feature_importances_)}
    coefficients = {name: float(coef) for name, coef in zip(FEATURE_COLS, ridge.coef_)}
    print("\n--- Feature Importances (Tree) & Marginal Coefficients (Ridge) ---")
    for col in FEATURE_COLS:
        print(f"{col:22}: Imp={importances[col]*100:5.1f}% | Coef={coefficients[col]:+6.3f}")

    # 4. Export to ONNX (for Browser Web Worker)
    initial_type = [("float_input", FloatTensorType([None, len(FEATURE_COLS)]))]
    onnx_model = convert_sklearn(gbr, initial_types=initial_type, target_opset=13)
    with open(ONNX_OUTPUT, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"\nExported ONNX model to: {ONNX_OUTPUT} ({ONNX_OUTPUT.stat().st_size / 1024:.1f} KB)")

    # 5. Export JSON Ensemble Weights (for pure JavaScript deterministic server inference)
    serialized_ensemble = export_trees_to_json(gbr, FEATURE_COLS)
    
    # Feature distribution stats for normalization/validation
    feature_stats = {}
    for col in FEATURE_COLS:
        feature_stats[col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
        }

    model_metadata = {
        "model_version": "1.0.0",
        "algorithm": "GradientBoostingRegressor",
        "n_estimators": 50,
        "max_depth": 3,
        "learning_rate": float(gbr.learning_rate),
        "target_variable": "annual_real_gdp_growth_pct",
        "features": FEATURE_COLS,
        "feature_importances": importances,
        "marginal_coefficients": coefficients,
        "conformal_intervals": {
            "interval_80": {"lower_offset": q100, "upper_offset": q900},
            "interval_95": {"lower_offset": q025, "upper_offset": q975},
        },
        "feature_statistics": feature_stats,
        "created_at": pd.Timestamp.now().isoformat(),
    }

    full_json_model = {
        "metadata": model_metadata,
        "ensemble": serialized_ensemble,
    }

    with open(JSON_OUTPUT, "w") as f:
        json.dump(full_json_model, f, indent=2)
    print(f"Exported JSON model to: {JSON_OUTPUT} ({JSON_OUTPUT.stat().st_size / 1024:.1f} KB)")

    with open(SCHEMA_OUTPUT, "w") as f:
        json.dump(model_metadata, f, indent=2)
    print(f"Exported Feature Schema to: {SCHEMA_OUTPUT}")

    # 6. Verify Exact Parity between Python GBR and JSON tree walker
    def evaluate_json_tree(nodes, x_dict):
        node = nodes[0]
        while not node["is_leaf"]:
            val = x_dict[node["feature_name"]]
            if val <= node["threshold"]:
                node = nodes[node["left"]]
            else:
                node = nodes[node["right"]]
        return node["value"]

    def predict_json_ensemble(model_data, x_dict):
        ens = model_data["ensemble"]
        score = ens["init_value"]
        lr = ens["learning_rate"]
        for tree_nodes in ens["trees"]:
            score += lr * evaluate_json_tree(tree_nodes, x_dict)
        return score

    # Test parity on 5 random samples
    test_samples = df.sample(5, random_state=123)
    max_discrepancy = 0.0
    for _, row in test_samples.iterrows():
        sample_dict = {col: float(row[col]) for col in FEATURE_COLS}
        sample_arr = np.array([[row[col] for col in FEATURE_COLS]])
        
        py_pred = float(gbr.predict(sample_arr)[0])
        json_pred = predict_json_ensemble(full_json_model, sample_dict)
        diff = abs(py_pred - json_pred)
        max_discrepancy = max(max_discrepancy, diff)
        print(f"Parity check: Py={py_pred:.6f} vs JSON={json_pred:.6f} (Diff={diff:.2e})")

    assert max_discrepancy < 1e-5, f"Parity mismatch: max difference {max_discrepancy}"
    print(f"\n[SUCCESS] Exact mathematical parity verified between Python and JSON tree walker (max diff: {max_discrepancy:.2e})!")

if __name__ == "__main__":
    train_and_export()
