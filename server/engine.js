// Complete Simulation Engine implementing Interstellar 2.0 & Imperium Solutions Mastersheet formulas + Statecraft & Election Rules
import {
  ensureVictoriaState,
  evaluateVictoriaMechanics,
  processTimeTickVictoria,
  getNationLawModifiers,
  setCustomStartDate,
  triggerElectionAction,
  triggerLawAction,
  queueConstruction,
  setNationPolicyRate,
  issueSovereignBond,
  repaySovereignBond,
  resolveNewsDilemma,
  publishCustomNews,
  LAW_CATALOG,
  CONSTRUCTION_BUILDINGS,
  SOVEREIGN_CREDIT_RATINGS,
} from "./victoriaMechanics.js";
import { HISTORICAL_ERAS, getHistoricalEraForDate } from "./historicalEras.js";
import { ALL_SOVEREIGN_NATIONS, ALL_NATIONS_BY_ID, ALL_NATIONS_BY_NAME } from "../src/data/nationsCatalog.js";
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
  setCustomStartDate,
  triggerElectionAction,
  triggerLawAction,
  queueConstruction,
  setNationPolicyRate,
  issueSovereignBond,
  repaySovereignBond,
  resolveNewsDilemma,
  publishCustomNews,
  LAW_CATALOG,
  CONSTRUCTION_BUILDINGS,
  SOVEREIGN_CREDIT_RATINGS,
  HISTORICAL_ERAS,
  getHistoricalEraForDate,
};

const TECH_ERA_TO_TOOL_INPUT = [
  { eraName: "Wooden Tools", goodName: "Wood" },
  { eraName: "Stone Tools", goodName: "Stone" },
  { eraName: "Iron Tools", goodName: "Iron" },
  { eraName: "Tools", goodName: "Steel" },
  { eraName: "Semi-conductors", goodName: "Semi-Conductor" },
  { eraName: "Atomic", goodName: "Atomic" },
  { eraName: "Internet", goodName: "Internet" },
  { eraName: "AI", goodName: "AI" },
  { eraName: "Space Age", goodName: "Space Age" },
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
  if (policy === "Private Healthcare" || policy === "State-run Healthcare") {
    return 0.01;
  }
  if (policy === "Euthanasia") {
    return 0.3;
  }
  return 0.05;
}

const EU_MEMBER_COUNTRIES = [
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Poland",
  "Netherlands",
  "Belgium",
  "Sweden",
  "Austria",
  "Denmark",
  "Finland",
  "Ireland",
  "Portugal",
  "Greece",
  "Czechia",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Croatia",
  "Slovakia",
  "Slovenia",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Cyprus",
];

const DEFAULT_MARS_PROVINCES = {
  "Olympus Mons": "olympus",
  "Tharsis Montes": "olympus",
  "Alba Mons": "olympus",
  "Amazonis Planitia": "olympus",
  "Valles Marineris": "heinan",
  "Solis Planum": "heinan",
  "Noctis Labyrinthus": "heinan",
  "Chryse Planitia": "mitsubishi",
  "Acidalia Planitia": "mitsubishi",
  "Tempe Terra": "mitsubishi",
  "Meridiani Planum": "mitsubishi",
  "Utopia Planitia": "sumitomo",
  "Elysium Planitia": "sumitomo",
  "Arcadia Planitia": "sumitomo",
  "Isidis Planitia": "sumitomo",
  "Hellas Planitia": "ifc",
  "Syrtis Major": "ifc",
  "Arabia Terra": "ifc",
  "Noachis Terra": "ifc",
  "Argyre Planitia": "UNCLAIMED",
  "Cimmeria Terra": "UNCLAIMED",
  "Sirenum Terra": "UNCLAIMED",
  "Hesperia Planum": "UNCLAIMED",
  "Vastitas Borealis": "UNCLAIMED",
};

export function ensureTerritoryMap(state) {
  if (!state.territoryMap) {
    state.territoryMap = {};
  }
  const tm = state.territoryMap;

  // Ensure all sovereign nations exist in state.nations
  if (!state.nations) state.nations = [];
  const existingNationIds = new Set(state.nations.map((n) => n.id));
  const existingNationNames = new Set(state.nations.map((n) => n.name.toLowerCase()));

  // Merge full roster of sovereign nations
  for (const catalogNation of ALL_SOVEREIGN_NATIONS) {
    if (!existingNationIds.has(catalogNation.id) && !existingNationNames.has(catalogNation.name.toLowerCase())) {
      state.nations.push({
        ...catalogNation,
        stockExchangeName: `${catalogNation.name} Bourse`,
        consumerSentiment: 60,
        kFactorScaler: 1500,
        federalCooperativity: 0.1,
        diplomaticExpenses: 0,
        specializedIndustry: "Industry & Manufacturing GDP",
        crimePolicy: catalogNation.laws?.policing || "Beat Cops",
        healthcarePolicy: catalogNation.laws?.welfare || "State-run Healthcare",
        highImmigration: false,
        companies: [],
        constituentStates: [],
        unincorporatedTerritories: [],
        market: [],
      });
      existingNationIds.add(catalogNation.id);
      existingNationNames.add(catalogNation.name.toLowerCase());
    }
  }

  const nationsById = new Map((state.nations || []).map((n) => [n.id, n]));

  // Ensure governmentSystem & laws are synced with real-world forms
  for (const n of state.nations || []) {
    const catalogMatch = ALL_NATIONS_BY_ID.get(n.id) || ALL_NATIONS_BY_NAME.get(n.name.toLowerCase());
    if (catalogMatch) {
      if (!n.governmentSystem) n.governmentSystem = catalogMatch.governmentSystem;
      if (!n.capital) n.capital = catalogMatch.capital;
      if (!n.rulingParty) n.rulingParty = catalogMatch.rulingParty;
      if (!n.color) n.color = catalogMatch.color;
      if (!n.laws) n.laws = { ...catalogMatch.laws };
      if (!n.laws.governance) n.laws.governance = n.governmentSystem;
    }
  }

  // Seed / ensure Earth & Mars mappings
  for (const n of state.nations || []) {
    if (!tm[n.name]) {
      tm[n.name] = n.id;
    }
  }
  if (nationsById.has("usa")) tm["United States of America"] = "usa";
  // Explicitly deconflict Caucasus Georgia from US State Georgia
  if (!tm["Georgia"] || tm["Georgia"] === "georgia") tm["Georgia"] = "georgia_tbilisi";
  if (!tm["Georgia (USA)"]) tm["Georgia (USA)"] = "usa";
  if (!tm["Georgia:Atlanta"]) tm["Georgia:Atlanta"] = "usa";

  // Martian Provinces
  for (const [prov, controller] of Object.entries(DEFAULT_MARS_PROVINCES)) {
    if (!tm[prov]) {
      tm[prov] = controller;
    }
  }

  // Compute controlled territory count per nation
  const counts = {};
  for (const [terr, cid] of Object.entries(tm)) {
    if (cid && cid !== "UNCLAIMED") {
      counts[cid] = (counts[cid] || 0) + 1;
    }
  }
  for (const n of state.nations || []) {
    n.territoryCount = counts[n.id] || 1;
  }
  return tm;
}

