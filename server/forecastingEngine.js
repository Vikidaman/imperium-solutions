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
  const debt =
    Number(nation.publicDebt) !== undefined && !Number.isNaN(Number(nation.publicDebt))
      ? Number(nation.publicDebt)
      : (Number(nation.treasuryBalance) < 0 ? Math.abs(Number(nation.treasuryBalance)) : gdp * 1.25);
  const debt_to_gdp_ratio = Math.max(10.0, Math.min(300.0, (debt / gdp) * 100));

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
 * Computes the authoritative GDP growth forecast, conformal intervals, and feature attributions
 * grounded in the Macroeconomic Aggregate Demand Identity: Y = AD = C + I + G + NX.
 *
 * Final 1-Year Real GDP Growth (%) =
 *   Potential Supply Trend (Labor Force Growth + TFP)
 *   + Consumption Demand Growth Contribution (ΔC: Disposable Income, Taxes, Consumer Sentiment)
 *   + Private Investment Growth Contribution (ΔI: Corp Tax, Real Interest Rate, Infrastructure, Literacy)
 *   + Government Spending Impulse (ΔG: Federal Expenditure Target vs. Sovereign Debt Crowding-Out)
 *   + Net Exports Contribution (ΔNX: Trade Balance, Tariffs, Freight/Supply-Chain Friction)
 *   + Crisis / External Shock Adjustments
 */
