import React, { useEffect, useMemo, useState } from "react";
import {
  Flag,
  Vote,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Search,
  Award,
  Users,
  TrendingUp,
  History,
  Crown,
} from "lucide-react";
import {
  DEFAULT_POLITICAL_PARTIES,
  FUNDING_TIERS,
  POLICY_CATALOG,
  SOCIAL_POLICY_CATALOG,
  cloneDefaultPolicies,
  cloneDefaultSocialPolicies,
  computeTaxRatesFromPosture,
} from "../../server/simplifiedSeedConfig";

const FUNDING_TIER_ORDER = ["underfunded", "standard", "priority", "landmark"];
const SOCIAL_LEVEL_ORDER = ["low", "balanced", "strong"];
const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#eab308",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

function buildPartyDraft(party = null) {
  if (!party) {
    return {
      isNew: true,
      originalName: "",
      name: "",
      color: "#8b5cf6",
      politicalAlignment: "Populist Center",
      platformSummary:
        "Custom political movement with tailored tax bell-curve, governance funding, and social charter priorities.",
      baseTaxLevel: 0.24,
      taxDistributionMode: 0.54,
      workerShareOfGdp: 0.55,
      budgetAsPercentOfGdp: 0.215,
      deficitTargetAsPercentOfGdp: -0.025,
      currentSupport: 0.14,
      defaultPolicies: cloneDefaultPolicies("Democratic"),
      socialPolicies: cloneDefaultSocialPolicies("Democratic"),
      makeRulingParty: false,
      syncRulingNation: true,
    };
  }
  return {
    isNew: false,
    originalName: party.name,
    name: party.name,
    color: party.color || "#3b82f6",
    politicalAlignment: party.politicalAlignment || "Center",
    platformSummary: party.platformSummary || "",
    baseTaxLevel: Number(party.baseTaxLevel ?? 0.24),
    taxDistributionMode: Number(party.taxDistributionMode ?? 0.55),
    workerShareOfGdp: Number(party.workerShareOfGdp ?? 0.55),
    budgetAsPercentOfGdp: Number(party.budgetAsPercentOfGdp ?? 0.215),
    deficitTargetAsPercentOfGdp: Number(party.deficitTargetAsPercentOfGdp ?? -0.025),
    currentSupport: Number(party.currentSupport ?? 0.12),
    defaultPolicies: party.defaultPolicies
      ? structuredClone(party.defaultPolicies)
      : cloneDefaultPolicies(party.name),
    socialPolicies: party.socialPolicies
      ? structuredClone(party.socialPolicies)
      : cloneDefaultSocialPolicies(party.name),
    makeRulingParty: false,
    syncRulingNation: true,
  };
}

