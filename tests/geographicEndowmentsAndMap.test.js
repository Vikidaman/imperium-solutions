import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { US_GEOGRAPHIC_ENDOWMENTS, getUsStateEndowment, ALL_US_RESOURCE_MARKERS } from "../src/data/usGeographicEndowments.js";
import { MAP_PROVIDERS } from "../src/data/mapProviders.js";
import { evaluateGeographicProduction } from "../server/geographicProductionEngine.js";

describe("Geographic Endowments & Multi-Provider Cartography", () => {
  test("US geographic endowments contain authoritative USGS/EIA/USDA data for key anchor states", () => {
    const texas = US_GEOGRAPHIC_ENDOWMENTS["Texas"];
    assert.ok(texas, "Texas endowments must exist");
    assert.equal(texas.code, "TX");
    assert.ok(texas.hydrocarbonIndex >= 90, "Texas must have high hydrocarbon index from Permian & Eagle Ford");
    assert.ok(texas.primaryBasins.some((b) => b.name === "Permian Basin"), "Permian Basin must be mapped");

    const california = US_GEOGRAPHIC_ENDOWMENTS["California"];
    assert.ok(california, "California endowments must exist");
    assert.ok(california.mineralIndex >= 80, "California must have high mineral index from Mountain Pass REE");
    assert.ok(california.arableLandIndex >= 90, "California must have high arable land index from Central Valley");

    const minnesota = US_GEOGRAPHIC_ENDOWMENTS["Minnesota"];
    assert.ok(minnesota, "Minnesota endowments must exist");
    assert.ok(minnesota.mineralIndex >= 90, "Minnesota must have high mineral index from Mesabi Iron Range");

    const wyoming = US_GEOGRAPHIC_ENDOWMENTS["Wyoming"];
    assert.ok(wyoming, "Wyoming endowments must exist");
    assert.ok(wyoming.primaryBasins.some((b) => b.name === "Powder River Basin"), "Powder River Basin must be mapped");
  });

  test("getUsStateEndowment returns valid fallback for unlisted states", () => {
    const endow = getUsStateEndowment("Delaware");
    assert.ok(endow, "Must return endowment object");
    assert.ok(endow.hydrocarbonIndex >= 0 && endow.hydrocarbonIndex <= 100);
    assert.ok(endow.mineralIndex >= 0 && endow.mineralIndex <= 100);
    assert.ok(endow.arableLandIndex >= 0 && endow.arableLandIndex <= 100);
  });

  test("Map tile providers contain CartoDB, Esri Satellite, and OpenStreetMap options", () => {
    assert.ok(MAP_PROVIDERS.carto_dark, "CartoDB Dark Matter must exist");
    assert.ok(MAP_PROVIDERS.esri_satellite, "Esri World Satellite must exist");
    assert.ok(MAP_PROVIDERS.carto_voyager, "CartoDB Voyager must exist");
    assert.ok(MAP_PROVIDERS.osm, "OpenStreetMap must exist");

    assert.ok(MAP_PROVIDERS.carto_dark.url.includes("cartocdn.com"), "CartoDB Dark Matter must have valid tile URL");
    assert.ok(MAP_PROVIDERS.esri_satellite.url.includes("arcgisonline.com"), "Esri Satellite must have valid tile URL");
  });

  test("Resource markers contain valid geographic coordinates and categories", () => {
    assert.ok(ALL_US_RESOURCE_MARKERS.length >= 15, "Must have comprehensive marker set");
    for (const m of ALL_US_RESOURCE_MARKERS) {
      assert.ok(Array.isArray(m.coords) && m.coords.length === 2, "Marker must have [lng, lat]");
      assert.ok(m.coords[0] >= -180 && m.coords[0] <= 180, "Longitude must be valid");
      assert.ok(m.coords[1] >= -90 && m.coords[1] <= 90, "Latitude must be valid");
      assert.ok(["oil_gas", "mineral", "agri", "port"].includes(m.type), `Type '${m.type}' must be valid`);
    }
  });

  test("evaluateGeographicProduction evaluates trained machine learning decision tree ensemble", () => {
    const txEndow = getUsStateEndowment("Texas");
    const result = evaluateGeographicProduction(txEndow, 245, 4.2, 2.1, 0.92);

    assert.ok(result.outputs, "Must return production outputs");
    assert.ok(result.outputs.miningExtractiveGdp > 10, "Texas mining extractive GDP must be substantial");
    assert.ok(result.outputs.heavyManufacturingGdp > 20, "Texas manufacturing GDP must be substantial");
    assert.ok(result.outputs.agriculturalProductionGdp > 5, "Texas agricultural GDP must be substantial");
    assert.ok(result.resourceMultipliers.domesticSupplyBuffer >= 1.0, "Supply buffer must be >= 1.0");
  });
});