export function computeGdpForecast(nation, state, modelData = null) {
  const model = modelData || getLoadedModel();
  const meta = model.metadata || {};
  const features = extractMacroFeatures(nation, state);

  // 1. Baseline ML Model Prediction (calibrated anchor)
  const ml_ensemble_raw = predictEnsembleBaseline(model, features);

  // 2. Extract Live Aggregate Demand (AD = C + I + G + NX) & Policy Fundamentals
  const c = nation.computed || {};
  const ad = c.aggregateDemand || {};

  const incomeTax = Number(c.incomeTax ?? nation.incomeTaxOverride ?? 0.25);
  const salesTax = Number(c.salesTax ?? nation.salesTaxOverride ?? 0.06);
  const corporateTax = Number(c.corporateTax ?? nation.corporateTaxOverride ?? 0.21);
  const workerShare = Number(c.workerShareOfGdp ?? nation.workerShareOverride ?? 0.52);
  const budgetPct = Number(c.stateBudgetPercent ?? nation.budgetPercentOverride ?? 0.20);
  const centralBankRate = Number(nation.centralBankRate ?? 0.045);

  const consumerSentiment = Math.max(1, Number(nation.consumerSentiment ?? c.consumerConfidence ?? 65));
  const infraEff = Math.min(1, Math.max(0.05, Number(nation.infrastructureEfficiency ?? c.infrastructureEfficiency ?? 0.82)));
  const rawLit = Number(nation.literacyRate ?? c.literacyRate ?? 0.92);
  const literacyRate = Math.min(1, Math.max(0.05, rawLit > 1 ? rawLit / 100 : rawLit));
  const rawUrb = Number(nation.urbanisationIndex ?? c.urbanisationIndex ?? 0.83);
  const urbanisationIndex = Math.min(1, Math.max(0.05, rawUrb > 1 ? rawUrb / 100 : rawUrb));
  const crimeRate = Math.max(0, Number(c.crimeRate ?? nation.crimeRate ?? 0.02));
  const kFactor = Math.max(100, Number(nation.kFactorScaler) || 1500);
  const debtToGdpRatio = Number(c.debtToGdpRatio ?? features.debt_to_gdp_ratio ?? 126.0);
  const popGrowthQuarterly = Number(c.popGrowthRate ?? 0.0019);
  const freightDelay = Math.max(0, Number(nation.freightDelayFriction) || 0);

  // --- Component 1: Household Consumption Growth Contribution (ΔC) ---
  // Disposable income ratio relative to US baseline (0.55 * 0.72 * 0.94 = 0.37224)
  const dispIncomeRatio = (workerShare * (1 - incomeTax) * (1 - salesTax)) / 0.37224;
  const sentimentRatio = consumerSentiment / 65.0;
  const cIdx = ad.cIdx !== undefined ? Number(ad.cIdx) : (0.45 + 0.35 * dispIncomeRatio + 0.20 * Math.pow(sentimentRatio, 0.35));
  const consumptionGrowthContrib =
    1.15 + (cIdx - 1.0) * 4.2 + (sentimentRatio - 1.0) * 1.15;

  // --- Component 2: Gross Private Domestic Investment Growth Contribution (ΔI) ---
  // After-tax corporate return relative to baseline (0.45 * 0.75 = 0.3375), cost of capital, infrastructure & human capital
  const afterTaxProfitRatio = ((1 - workerShare) * (1 - corporateTax)) / 0.3375;
  const interestDrag = (centralBankRate - 0.045) * 8.0;
  const infraBonus = (infraEff - 0.82) * 3.2;
  const partyInfraShare = Number(c.partyPreferences?.infrastructureInvestmentShare ?? 0.038);
  const partyInfraBonus = (partyInfraShare - 0.038) * 18.0;
  const humanCapitalBonus = (literacyRate - 0.92) * 2.4 + (urbanisationIndex - 0.83) * 1.2;
  const tfpBonus = ((kFactor - 1500) / 1500) * 1.8;
  const investmentGrowthContrib =
    0.75 +
    (afterTaxProfitRatio - 1.0) * 2.2 -
    interestDrag +
    infraBonus +
    partyInfraBonus +
    humanCapitalBonus +
    tfpBonus -
    freightDelay * 1.5;

  // --- Component 3: Government Autonomous Expenditure Growth Contribution (ΔG) ---
  // Keynesian fiscal multiplier on federal spending vs. sovereign debt crowding-out above 126% Debt/GDP
  const fiscalStimulus = ((budgetPct - 0.22) / 0.22) * 1.35;
  const debtCrowdingOut =
    debtToGdpRatio > 130
      ? Math.min(2.5, ((debtToGdpRatio - 130) / 100) * 1.2)
      : (130 - debtToGdpRatio) / 100 * 0.20;
  const governmentGrowthContrib = 0.42 + fiscalStimulus - debtCrowdingOut;

  // --- Component 4: Net Exports & Trade Competitiveness Contribution (ΔNX) ---
  const nxShare = ad.nxShare !== undefined ? Number(ad.nxShare) : -0.03;
  const netExportsGrowthContrib =
    -0.12 + (nxShare - (-0.03)) * 14.0 - freightDelay * 1.8;

  // --- Component 5: Supply-Side Demographic & Institutional Baseline ---
  const annualizedPopGrowthPct = Math.max(-2.0, Math.min(4.0, popGrowthQuarterly * 4 * 100));
  const crimeDrag = Math.max(0, (crimeRate - 0.02)) * 1.5;
  // Blend structural AD growth with subtle ML ensemble signal centered around 0
  const mlSignalAdjustment = Math.max(-0.25, Math.min(0.25, (ml_ensemble_raw - 2.2) * 0.05));
  const supplyTrendContrib = Math.max(-1.5, Math.min(3.0, annualizedPopGrowthPct * 0.75 - crimeDrag + mlSignalAdjustment));

  // Baseline Forecast = C + I + G + NX growth contributions + Supply Trend
  const ad_baseline_forecast =
    consumptionGrowthContrib +
    investmentGrowthContrib +
    governmentGrowthContrib +
    netExportsGrowthContrib;
  const structural_adj = supplyTrendContrib;

  // 3. Crisis Shocks / International Sanctions
  let crisis_adj = 0;
  const activeCrises = state?.activeCrises || state?.crises || [];
  for (const crisis of activeCrises) {
    if (crisis.resolved) continue;
    if (crisis.targetNationId && crisis.targetNationId !== nation.id && crisis.targetNationId !== nation.countryId) continue;
    const severity = Number(crisis.severity) || Number(crisis.impact) || 1.0;
    crisis_adj -= severity * 0.75;
  }
  if (nation.underSanctions) {
    crisis_adj -= 1.8;
  }

  // 4. Final Real GDP Growth Rate (% per year)
  const unclippedFinal = ad_baseline_forecast + structural_adj + crisis_adj;
  // Clamp to realistic macroeconomic bounds [-12.0%, +16.0%]
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

  // 6. Aggregate Demand & Feature Attributions (Explainability)
  const attributions = {
    consumption_demand_C: Number(consumptionGrowthContrib.toFixed(3)),
    private_investment_I: Number(investmentGrowthContrib.toFixed(3)),
    government_spending_G: Number(governmentGrowthContrib.toFixed(3)),
    net_exports_NX: Number(netExportsGrowthContrib.toFixed(3)),
    labor_and_tfp_supply: Number(supplyTrendContrib.toFixed(3)),
  };
  if (Math.abs(crisis_adj) >= 0.01) {
    attributions.crisis_and_supply_shocks = Number(crisis_adj.toFixed(3));
  }

  return {
    modelVersion: meta.model_version || "2.0.0-AD",
    features,
    baselineForecast: Number(ad_baseline_forecast.toFixed(3)),
    structuralAdjustment: Number(structural_adj.toFixed(3)),
    crisisAdjustment: Number(crisis_adj.toFixed(3)),
    finalGrowth: Number(final_growth.toFixed(3)),
    adGrowthBreakdown: {
      consumptionGrowth: Number(consumptionGrowthContrib.toFixed(3)),
      investmentGrowth: Number(investmentGrowthContrib.toFixed(3)),
      governmentGrowth: Number(governmentGrowthContrib.toFixed(3)),
      netExportsGrowth: Number(netExportsGrowthContrib.toFixed(3)),
      supplyTrendGrowth: Number(supplyTrendContrib.toFixed(3)),
    },
    intervals: {
      interval80: interval_80,
      interval95: interval_95
    },
    attributions
  };
}

