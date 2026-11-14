import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  evaluateSimulation,
  runBudgetAndDividendUpdater,
} from "../server/engine.js";
import {
  buildSimplifiedSeed,
  DEFAULT_POLITICAL_PARTIES,
  cloneDefaultPolicies,
} from "../server/simplifiedSeedConfig.js";

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

  it("satisfies Aggregate Demand identity (Y = C + I + G + NX) and keeps 1-Year GDP growth consistent with 4-quarter progression", () => {
    const seed = buildSimplifiedSeed();
    const state = evaluateSimulation(seed);
    const usa = state.nations[0];
    const ad = usa.computed.aggregateDemand;

    assert.ok(ad, "Must compute Aggregate Demand breakdown");
    const sumAd = ad.consumption + ad.investment + ad.governmentSpending + ad.netExports;
    assert.ok(
      Math.abs(sumAd - usa.computed.aggregateGdp) < 1,
      `AD components (C + I + G + NX = ${sumAd}) must equal aggregateGdp (${usa.computed.aggregateGdp})`
    );

    const initialGdp = usa.computed.aggregateGdp;
    const forecast1YrPct = usa.computed.forecast.finalGrowth;
    assert.ok(
      forecast1YrPct > 1.0 && forecast1YrPct < 4.5,
      `Baseline 1-year GDP growth outlook should be realistic (~2.2%), got ${forecast1YrPct}%`
    );

    // Advance 4 quarters (360 days = 1 full year)
    advanceSimulationTime(state, 360);
    const after1YrGdp = usa.computed.aggregateGdp;
    const actualGrowthPct = ((after1YrGdp - initialGdp) / initialGdp) * 100;

    // Must NOT double; actual 4-quarter GDP growth must closely track the 1-year GDP growth outlook
    assert.ok(
      Math.abs(actualGrowthPct - forecast1YrPct) < 0.25,
      `Expected 4-quarter GDP change (${actualGrowthPct.toFixed(2)}%) to match 1-Year GDP Outlook (${forecast1YrPct.toFixed(2)}%)`
    );

    // Verify Aggregate Demand policy sensitivity (cutting taxes & boosting infrastructure increases C, I, raw GDP, and growth rate)
    const stimState = evaluateSimulation(buildSimplifiedSeed());
    const stimUsa = stimState.nations[0];
    const baseGdp = stimUsa.computed.aggregateGdp;
    const baseGrowth = stimUsa.computed.forecast.finalGrowth;

    stimUsa.incomeTaxOverride = 0.15;
    stimUsa.corporateTaxOverride = 0.15;
    stimUsa.infrastructureEfficiency = 0.95;
    stimUsa.consumerSentiment = 85;
    evaluateSimulation(stimState);

    assert.ok(
      stimUsa.computed.aggregateGdp > baseGdp,
      "Pro-demand fiscal and infrastructure expansion must increase raw Aggregate Demand GDP"
    );
    assert.ok(
      stimUsa.computed.forecast.finalGrowth > baseGrowth,
      "Pro-demand fiscal and infrastructure expansion must increase projected 1-Year GDP growth rate"
    );
  });

  it("applies political party preferences for taxes, infrastructure investment, and deficit/surplus targets", () => {
    const snapshots = {};
    for (const party of DEFAULT_POLITICAL_PARTIES) {
      const seed = buildSimplifiedSeed();
      const usa = seed.nations[0];
      usa.rulingParty = party.name;
      usa.enactedPolicies = cloneDefaultPolicies(party.name);
      evaluateSimulation(seed);
      const c = usa.computed;
      snapshots[party.name] = {
        incomeTax: c.incomeTax,
        corporateTax: c.corporateTax,
        salesTax: c.salesTax,
        infraShare: c.partyPreferences.infrastructureInvestmentShare,
        fiscalBalancePctOfGdp: c.fiscalBalancePctOfGdp,
      };
      assert.strictEqual(c.incomeTax, party.incomeTaxPreference);
      assert.strictEqual(c.corporateTax, party.corporateTaxRate);
      assert.strictEqual(c.salesTax, party.salesTaxPreference);
      assert.strictEqual(c.partyPreferences.infrastructureInvestmentShare, party.infrastructureInvestmentShare);
    }

    assert.ok(
      snapshots["Libertarian Free-Market"].fiscalBalancePctOfGdp > 0,
      "Libertarian Free-Market platform should run a fiscal surplus (% of GDP)"
    );
    assert.ok(
      snapshots["Progressive Labor"].fiscalBalancePctOfGdp < snapshots["Democratic"].fiscalBalancePctOfGdp,
      "Progressive Labor should run a wider fiscal deficit than Democratic"
    );
    assert.ok(
      snapshots["Democratic"].fiscalBalancePctOfGdp < 0 && snapshots["Republican"].fiscalBalancePctOfGdp < 0,
      "Democratic and Republican platforms should run calibrated fiscal deficits"
    );
    assert.ok(
      snapshots["Progressive Labor"].infraShare > snapshots["Libertarian Free-Market"].infraShare,
      "Progressive Labor should allocate higher infrastructure investment (% of GDP) than Libertarian Free-Market"
    );
  });

  it("progresses governance indicators from Q1 starting baseline through policy enactment and funding", () => {
    const landmarkSeed = buildSimplifiedSeed();
    const landmarkUsa = landmarkSeed.nations[0];
    landmarkUsa.enactedPolicies = {
      education: { enacted: true, funding: "landmark" },
      infrastructure: { enacted: true, funding: "landmark" },
      innovation: { enacted: true, funding: "landmark" },
      governance: { enacted: true, funding: "landmark" },
    };
    evaluateSimulation(landmarkSeed);
    const landmarkBaseBal = landmarkUsa.computed.fiscalBalancePctOfGdp;

    const repealedSeed = buildSimplifiedSeed();
    const repealedUsa = repealedSeed.nations[0];
    repealedUsa.enactedPolicies = {
      education: { enacted: false, funding: "underfunded" },
      infrastructure: { enacted: false, funding: "underfunded" },
      innovation: { enacted: false, funding: "underfunded" },
      governance: { enacted: false, funding: "underfunded" },
    };
    evaluateSimulation(repealedSeed);
    const repealedBaseBal = repealedUsa.computed.fiscalBalancePctOfGdp;

    // Landmark funding should cost more (wider deficit) than repealing all acts
    assert.ok(
      landmarkBaseBal < repealedBaseBal,
      `Landmark package fiscal balance (${landmarkBaseBal}) must be lower than repealed package (${repealedBaseBal})`
    );

    // Advance 4 quarters (1 full year)
    advanceSimulationTime(landmarkSeed, 360);
    advanceSimulationTime(repealedSeed, 360);

    // Starting baseline preserves Q1 starting point
    assert.strictEqual(landmarkUsa.startingBaseline.literacyRate, 0.92);
    assert.strictEqual(landmarkUsa.startingBaseline.infrastructureEfficiency, 0.82);

    // Landmark acts grow all 5 governance metrics vs Q1 start & vs repealed acts
    assert.ok(landmarkUsa.literacyRate > 0.92);
    assert.ok(landmarkUsa.infrastructureEfficiency > 0.82);
    assert.ok(landmarkUsa.urbanisationIndex > 0.83);
    assert.ok(landmarkUsa.consumerSentiment > 65);
    assert.ok(landmarkUsa.kFactorScaler > 1500);

    assert.ok(repealedUsa.literacyRate < 0.92);
    assert.ok(repealedUsa.infrastructureEfficiency < 0.82);
    assert.ok(repealedUsa.urbanisationIndex < 0.83);
    assert.ok(repealedUsa.consumerSentiment < 65);
    assert.ok(repealedUsa.kFactorScaler < 1500);

    assert.ok(
      landmarkUsa.computed.forecast.finalGrowth > repealedUsa.computed.forecast.finalGrowth,
      "Sustained landmark governance & innovation investment should yield stronger long-run GDP growth outlook"
    );
  });
});
