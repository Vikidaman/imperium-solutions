import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSimulation,
  addDaysToSimDate,
  diffSimDays,
  parseSimDate,
  formatSimDate,
} from "../server/engine.js";

describe("Macroeconomic Formulas and Bounds", () => {
  it("enforces unemployment rate between 0 and 1 even with anomalous pop stats", () => {
    const mockState = {
      nations: [
        {
          id: "test-nation",
          name: "Testland",
          planet: "Earth",
          population: 1000000,
          workingPopulationPercentage: 0.6,
          stateIncome: 500000000,
          stateExpenditures: 400000000,
          rawPops: 1000000,
          gdp: 10000000000,
          cashTreasury: 50000000,
          debt: 0,
          bondYieldSpread: 0.02,
          centralBankRate: 0.05,
          activeBonds: [],
          companies: [
            { id: "c1", employees: 2000000, currentPrice: 50, profitability: 0.1 },
          ],
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 15 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      timeManager: { quarter: 1, crisisDate: "2025-01-01", nextPaymentDate: "2025-04-01" },
    };

    evaluateSimulation(mockState);
    const nation = mockState.nations[0];
    assert.ok(
      nation.computed.unemploymentRate >= 0 && nation.computed.unemploymentRate <= 1,
      `Unemployment rate must be in [0, 1], got ${nation.computed.unemploymentRate}`
    );
  });

  it("prevents Standard of Living (SoL) from producing NaN or Infinity with zero wages or negative sentiment", () => {
    const mockState = {
      nations: [
        {
          id: "crisis-nation",
          name: "Crisis Nation",
          planet: "Earth",
          population: 500000,
          workingPopulationPercentage: 0.5,
          rawPops: 500000,
          literacyRate: 40,
          urbanisationIndex: 30,
          crimeRate: 50,
          mortalityRate: 20,
          consumerSentiment: 0, // Zero sentiment!
          quarterlyWages: 0,    // Zero wages!
          companies: [],
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 15 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      timeManager: { quarter: 1, crisisDate: "2025-01-01", nextPaymentDate: "2025-04-01" },
    };

    evaluateSimulation(mockState);
    const sol = mockState.nations[0].computed.sol;
    assert.ok(Number.isFinite(sol), `SoL must be finite, got ${sol}`);
    assert.ok(sol >= 1.0 && sol <= 50.0, `SoL must be bounded [1.0, 50.0], got ${sol}`);
  });

  it("correctly credits planetary federal contributions into net budget balance", () => {
    const mockState = {
      nations: [
        {
          id: "fed-nation",
          name: "Federal Nation",
          planet: "Earth",
          stateIncome: 1000000000,
          stateExpenditures: 800000000,
          diplomaticExpenses: -50000000,
          stateContributions: 20000000,
          companies: [],
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 25 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      timeManager: { quarter: 1, crisisDate: "2025-01-01", nextPaymentDate: "2025-04-01" },
    };

    evaluateSimulation(mockState);
    const c = mockState.nations[0].computed;
    assert.ok(Number.isFinite(c.federalContributions));
    assert.equal(
      c.netBudgetBalance,
      c.stateIncome + c.federalContributions - c.stateExpenditures + c.diplomaticExpenses
    );
  });

  it("models heterogeneous population cohorts (Low-Income, Middle-Class, Upper-Class) and distributional indicators", () => {
    const mockState = {
      nations: [
        {
          id: "welfare-state",
          name: "Social Democracy",
          planet: "Earth",
          population: 10000000,
          workingPopulationPercentage: 0.65,
          rawPops: 6500000,
          gdp: 500000000000,
          cashTreasury: 50000000000,
          centralBankRate: 0.035,
          legitimacy: 85,
          companies: [],
        },
      ],
      planetsSummary: [{ name: "Earth", sol: 22 }],
      planetsConfig: [{ id: "earth", name: "Earth" }],
      powerBlocs: [],
      timeManager: { quarter: 1, crisisDate: "2025-01-01", nextPaymentDate: "2025-04-01" },
    };

    evaluateSimulation(mockState);
    const c = mockState.nations[0].computed;

    assert.ok(c.cohorts, "Must model population cohorts");
    assert.ok(c.cohorts.lowIncome && c.cohorts.middleClass && c.cohorts.upperClass);
    assert.ok(c.cohorts.lowIncome.pops > 0);
    assert.ok(c.cohorts.upperClass.averageWage > c.cohorts.middleClass.averageWage);
    assert.ok(c.cohorts.middleClass.averageWage > c.cohorts.lowIncome.averageWage);

    assert.ok(Number.isFinite(c.giniCoefficient));
    assert.ok(c.giniCoefficient >= 0.2 && c.giniCoefficient <= 0.7);
    assert.ok(Number.isFinite(c.inflationRate));
    assert.ok(Number.isFinite(c.institutionalTrust));
    assert.ok(Number.isFinite(c.socialCohesion));
  });
});

describe("Proleptic Astronomical Date Arithmetic (500 BC to 3000 AD)", () => {
  it("advances dates accurately across AD quarters", () => {
    const next = addDaysToSimDate("2025-01-01", 90);
    assert.equal(next, "2025-04-01");
  });

  it("accurately parses, formats, and advances 500 BC dates without throwing RangeError", () => {
    const parsed = parseSimDate("-0500-01-01");
    assert.equal(parsed.year, -500);
    assert.equal(parsed.month, 1);
    assert.equal(parsed.day, 1);

    const formatted = formatSimDate(parsed);
    assert.equal(formatted, "-0500-01-01");

    const advanced90 = addDaysToSimDate("-0500-01-01", 90);
    assert.equal(advanced90, "-0500-04-01");

    const diff = diffSimDays("-0500-04-01", "-0500-01-01");
    assert.equal(diff, 90);
  });

  it("handles crossing year boundaries in negative years", () => {
    const advanced = addDaysToSimDate("-0500-11-01", 90);
    assert.equal(advanced, "-0499-01-30");
  });
});

