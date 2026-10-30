/**
 * Imperium Solutions — Geographic Factor & Industrial/Agricultural Production Engine
 * Evaluates the trained Gradient Boosting decision tree ensembles and empirical geographic
 * factors linking natural endowments to state-level and aggregate commodity production.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, "..", "public", "models", "geographic_production_v1.json");

let cachedGeographicModel = null;

export function loadGeographicProductionModel() {
  if (cachedGeographicModel) return cachedGeographicModel;
  try {
    if (fs.existsSync(MODEL_PATH)) {
      cachedGeographicModel = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
      return cachedGeographicModel;
    }
  } catch (err) {
    console.warn("Could not load geographic_production_v1.json:", err.message);
  }

  // Fallback heuristic model
  return {
    metadata: {
      model_version: "1.0.0-heuristic",
      elasticity_multipliers: {
        hydrocarbon_to_extractive: 0.42,
        mineral_to_extractive: 0.35,
        arable_to_agricultural: 0.62,
        waterway_to_logistics_throughput: 0.28,
        capital_to_heavy_manufacturing: 0.58,
      }
    },
    ensembles: null
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
 * Evaluates a single target ensemble prediction ($ Billions).
 */
export function predictTargetEnsemble(ensembleData, featureMap, fallbackBase = 10.0) {
  if (!ensembleData || !Array.isArray(ensembleData.trees)) {
    return fallbackBase;
  }

  const { init_value, learning_rate, trees } = ensembleData;
  let score = Number(init_value) || 0;
  const lr = Number(learning_rate) || 0.08;

  for (let i = 0; i < trees.length; i++) {
    score += lr * evaluateTree(trees[i], featureMap);
  }

  return Math.max(0, score);
}

/**
 * Evaluates geographic factor production outputs for a state or region based on its endowments.
 */
export function evaluateGeographicProduction(endowments, capitalStock = 65, extractiveLabor = 2.0, agriLabor = 2.5, infraEff = 0.90) {
  const model = loadGeographicProductionModel();
  const ensembles = model.ensembles || {};

  const featureMap = {
    hydrocarbon_endowment: Number.isFinite(Number(endowments?.hydrocarbonIndex)) ? Number(endowments.hydrocarbonIndex) : 0,
    mineral_endowment: Number.isFinite(Number(endowments?.mineralIndex)) ? Number(endowments.mineralIndex) : 0,
    arable_land_endowment: Number.isFinite(Number(endowments?.arableLandIndex)) ? Number(endowments.arableLandIndex) : 0,
    waterway_logistics_endowment: Number.isFinite(Number(endowments?.logisticsWaterwayIndex)) ? Number(endowments.logisticsWaterwayIndex) : 0,
    industrial_capital_stock: Number(capitalStock) || 65,
    extractive_labor_share: Number(extractiveLabor) || 2.0,
    agricultural_labor_share: Number(agriLabor) || 2.5,
    infrastructure_efficiency: Number(infraEff) || 0.90,
  };

  const miningExtractiveGdp = predictTargetEnsemble(
    ensembles.mining_extractive_gdp,
    featureMap,
    15.0 + featureMap.hydrocarbon_endowment * 0.4
  );

  const heavyManufacturingGdp = predictTargetEnsemble(
    ensembles.heavy_manufacturing_gdp,
    featureMap,
    20.0 + featureMap.industrial_capital_stock * 0.6
  );

  const agriculturalProductionGdp = predictTargetEnsemble(
    ensembles.agricultural_production_gdp,
    featureMap,
    5.0 + featureMap.arable_land_endowment * 0.3
  );

  const totalCommodityOutput = miningExtractiveGdp + heavyManufacturingGdp + agriculturalProductionGdp;

  return {
    featureMap,
    outputs: {
      miningExtractiveGdp: Number(miningExtractiveGdp.toFixed(2)),
      heavyManufacturingGdp: Number(heavyManufacturingGdp.toFixed(2)),
      agriculturalProductionGdp: Number(agriculturalProductionGdp.toFixed(2)),
      totalCommodityOutput: Number(totalCommodityOutput.toFixed(2)),
    },
    resourceMultipliers: {
      domesticSupplyBuffer: Math.min(1.25, 1.0 + (featureMap.hydrocarbon_endowment + featureMap.mineral_endowment) / 800),
      foodSecurityIndex: Math.min(1.30, 1.0 + featureMap.arable_land_endowment / 400),
      freightFrictionReduction: Math.min(0.20, featureMap.waterway_logistics_endowment / 500),
    }
  };
}

