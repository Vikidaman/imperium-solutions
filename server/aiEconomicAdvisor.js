/**
 * Imperium Solutions — Groq AI Economic Advisor & Simulation Intelligence Engine
 * Powered by Groq ultra-fast LLM inference (openai/gpt-oss-120b & qwen/qwen3.8-27b).
 *
 * Integrates empirical commodity pricing from Hugging Face / World Bank Pink Sheet
 * with state-level geographic natural endowments to generate real-time economic intelligence.
 */

import "dotenv/config";
import { COMMODITY_PRICE_BENCHMARKS } from "./empiricalPriceCatalog.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const PRIMARY_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.8-27b";

function getPriceBenchmarks() {
  return { benchmarks: COMMODITY_PRICE_BENCHMARKS };
}

/**
 * Calls Groq chat completion API with automatic model fallback.
 */
async function callGroqChat(messages, options = {}) {
  const model = options.model || PRIMARY_MODEL;
  const payload = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 800,
  };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Groq model ${model} failed (${res.status}): ${errText}`);
      if (model !== FALLBACK_MODEL) {
        console.log(`Falling back to ${FALLBACK_MODEL}...`);
        return callGroqChat(messages, { ...options, model: FALLBACK_MODEL });
      }
      throw new Error(`Groq API error: ${res.statusText}`);
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
      return callGroqChat(messages, { ...options, model: FALLBACK_MODEL });
    }
    throw err;
  }
}

/**
 * Generates AI economic advisory for a nation or constituent state.
 */
export async function generateEconomicAdvisory({ nationName = "USA", stateName, stateData, endowments, topic = "general" }) {
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
    userPrompt = `Analyze the constituent state of ${stateName} (${nationName}).
Geographic Resource Endowments:
- Hydrocarbons / Energy Index: ${endowments.hydrocarbonIndex}%
- Critical Minerals Index: ${endowments.mineralIndex}%
- Arable Land / Agriculture Index: ${endowments.arableLandIndex}%
- Marine Logistics / Waterways Index: ${endowments.logisticsWaterwayIndex}%
Primary Basins: ${JSON.stringify(endowments.primaryBasins || [])}
Modeled Production: Industrial: ${endowments.modeledIndustrialOutput || "N/A"}, Agriculture: ${endowments.modeledAgriculturalOutput || "N/A"}
Regional Role: ${stateData?.role || endowments.region || "Constituent State"}
Estimated State GDP: $${stateData?.gdp ? (stateData.gdp / 1e9).toFixed(1) + "B" : "Grounded Share"}

Provide an executive advisory covering:
1. Economic Engine & Natural Advantages: How its geology and geography link to real commodity markets.
2. Value-Added Manufacturing Potential: Converting local feedstocks into high-value exports.
3. Statecraft & Infrastructure Priority: Recommended capital investments.`;
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

  const result = await callGroqChat(messages, { temperature: 0.35, max_tokens: 650 });
  return {
    success: true,
    target: stateName ? `${stateName}, ${nationName}` : nationName,
    advisory: result.content,
    model: result.modelUsed,
    usage: result.usage,
    timestamp: new Date().toISOString(),
  };
}

