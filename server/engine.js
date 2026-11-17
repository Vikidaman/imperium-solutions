// United States Macroeconomic, Supply-Chain & 50-State Simulation Engine
import { US_STATES_CATALOG } from "../src/data/usStatesData.js";
import {
  SIMPLIFIED_60_GOODS,
  DEFAULT_POLITICAL_PARTIES,
  FUNDING_TIERS,
  POLICY_CATALOG,
  resolvePoliticalParty,
  cloneDefaultPolicies,
  buildSimplifiedSeed,
} from "./simplifiedSeedConfig.js";
import { computeGdpForecast, applyForecastGrowth } from "./forecastingEngine.js";
import { COMMODITY_PRICE_BENCHMARKS } from "./empiricalPriceCatalog.js";
import {
  evaluateServicesProduction,
  evaluateStateServices,
  calculateSuperLinearAgglomeration,
  calculateConsumerServices,
} from "./servicesProductionEngine.js";

export {
  computeGdpForecast,
  applyForecastGrowth,
  evaluateServicesProduction,
  evaluateStateServices,
  calculateSuperLinearAgglomeration,
  calculateConsumerServices,
};

const TECH_ERA_TO_TOOL_INPUT = [
  { eraName: "Wooden Tools", goodName: "Wood & Timber" },
  { eraName: "Stone Tools", goodName: "Stone & Minerals" },
  { eraName: "Iron Tools", goodName: "Steel & Iron" },
  { eraName: "Tools", goodName: "Machine Tools & Machinery" },
  { eraName: "Semi-conductors", goodName: "Semiconductors & Chips" },
  { eraName: "Atomic", goodName: "Uranium & Nuclear" },
  { eraName: "Internet", goodName: "Computers & Electronics" },
  { eraName: "AI", goodName: "Media, Internet & Software" },
  { eraName: "Space Age", goodName: "Spacecraft & Propulsion" },
];

export function getCrimePolicyMultiplier(policy) {
  switch (policy) {
    case "Gentle Touch":
      return 1.5;
    case "Beat Cops":
      return 0.9;
    case "Profiling":
      return 0.75;
    case "Militarized Police":
      return 0.1;
    default:
      return 0.9;
  }
}

export function getHealthcareMortalityBase(policy) {
  if (policy === "Private Healthcare" || policy === "State-run Healthcare" || policy === "Subsidized Healthcare") {
    return 0.01;
  }
  if (policy === "Euthanasia") {
    return 0.3;
  }
  return 0.05;
}

function normalizeRateMetric(rawVal, fallback) {
  const num = Number(rawVal);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num > 1 ? Math.min(1, num / 100) : Math.min(1, Math.max(0.05, num));
}

function getPolicyCostPct(entry) {
  if (!entry || entry.enacted === false) return -0.008;
  const tier = FUNDING_TIERS[entry.funding] || FUNDING_TIERS.standard;
  return Number(tier.budgetCostPct) || 0;
}

/**
 * Models tax burden incidence across income percentiles [0, 1] using an asymmetric bell curve
 * whose modal peak is set by `mode` (0.10 = Low-Income concentrated / right-tailed skew;
 * 0.50 = Balanced middle-class bell; 0.90 = Upper-Income/Capital progressive / left-tailed skew).
 */
export function computeBellCurveTaxIncidence(
  mode = 0.62,
  incomeTax = 0.28,
  salesTax = 0.06,
  corporateTax = 0.25
) {
  const m = Math.max(0.10, Math.min(0.90, Number.isFinite(Number(mode)) ? Number(mode) : 0.62));
  const sigmaL = 0.16 + 0.42 * m;
  const sigmaR = 0.16 + 0.42 * (1 - m);

  const rawDensity = (x) => {
    const s = x < m ? sigmaL : sigmaR;
    return Math.exp(-Math.pow(x - m, 2) / (2 * s * s));
  };

  // Evaluate at Low-Income (x=0.20), Middle-Class (x=0.55), and Upper-Income (x=0.90)
  const dL = rawDensity(0.20);
  const dM = rawDensity(0.55);
  const dU = rawDensity(0.90);
  const weightedMean = 0.22 * dL + 0.50 * dM + 0.28 * dU;

  const relL = weightedMean > 0 ? dL / weightedMean : 1;
  const relM = weightedMean > 0 ? dM / weightedMean : 1;
  const relU = weightedMean > 0 ? dU / weightedMean : 1;

  // Compute effective cohort total tax burdens (income + sales consumption + corporate capital incidence)
  const incTax = Math.max(0, Number(incomeTax) || 0);
  const salTax = Math.max(0, Number(salesTax) || 0);
  const crpTax = Math.max(0, Number(corporateTax) || 0);

  const calcBurden = (modeVal, rL, rM, rU) => {
    const sL = salTax * (1.20 - 0.55 * modeVal); // regressive consumption burden shifts when mode is lower-income
    const sM = salTax * 1.00;
    const sU = salTax * (0.55 + 0.35 * modeVal);
    const tauL = Math.max(0.03, Math.min(0.72, incTax * 0.68 * Math.pow(rL, 1.15) + sL + crpTax * 0.05));
    const tauM = Math.max(0.05, Math.min(0.75, incTax * 0.92 * rM + sM + crpTax * 0.18));
    const tauU = Math.max(0.06, Math.min(0.82, incTax * 1.18 * Math.pow(rU, 1.15) + sU + crpTax * 0.52));
    return { tauL, tauM, tauU };
  };

  const { tauL, tauM, tauU } = calcBurden(m, relL, relM, relU);

  // Baseline reference at m=0.62, inc=0.28, sales=0.06, corp=0.25 -> mpcWeighted = 1.000 calibration
  const MPC_L = 0.92;
  const MPC_M = 0.74;
  const MPC_U = 0.42;
  const rawMpcWeighted =
    0.22 * (1 - tauL) * MPC_L +
    0.50 * (1 - tauM) * MPC_M +
    0.28 * (1 - tauU) * MPC_U;

  // Baseline constant evaluated at Democratic reference (m=0.62, 0.28, 0.06, 0.25)
  const refM = 0.62;
  const refSigL = 0.16 + 0.42 * refM;
  const refSigR = 0.16 + 0.42 * (1 - refM);
  const refDen = (x) => {
    const s = x < refM ? refSigL : refSigR;
    return Math.exp(-Math.pow(x - refM, 2) / (2 * s * s));
  };
  const rdL = refDen(0.20), rdM = refDen(0.55), rdU = refDen(0.90);
  const rMean = 0.22 * rdL + 0.50 * rdM + 0.28 * rdU;
  const rL0 = rdL / rMean, rM0 = rdM / rMean, rU0 = rdU / rMean;
  const refTauL = Math.max(0.03, Math.min(0.72, 0.28 * 0.68 * Math.pow(rL0, 1.15) + 0.06 * (1.20 - 0.55 * refM) + 0.25 * 0.05));
  const refTauM = Math.max(0.05, Math.min(0.75, 0.28 * 0.92 * rM0 + 0.06 + 0.25 * 0.18));
  const refTauU = Math.max(0.06, Math.min(0.82, 0.28 * 1.18 * Math.pow(rU0, 1.15) + 0.06 * (0.55 + 0.35 * refM) + 0.25 * 0.52));
  const refMpcWeighted =
    0.22 * (1 - refTauL) * MPC_L +
    0.50 * (1 - refTauM) * MPC_M +
    0.28 * (1 - refTauU) * MPC_U;

  // Isolate the pure distributional shift (removing aggregate statutory tax level which cIdx already prices)
  const sameStatRaw = calcBurden(m, relL, relM, relU);
  const refModeAtCurrStat = (() => {
    const { tauL: rTL, tauM: rTM, tauU: rTU } = calcBurden(refM, rL0, rM0, rU0);
    return 0.22 * (1 - rTL) * MPC_L + 0.50 * (1 - rTM) * MPC_M + 0.28 * (1 - rTU) * MPC_U;
  })();

  const pureDistributionalRatio = refModeAtCurrStat > 0 ? rawMpcWeighted / refModeAtCurrStat : 1.0;
  // Amplify responsiveness so shifting the bell curve visibly shifts C & AD while staying bounded
  const consumptionMpcMultiplier = Math.max(
    0.80,
    Math.min(1.20, 1 + (pureDistributionalRatio - 1) * 1.45)
  );

  // Heavy top-bracket modal taxation above 0.68 induces venture/capex investment drag in I
  const investmentCapexDrag =
    m > 0.68
      ? Math.min(0.16, (m - 0.68) * 0.42 * (0.65 + crpTax))
      : m < 0.45
      ? -Math.min(0.05, (0.45 - m) * 0.10)
      : 0;

  let skewLabel = "Symmetrical / Middle-Class Peaked";
  let skewDirection = "balanced";
  if (m < 0.45) {
    skewLabel = "Right-Tailed Skew (Concentrated on Lower Income)";
    skewDirection = "right-tailed";
  } else if (m > 0.58) {
    skewLabel = "Left-Tailed Progressive Skew (Peaks on Upper Income)";
    skewDirection = "left-tailed";
  }

  // Generate 21 sampled SVG curve points across x = [0, 1]
  const curvePoints = [];
  for (let i = 0; i <= 20; i++) {
    const x = Number((i / 20).toFixed(2));
    const density = rawDensity(x);
    const effectiveRatePct = Number(
      ((incTax * 0.90 * (density / weightedMean) + salTax * (1.15 - 0.45 * x) + crpTax * (0.05 + 0.48 * Math.pow(x, 1.4))) * 100).toFixed(1)
    );
    curvePoints.push({
      x,
      percentile: Math.round(x * 100),
      density: Number(density.toFixed(4)),
      effectiveRatePct,
    });
  }

  return {
    mode: Number(m.toFixed(3)),
    sigmaLeft: Number(sigmaL.toFixed(3)),
    sigmaRight: Number(sigmaR.toFixed(3)),
    skewLabel,
    skewDirection,
    relMultipliers: {
      lowIncome: Number(relL.toFixed(3)),
      middleClass: Number(relM.toFixed(3)),
      upperClass: Number(relU.toFixed(3)),
    },
    cohortTaxBurdens: {
      lowIncome: Number(tauL.toFixed(4)),
      middleClass: Number(tauM.toFixed(4)),
      upperClass: Number(tauU.toFixed(4)),
    },
    baselineTaxBurdens: {
      lowIncome: Number(refTauL.toFixed(4)),
      middleClass: Number(refTauM.toFixed(4)),
      upperClass: Number(refTauU.toFixed(4)),
    },
    mpcWeightedDisposal: Number(rawMpcWeighted.toFixed(4)),
    refMpcWeightedDisposal: Number(refMpcWeighted.toFixed(4)),
    consumptionMpcMultiplier: Number(consumptionMpcMultiplier.toFixed(4)),
    investmentCapexDrag: Number(investmentCapexDrag.toFixed(4)),
    progressivitySpread: Number((tauU - tauL).toFixed(4)),
    curvePoints,
  };
}

