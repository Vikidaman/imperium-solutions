import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  evaluateSimulation,
} from "../server/engine.js";

describe("Round Progression and United States Simulation Mechanics", () => {
  function createBaseState() {
    return {
      nations: [
        {
          id: "usa",
          name: "United States",
          workingPops: 168000000,
          treasuryBalance: 850000000000,
          centralBankRate: 0.045,
        },
      ],
      timeManager: {
        quarter: 1,
        crisisDate: "2025-01-01",
        crisisStartDate: "2025-01-01",
        nextPaymentDate: "2025-04-01",
        isLive: false,
      },
    };
  }

  it("advances simulation time and quarter deterministically for the United States", () => {
    const state = createBaseState();
    const result = advanceSimulationTime(state, 90);

    assert.equal(state.timeManager.crisisDate, "2025-04-01");
    assert.equal(result.quartersCrossed, 1);
    assert.equal(state.timeManager.quarter, 2);
    assert.equal(state.nations.length, 1);
    assert.equal(state.nations[0].id, "usa");
  });

  it("populates all 50 constituent US states on the United States nation object", () => {
    const state = createBaseState();
    evaluateSimulation(state);

    const usa = state.nations[0];
    assert.ok(usa, "United States must exist");
    assert.ok(Array.isArray(usa.constituentStates), "Must have constituentStates array");
    assert.ok(usa.constituentStates.length >= 50, "Must include all 50 US states");
    assert.ok(usa.computed.aggregateGdp > 0, "Aggregate US GDP must be positive");
  });
});
