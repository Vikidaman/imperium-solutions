import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  evaluateSimulation,
} from "../server/engine.js";

describe("Session Snapshot and Rollback Mechanics", () => {
  it("allows capturing and restoring full state snapshots across quarter progressions", () => {
    const initialState = {
      nations: [
        {
          id: "usa",
          name: "United States",
          planet: "Earth",
          population: 330000000,
          rawPops: 330000000,
          workingPopulationPercentage: 0.65,
          cashTreasury: 100000000000,
          centralBankRate: 0.05,
          bondYieldSpread: 0.015,
          activeBonds: [],
          companies: [],
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 20 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      timeManager: {
        quarter: 1,
        crisisDate: "2025-01-01",
        crisisStartDate: "2025-01-01",
        nextPaymentDate: "2025-04-01",
      },
    };

    evaluateSimulation(initialState);
    const snapshotQ1 = JSON.parse(JSON.stringify(initialState));

    // Progress to Q2
    advanceSimulationTime(initialState, 90);
    assert.equal(initialState.timeManager.quarter, 2);
    assert.equal(initialState.timeManager.crisisDate, "2025-04-01");
    const snapshotQ2 = JSON.parse(JSON.stringify(initialState));

    // Progress to Q3
    advanceSimulationTime(initialState, 90);
    assert.equal(initialState.timeManager.quarter, 3);
    assert.equal(initialState.timeManager.crisisDate, "2025-06-30");

    // Perform rollback to Q1 snapshot
    const restoredState = JSON.parse(JSON.stringify(snapshotQ1));
    restoredState.version = (initialState.version || 0) + 1;
    evaluateSimulation(restoredState);

    assert.equal(restoredState.timeManager.quarter, 1);
    assert.equal(restoredState.timeManager.crisisDate, "2025-01-01");
    assert.ok(restoredState.version > initialState.version, "Version must increment on rollback");
  });
});
