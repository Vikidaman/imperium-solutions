import React, { useState } from "react";
import {
  Clock,
  Play,
  Pause,
  FastForward,
  History,
  Download,
  Upload,
  RotateCcw,
  Activity,
  Table2,
  Zap,
  Lock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  formatCurrency,
  formatCompactNumber,
  formatPercent,
} from "../utils/formatters";

export default function LedgerAndTimeView({
  session,
  ledgerHistory,
  activityLog,
  onTimeAction,
  onResetScenario,
  onCreateNewScenario,
}) {
  const state = session?.state || {};
  const tm = state.timeManager || {};
  const [randomizeHype, setRandomizeHype] = useState(false);
  const [chartMetric, setChartMetric] = useState("aggregateGdp");
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioType, setNewScenarioType] = useState("interstellar");
  const [showConsolidatedSheet, setShowConsolidatedSheet] = useState(false);

  // Prepare historical line chart series for top nations
  const topNations = (state.nations || []).slice(0, 6);
  const colors = [
    "#06b6d4",
    "#f59e0b",
    "#10b981",
    "#a855f7",
    "#f43f5e",
    "#3b82f6",
  ];

  const lineData = (ledgerHistory || []).map((entry) => {
    const row = {
      label: `Q${entry.quarter} (${entry.crisisDate})`,
    };
    for (const nSnap of entry.snapshot?.nations || []) {
      if (chartMetric === "aggregateGdp" || chartMetric === "treasuryBalance") {
        row[nSnap.name] = Number(((nSnap[chartMetric] || 0) / 1e9).toFixed(2));
      } else if (chartMetric === "unemploymentRate") {
        row[nSnap.name] = Number(((nSnap[chartMetric] || 0) * 100).toFixed(2));
      } else {
        row[nSnap.name] = Number((nSnap[chartMetric] || 0).toFixed(2));
      }
    }
    return row;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.id}-q${tm.quarterNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        onCreateNewScenario({
          name: `Imported: ${file.name.replace(".json", "")}`,
          scenarioType: "custom",
          customState: parsed,
        });
      } catch (err) {
        alert("Invalid scenario JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const liveStatusBadge =
    tm.liveStatus === "VIRGIN"
      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
      : tm.isLive
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : "bg-amber-500/20 text-amber-300 border-amber-500/40";

  return (
    <div className="space-y-6">
      {/* Time Manager Sheet Replica (C3:I6) & Apps Script Triggers */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Manager Sheet (`C3:I6`) & Apps Script Engine
              </h3>
              <p className="text-xs text-slate-400">
                Implements <code className="text-cyan-300">Load()</code>,{" "}
                <code className="text-cyan-300">Lock()</code>,{" "}
                <code className="text-cyan-300">Reset()</code>,{" "}
                <code className="text-cyan-300">Timer()</code>,{" "}
                <code className="text-cyan-300">NuevoGDPManager()</code>,{" "}
                <code className="text-cyan-300">BudgetUpdater()</code>,{" "}
                <code className="text-cyan-300">DividendUpdater()</code> &{" "}
                <code className="text-cyan-300">Summarizer()</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Cell F5 Status:</span>
              <span
                className={`px-2.5 py-1 rounded-md border text-xs font-mono-num font-bold ${liveStatusBadge}`}
              >
                {tm.liveStatus || (tm.isLive ? "TRUE" : "FALSE")}
              </span>
            </div>
          </div>

          {/* Exact Cells Matrix C3:F6 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono-num text-slate-500">
                Cell C3 • Interval (days / H)
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="1"
                  step="15"
                  value={tm.intervalDaysPerHour || 90}
                  onChange={(e) =>
                    onTimeAction({
                      intervalDaysPerHour: Number(e.target.value),
                    })
                  }
                  className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono-num font-bold text-white"
                />
                <span className="text-[11px] text-slate-400">
                  ({((tm.intervalDaysPerHour || 90) / 60).toFixed(2)}d / tick)
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono-num text-slate-500">
                Cell C4 • Crisis Start Date
              </div>
              <input
                type="date"
                value={tm.crisisStartDate || "2025-01-01"}
                onChange={(e) =>
                  onTimeAction({ crisisStartDate: e.target.value })
                }
                className="mt-1 w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono-num text-white"
              />
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono-num text-slate-500">
                Cell C5 • Crisis Date (Current)
              </div>
              <div className="text-base font-bold font-mono-num text-cyan-300 mt-1">
                {tm.crisisDate}
              </div>
              <div className="text-[10px] text-slate-400">
                F2 Days Elapsed: {tm.daysElapsed}d
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="text-[10px] font-mono-num text-slate-500">
                Cell F4 • Next Payment Date
              </div>
              <div className="text-base font-bold font-mono-num text-emerald-300 mt-1">
                {tm.nextPaymentDate}
              </div>
              <div className="text-[10px] text-slate-400">
                F6 Date Diff:{" "}
                <span
                  className={
                    tm.dateDiff < 3 ? "text-amber-400 font-bold" : "text-slate-300"
                  }
                >
                  {tm.dateDiff}d
                </span>{" "}
                | F3: Q{tm.quarterNumber}
              </div>
            </div>
          </div>

          {/* Checkbox I2, I3, I4, I5 & Script Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => onTimeAction({ command: "LOAD" })}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 cursor-pointer"
              title="Checkbox I2 -> Load(): Sets F5=TRUE, initializes C5=C4 if VIRGIN"
            >
              <Play className="w-3.5 h-3.5" />
              [I2] Start Timer (Load)
            </button>

            <button
              onClick={() => onTimeAction({ command: "LOCK" })}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/15 cursor-pointer"
              title="Checkbox I3 -> Lock(): Sets F5=FALSE"
            >
              <Lock className="w-3.5 h-3.5" />
              [I3] Stop Timer (Lock)
            </button>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to reset? (Sets F5 = VIRGIN, C5 = C4, F4 = C4+90d, and resets scenario)"
                  )
                ) {
                  onResetScenario();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Checkbox I4 -> Reset(): Sets F5=VIRGIN, C5=C4, F4=C4+90, clears Ledger"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              [I4] Reset Timer & Ledger
            </button>

            <button
              onClick={() => setShowConsolidatedSheet((v) => !v)}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 border cursor-pointer ${
                showConsolidatedSheet
                  ? "bg-cyan-500 text-slate-950 border-cyan-400"
                  : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30"
              }`}
              title="Checkbox I5 -> Summarizer(): Builds 'Full Consolidated Data' from all summary sheets"
            >
              <Table2 className="w-3.5 h-3.5" />
              [I5] {showConsolidatedSheet ? "Hide" : "Open"} Full Consolidated Data (Summarizer)
            </button>
          </div>

          {/* Direct Step / NuevoGDPManager Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={() =>
                onTimeAction({ command: "TIMER_TICK", randomizeHype })
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              title="Executes 1 Timer() tick: adds Interval/60 days to Crisis Date"
            >
              Run Timer() Tick (+
              {((tm.intervalDaysPerHour || 90) / 60).toFixed(2)}d)
            </button>

            <button
              onClick={() =>
                onTimeAction({
                  command: "NUEVO_GDP_MANAGER",
                  randomizeHype,
                })
              }
              className="px-3.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Directly runs NuevoGDPManager(): NextPaymentDate +90d, BudgetUpdater() & DividendUpdater()"
            >
              <Zap className="w-3.5 h-3.5" />
              Trigger NuevoGDPManager (BudgetUpdater + DividendUpdater)
            </button>

            <button
              onClick={() => onTimeAction({ daysToAdd: 90, randomizeHype })}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              Advance +90 Days (Full Quarter)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeHype}
                onChange={(e) => setRandomizeHype(e.target.checked)}
                className="accent-cyan-400"
              />
              Re-roll Company Hype Factor (RANDBETWEEN(1,25) + Sentiment) on Quarter Update
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(state.strictSheetQuirks)}
                onChange={(e) =>
                  onTimeAction({ strictSheetQuirks: e.target.checked })
                }
                className="accent-amber-400"
              />
              Strict Sheet Formula Mode (Use raw Col 8 Sector Sum & raw Working Pops for secondary nations)
            </label>
          </div>
        </div>

        {/* Scenario Export / Reset / Clone */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-300">
            Scenario Persistence & Snapshots
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportJson}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <label className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-slate-400 text-[11px]">
              Create New Parallel Multiplayer Room:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Session Name..."
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
              />
              <select
                value={newScenarioType}
                onChange={(e) => setNewScenarioType(e.target.value)}
                className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
              >
                <option value="interstellar">Interstellar 2.0</option>
                <option value="vietnam">Vietnam 1977</option>
              </select>
              <button
                onClick={() => {
                  if (!newScenarioName.trim()) return;
                  onCreateNewScenario({
                    name: newScenarioName.trim(),
                    scenarioType: newScenarioType,
                  });
                  setNewScenarioName("");
                }}
                className="px-3 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summarizer() Output: Full Consolidated Data Table */}
      {showConsolidatedSheet && (
        <div className="bg-slate-900/80 border border-cyan-500/40 rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                Full Consolidated Data (`Summarizer()` Output — Earth Full Data + Mars Full Data)
              </h3>
              <p className="text-xs text-slate-400">
                Consolidates all sheets tagged with <code className="text-emerald-300">A3 == "summary"</code> (`B2:AM15`)
              </p>
            </div>
            <button
              onClick={() => setShowConsolidatedSheet(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">State / Planet</th>
                  <th className="py-2.5 px-2 text-right">Agri GDP</th>
                  <th className="py-2.5 px-2 text-right">Ind GDP</th>
                  <th className="py-2.5 px-2 text-right">Hosp GDP</th>
                  <th className="py-2.5 px-2 text-right">Office GDP</th>
                  <th className="py-2.5 px-2 text-right">Working Pops (G)</th>
                  <th className="py-2.5 px-2 text-right">Wages (H)</th>
                  <th className="py-2.5 px-2 text-right">Unemp (I)</th>
                  <th className="py-2.5 px-2 text-right">SOL (K)</th>
                  <th className="py-2.5 px-2 text-right">Lit (L)</th>
                  <th className="py-2.5 px-2 text-right">Crime (M)</th>
                  <th className="py-2.5 px-2 text-right">Urb (N)</th>
                  <th className="py-2.5 px-2 text-right">Pop Grow (R)</th>
                  <th className="py-2.5 px-2 text-right">State Income (AD)</th>
                  <th className="py-2.5 px-2 text-right">State Exp (AG)</th>
                  <th className="py-2.5 px-2 text-right">Net Budget (AI/Col35)</th>
                  <th className="py-2.5 px-3 text-right">Treasury (AJ/Col36)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {(state.nations || []).map((n) => {
                  const c = n.computed || {};
                  return (
                    <tr key={n.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-sans font-semibold text-white">
                        {n.name}{" "}
                        <span className="text-[10px] text-slate-400">
                          ({n.planet})
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-300">
                        {formatCurrency(c.agriculturalGdp)}
                      </td>
                      <td className="py-2 px-2 text-right text-amber-300">
                        {formatCurrency(c.industryGdp)}
                      </td>
                      <td className="py-2 px-2 text-right text-purple-300">
                        {formatCurrency(c.hospitalityGdp)}
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-300">
                        {formatCurrency(c.officeGdp)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200">
                        {formatCompactNumber(c.effectiveWorkingPops)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-300">
                        {formatCurrency(c.quarterlyWages)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200">
                        {formatPercent(c.unemploymentRate)}
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-300 font-bold">
                        {(c.sol || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {formatPercent(c.literacyRate, 1)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {formatPercent(c.crimeRate, 2)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-300">
                        {formatPercent(c.urbanisationIndex, 1)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {formatPercent(c.popGrowthRate, 2, true)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200">
                        {formatCurrency(c.stateIncome)}
                      </td>
                      <td className="py-2 px-2 text-right text-rose-300">
                        {formatCurrency(c.stateExpenditures)}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-bold ${
                          c.netBudgetBalance >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(c.netBudgetBalance)}
                      </td>
                      <td className="py-2 px-3 text-right text-cyan-300 font-bold">
                        {formatCurrency(c.treasuryBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Quarterly Ledger Chart & Multiplayer Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Quarterly Historical Ledger ({ledgerHistory?.length || 1} Quarters Recorded)
              </h3>
              <p className="text-xs text-slate-400">
                Every execution of <code className="text-cyan-300">NuevoGDPManager()</code> records a snapshot to the Ledger
              </p>
            </div>

            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="aggregateGdp">Aggregate GDP ($ Billions)</option>
              <option value="sol">Standard of Living (SOL)</option>
              <option value="quarterlyWages">Quarterly Wages ($)</option>
              <option value="unemploymentRate">Unemployment Rate (%)</option>
              <option value="treasuryBalance">Treasury Balance ($ Billions)</option>
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {topNations.map((n, idx) => (
                  <Line
                    key={n.id}
                    type="monotone"
                    dataKey={n.name}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Multiplayer Activity Feed */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 flex flex-col max-h-[380px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Activity className="w-4 h-4" />
            Live Crisis Room Activity Feed
          </h3>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs mt-2">
            {(activityLog || []).map((item) => (
              <div key={item.id} className="py-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{item.action}</span>
                  <span className="text-[10px] font-mono-num text-slate-500">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                  <span className="text-cyan-400">{item.actor}</span>
                  <span className="truncate max-w-[180px]">{item.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
