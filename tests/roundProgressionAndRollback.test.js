import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  evaluateSimulation,
  runBudgetAndDividendUpdater,
} from "../server/engine.js";
import { buildSimplifiedSeed } from "../server/simplifiedSeedConfig.js";

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

  it("allows manually setting starting Federal Debt and computes debt-to-GDP ratio", () => {
    const seed = buildSimplifiedSeed();
    const state = evaluateSimulation(seed);
    const usa = state.nations[0];

    assert.equal(usa.computed.publicDebt, 34500000000000);
    assert.ok(usa.computed.debtToGdpRatio > 100, "Baseline US debt-to-GDP should exceed 100%");

    // Manually edit starting debt to $25 Trillion
    usa.publicDebt = 25000000000000;
    evaluateSimulation(state);

    assert.equal(usa.computed.publicDebt, 25000000000000);
    assert.ok(
      usa.computed.debtToGdpRatio < 100,
      `Expected debt-to-GDP < 100%, got ${usa.computed.debtToGdpRatio}`
    );
  });

  it("accumulates federal budget deficits onto federal debt upon quarterly settlement", () => {
    const seed = buildSimplifiedSeed();
    const state = evaluateSimulation(seed);
    const usa = state.nations[0];

    const initialDebt = usa.computed.publicDebt;
    // Set an expenditure override to guarantee a deficit
    usa.budgetPercentOverride = 0.40;
    evaluateSimulation(state);

    const netBudget = usa.computed.netBudgetBalance;
    assert.ok(netBudget < 0, "High budget percentage should yield a deficit");

    runBudgetAndDividendUpdater(state);
    assert.ok(
      usa.publicDebt > initialDebt,
      `Public debt must increase after deficit. Was ${initialDebt}, now ${usa.publicDebt}`
    );
    assert.equal(
      usa.publicDebt,
      initialDebt - netBudget,
      "Deficit must be added to federal debt exactly"
    );
  });

  it("resets to initial start date and baseline conditions", () => {
    const seed = buildSimplifiedSeed();
    const state = evaluateSimulation(seed);
    const usa = state.nations[0];

    // Alter policies, advance time
    advanceSimulationTime(state, 180);
    usa.publicDebt = 50000000000000;
    usa.incomeTaxOverride = 0.45;
    evaluateSimulation(state);

    assert.equal(state.timeManager.quarter, 3);
    assert.equal(state.timeManager.crisisDate, "2025-06-30");
    assert.equal(usa.publicDebt, 50000000000000);

    // Reset using fresh seed
    const resetState = evaluateSimulation(buildSimplifiedSeed());
    assert.equal(resetState.timeManager.quarter, 1);
    assert.equal(resetState.timeManager.crisisDate, "2025-01-01");
    assert.equal(resetState.nations[0].computed.publicDebt, 34500000000000);
    assert.equal(resetState.nations[0].incomeTaxOverride, undefined);
  });
});