/**
 * Generates qualitative explanations and detects high-governance structural maluses
 * (diminishing returns / trade-offs at extreme capability levels).
 */
export function computeGovernanceDiagnostics({
  literacyRate = 0.92,
  infrastructureEfficiency = 0.82,
  urbanisationIndex = 0.83,
  consumerSentiment = 65,
  kFactorScaler = 1500,
  incomeEqualityIndex = 0.615,
}) {
  // 1. Workforce Literacy & Education -> Graduate Underemployment above 94%
  const litExcess = Math.max(0, literacyRate - 0.94);
  const graduateUnderemploymentBonus = litExcess > 0 ? Number((litExcess * 0.45).toFixed(4)) : 0; // up to +2.7% unemployment/underemployment at 100%
  const underemploymentRate = Number((0.03 + litExcess * 1.85).toFixed(4));
  let litText = "Moderate educational attainment limits complex industrial capacity and leaves high-skill billets unfilled.";
  if (literacyRate >= 0.96) {
    litText = "Populace is exceptionally well educated and significantly capable of higher-level R&D, finance, and executive jobs — though degree saturation triggers graduate underemployment in routine roles.";
  } else if (literacyRate >= 0.91) {
    litText = "Strong workforce readiness supports advanced services, aerospace, and digital sectors with broad technical literacy.";
  } else if (literacyRate >= 0.82) {
    litText = "Adequate basic schooling for core manufacturing and retail, but shortages of specialized STEM talent constrain frontier innovation.";
  } else {
    litText = "Underfunded school systems are eroding foundational human capital, depressing labor productivity and upward mobility.";
  }

  // 2. Total Factor Productivity (K-Factor) -> Automation Structural Unemployment above 1800 (1.20x)
  const kExcess = Math.max(0, kFactorScaler - 1800) / 1000;
  const automationUnemploymentBonus = kExcess > 0 ? Number((kExcess * 0.038).toFixed(4)) : 0; // up to +4.6% at 3000
  const automationGiniPressure = kExcess > 0 ? Number((kExcess * 0.045).toFixed(4)) : 0;
  let kText = "Frontier automation and high capital deepening drive elite output per worker.";
  if (kFactorScaler >= 2100) {
    kText = "Hyper-automated frontier economy generates massive output per worker, but rapid AI & robotic substitution displaces routine clerical and factory jobs into structural unemployment.";
  } else if (kFactorScaler >= 1650) {
    kText = "Expanding R&D capital and AI tooling elevate total factor productivity across high-tech supply chains.";
  } else if (kFactorScaler >= 1350) {
    kText = "Modern industrial capital stock sustains competitive global output per worker across services and manufacturing.";
  } else {
    kText = "Stagnant R&D and aging machinery reduce output per worker, widening unit costs and lowering global competitiveness.";
  }

  // 3. Urban Agglomeration -> Metropolitan Housing & Congestion Inflation above 88%
  const urbExcess = Math.max(0, urbanisationIndex - 0.88);
  const urbanOvercrowdingInflation = urbExcess > 0 ? Number((urbExcess * 0.24).toFixed(4)) : 0; // up to +2.88% CPI at 100%
  let urbText = "Urban clusters generate deep labor matching and knowledge spillovers.";
  if (urbanisationIndex >= 0.90) {
    urbText = "Hyper-dense coastal and inland megacities unlock maximum agglomeration spillovers, but acute housing scarcity and transit congestion stoke persistent shelter inflation.";
  } else if (urbanisationIndex >= 0.80) {
    urbText = "Mature metropolitan corridors sustain deep corporate services, thick skilled labor pools, and efficient supply hubs.";
  } else if (urbanisationIndex >= 0.68) {
    urbText = "Suburban and mid-tier hubs balance affordable housing with moderate agglomeration economies.";
  } else {
    urbText = "Declining civic maintenance and hollowed urban cores weaken cluster productivity and municipal service delivery.";
  }

  // 4. Infrastructure & Logistics -> Mega-Project Maintenance Overhead above 91%
  const infraExcess = Math.max(0, infrastructureEfficiency - 0.91);
  const infraMaintenanceBudgetPct = infraExcess > 0 ? Number((infraExcess * 0.28).toFixed(5)) : 0; // up to +2.5% quarterly GDP upkeep
  let infraText = "Reliable freight corridors and power grids anchor low-friction domestic commerce.";
  if (infrastructureEfficiency >= 0.92) {
    infraText = "Gold-plated smart grids, high-speed rail, and automated deepwater ports slash freight delays — though sustaining ultra-modern assets imposes heavy recurring federal upkeep costs.";
  } else if (infrastructureEfficiency >= 0.80) {
    infraText = "Resilient interstate highways, ports, and electrical transmission support predictable logistics and export competitiveness.";
  } else if (infrastructureEfficiency >= 0.68) {
    infraText = "Deferred highway and grid repairs cause intermittent freight bottlenecks, subtly raising business operating costs.";
  } else {
    infraText = "Severe port congestion, blackouts, and crumbling transit sharply inflate input costs and stall industrial supply chains.";
  }

  // 5. Household Consumer Sentiment -> Demand-Pull Overheating & Import Leakage above 85 idx
  const sentExcess = Math.max(0, consumerSentiment - 85) / 30;
  const sentimentOverheatingInflation = sentExcess > 0 ? Number((sentExcess * 0.022).toFixed(4)) : 0;
  const sentimentImportLeakage = sentExcess > 0 ? Number((sentExcess * 0.028).toFixed(4)) : 0;
  let sentText = "Steady household optimism supports predictable retail and durable goods spending.";
  if (consumerSentiment >= 88) {
    sentText = "Euphoric consumer exuberance drives booming retail sales, but excess credit demand overheats prices and pulls in foreign imports.";
  } else if (consumerSentiment >= 62) {
    sentText = "Balanced household confidence keeps personal consumption steady (~68% of GDP) without destabilizing price spikes.";
  } else if (consumerSentiment >= 48) {
    sentText = "Cautious household psychology raises precautionary savings, softening discretionary spending across retail and hospitality.";
  } else {
    sentText = "Deep public pessimism and institutional distrust trigger household retrenchment, risking a self-reinforcing consumption slump.";
  }

  // 6. Income Equality Index -> Wage Compression & Capital Formation Drag above 70%
  const eqExcess = Math.max(0, incomeEqualityIndex - 0.70);
  const equalityCapitalDrag = eqExcess > 0 ? Number((eqExcess * 2.4).toFixed(4)) : 0;
  let eqText = "Distributional balance supports both broad consumer purchasing power and private capital accumulation.";
  if (incomeEqualityIndex >= 0.72) {
    eqText = "Egalitarian income distribution lifts lower-income stability and maximizes aggregate MPC — but heavy top-end compression dampens risk-capital returns and speculative investment.";
  } else if (incomeEqualityIndex >= 0.60) {
    eqText = "Broad middle-class purchasing power anchors household demand while preserving healthy incentives for entrepreneurship and R&D.";
  } else if (incomeEqualityIndex >= 0.50) {
    eqText = "Widening income stratification concentrates gains at top deciles, weakening baseline retail demand and elevating social friction.";
  } else {
    eqText = "Severe wealth polarization leaves working households fragile, sharply depressing broad consumption propensity and institutional trust.";
  }

  const maluses = {
    literacy: {
      active: litExcess > 0,
      title: "Graduate Underemployment & Credential Saturation",
      penaltyLabel: litExcess > 0 ? `+${(graduateUnderemploymentBonus * 100).toFixed(2)}% Underemployment Drag` : "Inactive (< 94.0%)",
      detail: litExcess > 0
        ? `${(underemploymentRate * 100).toFixed(1)}% of university graduates face overqualification in routine jobs, adding frictional unemployment & expectation drag.`
        : "Triggers above 94.0% workforce literacy when degree supply outpaces executive/R&D job creation.",
      graduateUnderemploymentBonus,
      underemploymentRate,
    },
    productivity: {
      active: kExcess > 0,
      title: "Automation & AI Structural Unemployment",
      penaltyLabel: kExcess > 0 ? `+${(automationUnemploymentBonus * 100).toFixed(2)}% Displaced Labor` : "Inactive (< 1.20x K-Factor)",
      detail: kExcess > 0
        ? `Capital-intensive AI and robotics displace routine roles into structural unemployment and widen the skill wage premium (+${(automationGiniPressure * 100).toFixed(1)} pts Gini).`
        : "Triggers above 1.20x K-Factor (1800) as frontier automation substitutes for routine labor.",
      automationUnemploymentBonus,
      automationGiniPressure,
    },
    urbanisation: {
      active: urbExcess > 0,
      title: "Metro Housing & Congestion Inflation",
      penaltyLabel: urbExcess > 0 ? `+${(urbanOvercrowdingInflation * 100).toFixed(2)}% Shelter CPI` : "Inactive (< 88.0%)",
      detail: urbExcess > 0
        ? "Hyper-concentrated metro populations bid up urban rents and transit bottlenecks, feeding headline inflation."
        : "Triggers above 88.0% urban agglomeration when metro land supply saturates.",
      urbanOvercrowdingInflation,
    },
    infrastructure: {
      active: infraExcess > 0,
      title: "Mega-Project Maintenance Overhead",
      penaltyLabel: infraExcess > 0 ? `+${(infraMaintenanceBudgetPct * 100).toFixed(2)}% GDP Upkeep` : "Inactive (< 91.0%)",
      detail: infraExcess > 0
        ? "Ultra-high-grade transit corridors and smart grids require heavy recurring federal maintenance outlays."
        : "Triggers above 91.0% efficiency due to rising capital depreciation and upkeep.",
      infraMaintenanceBudgetPct,
    },
    sentiment: {
      active: sentExcess > 0,
      title: "Demand-Pull Overheating & Import Leakage",
      penaltyLabel: sentExcess > 0 ? `+${(sentimentOverheatingInflation * 100).toFixed(2)}% CPI / -${(sentimentImportLeakage * 100).toFixed(1)}% NX` : "Inactive (< 85 idx)",
      detail: sentExcess > 0
        ? "Exuberant household borrowing overheats domestic prices and sucks in foreign consumer imports."
        : "Triggers above 85 Consumer Sentiment idx when household spending outpaces domestic capacity.",
      sentimentOverheatingInflation,
      sentimentImportLeakage,
    },
    equality: {
      active: eqExcess > 0,
      title: "Wage Compression & Capital Formation Drag",
      penaltyLabel: eqExcess > 0 ? `-${equalityCapitalDrag.toFixed(2)}% Investment Drive` : "Inactive (< 70.0%)",
      detail: eqExcess > 0
        ? "Compressed top-end post-tax returns soften risk-capital deployment and corporate capex expansion."
        : "Triggers above 70.0% Income Equality when steep redistribution flattens equity risk-reward.",
      equalityCapitalDrag,
    },
  };

  return {
    explanations: {
      literacy: litText,
      infrastructure: infraText,
      urbanisation: urbText,
      sentiment: sentText,
      productivity: kText,
      equality: eqText,
    },
    maluses,
    totals: {
      totalMalusUnemploymentBonus: Number((graduateUnderemploymentBonus + automationUnemploymentBonus).toFixed(4)),
      underemploymentRate,
      automationGiniPressure,
      urbanOvercrowdingInflation,
      infraMaintenanceBudgetPct,
      sentimentOverheatingInflation,
      sentimentImportLeakage,
      equalityCapitalDrag,
    },
  };
}

