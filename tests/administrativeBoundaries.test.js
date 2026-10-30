import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT_DIR, "public", "data", "boundaries", "manifest.json");
const ADM1_DIR = path.join(ROOT_DIR, "public", "data", "boundaries", "adm1");

// Import boundary service & mapping logic
import { resolveIso3, NATION_TO_ISO3 } from "../src/services/boundaryService.js";
import { getLinkedSubdivision, ADM1_ZONE_MAPPING } from "../src/data/adm1Mapping.js";

test("Global Administrative Boundaries System (ADM1)", async (t) => {
  await t.test("ISO-3 country identifier resolution", () => {
    assert.equal(resolveIso3("COD"), "COD");
    assert.equal(resolveIso3("drc"), "COD");
    assert.equal(resolveIso3("congo"), "COD");
    assert.equal(resolveIso3("Democratic Republic of the Congo"), "COD");
    assert.equal(resolveIso3("usa"), "USA");
    assert.equal(resolveIso3("United States of America"), "USA");
    assert.equal(resolveIso3("Germany"), "DEU");
    assert.equal(resolveIso3("United Kingdom"), "GBR");
    assert.equal(resolveIso3("Japan"), "JPN");
    assert.equal(resolveIso3("China"), "CHN");
    assert.equal(resolveIso3("Brazil"), "BRA");
    assert.equal(resolveIso3("nonexistent_alien_planet"), null);
  });

  await t.test("Global boundary manifest integrity and coverage", () => {
    assert.ok(fs.existsSync(MANIFEST_PATH), "manifest.json must exist in public/data/boundaries/");
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    assert.equal(manifest.version, "1.0.0");
    assert.ok(manifest.totalCountries >= 25, `Expected >= 25 countries, got ${manifest.totalCountries}`);
    assert.equal(manifest.availableCountries, manifest.totalCountries);

    // Verify key countries exist in manifest
    const requiredIsos = ["COD", "USA", "GBR", "FRA", "DEU", "JPN", "CHN", "IND", "BRA", "RUS"];
    for (const iso of requiredIsos) {
      assert.ok(manifest.countries[iso], `Country ${iso} missing from manifest`);
      assert.equal(manifest.countries[iso].status, "AVAILABLE");
      assert.ok(manifest.countries[iso].featureCount > 0);
    }
  });

  await t.test("DRC Acceptance Test: Democratic Republic of the Congo has exactly 26 real ADM1 provinces", () => {
    const codPath = path.join(ADM1_DIR, "COD.json");
    assert.ok(fs.existsSync(codPath), "COD.json must exist");
    const codData = JSON.parse(fs.readFileSync(codPath, "utf-8"));

    assert.equal(codData.type, "FeatureCollection");
    assert.equal(codData.countryIso3, "COD");
    assert.equal(codData.features.length, 26, "DRC must contain exactly 26 real first-level provinces");

    const provinceNames = codData.features.map((f) => f.properties.name);
    // Key provinces must all exist
    assert.ok(provinceNames.includes("Kinshasa"), "Kinshasa province must exist");
    assert.ok(provinceNames.some((n) => n.includes("Katanga") || n.includes("Haut-Katanga")), "Haut-Katanga must exist");
    assert.ok(provinceNames.some((n) => n.includes("Kongo-Central") || n.includes("Kongo Central") || n.includes("Bas-Congo")), "Kongo Central must exist");
    assert.ok(provinceNames.some((n) => n.includes("Ituri")), "Ituri must exist");
    assert.ok(provinceNames.some((n) => n.includes("North Kivu") || n.includes("Nord-Kivu")), "North Kivu must exist");

    // Verify geometry validity
    for (const f of codData.features) {
      assert.ok(f.geometry && f.geometry.coordinates, `Province ${f.properties.name} missing geometry`);
      assert.ok(["Polygon", "MultiPolygon"].includes(f.geometry.type));
      assert.ok(f.geometry.coordinates.length > 0);
    }
  });

  await t.test("United States ADM1 integrity: 50 states and territories present", () => {
    const usaPath = path.join(ADM1_DIR, "USA.json");
    assert.ok(fs.existsSync(usaPath), "USA.json must exist");
    const usaData = JSON.parse(fs.readFileSync(usaPath, "utf-8"));

    assert.ok(usaData.features.length >= 50, "USA must contain at least 50 state features");
    const stateNames = usaData.features.map((f) => f.properties.name);
    assert.ok(stateNames.includes("California"));
    assert.ok(stateNames.includes("Texas"));
    assert.ok(stateNames.includes("New York"));
  });

  await t.test("Canonical geographic-to-simulator mapping decoupled rules", () => {
    // Kinshasa maps to Capital District
    const kinshasaMapping = getLinkedSubdivision("COD", "Kinshasa");
    assert.ok(kinshasaMapping);
    assert.equal(kinshasaMapping.zoneName, "Kinshasa Capital District");

    // Haut-Katanga maps to Katanga Copperbelt Industrial Basin
    const katangaMapping = getLinkedSubdivision("COD", "Haut-Katanga");
    assert.ok(katangaMapping);
    assert.equal(katangaMapping.zoneName, "Katanga Copperbelt Industrial Basin");

    // Unmapped region returns null (does not fabricate economic statistics)
    const unmapped = getLinkedSubdivision("COD", "NonexistentFictionalProvince");
    assert.equal(unmapped, null);
  });
});
