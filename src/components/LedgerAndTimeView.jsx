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
  Zap,
  Globe2,
  Rocket,
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
  const [randomizeHype, setRandomizeHype] = useState(true);
  const [chartMetric, setChartMetric] = useState("aggregateGdp");
  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioType, setNewScenarioType] = useState("interstellar");

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

  return (
    <div className="space-y-6">
      {/* Planetary Federation Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(state.planetsSummary || []).map((planet) => {
          const isMars = planet.name.toLowerCase().includes("mars");
          return (
            <div
              key={planet.name}
              className={`rounded-2xl border p-5 ${
                isMars
                  ? "bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border-orange-500/30"
                  : "bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border-cyan-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isMars
                        ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                        : "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                    }`}
                  >
                    {isMars ? (
                      <Rocket className="w-5 h-5" />
                    ) : (
                      <Globe2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white">
                      {planet.name} Federation Macroeconomics
                    </h3>
                    <p className="text-xs text-slate-400">
                      {planet.nationCount} Member States •{" "}
                      {formatCompactNumber(planet.workingPops)} Citizens
                    </p>
                  </div>
                </div>
                <div className="text-right font-mono-num">
                  <span className="text-[11px] text-slate-400 block">
                    Planetary GDP
                  </span>
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(planet.aggregateGdp)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Prosperity (SOL)
                  </span>
                  <span className="font-mono-num font-bold text-cyan-300">
                    {planet.sol.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Unemployment
                  </span>
                  <span className="font-mono-num font-bold text-slate-200">
                    {formatPercent(planet.unemploymentRate, 1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Federal Pool
                  </span>
                  <span className="font-mono-num font-bold text-amber-300">
                    {formatCurrency(planet.totalFedContributions)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Fiscal Balance
                  </span>
                  <span
                    className={`font-mono-num font-bold ${
                      planet.netBudgetBalance >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(planet.netBudgetBalance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* World Simulation Clock & Scenario Manager */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                World Simulation Clock & Economic Cycle Engine
              </h3>
              <p className="text-xs text-slate-400">
                Every 90-day quarterly settlement compounds national treasuries, demographic growth, corporate expansion, and sovereign fund dividends.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  tm.isLive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {tm.isLive ? "LIVE SIMULATION RUNNING" : "PAUSED"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">World Date</div>
              <div className="text-base font-bold font-mono-num text-white mt-0.5">
                {tm.crisisDate}
              </div>
              <div className="text-[10px] text-cyan-400">
                Quarter {tm.quarterNumber} ({tm.daysElapsed}d elapsed)
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">
                Next Quarterly Settlement
              </div>
              <div className="text-base font-bold font-mono-num text-emerald-300 mt-0.5">
                {tm.nextPaymentDate}
              </div>
              <div className="text-[10px] text-slate-400">
                In {tm.dateDiff} days
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">
                Auto-Clock Speed (Days/Hr)
              </div>
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
                className="mt-1 w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono-num font-bold text-white"
              />
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-amber-400 font-semibold">
                Custom Campaign Start Date
              </div>
              <input
                type="date"
                value={tm.crisisStartDate || "2025-01-01"}
                onChange={(e) =>
                  onTimeAction({
                    command: "SET_START_DATE",
                    startDate: e.target.value,
                    resetCurrentDate: true,
                  })
                }
                className="mt-1 w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono-num text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {!tm.isLive ? (
              <button
                onClick={() => onTimeAction({ command: "LOAD" })}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/15 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Start Real-Time Simulation
              </button>
            ) : (
              <button
                onClick={() => onTimeAction({ command: "LOCK" })}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/15 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Simulation
              </button>
            )}

            <button
              onClick={() => onTimeAction({ daysToAdd: 30, randomizeHype })}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs cursor-pointer"
            >
              +1 Month (30d)
            </button>

            <button
              onClick={() => onTimeAction({ daysToAdd: 90, randomizeHype })}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/15 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              Advance +1 Quarter (90d)
            </button>

            <button
              onClick={() => onTimeAction({ daysToAdd: 360, randomizeHype })}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs cursor-pointer"
            >
              +1 Year (4 Quarters)
            </button>
          </div>

          <div className="pt-1 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeHype}
                onChange={(e) => setRandomizeHype(e.target.checked)}
                className="accent-cyan-400"
              />
              Dynamic Market Sentiment Waves (fluctuates corporate brand hype each quarter based on consumer & sector sentiment)
            </label>
          </div>
        </div>

        {/* Scenario Save / Load / Reset */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
          <div className="font-bold uppercase tracking-wider text-slate-300">
            World Save States & Multiplayer Rooms
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportJson}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Save World JSON
            </button>
            <label className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Load World JSON
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
              Launch Parallel World Room:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New World Name..."
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
              />
              <select
                value={newScenarioType}
                onChange={(e) => setNewScenarioType(e.target.value)}
                className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
              >
                <option value="interstellar">Earth & Mars</option>
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

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Reset this world back to its initial starting borders and economy?"
                  )
                ) {
                  onResetScenario();
                }
              }}
              className="w-full py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset World to Starting Era
            </button>
          </div>
        </div>
      </div>

      {/* Historical Trajectories Chart & Geopolitical Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Historical Macroeconomic Trajectories ({ledgerHistory?.length || 1} Quarters)
              </h3>
              <p className="text-xs text-slate-400">
                Tracks superpower GDP, prosperity, wages, unemployment, and treasury reserves across quarters
              </p>
            </div>

            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="aggregateGdp">National GDP ($ Billions)</option>
              <option value="sol">Standard of Living (SOL)</option>
              <option value="quarterlyWages">Quarterly Wages ($)</option>
              <option value="unemploymentRate">Unemployment Rate (%)</option>
              <option value="treasuryBalance">Treasury Reserves ($ Billions)</option>
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

        {/* World Geopolitical & Economic Event Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col max-h-[380px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pb-3 border-b border-slate-800">
            <Activity className="w-4 h-4" />
            World Geopolitical & Economic Feed
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