/**
 * Computes quarterly structural progression deltas and federal budget impact
 * from the nation's enacted policies, funding tiers, and ruling party priorities.
 * Underfunded & repealed policies now carry severe structural decay penalties.
 */
export function computePolicyProgression(
  nation = {},
  party = DEFAULT_POLITICAL_PARTIES[0],
  inflationRate = 0.022,
  unemploymentRate = 0.045,
  taxDistributionMode = null
) {
  const canonicalDefaultPolicies = cloneDefaultPolicies(party?.name || "Democratic");
  const partyDefaults = party?.defaultPolicies || canonicalDefaultPolicies;
  const rawPolicies = nation.enactedPolicies || partyDefaults;

  const policies = {};
  let rawCostPct = 0;
  let defaultCostPct = 0;

  for (const spec of POLICY_CATALOG) {
    const id = spec.id;
    const defEntry = partyDefaults[id] || canonicalDefaultPolicies[id] || { enacted: true, funding: "standard" };
    const src = rawPolicies[id];
    const enacted = src && typeof src.enacted === "boolean" ? src.enacted : Boolean(defEntry.enacted);
    const fundingKey = src && FUNDING_TIERS[src.funding] ? src.funding : defEntry.funding || "standard";
    const entry = { enacted, funding: fundingKey };
    policies[id] = entry;
    rawCostPct += getPolicyCostPct(entry);
    defaultCostPct += getPolicyCostPct(defEntry);
  }

  const tierScoreOf = (entry) => (!entry.enacted ? -1 : (FUNDING_TIERS[entry.funding]?.tierScore ?? 1));
  const eduScore = tierScoreOf(policies.education);
  const infraScore = tierScoreOf(policies.infrastructure);
  const innovScore = tierScoreOf(policies.innovation);
  const govScore = tierScoreOf(policies.governance);

  // Compounding Institutional Neglect Multiplier when multiple core acts are underfunded or repealed
  const neglectedCount = [eduScore, infraScore, innovScore, govScore].filter((s) => s <= 0).length;
  const neglectMultiplier = neglectedCount >= 2 ? 1 + 0.18 * (neglectedCount - 1) : 1.0;

  // Severe quarterly penalties for underfunded (0) and repealed (-1) acts; rewarding priority/landmark
  const EDU_LIT_MAP = { "-1": -0.0180, 0: -0.0095, 1: 0.0012, 2: 0.0032, 3: 0.0060 };
  const INFRA_EFF_MAP = { "-1": -0.0240, 0: -0.0125, 1: 0.0012, 2: 0.0038, 3: 0.0070 };
  const INFRA_URB_MAP = { "-1": -0.0090, 0: -0.0045, 1: 0.0006, 2: 0.0016, 3: 0.0030 };
  const GOV_URB_MAP = { "-1": -0.0070, 0: -0.0035, 1: 0.0005, 2: 0.0012, 3: 0.0022 };
  const GOV_SENT_MAP = { "-1": -5.5, 0: -2.8, 1: 0.25, 2: 0.85, 3: 1.65 };
  const EDU_SENT_MAP = { "-1": -2.0, 0: -1.0, 1: 0.15, 2: 0.40, 3: 0.75 };
  const INNOV_TFP_MAP = { "-1": -55, 0: -28, 1: 6, 2: 18, 3: 34 };
  const EDU_TFP_MAP = { "-1": -25, 0: -12, 1: 3, 2: 8, 3: 15 };
  const GOV_EQ_MAP = { "-1": -0.0140, 0: -0.0070, 1: 0.0010, 2: 0.0028, 3: 0.0052 };
  const EDU_EQ_MAP = { "-1": -0.0080, 0: -0.0040, 1: 0.0008, 2: 0.0020, 3: 0.0036 };

  const partyInfraShare = Number(party?.infrastructureInvestmentShare ?? 0.038);
  const partyEduGovShare = Number(party?.educationGovernanceShare ?? 0.055);

  // Positive party share bonuses apply ONLY if funded at standard or higher (preventing free drift under austerity)
  const eduPartyBonus =
    eduScore >= 1
      ? (partyEduGovShare - 0.050) * 0.04
      : Math.min(0, (partyEduGovShare - 0.050) * 0.08);
  const infraPartyBonus =
    infraScore >= 1
      ? (partyInfraShare - 0.035) * 0.12
      : Math.min(0, (partyInfraShare - 0.035) * 0.20);

  const scaleNegative = (val) => (val < 0 ? val * neglectMultiplier : val);

  const literacyDelta = Number(
    scaleNegative((EDU_LIT_MAP[eduScore] ?? 0) + eduPartyBonus).toFixed(5)
  );
  const infrastructureDelta = Number(
    scaleNegative((INFRA_EFF_MAP[infraScore] ?? 0) + infraPartyBonus).toFixed(5)
  );
  const urbanisationDelta = Number(
    scaleNegative((INFRA_URB_MAP[infraScore] ?? 0) + (GOV_URB_MAP[govScore] ?? 0)).toFixed(5)
  );

  const macroSentimentDrag =
    Math.max(0, inflationRate - 0.03) * 28 + Math.max(0, unemploymentRate - 0.05) * 24;
  const rawSent = (GOV_SENT_MAP[govScore] ?? 0) + (EDU_SENT_MAP[eduScore] ?? 0);
  const sentimentDelta = Number(
    (scaleNegative(rawSent) - macroSentimentDrag).toFixed(3)
  );

  const infraTfpBonus = infraScore >= 2 ? 5 : infraScore <= 0 ? -6 : 0;
  const rawTfp = (INNOV_TFP_MAP[innovScore] ?? 0) + (EDU_TFP_MAP[eduScore] ?? 0) + infraTfpBonus;
  const tfpDelta = Number(scaleNegative(rawTfp).toFixed(1));

  const effMode =
    taxDistributionMode !== null && taxDistributionMode !== undefined
      ? Number(taxDistributionMode)
      : Number(nation.taxDistributionMode ?? party?.taxDistributionMode ?? 0.62);
  const taxModeEqPush = (effMode - 0.55) * 0.012;
  const rawEq = (GOV_EQ_MAP[govScore] ?? 0) + (EDU_EQ_MAP[eduScore] ?? 0) + taxModeEqPush;
  const equalityDelta = Number(scaleNegative(rawEq).toFixed(5));

  return {
    literacyDelta,
    infrastructureDelta,
    urbanisationDelta,
    sentimentDelta,
    tfpDelta,
    equalityDelta,
    neglectedCount,
    neglectMultiplier: Number(neglectMultiplier.toFixed(2)),
    policyBudgetAdjustmentPct: Number((rawCostPct - defaultCostPct).toFixed(5)),
    totalPolicyCostPct: Number(rawCostPct.toFixed(5)),
    policies,
    partyDefaultPolicies: partyDefaults,
  };
}

