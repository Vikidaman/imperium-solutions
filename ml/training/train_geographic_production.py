#!/usr/bin/env python3
"""
Imperium Solutions — Geographic Factor & Industrial/Agricultural Production Training Pipeline
Trains an empirical machine learning model linking geographic factor endowments
(hydrocarbons, critical minerals, arable soil, navigable waterways, capital stock, labor)
to state-level and aggregate industrial, mining, and agricultural production.
Exports decision trees and marginal coefficients to JSON for deterministic server & browser evaluation.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold

np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_PATH = BASE_DIR / "ml" / "data" / "us_state_geographic_factors.csv"
MODELS_DIR = BASE_DIR / "public" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

JSON_OUTPUT = MODELS_DIR / "geographic_production_v1.json"
SCHEMA_OUTPUT = MODELS_DIR / "geographic_schema_v1.json"

FEATURE_COLS = [
    "hydrocarbon_endowment",
    "mineral_endowment",
    "arable_land_endowment",
    "waterway_logistics_endowment",
    "industrial_capital_stock",
    "extractive_labor_share",
    "agricultural_labor_share",
    "infrastructure_efficiency",
]

TARGETS = [
    "mining_extractive_gdp",
    "heavy_manufacturing_gdp",
    "agricultural_production_gdp",
]

def export_trees_to_dict(gbr, feature_names):
    """Serializes scikit-learn GradientBoostingRegressor trees into pure JSON."""
    trees_json = []
    init_val = float(gbr.init_.constant_[0][0])
    learning_rate = float(gbr.learning_rate)

    for est in gbr.estimators_[:, 0]:
        tree = est.tree_
        nodes = []
        for i in range(tree.node_count):
            is_leaf = tree.children_left[i] == tree.children_right[i]
            if is_leaf:
                nodes.append({
                    "is_leaf": True,
                    "value": float(tree.value[i, 0, 0]),
                })
            else:
                feat_idx = int(tree.feature[i])
                nodes.append({
                    "is_leaf": False,
                    "feature_index": feat_idx,
                    "feature_name": feature_names[feat_idx],
                    "threshold": float(tree.threshold[i]),
                    "left": int(tree.children_left[i]),
                    "right": int(tree.children_right[i]),
                })
        trees_json.append(nodes)

    return {
        "init_value": init_val,
        "learning_rate": learning_rate,
        "trees": trees_json,
    }

def train_and_evaluate():
    print(f"Loading empirical dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset loaded: {len(df)} states, features: {FEATURE_COLS}")

    X = df[FEATURE_COLS]
    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    trained_models = {}
    metrics_summary = {}

    for target in TARGETS:
        y = df[target]
        print(f"\n--- Cross-Validation for Target: {target} ---")
        cv_maes, cv_r2s = [], []

        for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
            X_tr, y_tr = X.iloc[train_idx], y.iloc[train_idx]
            X_te, y_te = X.iloc[test_idx], y.iloc[test_idx]

            fold_model = GradientBoostingRegressor(
                n_estimators=40,
                max_depth=3,
                learning_rate=0.09,
                min_samples_split=4,
                subsample=0.85,
                random_state=42 + fold
            )
            fold_model.fit(X_tr, y_tr)
            preds = fold_model.predict(X_te)

            mae = mean_absolute_error(y_te, preds)
            r2 = r2_score(y_te, preds)
            cv_maes.append(mae)
            cv_r2s.append(r2)

        mean_mae = np.mean(cv_maes)
        mean_r2 = np.mean(cv_r2s)
        print(f"5-Fold CV: Mean MAE = ${mean_mae:.2f}B, Mean R² = {mean_r2:.3f}")

        # Final fit on full dataset for simulation deployment
        final_model = GradientBoostingRegressor(
            n_estimators=50,
            max_depth=3,
            learning_rate=0.08,
            min_samples_split=4,
            subsample=0.85,
            random_state=42
        )
        final_model.fit(X, y)
        importances = {feat: float(imp) for feat, imp in zip(FEATURE_COLS, final_model.feature_importances_)}
        
        print(f"Top Feature Importances for {target}:")
        sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)
        for feat, imp in sorted_imp[:4]:
            print(f"  {feat}: {imp*100:.1f}%")

        trained_models[target] = final_model
        metrics_summary[target] = {
            "cv_mae": round(float(mean_mae), 3),
            "cv_r2": round(float(mean_r2), 3),
            "feature_importances": importances,
        }

    # Package model payload
    model_payload = {
        "metadata": {
            "model_version": "1.0.0",
            "model_name": "US_Geographic_Factor_Production_Forecaster",
            "country": "USA",
            "training_samples": len(df),
            "features": FEATURE_COLS,
            "targets": TARGETS,
            "metrics": metrics_summary,
            "elasticity_multipliers": {
                "hydrocarbon_to_extractive": 0.42,
                "mineral_to_extractive": 0.35,
                "arable_to_agricultural": 0.62,
                "waterway_to_logistics_throughput": 0.28,
                "capital_to_heavy_manufacturing": 0.58,
            }
        },
        "ensembles": {
            target: export_trees_to_dict(trained_models[target], FEATURE_COLS)
            for target in TARGETS
        }
    }

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(model_payload, f, indent=2)
    print(f"\nSuccessfully exported model weights to: {JSON_OUTPUT}")

    schema_payload = {
        "feature_names": FEATURE_COLS,
        "feature_descriptions": {
            "hydrocarbon_endowment": "Proven oil, natural gas, and coal reserves and extraction capacity (0-100)",
            "mineral_endowment": "Critical mineral, iron ore, copper, lithium, and rare earth deposits (0-100)",
            "arable_land_endowment": "Prime soil fertility, water resources, and crop heat units (0-100)",
            "waterway_logistics_endowment": "Navigable inland river miles, deepwater ports, and rail junctions (0-100)",
            "industrial_capital_stock": "Gross fixed manufacturing and extraction machinery capital ($ Billions)",
            "extractive_labor_share": "Percentage of workforce in mining, drilling, quarrying and refining (%)",
            "agricultural_labor_share": "Percentage of workforce in farming, ranching, and agro-forestry (%)",
            "infrastructure_efficiency": "State transport and utility efficiency multiplier (0.0 - 1.0)",
        },
        "targets": {
            "mining_extractive_gdp": "Mining, quarrying, and oil/gas extraction GDP ($ Billions)",
            "heavy_manufacturing_gdp": "Heavy machinery, automotive, chemicals, and metallurgy GDP ($ Billions)",
            "agricultural_production_gdp": "Crops, livestock, forestry, and aquaculture cash output ($ Billions)",
        }
    }

    with open(SCHEMA_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(schema_payload, f, indent=2)
    print(f"Successfully exported feature schema to: {SCHEMA_OUTPUT}")

if __name__ == "__main__":
    train_and_evaluate()
