import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HISTORICAL_ERAS } from "../src/data/historicalEras.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("European Sovereign Nations & Power Blocs Removal", () => {
  test("era_2015 does not contain European Union as a monolithic nation", () => {
    const era2015 = HISTORICAL_ERAS.find((e) => e.id === "era_2015");
    assert.ok(era2015, "era_2015 must exist");

    const eu = era2015.nations.find((n) => n.id === "european_union");
    assert.equal(eu, undefined, "European Union must NOT exist as a nation in era_2015");
  });

  test("European states are represented as independent sovereign nations", () => {
    const era2015 = HISTORICAL_ERAS.find((e) => e.id === "era_2015");
    const nationIds = era2015.nations.map((n) => n.id);

    const expectedSovereigns = [
      "germany",
      "france",
      "united_kingdom",
      "italy",
      "spain",
      "poland",
      "netherlands",
    ];

    for (const expectedId of expectedSovereigns) {
      assert.ok(
        nationIds.includes(expectedId),
        `Nation '${expectedId}' must be present as a sovereign nation in era_2015`
      );
      const nation = era2015.nations.find((n) => n.id === expectedId);
      assert.ok(nation.capital, `${expectedId} must have an authoritative sovereign capital`);
      assert.ok(
        nation.constituentStates && nation.constituentStates.length > 0,
        `${expectedId} must have constituent states / provinces`
      );
    }
  });

  test("territoryMap maps European countries to their own sovereign IDs, not european_union", () => {
    const era2015 = HISTORICAL_ERAS.find((e) => e.id === "era_2015");
    const tm = era2015.territoryMap;

    assert.equal(tm["Germany"], "germany");
    assert.equal(tm["France"], "france");
    assert.equal(tm["United Kingdom"], "united_kingdom");
    assert.equal(tm["Italy"], "italy");
    assert.equal(tm["Spain"], "spain");
    assert.equal(tm["Poland"], "poland");
    assert.equal(tm["Netherlands"], "netherlands");

    // Ensure no territory points to european_union
    const euTerritories = Object.entries(tm).filter(([, id]) => id === "european_union");
    assert.equal(euTerritories.length, 0, "No territory should map to european_union");
  });

  test("Power Blocs are removed from default seeds", () => {
    const seedPath = path.join(__dirname, "..", "public", "seeds", "interstellar_seed.json");
    if (fs.existsSync(seedPath)) {
      const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
      assert.deepEqual(seed.powerBlocs, [], "powerBlocs must be empty in default seed");
      const euNation = (seed.nations || []).find((n) => n.id === "european_union");
      assert.equal(euNation, undefined, "european_union must not be in seed nations");
    }
  });
});