export function ensureUsaState(state) {
  if (!state.goodsCatalog || state.goodsCatalog.length === 0) {
    state.goodsCatalog = SIMPLIFIED_60_GOODS.map((g) => ({
      id: g.id,
      name: g.name,
      sector: g.sector,
      goodType: g.name,
      era: g.era,
      inputs: g.inputs,
      basePrice: g.basePrice,
    }));
  }

  if (!state.nations || state.nations.length === 0) {
    const defaultSeed = buildSimplifiedSeed(state);
    state.nations = defaultSeed.nations;
  }

  // Keep only the primary nation (USA) unless custom mock nations are passed in unit tests
  const usaNation = state.nations.find((n) => n.id === "usa" || n.name === "USA" || n.name === "United States");
  if (usaNation) {
    state.nations = [usaNation];

    // Ensure canonical 5 US political parties with full tax, infrastructure, and deficit preferences
    const existingParties = Array.isArray(state.politicalParties) ? state.politicalParties : [];
    const byName = new Map(existingParties.map((p) => [p.name, p]));
    const enrichedParties = DEFAULT_POLITICAL_PARTIES.map((tpl) => {
      const legacy = byName.get(tpl.name) ||
        (tpl.name === "Progressive Labor" ? byName.get("Green") : null) ||
        (tpl.name === "Libertarian Free-Market" ? byName.get("Libertarian") : null);
      if (!legacy) {
        return {
          ...tpl,
          defaultPolicies: cloneDefaultPolicies(tpl.name),
        };
      }
      return {
        ...tpl,
        ...legacy,
        name: tpl.name,
        incomeTaxPreference: Number(legacy.incomeTaxPreference ?? tpl.incomeTaxPreference),
        salesTaxPreference: Number(legacy.salesTaxPreference ?? tpl.salesTaxPreference),
        corporateTaxRate: Number(legacy.corporateTaxRate ?? tpl.corporateTaxRate),
        workerShareOfGdp: Number(legacy.workerShareOfGdp ?? tpl.workerShareOfGdp),
        taxDistributionMode: Number(legacy.taxDistributionMode ?? tpl.taxDistributionMode),
        infrastructureInvestmentShare: Number(legacy.infrastructureInvestmentShare ?? tpl.infrastructureInvestmentShare),
        educationGovernanceShare: Number(legacy.educationGovernanceShare ?? tpl.educationGovernanceShare),
        deficitTargetAsPercentOfGdp: Number(legacy.deficitTargetAsPercentOfGdp ?? tpl.deficitTargetAsPercentOfGdp),
        budgetAsPercentOfGdp: Number(legacy.budgetAsPercentOfGdp ?? tpl.budgetAsPercentOfGdp),
        platformSummary: legacy.platformSummary || tpl.platformSummary,
        defaultPolicies: legacy.defaultPolicies || cloneDefaultPolicies(tpl.name),
      };
    });
    // Preserve any extra custom parties if a scenario added non-canonical ones
    const canonicalNames = new Set(DEFAULT_POLITICAL_PARTIES.map((p) => p.name));
    const aliasNames = new Set(["Green", "Libertarian"]);
    for (const p of existingParties) {
      if (!canonicalNames.has(p.name) && !aliasNames.has(p.name)) {
        enrichedParties.push(p);
      }
    }
    state.politicalParties = enrichedParties;

    if (!usaNation.rulingParty) {
      usaNation.rulingParty = "Democratic";
    } else if (usaNation.rulingParty === "Green") {
      usaNation.rulingParty = "Progressive Labor";
    } else if (usaNation.rulingParty === "Libertarian") {
      usaNation.rulingParty = "Libertarian Free-Market";
    }

    if (!usaNation.startingBaseline) {
      usaNation.startingBaseline = {
        literacyRate: normalizeRateMetric(usaNation.literacyRate, 0.92),
        infrastructureEfficiency: normalizeRateMetric(usaNation.infrastructureEfficiency, 0.82),
        urbanisationIndex: normalizeRateMetric(usaNation.urbanisationIndex, 0.83),
        consumerSentiment: Math.max(1, Number(usaNation.consumerSentiment ?? 65)),
        kFactorScaler: Number(usaNation.kFactorScaler ?? 1500),
        incomeEqualityIndex: 0.615,
        publicDebt:
          usaNation.publicDebt !== undefined && usaNation.publicDebt !== null
            ? Number(usaNation.publicDebt)
            : 34500000000000,
      };
    } else if (usaNation.startingBaseline.incomeEqualityIndex === undefined) {
      usaNation.startingBaseline.incomeEqualityIndex = 0.615;
    }
    if (!usaNation.enactedPolicies) {
      usaNation.enactedPolicies = cloneDefaultPolicies(usaNation.rulingParty);
    }

    if (!usaNation.constituentStates || usaNation.constituentStates.length === 0) {
      const statesList = [];
      const territoriesList = [];
      for (const [stateName, meta] of Object.entries(US_STATES_CATALOG)) {
        const isTerritory = meta.status === "TERRITORY";
        const entry = {
          name: stateName,
          code: meta.code,
          capital: meta.capital,
          region: meta.region,
          role: meta.role,
          gdpShare: meta.gdpShare,
          popShare: meta.popShare,
          status: isTerritory ? "TERRITORY" : "STATE",
        };
        if (isTerritory) territoriesList.push(entry);
        else statesList.push(entry);
      }
      usaNation.constituentStates = statesList;
      usaNation.unincorporatedTerritories = territoriesList;
    }
  }

  if (!state.territoryMap) {
    state.territoryMap = { "United States of America": "usa", "United States": "usa" };
    for (const stateName of Object.keys(US_STATES_CATALOG)) {
      state.territoryMap[stateName] = "usa";
    }
  }
}

/**
 * Recalculates the United States macroeconomic model in place and returns the enriched state.
 */
