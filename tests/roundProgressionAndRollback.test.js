import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  transferTerritory,
  evaluateSimulation,
} from "../server/engine.js";

describe("Round Progression and Statecraft Mechanics", () => {
  function createBaseState() {
    return {
      nations: [
        {
          id: "usa",
          name: "United States",
          planet: "Earth",
          population: 330000000,
          workingPopulationPercentage: 0.65,
          rawPops: 330000000,
          gdp: 25000000000000,
          cashTreasury: 100000000000,
          debt: 20000000000000,
          centralBankRate: 0.05,
          bondYieldSpread: 0.015,
          activeBonds: [],
          companies: [],
          laws: {
            governance: "Presidential Republic",
            economic: "Interventionism",
          },
          interestGroups: [
            { id: "industrialists", name: "Industrialists", clout: 0.35, approval: 10 },
            { id: "labor", name: "Trade Unions", clout: 0.30, approval: 5 },
          ],
        },
        {
          id: "uk",
          name: "United Kingdom",
          planet: "Earth",
          population: 67000000,
          workingPopulationPercentage: 0.62,
          rawPops: 67000000,
          gdp: 3100000000000,
          cashTreasury: 40000000000,
          debt: 2500000000000,
          centralBankRate: 0.045,
          bondYieldSpread: 0.018,
          activeBonds: [],
          companies: [],
          laws: {
            governance: "Parliamentary Republic",
            economic: "Laissez-Faire",
          },
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 20 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      territoryMap: {
        "Texas": "usa",
        "California": "usa",
        "Scotland": "uk",
      },
      territoryStatusMap: {
        "Texas": "STATE",
        "California": "STATE",
        "Scotland": "STATE",
      },
      timeManager: {
        quarter: 1,
        crisisDate: "2025-01-01",
        crisisStartDate: "2025-01-01",
        nextPaymentDate: "2025-04-01",
        isLive: false,
      },
    };
  }

  it("advances simulation time and quarter deterministically", () => {
    const state = createBaseState();
    const result = advanceSimulationTime(state, 90);

    assert.equal(state.timeManager.crisisDate, "2025-04-01");
    assert.equal(result.quartersCrossed, 1);
    assert.equal(state.timeManager.quarter, 2);
  });

  it("handles state secession by establishing sovereign territory and deconflicting", () => {
    const state = createBaseState();
    transferTerritory(state, {
      territoryName: "Texas",
      targetNationId: "texas-republic",
      mode: "SECEDE",
      newCountryName: "Republic of Texas",
    });

    const secededNation = state.nations.find((n) => n.id === "texas-republic");
    assert.ok(secededNation, "Seceded nation must exist in state.nations");
    assert.equal(secededNation.name, "Republic of Texas");
    assert.equal(state.territoryMap["Texas"], "texas-republic");
    assert.equal(state.territoryStatusMap["Texas"], "STATE");
  });

  it("handles territory annexation by setting status to territory initially", () => {
    const state = createBaseState();
    transferTerritory(state, {
      territoryName: "Scotland",
      targetNationId: "usa",
      mode: "ANNEX",
    });

    assert.equal(state.territoryMap["Scotland"], "usa");
    assert.equal(
      state.territoryStatusMap["Scotland"],
      "TERRITORY",
      "Annexed land must be classified as a territory before being granted statehood"
    );
  });
});
