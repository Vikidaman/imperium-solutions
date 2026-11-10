// United States Macroeconomic, Supply-Chain & 50-State Simulation Engine
import { US_STATES_CATALOG } from "../src/data/usStatesData.js";
import { SIMPLIFIED_60_GOODS, buildSimplifiedSeed } from "./simplifiedSeedConfig.js";
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

    const party = partyMap.get(nation.rulingParty) || defaultParty;

    const incomeTax =
      nation.incomeTaxOverride !== undefined && nation.incomeTaxOverride !== null
        ? Number(nation.incomeTaxOverride)
        : Number(party.incomeTaxPreference ?? 0.25);
    const salesTax =
      nation.salesTaxOverride !== undefined && nation.salesTaxOverride !== null
        ? Number(nation.salesTaxOverride)
        : Number(party.salesTaxPreference ?? 0.06);
    const corporateTax =
      nation.corporateTaxOverride !== undefined && nation.corporateTaxOverride !== null
        ? Number(nation.corporateTaxOverride)
        : Number(party.corporateTaxRate ?? 0.21);
    const workerShareOfGdp =
      nation.workerShareOverride !== undefined && nation.workerShareOverride !== null
        ? Number(nation.workerShareOverride)
        : Number(party.workerShareOfGdp ?? 0.52);
    const stateBudgetPercent =
      nation.budgetPercentOverride !== undefined && nation.budgetPercentOverride !== null
        ? Number(nation.budgetPercentOverride)
        : Number(party.budgetAsPercentOfGdp ?? 0.20);

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

    // --- Core Aggregate Demand (AD = C + I + G + NX) Determination ---
    // Potential Supply-Side GDP from 60-good Leontief Input-Output Network
    const baseSupplyGdp =
      sectorVgp["Agricultural Sector GDP"] +
      sectorVgp["Industry & Manufacturing GDP"] +
      sectorVgp["Hospitality & Tourist Services GDP"] +
      sectorVgp["Office & Corporate Services GDP"];

    // 1. Consumption (C) — Baseline weight 68% of GDP
    // Driven by disposable household labor income s_L*(1 - t_inc)*(1 - t_sales) and Consumer Sentiment
    const baselineDispShare = 0.55 * (1 - 0.28) * (1 - 0.06); // 0.37224
    const dispIncomeRatio = (workerShareOfGdp * (1 - incomeTax) * (1 - salesTax)) / baselineDispShare;
    const sentimentRatio = consumerSentiment / 65.0;
    const cIdx = Math.max(
      0.50,
      Math.min(1.65, 0.45 + 0.35 * dispIncomeRatio + 0.20 * Math.pow(sentimentRatio, 0.35))
    );
    const cShare = 0.68 * cIdx;

    // 2. Gross Private Domestic Investment (I) — Baseline weight 18% of GDP
    // Driven by after-tax corporate return (1 - s_L)*(1 - t_corp), interest rate, infrastructure, literacy, urbanisation
    const baselineCorpShare = (1 - 0.55) * (1 - 0.25); // 0.3375
    const profitRatio = ((1 - workerShareOfGdp) * (1 - corporateTax)) / baselineCorpShare;
    const rateIdx = 1 - (centralBankRate - 0.045) * 2.5;
    const structIdx =
      1 +
      (infrastructureEfficiency - 0.82) * 0.65 +
      (literacyRate - 0.92) * 0.45 +
      (urbanisationIndex - 0.83) * 0.30 -
      freightDelayFriction * 0.40;
    const iIdx = Math.max(
      0.35,
      Math.min(1.85, 0.35 * profitRatio + 0.25 * rateIdx + 0.40 * structIdx)
    );
    const iShare = 0.18 * iIdx;

    // 3. Government Purchases & Autonomous Spending (G) — Baseline weight 17% of GDP
    // Driven by federal expenditure rate (stateBudgetPercent) with Keynesian multiplier
    const gIdx = Math.max(
      0.30,
      Math.min(1.90, 0.30 + 0.70 * (stateBudgetPercent / 0.22))
    );
    const gShare = 0.17 * gIdx;

    // 4. Net Exports (NX = X - M) — Baseline weight -3% of GDP
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
      -0.18,
      Math.min(
        0.15,
        -0.03 +
          (infrastructureEfficiency - 0.82) * 0.08 -
          avgExportTariff * 0.25 -
          Math.max(0, avgImportTariff - 0.04) * 0.12 -
          freightDelayFriction * 0.12
      )
    );

    // Aggregate Demand Multiplier = C_share + I_share + G_share + NX_share (1.0000 at baseline)
    const adMultiplier = Math.max(0.40, Math.min(2.20, cShare + iShare + gShare + nxShare));
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

    const unemploymentRate =
      effectiveWorkingPops > 0
        ? Math.max(0, Math.min(1, 1 - totalEmployed / effectiveWorkingPops))
        : 0;

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

    const incomeTaxRevenue = quarterlyWages * effectiveWorkingPops * incomeTax;
    const salesTaxRevenue = salesTax * consumerSentiment * effectiveWorkingPops;
    const corporateTaxRevenue = aggregateGdp * (1 - workerShareOfGdp) * corporateTax;
    const tariffRevenues = totalExportTariffRevenues + totalImportTariffRevenues;

    const stateIncome =
      nation.stateIncome !== undefined
        ? Number(nation.stateIncome)
        : corporateTaxRevenue + salesTaxRevenue + incomeTaxRevenue + tariffRevenues;

    const federalCooperativity = Number(nation.federalCooperativity) || 0;
    const stateContributions =
      nation.stateContributions !== undefined
        ? Number(nation.stateContributions)
        : stateIncome * federalCooperativity;
    const stateExpenditures =
      nation.stateExpenditures !== undefined
        ? Number(nation.stateExpenditures)
        : stateBudgetPercent * aggregateGdp + stateContributions;
    const diplomaticExpenses = Number(nation.diplomaticExpenses) || 0;
    const federalContributions = stateContributions * 0.5;
    const netBudgetBalance =
      stateIncome + federalContributions - stateExpenditures + diplomaticExpenses;
    const netTradeBalance = totalExportsValue - totalImportsValue;

    const baseInflation =
      0.022 +
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
        Math.min(0.95, 0.78 - (inflationRate > 0.08 ? 0.15 : 0) - unemploymentRate * 0.5)
      ).toFixed(2)
    );
    const socialCohesion = Number(
      Math.max(0.1, Math.min(0.95, 0.90 - unemploymentRate * 0.6 - (1 - workerShareOfGdp) * 0.4)).toFixed(2)
    );

    const servicesEvaluation = evaluateServicesProduction({
      endowment: {
        humanCapitalIndex: 84,
        urbanAgglomerationIndex: 86,
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
      govtDividends: 0,
      tariffRevenues,
      importTariffRevenues: totalImportTariffRevenues,
      exportTariffRevenues: totalExportTariffRevenues,
      totalExportTariffRevenues,
      totalImportTariffRevenues,
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

export function runBudgetAndDividendUpdater(state) {
  evaluateSimulation(state);

  for (const nation of state.nations || []) {
    const c = nation.computed;
    if (!c) continue;

    const fc = computeGdpForecast(nation, state);
    c.forecast = fc;
    const annualGrowthPct = applyForecastGrowth(nation, fc);

    // Quarterly compounding factor from 1-Year GDP Growth Rate: (1 + g_annual / 100)^(1/4)
    const annualMultiplier = Math.max(0.5, 1 + annualGrowthPct / 100);
    const quarterlyTargetMultiplier = Math.pow(annualMultiplier, 0.25);

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

    const basePops =
      !state.strictSheetQuirks && nation.workingPops < c.totalEmployed
        ? c.effectiveWorkingPops
        : Number(nation.workingPops) || 168000000;
    const popGrowth = Number(c.popGrowthRate) || 0;
    const rawNuevoPops = basePops * (1 + popGrowth);
    const roundedNuevoPops =
      Number.isNaN(rawNuevoPops) || rawNuevoPops <= 30 ? 1000000 : Math.round(rawNuevoPops);
    nation.workingPops = roundedNuevoPops;

    // Adjust cumulativeGrowthFactor so (workingPops * cumulativeGrowthFactor) compounds by exactly quarterlyTargetMultiplier
    const actualPopRatio = basePops > 0 ? roundedNuevoPops / basePops : 1 + popGrowth;
    const prevCumFactor =
      Number.isFinite(Number(nation.cumulativeGrowthFactor)) && Number(nation.cumulativeGrowthFactor) > 0
        ? Number(nation.cumulativeGrowthFactor)
        : 1.0;
    nation.cumulativeGrowthFactor =
      prevCumFactor * (quarterlyTargetMultiplier / Math.max(0.5, actualPopRatio));
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