export function evaluateSimulation(state) {
  ensureUsaState(state);
  const strictSheetQuirks = Boolean(state.strictSheetQuirks);

  // 1. Build Sector Lookup
  const sectorMap = new Map();
  for (const s of state.sectorsConfig || []) {
    sectorMap.set(s.name, s);
  }

  // 2. Resolve dynamic Production Methods based on unlocked Tech Eras
  const unlockedEras = new Set(
    (state.techEras || []).filter((e) => e.unlocked).map((e) => e.name)
  );
  const dynamicToolInputs = TECH_ERA_TO_TOOL_INPUT.filter((m) =>
    unlockedEras.has(m.eraName)
  ).map((m) => m.goodName);

  const goodsMap = new Map();
  for (const g of state.goodsCatalog || []) {
    const inputs =
      g.name === "Tools" && dynamicToolInputs.length > 0
        ? dynamicToolInputs
        : g.inputs || [];
    goodsMap.set(g.name, {
      ...g,
      activeInputs: inputs,
    });
  }

  // 3. Build Political Party Lookup
  const partyMap = new Map();
  for (const p of state.politicalParties || []) {
    partyMap.set(p.name, p);
  }
  const defaultParty = state.politicalParties?.[0] || {
    name: "Democratic",
    incomeTaxPreference: 0.25,
    salesTaxPreference: 0.06,
    corporateTaxRate: 0.21,
    workerShareOfGdp: 0.52,
    budgetAsPercentOfGdp: 0.20,
    localCrimePolicy: "Beat Cops",
    healthcarePolicy: "Private Healthcare",
  };

  // 4. Precompute Unit DVGP multipliers across the goods catalog using Leontief input-output matrix
  const commodityBenchmarks = COMMODITY_PRICE_BENCHMARKS;
  const intermediateShare = 0.45;
  const unitDvgpMap = new Map();
  for (const g of state.goodsCatalog || []) {
    const b = commodityBenchmarks[g.name];
    unitDvgpMap.set(g.name, b ? b.input_output_anchor : (g.basePrice || 350));
  }
  for (let pass = 0; pass < 5; pass++) {
    for (const g of state.goodsCatalog || []) {
      const b = commodityBenchmarks[g.name];
      const baseAnchor = b ? b.input_output_anchor : (g.basePrice || 350);
      const inputs = goodsMap.get(g.name)?.activeInputs || [];
      if (inputs.length === 0) {
        unitDvgpMap.set(g.name, baseAnchor);
      } else {
        let sum = 0;
        for (const inpName of inputs) {
          sum += unitDvgpMap.get(inpName) || baseAnchor;
        }
        const avgInput = sum / inputs.length;
        const newCost = (1 - intermediateShare) * baseAnchor + intermediateShare * avgInput;
        unitDvgpMap.set(g.name, newCost);
      }
    }
  }

  // 5. Compute DVGP & Adjusted Domestic Price for the Nation's Market
  const nationMarketMap = new Map();

  for (let idx = 0; idx < (state.nations || []).length; idx++) {
    const nation = state.nations[idx];
    const rawScaler = Number(nation.kFactorScaler) || 1500;
    const kScaler = rawScaler / 1500;
    const mMap = new Map();

    const existingMarket = new Map(
      (nation.market || []).map((m) => [m.goodName, m])
    );

    for (const g of state.goodsCatalog || []) {
      const ex = existingMarket.get(g.name) || {};
      const gInfo = goodsMap.get(g.name);
      const secCfg = sectorMap.get(g.sector);
      const secBonus = secCfg ? 1 + (Number(secCfg.kFactorBonus) || 0) * 0.15 : 1.0;
      const dvgp = (unitDvgpMap.get(g.name) ?? 350) * kScaler * secBonus;
      const ddMultiplier =
        ex.ddMultiplier !== undefined ? Number(ex.ddMultiplier) : 1.0;
      const exportTariffRate =
        ex.exportTariffRate !== undefined ? Number(ex.exportTariffRate) : 0.0;
      const adjustedPrice = dvgp * ddMultiplier;
      const postExportPrice = (1 + exportTariffRate) * adjustedPrice;

      mMap.set(g.name, {
        goodName: g.name,
        category: g.sector,
        era: g.era,
        goodType: g.goodType,
        productionMethod: (gInfo?.activeInputs || []).join(", "),
        inputsList: gInfo?.activeInputs || [],
        hype: ex.hype !== undefined ? Number(ex.hype) : 50,
        ddMultiplier,
        exportTariffRate,
        importTariffRate:
          ex.importTariffRate !== undefined ? Number(ex.importTariffRate) : 0.05,
        illegal: Boolean(ex.illegal),
        freightDelayFriction:
          ex.freightDelayFriction !== undefined
            ? Number(ex.freightDelayFriction)
            : nation.freightDelayFriction !== undefined
            ? Number(nation.freightDelayFriction)
            : 1.0,
        dvgp,
        adjustedPrice,
        postExportPrice,
      });
    }

    nationMarketMap.set(nation.id, mMap);
  }

  // 6. Benchmark World Reference Price (AMEP) for Trade Calculations
  const globalMarket = [];
  for (const g of state.goodsCatalog || []) {
    const benchmarkPrice = unitDvgpMap.get(g.name) ?? (g.basePrice || 350);
    globalMarket.push({
      goodName: g.name,
      category: g.sector,
      era: g.era,
      goodType: g.goodType,
      amep: benchmarkPrice,
    });
  }
  const globalPriceMap = new Map(globalMarket.map((gm) => [gm.goodName, gm.amep]));

  const WORKER_PRODUCTIVITY_SCALER = 344.9;

  // 7. Complete Nation Market & Macroeconomic Indicators
  for (let idx = 0; idx < (state.nations || []).length; idx++) {
    const nation = state.nations[idx];
    const mMap = nationMarketMap.get(nation.id);

    const nationWorkingPops = Math.max(
      100000,
      Number(nation.workingPops) || Number(nation.rawPops) || Number(nation.population) || 168000000
    );
    const hasCompanies = Array.isArray(nation.companies) && nation.companies.length > 0;

    let totalEmployed = 0;
    let numberOfCriminals = 0;
    const sectorVgp = {
      "Agricultural Sector GDP": 0,
      "Industry & Manufacturing GDP": 0,
      "Hospitality & Tourist Services GDP": 0,
      "Office & Corporate Services GDP": 0,
    };
    const sectorEmp = {
      "Agricultural Sector GDP": 0,
      "Industry & Manufacturing GDP": 0,
      "Hospitality & Tourist Services GDP": 0,
      "Office & Corporate Services GDP": 0,
    };
    let totalExportTariffRevenues = 0;
    let totalImportTariffRevenues = 0;
    let totalExportsValue = 0;
    let totalImportsValue = 0;

    const sellOrdersByGood = new Map();

    if (hasCompanies) {
      for (const comp of nation.companies) {
        const gName = comp.flagshipGood || "Machine Tools & Machinery";
        const mRow = mMap.get(gName);
        if (mRow) {
          comp.gdpSector = mRow.category;
          comp.productionMethod = mRow.productionMethod;
          comp.illegal = Boolean(mRow.illegal);
        }
        const emp = Math.max(0, Number(comp.employedPops) || Number(comp.employees) || 0);
        sellOrdersByGood.set(gName, (sellOrdersByGood.get(gName) || 0) + emp);
      }
    } else {
      const totalBaseEmp = nationWorkingPops * 0.955;
      const sectorWeights = {
        "Agricultural Sector GDP": 0.08,
        "Industry & Manufacturing GDP": 0.42,
        "Hospitality & Tourist Services GDP": 0.14,
        "Office & Corporate Services GDP": 0.36,
      };

      const sectorGoodsCounts = {};
      for (const mRow of mMap.values()) {
        const sec = mRow.category || "Industry & Manufacturing GDP";
        sectorGoodsCounts[sec] = (sectorGoodsCounts[sec] || 0) + 1;
      }

      for (const [gName, mRow] of mMap.entries()) {
        const sec = mRow.category || "Industry & Manufacturing GDP";
        const secWeight = sectorWeights[sec] || 0.25;
        const countInSec = Math.max(1, sectorGoodsCounts[sec] || 1);
        const empForGood = Math.round((totalBaseEmp * secWeight) / countInSec);
        sellOrdersByGood.set(gName, empForGood);
      }
    }

    for (const [gName, mRow] of mMap.entries()) {
      const globalPrice = globalPriceMap.get(gName) || mRow.adjustedPrice;
      mRow.globalPrice = globalPrice;
      mRow.postImportPrice = globalPrice * (1 + mRow.importTariffRate);
      mRow.localPrice = Math.min(mRow.postImportPrice, mRow.adjustedPrice);
      mRow.sellOrders = sellOrdersByGood.get(gName) || 0;
    }

    const rawDemandByInput = new Map();
    for (const mRow of mMap.values()) {
      if (mRow.sellOrders > 0) {
        for (const inp of mRow.inputsList) {
          rawDemandByInput.set(inp, (rawDemandByInput.get(inp) || 0) + mRow.sellOrders);
        }
      }
    }

    for (const [gName, mRow] of mMap.entries()) {
      const rawInputDemand = rawDemandByInput.get(gName) || 0;
      mRow.receivedFromGlobalMarket = rawInputDemand > 0;
      mRow.importOrdersNeeded = Math.max(
        0,
        rawInputDemand * (1 - mRow.importTariffRate * mRow.ddMultiplier)
      );
      mRow.netBalanceOfGoods =
        mRow.importOrdersNeeded > 0
          ? (mRow.sellOrders - mRow.importOrdersNeeded) / mRow.importOrdersNeeded
          : 0;
      mRow.tbpf =
        mRow.globalPrice > 0
          ? ((mRow.globalPrice - mRow.adjustedPrice) / mRow.globalPrice) *
            mRow.ddMultiplier *
            mRow.netBalanceOfGoods
          : 0;
      mRow.importedFromGlobalMarket = Math.max(
        0,
        mRow.importOrdersNeeded * mRow.postImportPrice * WORKER_PRODUCTIVITY_SCALER
      );
      mRow.importTariffRevenues = mRow.importTariffRate * mRow.importedFromGlobalMarket;
    }

    const vgpByGood = new Map();
    const specInd = nation.specializedIndustry || "No Specialization";

    if (hasCompanies) {
      for (const comp of nation.companies) {
        const mRow = mMap.get(comp.flagshipGood);
        const localPrice = mRow ? mRow.localPrice : 350;
        const emp = Math.max(0, Number(comp.employedPops) || Number(comp.employees) || 0);
        comp.vgp = emp * localPrice * WORKER_PRODUCTIVITY_SCALER;
        comp.valuation = comp.vgp * (comp.hypeFactor || 50);
        totalEmployed += emp;
        if (comp.illegal) numberOfCriminals += emp;
        const sec = comp.gdpSector || "Industry & Manufacturing GDP";
        if (sectorVgp[sec] !== undefined) {
          sectorVgp[sec] += comp.vgp;
          sectorEmp[sec] += emp;
        } else {
          sectorVgp["Industry & Manufacturing GDP"] += comp.vgp;
          sectorEmp["Industry & Manufacturing GDP"] += emp;
        }
      }
    } else {
      for (const [gName, mRow] of mMap.entries()) {
        const emp = sellOrdersByGood.get(gName) || 0;
        const localPrice = mRow.localPrice || 350;
        const sec = mRow.category || "Industry & Manufacturing GDP";
        const specMult =
          specInd === "No Specialization"
            ? 1.0
            : sec === specInd
            ? 1.25
            : 0.95;

        const goodVgp = emp * localPrice * WORKER_PRODUCTIVITY_SCALER * specMult;
        vgpByGood.set(gName, goodVgp);

        if (sectorVgp[sec] !== undefined) {
          sectorVgp[sec] += goodVgp;
          sectorEmp[sec] += emp;
        } else {
          sectorVgp["Industry & Manufacturing GDP"] += goodVgp;
          sectorEmp["Industry & Manufacturing GDP"] += emp;
        }
        totalEmployed += emp;
        if (mRow.illegal) {
          numberOfCriminals += emp;
        }
      }
    }

    for (const [gName, mRow] of mMap.entries()) {
      const goodTotalVgp = vgpByGood.get(gName) || 0;
      mRow.exportedToGlobalMarket = goodTotalVgp * (1 - mRow.exportTariffRate);
      mRow.exportTariffRevenues = mRow.exportedToGlobalMarket * mRow.exportTariffRate;
      totalExportTariffRevenues += mRow.exportTariffRevenues;
      totalImportTariffRevenues += mRow.importTariffRevenues;
      totalExportsValue += mRow.exportedToGlobalMarket;
      totalImportsValue += mRow.importedFromGlobalMarket;
    }

    nation.marketComputed = Array.from(mMap.values());

    const party = resolvePoliticalParty(state.politicalParties, nation.rulingParty);

    const incomeTax =
      nation.incomeTaxOverride !== undefined && nation.incomeTaxOverride !== null
        ? Number(nation.incomeTaxOverride)
        : Number(party.incomeTaxPreference ?? 0.28);
    const salesTax =
      nation.salesTaxOverride !== undefined && nation.salesTaxOverride !== null
        ? Number(nation.salesTaxOverride)
        : Number(party.salesTaxPreference ?? 0.06);
    const corporateTax =
      nation.corporateTaxOverride !== undefined && nation.corporateTaxOverride !== null
        ? Number(nation.corporateTaxOverride)
        : Number(party.corporateTaxRate ?? 0.25);
    const workerShareOfGdp =
      nation.workerShareOverride !== undefined && nation.workerShareOverride !== null
        ? Number(nation.workerShareOverride)
        : Number(party.workerShareOfGdp ?? 0.55);
    const taxDistributionMode = Math.max(
      0.10,
      Math.min(
        0.90,
        nation.taxDistributionMode !== undefined && nation.taxDistributionMode !== null
          ? Number(nation.taxDistributionMode)
          : Number(party.taxDistributionMode ?? 0.62)
      )
    );

    // Pre-compute policy progression (using prior inflation/unemployment estimates for macro sentiment nudge)
    const estInflation = Number(nation.computed?.inflationRate ?? 0.024);
    const estUnemployment = Number(nation.computed?.unemploymentRate ?? 0.045);
    const policyProgression = computePolicyProgression(
      nation,
      party,
      estInflation,
      estUnemployment,
      taxDistributionMode
    );

    const stateBudgetPercent =
      nation.budgetPercentOverride !== undefined && nation.budgetPercentOverride !== null
        ? Number(nation.budgetPercentOverride)
        : Math.max(
            0.06,
            Math.min(0.60, Number(party.budgetAsPercentOfGdp ?? 0.22) + policyProgression.policyBudgetAdjustmentPct)
          );
    const infrastructureInvestmentShare = Number(party.infrastructureInvestmentShare ?? 0.038);
    const educationGovernanceShare = Number(party.educationGovernanceShare ?? 0.055);
    const deficitTargetAsPercentOfGdp = Number(party.deficitTargetAsPercentOfGdp ?? -0.032);

    const rawLitVal = Number(nation.literacyRate);
    const literacyRate = Math.min(
      1,
      Math.max(
        0.05,
        Number.isFinite(rawLitVal) && rawLitVal > 0
          ? rawLitVal > 1
            ? rawLitVal / 100
            : rawLitVal
          : 0.92
      )
    );
    const rawUrbVal = Number(nation.urbanisationIndex);
    const urbanisationIndex = Math.min(
      1,
      Math.max(
        0.05,
        Number.isFinite(rawUrbVal) && rawUrbVal > 0
          ? rawUrbVal > 1
            ? rawUrbVal / 100
            : rawUrbVal
          : 0.83
      )
    );
    const rawInfraVal = Number(nation.infrastructureEfficiency);
    const infrastructureEfficiency = Math.min(
      1,
      Math.max(
        0.05,
        Number.isFinite(rawInfraVal) && rawInfraVal > 0
          ? rawInfraVal > 1
            ? rawInfraVal / 100
            : rawInfraVal
          : 0.82
      )
    );
    const consumerSentiment = Math.max(
      1,
      nation.consumerSentiment !== undefined && nation.consumerSentiment !== null
        ? Math.max(1, Number(nation.consumerSentiment))
        : 65
    );
    const centralBankRate = Number(nation.centralBankRate ?? 0.045);
    const freightDelayFriction = Math.max(0, Number(nation.freightDelayFriction) || 0);
    const kFactorVal = Math.max(400, Number(nation.kFactorScaler) || 1500);
    const equalityDrift = Number(nation.equalityDrift) || 0;

    // --- Bell-Curve Tax Burden Incidence Model ---
    const bellCurveTax = computeBellCurveTaxIncidence(
      taxDistributionMode,
      incomeTax,
      salesTax,
      corporateTax
    );

    // Pre-pass Income Equality Index & High-Governance Maluses before AD & Fiscal settlement
    const prelimLitExcess = Math.max(0, literacyRate - 0.94);
    const prelimKExcess = Math.max(0, kFactorVal - 1800) / 1000;
    const prelimAutomationGini = prelimKExcess > 0 ? Number((prelimKExcess * 0.045).toFixed(4)) : 0;

    // Inequality / Gini Coefficient driven by Labor Share, Bell-Curve Tax Mode, Sales/Corp Taxes & Equality Drift
    const rawGini =
      0.385 -
      (workerShareOfGdp - 0.55) * 0.28 -
      (bellCurveTax.progressivitySpread - 0.26) * 0.16 -
      (incomeTax - 0.28) * 0.10 -
      (corporateTax - 0.25) * 0.08 +
      (salesTax - 0.06) * 0.18 +
      prelimAutomationGini -
      equalityDrift;
    const giniCoefficient = Number(Math.min(0.68, Math.max(0.22, rawGini)).toFixed(3));
    const incomeEqualityIndex = Number((1 - giniCoefficient).toFixed(4));

    // Full Governance Qualitative Diagnostics & High-Level Structural Maluses
    const governanceDiagnostics = computeGovernanceDiagnostics({
      literacyRate,
      infrastructureEfficiency,
      urbanisationIndex,
      consumerSentiment,
      kFactorScaler: kFactorVal,
      incomeEqualityIndex,
    });
    const malusTotals = governanceDiagnostics.totals;

    // --- Core Aggregate Demand (AD = C + I + G + NX) Determination ---
    // Potential Supply-Side GDP from 60-good Leontief Input-Output Network
    const baseSupplyGdp =
      sectorVgp["Agricultural Sector GDP"] +
      sectorVgp["Industry & Manufacturing GDP"] +
      sectorVgp["Hospitality & Tourist Services GDP"] +
      sectorVgp["Office & Corporate Services GDP"];

    // 1. Consumption (C) — Baseline weight 68% of GDP
    // Driven by disposable household labor income s_L*(1 - t_inc)*(1 - t_sales), Bell-Curve MPC Incidence, & Sentiment
    const baselineDispShare = 0.55 * (1 - 0.28) * (1 - 0.06); // 0.37224
    const dispIncomeRatio = (workerShareOfGdp * (1 - incomeTax) * (1 - salesTax)) / baselineDispShare;
    const sentimentRatio = consumerSentiment / 65.0;
    const baseCIdx = 0.42 + 0.36 * dispIncomeRatio + 0.22 * Math.pow(sentimentRatio, 0.42);
    const cIdx = Math.max(
      0.45,
      Math.min(1.75, baseCIdx * bellCurveTax.consumptionMpcMultiplier)
    );
    const cShare = 0.68 * cIdx;

    // 2. Gross Private Domestic Investment (I) — Baseline weight 18% of GDP
    // Driven by after-tax corporate return, Bell-Curve Capital Drag, Fed Rate, Infra, Literacy, Equality & TFP
    const baselineCorpShare = (1 - 0.55) * (1 - 0.25); // 0.3375
    const profitRatio = ((1 - workerShareOfGdp) * (1 - corporateTax)) / baselineCorpShare;
    const rateIdx = 1 - (centralBankRate - 0.045) * 3.2;
    const structIdx =
      1 +
      (infrastructureEfficiency - 0.82) * 0.85 +
      (literacyRate - 0.92) * 0.60 +
      (urbanisationIndex - 0.83) * 0.38 +
      (infrastructureInvestmentShare - 0.038) * 1.4 +
      (educationGovernanceShare - 0.055) * 0.8 -
      freightDelayFriction * 0.45 -
      bellCurveTax.investmentCapexDrag -
      malusTotals.equalityCapitalDrag * 0.12;
    const iIdx = Math.max(
      0.30,
      Math.min(1.90, 0.34 * profitRatio + 0.26 * rateIdx + 0.40 * structIdx)
    );
    const iShare = 0.18 * iIdx;

    // 3. Government Purchases & Autonomous Spending (G) — Baseline weight 17% of GDP
    const gIdx = Math.max(
      0.30,
      Math.min(1.95, 0.30 + 0.70 * (stateBudgetPercent / 0.22) + malusTotals.infraMaintenanceBudgetPct * 1.5)
    );
    const gShare = 0.17 * gIdx;

    // 4. Net Exports (NX = X - M) — Baseline weight -3% of GDP (includes Sentiment Overheating Import Leakage)
    let avgImportTariff = 0;
    let avgExportTariff = 0;
    if (mMap.size > 0) {
      for (const mRow of mMap.values()) {
        avgImportTariff += Number(mRow.importTariffRate) || 0;
        avgExportTariff += Number(mRow.exportTariffRate) || 0;
      }
      avgImportTariff /= mMap.size;
      avgExportTariff /= mMap.size;
    }
    const nxShare = Math.max(
      -0.20,
      Math.min(
        0.15,
        -0.03 +
          (infrastructureEfficiency - 0.82) * 0.10 -
          avgExportTariff * 0.25 -
          Math.max(0, avgImportTariff - 0.04) * 0.12 -
          freightDelayFriction * 0.12 -
          malusTotals.sentimentImportLeakage
      )
    );

    // Aggregate Demand Multiplier = C_share + I_share + G_share + NX_share (1.0000 at baseline)
    const adMultiplier = Math.max(0.40, Math.min(2.25, cShare + iShare + gShare + nxShare));
    const cumulativeGrowthFactor = Math.max(
      0.20,
      Number.isFinite(Number(nation.cumulativeGrowthFactor)) && Number(nation.cumulativeGrowthFactor) > 0
        ? Number(nation.cumulativeGrowthFactor)
        : 1.0
    );
    const totalMacroScale = adMultiplier * cumulativeGrowthFactor;

    const agriculturalGdp = sectorVgp["Agricultural Sector GDP"] * totalMacroScale;
    const industryGdp = sectorVgp["Industry & Manufacturing GDP"] * totalMacroScale;
    const hospitalityGdp = sectorVgp["Hospitality & Tourist Services GDP"] * totalMacroScale;
    const officeGdp = sectorVgp["Office & Corporate Services GDP"] * totalMacroScale;
    const aggregateGdp = agriculturalGdp + industryGdp + hospitalityGdp + officeGdp;

    // Exact Dollar Aggregate Demand Identity: Y = C + I + G + NX
    const consumptionDollar = aggregateGdp * (cShare / adMultiplier);
    const investmentDollar = aggregateGdp * (iShare / adMultiplier);
    const governmentDollar = aggregateGdp * (gShare / adMultiplier);
    const netExportsDollar = aggregateGdp - (consumptionDollar + investmentDollar + governmentDollar);

    const aggregateDemand = {
      consumption: consumptionDollar,
      investment: investmentDollar,
      governmentSpending: governmentDollar,
      netExports: netExportsDollar,
      consumptionShare: Number(((cShare / adMultiplier) * 100).toFixed(2)),
      investmentShare: Number(((iShare / adMultiplier) * 100).toFixed(2)),
      governmentShare: Number(((gShare / adMultiplier) * 100).toFixed(2)),
      netExportsShare: Number(((nxShare / adMultiplier) * 100).toFixed(2)),
      cIdx: Number(cIdx.toFixed(4)),
      iIdx: Number(iIdx.toFixed(4)),
      gIdx: Number(gIdx.toFixed(4)),
      nxShare: Number(nxShare.toFixed(4)),
      adMultiplier: Number(adMultiplier.toFixed(4)),
      cumulativeGrowthFactor: Number(cumulativeGrowthFactor.toFixed(6)),
    };

    const rawWorkingPops =
      Number(nation.workingPops) || Number(nation.rawPops) || Number(nation.population) || 168000000;
    const effectiveWorkingPops =
      !strictSheetQuirks && rawWorkingPops < totalEmployed
        ? Math.round(totalEmployed * 1.045)
        : rawWorkingPops;

    const baseUnemploymentRate =
      effectiveWorkingPops > 0
        ? Math.max(0, Math.min(1, 1 - totalEmployed / effectiveWorkingPops))
        : 0;
    // Include High-Governance Structural Maluses (graduate mismatch + AI/automation displacement)
    const structuralMalusUnemp =
      totalEmployed > 0 && effectiveWorkingPops > 1000000
        ? malusTotals.totalMalusUnemploymentBonus
        : 0;
    const unemploymentRate = Math.max(
      0,
      Math.min(1, Number((baseUnemploymentRate + structuralMalusUnemp).toFixed(4)))
    );

    const crimePolicy = nation.crimePolicy || party.localCrimePolicy || "Beat Cops";
    const healthcarePolicy =
      nation.healthcarePolicy || party.healthcarePolicy || "Private Healthcare";

    const crimeRate =
      totalEmployed > 0
        ? (numberOfCriminals / totalEmployed) * getCrimePolicyMultiplier(crimePolicy)
        : 0;

    const quarterlyWages = Math.max(
      0,
      ((aggregateGdp * workerShareOfGdp) / Math.max(1, effectiveWorkingPops)) *
        (1 - incomeTax)
    );

    // Calibrated Quarterly Demographic Rates (preventing runaway population doubling)
    const mortalityRate = Math.max(
      0.0005,
      Math.min(0.008, (crimeRate * urbanisationIndex) * 0.02 + getHealthcareMortalityBase(healthcarePolicy) * 0.22)
    );

    const wageRatio = Math.max(0.001, quarterlyWages > 0 ? quarterlyWages / consumerSentiment : 0.01);
    const rawSolBase =
      literacyRate + urbanisationIndex - (crimeRate + mortalityRate) + Math.log(wageRatio);
    const solBase = Number.isFinite(rawSolBase) ? rawSolBase : 15.0;
    const fertilityRate = Math.max(
      0.0005,
      Math.min(0.006, 0.0028 * (1.15 - literacyRate * 0.3) * Math.max(0.5, Math.min(1.3, solBase / 10)))
    );
    const rawSol = nation.highImmigration ? solBase : solBase - fertilityRate;
    const sol = Math.max(1.0, Math.min(50.0, Number.isFinite(rawSol) ? rawSol : 15.0));

    const netImmigrationRate = Math.max(
      -0.003,
      Math.min(
        0.006,
        (nation.highImmigration ? 0.00018 : 0.00004) * sol * urbanisationIndex - crimeRate * 0.015
      )
    );
    // Quarterly population growth (~0.19% per quarter = ~0.76% annualized at US baseline)
    const popGrowthRate = Math.max(-0.01, Math.min(0.012, fertilityRate + netImmigrationRate - mortalityRate));

    const quarterlyGdp = aggregateGdp / 4;
    const incomeTaxRevenue = (quarterlyWages * effectiveWorkingPops * incomeTax) / 4;
    const salesTaxRevenue = (consumptionDollar / 4) * salesTax * 0.65;
    const corporateTaxRevenue = quarterlyGdp * (1 - workerShareOfGdp) * corporateTax * 0.35;
    const scaledImportTariffRevenues = totalImportTariffRevenues / 24;
    const scaledExportTariffRevenues = totalExportTariffRevenues / 24;
    const tariffRevenues = scaledExportTariffRevenues + scaledImportTariffRevenues;

    const stateIncome =
      nation.stateIncome !== undefined
        ? Number(nation.stateIncome)
        : corporateTaxRevenue + salesTaxRevenue + incomeTaxRevenue + tariffRevenues;

    const federalCooperativity = Number(nation.federalCooperativity) || 0;
    const stateContributions =
      nation.stateContributions !== undefined
        ? Number(nation.stateContributions)
        : stateIncome * federalCooperativity;

    const hasBudgetOverride =
      nation.budgetPercentOverride !== undefined && nation.budgetPercentOverride !== null;
    const desiredFiscalBalancePct =
      deficitTargetAsPercentOfGdp - policyProgression.policyBudgetAdjustmentPct;
    const baselineTariffAnchor = quarterlyGdp * 0.015;
    const expectedBaselineIncome =
      incomeTaxRevenue + salesTaxRevenue + corporateTaxRevenue + baselineTariffAnchor;
    const infraMaintenanceOutlay = quarterlyGdp * malusTotals.infraMaintenanceBudgetPct;
    const plannedQuarterlyOutlays = Math.max(
      quarterlyGdp * 0.08,
      expectedBaselineIncome * (1 - 0.5 * federalCooperativity) -
        desiredFiscalBalancePct * quarterlyGdp +
        infraMaintenanceOutlay
    );

    const stateExpenditures =
      nation.stateExpenditures !== undefined
        ? Number(nation.stateExpenditures)
        : hasBudgetOverride
          ? stateBudgetPercent * quarterlyGdp + infraMaintenanceOutlay + stateContributions
          : plannedQuarterlyOutlays + stateContributions;
    const diplomaticExpenses = Number(nation.diplomaticExpenses) || 0;
    const federalContributions = stateContributions * 0.5;
    const netBudgetBalance =
      stateIncome + federalContributions - stateExpenditures + diplomaticExpenses;
    const fiscalBalancePctOfGdp =
      quarterlyGdp > 0 ? netBudgetBalance / quarterlyGdp : 0;
    const netTradeBalance = totalExportsValue - totalImportsValue;

    // Elastic Multi-Channel Inflation (AD demand-pull + fiscal impulse + monetary brake + bottlenecks + TFP + Phillips + maluses)
    const adDemandPull = (adMultiplier - 1.0) * 0.24;
    const fiscalImpulse = Math.max(-0.025, Math.min(0.06, (-fiscalBalancePctOfGdp - 0.025) * 0.20));
    const monetaryBrake = (centralBankRate - 0.045) * 0.45;
    const supplyBottleneck = (0.82 - infrastructureEfficiency) * 0.16;
    const tfpCostPush = ((1500 - kFactorVal) / 1500) * 0.038;
    const phillipsCurve = (0.048 - unemploymentRate) * 0.20;
    const tariffPassThrough = (avgImportTariff - 0.05) * 0.25;
    const malusCPI =
      malusTotals.urbanOvercrowdingInflation + malusTotals.sentimentOverheatingInflation;
    const baseInflation =
      0.023 +
      adDemandPull +
      fiscalImpulse -
      monetaryBrake +
      supplyBottleneck +
      tfpCostPush +
      phillipsCurve +
      tariffPassThrough +
      malusCPI;
    const inflationRate = Math.max(-0.02, Math.min(0.28, Number(baseInflation.toFixed(4))));

    const lowIncomePops = Math.round(effectiveWorkingPops * 0.45);
    const middleClassPops = Math.round(effectiveWorkingPops * 0.45);
    const upperClassPops = Math.max(1, effectiveWorkingPops - lowIncomePops - middleClassPops);

    const tauL = bellCurveTax.cohortTaxBurdens.lowIncome;
    const tauM = bellCurveTax.cohortTaxBurdens.middleClass;
    const tauU = bellCurveTax.cohortTaxBurdens.upperClass;
    const refTauL = bellCurveTax.baselineTaxBurdens.lowIncome;
    const refTauM = bellCurveTax.baselineTaxBurdens.middleClass;
    const refTauU = bellCurveTax.baselineTaxBurdens.upperClass;

    // Pre-tax cohort income scales respond to worker share & bell-curve tax incidence
    const preTaxWageAnchor = Math.max(
      1200,
      quarterlyWages / Math.max(0.25, 1 - incomeTax)
    );
    const lowNetFactor = Math.max(0.45, (1 - tauL) / Math.max(0.25, 1 - refTauL));
    const midNetFactor = Math.max(0.45, (1 - tauM) / Math.max(0.25, 1 - refTauM));
    const upNetFactor = Math.max(0.45, (1 - tauU) / Math.max(0.25, 1 - refTauU));

    const lowWage = Math.round(preTaxWageAnchor * 0.48 * (1 - tauL));
    const midWage = Math.round(preTaxWageAnchor * 1.15 * (1 - tauM) * (1 + (prelimLitExcess > 0 ? 0.04 : 0)));
    const upWage = Math.round(preTaxWageAnchor * 2.85 * (1 - tauU) * (1 + preliminCapitalSkew(workerShareOfGdp, kFactorVal)));

    const cohorts = {
      lowIncome: {
        name: "Low-Income & Labor Cohort",
        popShare: 0.45,
        pops: lowIncomePops,
        averageWage: lowWage,
        livingStandard: Number(Math.max(1.0, Math.min(50.0, sol * 0.68 * lowNetFactor)).toFixed(1)),
        taxBurden: Number(tauL.toFixed(4)),
        unemploymentRate: Number(Math.min(1.0, unemploymentRate * 1.45).toFixed(4)),
        povertyRate: Number(Math.max(0.02, Math.min(0.65, (1.0 - (sol * lowNetFactor) / 30) * 0.48)).toFixed(3)),
      },
      middleClass: {
        name: "Middle Class & Technical Cohort",
        popShare: 0.45,
        pops: middleClassPops,
        averageWage: midWage,
        livingStandard: Number(Math.max(1.0, Math.min(50.0, sol * 1.12 * midNetFactor)).toFixed(1)),
        taxBurden: Number(tauM.toFixed(4)),
        unemploymentRate: Number(Math.max(0, unemploymentRate * 0.8 + prelimLitExcess * 0.35).toFixed(4)),
        homeOwnershipRate: Number(Math.min(0.85, Math.max(0.30, 0.45 + sol * 0.01 - malusTotals.urbanOvercrowdingInflation * 2.5)).toFixed(2)),
      },
      upperClass: {
        name: "Capital & Ownership Cohort",
        popShare: 0.10,
        pops: upperClassPops,
        averageWage: upWage,
        livingStandard: Number(Math.max(1.0, Math.min(50.0, sol * 1.85 * upNetFactor)).toFixed(1)),
        taxBurden: Number(tauU.toFixed(4)),
        unemploymentRate: Number(Math.max(0, unemploymentRate * 0.3).toFixed(4)),
        capitalIncomeShare: Number(Math.min(0.75, 0.35 + (1 - workerShareOfGdp) * 0.4).toFixed(2)),
      },
    };

    const povertyRate = Number(Math.max(0.025, Math.min(0.60, (26 - sol * lowNetFactor) / 55)).toFixed(3));
    const institutionalTrust = Number(
      Math.max(
        0.1,
        Math.min(0.95, 0.78 - Math.max(0, inflationRate - 0.04) * 1.8 - unemploymentRate * 0.7 + (incomeEqualityIndex - 0.60) * 0.35)
      ).toFixed(2)
    );
    const socialCohesion = Number(
      Math.max(0.1, Math.min(0.95, 0.88 - unemploymentRate * 0.8 - (giniCoefficient - 0.35) * 0.9)).toFixed(2)
    );

    const servicesEvaluation = evaluateServicesProduction({
      endowment: {
        humanCapitalIndex: Math.round(literacyRate * 92),
        urbanAgglomerationIndex: Math.round(urbanisationIndex * 100),
        financialDepthIndex: 92,
        digitalConnectivityIndex: 88,
        consumerAmenityIndex: 82,
      },
      employedLabor: Math.round(totalEmployed * 0.76),
      baseWage: quarterlyWages * 4 || 64000,
      sol,
      crimeRate,
    });

    nation.computed = {
      agriculturalGdp,
      industryGdp,
      hospitalityGdp,
      officeGdp,
      aggregateGdp,
      totalEmployed,
      effectiveWorkingPops,
      numberOfCriminals,
      unemploymentRate,
      underemploymentRate: malusTotals.underemploymentRate,
      quarterlyWages,
      consumerConfidence: consumerSentiment,
      sol,
      literacyRate,
      crimeRate,
      urbanisationIndex,
      mortalityRate,
      fertilityRate,
      netImmigrationRate,
      popGrowthRate,
      infrastructureEfficiency,
      inflationRate,
      giniCoefficient,
      incomeEqualityIndex,
      povertyRate,
      institutionalTrust,
      socialCohesion,
      cohorts,
      incomeTax,
      incomeTaxRevenue,
      salesTax,
      salesTaxRevenue,
      corporateTax,
      corporateTaxRevenue,
      workerShareOfGdp,
      taxDistributionMode,
      bellCurveTaxIncidence: bellCurveTax,
      governanceDiagnostics,
      stateBudgetPercent,
      govtDividends: 0,
      tariffRevenues,
      importTariffRevenues: scaledImportTariffRevenues,
      exportTariffRevenues: scaledExportTariffRevenues,
      totalExportTariffRevenues: scaledExportTariffRevenues,
      totalImportTariffRevenues: scaledImportTariffRevenues,
      totalExportsValue,
      totalImportsValue,
      netTradeBalance,
      stateIncome,
      stateContributions,
      federalContributions,
      stateExpenditure: stateExpenditures,
      stateExpenditures,
      diplomaticExpenses,
      netBudgetBalance,
      fiscalBalancePctOfGdp,
      fiscalBalanceAnnualized: netBudgetBalance * 4,
      partyPreferences: {
        name: party.name,
        politicalAlignment: party.politicalAlignment || "",
        platformSummary: party.platformSummary || "",
        incomeTaxPreference: incomeTax,
        corporateTaxRate: corporateTax,
        salesTaxPreference: salesTax,
        workerShareOfGdp,
        taxDistributionMode,
        infrastructureInvestmentShare,
        educationGovernanceShare,
        deficitTargetAsPercentOfGdp,
        budgetAsPercentOfGdp: Number(party.budgetAsPercentOfGdp ?? 0.22),
      },
      policyProgression,
      enactedPolicies: policyProgression.policies,
      startingBaseline: nation.startingBaseline || {
        literacyRate,
        infrastructureEfficiency,
        urbanisationIndex,
        consumerSentiment,
        kFactorScaler: kFactorVal,
        incomeEqualityIndex: 0.615,
        publicDebt:
          nation.publicDebt !== undefined && nation.publicDebt !== null
            ? Number(nation.publicDebt)
            : 34500000000000,
      },
      treasuryBalance: Number(nation.treasuryBalance) || 0,
      publicDebt:
        nation.publicDebt !== undefined && nation.publicDebt !== null
          ? Number(nation.publicDebt)
          : 34500000000000,
      debtToGdpRatio:
        aggregateGdp > 0
          ? ((nation.publicDebt !== undefined && nation.publicDebt !== null
              ? Number(nation.publicDebt)
              : 34500000000000) /
              aggregateGdp) *
            100
          : 0,
      totalValuation: aggregateGdp * 1.8,
      averageCompanyGrowth: 0.025,
      crimePolicy,
      healthcarePolicy,
      servicesEvaluation,
      aggregateDemand,
      annualRealGdpGrowth: 0,
    };
    const fc = computeGdpForecast(nation, state);
    nation.computed.forecast = fc;
    nation.computed.annualRealGdpGrowth = fc.finalGrowth;
  }

  if (state.timeManager) {
    const tm = state.timeManager;
    const startStr = tm.crisisStartDate || "2025-01-01";
    const currStr = tm.crisisDate || startStr;
    const nextPayStr = tm.nextPaymentDate || addDaysToSimDate(startStr, 90);

    const daysElapsed = Math.max(0, diffSimDays(currStr, startStr));
    const dateDiff = diffSimDays(nextPayStr, currStr);

    tm.daysElapsed = Number(daysElapsed.toFixed(2));
    tm.quarterNumber = Math.max(1, Math.round(1 + daysElapsed / 90));
    tm.quarter = tm.quarterNumber;
    tm.dateDiff = Number(dateDiff.toFixed(2));
    tm.daysPerMinute = Number(((Number(tm.intervalDaysPerHour) || 90) / 60).toFixed(4));
    if (tm.liveStatus === undefined) {
      tm.liveStatus = tm.isLive ? "TRUE" : "VIRGIN";
    }
  }

  state.globalMarket = globalMarket;
  return state;
}