/**
 * Applies a historical era or date to the world state:
 * Sets start dates, re-maps all sovereign borders, assigns accurate constituent states & unincorporated territories.
 */
export function applyHistoricalEra(state, eraIdOrDate) {
  const era = typeof eraIdOrDate === "string" && eraIdOrDate.startsWith("era_")
    ? HISTORICAL_ERAS.find((e) => e.id === eraIdOrDate) || HISTORICAL_ERAS[6]
    : getHistoricalEraForDate(eraIdOrDate);

  if (!era) return { state, action: "Historical Era not found" };

  state.currentEraId = era.id;
  if (!state.timeManager) state.timeManager = {};
  state.timeManager.crisisStartDate = era.startDate;
  state.timeManager.crisisDate = era.startDate;

  // Re-map territory ownership and statuses
  state.territoryMap = { ...(era.territoryMap || {}) };
  state.territoryStatusMap = {};

  // Setup nations for this era
  const newNations = [];
  for (const nTemplate of era.nations) {
    const statesList = (nTemplate.constituentStates || []).map((st) => ({
      ...st,
      status: "STATE",
    }));
    const territoriesList = (nTemplate.unincorporatedTerritories || []).map((tr) => ({
      ...tr,
      status: "TERRITORY",
    }));

    statesList.forEach((st) => {
      state.territoryStatusMap[st.name] = "STATE";
      if (!state.territoryMap[st.name]) state.territoryMap[st.name] = nTemplate.id;
    });
    territoriesList.forEach((tr) => {
      state.territoryStatusMap[tr.name] = "TERRITORY";
      if (!state.territoryMap[tr.name]) state.territoryMap[tr.name] = nTemplate.id;
    });

    const nationObj = {
      id: nTemplate.id,
      name: nTemplate.name,
      planet: nTemplate.planet || "Earth",
      color: nTemplate.color,
      stockExchangeName: `${nTemplate.name} Bourse`,
      consumerSentiment: 55,
      kFactorScaler: 1500,
      workingPops: nTemplate.workingPops || 25000000,
      literacyRate: nTemplate.literacyRate || 0.8,
      urbanisationIndex: nTemplate.urbanisationIndex || 0.6,
      infrastructureEfficiency: nTemplate.infrastructureEfficiency || 0.75,
      rulingParty: nTemplate.rulingParty || "National Council",
      federalCooperativity: 0.1,
      diplomaticExpenses: 0,
      treasuryBalance: nTemplate.treasuryBalance || 25000000000,
      specializedIndustry: "Industry & Manufacturing GDP",
      crimePolicy: "Beat Cops",
      healthcarePolicy: "State-run Healthcare",
      highImmigration: false,
      companies: [],
      constituentStates: statesList,
      unincorporatedTerritories: territoriesList,
      market: [],
    };
    newNations.push(nationObj);
  }

  // Preserve off-world Martian nations if Mars is configured
  const marsPlanets = (state.planetsConfig || []).filter((p) => (p.name || "").toLowerCase() === "mars");
  if (marsPlanets.length > 0) {
    const marsNations = (state.nations || []).filter((n) => (n.planet || "").toLowerCase() === "mars");
    marsNations.forEach((mn) => {
      if (!newNations.some((n) => n.id === mn.id)) {
        newNations.push(mn);
      }
    });
  }

  state.nations = newNations;
  ensureVictoriaState(state);

  state.newsFeed = state.newsFeed || [];
  state.newsFeed.unshift({
    id: `news_era_${Date.now().toString(36)}`,
    date: era.startDate,
    quarter: 1,
    category: "GLOBAL EPOCH",
    headline: `Historical Era Initialized: ${era.label}`,
    summary: `The geopolitical world order, sovereign national borders, and internal state divisions have been realigned to the historical period of ${era.shortLabel}. ${era.description}`,
    nationName: newNations[0]?.name || "World Order",
    impact: `Borders Realigned to ${era.shortLabel}`,
  });

  evaluateSimulation(state);
  return {
    state,
    action: `Applied Historical Era: ${era.label}`,
    toastMessage: `World borders and internal divisions updated to ${era.shortLabel}!`,
  };
}

/**
 * Handles dynamic border changes:
 * - mode === "ANNEX": Transfers a territory to targetNationId as an UNINCORPORATED TERRITORY first
 * - mode === "INTEGRATE": Integrates an unincorporated territory into full Constituent Statehood
 * - mode === "RELEASE": Releases a state as a unitary sovereign nation with NO internal sub-provinces
 */
