import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { HISTORICAL_SOURCES } from "../src/data/historicalSourcesData.js";
import { COMMODITY_PRICE_BENCHMARKS } from "../server/empiricalPriceCatalog.js";

describe("Historical Sources, Empirical Datasets & Academic Citations", () => {
  test("HISTORICAL_SOURCES contains all core peer-reviewed & government institutions", () => {
    assert.ok(Array.isArray(HISTORICAL_SOURCES), "HISTORICAL_SOURCES must be an array");
    assert.ok(HISTORICAL_SOURCES.length >= 10, "Must have at least 10 primary historical datasets");

    const ids = HISTORICAL_SOURCES.map((s) => s.id);
    const requiredIds = [
      "maddison",
      "leontief",
      "usgs",
      "eia",
      "usda",
      "bea",
      "agglomeration",
      "usace_bts",
      "world_bank",
      "natural_earth",
      "bls_census",
    ];

    for (const reqId of requiredIds) {
      assert.ok(ids.includes(reqId), `Missing mandatory source: ${reqId}`);
    }
  });

  test("Each historical source contains complete scholarly metadata and citation fields", () => {
    for (const source of HISTORICAL_SOURCES) {
      assert.ok(source.title && source.title.length > 5, `Source ${source.id} must have a title`);
      assert.ok(source.institution && source.institution.length > 3, `Source ${source.id} must have an institution`);
      assert.ok(source.authors && source.authors.length > 3, `Source ${source.id} must have authors`);
      assert.ok(source.citation && source.citation.length > 15, `Source ${source.id} must have a formal citation`);
      assert.ok(source.url && source.url.startsWith("http"), `Source ${source.id} must have a valid URL`);
      assert.ok(Array.isArray(source.usedFor) && source.usedFor.length >= 2, `Source ${source.id} must have role bullet points`);
      assert.ok(source.summary && source.summary.length > 20, `Source ${source.id} must have a summary`);
    }
  });

  test("Empirical Commodity Price Catalog has authoritative benchmark coverage", () => {
    const keys = Object.keys(COMMODITY_PRICE_BENCHMARKS);
    assert.ok(keys.length >= 50, `Expected at least 50 commodities, found ${keys.length}`);

    // Verify key anchor commodities
    const anchors = ["Crude Oil", "Iron Ore", "Copper", "Lithium & Batteries", "Rare Earth Metals", "Natural Gas"];
    for (const anchor of anchors) {
      const item = COMMODITY_PRICE_BENCHMARKS[anchor];
      assert.ok(item, `Anchor commodity ${anchor} must exist in catalog`);
      assert.ok(typeof item.real_world_price === "number" && item.real_world_price > 0, `Price for ${anchor} must be positive number`);
      assert.ok(typeof item.source === "string" && item.source.length > 2, `Source for ${anchor} must be specified`);
    }
  });
});