/**
 * Applies the calculated forecast growth rate to a nation during a quarterly step.
 * Compounds productive capacity so 4 quarterly settlements (+1 Year) change raw GDP
 * by the exact 1-Year Annual Real GDP Growth Rate (finalGrowth %).
 */
export function applyForecastGrowth(nation, forecastResult) {
  if (!nation.computed) nation.computed = {};

  const growthPct = Number(forecastResult.finalGrowth) || 0;
  // Quarterly compounding factor: (1 + g_annual)^0.25
  const annualMultiplier = Math.max(0.5, 1 + growthPct / 100);
  const quarterlyTargetMultiplier = Math.pow(annualMultiplier, 0.25);

  // Record growth history
  if (!Array.isArray(nation.historicalGdpGrowth)) {
    nation.historicalGdpGrowth = [];
  }
  nation.historicalGdpGrowth.push(growthPct);
  if (nation.historicalGdpGrowth.length > 12) {
    nation.historicalGdpGrowth.shift();
  }

  // Update previous unemployment tracker for change calculation next round
  nation.previousUnemploymentRate = nation.computed.unemploymentRate;

  // Store forecast output in computed state
  nation.computed.annualRealGdpGrowth = growthPct;
  nation.computed.quarterlyRealGdpGrowth = Number(((quarterlyTargetMultiplier - 1) * 100).toFixed(3));
  nation.computed.forecastBaseline = forecastResult.baselineForecast;
  nation.computed.forecastInterval80 = forecastResult.intervals.interval80;
  nation.computed.forecastInterval95 = forecastResult.intervals.interval95;
  nation.computed.forecastAttributions = forecastResult.attributions;
  nation.computed.forecastModelVersion = forecastResult.modelVersion;

  return growthPct;
}
