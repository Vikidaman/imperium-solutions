/**
 * Imperium Solutions - Authoritative AI Macroeconomic Forecasting Engine
 * Evaluates the trained Gradient Boosting decision tree ensemble and structural
 * macroeconomic policy transmission functions deterministically in pure JavaScript.
 */

import { gdpForecastModel } from "./modelWeights.js";

let cachedModel = gdpForecastModel;

export function getLoadedModel() {
  return cachedModel || gdpForecastModel;
}

function createFallbackModel() {
  return {
    metadata: {
      model_version: "1.0.0-fallback",
      algorithm: "LinearHeuristic",
      features: [
        "lagged_gdp_growth", "gdp_growth_ma3", "unemployment_rate", "unemployment_change",
        "inflation_rate", "interest_rate_real", "investment_ratio", "fiscal_balance_ratio",
        "debt_to_gdp_ratio", "trade_openness", "population_growth", "development_tier"
      ],
      conformal_intervals: {
        interval_80: { lower_offset: -0.93, upper_offset: 1.69 },
        interval_95: { lower_offset: -5.99, upper_offset: 3.38 }
      },
      marginal_coefficients: {
        lagged_gdp_growth: 0.25,
        gdp_growth_ma3: 0.35,
        unemployment_change: -0.90,
        investment_ratio: 0.10,
        fiscal_balance_ratio: 0.20,
        debt_to_gdp_ratio: -0.015,
        interest_rate_real: -0.10
      }
    },
    ensemble: null
  };
}

/**
 * Traverses a serialized decision tree for a feature map.
 */
function evaluateTree(nodes, featureMap) {
  let node = nodes[0];
  while (node && !node.is_leaf) {
    const featureVal = Number(featureMap[node.feature_name]) || 0;
    if (featureVal <= node.threshold) {
      node = nodes[node.left];
    } else {
      node = nodes[node.right];
    }
  }
  return node ? Number(node.value) || 0 : 0;
}

/**
 * Evaluates the full decision tree ensemble.
 */
export function predictEnsembleBaseline(modelData, featureMap) {
  if (!modelData.ensemble || !Array.isArray(modelData.ensemble.trees)) {
    // Fallback linear evaluation
    const c = modelData.metadata.marginal_coefficients || {};
    let fallback = 2.4;
    for (const [feat, weight] of Object.entries(c)) {
      if (featureMap[feat] !== undefined) {
        fallback += weight * (Number(featureMap[feat]) - 0);
      }
    }
    return Math.max(-10, Math.min(15, fallback));
  }

  const { init_value, learning_rate, trees } = modelData.ensemble;
  let score = Number(init_value) || 0;
  const lr = Number(learning_rate) || 0.08;

  for (let i = 0; i < trees.length; i++) {
    score += lr * evaluateTree(trees[i], featureMap);
  }

  return score;
}

/**
 * Maps the live simulator state of a nation to the 12 normalized macroeconomic features.
 */
