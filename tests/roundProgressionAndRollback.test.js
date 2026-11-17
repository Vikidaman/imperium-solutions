import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  advanceSimulationTime,
  evaluateSimulation,
  runBudgetAndDividendUpdater,
  upsertPoliticalPartyInState,
  deletePoliticalPartyInState,
  executeSimulatedElectionInState,
} from "../server/engine.js";
import {
  buildSimplifiedSeed,
  DEFAULT_POLITICAL_PARTIES,
  US_STATE_ELECTORAL_DATA,
  cloneDefaultPolicies,
  computeTaxRatesFromPosture,
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

  it("models asymmetric bell-curve tax burden distribution, Income Equality in governance, severe underfunding decay, high-governance maluses, and elastic outlook/inflation", () => {
    // 1. Bell-curve tax distribution shift: Low-income peak (0.18) vs Upper-income progressive peak (0.85)
    const lowModeState = buildSimplifiedSeed();
    lowModeState.nations[0].taxDistributionMode = 0.18;
    evaluateSimulation(lowModeState);
    const lowC = lowModeState.nations[0].computed;

    const highModeState = buildSimplifiedSeed();
    highModeState.nations[0].taxDistributionMode = 0.85;
    evaluateSimulation(highModeState);
    const highC = highModeState.nations[0].computed;

    assert.equal(lowC.bellCurveTaxIncidence.skewDirection, "right-tailed");
    assert.equal(highC.bellCurveTaxIncidence.skewDirection, "left-tailed");
    assert.ok(
      lowC.cohorts.lowIncome.taxBurden > highC.cohorts.lowIncome.taxBurden,
      "Lower-income tax peak must raise low-income cohort effective tax burden"
    );
    assert.ok(
      highC.cohorts.upperClass.taxBurden > lowC.cohorts.upperClass.taxBurden,
      "Upper-income tax peak must raise upper-class cohort effective tax burden"
    );
    assert.ok(
      lowC.cohorts.lowIncome.livingStandard < highC.cohorts.lowIncome.livingStandard,
      "Right-tailed lower-income tax burden must reduce low-income Standard of Living"
    );
    assert.ok(
      lowC.aggregateDemand.consumption < highC.aggregateDemand.consumption,
      "Shifting tax burden to high-MPC low-income households must reduce Aggregate Consumption C"
    );
    assert.ok(
      lowC.incomeEqualityIndex < highC.incomeEqualityIndex,
      "Right-tailed lower-income tax peak must reduce Income Equality Index"
    );

    // 2. Severe underfunding penalties across all 6 governance metrics including Income Equality
    const underState = buildSimplifiedSeed();
    underState.nations[0].enactedPolicies = {
      education: { enacted: true, funding: "underfunded" },
      infrastructure: { enacted: true, funding: "underfunded" },
      innovation: { enacted: true, funding: "underfunded" },
      governance: { enacted: true, funding: "underfunded" },
    };
    evaluateSimulation(underState);
    const initialUnderGrowth = underState.nations[0].computed.forecast.finalGrowth;
    const initialEquality = underState.nations[0].computed.incomeEqualityIndex;

    assert.ok(
      underState.nations[0].computed.policyProgression.neglectedCount === 4,
      "All 4 underfunded policies should activate compounding institutional neglect multiplier"
    );
    assert.ok(
      initialUnderGrowth < 0,
      `Systemic underfunding must severely penalize 1-year GDP outlook, got ${initialUnderGrowth}%`
    );

    advanceSimulationTime(underState, 360);
    assert.ok(underState.nations[0].literacyRate <= 0.88, "Underfunded education should cause steep literacy decay");
    assert.ok(underState.nations[0].infrastructureEfficiency <= 0.77, "Underfunded infrastructure should erode rapidly");
    assert.ok(underState.nations[0].kFactorScaler <= 1300, "Underfunded R&D should shrink TFP K-factor steeply");
    assert.ok(underState.nations[0].computed.incomeEqualityIndex < initialEquality - 0.03, "Underfunded governance & education should erode Income Equality");

    // 3. High-Governance Maluses & Qualitative Explanations + Elastic Inflation
    const malusState = buildSimplifiedSeed();
    const mUsa = malusState.nations[0];
    mUsa.literacyRate = 0.996;
    mUsa.kFactorScaler = 2400;
    mUsa.urbanisationIndex = 0.96;
    mUsa.infrastructureEfficiency = 0.97;
    mUsa.consumerSentiment = 105;
    mUsa.workerShareOverride = 0.72;
    mUsa.equalityDrift = 0.14;
    evaluateSimulation(malusState);
    const mc = mUsa.computed;
    const maluses = mc.governanceDiagnostics.maluses;

    assert.ok(maluses.literacy.active, "Literacy > 94% must trigger Graduate Underemployment malus");
    assert.ok(maluses.productivity.active, "K-Factor > 1800 must trigger Automation Structural Unemployment malus");
    assert.ok(maluses.urbanisation.active, "Urbanisation > 88% must trigger Metro Housing Inflation malus");
    assert.ok(maluses.infrastructure.active, "Infrastructure > 91% must trigger Maintenance Overhead malus");
    assert.ok(maluses.sentiment.active, "Sentiment > 85 must trigger Overheating & Import Leakage malus");
    assert.ok(maluses.equality.active, "Income Equality > 70% must trigger Wage Compression & Capital Drag malus");
    assert.ok(mc.unemploymentRate > 0.08, "Graduate mismatch + automation displacement must visibly raise unemploymentRate");
    assert.ok(
      mc.governanceDiagnostics.explanations.literacy.includes("capable"),
      "Qualitative governance explanations must describe capability for high literacy"
    );

    // 4. Monetary policy elasticity on Inflation and GDP growth
    const hikeState = buildSimplifiedSeed();
    hikeState.nations[0].centralBankRate = 0.095;
    evaluateSimulation(hikeState);
    const baseState = evaluateSimulation(buildSimplifiedSeed());
    assert.ok(
      hikeState.nations[0].computed.inflationRate < baseState.nations[0].computed.inflationRate - 0.015,
      "Fed rate hike must elastically lower inflation by more than 1.5 percentage points"
    );
    assert.ok(
      hikeState.nations[0].computed.forecast.finalGrowth < baseState.nations[0].computed.forecast.finalGrowth - 0.8,
      "Fed rate hike must elastically compress 1-year GDP growth outlook"
    );
  });

  it("computes SoL from Good Governance Trajectory, scales resource/knowledge endowments by funding, and correlates bell-curve tax modifiers, social policies, custom parties & 538-EV elections", () => {
    // 1. Standard of Living as weighted aggregate of Good Governance Trajectory
    const solState = buildSimplifiedSeed();
    evaluateSimulation(solState);
    const lowGovState = buildSimplifiedSeed();
    lowGovState.nations[0].literacyRate = 0.65;
    lowGovState.nations[0].infrastructureEfficiency = 0.55;
    lowGovState.nations[0].urbanisationIndex = 0.60;
    lowGovState.nations[0].consumerSentiment = 35;
    lowGovState.nations[0].kFactorScaler = 800;
    evaluateSimulation(lowGovState);

    assert.ok(solState.nations[0].computed.solBreakdown, "solBreakdown must be populated");
    assert.ok(
      solState.nations[0].computed.sol > lowGovState.nations[0].computed.sol + 10,
      "Degrading Good Governance indicators must strongly reduce Standard of Living"
    );

    // 2. Policy funding directly gates Natural Resource & Services/Knowledge endowments and sector output
    const fundedState = buildSimplifiedSeed();
    fundedState.nations[0].enactedPolicies = {
      education: { enacted: true, funding: "landmark" },
      infrastructure: { enacted: true, funding: "landmark" },
      innovation: { enacted: true, funding: "landmark" },
      governance: { enacted: true, funding: "landmark" },
    };
    evaluateSimulation(fundedState);

    const repealedState = buildSimplifiedSeed();
    repealedState.nations[0].enactedPolicies = {
      education: { enacted: false, funding: "underfunded" },
      infrastructure: { enacted: false, funding: "underfunded" },
      innovation: { enacted: false, funding: "underfunded" },
      governance: { enacted: false, funding: "underfunded" },
    };
    evaluateSimulation(repealedState);

    const fMult = fundedState.nations[0].computed.endowmentPolicyMultipliers;
    const rMult = repealedState.nations[0].computed.endowmentPolicyMultipliers;
    assert.ok(
      fMult.stemTalentMultiplier > rMult.stemTalentMultiplier + 0.35,
      "Repealing Education & R&D must drastically degrade STEM & University Talent endowment multiplier"
    );
    assert.ok(
      fMult.resourceExtractionMultiplier > rMult.resourceExtractionMultiplier + 0.25,
      "Repealing Infrastructure & Innovation must degrade Natural Resource realization multiplier"
    );
    assert.ok(
      fundedState.nations[0].computed.officeGdp > repealedState.nations[0].computed.officeGdp * 1.4,
      "Knowledge & Services sector GDP must dynamically drop when R&D & Education are repealed"
    );

    // 3. Bell-curve tax rate correlation across Lower, Middle, and Upper Income peaks
    const lowPeak = computeTaxRatesFromPosture(0.24, 0.15);
    const midPeak = computeTaxRatesFromPosture(0.24, 0.50);
    const highPeak = computeTaxRatesFromPosture(0.24, 0.85);

    assert.ok(
      lowPeak.salesTax > midPeak.salesTax && lowPeak.salesTax > highPeak.salesTax,
      "Sales & consumption tax must peak when tax burden is positioned on Lower Class (m=0.15)"
    );
    assert.ok(
      midPeak.incomeTax > lowPeak.incomeTax && midPeak.incomeTax > highPeak.incomeTax,
      "Income tax must peak when tax burden is positioned on Middle Class (m=0.50)"
    );
    assert.ok(
      highPeak.corporateTax > midPeak.corporateTax && highPeak.corporateTax > lowPeak.corporateTax,
      "Corporate tax must peak when tax burden is positioned on Upper Income (m=0.85)"
    );
    assert.ok(
      highPeak.capitalGainsTax > midPeak.capitalGainsTax && highPeak.capitalGainsTax > lowPeak.capitalGainsTax,
      "Capital gains tax must peak when tax burden is positioned on Upper Income (m=0.85)"
    );

    // 4. Social Policies (UDHR Human Rights Freedoms & Social Obligations)
    const charterState = buildSimplifiedSeed();
    charterState.nations[0].socialPolicies = {
      civilLibertiesCharter: "strong",
      privacyAndDueProcess: "strong",
      economicAndLaborRights: "strong",
      nationalCivicService: "strong",
      environmentalStewardship: "strong",
      corporateSocialObligation: "strong",
    };
    evaluateSimulation(charterState);

    const restrictedState = buildSimplifiedSeed();
    restrictedState.nations[0].socialPolicies = {
      civilLibertiesCharter: "low",
      privacyAndDueProcess: "low",
      economicAndLaborRights: "low",
      nationalCivicService: "low",
      environmentalStewardship: "low",
      corporateSocialObligation: "low",
    };
    evaluateSimulation(restrictedState);

    assert.ok(
      charterState.nations[0].computed.socialPolicyEval.humanRightsIndex >= 95,
      "Strong UDHR freedom policies must yield near-100 humanRightsIndex"
    );
    assert.ok(
      charterState.nations[0].computed.socialPolicyEval.civicObligationIndex >= 95,
      "Strong social obligation policies must yield near-100 civicObligationIndex"
    );
    assert.ok(
      charterState.nations[0].computed.sol > restrictedState.nations[0].computed.sol + 4,
      "Strong human rights charter & obligations must raise Standard of Living relative to restriction"
    );

    // 5. Custom Party Creation, Modification, Deletion & 538-EV Election Simulation
    const totalEvCheck = Object.values(US_STATE_ELECTORAL_DATA).reduce((s, d) => s + d.ev, 0);
    assert.equal(totalEvCheck, 538, "All 50 states + DC must sum to exactly 538 Electoral Votes");

    const partyState = buildSimplifiedSeed();
    evaluateSimulation(partyState);
    assert.equal(partyState.electionForecast.stateResults.length, 51, "Election must model 50 states + DC");
    const castEvSum = partyState.electionForecast.electoralStandings.reduce((s, p) => s + p.ev, 0);
    assert.equal(castEvSum, 538, "Electoral standings must distribute all 538 EVs");

    upsertPoliticalPartyInState(partyState, {
      name: "Forward Technocrats",
      color: "#8b5cf6",
      politicalAlignment: "Techno-Progressive",
      baseTaxLevel: 0.28,
      taxDistributionMode: 0.72,
      currentSupport: 0.35,
      makeRulingParty: true,
    });
    assert.equal(partyState.nations[0].rulingParty, "Forward Technocrats");
    assert.ok(
      partyState.politicalParties.some((p) => p.name === "Forward Technocrats"),
      "Custom party must be persisted in state.politicalParties"
    );

    const elecResult = executeSimulatedElectionInState(partyState, { inaugurateWinner: true });
    assert.ok(elecResult.record.winner, "Simulated election must produce a winner");
    assert.equal(partyState.nations[0].electionHistory.length, 1, "Election record must be saved to history");

    // Verify deleting a non-ruling party works cleanly
    const victimName = partyState.politicalParties.find(
      (p) => p.name !== partyState.nations[0].rulingParty
    )?.name;
    assert.ok(victimName);
    deletePoliticalPartyInState(partyState, victimName);
    assert.ok(
      !partyState.politicalParties.some((p) => p.name === victimName),
      "Deleted non-ruling party should be removed from roster"
    );
  });

  it("supports unlocked fractional ultra-slow and multi-year ultra-fast auto-clock day accumulation", () => {
    const clockState = buildSimplifiedSeed();
    evaluateSimulation(clockState);
    assert.equal(clockState.timeManager.crisisDate, "2025-01-01");

    // 4 fractional ticks of 0.25 days (simulating e.g. 15 d/hr => 0.25 d/tick) must accumulate to +1 day
    for (let i = 0; i < 3; i++) {
      advanceSimulationTime(clockState, 0.25);
      assert.equal(clockState.timeManager.crisisDate, "2025-01-01");
      assert.ok(clockState.timeManager.fractionalDays > 0);
    }
    advanceSimulationTime(clockState, 0.25);
    assert.equal(clockState.timeManager.crisisDate, "2025-01-02");
    assert.equal(clockState.timeManager.fractionalDays, 0);

    // High-speed 720-day leap (e.g. 43200 d/hr) must settle 8 quarters without hanging
    const { quartersCrossed } = advanceSimulationTime(clockState, 720);
    assert.equal(quartersCrossed, 8);
    assert.ok(clockState.timeManager.quarterNumber >= 9);
  });

  it("models 0-100% tax bounds, corruption vs business-permit trade-off, racial equality & crime control trajectories, honeymoon approval with speech weighting, and scheduled elections", () => {
    // 1. 0% to 100% Base Level of Tax
    const zeroRates = computeTaxRatesFromPosture(0.0, 0.50);
    assert.equal(zeroRates.incomeTax, 0);
    assert.equal(zeroRates.corporateTax, 0);
    assert.equal(zeroRates.capitalGainsTax, 0);
    assert.equal(zeroRates.salesTax, 0);

    const highTaxState = buildSimplifiedSeed();
    highTaxState.nations[0].baseTaxLevel = 0.85;
    evaluateSimulation(highTaxState);
    assert.ok(
      highTaxState.nations[0].computed.incomeTax > 0.70,
      "High base tax (85%) should drive extreme income tax rates"
    );
    assert.ok(
      highTaxState.nations[0].computed.forecast.finalGrowth < -4.0,
      `Exaggerated Laffer tax choke at 85% must steeply contract GDP outlook, got ${highTaxState.nations[0].computed.forecast.finalGrowth}%`
    );

    // 2. Corruption Index trade-off (fast-track permits vs trust, sentiment & crime)
    const corruptState = buildSimplifiedSeed();
    corruptState.nations[0].socialPolicies = {
      civilLibertiesCharter: "low",
      privacyAndDueProcess: "balanced",
      economicAndLaborRights: "balanced",
      nationalCivicService: "balanced",
      environmentalStewardship: "balanced",
      corporateSocialObligation: "balanced",
      antiCorruptionAndEthics: "low",
    };
    evaluateSimulation(corruptState);

    const cleanState = buildSimplifiedSeed();
    cleanState.nations[0].socialPolicies = {
      civilLibertiesCharter: "strong",
      privacyAndDueProcess: "strong",
      economicAndLaborRights: "balanced",
      nationalCivicService: "balanced",
      environmentalStewardship: "balanced",
      corporateSocialObligation: "balanced",
      antiCorruptionAndEthics: "strong",
    };
    evaluateSimulation(cleanState);

    assert.ok(
      corruptState.nations[0].computed.corruptionIndex > 60 &&
        cleanState.nations[0].computed.corruptionIndex < 15,
      "Patronage + restricted press must spike corruptionIndex well above clean ICAC governance"
    );
    assert.ok(
      corruptState.nations[0].computed.socialPolicyEval.businessEstablishmentBoost > 0,
      "Corrupt fast-track permits must provide a businessEstablishmentBoost"
    );
    assert.ok(
      corruptState.nations[0].computed.institutionalTrust <
        cleanState.nations[0].computed.institutionalTrust - 0.35,
      "Corruption must sharply depress institutional trust in government"
    );
    assert.ok(
      corruptState.nations[0].computed.crimeRate > cleanState.nations[0].computed.crimeRate + 0.03,
      "Corruption must increase crimeRate sharply"
    );

    // 3. Racial Equality & Public Safety / Crime Control trajectories
    const safetyCrisisState = buildSimplifiedSeed();
    safetyCrisisState.nations[0].enactedPolicies = {
      ...cloneDefaultPolicies("Democratic"),
      civilRights: { enacted: false, funding: "underfunded" },
      publicSafety: { enacted: false, funding: "underfunded" },
    };
    advanceSimulationTime(safetyCrisisState, 270);
    assert.ok(
      safetyCrisisState.nations[0].racialEqualityIndex < 0.63,
      "Repealed civilRights act must erode racialEqualityIndex over quarters"
    );
    assert.ok(
      safetyCrisisState.nations[0].crimeControlIndex < 0.68,
      "Repealed publicSafety act must erode crimeControlIndex over quarters"
    );

    // 4. Government Fatigue Mechanics, Opposition Surge, Sober GDP Outlook & Full-Map Election Archive
    const fatigueTestState = buildSimplifiedSeed();
    evaluateSimulation(fatigueTestState);
    const baselineOutlook = fatigueTestState.nations[0].computed.forecast.finalGrowth;
    assert.ok(
      baselineOutlook >= 1.2 && baselineOutlook <= 2.2,
      `Baseline 1-Yr US GDP outlook should be sober (~1.5-2.0%), got ${baselineOutlook}%`
    );

    // Put country into crisis with damaging underfunded policies and high existing fatigue
    fatigueTestState.nations[0].literacyRate = 0.64;
    fatigueTestState.nations[0].infrastructureEfficiency = 0.54;
    fatigueTestState.nations[0].consumerSentiment = 38;
    fatigueTestState.nations[0].crimeControlIndex = 0.48;
    fatigueTestState.nations[0].governmentFatigue = 72;
    evaluateSimulation(fatigueTestState);

    const tiredIncumbentName = fatigueTestState.nations[0].rulingParty;
    const highFatigueIncumbentPoll =
      fatigueTestState.electionForecast.nationalPolls.find((p) => p.name === tiredIncumbentName)
        ?.pollPct ?? 0;

    // Reset fatigue to 0 for same party (satisfied public) -> incumbent polls much higher than under high fatigue
    fatigueTestState.nations[0].governmentFatigue = 0;
    evaluateSimulation(fatigueTestState);
    const satisfiedIncumbentPoll =
      fatigueTestState.electionForecast.nationalPolls.find((p) => p.name === tiredIncumbentName)
        ?.pollPct ?? 0;
    assert.ok(
      satisfiedIncumbentPoll > highFatigueIncumbentPoll + 12,
      `High Government Fatigue (72%) must trigger strong opposition surge (incumbent ${highFatigueIncumbentPoll}% vs satisfied ${satisfiedIncumbentPoll}%)`
    );

    // Compare fatigue accumulation rates under:
    // (a) damaging cuts vs (b) stagnant terrible crisis vs (c) rapid high-impact landmark reforms
    const damagingState = buildSimplifiedSeed();
    damagingState.nations[0].enactedPolicies = {
      education: { enacted: false, funding: "underfunded" },
      infrastructure: { enacted: false, funding: "underfunded" },
      innovation: { enacted: false, funding: "underfunded" },
      governance: { enacted: false, funding: "underfunded" },
      civilRights: { enacted: false, funding: "underfunded" },
      publicSafety: { enacted: false, funding: "underfunded" },
    };
    evaluateSimulation(damagingState);
    const damagingRate = damagingState.electionForecast.fatigueRatePerQuarter;

    const stagnantCrisisState = buildSimplifiedSeed();
    stagnantCrisisState.nations[0].literacyRate = 0.60;
    stagnantCrisisState.nations[0].infrastructureEfficiency = 0.50;
    stagnantCrisisState.nations[0].consumerSentiment = 35;
    evaluateSimulation(stagnantCrisisState);
    const stagnantRate = stagnantCrisisState.electionForecast.fatigueRatePerQuarter;

    const rapidReformState = buildSimplifiedSeed();
    rapidReformState.nations[0].literacyRate = 0.72;
    rapidReformState.nations[0].infrastructureEfficiency = 0.62;
    rapidReformState.nations[0].enactedPolicies = {
      education: { enacted: true, funding: "landmark" },
      infrastructure: { enacted: true, funding: "landmark" },
      innovation: { enacted: true, funding: "landmark" },
      governance: { enacted: true, funding: "landmark" },
      civilRights: { enacted: true, funding: "landmark" },
      publicSafety: { enacted: true, funding: "landmark" },
    };
    evaluateSimulation(rapidReformState);
    const rapidReformRate = rapidReformState.electionForecast.fatigueRatePerQuarter;

    assert.ok(
      rapidReformRate < 2.5 && rapidReformRate < stagnantRate && stagnantRate < damagingRate,
      `Expected rapidReformRate (${rapidReformRate}) < stagnantRate (${stagnantRate}) < damagingRate (${damagingRate})`
    );

    // Switching ruling party resets Government Fatigue to 0, and electionHistory saves all 51 state results
    fatigueTestState.nations[0].governmentFatigue = 68;
    upsertPoliticalPartyInState(
      fatigueTestState,
      {
        name: "Republican",
        makeRulingParty: true,
        syncRulingNation: true,
      },
      "Republican"
    );
    assert.equal(
      fatigueTestState.nations[0].governmentFatigue,
      0,
      "Switching ruling party must reset Government Fatigue to 0"
    );

    // Compare Freedom-of-Speech weighting on approval sensitivity under elevated fatigue & poor governance
    const speechTestState = buildSimplifiedSeed();
    speechTestState.nations[0].literacyRate = 0.74;
    speechTestState.nations[0].infrastructureEfficiency = 0.64;
    speechTestState.nations[0].consumerSentiment = 45;
    speechTestState.nations[0].crimeControlIndex = 0.55;
    speechTestState.nations[0].governmentFatigue = 35;
    speechTestState.nations[0].socialPolicies = {
      ...speechTestState.nations[0].socialPolicies,
      civilLibertiesCharter: "strong",
    };
    evaluateSimulation(speechTestState);
    const openSpeechApproval = speechTestState.electionForecast.incumbentApproval;

    speechTestState.nations[0].socialPolicies = {
      ...speechTestState.nations[0].socialPolicies,
      civilLibertiesCharter: "low",
    };
    evaluateSimulation(speechTestState);
    const censoredSpeechApproval = speechTestState.electionForecast.incumbentApproval;
    assert.ok(
      openSpeechApproval < censoredSpeechApproval - 4,
      `Open Freedom of Speech must weight governance downturns more strongly (${openSpeechApproval}%) than restricted speech (${censoredSpeechApproval}%)`
    );

    const { record } = executeSimulatedElectionInState(speechTestState, {
      inaugurateWinner: true,
      electionType: "Snap Election",
    });
    assert.equal(
      record.stateResults?.length,
      51,
      "Historical election record must snapshot all 51 state/DC results for archive maps"
    );
    assert.ok(
      ["safe", "likely", "lean", "tossup"].includes(
        speechTestState.electionForecast.stateResults[0].cnnTier
      ),
      "Each state must expose CNN margin tier (safe, likely, lean, tossup)"
    );

    // 5. Scheduled Election Auto-Trigger
    const schedState = buildSimplifiedSeed();
    schedState.electionSchedule = {
      enabled: true,
      nextElectionDate: "2025-06-01",
      cycleYears: 4,
      autoInaugurate: true,
    };
    const resSched = advanceSimulationTime(schedState, 180);
    assert.equal(
      resSched.electionsHeld,
      1,
      "Crossing nextElectionDate must automatically trigger scheduled election"
    );
    assert.equal(
      schedState.nations[0].electionHistory[0]?.electionType,
      "Scheduled National Election"
    );
    assert.equal(
      schedState.electionSchedule.nextElectionDate,
      "2029-06-01",
      "Scheduled election must advance nextElectionDate by cycleYears"
    );
  });

  it("models party federalism adherence doctrines, state resource/services leverage, 435 House + 100 Senate midterms, fatigue breakdown, CNN dynamic exit polls, and state/national multi-demographic polls", () => {
    const state = buildSimplifiedSeed();
    evaluateSimulation(state);
    const fc = state.electionForecast;

    // 1. Fatigue factor breakdown & approval exit poll drivers
    assert.ok(Array.isArray(fc.fatigueFactors) && fc.fatigueFactors.length >= 5, "fatigueFactors breakdown must list at least 5 drivers");
    assert.ok(fc.approvalBreakdown, "National approvalBreakdown must be populated");
    assert.equal(
      Number((fc.approvalBreakdown.approvePct + fc.approvalBreakdown.disapprovePct).toFixed(1)),
      100,
      "Approve + Disapprove must sum to 100%"
    );
    assert.equal(
      Number((fc.approvalBreakdown.rightDirectionPct + fc.approvalBreakdown.wrongTrackPct).toFixed(1)),
      100,
      "Right Direction + Wrong Track must sum to 100%"
    );
    assert.ok(
      Array.isArray(fc.approvalBreakdown.topIssues) && fc.approvalBreakdown.topIssues.length >= 4,
      "CNN top issues ranking must be present"
    );

    // 2. Expanded National & State Multi-Demographic Polls
    assert.ok(fc.demographicPolls?.race?.length === 4, "National race demographics must include all 4 groups");
    assert.ok(fc.demographicPolls?.gender?.length === 2, "National gender demographics must include Men & Women");
    assert.ok(fc.demographicPolls?.educationAndAge?.length === 4, "Education & age cohorts must be populated");
    assert.ok(fc.demographicPolls?.communityType?.length === 3, "Urban/Suburban/Rural cohorts must be populated");

    const ca = fc.stateResults.find((s) => s.stateName === "California");
    const wy = fc.stateResults.find((s) => s.stateName === "Wyoming");
    assert.ok(ca && wy, "Both California and Wyoming state entries must be present");
    assert.equal(ca.fips, "06");
    assert.equal(wy.fips, "56");
    assert.ok(ca.federalism.federalAdherencePct > wy.federalism.federalAdherencePct + 20, "California (aligned with incumbent & pro-cooperative) must show far higher Federal Adherence than opposition States-Rights Wyoming");
    assert.ok(ca.federalism.servicesLeveragePct > wy.federalism.servicesLeveragePct, "California must exhibit stronger Services & STEM capital leverage");
    assert.ok(wy.federalism.resourceLeveragePct > 50, "Wyoming extractive resource endowments must contribute substantially to resourceLeveragePct");
    assert.ok(ca.demographicPolls?.race?.length === 4 && ca.approvalBreakdown, "Clicked states must expose full state-level exit polls & demographic crosstabs");

    // 3. U.S. Congress (435 House + 100 Senate) & Fatigue Midterm Backlash
    const houseTotal = fc.congress.house.standings.reduce((s, p) => s + p.seats, 0);
    const senateTotal = fc.congress.senate.standings.reduce((s, p) => s + p.seats, 0);
    assert.equal(houseTotal, 435, "U.S. House of Representatives must allocate exactly 435 seats across 50 states");
    assert.equal(senateTotal, 100, "U.S. Senate must allocate exactly 100 seats across 50 states");

    const baseIncHouseSeats =
      fc.congress.house.standings.find((p) => p.name === state.nations[0].rulingParty)?.seats || 0;

    // Simulate high government fatigue ahead of midterms -> incumbent loses House seats
    state.nations[0].governmentFatigue = 75;
    evaluateSimulation(state);
    const fatiguedIncHouseSeats =
      state.electionForecast.congress.house.standings.find((p) => p.name === state.nations[0].rulingParty)?.seats || 0;
    assert.ok(
      fatiguedIncHouseSeats < baseIncHouseSeats - 25,
      `High Government Fatigue (75%) must cause a severe midterm House seat backlash (${fatiguedIncHouseSeats} vs ${baseIncHouseSeats})`
    );

    // Executing a Midterm Congressional Election records Congress seats without swapping White House party
    const preMidtermPres = state.nations[0].rulingParty;
    const midRes = executeSimulatedElectionInState(state, {
      inaugurateWinner: false,
      electionType: "Midterm Congressional Election",
    });
    assert.equal(state.nations[0].rulingParty, preMidtermPres, "Midterm Congressional Election must keep the President's party unchanged");
    assert.ok(midRes.record.congress?.house?.standings?.length > 0, "Midterm record must preserve certified House & Senate standings");

    // 4. Upserting a party preserves federalismPolicy
    upsertPoliticalPartyInState(
      state,
      {
        name: "Federal Unionists",
        federalismPolicy: "pro_federalist",
        baseTaxLevel: 0.25,
        taxDistributionMode: 0.60,
      },
      null
    );
    const createdFed = state.politicalParties.find((p) => p.name === "Federal Unionists");
    assert.equal(createdFed?.federalismPolicy, "pro_federalist", "Custom party must persist federalismPolicy doctrine");

    // 5. National federalismSummary attached on forecast & usa.computed
    const baseFedState = evaluateSimulation(buildSimplifiedSeed());
    assert.ok(
      baseFedState.electionForecast.federalismSummary.alignedStatesCount >= 10,
      "Baseline healthy admin must align with at least 10 state governments"
    );
    const fs = state.electionForecast.federalismSummary;
    assert.ok(fs && typeof fs.avgFederalAdherencePct === "number", "federalismSummary.avgFederalAdherencePct must be populated");
    assert.ok(fs.alignedStatesCount >= 0 && fs.alignedStatesCount <= 51, "alignedStatesCount must stay within 0..51 jurisdictions");
    assert.ok(fs.federalStateFrictionIndex >= 0 && fs.federalStateFrictionIndex <= 100, "federalStateFrictionIndex must remain bounded 0-100");
    assert.deepStrictEqual(state.nations[0].computed.federalismSummary, fs, "usa.computed.federalismSummary must match forecast");
  });
});