export default function PoliticalPartiesAndElectionsView({
  state,
  role = "director",
  isReadOnly = false,
  onUpsertParty,
  onDeleteParty,
  onRunElection,
  onSetRulingParty,
}) {
  const canEdit = role === "director" && !isReadOnly;
  const parties = useMemo(
    () =>
      Array.isArray(state?.politicalParties) && state.politicalParties.length > 0
        ? state.politicalParties
        : DEFAULT_POLITICAL_PARTIES,
    [state?.politicalParties]
  );

  const usa = state?.nations?.[0] || {};
  const rulingPartyName = usa.rulingParty || "Democratic";
  const forecast = state?.electionForecast || {};
  const electionHistory = Array.isArray(usa.electionHistory) ? usa.electionHistory : [];

  const [activeSubView, setActiveSubView] = useState("elections"); // "elections" | "studio"
  const [selectedPartyName, setSelectedPartyName] = useState(rulingPartyName);
  const [draft, setDraft] = useState(() =>
    buildPartyDraft(parties.find((p) => p.name === rulingPartyName) || parties[0])
  );
  const [busyAction, setBusyAction] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all"); // "all" | "battleground" | partyName

  useEffect(() => {
    if (draft.isNew) return;
    const matched = parties.find((p) => p.name === selectedPartyName) || parties[0];
    if (matched) {
      setDraft(buildPartyDraft(matched));
    }
  }, [parties, selectedPartyName]);

  const previewTaxRates = useMemo(
    () => computeTaxRatesFromPosture(draft.baseTaxLevel, draft.taxDistributionMode),
    [draft.baseTaxLevel, draft.taxDistributionMode]
  );

  const handleSelectParty = (party) => {
    setSelectedPartyName(party.name);
    setDraft(buildPartyDraft(party));
  };

  const handleStartNewParty = () => {
    setSelectedPartyName("__NEW__");
    setDraft(buildPartyDraft(null));
    setActiveSubView("studio");
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!canEdit || !onUpsertParty) return;
    if (!draft.name.trim()) return;
    setBusyAction(true);
    try {
      const payload = {
        name: draft.name.trim(),
        color: draft.color,
        politicalAlignment: draft.politicalAlignment,
        platformSummary: draft.platformSummary,
        baseTaxLevel: draft.baseTaxLevel,
        taxDistributionMode: draft.taxDistributionMode,
        workerShareOfGdp: draft.workerShareOfGdp,
        budgetAsPercentOfGdp: draft.budgetAsPercentOfGdp,
        deficitTargetAsPercentOfGdp: draft.deficitTargetAsPercentOfGdp,
        currentSupport: draft.currentSupport,
        defaultPolicies: draft.defaultPolicies,
        socialPolicies: draft.socialPolicies,
        makeRulingParty: draft.makeRulingParty,
        syncRulingNation: true,
      };
      await onUpsertParty(payload, draft.isNew ? null : draft.originalName);
      setSelectedPartyName(payload.name);
      setDraft((prev) => ({
        ...prev,
        isNew: false,
        originalName: payload.name,
        makeRulingParty: false,
      }));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!canEdit || !onDeleteParty || draft.isNew) return;
    if (draft.originalName === rulingPartyName) return;
    setBusyAction(true);
    try {
      await onDeleteParty(draft.originalName);
      setSelectedPartyName(rulingPartyName);
    } finally {
      setBusyAction(false);
    }
  };

  const handleTriggerElection = async (inaugurateWinner) => {
    if (!canEdit || !onRunElection) return;
    setBusyAction(true);
    try {
      await onRunElection({ inaugurateWinner });
    } finally {
      setBusyAction(false);
    }
  };

  const evStandings = forecast.electoralStandings || [];
  const nationalPolls = forecast.nationalPolls || [];
  const battlegrounds = forecast.battlegrounds || [];
  const stateResults = forecast.stateResults || [];
  const cohortVotes = forecast.cohortVotes || {};

  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    return stateResults.filter((st) => {
      if (stateFilter === "battleground" && !st.isBattleground) return false;
      if (
        stateFilter !== "all" &&
        stateFilter !== "battleground" &&
        st.winner !== stateFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        st.stateName.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q) ||
        st.winner.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q)
      );
    });
  }, [stateResults, stateSearch, stateFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-View Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Flag className="w-4 h-4" />
            Political System, Ideology & Electoral Simulator
          </div>
          <h2 className="text-xl font-bold text-white flex flex-wrap items-center gap-2.5">
            <span>Party Postures & 538-EV National Elections</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              Incumbent: {rulingPartyName}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubView("elections")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubView === "elections"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              Election Forecast & Map
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView("studio")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubView === "studio"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Party Studio ({parties.length})
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleStartNewParty}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Party
            </button>
          )}
        </div>
      </div>

      {activeSubView === "elections" ? (
        <div className="space-y-6">
          {/* Headline KPI Row & Election Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Electoral College Projection (538 Total · 270 to Win)
                  </div>
                  <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
                    <Crown className="w-6 h-6 text-amber-400" />
                    <span>{forecast.projectedWinner || rulingPartyName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Incumbent Approval
                    </div>
                    <div
                      className={`text-xl font-mono font-bold ${
                        Number(forecast.incumbentApproval ?? 50) >= 50
                          ? "text-emerald-400"
                          : "text-amber-300"
                      }`}
                    >
                      {Number(forecast.incumbentApproval ?? 50).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 538 EV Stacked Horizontal Bar with 270 Marker */}
              <div className="relative pt-2 pb-1">
                <div className="w-full h-7 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex">
                  {evStandings
                    .filter((p) => p.ev > 0)
                    .map((p) => {
                      const widthPct = (p.ev / 538) * 100;
                      return (
                        <div
                          key={p.name}
                          style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                          className="h-full flex items-center justify-center text-[11px] font-mono font-bold text-white/95 transition-all overflow-hidden px-1"
                          title={`${p.name}: ${p.ev} EV (${p.statesWon} states)`}
                        >
                          {p.ev >= 24 ? `${p.ev}` : ""}
                        </div>
                      );
                    })}
                </div>
                {/* 270 Threshold Pin */}
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${(270 / 538) * 100}%` }}
                >
                  <div className="w-0.5 h-full bg-white/80 shadow" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                  <span>0 EV</span>
                  <span className="text-white font-semibold">270 Majority Line</span>
                  <span>538 EV</span>
                </div>
              </div>

              {/* Party National Standing Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                {evStandings.map((p) => (
                  <div
                    key={p.name}
                    className="bg-slate-950/75 border border-slate-800 rounded-xl p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-lg font-bold text-white">{p.ev}</span>
                      <span className="text-[11px] text-slate-400">{p.pollPct}% pop</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {p.statesWon} {p.statesWon === 1 ? "state" : "states"} led
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hold Election Controls + Voter Cohorts */}
            <div className="lg:col-span-4 bg-slate-900/75 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  <Vote className="w-4 h-4" />
                  Call National Election
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Polling dynamically reacts to Real GDP growth, Inflation, Standard of Living,
                  Income Equality, Tax Burden Distribution, and Human Rights charter scores across all 50 states and D.C.
                </p>
                {canEdit ? (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleTriggerElection(true)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow cursor-pointer transition"
                    >
                      <Award className="w-4 h-4" />
                      Hold Election & Inaugurate Winner
                    </button>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleTriggerElection(false)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 cursor-pointer transition"
                    >
                      Simulate & Record Poll Result Only
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    Spectator View — only the Simulation Director can certify and call national elections.
                  </div>
                )}
              </div>

              {/* Quick Swing Summary */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Swing Battlegrounds (&lt;5% Margin)</span>
                  <span className="font-mono text-amber-300">{battlegrounds.length} states</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {battlegrounds.length === 0 ? (
                    <span className="text-[11px] text-slate-500">
                      Landslide environment — no tight battlegrounds (&lt;5%).
                    </span>
                  ) : (
                    battlegrounds.slice(0, 10).map((b) => (
                      <span
                        key={b.stateName}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-200 flex items-center gap-1"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: b.winnerColor }}
                        />
                        {b.code} ({b.ev}) +{b.margin}%
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Voter Cohort Polling & Ideology Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                key: "lowIncome",
                title: "Lower-Income Households",
                subtitle: "Sensitive to sales tax, equality & healthcare",
              },
              {
                key: "middleClass",
                title: "Middle-Class Voters",
                subtitle: "Sensitive to income tax, inflation & infra",
              },
              {
                key: "upperClass",
                title: "Upper-Income & Capital",
                subtitle: "Sensitive to corporate/cap gains taxes & R&D",
              },
            ].map((cohort) => {
              const rows = cohortVotes[cohort.key] || [];
              return (
                <div
                  key={cohort.key}
                  className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      {cohort.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {cohort.subtitle}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {rows.map((r) => (
                      <div key={r.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.name}
                          </span>
                          <span className="font-mono font-semibold text-white">
                            {r.pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 51-Jurisdiction State-by-State Electoral Table */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  State-by-State Electoral Performance (50 States + D.C.)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time modeled vote share and winner-take-all Electoral College allocation across jurisdictions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Filter state, code, party..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All 51 Jurisdictions</option>
                  <option value="battleground">Swing States (&lt;5%)</option>
                  {parties.map((p) => (
                    <option key={p.name} value={p.name}>
                      Won by {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">State / Jurisdiction</th>
                    <th className="py-2.5 px-3 text-right">EV</th>
                    <th className="py-2.5 px-3">Projected Leader</th>
                    <th className="py-2.5 px-3 text-right">Lead %</th>
                    <th className="py-2.5 px-3">Runner-Up</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
                  {filteredStates.map((st) => (
                    <tr key={st.stateName} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 font-medium text-white">
                        {st.stateName}{" "}
                        <span className="text-[10px] font-mono text-slate-500">({st.code})</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                        {st.ev}
                      </td>
                      <td className="py-2 px-3 font-semibold text-white">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: st.winnerColor }}
                          />
                          {st.winner}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-200">
                        {st.winnerPct}%
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {st.runnerUp} ({st.runnerUpPct}%)
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                        +{st.margin}%
                      </td>
                      <td className="py-2 px-3">
                        {st.isBattleground ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                            Toss-up
                          </span>
                        ) : st.margin < 12 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            Lean
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Safe
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Election History */}
          {electionHistory.length > 0 && (
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <History className="w-4 h-4 text-blue-400" />
                Certified National Election History
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {electionHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">
                        Q{rec.quarter} · {rec.date}
                      </span>
                      {rec.inaugurated && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Inaugurated
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-white text-sm">
                      Winner: {rec.winner}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      {rec.winnerEv} / 538 EV · {rec.winnerPollPct}% Popular Vote
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Party Studio: Modify Postures & Create Custom Parties */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Rail: Roster of Parties */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Registered Parties
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleStartNewParty}
                    className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Party
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {parties.map((p) => {
                  const isRuling = p.name === rulingPartyName;
                  const isSelected = !draft.isNew && selectedPartyName === p.name;
                  const pollEntry = nationalPolls.find((n) => n.name === p.name);
                  const evEntry = evStandings.find((n) => n.name === p.name);
                  return (
                    <div
                      key={p.name}
                      onClick={() => handleSelectParty(p)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? "bg-slate-800/80 border-blue-500/60 shadow-lg"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-white truncate">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || "#94a3b8" }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isRuling && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shrink-0">
                            Ruling
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{p.politicalAlignment}</span>
                        <span className="font-mono text-slate-300">
                          {evEntry ? `${evEntry.ev} EV` : ""} ·{" "}
                          {pollEntry ? `${pollEntry.pollPct}%` : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/70">
                        <span>Base Tax: {Math.round(Number(p.baseTaxLevel ?? 0.24) * 100)}%</span>
                        <span>Mode: P{Math.round(Number(p.taxDistributionMode ?? 0.55) * 100)}</span>
                        {!isRuling && canEdit && onSetRulingParty && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onSetRulingParty(p);
                            }}
                            className="text-blue-400 hover:text-blue-300 font-sans font-semibold cursor-pointer"
                          >
                            Install in Office
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Form: Party Posture Configurator & Creator */}
          <form
            onSubmit={handleSaveDraft}
            className="lg:col-span-8 bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-white">
                  {draft.isNew
                    ? "Create New Political Party"
                    : `Edit Party Posture: ${draft.originalName}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure ideological tax bell curve, core funding mandates, and human rights / social obligations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!draft.isNew &&
                  draft.originalName !== rulingPartyName &&
                  parties.length > 2 &&
                  canEdit && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Party
                    </button>
                  )}
                {canEdit && (
                  <button
                    type="submit"
                    disabled={busyAction || !draft.name.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow cursor-pointer transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {draft.isNew ? "Create Party" : "Save Party Posture"}
                  </button>
                )}
              </div>
            </div>

            {/* Identity & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Party Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Forward Technocrats"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Ideological Alignment
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={draft.politicalAlignment}
                  onChange={(e) =>
                    setDraft({ ...draft, politicalAlignment: e.target.value })
                  }
                  placeholder="Center-Left / Techno-Progressive"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Electoral Color
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setDraft({ ...draft, color: hex })}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${
                        draft.color === hex
                          ? "border-white scale-110"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Party Manifesto & Economic Platform
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={draft.platformSummary}
                onChange={(e) =>
                  setDraft({ ...draft, platformSummary: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tax Base & Bell-Curve Distribution Sliders + Live Modifiers */}
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Party Tax Posture & Bell-Curve Class Incidence
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Live statutory tax calculator
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">Base Level of Tax</span>
                    <span className="font-mono font-bold text-amber-300">
                      {Math.round(draft.baseTaxLevel * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.12}
                    max={0.40}
                    step={0.01}
                    disabled={!canEdit}
                    value={draft.baseTaxLevel}
                    onChange={(e) =>
                      setDraft({ ...draft, baseTaxLevel: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>12% Minimal State</span>
                    <span>24% Mixed</span>
                    <span>40% Nordic Model</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">
                      Bell-Curve Modal Position
                    </span>
                    <span className="font-mono font-bold text-sky-300">
                      P{Math.round(draft.taxDistributionMode * 100)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.10}
                    max={0.90}
                    step={0.02}
                    disabled={!canEdit}
                    value={draft.taxDistributionMode}
                    onChange={(e) =>
                      setDraft({ ...draft, taxDistributionMode: Number(e.target.value) })
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Lower Class (Sales Max)</span>
                    <span>Middle (Income Max)</span>
                    <span>Upper (Corp/CG Max)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Income Tax</div>
                  <div className="font-mono font-bold text-sky-300 text-sm">
                    {(previewTaxRates.incomeTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Corporate Profit</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    {(previewTaxRates.corporateTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Capital Gains</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    {(previewTaxRates.capitalGainsTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Sales / VAT</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {(previewTaxRates.salesTax * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Core Funding Priorities + Social Charter Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Default Core Act Funding
                </div>
                {POLICY_CATALOG.map((spec) => {
                  const cur = draft.defaultPolicies?.[spec.id] || {
                    enacted: true,
                    funding: "standard",
                  };
                  return (
                    <div
                      key={spec.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{spec.shortName}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                defaultPolicies: {
                                  ...draft.defaultPolicies,
                                  [spec.id]: { ...cur, enacted: !cur.enacted },
                                },
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                              cur.enacted
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {cur.enacted ? "Enacted" : "Repealed"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {FUNDING_TIER_ORDER.map((tKey) => {
                          const isSel = cur.enacted && cur.funding === tKey;
                          return (
                            <button
                              key={tKey}
                              type="button"
                              disabled={!canEdit}
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  defaultPolicies: {
                                    ...draft.defaultPolicies,
                                    [spec.id]: { enacted: true, funding: tKey },
                                  },
                                })
                              }
                              className={`py-1 rounded text-[10px] font-semibold border cursor-pointer ${
                                isSel
                                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                            >
                              {FUNDING_TIERS[tKey].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Default Social Charter & Obligations
                </div>
                {SOCIAL_POLICY_CATALOG.map((spec) => {
                  const curLevel = draft.socialPolicies?.[spec.id] || "balanced";
                  const isFreedom = spec.category === "individual_freedom";
                  return (
                    <div
                      key={spec.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-white truncate">
                          {spec.shortName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            isFreedom
                              ? "bg-sky-500/15 text-sky-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {isFreedom ? "UDHR" : "Duty"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {SOCIAL_LEVEL_ORDER.map((lvlKey) => {
                          const lvl = spec.levels[lvlKey];
                          const isSel = curLevel === lvlKey;
                          return (
                            <button
                              key={lvlKey}
                              type="button"
                              disabled={!canEdit}
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  socialPolicies: {
                                    ...draft.socialPolicies,
                                    [spec.id]: lvlKey,
                                  },
                                })
                              }
                              className={`py-1 px-1 rounded text-[9px] font-semibold border truncate cursor-pointer ${
                                isSel
                                  ? isFreedom
                                    ? "bg-sky-500/20 text-sky-200 border-sky-500/50"
                                    : "bg-amber-500/20 text-amber-200 border-amber-500/50"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                              title={lvl.label}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {draft.isNew && canEdit && (
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.makeRulingParty}
                  onChange={(e) =>
                    setDraft({ ...draft, makeRulingParty: e.target.checked })
                  }
                  className="rounded accent-emerald-500"
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Immediately inaugurate as Governing Ruling Party
              </label>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
