import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import {
  calculateSuperLinearAgglomeration,
  calculateConsumerServices,
  evaluateServicesProduction,
  evaluateStateServices,
} from "../server/servicesProductionEngine.js";
import {
  US_SERVICES_ENDOWMENTS,
  getUsStateServicesEndowment,
  ALL_US_SERVICE_CLUSTERS,
} from "../src/data/usServicesEndowments.js";
import { evaluateSimulation } from "../server/engine.js";

function loadSeedFile() {
  const raw = fs.readFileSync("scripts/interstellar_seed.json", "utf-8");
  return JSON.parse(raw);
}

describe("Services & Knowledge Economy Simulation Engine", () => {
  test("All 50 US States have complete 5-dimensional services endowments", () => {
    const states = Object.keys(US_SERVICES_ENDOWMENTS);
    assert.equal(states.length, 50, "Must have exactly 50 US states mapped");

    for (const [name, s] of Object.entries(US_SERVICES_ENDOWMENTS)) {
      assert.ok(s.code, `${name} must have a 2-letter state code`);
      assert.ok(typeof s.humanCapitalIndex === "number", `${name} must have humanCapitalIndex`);
      assert.ok(typeof s.urbanAgglomerationIndex === "number", `${name} must have urbanAgglomerationIndex`);
      assert.ok(typeof s.financialDepthIndex === "number", `${name} must have financialDepthIndex`);
      assert.ok(typeof s.digitalConnectivityIndex === "number", `${name} must have digitalConnectivityIndex`);
      assert.ok(typeof s.consumerAmenityIndex === "number", `${name} must have consumerAmenityIndex`);
      assert.ok(Array.isArray(s.primaryClusters), `${name} must have primaryClusters array`);
      assert.ok(s.servicesProfile?.techAndDefense, `${name} must have techAndDefense profile`);
      assert.ok(s.servicesProfile?.banking, `${name} must have banking profile`);
      assert.ok(s.servicesProfile?.hospitality, `${name} must have hospitality profile`);
      assert.ok(s.modeledServicesOutput, `${name} must have modeledServicesOutput`);
    }
  });

  test("Major economic hubs have high empirical domain scores", () => {
    const ny = getUsStateServicesEndowment("New York");
    assert.ok(ny.financialDepthIndex >= 95, "New York must have world-leading financial depth (Wall Street)");
    assert.ok(ny.urbanAgglomerationIndex >= 95, "New York must have highest urban agglomeration");

    const ca = getUsStateServicesEndowment("California");
    assert.ok(ca.humanCapitalIndex >= 90, "California must have top-tier human capital (Silicon Valley/Stanford/Caltech)");
    assert.ok(ca.digitalConnectivityIndex >= 95, "California must have highest digital infrastructure");

    const ma = getUsStateServicesEndowment("Massachusetts");
    assert.ok(ma.humanCapitalIndex >= 95, "Massachusetts must have highest human capital (Kendall Square/Harvard/MIT)");

    const nv = getUsStateServicesEndowment("Nevada");
    assert.ok(nv.consumerAmenityIndex >= 95, "Nevada must have top-tier consumer amenity / hospitality index (Las Vegas)");

    const nc = getUsStateServicesEndowment("North Carolina");
    assert.ok(nc.financialDepthIndex >= 80, "North Carolina must have high financial depth (Charlotte banking capital)");
  });

  test("Super-Linear Agglomeration exhibits increasing returns to scale (exponent 1.15)", () => {
    const baseDensity = calculateSuperLinearAgglomeration({
      humanCapital: 50,
      urbanAgglom: 50,
      financeDepth: 50,
      digitalConn: 50,
      labor: 1000000,
    });

    const highDensity = calculateSuperLinearAgglomeration({
      humanCapital: 50,
      urbanAgglom: 100, // Doubled agglomeration index
      financeDepth: 50,
      digitalConn: 50,
      labor: 1000000,
    });

    // 2^1.15 = ~2.2185 (> 2.0x, super-linear returns)
    const ratio = highDensity.agglomMultiplier / baseDensity.agglomMultiplier;
    assert.ok(ratio > 2.15 && ratio < 2.30, `Expected super-linear scaling ~2.22, got ${ratio.toFixed(3)}`);
    assert.equal(highDensity.superLinearExponent, 1.15);
  });

  test("Consumer services exhibit sub-linear elasticity and crime dampening", () => {
    const safeResult = calculateConsumerServices({
      consumerAmenity: 80,
      sol: 60,
      crimeRate: 10,
    });

    const crimeRiddenResult = calculateConsumerServices({
      consumerAmenity: 80,
      sol: 60,
      crimeRate: 60, // Severe crime penalty
    });

    assert.ok(
      safeResult.consumerOutput > crimeRiddenResult.consumerOutput,
      "Crime rate must dampen consumer and tourist services output"
    );
    assert.ok(safeResult.crimeDampening > crimeRiddenResult.crimeDampening);
    assert.equal(safeResult.subLinearExponent, 0.85);
  });

  test("Comprehensive evaluation partitions labor and identifies specializations", () => {
    const nyEndow = getUsStateServicesEndowment("New York");
    const evalNy = evaluateServicesProduction({
      endowment: nyEndow,
      employedLabor: 5000000,
      baseWage: 60000,
    });

    assert.ok(evalNy.totalServicesGdp > 0);
    assert.ok(evalNy.corporateGdpShare > evalNy.consumerGdpShare, "NY should be corporate/finance dominated");
    assert.ok(
      evalNy.specializations.some((s) => s.includes("Banking") || s.includes("Asset Management")),
      "NY specializations must include Banking"
    );

    const flEndow = getUsStateServicesEndowment("Florida");
    const evalFl = evaluateServicesProduction({
      endowment: flEndow,
      employedLabor: 5000000,
      baseWage: 48000,
    });

    assert.ok(
      evalFl.specializations.some((s) => s.includes("Hospitality") || s.includes("Tourism")),
      "Florida specializations must include Hospitality/Tourism"
    );
  });

  test("Grounded state services calibration matches empirical BEA data", () => {
    // Kansas: Target total GDP ~$224B, services ~70-72% = ~$155B - $165B
    const ks = evaluateStateServices("Kansas", 1500000, 224000000000);
    const ksServicesInBillions = ks.totalServicesGdp / 1e9;
    assert.ok(
      ksServicesInBillions >= 150 && ksServicesInBillions <= 170,
      `Kansas services GDP should be ~$155B-$165B, got $${ksServicesInBillions.toFixed(1)}B`
    );
    assert.ok(ks.clusters.length >= 2, "Kansas must have aerospace and healthcare clusters");

    // California: Target total GDP ~$4.0T, services ~72% = ~$2.8T - $3.0T
    const ca = evaluateStateServices("California", 18000000, 4000000000000);
    const caServicesInTrillions = ca.totalServicesGdp / 1e12;
    assert.ok(
      caServicesInTrillions >= 2.7 && caServicesInTrillions <= 3.1,
      `California services GDP should be ~$2.8T-$3.0T, got $${caServicesInTrillions.toFixed(2)}T`
    );

    // New York: Target total GDP ~$2.3T, services ~72% = ~$1.65T - $1.75T
    const ny = evaluateStateServices("New York", 9500000, 2300000000000);
    const nyServicesInTrillions = ny.totalServicesGdp / 1e12;
    assert.ok(
      nyServicesInTrillions >= 1.6 && nyServicesInTrillions <= 1.8,
      `New York services GDP should be ~$1.65T-$1.75T, got $${nyServicesInTrillions.toFixed(2)}T`
    );
  });

  test("ALL_US_SERVICE_CLUSTERS exposes key geographic metro coordinates", () => {
    assert.ok(ALL_US_SERVICE_CLUSTERS.length >= 100, "Should have 100+ prominent metro service clusters mapped");

    const siliconValley = ALL_US_SERVICE_CLUSTERS.find((c) => c.name.includes("Silicon Valley"));
    assert.ok(siliconValley, "Silicon Valley cluster must exist");
    assert.equal(siliconValley.stateCode, "CA");
    assert.equal(siliconValley.type, "tech");

    const wallStreet = ALL_US_SERVICE_CLUSTERS.find((c) => c.name.includes("Midtown Manhattan") || (c.name.includes("Wall Street") && c.stateCode === "NY"));
    assert.ok(wallStreet, "Wall Street & Midtown Manhattan cluster must exist");
    assert.equal(wallStreet.stateCode, "NY");
    assert.equal(wallStreet.type, "finance");

    const wichita = ALL_US_SERVICE_CLUSTERS.find((c) => c.name.includes("Wichita"));
    assert.ok(wichita, "Wichita Aerospace Engineering cluster must exist");
    assert.equal(wichita.stateCode, "KS");
  });

  test("Macroeconomic simulation in engine.js computes servicesEvaluation for USA", () => {
    const state = loadSeedFile();
    const evaluated = evaluateSimulation(state);
    const usa = evaluated.nations.find((n) => n.name === "USA" || n.id === "usa");
    assert.ok(usa?.computed?.servicesEvaluation, "USA must have servicesEvaluation in computed");

    const srv = usa.computed.servicesEvaluation;
    assert.ok(srv.totalServicesGdp > 0, "USA services GDP must be positive");
    assert.ok(srv.corporateGdpShare > 0.5, "US services should be corporate/knowledge dominant");
    assert.ok(srv.corporate.compoundAgglomeration > 1.0, "Agglomeration multiplier must exceed 1.0");
  });
});