export function extractMacroFeatures(nation, state) {
  const c = nation.computed || {};
  const gdp = Math.max(1, Number(c.aggregateGdp) || Number(nation.initialGdp) || 50000000);

  // 1. Lagged GDP Growth (%)
  const hist = Array.isArray(nation.historicalGdpGrowth) ? nation.historicalGdpGrowth : [];
  const lagged_gdp_growth = hist.length > 0 ? Number(hist[hist.length - 1]) : 2.45;

  // 2. 3-Year Moving Average GDP Growth (%)
  let gdp_growth_ma3 = lagged_gdp_growth;
  if (hist.length >= 3) {
    const last3 = hist.slice(-3);
    gdp_growth_ma3 = last3.reduce((a, b) => a + Number(b), 0) / 3;
  }

  // 3. Unemployment Rate (%)
  const uRate = Number(c.unemploymentRate);
  const unemployment_rate = Number.isFinite(uRate) ? Math.max(2.0, Math.min(30.0, uRate * 100)) : 5.5;

  // 4. Unemployment Change (percentage points)
  const prevU = nation.previousUnemploymentRate !== undefined ? Number(nation.previousUnemploymentRate) * 100 : unemployment_rate;
  const unemployment_change = Number((unemployment_rate - prevU).toFixed(3));

  // 5. CPI Inflation Rate (%)
  const inflation_rate = Number(nation.inflationRate) || (Number(c.inflationRate) ? Number(c.inflationRate) * 100 : 2.5);

  // 6. Real Interest Rate (% = nominal - inflation)
  const nominalRate = Number(nation.centralBankRate) || Number(nation.interestRate) || 3.5;
  const interest_rate_real = Number((nominalRate - inflation_rate).toFixed(3));

  // 7. Investment Ratio (% of GDP = Gross Capital Formation / GDP)
  const rawInv = Number(nation.investmentBudget) || Number(c.netCorporateInvestment) || (gdp * 0.22);
  const investment_ratio = Math.max(10.0, Math.min(50.0, (rawInv / gdp) * 100));

  // 8. Fiscal Balance Ratio (% of GDP = (Revenue - Expenditure) / GDP)
  const netBudget = Number(c.netBudgetBalance) || 0;
  const fiscal_balance_ratio = Math.max(-20.0, Math.min(10.0, (netBudget / gdp) * 100));

  // 9. Debt to GDP Ratio (% of GDP)
  const debt = Number(nation.publicDebt) || (Number(nation.treasuryBalance) < 0 ? Math.abs(Number(nation.treasuryBalance)) : gdp * 0.65);
  const debt_to_gdp_ratio = Math.max(15.0, Math.min(250.0, (debt / gdp) * 100));

  // 10. Trade Openness (% of GDP = (Exports + Imports) / GDP)
  const exportsVal = Number(c.totalExports) || Number(nation.totalExports) || (gdp * 0.30);
  const importsVal = Number(c.totalImports) || Number(nation.totalImports) || (gdp * 0.28);
  const trade_openness = Math.max(15.0, Math.min(350.0, ((exportsVal + importsVal) / gdp) * 100));

  // 11. Population Growth Rate (%)
  const popGrowth = Number(c.popGrowthRate);
  const population_growth = Number.isFinite(popGrowth) ? Number((popGrowth * 100).toFixed(3)) : 0.60;

  // 12. Development Tier (0: Developing, 1: Emerging, 2: Advanced)
  let development_tier = 1;
  if (nation.developmentTier !== undefined) {
    development_tier = Number(nation.developmentTier);
  } else if (
    nation.subcontinentId === "north-america" ||
    nation.subcontinentId === "western-europe" ||
    nation.countryId === "JPN" ||
    nation.countryId === "AUS" ||
    nation.countryId === "SGP"
  ) {
    development_tier = 2;
  } else if (nation.subcontinentId === "sub-saharan-africa" || nation.subcontinentId === "latin-america") {
    development_tier = 0;
  }

  return {
    lagged_gdp_growth: Number(lagged_gdp_growth.toFixed(3)),
    gdp_growth_ma3: Number(gdp_growth_ma3.toFixed(3)),
    unemployment_rate: Number(unemployment_rate.toFixed(3)),
    unemployment_change: Number(unemployment_change.toFixed(3)),
    inflation_rate: Number(inflation_rate.toFixed(3)),
    interest_rate_real: Number(interest_rate_real.toFixed(3)),
    investment_ratio: Number(investment_ratio.toFixed(3)),
    fiscal_balance_ratio: Number(fiscal_balance_ratio.toFixed(3)),
    debt_to_gdp_ratio: Number(debt_to_gdp_ratio.toFixed(3)),
    trade_openness: Number(trade_openness.toFixed(3)),
    population_growth: Number(population_growth.toFixed(3)),
    development_tier: Number(development_tier)
  };
}

/**
 * Computes the authoritative GDP growth forecast, conformal intervals, and feature attributions.
 * Final GDP Growth = ML Baseline + Structural Adjustments + Crisis/Sanction Shocks
 */
