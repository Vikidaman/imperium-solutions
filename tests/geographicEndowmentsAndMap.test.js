import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import {
  US_GEOGRAPHIC_ENDOWMENTS,
  getUsStateEndowment,
  ALL_US_RESOURCE_MARKERS,
} from "../src/data/usGeographicEndowments.js";
import { MAP_PROVIDERS } from "../src/data/mapProviders.js";
import { evaluateGeographicProduction } from "../server/geographicProductionEngine.js";
import { US_STATES_CATALOG } from "../src/data/usStatesData.js";
import { evaluateSimulation } from "../server/engine.js";

function loadSeedFile() {
  const raw = fs.readFileSync("scripts/interstellar_seed.json", "utf-8");
  return JSON.parse(raw);
}

describe("United States Geographic Endowments & Cartography", () => {
  test("US geographic endowments contain authoritative USGS/EIA/USDA data for key anchor states", () => {
    const texas = US_GEOGRAPHIC_ENDOWMENTS["Texas"];
    assert.ok(texas, "Texas endowments must exist");
    assert.equal(texas.code, "TX");
    assert.ok(
      texas.hydrocarbonIndex >= 90,
      "Texas must have high hydrocarbon index from Permian & Eagle Ford"
    );
    assert.ok(
      texas.primaryBasins.some((b) => b.name === "Permian Basin"),
      "Permian Basin must be mapped"
    );

    const california = US_GEOGRAPHIC_ENDOWMENTS["California"];
    assert.ok(california, "California endowments must exist");
    assert.ok(
      california.mineralIndex >= 80,
      "California must have high mineral index from Mountain Pass REE"
    );
    assert.ok(
      california.arableLandIndex >= 90,
      "California must have high arable land index from Central Valley"
    );

    const minnesota = US_GEOGRAPHIC_ENDOWMENTS["Minnesota"];
    assert.ok(minnesota, "Minnesota endowments must exist");
    assert.ok(
      minnesota.mineralIndex >= 90,
      "Minnesota must have high mineral index from Mesabi Iron Range"
    );

    const wyoming = US_GEOGRAPHIC_ENDOWMENTS["Wyoming"];
    assert.ok(wyoming, "Wyoming endowments must exist");
    assert.ok(
      wyoming.primaryBasins.some((b) => b.name === "Powder River Basin"),
      "Powder River Basin must be mapped"
    );

    const montana = US_GEOGRAPHIC_ENDOWMENTS["Montana"];
    assert.ok(montana, "Montana endowments must exist");
    assert.equal(montana.code, "MT");
    assert.equal(
      montana.arableLandIndex,
      85,
      "Montana must have high agricultural index (Golden Triangle grain, cattle)"
    );
    assert.equal(
      montana.mineralIndex,
      82,
      "Montana must have high mineral index (Stillwater Pt/Pd, Butte copper)"
    );
    assert.equal(
      montana.hydrocarbonIndex,
      35,
      "Montana has Bakken Elm Coulee / Bell Creek oil"
    );
    assert.equal(
      montana.logisticsWaterwayIndex,
      0,
      "Montana is landlocked with 0 port/waterway index"
    );
  });

  test("Strict zero baseline for absent resources across non-producing and landlocked states", () => {
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Minnesota"].hydrocarbonIndex,
      0,
      "Minnesota produces 0 crude/gas"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Vermont"].hydrocarbonIndex,
      0,
      "Vermont produces 0 crude/gas"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Iowa"].hydrocarbonIndex,
      0,
      "Iowa produces 0 crude/gas"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Hawaii"].hydrocarbonIndex,
      0,
      "Hawaii produces 0 crude/gas"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Nevada"].hydrocarbonIndex,
      0,
      "Nevada produces 0 crude/gas"
    );

    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Montana"].logisticsWaterwayIndex,
      0,
      "Montana has 0 seaport/commercial waterway access"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Wyoming"].logisticsWaterwayIndex,
      0,
      "Wyoming has 0 seaport/commercial waterway access"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Colorado"].logisticsWaterwayIndex,
      0,
      "Colorado has 0 seaport/commercial waterway access"
    );
    assert.equal(
      US_GEOGRAPHIC_ENDOWMENTS["Utah"].logisticsWaterwayIndex,
      0,
      "Utah has 0 seaport/commercial waterway access"
    );
  });

  test("All 50 US states explicitly defined with empirical USGS/EIA/USDA endowments", () => {
    const stateCount = Object.keys(US_GEOGRAPHIC_ENDOWMENTS).length;
    assert.ok(
      stateCount >= 50,
      `Expected at least 50 states defined, got ${stateCount}`
    );
    for (const [name, endow] of Object.entries(US_GEOGRAPHIC_ENDOWMENTS)) {
      assert.ok(endow.code, `${name} must have a 2-letter state code`);
      assert.ok(endow.region, `${name} must have a geographic region`);
      assert.ok(
        Number.isFinite(endow.hydrocarbonIndex),
        `${name} hydrocarbonIndex must be a number`
      );
      assert.ok(
        Number.isFinite(endow.mineralIndex),
        `${name} mineralIndex must be a number`
      );
      assert.ok(
        Number.isFinite(endow.arableLandIndex),
        `${name} arableLandIndex must be a number`
      );
      assert.ok(
        Number.isFinite(endow.logisticsWaterwayIndex),
        `${name} logisticsWaterwayIndex must be a number`
      );
      assert.ok(endow.resources, `${name} must have resource text summaries`);
    }
  });

  test("getUsStateEndowment returns strict zero baseline fallback for unlisted territories", () => {
    const endow = getUsStateEndowment("Guam");
    assert.ok(endow, "Must return endowment object");
    assert.equal(
      endow.hydrocarbonIndex,
      0,
      "Fallback hydrocarbonIndex must be strictly 0"
    );
    assert.equal(
      endow.mineralIndex,
      0,
      "Fallback mineralIndex must be strictly 0"
    );
    assert.equal(
      endow.arableLandIndex,
      0,
      "Fallback arableLandIndex must be strictly 0"
    );
    assert.equal(
      endow.logisticsWaterwayIndex,
      0,
      "Fallback logisticsWaterwayIndex must be strictly 0"
    );
  });

  test("Map tile providers contain CartoDB, Esri Satellite, and OpenStreetMap options", () => {
    assert.ok(MAP_PROVIDERS.carto_dark, "CartoDB Dark Matter must exist");
    assert.ok(MAP_PROVIDERS.esri_satellite, "Esri World Satellite must exist");
    assert.ok(MAP_PROVIDERS.carto_voyager, "CartoDB Voyager must exist");
    assert.ok(MAP_PROVIDERS.osm, "OpenStreetMap must exist");

    assert.ok(
      MAP_PROVIDERS.carto_dark.url.includes("cartocdn.com"),
      "CartoDB Dark Matter must have valid tile URL"
    );
    assert.ok(
      MAP_PROVIDERS.esri_satellite.url.includes("arcgisonline.com"),
      "Esri Satellite must have valid tile URL"
    );
  });

  test("Resource markers contain valid geographic coordinates and categories", () => {
    assert.ok(
      ALL_US_RESOURCE_MARKERS.length >= 15,
      "Must have comprehensive marker set"
    );
    for (const m of ALL_US_RESOURCE_MARKERS) {
      assert.ok(
        Array.isArray(m.coords) && m.coords.length === 2,
        "Marker must have [lng, lat]"
      );
      assert.ok(
        m.coords[0] >= -180 && m.coords[0] <= 180,
        "Longitude must be valid"
      );
      assert.ok(
        m.coords[1] >= -90 && m.coords[1] <= 90,
        "Latitude must be valid"
      );
      assert.ok(
        ["oil_gas", "mineral", "agri", "port"].includes(m.type),
        `Type '${m.type}' must be valid`
      );
    }
  });

  test("evaluateGeographicProduction evaluates trained machine learning decision tree ensemble", () => {
    const txEndow = getUsStateEndowment("Texas");
    const result = evaluateGeographicProduction(txEndow, 245, 4.2, 2.1, 0.92);

    assert.ok(result.outputs, "Must return production outputs");
    assert.ok(
      result.outputs.miningExtractiveGdp > 10,
      "Texas mining extractive GDP must be substantial"
    );
    assert.ok(
      result.outputs.heavyManufacturingGdp > 20,
      "Texas manufacturing GDP must be substantial"
    );
    assert.ok(
      result.outputs.agriculturalProductionGdp > 5,
      "Texas agricultural GDP must be substantial"
    );
    assert.ok(
      result.resourceMultipliers.domesticSupplyBuffer >= 1.0,
      "Supply buffer must be >= 1.0"
    );
  });

  test("Colorado and all 50 constituent states have capitals, GDP shares, and USGS/EIA endowments", () => {
    const colorado = US_STATES_CATALOG["Colorado"];
    assert.ok(colorado, "Colorado must exist in state catalog");
    assert.equal(colorado.code, "CO");
    assert.equal(colorado.capital, "Denver");
    assert.ok(
      colorado.gdpShare > 0.015,
      "Colorado GDP share must be grounded (~2.0% of US)"
    );
    assert.ok(
      colorado.popShare > 0.015,
      "Colorado workforce share must be grounded (~1.7% of US)"
    );

    const coEndow = getUsStateEndowment("Colorado");
    assert.ok(coEndow, "Colorado geographic endowments must exist");
    assert.ok(
      coEndow.mineralIndex >= 50,
      "Colorado must have significant mineral index from Molybdenum & precious metals"
    );
    assert.ok(
      coEndow.hydrocarbonIndex >= 40,
      "Colorado must have gas index from DJ and Piceance basins"
    );

    const coreStates = Object.entries(US_STATES_CATALOG).filter(
      ([_, m]) => m.status !== "TERRITORY"
    );
    assert.equal(
      coreStates.length,
      51,
      "Must contain 50 sovereign states + District of Columbia"
    );

    let totalGdpShare = 0;
    for (const [name, meta] of Object.entries(US_STATES_CATALOG)) {
      assert.ok(meta.capital, `${name} must have a capital city`);
      assert.ok(meta.code, `${name} must have a 2-letter postal code`);
      assert.ok(meta.gdpShare > 0, `${name} must have a positive GDP share`);
      assert.ok(meta.popShare > 0, `${name} must have a positive pop share`);
      totalGdpShare += meta.gdpShare;
    }
    assert.ok(
      totalGdpShare > 0.95 && totalGdpShare <= 1.05,
      "Total state GDP share must sum to ~100% of national economy"
    );
  });

  test("Calibrated macroeconomic pricing scales modern US GDP to ~$27-28T and Kansas to ~$215-225B", () => {
    const state = loadSeedFile();
    const evaluated = evaluateSimulation(state);
    assert.equal(
      evaluated.nations.length,
      1,
      "Simulation must contain exclusively the United States"
    );
    const usa = evaluated.nations[0];
    assert.ok(usa, "USA must exist in evaluated state");

    const totalGdp = usa.computed?.aggregateGdp;
    assert.ok(totalGdp, "USA must have aggregate GDP computed");

    const gdpInTrillions = totalGdp / 1e12;
    assert.ok(
      gdpInTrillions >= 25.0 && gdpInTrillions <= 30.0,
      `Expected US GDP between $25T and $30T, got $${gdpInTrillions.toFixed(2)}T`
    );

    const kansasGdpInBillions = (totalGdp * 0.008) / 1e9;
    assert.ok(
      kansasGdpInBillions >= 200.0 && kansasGdpInBillions <= 245.0,
      `Expected Kansas GDP ~$215B-$225B, got $${kansasGdpInBillions.toFixed(1)}B`
    );

    const calGdpInTrillions = (totalGdp * 0.142) / 1e12;
    assert.ok(
      calGdpInTrillions >= 3.5 && calGdpInTrillions <= 4.2,
      `Expected California GDP ~$3.8T-$4.0T, got $${calGdpInTrillions.toFixed(2)}T`
    );
  });
});
