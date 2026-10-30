/**
 * Imperium Solutions — Groq AI Economic Advisor & Simulation Intelligence Engine
 * Powered by Groq ultra-fast LLM inference (openai/gpt-oss-120b & qwen/qwen3.8-27b).
 *
 * Integrates empirical commodity pricing from Hugging Face / World Bank Pink Sheet
 * with state-level geographic natural endowments to generate real-time economic intelligence.
 */

import { COMMODITY_PRICE_BENCHMARKS } from "./empiricalPriceCatalog.js";
import { getUsStateServicesEndowment } from "../src/data/usServicesEndowments.js";
import { evaluateSimulation } from "./engine.js";

const DEFAULT_GROQ_API_KEY =
  (typeof process !== "undefined" && process.env?.GROQ_API_KEY) || "";
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.8-27b";

function getPriceBenchmarks() {
  return { benchmarks: COMMODITY_PRICE_BENCHMARKS };
}

/**
 * Calls Groq chat completion API with automatic model fallback and JSON format support.
 */
async function callGroqChat(messages, options = {}) {
  const model = options.model || PRIMARY_MODEL;
  const apiKey = options.apiKey || DEFAULT_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 1000,
  };

  if (options.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Groq model ${model} failed (${res.status}): ${errText}`);
      if (model !== FALLBACK_MODEL) {
        console.log(`Falling back to ${FALLBACK_MODEL}...`);
        return callGroqChat(messages, { ...options, model: FALLBACK_MODEL, apiKey });
      }
      throw new Error(`Groq API error: ${res.statusText} (${res.status}) - ${errText}`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";
    return {
      content,
      modelUsed: json.model || model,
      usage: json.usage,
    };
  } catch (err) {
    if (model !== FALLBACK_MODEL) {
      console.log(`Retrying with fallback model ${FALLBACK_MODEL} due to:`, err.message);
      return callGroqChat(messages, { ...options, model: FALLBACK_MODEL, apiKey });
    }
    throw err;
  }
}

/**
 * Generates AI economic advisory for a nation or constituent state.
 */
export async function generateEconomicAdvisory({ nationName = "USA", stateName, stateData, endowments, topic = "general", apiKey = null }) {
  const benchmarks = getPriceBenchmarks();
  const samplePrices = [
    `Crude Oil: $${benchmarks.benchmarks?.["Crude Oil"]?.real_world_price || 82.70}/bbl`,
    `Natural Gas: $${benchmarks.benchmarks?.["Natural Gas"]?.real_world_price || 2.77}/MMBtu`,
    `Wheat/Grain (HRW): $${benchmarks.benchmarks?.["Grain"]?.real_world_price || 330.00}/mt`,
    `Copper: $${benchmarks.benchmarks?.["Copper"]?.real_world_price || 14326.00}/mt`,
    `Iron Ore: $${benchmarks.benchmarks?.["Iron Ore"]?.real_world_price || 96.30}/dmtu`,
    `Gold: $${benchmarks.benchmarks?.["Gold & Precious Metals"]?.real_world_price || 2650.00}/oz`,
  ].join(", ");

  let systemPrompt = `You are the Chief AI Economic Strategist for the Imperium Solutions sovereign economic simulator.
Your economic models are rigorously grounded in empirical data from the World Bank Pink Sheet, Bureau of Economic Analysis (BEA), USGS, EIA, and USDA.
Current Benchmark Commodity Spot Prices: ${samplePrices}.
Target National GDP scale: United States ~ $28.0 Trillion annual GDP.
Constituent state GDPs must strictly align with empirical BEA shares (e.g. Kansas at ~0.8% share = $224 Billion, California at 14.2% = $3.98 Trillion, Texas at 9.4% = $2.63 Trillion).
Never invent fictional quadrillion-dollar GDP numbers. Always provide concise, mathematically sound, high-impact economic strategy.`;

  let userPrompt = "";
  if (stateName && endowments) {
    const srvEndow = getUsStateServicesEndowment(stateName);
    userPrompt = `Analyze the constituent state of ${stateName} (${nationName}).
Geographic Resource Endowments:
- Hydrocarbons / Energy Index: ${endowments.hydrocarbonIndex}%
- Critical Minerals Index: ${endowments.mineralIndex}%
- Arable Land / Agriculture Index: ${endowments.arableLandIndex}%
- Marine Logistics / Waterways Index: ${endowments.logisticsWaterwayIndex}%
Primary Basins: ${JSON.stringify(endowments.primaryBasins || [])}
Modeled Physical Production: Industrial: ${endowments.modeledIndustrialOutput || "N/A"}, Agriculture: ${endowments.modeledAgriculturalOutput || "N/A"}

Services & Knowledge Economy Endowments:
- Human Capital Index (STEM/R&D): ${srvEndow?.humanCapitalIndex ?? 50}%
- Urban Agglomeration Index (Metropolitan Density): ${srvEndow?.urbanAgglomerationIndex ?? 50}%
- Financial Depth Index (Commercial Banking & VC): ${srvEndow?.financialDepthIndex ?? 50}%
- Digital Infrastructure (Data Centers & Fiber): ${srvEndow?.digitalConnectivityIndex ?? 50}%
- Consumer Amenities (Tourism & Hospitality): ${srvEndow?.consumerAmenityIndex ?? 50}%
Key Service Clusters: ${JSON.stringify(srvEndow?.primaryClusters || [])}
Modeled Services Output: ${srvEndow?.modeledServicesOutput || "N/A"}

Regional Role: ${stateData?.role || endowments.region || "Constituent State"}
Estimated State GDP: $${stateData?.gdp ? (stateData.gdp / 1e9).toFixed(1) + "B" : "Grounded Share"}

Provide an executive advisory covering:
1. Economic Engine & Natural Advantages: How its geology and geography link to real commodity markets.
2. Services & Knowledge Economy Strategy: How to maximize urban agglomeration, STEM talent, financial capital, and consumer hospitality.
3. Value-Added Manufacturing & High-Tech Potential: Synergies between raw materials and service/tech industries.
4. Statecraft & Infrastructure Priority: Recommended capital and policy investments.`;
  } else {
    userPrompt = `Provide a macroeconomic statecraft assessment for ${nationName}.
Focus on:
1. Strategic commodity balances and supply chain self-sufficiency.
2. Taylor Rule monetary policy and price stability.
3. Priority industrial policy to maximize national GDP growth sustainably.`;
  }

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const result = await callGroqChat(messages, { temperature: 0.35, max_tokens: 650, apiKey });
  return {
    success: true,
    target: stateName ? `${stateName}, ${nationName}` : nationName,
    advisory: result.content,
    model: result.modelUsed,
    usage: result.usage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Normalizes index deltas returned by LLMs (handles decimal fractions like -0.7 vs integer -70).
 */
function normalizeDelta(val) {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const num = Number(val);
  if (num === 0) return 0;
  // If the model gave a fractional value like -0.75, scale to percentage points (-75)
  if (Math.abs(num) <= 1.0) {
    return Math.max(-100, Math.min(0, Math.round(num * 100)));
  }
  // If already in percentage scale (e.g. -70)
  return Math.max(-100, Math.min(0, Math.round(num)));
}

/**
 * Groq AI Economic Shock & Crisis Engine.
 * Translates natural language disaster / geopolitical event prompts into structured, calibrated JSON mutations.
 */
export async function simulateEconomicShock({
  prompt,
  state = null,
  nationName = "USA",
  selectedStateName = null,
  apiKey = null,
}) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A description of the disaster or economic shock prompt is required.");
  }

  const systemPrompt = `You are the Chief Macroeconomic Crisis & Shock Simulator for the Imperium Solutions sovereign economic engine.
You parse natural language descriptions of real or hypothetical crises (e.g. Category 5 Hurricane Katrina slamming Louisiana, OPEC oil embargoes, severe Mississippi River droughts, cyberattacks on the power grid, or West Coast port strikes) and determine their precise quantitative destruction on physical infrastructure, freight bottlenecks, and industrial output.

You must respond with a strictly valid JSON object adhering to this schema:
{
  "headline": "Brief dramatic breaking crisis headline in ALL CAPS (e.g. CATEGORY 5 HURRICANE KATRINA DEVASTATES GULF PORTS & REFINERIES)",
  "category": "NATURAL_DISASTER" | "ENERGY_CRISIS" | "SUPPLY_CHAIN_BOTTLENECK" | "CYBER_ATTACK" | "WAR_BLOCKADE" | "AGRICULTURAL_SHOCK",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CATASTROPHIC",
  "sitrep": "A concise 2-3 sentence strategic situation report detailing physical destruction of ports, refinery outages, blocked shipping lanes, and severed logistics.",
  "affectedStates": [
    {
      "stateName": "Name of US state (e.g. Louisiana, Texas, Mississippi, California, etc.)",
      "logisticsWaterwayIndexDelta": -100 to 0 (percentage point drop in port/waterway capacity, e.g. -70 for destroyed Gulf ports),
      "hydrocarbonIndexDelta": -100 to 0 (percentage point drop in oil/gas refining, e.g. -40 for flooded refineries),
      "arableLandIndexDelta": -100 to 0 (percentage point drop in agricultural yield, e.g. -25 for flooded farmlands),
      "mineralIndexDelta": -100 to 0,
      "humanCapitalIndexDelta": -100 to 0,
      "urbanAgglomerationIndexDelta": -100 to 0 (metropolitan evacuation / density loss, e.g. -35),
      "financialDepthIndexDelta": -100 to 0,
      "digitalConnectivityIndexDelta": -100 to 0 (telecom outages),
      "consumerAmenityIndexDelta": -100 to 0 (tourism and hospitality destruction, e.g. -60),
      "reason": "Clear explanation of localized damage (e.g. Storm surge flooded Port of New Orleans and Mississippi River berths)"
    }
  ],
  "macroMutations": {
    "freightDelayFriction": 1.0 to 5.0 (multiplier on freight transit duration due to port closure and rerouted rail/trucking. Baseline is 1.0; 2.5 means 2.5x slower transit),
    "infraDisruptionPenalty": 0.0 to 0.40 (fractional national infrastructure disruption penalty, e.g. 0.15 for 15% physical disruption),
    "consumerSentimentDelta": -50 to 0 (drop in consumer confidence points, e.g. -15),
    "emergencyReliefCost": 1000000000 to 200000000000 (dollar amount in emergency relief / FEMA funding disbursed from treasury, e.g. 75000000000 for $75B),
    "impactedGoods": [
      {
        "goodName": "Refined Petroleum Products" | "Grain & Cereals" | "Chemical Precursors" | "Microchips & High-Tech Components" | "Industrial Machinery" | "Automotive & Transit" | "Consumer Packaged Goods",
        "freightDelayFriction": 1.2 to 4.5,
        "priceImpactFactor": 1.05 to 1.80 (multiplier on commodity spot price due to supply shock, e.g. 1.45 is +45%),
        "ddMultiplierChange": -0.40 to 0.0 (domestic demand destruction / factory curtailment)
      }
    ]
  },
  "recommendedAction": "Concise sovereign executive directive (e.g. Authorize Army Corps of Engineers port dredging, release Strategic Petroleum Reserve, issue emergency relief bonds)."
}`;

  const userPrompt = `Simulate the following crisis event prompt in JSON:
"${prompt.trim()}"

Target Nation: ${nationName}
${selectedStateName ? `Primary Epicenter State: ${selectedStateName}` : ""}
Remember: For goods-based industries (Manufacturing and Agriculture), destroyed marine ports and logistics waterways directly bottleneck freight throughput and lower GDP output. Respond with the required JSON object.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const result = await callGroqChat(messages, {
    temperature: 0.25,
    max_tokens: 1100,
    jsonMode: true,
    apiKey,
  });

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch (err) {
    // If wrapped in markdown ```json ... ```
    const match = result.content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Failed to parse Groq AI response as JSON: ${result.content}`);
    }
  }

  // Normalize deltas
  if (Array.isArray(parsed.affectedStates)) {
    parsed.affectedStates = parsed.affectedStates.map((st) => ({
      ...st,
      logisticsWaterwayIndexDelta: normalizeDelta(st.logisticsWaterwayIndexDelta),
      hydrocarbonIndexDelta: normalizeDelta(st.hydrocarbonIndexDelta),
      arableLandIndexDelta: normalizeDelta(st.arableLandIndexDelta),
      mineralIndexDelta: normalizeDelta(st.mineralIndexDelta),
      humanCapitalIndexDelta: normalizeDelta(st.humanCapitalIndexDelta),
      urbanAgglomerationIndexDelta: normalizeDelta(st.urbanAgglomerationIndexDelta),
      financialDepthIndexDelta: normalizeDelta(st.financialDepthIndexDelta),
      digitalConnectivityIndexDelta: normalizeDelta(st.digitalConnectivityIndexDelta),
      consumerAmenityIndexDelta: normalizeDelta(st.consumerAmenityIndexDelta),
    }));
  }

  // Ensure macro mutations are safe numbers
  if (!parsed.macroMutations) {
    parsed.macroMutations = {};
  }
  parsed.macroMutations.freightDelayFriction = Math.max(1.0, Math.min(6.0, Number(parsed.macroMutations.freightDelayFriction) || 1.8));
  parsed.macroMutations.infraDisruptionPenalty = Math.max(0.0, Math.min(0.5, Number(parsed.macroMutations.infraDisruptionPenalty) || 0.1));
  parsed.macroMutations.consumerSentimentDelta = Math.max(-50, Math.min(0, Number(parsed.macroMutations.consumerSentimentDelta) || -10));
  parsed.macroMutations.emergencyReliefCost = Math.max(0, Number(parsed.macroMutations.emergencyReliefCost) || 25000000000);

  return {
    success: true,
    shockResult: parsed,
    model: result.modelUsed,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Applies a structured economic shock mutation to an active simulation state,
 * triggers re-evaluation, logs the breaking crisis newsfeed event,
 * and calculates the quantitative macroeconomic before/after delta.
 */
export function applyEconomicShockToState(state, shockResult) {
  if (!state || !shockResult) {
    throw new Error("Invalid state or shockResult passed to applyEconomicShockToState.");
  }

  const targetNation =
    (state.nations || []).find((n) => n.name === "USA" || n.id === "usa") ||
    state.nations?.[0];

  if (!targetNation) {
    throw new Error("No primary nation found in simulation state.");
  }

  // 1. Measure Pre-Shock Baseline & Save Recovery Backup
  const preGdp = targetNation.computed?.aggregateGdp ?? targetNation.computed?.gdp ?? 0;
  const preGoodsGdp =
    (targetNation.computed?.industryGdp ?? targetNation.computed?.sectorVgp?.["Industry & Manufacturing GDP"] ?? 0) +
    (targetNation.computed?.agriculturalGdp ?? targetNation.computed?.sectorVgp?.["Agricultural Sector GDP"] ?? 0);
  const preServicesGdp =
    targetNation.computed?.servicesEvaluation?.totalServicesGdp ||
    (targetNation.computed?.officeGdp ?? 0) + (targetNation.computed?.hospitalityGdp ?? 0);

  if (!state.preShockBackup) {
    state.preShockBackup = {
      nations: (state.nations || []).map((n) => ({
        id: n.id,
        consumerSentiment: n.consumerSentiment,
        infraDisruptionPenalty: n.infraDisruptionPenalty,
        freightDelayFriction: n.freightDelayFriction,
        market: (n.market || []).map((m) => ({
          goodName: m.goodName,
          ddMultiplier: m.ddMultiplier,
          freightDelayFriction: m.freightDelayFriction,
        })),
      })),
      goodsCatalog: (state.goodsCatalog || []).map((g) => ({
        name: g.name,
        freightDelayFriction: g.freightDelayFriction,
      })),
    };
  }

  // 2. Apply State-Level Resource & Services Endowments Disruption
  if (!state.customStateEndowments) {
    state.customStateEndowments = {};
  }

  const affected = shockResult.affectedStates || [];
  for (const st of affected) {
    if (!st.stateName) continue;
    state.customStateEndowments[st.stateName] = {
      logisticsWaterwayIndexDelta: st.logisticsWaterwayIndexDelta,
      hydrocarbonIndexDelta: st.hydrocarbonIndexDelta,
      arableLandIndexDelta: st.arableLandIndexDelta,
      mineralIndexDelta: st.mineralIndexDelta,
      humanCapitalIndexDelta: st.humanCapitalIndexDelta,
      urbanAgglomerationIndexDelta: st.urbanAgglomerationIndexDelta,
      financialDepthIndexDelta: st.financialDepthIndexDelta,
      digitalConnectivityIndexDelta: st.digitalConnectivityIndexDelta,
      consumerAmenityIndexDelta: st.consumerAmenityIndexDelta,
      isDisrupted: true,
      reason: st.reason || shockResult.headline,
      disruptedAt: new Date().toISOString(),
    };
  }

  // 3. Apply Macro Mutators (Freight Friction, Infra Disruption, Relief Spending)
  const macro = shockResult.macroMutations || {};
  if (macro.freightDelayFriction) {
    targetNation.freightDelayFriction = Number(macro.freightDelayFriction);
    state.globalFreightDelayFriction = Number(macro.freightDelayFriction);
  }
  if (macro.infraDisruptionPenalty) {
    targetNation.infraDisruptionPenalty = Number(macro.infraDisruptionPenalty);
  }
  if (macro.consumerSentimentDelta) {
    targetNation.consumerSentiment = Math.max(
      10,
      Math.min(100, (Number(targetNation.consumerSentiment) || 60) + Number(macro.consumerSentimentDelta))
    );
  }
  if (macro.emergencyReliefCost) {
    targetNation.treasuryBalance =
      (Number(targetNation.treasuryBalance) || 0) - Number(macro.emergencyReliefCost);
  }

  // 4. Mutate Impacted Goods in Catalog & Market
  if (Array.isArray(macro.impactedGoods)) {
    for (const ig of macro.impactedGoods) {
      if (!ig.goodName) continue;
      const gClean = ig.goodName.toLowerCase();
      // Catalog
      for (const catGood of state.goodsCatalog || []) {
        if (catGood.name.toLowerCase().includes(gClean) || gClean.includes(catGood.name.toLowerCase())) {
          if (ig.freightDelayFriction) catGood.freightDelayFriction = Number(ig.freightDelayFriction);
        }
      }
      // Market
      for (const mItem of targetNation.market || []) {
        if (mItem.goodName.toLowerCase().includes(gClean) || gClean.includes(mItem.goodName.toLowerCase())) {
          if (ig.freightDelayFriction) mItem.freightDelayFriction = Number(ig.freightDelayFriction);
          if (ig.ddMultiplierChange) {
            mItem.ddMultiplier = Math.max(0.2, (Number(mItem.ddMultiplier) || 1.0) + Number(ig.ddMultiplierChange));
          }
        }
      }
    }
  }

  // 5. Ingest Breaking News Item into Statecraft NewsFeed
  if (!state.victoriaState) {
    state.victoriaState = {};
  }
  if (!state.victoriaState.newsFeed) {
    state.victoriaState.newsFeed = [];
  }
  state.victoriaState.newsFeed.unshift({
    id: `crisis-${Date.now()}`,
    headline: `BREAKING: ${shockResult.headline}`,
    details: `${shockResult.sitrep} Action: ${shockResult.recommendedAction || "Federal emergency mobilized."}`,
    severity: shockResult.severity || "HIGH",
    category: "Emergency & Disaster",
    date: state.crisisDate || state.victoriaState?.currentDate || new Date().toISOString().split("T")[0],
    timestamp: Date.now(),
  });

  // 6. Save Active Shock Record on Session State
  state.activeEconomicShock = {
    ...shockResult,
    appliedAt: new Date().toISOString(),
  };

  // 7. Run Economic Simulation Evaluation
  evaluateSimulation(state);

  // 8. Measure Post-Shock Metrics & Quantitative Diff
  const postGdp = targetNation.computed?.aggregateGdp ?? targetNation.computed?.gdp ?? 0;
  const postGoodsGdp =
    (targetNation.computed?.industryGdp ?? targetNation.computed?.sectorVgp?.["Industry & Manufacturing GDP"] ?? 0) +
    (targetNation.computed?.agriculturalGdp ?? targetNation.computed?.sectorVgp?.["Agricultural Sector GDP"] ?? 0);
  const postServicesGdp =
    targetNation.computed?.servicesEvaluation?.totalServicesGdp ||
    (targetNation.computed?.officeGdp ?? 0) + (targetNation.computed?.hospitalityGdp ?? 0);

  const gdpDelta = postGdp - preGdp;
  const goodsGdpDelta = postGoodsGdp - preGoodsGdp;
  const servicesGdpDelta = postServicesGdp - preServicesGdp;

  const gdpPctChange = preGdp > 0 ? (gdpDelta / preGdp) * 100 : 0;
  const goodsPctChange = preGoodsGdp > 0 ? (goodsGdpDelta / preGoodsGdp) * 100 : 0;
  const servicesPctChange = preServicesGdp > 0 ? (servicesGdpDelta / preServicesGdp) * 100 : 0;

  return {
    success: true,
    shockResult,
    beforeAfterDiff: {
      preGdp,
      postGdp,
      gdpDelta,
      gdpPctChange,
      preGoodsGdp,
      postGoodsGdp,
      goodsGdpDelta,
      goodsPctChange,
      preServicesGdp,
      postServicesGdp,
      servicesGdpDelta,
      servicesPctChange,
      freightDelayFriction: macro.freightDelayFriction || 1.0,
      infraDisruptionPenalty: macro.infraDisruptionPenalty || 0.0,
      emergencyReliefCost: macro.emergencyReliefCost || 0,
      disruptedStatesCount: affected.length,
    },
  };
}

/**
 * Restores baseline state by removing custom disruptions, resetting freight friction to 1.0,
 * and re-evaluating the simulation.
 */
export function restoreEconomicShock(state) {
  if (!state) {
    throw new Error("Invalid state passed to restoreEconomicShock.");
  }

  state.customStateEndowments = {};
  state.globalFreightDelayFriction = 1.0;
  state.activeEconomicShock = null;

  if (state.preShockBackup) {
    const backupNations = new Map((state.preShockBackup.nations || []).map((n) => [n.id, n]));
    for (const nation of state.nations || []) {
      const b = backupNations.get(nation.id);
      if (b) {
        nation.consumerSentiment = b.consumerSentiment;
        nation.infraDisruptionPenalty = b.infraDisruptionPenalty || 0.0;
        nation.freightDelayFriction = b.freightDelayFriction || 1.0;
        const bMarket = new Map((b.market || []).map((m) => [m.goodName, m]));
        for (const mItem of nation.market || []) {
          const bm = bMarket.get(mItem.goodName);
          if (bm) {
            mItem.ddMultiplier = bm.ddMultiplier;
            mItem.freightDelayFriction = bm.freightDelayFriction || 1.0;
          } else {
            mItem.freightDelayFriction = 1.0;
          }
        }
      } else {
        nation.infraDisruptionPenalty = 0.0;
        nation.freightDelayFriction = 1.0;
        for (const mItem of nation.market || []) {
          mItem.freightDelayFriction = 1.0;
        }
      }
    }

    if (Array.isArray(state.preShockBackup.goodsCatalog)) {
      const bCat = new Map(state.preShockBackup.goodsCatalog.map((g) => [g.name, g]));
      for (const catGood of state.goodsCatalog || []) {
        const bg = bCat.get(catGood.name);
        if (bg && bg.freightDelayFriction !== undefined) {
          catGood.freightDelayFriction = bg.freightDelayFriction;
        } else {
          delete catGood.freightDelayFriction;
        }
      }
    }

    delete state.preShockBackup;
  } else {
    for (const nation of state.nations || []) {
      nation.infraDisruptionPenalty = 0.0;
      nation.freightDelayFriction = 1.0;
      for (const mItem of nation.market || []) {
        mItem.freightDelayFriction = 1.0;
      }
    }
    for (const catGood of state.goodsCatalog || []) {
      catGood.freightDelayFriction = 1.0;
    }
  }

  if (!state.victoriaState) {
    state.victoriaState = {};
  }
  if (!state.victoriaState.newsFeed) {
    state.victoriaState.newsFeed = [];
  }
  state.victoriaState.newsFeed.unshift({
    id: `recovery-${Date.now()}`,
    headline: `RECOVERY COMPLETED: Infrastructure & Ports Fully Restored`,
    details: "Federal reconstruction works have cleared waterway blockages and repaired energy logistics corridors.",
    severity: "LOW",
    category: "Reconstruction",
    date: state.crisisDate || state.victoriaState?.currentDate || new Date().toISOString().split("T")[0],
    timestamp: Date.now(),
  });

  evaluateSimulation(state);

  return {
    success: true,
    message: "Economic shock restored to baseline. All ports, freight friction, and endowments recovered.",
  };
}