function preliminCapitalSkew(workerShareOfGdp, kFactorVal) {
  return Math.max(-0.15, (0.55 - workerShareOfGdp) * 0.4 + Math.max(0, (kFactorVal - 1500) / 1500) * 0.12);
}

export function runBudgetAndDividendUpdater(state) {
  evaluateSimulation(state);

  const quarterPlan = [];
  for (const nation of state.nations || []) {
    const c = nation.computed;
    if (!c) continue;

    const fc = computeGdpForecast(nation, state);
    c.forecast = fc;
    const annualGrowthPct = applyForecastGrowth(nation, fc);

    // Quarterly compounding factor from 1-Year GDP Growth Rate: (1 + g_annual / 100)^(1/4)
    const annualMultiplier = Math.max(0.5, 1 + annualGrowthPct / 100);
    const quarterlyTargetMultiplier = Math.pow(annualMultiplier, 0.25);
    const prevAggregateGdp = Number(c.aggregateGdp) || 1;

    const netBudget = Number(c.netBudgetBalance) || 0;
    const prevTreasury = Number(nation.treasuryBalance) || 0;
    const nuevoTreasury = netBudget + prevTreasury;
    nation.treasuryBalance = Number.isNaN(nuevoTreasury) ? 1 : nuevoTreasury;

    const prevDebt =
      nation.publicDebt !== undefined && nation.publicDebt !== null
        ? Number(nation.publicDebt)
        : 34500000000000;
    // Deficit (netBudget < 0) accumulates onto federal debt; surplus (netBudget > 0) amortizes debt
    const nuevoDebt = Math.max(0, prevDebt - netBudget);
    nation.publicDebt = Number.isNaN(nuevoDebt) ? prevDebt : nuevoDebt;

    // Progress good-governance structural metrics based on enacted policy mix & funding tiers
    const party = resolvePoliticalParty(state.politicalParties, nation.rulingParty);
    const prog = computePolicyProgression(
      nation,
      party,
      Number(c.inflationRate ?? 0.024),
      Number(c.unemploymentRate ?? 0.045),
      c.taxDistributionMode
    );
    const currLit = normalizeRateMetric(nation.literacyRate ?? c.literacyRate, 0.92);
    const currInfra = normalizeRateMetric(
      nation.infrastructureEfficiency ?? c.infrastructureEfficiency,
      0.82
    );
    const currUrb = normalizeRateMetric(nation.urbanisationIndex ?? c.urbanisationIndex, 0.83);
    const currSent = Math.max(1, Number(nation.consumerSentiment ?? c.consumerConfidence ?? 65));
    const currKFactor = Math.max(400, Number(nation.kFactorScaler ?? 1500));
    const currEqDrift = Number(nation.equalityDrift) || 0;

    nation.literacyRate = Number(Math.min(0.999, Math.max(0.40, currLit + prog.literacyDelta)).toFixed(4));
    nation.infrastructureEfficiency = Number(
      Math.min(0.999, Math.max(0.35, currInfra + prog.infrastructureDelta)).toFixed(4)
    );
    nation.urbanisationIndex = Number(
      Math.min(0.999, Math.max(0.35, currUrb + prog.urbanisationDelta)).toFixed(4)
    );
    nation.consumerSentiment = Number(
      Math.min(115, Math.max(20, currSent + prog.sentimentDelta)).toFixed(2)
    );
    nation.kFactorScaler = Math.round(Math.min(3500, Math.max(600, currKFactor + prog.tfpDelta)));
    nation.equalityDrift = Number(Math.max(-0.18, Math.min(0.18, currEqDrift + prog.equalityDelta)).toFixed(5));
    nation.enactedPolicies = prog.policies;

    const basePops =
      !state.strictSheetQuirks && nation.workingPops < c.totalEmployed
        ? c.effectiveWorkingPops
        : Number(nation.workingPops) || 168000000;
    const popGrowth = Number(c.popGrowthRate) || 0;
    const rawNuevoPops = basePops * (1 + popGrowth);
    const roundedNuevoPops =
      Number.isNaN(rawNuevoPops) || rawNuevoPops <= 30 ? 1000000 : Math.round(rawNuevoPops);
    nation.workingPops = roundedNuevoPops;

    quarterPlan.push({
      nation,
      prevAggregateGdp,
      quarterlyTargetMultiplier,
    });
  }

  // Re-evaluate post-progression GDP so cumulativeGrowthFactor calibrates cleanly against target growth
  evaluateSimulation(state);
  for (const item of quarterPlan) {
    const postGdp = Number(item.nation.computed?.aggregateGdp) || item.prevAggregateGdp;
    const impliedScaleRatio = postGdp > 0 ? postGdp / item.prevAggregateGdp : 1;
    const prevCumFactor =
      Number.isFinite(Number(item.nation.cumulativeGrowthFactor)) &&
      Number(item.nation.cumulativeGrowthFactor) > 0
        ? Number(item.nation.cumulativeGrowthFactor)
        : 1.0;
    item.nation.cumulativeGrowthFactor =
      prevCumFactor * (item.quarterlyTargetMultiplier / Math.max(0.5, impliedScaleRatio));
  }

  evaluateSimulation(state);
  return state;
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function getDaysInMonth(y, m) {
  if (m === 2 && isLeapYear(y)) return 29;
  return DAYS_IN_MONTH[m - 1] || 30;
}

export function parseSimDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return { year: 2025, month: 1, day: 1 };
  const clean = dateStr.trim().split("T")[0];
  let isNegative = false;
  let rest = clean;
  if (rest.startsWith("-")) {
    isNegative = true;
    rest = rest.slice(1);
  }
  const parts = rest.split("-");
  const yearNum = parseInt(parts[0], 10);
  const year = isNegative ? -yearNum : yearNum;
  const month = parseInt(parts[1] || "1", 10);
  const day = parseInt(parts[2] || "1", 10);
  return {
    year: isNaN(year) ? 2025 : year,
    month: isNaN(month) ? 1 : Math.max(1, Math.min(12, month)),
    day: isNaN(day) ? 1 : Math.max(1, Math.min(31, day)),
  };
}

