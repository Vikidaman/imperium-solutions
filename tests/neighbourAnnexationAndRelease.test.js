import test from "node:test";
import assert from "node:assert/strict";
import { getNeighbourProvinceEndowments, ALL_NEIGHBOUR_RESOURCE_MARKERS, ALL_NEIGHBOUR_SERVICE_CLUSTERS } from "../src/data/neighbourEndowments.js";
import { getUsStateEndowment } from "../src/data/usGeographicEndowments.js";
import { getUsStateServicesEndowment } from "../src/data/usServicesEndowments.js";
import { getUsaStateData } from "../src/data/usStatesData.js";
import { transferTerritory, evaluateSimulation } from "../server/engine.js";

test("Neighbour Province Endowments & Annexation Integration", async (t) => {
  await t.test("Canadian and Mexican provinces return authentic empirical endowments", () => {
    const ontario = getNeighbourProvinceEndowments("Ontario");
    assert.ok(ontario, "Ontario data must exist");
    assert.equal(ontario.capital, "Toronto");
    assert.equal(ontario.countryIso3, "CAN");
    assert.equal(ontario.resources.mineralIndex, 86);
    assert.equal(ontario.services.financialDepthIndex, 94);

    const baja = getNeighbourProvinceEndowments("Baja California");
    assert.ok(baja, "Baja California data must exist");
    assert.equal(baja.capital, "Mexicali");
    assert.equal(baja.countryIso3, "MEX");
    assert.equal(baja.services.humanCapitalIndex, 78);
  });

  await t.test("US Endowments fallbacks transparently resolve Canadian and Mexican provinces", () => {
    const ontarioGeo = getUsStateEndowment("Ontario");
    assert.ok(ontarioGeo, "getUsStateEndowment must resolve Ontario");
    assert.equal(ontarioGeo.mineralIndex, 86);
    assert.equal(ontarioGeo.arableLandIndex, 70);

    const ontarioSrv = getUsStateServicesEndowment("Ontario");
    assert.ok(ontarioSrv, "getUsStateServicesEndowment must resolve Ontario");
    assert.equal(ontarioSrv.humanCapitalIndex, 90);
    assert.equal(ontarioSrv.financialDepthIndex, 94);

    const bajaMeta = getUsaStateData("Baja California");
    assert.ok(bajaMeta, "getUsaStateData must resolve Baja California");
    assert.equal(bajaMeta.capital, "Mexicali");
    assert.equal(bajaMeta.code, "BCN");
  });

  await t.test("Resource markers and service clusters include Canadian and Mexican landmarks", () => {
    assert.ok(ALL_NEIGHBOUR_RESOURCE_MARKERS.length >= 8);
    assert.ok(ALL_NEIGHBOUR_SERVICE_CLUSTERS.length >= 8);

    const sudbury = ALL_NEIGHBOUR_RESOURCE_MARKERS.find((m) => m.name.includes("Sudbury"));
    assert.ok(sudbury, "Sudbury Nickel-Copper Complex marker must be present");
    assert.equal(sudbury.state, "Ontario");

    const tsx = ALL_NEIGHBOUR_SERVICE_CLUSTERS.find((c) => c.name.includes("Bay Street"));
    assert.ok(tsx, "Bay Street / TSX service cluster must be present");
    assert.equal(tsx.type, "finance");
  });

  await t.test("transferTerritory successfully annexes a Canadian province into USA", () => {
    const mockState = {
      nations: [
        { id: "usa", name: "United States", workingPops: 160000000, constituentStates: [], unincorporatedTerritories: [] },
        { id: "can", name: "Canada", workingPops: 20000000, constituentStates: [{ name: "Ontario" }], unincorporatedTerritories: [] },
      ],
      territoryMap: { Ontario: "can" },
      territoryStatusMap: { Ontario: "STATE" },
      newsFeed: [],
    };

    const res = transferTerritory(mockState, {
      territoryName: "Ontario",
      targetNationId: "usa",
      mode: "ANNEX",
      planet: "Earth",
    });

    assert.ok(res);
    assert.equal(mockState.territoryMap["Ontario"], "usa");
    assert.equal(mockState.territoryStatusMap["Ontario"], "TERRITORY");
    assert.ok(mockState.nations[0].unincorporatedTerritories.some((t) => t.name === "Ontario"));
  });

  await t.test("transferTerritory annexes unmapped neighbour province even when territoryMap entry is undefined and sourceNationId equals targetNationId", () => {
    const mockState = {
      nations: [
        { id: "usa", name: "USA", workingPops: 160000000, constituentStates: [], unincorporatedTerritories: [] },
        { id: "canada", name: "Canada", workingPops: 20000000, constituentStates: [], unincorporatedTerritories: [] },
      ],
      territoryMap: {},
      territoryStatusMap: {},
      newsFeed: [],
    };

    const res = transferTerritory(mockState, {
      territoryName: "Ontario",
      targetNationId: "usa",
      sourceNationId: "usa",
      mode: "ANNEX",
      planet: "Earth",
    });

    assert.ok(res);
    assert.equal(mockState.territoryMap["Ontario"], "usa");
    assert.equal(mockState.territoryStatusMap["Ontario"], "TERRITORY");
    assert.ok(!res.action.includes("already controlled"));
  });

  await t.test("transferTerritory successfully releases a province into a sovereign republic", () => {
    const mockState = {
      nations: [
        { id: "usa", name: "United States", workingPops: 160000000, constituentStates: [{ name: "California" }] },
      ],
      territoryMap: { California: "usa" },
      territoryStatusMap: { California: "STATE" },
      newsFeed: [],
    };

    const res = transferTerritory(mockState, {
      territoryName: "California",
      mode: "RELEASE",
      planet: "Earth",
    });

    assert.ok(res);
    assert.ok(mockState.nations.some((n) => n.name === "California Republic"));
    assert.notEqual(mockState.territoryMap["California"], "usa");
  });

  await t.test("transferTerritory successfully transfers control of a province to a neighbour", () => {
    const mockState = {
      nations: [
        { id: "usa", name: "United States", workingPops: 160000000, constituentStates: [{ name: "Maine" }] },
        { id: "can", name: "Canada", workingPops: 20000000, constituentStates: [], unincorporatedTerritories: [] },
      ],
      territoryMap: { Maine: "usa" },
      territoryStatusMap: { Maine: "STATE" },
      newsFeed: [],
    };

    const res = transferTerritory(mockState, {
      territoryName: "Maine",
      targetNationId: "can",
      mode: "ANNEX",
      planet: "Earth",
    });

    assert.ok(res);
    assert.equal(mockState.territoryMap["Maine"], "can");
    assert.equal(mockState.territoryStatusMap["Maine"], "TERRITORY");
  });

  await t.test("Florida release and Chihuahua return to Mexico persist across evaluateSimulation cycles without reverting", () => {
    const mockState = {
      version: 1,
      nations: [
        { id: "usa", name: "United States of America", workingPops: 160000000, constituentStates: [{ name: "Florida" }], unincorporatedTerritories: [{ name: "Chihuahua" }] },
        { id: "mexico", name: "Mexico", workingPops: 60000000, constituentStates: [], unincorporatedTerritories: [] },
      ],
      territoryMap: { Florida: "usa", Chihuahua: "usa" },
      territoryStatusMap: { Florida: "STATE", Chihuahua: "STATE" },
      newsFeed: [],
    };

    // 1. Release Florida
    const relRes = transferTerritory(mockState, {
      territoryName: "Florida",
      sourceNationId: "usa",
      mode: "RELEASE",
      planet: "Earth",
    });
    assert.equal(relRes.nationId, "florida_tallahassee");
    assert.equal(mockState.territoryMap["Florida"], "florida_tallahassee");
    assert.ok(mockState.nations.some((n) => n.id === "florida_tallahassee" && n.isSeceded));
    assert.ok(!mockState.nations[0].constituentStates.some((s) => s.name === "Florida"));

    // 2. Return Chihuahua to Mexico
    const retRes = transferTerritory(mockState, {
      territoryName: "Chihuahua",
      sourceNationId: "usa",
      targetNationId: "mexico",
      mode: "ANNEX",
      planet: "Earth",
    });
    assert.equal(retRes.nationId, "mexico");
    assert.equal(mockState.territoryMap["Chihuahua"], "mexico");
    assert.equal(mockState.territoryStatusMap["Chihuahua"], "STATE");
    assert.ok(!mockState.nations[0].unincorporatedTerritories.some((s) => s.name === "Chihuahua"));
    assert.ok(!mockState.nations[0].constituentStates.some((s) => s.name === "Chihuahua"));

    // 3. Run multiple evaluateSimulation cycles and verify nothing reverts
    evaluateSimulation(mockState);
    evaluateSimulation(mockState);
    assert.equal(mockState.territoryMap["Florida"], "florida_tallahassee");
    assert.equal(mockState.territoryMap["Chihuahua"], "mexico");
    assert.ok(mockState.version >= 3);
  });
});