export function transferTerritory(state, { territoryName, targetNationId, mode = "ANNEX", planet = "Earth", capital, newCountryName }) {
  ensureTerritoryMap(state);
  if (!state.territoryStatusMap) state.territoryStatusMap = {};
  const prevControllerId = state.territoryMap[territoryName];
  const prevNation = (state.nations || []).find((n) => n.id === prevControllerId);

  // 1. SECESSION / RELEASE:
  // "When one state within a country secedes, it should not have any more state and provinces since it is a state itself."
  if (mode === "RELEASE" || mode === "SECEDE") {
    const isGeorgia = territoryName.toLowerCase() === "georgia";
    const isUsaGeorgia = isGeorgia && (prevControllerId === "usa" || prevNation?.id === "usa" || territoryName.includes("USA"));
    const isCalifornia = territoryName.toLowerCase().includes("california");
    const isTexas = territoryName.toLowerCase().includes("texas");

    let capitalName = capital;
    if (!capitalName) {
      if (isUsaGeorgia) capitalName = "Atlanta";
      else if (isGeorgia) capitalName = "Tbilisi";
      else if (isCalifornia) capitalName = "Sacramento";
      else if (isTexas) capitalName = "Austin";
      else capitalName = `${territoryName} City`;
    }

    let nationName = newCountryName || territoryName;
    if (!newCountryName) {
      if (isCalifornia) nationName = "California Republic";
      else if (isTexas) nationName = "Republic of Texas";
      else if (isUsaGeorgia) nationName = "Georgia Republic";
      else if (
        !nationName.toLowerCase().includes("republic") &&
        !nationName.toLowerCase().includes("commonwealth") &&
        !nationName.toLowerCase().includes("state")
      ) {
        nationName = `${territoryName} Republic`;
      }
    }

    const sovereignColor = isCalifornia
      ? "#f59e0b"
      : isTexas
      ? "#ef4444"
      : isUsaGeorgia
      ? "#3b82f6"
      : "#10b981";

    const clean = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const countryTag = isUsaGeorgia
      ? "georgia_atlanta"
      : isGeorgia
      ? "georgia_tbilisi"
      : `${clean(territoryName)}_${clean(capitalName)}`;

    const newId = targetNationId || countryTag;
    const existing = (state.nations || []).find(
      (n) =>
        n.id === newId ||
        n.id === countryTag ||
        n.name.toLowerCase() === territoryName.toLowerCase() ||
        n.name.toLowerCase() === nationName.toLowerCase()
    );
    if (existing) {
      state.territoryMap[territoryName] = existing.id;
      if (isUsaGeorgia) {
        state.territoryMap["Georgia (USA)"] = existing.id;
        state.territoryMap["Georgia:Atlanta"] = existing.id;
      }
      state.territoryStatusMap[territoryName] = "STATE";
      evaluateSimulation(state);
      return { state, nationId: existing.id, action: `Restored sovereignty to ${existing.name}` };
    }

    const templateNation = prevNation || state.nations[0];
    let transferredCompanies = [];
    let newPops = planet === "Mars" ? 4500000 : 18000000;

    if (prevNation) {
      const popShare = Math.round((prevNation.workingPops || 20000000) * 0.12);
      prevNation.workingPops = Math.max(1000000, prevNation.workingPops - popShare);
      newPops = Math.max(2500000, popShare);
      if (prevNation.constituentStates) {
        prevNation.constituentStates = prevNation.constituentStates.filter((s) => s.name !== territoryName);
      }
      if (prevNation.unincorporatedTerritories) {
        prevNation.unincorporatedTerritories = prevNation.unincorporatedTerritories.filter((t) => t.name !== territoryName);
      }
    }

    // A seceded state is a unitary sovereign entity with NO internal sub-states/provinces
    const newNation = {
      id: newId,
      name: nationName,
      planet,
      capital: capitalName,
      governmentSystem: "Presidential Republic",
      color: sovereignColor,
      isSeceded: true,
      isUnitaryState: true,
      constituentStates: [],
      unincorporatedTerritories: [],
      stockExchangeName: `${nationName} National Bourse`,
      consumerSentiment: 56,
      kFactorScaler: 1500,
      workingPops: newPops,
      literacyRate: 0.88,
      urbanisationIndex: 0.82,
      infrastructureEfficiency: 0.84,
      rulingParty: state.politicalParties?.[0]?.name || "Democratic Party",
      federalCooperativity: 0.1,
      diplomaticExpenses: 0,
      treasuryBalance: 35000000000,
      specializedIndustry: "Industry & Manufacturing GDP",
      crimePolicy: "Beat Cops",
      healthcarePolicy: "State-run Healthcare",
      highImmigration: false,
      companies: transferredCompanies,
      market: (templateNation?.market || []).map((m) => ({ ...m })),
      laws: {
        governance: "Presidential Republic",
        economy: "Laissez-Faire",
        trade: "Free Trade",
        taxation: "Graduated Taxation",
        policing: "Beat Cops",
        welfare: "State-run Healthcare",
      },
    };

    state.nations.push(newNation);
    state.territoryMap[territoryName] = newId;
    if (isUsaGeorgia) {
      state.territoryMap["Georgia (USA)"] = newId;
      state.territoryMap["Georgia:Atlanta"] = newId;
    }
    state.territoryStatusMap[territoryName] = "STATE";
    ensureVictoriaState(state);
    state.newsFeed.unshift({
      id: `news_ind_${Date.now().toString(36)}`,
      date: state.timeManager?.crisisDate || "2025-01-01",
      quarter: state.timeManager?.quarterNumber || 1,
      category: "DIPLOMATIC PLAY",
      headline: `Sovereignty Proclaimed: ${nationName} Declares Independence!`,
      summary: `A new sovereign unitary state rises over ${territoryName} (${planet}), establishing capital at ${capitalName} and mobilizing ${(newPops / 1e6).toFixed(1)}M citizens.`,
      nationName: nationName,
      impact: `New Sovereign State: ${nationName} (Unitary)`,
    });
    evaluateSimulation(state);
    return {
      state,
      nationId: newId,
      action: `${nationName} declared independence as a sovereign unitary state`,
    };
  }

  // 2. CONSTITUTIONAL INTEGRATION:
  // Upgrades an annexed territory to full Constituent State status
  if (mode === "INTEGRATE") {
    state.territoryStatusMap[territoryName] = "STATE";
    const ctrlId = state.territoryMap[territoryName];
    const ctrlNation = (state.nations || []).find((n) => n.id === ctrlId);
    if (ctrlNation) {
      if (ctrlNation.unincorporatedTerritories) {
        ctrlNation.unincorporatedTerritories = ctrlNation.unincorporatedTerritories.filter(
          (t) => t.name !== territoryName
        );
      }
      ctrlNation.constituentStates = ctrlNation.constituentStates || [];
      if (!ctrlNation.constituentStates.some((s) => s.name === territoryName)) {
        ctrlNation.constituentStates.push({
          name: territoryName,
          role: "Integrated Constituent State",
          status: "STATE",
          gdpShare: 0.15,
          popShare: 0.15,
        });
      }
    }
    state.newsFeed.unshift({
      id: `news_integ_${Date.now().toString(36)}`,
      date: state.timeManager?.crisisDate || "2025-01-01",
      quarter: state.timeManager?.quarterNumber || 1,
      category: "CONSTITUTIONAL REFORM",
      headline: `${territoryName} Admitted to Full Statehood in ${ctrlNation?.name || "its nation"}!`,
      summary: `The territory of ${territoryName} has completed constitutional integration and is now recognized as a full constituent state with complete legislative representation.`,
      nationName: ctrlNation?.name || territoryName,
      impact: `${territoryName}: Territory → Constituent State`,
    });
    evaluateSimulation(state);
    return {
      state,
      action: `Integrated ${territoryName} as a constituent state of ${ctrlNation?.name || "its nation"}`,
    };
  }

  // 3. ANNEX / TRANSFER mode:
  // "When it is annexed, it should be counted as a territory first, before being made a state."
  const targetNation = (state.nations || []).find((n) => n.id === targetNationId);
  if (!targetNation) return { state, action: "Target nation not found" };

  if (prevControllerId === targetNationId) {
    return { state, nationId: targetNationId, action: `${territoryName} is already controlled by ${targetNation.name}` };
  }

  if (prevNation && prevNation.id !== targetNation.id) {
    const popShift = Math.max(500000, Math.round((prevNation.workingPops || 10000000) * 0.08));
    prevNation.workingPops = Math.max(500000, Math.round(prevNation.workingPops - popShift));
    targetNation.workingPops = Math.round((targetNation.workingPops || 10000000) + popShift);
    if (prevNation.constituentStates) {
      prevNation.constituentStates = prevNation.constituentStates.filter((s) => s.name !== territoryName);
    }
    if (prevNation.unincorporatedTerritories) {
      prevNation.unincorporatedTerritories = prevNation.unincorporatedTerritories.filter((t) => t.name !== territoryName);
    }
  } else {
    // Annexing neutral/unclaimed territory adds frontier workforce
    const bonusPops = targetNation.planet === "Mars" ? 1800000 : 4500000;
    targetNation.workingPops = Math.round((targetNation.workingPops || 10000000) + bonusPops);
  }

  state.territoryMap[territoryName] = targetNation.id;
  // Mark as unincorporated territory first!
  state.territoryStatusMap[territoryName] = "TERRITORY";
  targetNation.unincorporatedTerritories = targetNation.unincorporatedTerritories || [];
  if (!targetNation.unincorporatedTerritories.some((t) => t.name === territoryName)) {
    targetNation.unincorporatedTerritories.push({
      name: territoryName,
      role: "Annexed Unincorporated Territory",
      status: "TERRITORY",
    });
  }

  ensureVictoriaState(state);
  state.newsFeed.unshift({
    id: `news_annex_${Date.now().toString(36)}`,
    date: state.timeManager?.crisisDate || "2025-01-01",
    quarter: state.timeManager?.quarterNumber || 1,
    category: "DIPLOMATIC PLAY",
    headline: `Territory Annexed: ${targetNation.name} Claims Jurisdiction over ${territoryName}!`,
    summary: `${territoryName} has been incorporated as a dependent territory of ${targetNation.name}${
      prevNation ? ` following diplomatic transfer from ${prevNation.name}` : ""
    }. It is designated as an unincorporated territory pending formal statehood integration.`,
    nationName: targetNation.name,
    impact: `${territoryName} → ${targetNation.name} (Unincorporated Territory)`,
  });
  evaluateSimulation(state);
  return {
    state,
    nationId: targetNation.id,
    action: `${targetNation.name} annexed ${territoryName} as an unincorporated territory`,
  };
}