export function formatSimDate({ year, month, day }) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  if (year < 0) {
    const absY = String(Math.abs(year)).padStart(4, "0");
    return `-${absY}-${m}-${d}`;
  }
  const absY = String(year).padStart(4, "0");
  return `${absY}-${m}-${d}`;
}

export function addDaysToSimDate(dateStr, days) {
  let { year, month, day } = parseSimDate(dateStr);
  day += Math.round(days);
  while (day > getDaysInMonth(year, month)) {
    day -= getDaysInMonth(year, month);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  while (day < 1) {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    day += getDaysInMonth(year, month);
  }
  return formatSimDate({ year, month, day });
}

export function simDateToAbsoluteDays({ year, month, day }) {
  const y = year - 1;
  let days = y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
  for (let m = 1; m < month; m++) {
    days += getDaysInMonth(year, m);
  }
  days += day;
  return days;
}

export function diffSimDays(dateStrA, dateStrB) {
  const dA = simDateToAbsoluteDays(parseSimDate(dateStrA));
  const dB = simDateToAbsoluteDays(parseSimDate(dateStrB));
  return dA - dB;
}

export function advanceSimulationTime(state, daysToAdd = 90) {
  evaluateSimulation(state);

  const tm = state.timeManager;
  const prevDateStr = tm.crisisDate || tm.crisisStartDate || "2025-01-01";
  const targetDateStr = addDaysToSimDate(prevDateStr, daysToAdd);
  tm.crisisDate = targetDateStr;

  let nextPayDateStr = tm.nextPaymentDate || addDaysToSimDate(prevDateStr, 90);

  let quartersCrossed = 0;
  let dateDiff = diffSimDays(nextPayDateStr, targetDateStr);

  while (dateDiff < 3) {
    nextPayDateStr = addDaysToSimDate(nextPayDateStr, 90);
    tm.nextPaymentDate = nextPayDateStr;
    runBudgetAndDividendUpdater(state);
    quartersCrossed++;
    dateDiff = diffSimDays(nextPayDateStr, targetDateStr);
  }

  state.version = (state.version || 0) + 1;
  evaluateSimulation(state);
  return { state, quartersCrossed };
}