export function computeGdpForecast(nation, state, modelData = null) {
  const model = modelData || getLoadedModel();
  const meta = model.metadata || {};
  const features = extractMacroFeatures(nation, state);

  // 1. Baseline ML Model Prediction
  const baseline_forecast = predictEnsembleBaseline(model, features);

  // 2. Structural Policy Adjustments
  const c = nation.computed || {};
  const infraEff = Number(nation.infrastructureEfficiency) || Number(c.infrastructureEfficiency) || 0.70;
  const literacyRate = Number(nation.literacyRate) || Number(c.literacyRate) || 0.85;
  const crimeRate = Number(nation.crimeRate) || Number(c.crimeRate) || 0.05;

  // Infrastructure bonus/penalty: +/- 0.5% per 10% efficiency deviation
  const infraAdj = (infraEff - 0.70) * 0.5;
  // Human capital / literacy adjustment:
  const humanCapitalAdj = (literacyRate - 0.85) * 0.35;
  // Institutional security / crime friction:
  const crimeAdj = -Math.max(0, (crimeRate - 0.05)) * 0.40;
  const structural_adj = infraAdj + humanCapitalAdj + crimeAdj;

  // 3. Crisis Shocks / International Sanctions
  let crisis_adj = 0;
  const activeCrises = state.activeCrises || state.crises || [];
  for (const crisis of activeCrises) {
    if (crisis.resolved) continue;
    if (crisis.targetNationId && crisis.targetNationId !== nation.id && crisis.targetNationId !== nation.countryId) continue;
    const severity = Number(crisis.severity) || Number(crisis.impact) || 1.0;
    crisis_adj -= severity * 0.75;
  }
  if (nation.underSanctions) {
    crisis_adj -= 1.8;
  }

  // 4. Final Real GDP Growth Rate (%)
  const unclippedFinal = baseline_forecast + structural_adj + crisis_adj;
  // Clamp to realistic bounds [-12.0%, +16.0%]
  const final_growth = Math.max(-12.0, Math.min(16.0, unclippedFinal));

  // 5. Conformal Prediction Intervals (80% and 95%)
  const conf = meta.conformal_intervals || {
    interval_80: { lower_offset: -0.93, upper_offset: 1.69 },
    interval_95: { lower_offset: -5.99, upper_offset: 3.38 }
  };

  const interval_80 = [
    Math.max(-15.0, Number((final_growth + conf.interval_80.lower_offset).toFixed(2))),
    Math.min(20.0, Number((final_growth + conf.interval_80.upper_offset).toFixed(2)))
  ];

  const interval_95 = [
    Math.max(-20.0, Number((final_growth + conf.interval_95.lower_offset).toFixed(2))),
    Math.min(25.0, Number((final_growth + conf.interval_95.upper_offset).toFixed(2)))
  ];

  // 6. Feature Attributions (Marginal Contributions for Explainability)
  const coefs = meta.marginal_coefficients || {};
  const stats = meta.feature_statistics || {};
  const attributions = {};
  for (const [feat, val] of Object.entries(features)) {
    const mean = stats[feat] ? stats[feat].mean : 0;
    const coef = coefs[feat] || 0;
    const contribution = coef * (val - mean);
    if (Math.abs(contribution) >= 0.05) {
      attributions[feat] = Number(contribution.toFixed(3));
    }
  }

  return {
    modelVersion: meta.model_version || "1.0.0",
    features,
    baselineForecast: Number(baseline_forecast.toFixed(3)),
    structuralAdjustment: Number(structural_adj.toFixed(3)),
    crisisAdjustment: Number(crisis_adj.toFixed(3)),
    finalGrowth: Number(final_growth.toFixed(3)),
    intervals: {
      interval80: interval_80,
      interval95: interval_95
    },
    attributions
  };
}

/**
 * Applies the calculated forecast growth rate to a nation during an annual or quarterly step.
 */
export function applyForecastGrowth(nation, forecastResult) {
  if (!nation.computed) nation.computed = {};

  const growthPct = forecastResult.finalGrowth;
  const growthMultiplier = 1 + growthPct / 100;

  // Record growth history
  if (!Array.isArray(nation.historicalGdpGrowth)) {
    nation.historicalGdpGrowth = [];
  }
  nation.historicalGdpGrowth.push(growthPct);
  // Keep last 12 entries
  if (nation.historicalGdpGrowth.length > 12) {
    nation.historicalGdpGrowth.shift();
  }

  // Update previous unemployment tracker for change calculation next round
  nation.previousUnemploymentRate = nation.computed.unemploymentRate;

  // Store forecast output in computed state
  nation.computed.annualRealGdpGrowth = growthPct;
  nation.computed.forecastBaseline = forecastResult.baselineForecast;
  nation.computed.forecastInterval80 = forecastResult.intervals.interval80;
  nation.computed.forecastInterval95 = forecastResult.intervals.interval95;
  nation.computed.forecastAttributions = forecastResult.attributions;
  nation.computed.forecastModelVersion = forecastResult.modelVersion;

  // Scale sector VGPs proportionally to compound the annual growth
  if (nation.computed.sectorVgp) {
    for (const sector of Object.keys(nation.computed.sectorVgp)) {
      nation.computed.sectorVgp[sector] = Math.round(nation.computed.sectorVgp[sector] * growthMultiplier);
    }
  }

  return growthPct;
}