/**
 * Recalculates the entire global/planetary economy in place and returns the enriched state.
 */
export function evaluateSimulation(state) {
  ensureTerritoryMap(state);
  ensureVictoriaState(state);
  const strictSheetQuirks = Boolean(state.strictSheetQuirks);
  const quarterNum = Math.max(1, state.timeManager?.quarterNumber || 1);

  // 1. Build Sector Lookup (kFactorBonus, sentiment)
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
        : g.inputs || ["Tools"];
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
    name: "Republican",
    incomeTaxPreference: 0.21,
    salesTaxPreference: 0.2,
    corporateTaxRate: 0.17,
    workerShareOfGdp: 0.35,
    budgetAsPercentOfGdp: 0.15,
    federalisedPolicy: "Confederated",
    localCrimePolicy: "Profiling",
    healthcarePolicy: "Private Healthcare",
  };

  // 4. Step A: Precompute Unit DVGP multipliers once across the goods catalog
  // Grounded in empirical World Bank Pink Sheet, IMF, and BLS commodity price benchmarks
  // using a convergent Leontief input-output cost matrix (intermediate share ~45%, value-added ~55%).
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

  // Compute DVGP & Adjusted Domestic Price & Export Price for each Nation's Market in 1 pass
  const nationMarketMap = new Map(); // nation.id -> Map(goodName -> marketRow)

  for (const nation of state.nations || []) {
    // Normalized technology scaler (1500 base = 1.0)
    const rawScaler = Number(nation.kFactorScaler) || 1500;
    const kScaler = rawScaler / 1500;
    const mMap = new Map();

    const existingMarket = new Map(
      (nation.market || []).map((m) => [m.goodName, m])
    );

    for (const g of state.goodsCatalog || []) {
      const ex = existingMarket.get(g.name) || {};
      const gInfo = goodsMap.get(g.name);
      const dvgp = (unitDvgpMap.get(g.name) ?? 350) * kScaler;
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
          ex.importTariffRate !== undefined ? Number(ex.importTariffRate) : 0.0,
        illegal: Boolean(ex.illegal),
        dvgp,
        adjustedPrice,
        postExportPrice,
      });
    }

    nationMarketMap.set(nation.id, mMap);
  }

  // 5. Step B: Compute Global Market AMEP for each good
  // Note: In Interstellar 2.0 Global Market, D2 = AVERAGEIF(E2:F2, ">0") (USA & Japan primary benchmark, or all exporting nations if modified).
  // We compute AMEP across USA & Japan if unchanged, or across all nations with weight so any nation's tariff/DD changes affect global trade,
  // while matching the exact initial spreadsheet benchmark!
  const globalMarket = [];
  const usaNation = state.nations.find((n) => n.name === "USA") || state.nations[0];
  const japNation = state.nations.find((n) => n.name === "Japan") || state.nations[1] || usaNation;

  for (const g of state.goodsCatalog || []) {
    const exportPrices = {};
    let sumAll = 0;
    let countAll = 0;

    for (const nation of state.nations || []) {
      const mRow = nationMarketMap.get(nation.id)?.get(g.name);
      const p = mRow ? mRow.postExportPrice : 0;
      exportPrices[nation.name] = p;
      if (p > 0) {
        sumAll += p;
        countAll++;
      }
    }

    let amep = countAll > 0 ? sumAll / countAll : 0;
    if (usaNation && japNation && state.nations.length >= 2) {
      const pUsa = exportPrices[usaNation.name] || 0;
      const pJap = exportPrices[japNation.name] || 0;
      if (pUsa > 0 && pJap > 0) {
        // In Interstellar 2.0 sheet, D2 is AVERAGEIF(E2:F2, ">0")
        amep = (pUsa + pJap) / 2;
      }
    }

    globalMarket.push({
      goodName: g.name,
      category: g.sector,
      era: g.era,
      goodType: g.goodType,
      amep,
      exportPrices,
    });
  }
  const globalPriceMap = new Map(globalMarket.map((gm) => [gm.goodName, gm.amep]));

  // 6. Step C: Complete each Nation's Market (Local Price, Sell Orders, Import Orders, TBPF) & Companies
  for (const nation of state.nations || []) {
    const mMap = nationMarketMap.get(nation.id);

    // Compute aggregate sell orders (L) by good
    const sellOrdersByGood = new Map();
    let hasInternationalTradeCompany = false;

    // Macroeconomic baseline distribution when companies array is empty
    const nationWorkingPops = Math.max(1000000, Number(nation.workingPops) || 280000000);
    const hasCompanies = Array.isArray(nation.companies) && nation.companies.length > 0;

    if (hasCompanies) {
      for (const comp of nation.companies) {
        const gName = comp.flagshipGood;
        const mRow = mMap.get(gName);
        if (mRow) {
          comp.gdpSector = mRow.category;
          comp.productionMethod = mRow.productionMethod;
          comp.illegal = Boolean(mRow.illegal);
        }
        if (gName === "International Trade" || gName === "Retail, Trade & Logistics") {
          hasInternationalTradeCompany = true;
        }
        const emp = Math.max(0, Number(comp.employedPops) || 0);
        sellOrdersByGood.set(gName, (sellOrdersByGood.get(gName) || 0) + emp);
      }
    } else {
      // Direct macroeconomic distribution: 95% employed pops across 60 simplified goods
      hasInternationalTradeCompany = true;
      const totalBaseEmp = nationWorkingPops * 0.95;
      const goodsCount = Math.max(1, mMap.size);
      
      // Sector allocation weights
      const sectorWeights = {
        "Agricultural Sector GDP": 0.12,
        "Industry & Manufacturing GDP": 0.58,
        "Hospitality & Tourist Services GDP": 0.08,
        "Office & Corporate Services GDP": 0.22,
      };

      // Count goods per sector
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

    // Set K (Global Price), U (Post-Import Tariff Price), F (Local Price), L (Sell Orders)
    for (const [gName, mRow] of mMap.entries()) {
      const globalPrice = globalPriceMap.get(gName) || mRow.adjustedPrice;
      mRow.globalPrice = globalPrice;
      mRow.postImportPrice = globalPrice * (1 + mRow.importTariffRate);
      mRow.localPrice = Math.min(mRow.postImportPrice, mRow.adjustedPrice);
      mRow.sellOrders = sellOrdersByGood.get(gName) || 0;
    }

    // Compute R (Import orders needed), S (Net Balance of Goods), E (TBPF)
    // In Excel: R_b = (SUM of L_k for all goods k whose productionMethod includes b) * (1 - T_b * J_b)
    const rawDemandByInput = new Map();
    for (const mRow of mMap.values()) {
      if (mRow.sellOrders > 0) {
        for (const inp of mRow.inputsList) {
          rawDemandByInput.set(inp, (rawDemandByInput.get(inp) || 0) + mRow.sellOrders);
        }
      }
    }

    // Output productivity multiplier calibrated from Hugging Face & World Bank Pink Sheet benchmarks
    // Ensures modern US GDP scales to ~$28.0 Trillion and Kansas state GDP scales to ~$224 Billion (0.8%)
    const WORKER_PRODUCTIVITY_SCALER = 223.7;

    for (const [gName, mRow] of mMap.entries()) {
      const rawInputDemand = rawDemandByInput.get(gName) || 0;
      mRow.receivedFromGlobalMarket = hasInternationalTradeCompany && rawInputDemand > 0;
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

    // Compute Company & National Sector VGP (H = I * LocalPrice * WorkerProductivity) and Valuation
    const vgpByGood = new Map();
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

    if (hasCompanies) {
      for (const comp of nation.companies) {
        const mRow = mMap.get(comp.flagshipGood);
        const localPrice = mRow ? mRow.localPrice : 350;
        const emp = Math.max(0, Number(comp.employedPops) || 0);

        if (!comp.hypeFactor || comp.hypeFactor <= 0) {
          const secCfg = sectorMap.get(comp.gdpSector);
          const secSent = secCfg ? Number(secCfg.sentiment) : 50;
          const goodHype = mRow ? Number(mRow.hype) : 50;
          const consSent = Number(nation.consumerSentiment) || 50;
          comp.hypeFactor =
            12.5 + (consSent / 100) * 25 + (secSent / 100) * 25 + (goodHype / 100) * 25;
        }

        comp.vgp = emp * localPrice * WORKER_PRODUCTIVITY_SCALER;
        comp.valuation = comp.vgp * comp.hypeFactor;

        totalEmployed += emp;
        if (comp.illegal) {
          numberOfCriminals += emp;
        }
        vgpByGood.set(comp.flagshipGood, (vgpByGood.get(comp.flagshipGood) || 0) + comp.vgp);

        if (sectorVgp[comp.gdpSector] !== undefined) {
          sectorVgp[comp.gdpSector] += comp.vgp;
          sectorEmp[comp.gdpSector] += emp;
        } else {
          sectorVgp["Industry & Manufacturing GDP"] += comp.vgp;
          sectorEmp["Industry & Manufacturing GDP"] += emp;
        }
      }
    } else {
      // Macroeconomic evaluation from sellOrdersByGood
      for (const [gName, mRow] of mMap.entries()) {
        const emp = sellOrdersByGood.get(gName) || 0;
        const localPrice = mRow.localPrice || 350;
        const goodVgp = emp * localPrice * WORKER_PRODUCTIVITY_SCALER;
        vgpByGood.set(gName, goodVgp);

        const sec = mRow.category || "Industry & Manufacturing GDP";
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

    // Complete Exported to Global Market (O) and Export Tariff Revenues (P)
    let totalExportTariffRevenues = 0;
    let totalImportTariffRevenues = 0;
    let totalExportsValue = 0;
    let totalImportsValue = 0;

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

    // 7. Nation Demographics, Politics & Macro Indicators
    const party = partyMap.get(nation.rulingParty) || defaultParty;
    const isFullVgpSheetNation = ["USA", "Japan", "Olympus", "Mitsubishi", "Sumitomo"].includes(
      nation.name
    );

    const useCol8Quirk = strictSheetQuirks && !isFullVgpSheetNation;

    const agriculturalGdp = useCol8Quirk
      ? sectorEmp["Agricultural Sector GDP"]
      : sectorVgp["Agricultural Sector GDP"];
    const industryGdp = useCol8Quirk
      ? sectorEmp["Industry & Manufacturing GDP"]
      : sectorVgp["Industry & Manufacturing GDP"];
    const hospitalityGdp = useCol8Quirk
      ? sectorEmp["Hospitality & Tourist Services GDP"]
      : sectorVgp["Hospitality & Tourist Services GDP"];
    const officeGdp = useCol8Quirk
      ? sectorEmp["Office & Corporate Services GDP"]
      : sectorVgp["Office & Corporate Services GDP"];

    const aggregateGdp = agriculturalGdp + industryGdp + hospitalityGdp + officeGdp;

    // Effective working pops: in Balanced mode, ensure workingPops >= totalEmployed * 1.023 so unemployment isn't -748%
    let rawWorkingPops = Number(nation.workingPops) || 10000000;
    const effectiveWorkingPops =
      !strictSheetQuirks && rawWorkingPops < totalEmployed
        ? Math.round(totalEmployed * 1.045)
        : rawWorkingPops;

    const unemploymentRate =
      effectiveWorkingPops > 0
        ? Math.max(0, Math.min(1, 1 - totalEmployed / effectiveWorkingPops))
        : 0;

    const crimePolicy = nation.crimePolicy || party.localCrimePolicy || "Profiling";
    const healthcarePolicy =
      nation.healthcarePolicy || party.healthcarePolicy || "Private Healthcare";

    const crimeRate =
      totalEmployed > 0
        ? (numberOfCriminals / totalEmployed) * getCrimePolicyMultiplier(crimePolicy)
        : 0;

    const incomeTax =
      nation.incomeTaxOverride !== undefined && nation.incomeTaxOverride !== null
        ? Number(nation.incomeTaxOverride)
        : Number(party.incomeTaxPreference);
    const salesTax =
      nation.salesTaxOverride !== undefined && nation.salesTaxOverride !== null
        ? Number(nation.salesTaxOverride)
        : Number(party.salesTaxPreference);
    const corporateTax =
      nation.corporateTaxOverride !== undefined && nation.corporateTaxOverride !== null
        ? Number(nation.corporateTaxOverride)
        : Number(party.corporateTaxRate);
    const workerShareOfGdp =
      nation.workerShareOverride !== undefined && nation.workerShareOverride !== null
        ? Number(nation.workerShareOverride)
        : Number(party.workerShareOfGdp);
    const stateBudgetPercent =
      nation.budgetPercentOverride !== undefined && nation.budgetPercentOverride !== null
        ? Number(nation.budgetPercentOverride)
        : Number(party.budgetAsPercentOfGdp);

    const quarterlyWages = Math.max(
      0,
      ((aggregateGdp * workerShareOfGdp) / Math.max(1, effectiveWorkingPops)) *
        (1 - incomeTax)
    );

    const literacyRate = Math.min(1, Math.max(0.05, Number(nation.literacyRate) || 0.5));
    const urbanisationIndex = Math.min(
      1,
      Math.max(0.05, Number(nation.urbanisationIndex) || 0.5)
    );
    const infrastructureEfficiency = Math.min(
      1,
      Math.max(0.05, Number(nation.infrastructureEfficiency) || 0.75)
    );
    const consumerSentiment = Math.max(1, Number(nation.consumerSentiment) || 50);

    const mortalityRate =
      (crimeRate * urbanisationIndex) / 2 + getHealthcareMortalityBase(healthcarePolicy);

    // K3: =(L3+N3)-(M3+O3)+ln(H3/J3)
    const wageRatio = Math.max(0.001, quarterlyWages > 0 ? quarterlyWages / consumerSentiment : 0.01);
    const rawSolBase =
      literacyRate + urbanisationIndex - (crimeRate + mortalityRate) + Math.log(wageRatio);
    const solBase = Number.isFinite(rawSolBase) ? rawSolBase : 15.0;
    const fertilityRate = Math.max(0, (literacyRate / 100) * solBase);
    const rawSol = nation.highImmigration ? solBase : solBase - fertilityRate;
    const sol = Math.max(1.0, Math.min(50.0, Number.isFinite(rawSol) ? rawSol : 15.0));

    const netImmigrationRate =
      (nation.highImmigration ? 0.1 : 0.01) * sol * urbanisationIndex - crimeRate;
    const popGrowthRate = fertilityRate + netImmigrationRate - mortalityRate;

    // 8. Evaluate Company Growth & Dividends (BASERGDPGROWTH & DIVPERSHARE)
    let weightedGrowthSum = 0;
    let totalValuation = 0;
    let govtDividends = 0;

    for (const comp of nation.companies || []) {
      const specInd = nation.specializedIndustry || "No Specialization";
      const specMult =
        specInd === "No Specialization"
          ? 1.0
          : comp.gdpSector === specInd
          ? 1.25
          : 0.75;

      const divEff = Number(comp.dividendEfficiency) ?? 0.6;
      const baseRgdpGrowth =
        (((unemploymentRate *
          literacyRate *
          infrastructureEfficiency *
          popGrowthRate *
          specMult -
          crimeRate) /
          5) *
          (1 - divEff));

      const mRow = mMap.get(comp.flagshipGood);
      const goodTbpf = mRow ? mRow.tbpf : 0;

      comp.baseRgdpGrowth = baseRgdpGrowth;
      comp.projectedRealGrowth = comp.subsidised
        ? Number(comp.targetGrowth) || 0.02
        : baseRgdpGrowth * goodTbpf + (comp.hypeFactor - 50) / 1000;

      const shares = Math.max(1, Number(comp.numberOfShares) || 50000000);
      const divPerShareFn = (growthRate) =>
        divEff < 0 ? 0 : (comp.valuation * growthRate) / shares;

      if (comp.subsidised) {
        comp.dividendsPerShare = -divPerShareFn(
          (Number(comp.targetGrowth) || 0.02) - baseRgdpGrowth
        );
      } else {
        comp.dividendsPerShare = Math.max(
          0,
          divEff * divPerShareFn(comp.projectedRealGrowth)
        );
      }

      comp.sharePrice = comp.valuation / shares;

      weightedGrowthSum += comp.projectedRealGrowth * comp.valuation;
      totalValuation += comp.valuation;

      const govtShares = Math.max(0, Number(comp.govtOwnedShares) || 0);
      govtDividends += govtShares * divEff * comp.dividendsPerShare;
    }

    const averageCompanyGrowth =
      totalValuation > 0 ? weightedGrowthSum / totalValuation : 0;

    // Fiscal calculations
    const incomeTaxRevenue = quarterlyWages * effectiveWorkingPops * incomeTax;
    const salesTaxRevenue = salesTax * consumerSentiment * effectiveWorkingPops;
    const corporateTaxRevenue = aggregateGdp * (1 - workerShareOfGdp) * corporateTax;
    const tariffRevenues = totalExportTariffRevenues + totalImportTariffRevenues;

    const stateIncome =
      govtDividends +
      corporateTaxRevenue +
      salesTaxRevenue +
      incomeTaxRevenue +
      tariffRevenues;

    const federalCooperativity = Number(nation.federalCooperativity) || 0;
    const stateContributions = stateIncome * federalCooperativity;
    const stateExpenditures = stateBudgetPercent * aggregateGdp + stateContributions;
    const diplomaticExpenses = Number(nation.diplomaticExpenses) || 0;
    const netBudgetBalance =
      stateIncome + stateContributions - stateExpenditures + diplomaticExpenses;

    // Macroeconomic & Population Cohort Dynamics (Part A)
    const baseInflation =
      0.022 +
      (averageCompanyGrowth > 0.05 ? 0.012 : 0) +
      (netBudgetBalance < -aggregateGdp * 0.04 ? 0.015 : 0) -
      (Number(nation.centralBankRate) || 0.045) * 0.22;
    const inflationRate = Math.max(-0.015, Math.min(0.25, Number(baseInflation.toFixed(4))));

    const lowIncomePops = Math.round(effectiveWorkingPops * 0.45);
    const middleClassPops = Math.round(effectiveWorkingPops * 0.45);
    const upperClassPops = Math.max(1, effectiveWorkingPops - lowIncomePops - middleClassPops);

    const baseWageFloor = Math.max(1200, quarterlyWages || 1200);
    const cohorts = {
      lowIncome: {
        name: "Low-Income & Labor Cohort",
        popShare: 0.45,
        pops: lowIncomePops,
        averageWage: Math.round(baseWageFloor * 0.48),
        livingStandard: Number(Math.max(1.0, sol * 0.65).toFixed(1)),
        taxBurden: Number((incomeTax * 0.45 + salesTax).toFixed(3)),
        unemploymentRate: Number(Math.min(1.0, unemploymentRate * 1.45).toFixed(4)),
        povertyRate: Number(Math.max(0.02, Math.min(0.65, (1.0 - sol / 30) * 0.5)).toFixed(3)),
      },
      middleClass: {
        name: "Middle Class & Technical Cohort",
        popShare: 0.45,
        pops: middleClassPops,
        averageWage: Math.round(baseWageFloor * 1.15),
        livingStandard: Number(Math.min(50.0, sol * 1.12).toFixed(1)),
        taxBurden: Number((incomeTax + salesTax).toFixed(3)),
        unemploymentRate: Number(Math.max(0, unemploymentRate * 0.8).toFixed(4)),
        homeOwnershipRate: Number(Math.min(0.85, Math.max(0.35, 0.45 + sol * 0.01)).toFixed(2)),
      },
      upperClass: {
        name: "Capital & Ownership Cohort",
        popShare: 0.10,
        pops: upperClassPops,
        averageWage: Math.round(baseWageFloor * 2.85),
        livingStandard: Number(Math.min(50.0, sol * 1.85).toFixed(1)),
        taxBurden: Number((incomeTax * 1.25 + corporateTax * 0.4).toFixed(3)),
        unemploymentRate: Number(Math.max(0, unemploymentRate * 0.3).toFixed(4)),
        capitalIncomeShare: Number(Math.min(0.75, 0.35 + (1 - workerShareOfGdp) * 0.4).toFixed(2)),
      },
    };

    const giniCoefficient = Number(
      Math.min(0.65, Math.max(0.24, 0.28 + (1 - workerShareOfGdp) * 0.24 + (1 - incomeTax) * 0.05)).toFixed(3)
    );
    const povertyRate = Number(Math.max(0.025, Math.min(0.60, (26 - sol) / 55)).toFixed(3));
    const institutionalTrust = Number(
      Math.max(
        0.1,
        Math.min(0.95, (nation.legitimacy ?? 75) / 100 - (inflationRate > 0.08 ? 0.15 : 0) - unemploymentRate * 0.5)
      ).toFixed(2)
    );
    const socialCohesion = Number(
      Math.max(0.1, Math.min(0.95, 0.90 - unemploymentRate * 0.6 - (1 - workerShareOfGdp) * 0.4)).toFixed(2)
    );

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
      stateBudgetPercent,
      govtDividends,
      tariffRevenues,
      totalExportTariffRevenues,
      totalImportTariffRevenues,
      totalExportsValue,
      totalImportsValue,
      stateIncome,
      stateContributions,
      federalContributions: 0, // Populated in planetary pass below
      stateExpenditures,
      diplomaticExpenses,
      netBudgetBalance,
      treasuryBalance: Number(nation.treasuryBalance) || 0,
      totalValuation,
      averageCompanyGrowth,
      crimePolicy,
      healthcarePolicy,
      servicesEvaluation: ["usa", "japan", "olympus"].includes(nation.id?.toLowerCase()) || nation.name === "USA"
        ? evaluateServicesProduction({
            endowment: {
              humanCapitalIndex: 84,
              urbanAgglomerationIndex: 86,
              financialDepthIndex: 92,
              digitalConnectivityIndex: 88,
              consumerAmenityIndex: 82,
            },
            employedLabor: Math.round(totalEmployed * 0.76),
            baseWage: (quarterlyWages * 4) || 64000,
            sol,
            crimeRate,
          })
        : null,
    };
    nation.computed.forecast = computeGdpForecast(nation, state);
  }

  // 9. Step D: Planetary / Federation Summaries (Earth, Mars, etc.)
  const planetsMap = new Map();
  for (const nation of state.nations || []) {
    const pName = nation.planet || "Earth";
    if (!planetsMap.has(pName)) {
      planetsMap.set(pName, []);
    }
    planetsMap.get(pName).push(nation);
  }

  const planetsSummary = [];
  for (const [planetName, pNations] of planetsMap.entries()) {
    let agGdp = 0,
      indGdp = 0,
      hospGdp = 0,
      offGdp = 0,
      totPops = 0,
      totEmp = 0;
    let weightedUnemp = 0,
      weightedSol = 0,
      weightedCrime = 0,
      weightedUrb = 0,
      weightedMort = 0,
      weightedFert = 0;
    let sumLit = 0,
      sumImm = 0,
      sumInfra = 0,
      sumWages = 0;
    let totNetBudget = 0,
      totTreasury = 0,
      totValuation = 0;

    for (const n of pNations) {
      const c = n.computed;
      const pops = c.effectiveWorkingPops;
      agGdp += c.agriculturalGdp;
      indGdp += c.industryGdp;
      hospGdp += c.hospitalityGdp;
      offGdp += c.officeGdp;
      totPops += pops;
      totEmp += c.totalEmployed;
      weightedUnemp += c.unemploymentRate * pops;
      weightedSol += c.sol * pops;
      weightedCrime += c.crimeRate * pops;
      weightedUrb += c.urbanisationIndex * pops;
      weightedMort += c.mortalityRate * pops;
      weightedFert += c.fertilityRate * pops;
      sumLit += c.literacyRate;
      sumImm += c.netImmigrationRate;
      sumInfra += c.infrastructureEfficiency;
      sumWages += c.quarterlyWages;
      totNetBudget += c.netBudgetBalance;
      totTreasury += c.treasuryBalance;
      totValuation += c.totalValuation;
    }

    const count = Math.max(1, pNations.length);
    const planetSol = totPops > 0 ? weightedSol / totPops : 0;

    let totalFedContributions = 0;
    let totalStateContributions = 0;
    for (const n of pNations) {
      const c = n.computed;
      c.federalContributions =
        planetSol > c.sol ? c.stateContributions * 2 : c.stateContributions * 0.5;
      c.netBudgetBalance =
        c.stateIncome + c.federalContributions - c.stateExpenditures + c.diplomaticExpenses;
      totalFedContributions += c.federalContributions;
      totalStateContributions += c.stateContributions;
    }

    planetsSummary.push({
      name: planetName,
      nationCount: pNations.length,
      agriculturalGdp: agGdp,
      industryGdp: indGdp,
      hospitalityGdp: hospGdp,
      officeGdp: offGdp,
      aggregateGdp: agGdp + indGdp + hospGdp + offGdp,
      workingPops: totPops,
      totalEmployed: totEmp,
      averageWages: sumWages / count,
      unemploymentRate: totPops > 0 ? weightedUnemp / totPops : 0,
      sol: planetSol,
      literacyRate: sumLit / count,
      crimeRate: totPops > 0 ? weightedCrime / totPops : 0,
      urbanisationIndex: totPops > 0 ? weightedUrb / totPops : 0,
      mortalityRate: totPops > 0 ? weightedMort / totPops : 0,
      fertilityRate: totPops > 0 ? weightedFert / totPops : 0,
      netImmigrationRate: sumImm / count,
      popGrowthRate:
        (totPops > 0 ? (weightedFert - weightedMort) / totPops : 0) + sumImm / count,
      infrastructureEfficiency: sumInfra / count,
      totalFedContributions,
      totalStateContributions,
      netBudgetBalance: totNetBudget,
      treasuryBalance: totTreasury,
      totalValuation: totValuation,
    });
  }

  // 10. Step E: Stock Exchange Accounts Valuation & Dividends
  const companyByNameAndHq = new Map();
  for (const nation of state.nations || []) {
    for (const comp of nation.companies || []) {
      const cName = (comp.name || comp.id || "").toLowerCase();
      const nName = (nation.name || nation.id || "").toLowerCase();
      if (cName) companyByNameAndHq.set(`${cName}__${nName}`, comp);
    }
  }

  for (const acc of state.stockAccounts || []) {
    let portfolioValue = 0;
    let quarterlyDividends = 0;
    for (const h of acc.holdings || []) {
      const key = `${(h.companyName || "").toLowerCase()}__${(h.hqCountry || "").toLowerCase()}`;
      const comp = companyByNameAndHq.get(key);
      if (comp) {
        // In Interstellar 2.0 Stock Exchange Accounts, Value = Share Price (or VGP if 1 unit = 100%)
        h.sharePrice = comp.sharePrice;
        h.companyValuation = comp.valuation;
        h.dividendsPerShare = comp.dividendsPerShare;
        h.holdingValue = h.units * comp.sharePrice;
        h.holdingDividends = h.units * Math.max(0, comp.dividendsPerShare);
        portfolioValue += h.holdingValue;
        quarterlyDividends += h.holdingDividends;
      } else {
        h.sharePrice = 0;
        h.holdingValue = 0;
        h.holdingDividends = 0;
      }
    }
    acc.portfolioValue = portfolioValue;
    acc.quarterlyDividends = quarterlyDividends;
  }

  // 11. Compute Time Manager derived cells (F2 Days Elapsed, F3 Quarter Number, F6 Date Diff)
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
  state.planetsSummary = planetsSummary;
  evaluateVictoriaMechanics(state);
  return state;
}

/**
 * Exact implementation of BudgetUpdater() + DividendUpdater() from Google Apps Script:
 * - Updates Treasury Balance: Amtremain(netBudgetBalance, treasuryBalance, "+")
 * - Updates Working Pops: Quarbalance2(workingPops, popGrowthRate) -> pop * (1 + popGrowthRate), fallback <= 30 -> 1 + companies.length
 * - Updates Company Employed Pops: MAX(1, emp * (1 + projectedRealGrowth))
 * - Updates Stock Exchange Accounts: divpot = divpot + dividends
 */
export function runBudgetAndDividendUpdater(state, randomizeHype = false) {
  evaluateSimulation(state);
  const sectorMap = new Map((state.sectorsConfig || []).map((s) => [s.name, s]));

  for (const nation of state.nations || []) {
    const c = nation.computed;
    if (!c) continue;

    // 0. Authoritative AI Macroeconomic Forecast Application
    const fc = computeGdpForecast(nation, state);
    c.forecast = fc;
    applyForecastGrowth(nation, fc);

    // 1. Amtremain(arr1, arr2, "+"): netBudgetBalance + treasuryBalance
    const netBudget = Number(c.netBudgetBalance) || 0;
    const prevTreasury = Number(nation.treasuryBalance) || 0;
    const nuevoTreasury = netBudget + prevTreasury;
    nation.treasuryBalance = Number.isNaN(nuevoTreasury) ? 1 : nuevoTreasury;

    // 2. Quarbalance2(poparr, popgrowarr): workingPops * (1 + popGrowthRate)
    const basePops =
      !state.strictSheetQuirks && nation.workingPops < c.totalEmployed
        ? c.effectiveWorkingPops
        : Number(nation.workingPops) || 0;
    const popGrowth = Number(c.popGrowthRate) || 0;
    const nuevoPops = basePops * (1 + popGrowth);
    if (Number.isNaN(nuevoPops) || nuevoPops <= 30) {
      nation.workingPops = 1 + (nation.companies?.length || 0);
    } else {
      nation.workingPops = Math.round(nuevoPops);
    }

    // 3. Market / Company Updater: emp_num = MAX(1, emp * (1 + empgrowth))
    const mMap = new Map((nation.market || []).map((m) => [m.goodName, m]));
    for (const comp of nation.companies || []) {
      const emp = Number(comp.employedPops) || 1;
      const empGrowth = Number(comp.projectedRealGrowth) || 0;
      const updatedEmp = emp * (1 + empGrowth);
      comp.employedPops =
        Number.isNaN(updatedEmp) || updatedEmp <= 1 ? 1 : Math.round(updatedEmp);

      if (randomizeHype) {
        const secCfg = sectorMap.get(comp.gdpSector);
        const secSent = secCfg ? Number(secCfg.sentiment) : 50;
        const mItem = mMap.get(comp.flagshipGood);
        const goodHype = mItem ? Number(mItem.hype) : 50;
        const consSent = Number(nation.consumerSentiment) || 50;
        const randPart = Math.floor(Math.random() * 25) + 1;
        comp.hypeFactor =
          randPart +
          (consSent / 100) * 25 +
          (secSent / 100) * 25 +
          (goodHype / 100) * 25;
      }
    }
  }

  // 4. DividendUpdater(): divpot.setValue(divpot.getValue() + dividends)
  for (const acc of state.stockAccounts || []) {
    const curPot = Number(acc.dividendPot) || 0;
    const divs = Number(acc.quarterlyDividends) || 0;
    acc.dividendPot = curPot + divs;
  }

  evaluateSimulation(state);
  return state;
}

/**
 * Astronomical and Proleptic Gregorian date arithmetic supporting all years from -500 BC to 3000 AD.
 * Solves V8 Date "Invalid Date" / RangeError when year is negative or outside 0000-9999.
 */
export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
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

/**
 * Implements Timer() + NuevoGDPManager() from the spreadsheet Apps Script:
 * - Timer() adds `daysToAdd` (default `interval / 60` per tick) to `C5` (crisisDate).
 * - NuevoGDPManager() checks if `date_diff < 3` (`F6 < 3`). When triggered, it advances `F4` (nextPaymentDate)
 *   by +90 days and executes `BudgetUpdater()` and `DividendUpdater()`.
 */
export function advanceSimulationTime(state, daysToAdd = 90, randomizeHype = false) {
  evaluateSimulation(state);

  const tm = state.timeManager;
  const prevDateStr = tm.crisisDate || tm.crisisStartDate || "2025-01-01";
  const targetDateStr = addDaysToSimDate(prevDateStr, daysToAdd);
  tm.crisisDate = targetDateStr;

  let nextPayDateStr = tm.nextPaymentDate || addDaysToSimDate(prevDateStr, 90);

  // Check NuevoGDPManager condition: (date_diff < 3)
  let quartersCrossed = 0;
  let dateDiff = diffSimDays(nextPayDateStr, targetDateStr);

  while (dateDiff < 3) {
    nextPayDateStr = addDaysToSimDate(nextPayDateStr, 90);
    tm.nextPaymentDate = nextPayDateStr;
    runBudgetAndDividendUpdater(state, randomizeHype);
    quartersCrossed++;
    dateDiff = diffSimDays(nextPayDateStr, targetDateStr);
  }

  processTimeTickVictoria(state, daysToAdd, prevDateStr, tm.crisisDate, quartersCrossed);
  state.version = (state.version || 0) + 1;
  evaluateSimulation(state);
  return { state, quartersCrossed };
}

