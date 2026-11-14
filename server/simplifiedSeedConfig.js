import { US_STATES_CATALOG } from "../src/data/usStatesData.js";

export const SIMPLIFIED_60_GOODS = [
  // 1-8 Mining & Metals
  { id: 1, name: "Rare Earth Metals", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 2400, inputs: ["Machine Tools & Machinery", "Chemicals & Explosives"] },
  { id: 2, name: "Iron Ore", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 450, inputs: ["Machine Tools & Machinery"] },
  { id: 3, name: "Copper", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 780, inputs: ["Machine Tools & Machinery"] },
  { id: 4, name: "Aluminium", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 920, inputs: ["Machine Tools & Machinery", "Electricity & Grid"] },
  { id: 5, name: "Gold & Precious Metals", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 3800, inputs: ["Machine Tools & Machinery"] },
  { id: 6, name: "Lead & Heavy Metals", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 520, inputs: ["Machine Tools & Machinery"] },
  { id: 7, name: "Lithium & Batteries", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1950, inputs: ["Rare Earth Metals", "Chemicals & Explosives"] },
  { id: 8, name: "Silicon & Quartz", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 850, inputs: ["Machine Tools & Machinery", "Electricity & Grid"] },

  // 9-15 Energy & Fuels
  { id: 9, name: "Coal & Carbon", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 380, inputs: ["Machine Tools & Machinery"] },
  { id: 10, name: "Stone & Minerals", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 280, inputs: ["Machine Tools & Machinery"] },
  { id: 11, name: "Crude Oil", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 950, inputs: ["Machine Tools & Machinery"] },
  { id: 12, name: "Refined Petroleum & Fuels", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1350, inputs: ["Crude Oil", "Chemicals & Explosives"] },
  { id: 13, name: "Natural Gas", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 720, inputs: ["Machine Tools & Machinery"] },
  { id: 14, name: "Uranium & Nuclear", sector: "Industry & Manufacturing GDP", era: "Atomic", basePrice: 4200, inputs: ["Machine Tools & Machinery", "Chemicals & Explosives"] },
  { id: 15, name: "Electricity & Grid", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 650, inputs: ["Coal & Carbon", "Refined Petroleum & Fuels", "Heavy Engines & Turbines"] },

  // 16-27 Agriculture, Food & Livestock
  { id: 16, name: "Water", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 150, inputs: [] },
  { id: 17, name: "Grain", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 320, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 18, name: "Fresh Produce", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 360, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 19, name: "Fruit & Cash Crops", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 480, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 20, name: "Sugar & Confectionery", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 410, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 21, name: "Coffee & Tea", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 560, inputs: ["Water"] },
  { id: 22, name: "Tobacco & Spirits", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 680, inputs: ["Water", "Sugar & Confectionery"] },
  { id: 23, name: "Cotton & Natural Fibres", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 440, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 24, name: "Rubber & Polymers", sector: "Agricultural Sector GDP", era: "Tools", basePrice: 890, inputs: ["Refined Petroleum & Fuels"] },
  { id: 25, name: "Meat & Livestock", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 750, inputs: ["Grain", "Water"] },
  { id: 26, name: "Fisheries & Seafood", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 620, inputs: ["Ships & Marine Vessels"] },
  { id: 27, name: "Dairy Products", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 490, inputs: ["Meat & Livestock"] },

  // 28-36 Heavy Industry, Materials & Metallurgy
  { id: 28, name: "Wood & Timber", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 310, inputs: ["Machine Tools & Machinery"] },
  { id: 29, name: "Paper & Publishing", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 540, inputs: ["Wood & Timber", "Chemicals & Explosives"] },
  { id: 30, name: "Steel & Iron", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1100, inputs: ["Iron Ore", "Coal & Carbon"] },
  { id: 31, name: "Construction Materials", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 680, inputs: ["Stone & Minerals", "Steel & Iron", "Wood & Timber"] },
  { id: 32, name: "Glass & Ceramics", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 510, inputs: ["Silicon & Quartz", "Coal & Carbon"] },
  { id: 33, name: "Industrial Hardware & Pipes", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 840, inputs: ["Steel & Iron", "Copper"] },
  { id: 34, name: "Plastics & Synthetics", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 970, inputs: ["Refined Petroleum & Fuels", "Chemicals & Explosives"] },
  { id: 35, name: "Machine Tools & Machinery", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1650, inputs: ["Steel & Iron", "Industrial Hardware & Pipes"] },
  { id: 36, name: "Heavy Engines & Turbines", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2200, inputs: ["Steel & Iron", "Copper", "Machine Tools & Machinery"] },

  // 37-46 High-Tech, Electronics & Transport
  { id: 37, name: "Semiconductors & Chips", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 2800, inputs: ["Silicon & Quartz", "Rare Earth Metals", "Gold & Precious Metals"] },
  { id: 38, name: "Computers & Electronics", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 2600, inputs: ["Semiconductors & Chips", "Lithium & Batteries", "Plastics & Synthetics"] },
  { id: 39, name: "Telecommunications & Optics", sector: "Office & Corporate Services GDP", era: "Internet", basePrice: 1850, inputs: ["Computers & Electronics", "Glass & Ceramics"] },
  { id: 40, name: "Electrical Consumer Appliances", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1200, inputs: ["Steel & Iron", "Copper", "Plastics & Synthetics"] },
  { id: 41, name: "Apparel & Footwear", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 580, inputs: ["Cotton & Natural Fibres", "Rubber & Polymers"] },
  { id: 42, name: "Automobiles & Transport Equipment", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2400, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Rubber & Polymers", "Glass & Ceramics"] },
  { id: 43, name: "Railways & Rolling Stock", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2900, inputs: ["Steel & Iron", "Heavy Engines & Turbines"] },
  { id: 44, name: "Ships & Marine Vessels", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 3200, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Wood & Timber"] },
  { id: 45, name: "Aerospace & Aviation", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 4100, inputs: ["Aluminium", "Heavy Engines & Turbines", "Computers & Electronics"] },
  { id: 46, name: "Spacecraft & Propulsion", sector: "Industry & Manufacturing GDP", era: "Space Age", basePrice: 6500, inputs: ["Aluminium", "Rare Earth Metals", "Computers & Electronics", "Uranium & Nuclear"] },

  // 47-48 Defense & Armaments
  { id: 47, name: "Small Arms & Munitions", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 1100, inputs: ["Steel & Iron", "Chemicals & Explosives"] },
  { id: 48, name: "Heavy Armaments & Artillery", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 3800, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Chemicals & Explosives", "Computers & Electronics"] },

  // 49-60 Health, Consumer & Public Services
  { id: 49, name: "Chemicals & Explosives", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 920, inputs: ["Refined Petroleum & Fuels", "Stone & Minerals"] },
  { id: 50, name: "Fertilizer & Agrochem", sector: "Agricultural Sector GDP", era: "Tools", basePrice: 670, inputs: ["Chemicals & Explosives", "Natural Gas"] },
  { id: 51, name: "Solar & Clean Energy", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 1750, inputs: ["Silicon & Quartz", "Aluminium", "Lithium & Batteries"] },
  { id: 52, name: "Pharmaceuticals & Medicine", sector: "Office & Corporate Services GDP", era: "Tools", basePrice: 2100, inputs: ["Chemicals & Explosives", "Water"] },
  { id: 53, name: "Medical Technology & Services", sector: "Hospitality & Tourist Services GDP", era: "Internet", basePrice: 2500, inputs: ["Pharmaceuticals & Medicine", "Computers & Electronics"] },
  { id: 54, name: "Processed Foods & Hospitality", sector: "Hospitality & Tourist Services GDP", era: "Wooden Tools", basePrice: 850, inputs: ["Grain", "Meat & Livestock", "Sugar & Confectionery"] },
  { id: 55, name: "Retail, Trade & Logistics", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 1100, inputs: ["Automobiles & Transport Equipment", "Paper & Publishing"] },
  { id: 56, name: "Housing & Real Estate", sector: "Hospitality & Tourist Services GDP", era: "Stone Tools", basePrice: 1800, inputs: ["Construction Materials", "Glass & Ceramics", "Electricity & Grid"] },
  { id: 57, name: "Media, Internet & Software", sector: "Office & Corporate Services GDP", era: "Internet", basePrice: 2300, inputs: ["Computers & Electronics", "Telecommunications & Optics"] },
  { id: 58, name: "Banking & Financial Services", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 2900, inputs: ["Media, Internet & Software", "Gold & Precious Metals"] },
  { id: 59, name: "Public Administration & Governance", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 1400, inputs: ["Paper & Publishing", "Banking & Financial Services"] },
  { id: 60, name: "Controlled & Illicit Goods", sector: "Hospitality & Tourist Services GDP", era: "Wooden Tools", basePrice: 3200, inputs: ["Chemicals & Explosives", "Water"] }
];

export const FUNDING_TIERS = {
  underfunded: {
    id: "underfunded",
    label: "Underfunded",
    budgetCostPct: -0.004,
    tierScore: 0,
  },
  standard: {
    id: "standard",
    label: "Standard",
    budgetCostPct: 0.0,
    tierScore: 1,
  },
  priority: {
    id: "priority",
    label: "Priority",
    budgetCostPct: 0.005,
    tierScore: 2,
  },
  landmark: {
    id: "landmark",
    label: "Landmark",
    budgetCostPct: 0.011,
    tierScore: 3,
  },
};

export const POLICY_CATALOG = [
  {
    id: "education",
    name: "Public Education & STEM Workforce Act",
    shortName: "Education & STEM",
    drives: ["Workforce Literacy & Education Rate", "Total Factor Productivity"],
    description:
      "Federal funding for K-12 schools, Pell grants, vocational apprenticeships, and STEM university pipelines.",
  },
  {
    id: "infrastructure",
    name: "National Infrastructure & Logistics Act",
    shortName: "Infrastructure & Grid",
    drives: ["Infrastructure & Logistics Efficiency", "Urban Agglomeration Rate"],
    description:
      "Capital investment in interstate highways, deepwater ports, freight rail, and grid transmission.",
  },
  {
    id: "innovation",
    name: "Science, R&D & Industrial Innovation Act",
    shortName: "Science & R&D",
    drives: ["Total Factor Productivity (K-Factor)", "4-Sector Productivity"],
    description:
      "CHIPS, DARPA, NSF basic research grants, and advanced manufacturing capital incentives.",
  },
  {
    id: "governance",
    name: "Civic Governance & Healthcare Act",
    shortName: "Governance & Health",
    drives: ["Household Consumer Sentiment", "Urban Agglomeration Rate", "Standard of Living"],
    description:
      "Public safety modernization, healthcare access, and municipal administrative reliability.",
  },
];

export const DEFAULT_POLITICAL_PARTIES = [
  {
    nation: "USA",
    name: "Democratic",
    currentSupport: 0.45,
    incomeTaxPreference: 0.28,
    salesTaxPreference: 0.06,
    corporateTaxRate: 0.25,
    workerShareOfGdp: 0.55,
    infrastructureInvestmentShare: 0.038,
    educationGovernanceShare: 0.055,
    deficitTargetAsPercentOfGdp: -0.032,
    budgetAsPercentOfGdp: 0.22,
    localCrimePolicy: "Beat Cops",
    healthcarePolicy: "Subsidized Healthcare",
    politicalAlignment: "Centre-Left",
    platformSummary:
      "Progressive taxation, targeted infrastructure & STEM investment, and expanded social safety nets with moderate deficits.",
    defaultPolicies: {
      education: { enacted: true, funding: "priority" },
      infrastructure: { enacted: true, funding: "priority" },
      innovation: { enacted: true, funding: "standard" },
      governance: { enacted: true, funding: "priority" },
    },
  },
  {
    nation: "USA",
    name: "Republican",
    currentSupport: 0.45,
    incomeTaxPreference: 0.21,
    salesTaxPreference: 0.08,
    corporateTaxRate: 0.17,
    workerShareOfGdp: 0.48,
    infrastructureInvestmentShare: 0.028,
    educationGovernanceShare: 0.042,
    deficitTargetAsPercentOfGdp: -0.024,
    budgetAsPercentOfGdp: 0.18,
    localCrimePolicy: "Profiling",
    healthcarePolicy: "Private Healthcare",
    politicalAlignment: "Centre-Right",
    platformSummary:
      "Lower income and corporate taxes to incentivize private investment, higher consumption reliance, and restrained social outlays.",
    defaultPolicies: {
      education: { enacted: true, funding: "standard" },
      infrastructure: { enacted: true, funding: "standard" },
      innovation: { enacted: true, funding: "priority" },
      governance: { enacted: true, funding: "standard" },
    },
  },
  {
    nation: "USA",
    name: "Progressive Labor",
    currentSupport: 0.04,
    incomeTaxPreference: 0.35,
    salesTaxPreference: 0.05,
    corporateTaxRate: 0.32,
    workerShareOfGdp: 0.62,
    infrastructureInvestmentShare: 0.048,
    educationGovernanceShare: 0.070,
    deficitTargetAsPercentOfGdp: -0.045,
    budgetAsPercentOfGdp: 0.26,
    localCrimePolicy: "Gentle Touch",
    healthcarePolicy: "State-run Healthcare",
    politicalAlignment: "Progressive",
    platformSummary:
      "High top-end & corporate taxes funding landmark public education, green infrastructure, and universal public services.",
    defaultPolicies: {
      education: { enacted: true, funding: "landmark" },
      infrastructure: { enacted: true, funding: "landmark" },
      innovation: { enacted: true, funding: "priority" },
      governance: { enacted: true, funding: "landmark" },
    },
  },
  {
    nation: "USA",
    name: "Libertarian Free-Market",
    currentSupport: 0.03,
    incomeTaxPreference: 0.10,
    salesTaxPreference: 0.05,
    corporateTaxRate: 0.10,
    workerShareOfGdp: 0.50,
    infrastructureInvestmentShare: 0.016,
    educationGovernanceShare: 0.025,
    deficitTargetAsPercentOfGdp: 0.010,
    budgetAsPercentOfGdp: 0.12,
    localCrimePolicy: "Gentle Touch",
    healthcarePolicy: "Private Healthcare",
    politicalAlignment: "Libertarian",
    platformSummary:
      "Minimal federal taxation, strict fiscal surplus targeting debt paydown, and deregulation over federally funded programs.",
    defaultPolicies: {
      education: { enacted: false, funding: "underfunded" },
      infrastructure: { enacted: true, funding: "underfunded" },
      innovation: { enacted: true, funding: "standard" },
      governance: { enacted: false, funding: "underfunded" },
    },
  },
  {
    nation: "USA",
    name: "Centrist Technocrats",
    currentSupport: 0.03,
    incomeTaxPreference: 0.24,
    salesTaxPreference: 0.06,
    corporateTaxRate: 0.20,
    workerShareOfGdp: 0.53,
    infrastructureInvestmentShare: 0.042,
    educationGovernanceShare: 0.060,
    deficitTargetAsPercentOfGdp: -0.010,
    budgetAsPercentOfGdp: 0.20,
    localCrimePolicy: "Beat Cops",
    healthcarePolicy: "Subsidized Healthcare",
    politicalAlignment: "Centrist",
    platformSummary:
      "Near-balanced budgets paired with evidence-based capital investment into R&D, grid infrastructure, and workforce STEM training.",
    defaultPolicies: {
      education: { enacted: true, funding: "priority" },
      infrastructure: { enacted: true, funding: "priority" },
      innovation: { enacted: true, funding: "landmark" },
      governance: { enacted: true, funding: "standard" },
    },
  },
];

export const PARTY_NAME_ALIASES = {
  Green: "Progressive Labor",
  Libertarian: "Libertarian Free-Market",
};

export function resolvePoliticalParty(partiesList, partyName) {
  const list =
    Array.isArray(partiesList) && partiesList.length > 0
      ? partiesList
      : DEFAULT_POLITICAL_PARTIES;
  const canonicalName = PARTY_NAME_ALIASES[partyName] || partyName || "Democratic";
  const found =
    list.find((p) => p.name === canonicalName) ||
    DEFAULT_POLITICAL_PARTIES.find((p) => p.name === canonicalName) ||
    list.find((p) => p.name === partyName);
  const template =
    DEFAULT_POLITICAL_PARTIES.find((p) => p.name === canonicalName) ||
    DEFAULT_POLITICAL_PARTIES[0];
  return found ? { ...template, ...found } : template;
}

export function cloneDefaultPolicies(partyName = "Democratic") {
  const party = resolvePoliticalParty(DEFAULT_POLITICAL_PARTIES, partyName);
  const src = party.defaultPolicies || DEFAULT_POLITICAL_PARTIES[0].defaultPolicies;
  return {
    education: { ...src.education },
    infrastructure: { ...src.infrastructure },
    innovation: { ...src.innovation },
    governance: { ...src.governance },
  };
}

export function buildSimplifiedSeed(originalSeed = {}) {
  const constituentStates = [];
  const unincorporatedTerritories = [];
  const territoryMap = { "United States of America": "usa", "United States": "usa" };
  const territoryStatusMap = {};

  for (const [stateName, meta] of Object.entries(US_STATES_CATALOG)) {
    const isTerritory = meta.status === "TERRITORY";
    territoryMap[stateName] = "usa";
    territoryStatusMap[stateName] = isTerritory ? "TERRITORY" : "STATE";
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
    if (isTerritory) {
      unincorporatedTerritories.push(entry);
    } else {
      constituentStates.push(entry);
    }
  }

  const origUsa = (originalSeed.nations || []).find(
    (n) => n.id === "usa" || n.name === "USA" || n.name === "United States"
  ) || {};
  const existingMarketByGood = new Map(
    (origUsa.market || []).map((m) => [m.goodName, m])
  );

  const market = SIMPLIFIED_60_GOODS.map((g) => {
    const existing = existingMarketByGood.get(g.name);
    return {
      goodName: g.name,
      hype: existing ? existing.hype : 50,
      ddMultiplier: existing ? existing.ddMultiplier : 1.0,
      exportTariffRate: existing ? existing.exportTariffRate : 0.0,
      importTariffRate: existing ? existing.importTariffRate : 0.05,
      illegal: g.name === "Controlled & Illicit Goods" ? true : Boolean(existing?.illegal),
    };
  });

  const rulingParty = "Democratic";

  return {
    timeManager: originalSeed.timeManager || {
      intervalDaysPerHour: 90,
      daysElapsed: 0,
      quarterNumber: 1,
      crisisStartDate: "2025-01-01",
      crisisDate: "2025-01-01",
      nextPaymentDate: "2025-04-01",
      isLive: false,
    },
    politicalParties: DEFAULT_POLITICAL_PARTIES.map((p) => ({
      ...p,
      defaultPolicies: {
        education: { ...p.defaultPolicies.education },
        infrastructure: { ...p.defaultPolicies.infrastructure },
        innovation: { ...p.defaultPolicies.innovation },
        governance: { ...p.defaultPolicies.governance },
      },
    })),
    sectorsConfig: originalSeed.sectorsConfig || [
      { name: "Agricultural Sector GDP", sentiment: 55, kFactorBonus: 0.3, cbpf: 0 },
      { name: "Industry & Manufacturing GDP", sentiment: 80, kFactorBonus: 0.7, cbpf: 0 },
      { name: "Hospitality & Tourist Services GDP", sentiment: 68, kFactorBonus: 0.3, cbpf: 0 },
      { name: "Office & Corporate Services GDP", sentiment: 78, kFactorBonus: 0.9, cbpf: 0 },
    ],
    techEras: originalSeed.techEras || [
      { name: "Wooden Tools", unlocked: true },
      { name: "Stone Tools", unlocked: true },
      { name: "Iron Tools", unlocked: true },
      { name: "Tools", unlocked: true },
      { name: "Semi-conductors", unlocked: true },
      { name: "Atomic", unlocked: true },
      { name: "Internet", unlocked: true },
      { name: "AI", unlocked: false },
      { name: "Space Age", unlocked: false },
    ],
    goodsCatalog: SIMPLIFIED_60_GOODS.map((g) => ({
      id: g.id,
      name: g.name,
      sector: g.sector,
      goodType: g.name,
      era: g.era,
      inputs: g.inputs,
      basePrice: g.basePrice,
    })),
    nations: [
      {
        id: "usa",
        name: "United States",
        capital: "Washington D.C.",
        planet: "Earth",
        color: "#06b6d4",
        stockExchangeName: "New York Stock Exchange",
        consumerSentiment: 65,
        kFactorScaler: 1500,
        workingPops: 168000000,
        literacyRate: 0.92,
        urbanisationIndex: 0.83,
        infrastructureEfficiency: 0.82,
        centralBankRate: 0.045,
        rulingParty,
        startingBaseline: {
          literacyRate: 0.92,
          infrastructureEfficiency: 0.82,
          urbanisationIndex: 0.83,
          consumerSentiment: 65,
          kFactorScaler: 1500,
          publicDebt: 34500000000000,
        },
        enactedPolicies: cloneDefaultPolicies(rulingParty),
        federalCooperativity: 0.1,
        diplomaticExpenses: 0,
        treasuryBalance: 850000000000,
        publicDebt: 34500000000000,
        specializedIndustry: "No Specialization",
        crimePolicy: "Beat Cops",
        healthcarePolicy: "Subsidized Healthcare",
        highImmigration: true,
        companies: [],
        constituentStates,
        unincorporatedTerritories,
        market,
      },
    ],
    territoryMap,
    territoryStatusMap,
  };
}
