import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { US_GEOGRAPHIC_ENDOWMENTS, getUsStateEndowment, ALL_US_RESOURCE_MARKERS } from "../src/data/usGeographicEndowments.js";
import { MAP_PROVIDERS } from "../src/data/mapProviders.js";
import { evaluateGeographicProduction } from "../server/geographicProductionEngine.js";
import { US_STATES_CATALOG, getUsaStateData } from "../src/data/usStatesData.js";
import { resolveIso3, getContinentalBounds } from "../src/services/boundaryService.js";
import { getSovereignNation } from "../src/data/nationsCatalog.js";

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

  test("Colorado and all 50 constituent states have capitals, GDP shares, and USGS/EIA endowments", () => {
    const colorado = US_STATES_CATALOG["Colorado"];
    assert.ok(colorado, "Colorado must exist in state catalog");
    assert.equal(colorado.code, "CO");
    assert.equal(colorado.capital, "Denver");
    assert.ok(colorado.gdpShare > 0.015, "Colorado GDP share must be grounded (~2.0% of US)");
    assert.ok(colorado.popShare > 0.015, "Colorado workforce share must be grounded (~1.7% of US)");

    const coEndow = getUsStateEndowment("Colorado");
    assert.ok(coEndow, "Colorado geographic endowments must exist");
    assert.ok(coEndow.mineralIndex >= 50, "Colorado must have significant mineral index from Molybdenum & precious metals");
    assert.ok(coEndow.hydrocarbonIndex >= 40, "Colorado must have gas index from DJ and Piceance basins");
    assert.ok(coEndow.primaryBasins.some((b) => b.name.includes("Molybdenum") || b.name.includes("DJ Basin")), "Must map key basins");

    // Verify all 50 core states have valid capital and positive GDP shares
    const coreStates = Object.entries(US_STATES_CATALOG).filter(([_, m]) => m.status !== "TERRITORY");
    assert.equal(coreStates.length, 51, "Must contain 50 sovereign states + District of Columbia");

    let totalGdpShare = 0;
    for (const [name, meta] of Object.entries(US_STATES_CATALOG)) {
      assert.ok(meta.capital, `${name} must have a capital city`);
      assert.ok(meta.code, `${name} must have a 2-letter postal code`);
      assert.ok(meta.gdpShare > 0, `${name} must have a positive GDP share`);
      assert.ok(meta.popShare > 0, `${name} must have a positive pop share`);
      totalGdpShare += meta.gdpShare;
    }
    assert.ok(totalGdpShare > 0.95 && totalGdpShare <= 1.05, "Total state GDP share must sum to ~100% of national economy");
  });

  test("Continental bounds framing correctly excludes far-flung overseas territories", () => {
    const usaContinental = getContinentalBounds("USA");
    assert.ok(usaContinental, "USA continental bounds must exist");
    assert.deepEqual(usaContinental[0], [24.3963, -125.0], "Must frame lower 48 Southwest origin");
    assert.deepEqual(usaContinental[1], [49.3844, -66.9346], "Must frame lower 48 Northeast extent");

    const fraContinental = getContinentalBounds("FRA");
    assert.ok(fraContinental, "France metropolitan bounds must exist");
    assert.deepEqual(fraContinental[0], [41.3, -5.5], "Must frame metropolitan France");

    const gbrContinental = getContinentalBounds("GBR");
    assert.ok(gbrContinental, "Great Britain continental bounds must exist");
  });

  test("Comprehensive ISO-3 resolution database covers all simulator Earth countries", () => {
    assert.equal(resolveIso3("dem_rep_congo"), "COD");
    assert.equal(resolveIso3("Dem. Rep. Congo"), "COD");
    assert.equal(resolveIso3("norway"), "NOR");
    assert.equal(resolveIso3("chile"), "CHL");
    assert.equal(resolveIso3("philippines"), "PHL");
    assert.equal(resolveIso3("vietnam"), "VNM");
    assert.equal(resolveIso3("s_sudan"), "SSD");
    assert.equal(resolveIso3("w_sahara"), "ESH");
    assert.equal(resolveIso3("bosnia_and_herz"), "BIH");
    assert.equal(resolveIso3("c_te_d_ivoire"), "CIV");
    assert.equal(resolveIso3("central_african_rep"), "CAF");
    assert.equal(resolveIso3("falkland_is"), "FLK");
  });

  test("Sovereign nation click resolution handles all aliases and global nations", () => {
    const usa = getSovereignNation("United States of America");
    assert.ok(usa, "USA must resolve from United States of America");
    assert.equal(usa.id, "usa");

    const usaAlias = getSovereignNation("United States");
    assert.ok(usaAlias, "USA must resolve from United States alias");
    assert.equal(usaAlias.id, "usa");

    const drc = getSovereignNation("Democratic Republic of the Congo");
    assert.ok(drc, "DRC must resolve from Democratic Republic of the Congo");
    assert.equal(drc.id, "dem_rep_congo");

    const canada = getSovereignNation("Canada");
    assert.ok(canada, "Canada must resolve");
    assert.equal(canada.id, "canada");

    const mexico = getSovereignNation("Mexico");
    assert.ok(mexico, "Mexico must resolve");
    assert.equal(mexico.id, "mexico");
  });
});
