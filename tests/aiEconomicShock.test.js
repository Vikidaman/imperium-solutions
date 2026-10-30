import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  simulateEconomicShock,
  applyEconomicShockToState,
  restoreEconomicShock,
} from "../server/aiEconomicAdvisor.js";
import { evaluateSimulation } from "../server/engine.js";
import { getUsStateEndowment } from "../src/data/usGeographicEndowments.js";
import { getUsStateServicesEndowment } from "../src/data/usServicesEndowments.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadTestState() {
  const seedRaw = readFileSync(path.join(__dirname, "../public/seeds/interstellar_seed.json"), "utf8");
  const state = JSON.parse(seedRaw);
  return evaluateSimulation(state);
}

describe("Groq AI Macroeconomic Shock & Disaster Engine", () => {
  test("applyEconomicShockToState applies Katrina port destruction, throttles freight, and reduces goods GDP", () => {
    const state = loadTestState();
    const usaNation = state.nations.find((n) => n.name === "USA");
    assert.ok(usaNation, "USA nation must exist");

    // Baseline checks
    const baseLouisianaEndow = getUsStateEndowment("Louisiana");
    assert.equal(baseLouisianaEndow.logisticsWaterwayIndex, 98);
    assert.equal(baseLouisianaEndow.hydrocarbonIndex, 92);

    const preGdp = usaNation.computed.aggregateGdp;
    const preGoodsGdp =
      (usaNation.computed.industryGdp || 0) +
      (usaNation.computed.agriculturalGdp || 0);

    assert.ok(preGdp > 20e12, "Pre-shock US GDP must be modern baseline (> $20T)");
    assert.ok(preGoodsGdp > 0, "Pre-shock goods GDP must be positive");

    // Mock Katrina Shock Object
    const mockKatrinaShock = {
      headline: "CATEGORY 5 HURRICANE KATRINA SLAMS LOUISIANA GULF PORTS",
      category: "NATURAL_DISASTER",
      severity: "CATASTROPHIC",
      sitrep: "Catastrophic storm surge flooded Port of New Orleans and damaged offshore rigs.",
      affectedStates: [
        {
          stateName: "Louisiana",
          logisticsWaterwayIndexDelta: -70,
          hydrocarbonIndexDelta: -40,
          arableLandIndexDelta: -25,
          consumerAmenityIndexDelta: -60,
          urbanAgglomerationIndexDelta: -35,
          reason: "Port of New Orleans and lower Mississippi deepwater berths flooded",
        },
        {
          stateName: "Mississippi",
          logisticsWaterwayIndexDelta: -40,
          consumerAmenityIndexDelta: -50,
          reason: "Gulfport terminal damage and coastal flooding",
        },
      ],
      macroMutations: {
        freightDelayFriction: 2.5,
        infraDisruptionPenalty: 0.15,
        consumerSentimentDelta: -16,
        emergencyReliefCost: 85000000000,
        impactedGoods: [
          {
            goodName: "Refined Petroleum Products",
            freightDelayFriction: 3.2,
            priceImpactFactor: 1.45,
            ddMultiplierChange: -0.25,
          },
          {
            goodName: "Grain & Cereals",
            freightDelayFriction: 2.8,
            priceImpactFactor: 1.30,
            ddMultiplierChange: -0.20,
          },
        ],
      },
      recommendedAction: "Authorize Army Corps emergency dredging and disburse $85B relief.",
    };

    const result = applyEconomicShockToState(state, mockKatrinaShock);
    assert.equal(result.success, true);
    assert.ok(result.beforeAfterDiff);

    // Verify state endowments reflect the disaster
    const postLouisianaEndow = getUsStateEndowment("Louisiana", state.customStateEndowments);
    assert.equal(postLouisianaEndow.logisticsWaterwayIndex, 28, "Louisiana port index should drop from 98 to 28");
    assert.equal(postLouisianaEndow.hydrocarbonIndex, 52, "Louisiana hydrocarbon index should drop from 92 to 52");
    assert.equal(postLouisianaEndow.isDisrupted, true);

    const postLaServices = getUsStateServicesEndowment("Louisiana", state.customStateEndowments);
    assert.equal(postLaServices.consumerAmenityIndex, 32, "Hospitality & amenities should plummet during disaster");

    // Verify macroeconomic goods contraction
    const postGoodsGdp =
      (usaNation.computed.industryGdp || 0) +
      (usaNation.computed.agriculturalGdp || 0);

    assert.ok(
      postGoodsGdp < preGoodsGdp,
      `Goods GDP must decrease under freight delay & port destruction (Pre: $${(preGoodsGdp/1e9).toFixed(1)}B, Post: $${(postGoodsGdp/1e9).toFixed(1)}B)`
    );

    assert.ok(
      result.beforeAfterDiff.goodsPctChange < 0,
      `Goods GDP percent change must be negative (got ${result.beforeAfterDiff.goodsPctChange.toFixed(2)}%)`
    );

    // Verify news feed was logged
    const news = state.victoriaState?.newsFeed || [];
    assert.ok(
      news.some((n) => n.headline.includes("CATEGORY 5 HURRICANE KATRINA")),
      "Breaking disaster crisis must appear in Statecraft newsfeed"
    );

    // Verify recovery restoration
    const restoreResult = restoreEconomicShock(state);
    assert.equal(restoreResult.success, true);

    const restoredLouisiana = getUsStateEndowment("Louisiana", state.customStateEndowments);
    assert.equal(restoredLouisiana.logisticsWaterwayIndex, 98, "Restored port index should return to 98");
    assert.equal(restoredLouisiana.hydrocarbonIndex, 92, "Restored oil/gas index should return to 92");

    const restoredGoodsGdp =
      (usaNation.computed.industryGdp || 0) +
      (usaNation.computed.agriculturalGdp || 0);

    assert.ok(
      Math.abs(restoredGoodsGdp - preGoodsGdp) < 1e9,
      "Restored goods GDP should match pre-shock baseline within floating rounding"
    );
  });

  test("Groq AI simulateEconomicShock parses natural language disaster prompt into calibrated mutations", async () => {
    if (!process.env.GROQ_API_KEY) {
      console.log("Skipping live Groq API test (GROQ_API_KEY not in environment)");
      return;
    }

    const prompt =
      "Simulate the impact of Hurricane Katrina slamming the Gulf Coast, destroying the Port of New Orleans and damaging Louisiana oil refineries";

    let sim;
    try {
      sim = await simulateEconomicShock({
        prompt,
        nationName: "USA",
        selectedStateName: "Louisiana",
      });
    } catch (err) {
      if (err.message?.includes("ENOTFOUND") || err.cause?.code === "ENOTFOUND" || err.message?.includes("fetch failed")) {
        console.log("Skipping live Groq API test (api.groq.com unreachable / offline sandbox environment)");
        return;
      }
      throw err;
    }

    assert.equal(sim.success, true);
    assert.ok(sim.shockResult);
    const shock = sim.shockResult;

    assert.ok(shock.headline, "Must have dramatic headline");
    assert.ok(shock.sitrep, "Must have situation report");
    assert.ok(Array.isArray(shock.affectedStates), "Must have affectedStates list");

    const la = shock.affectedStates.find(
      (s) => s.stateName.toLowerCase().includes("louisiana") || s.stateName.toLowerCase().includes("la")
    );
    assert.ok(la, "Louisiana must be identified as an affected state");
    assert.ok(
      la.logisticsWaterwayIndexDelta <= -20,
      `Port/waterways index delta must drop substantially (got ${la.logisticsWaterwayIndexDelta})`
    );

    assert.ok(
      shock.macroMutations.freightDelayFriction >= 1.2,
      `Freight delay friction should increase above 1.0 (got ${shock.macroMutations.freightDelayFriction})`
    );
  });
});
