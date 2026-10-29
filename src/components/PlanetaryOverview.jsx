import React, { useState } from "react";
import {
  Globe2,
  Rocket,
  TrendingUp,
  Users,
  Building2,
  ShieldAlert,
  PlusCircle,
  ArrowUpRight,
  Sparkles,
  Scale,
  Landmark,
} from "lucide-react";
import {
  BarChart,
  Bar,
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
  getShortSectorName,
} from "../utils/formatters";

export default function PlanetaryOverview({
  state,
  onSelectNation,
  onCreateNation,
  onUpdateNation,
}) {
  const [selectedPlanetFilter, setSelectedPlanetFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNationForm, setNewNationForm] = useState({
    name: "",
    planet: "Mars",
    templateNationId: state.nations?.[0]?.id || "",
    workingPops: 25000000,
    literacyRate: 0.9,
    urbanisationIndex: 0.8,
    infrastructureEfficiency: 0.85,
    rulingParty: state.politicalParties?.[0]?.name || "Republican",
    specializedIndustry: "Industry & Manufacturing GDP",
    crimePolicy: "Beat Cops",
    healthcarePolicy: "State-run Healthcare",
    kFactorScaler: 1500,
    companyCount: 25,
  });

  const planets = state.planetsSummary || [];
  const nations = state.nations || [];

  const filteredNations =
    selectedPlanetFilter === "ALL"
      ? nations
      : nations.filter((n) => n.planet === selectedPlanetFilter);

  const chartData = filteredNations.map((n) => ({
    name: n.name,
    Agriculture: Math.round((n.computed?.agriculturalGdp || 0) / 1e9),
    Industry: Math.round((n.computed?.industryGdp || 0) / 1e9),
    Hospitality: Math.round((n.computed?.hospitalityGdp || 0) / 1e9),
    Office: Math.round((n.computed?.officeGdp || 0) / 1e9),
    totalGdpB: Number(((n.computed?.aggregateGdp || 0) / 1e9).toFixed(2)),
    sol: Number((n.computed?.sol || 0).toFixed(2)),
  }));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newNationForm.name.trim()) return;
    await onCreateNation(newNationForm);
    setShowCreateModal(false);
    setNewNationForm((prev) => ({ ...prev, name: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Planet Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedPlanetFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              selectedPlanetFilter === "ALL"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            All Planetary Bodies ({nations.length})
          </button>
          {planets.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedPlanetFilter(p.name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                selectedPlanetFilter === p.name
                  ? p.name.toLowerCase().includes("mars")
                    ? "bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/30"
                    : "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {p.name.toLowerCase().includes("mars") ? (
                <Rocket className="w-3.5 h-3.5" />
              ) : (
                <Globe2 className="w-3.5 h-3.5" />
              )}
              {p.name} ({p.nationCount})
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/15 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Found New Nation / Colony
        </button>
      </div>

      {/* Planetary Federation Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {planets.map((planet) => {
          const isMars = planet.name.toLowerCase().includes("mars");
          return (
            <div
              key={planet.name}
              className={`rounded-xl border p-5 relative overflow-hidden ${
                isMars
                  ? "bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border-orange-500/30"
                  : "bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border-cyan-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
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
                    <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      {planet.name} Federation Summary
                      <span className="text-xs font-mono-num px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {planet.nationCount} States
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Aggregate Macroeconomic & Demographic Balance Sheet
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Aggregate GDP</div>
                  <div className="text-2xl font-bold font-mono-num text-white">
                    {formatCurrency(planet.aggregateGdp)}
                  </div>
                </div>
              </div>

              {/* 4 Sector Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Agriculture GDP
                  </div>
                  <div className="text-sm font-bold font-mono-num text-slate-100 mt-0.5">
                    {formatCurrency(planet.agriculturalGdp)}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="text-[11px] text-amber-400 font-medium">
                    Industry & Mfg GDP
                  </div>
                  <div className="text-sm font-bold font-mono-num text-slate-100 mt-0.5">
                    {formatCurrency(planet.industryGdp)}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="text-[11px] text-purple-400 font-medium">
                    Hospitality GDP
                  </div>
                  <div className="text-sm font-bold font-mono-num text-slate-100 mt-0.5">
                    {formatCurrency(planet.hospitalityGdp)}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="text-[11px] text-cyan-400 font-medium">
                    Office & Corp GDP
                  </div>
                  <div className="text-sm font-bold font-mono-num text-slate-100 mt-0.5">
                    {formatCurrency(planet.officeGdp)}
                  </div>
                </div>
              </div>

              {/* Macro Indicators Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Working Pops</span>
                  <span className="font-mono-num font-semibold text-slate-200">
                    {formatCompactNumber(planet.workingPops)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Weighted SOL</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
                    {planet.sol.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unemployment</span>
                  <span className="font-mono-num font-semibold text-slate-200">
                    {formatPercent(planet.unemploymentRate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Avg Wages/Q</span>
                  <span className="font-mono-num font-semibold text-emerald-300">
                    {formatCurrency(planet.averageWages)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fed Pool</span>
                  <span className="font-mono-num font-semibold text-amber-300">
                    {formatCurrency(planet.totalFedContributions)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Fiscal</span>
                  <span
                    className={`font-mono-num font-semibold ${
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

      {/* Sector GDP Comparison Chart */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              National Sector GDP Comparison ($ Billions)
            </h3>
            <p className="text-xs text-slate-400">
              Stacked real-time output across Agricultural, Manufacturing, Hospitality, and Corporate Office sectors
            </p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            >
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `$${v}B`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                }}
                formatter={(value) => [`$${Number(value).toLocaleString()}B`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="Agriculture"
                stackId="gdp"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Industry"
                stackId="gdp"
                fill="#f59e0b"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Hospitality"
                stackId="gdp"
                fill="#a855f7"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Office"
                stackId="gdp"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Nations & Colonies Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" />
              Nations, States & Planetary Colonies Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Click any nation row to open its full Country Simulator Desk, adjust taxes, or manage companies & tariffs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Nation / Colony</th>
                <th className="py-3 px-3">Planet / Status</th>
                <th className="py-3 px-3">Ruling Party</th>
                <th className="py-3 px-3 text-right">Aggregate GDP</th>
                <th className="py-3 px-3 text-right">Working Pops</th>
                <th className="py-3 px-3 text-right">Unemp %</th>
                <th className="py-3 px-3 text-right">Wages / Q</th>
                <th className="py-3 px-3 text-right">SOL</th>
                <th className="py-3 px-3 text-right">Literacy</th>
                <th className="py-3 px-3 text-right">Crime Rate</th>
                <th className="py-3 px-3 text-right">Pop Growth</th>
                <th className="py-3 px-3 text-right">Net Budget</th>
                <th className="py-3 px-3 text-right">Corp Valuation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredNations.map((n) => {
                const c = n.computed || {};
                const isMars = (n.planet || "").toLowerCase().includes("mars");
                return (
                  <tr
                    key={n.id}
                    onClick={() => onSelectNation(n.id)}
                    className="hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <span>{n.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                    </td>
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={n.planet}
                        onChange={(e) =>
                          onUpdateNation(n.id, { planet: e.target.value })
                        }
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border bg-slate-950 cursor-pointer ${
                          isMars
                            ? "border-orange-500/40 text-orange-300"
                            : "border-cyan-500/40 text-cyan-300"
                        }`}
                        title="Change planetary federation or declare independence"
                      >
                        <option value="Earth">Earth</option>
                        <option value="Mars">Mars</option>
                        <option value="Independent Orbit">Independent Orbit</option>
                        {n.planet !== "Earth" &&
                          n.planet !== "Mars" &&
                          n.planet !== "Independent Orbit" && (
                            <option value={n.planet}>{n.planet}</option>
                          )}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{n.rulingParty}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-white">
                      {formatCurrency(c.aggregateGdp)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {formatCompactNumber(c.effectiveWorkingPops)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num ${
                        c.unemploymentRate > 0.12
                          ? "text-amber-400"
                          : c.unemploymentRate < 0
                          ? "text-rose-400"
                          : "text-slate-300"
                      }`}
                    >
                      {formatPercent(c.unemploymentRate)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-emerald-300">
                      {formatCurrency(c.quarterlyWages)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-cyan-300">
                      {(c.sol || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {formatPercent(c.literacyRate, 1)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {formatPercent(c.crimeRate, 2)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num ${
                        c.popGrowthRate >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {formatPercent(c.popGrowthRate, 2, true)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num font-semibold ${
                        c.netBudgetBalance >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatCurrency(c.netBudgetBalance)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {formatCurrency(c.totalValuation)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNation(n.id);
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition cursor-pointer"
                      >
                        Simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Nation / Colony Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Found New Country or Martian Colony
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Nation / Colony Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United Korean Republic or Valles Marineris"
                    value={newNationForm.name}
                    onChange={(e) =>
                      setNewNationForm({ ...newNationForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Planetary Federation
                  </label>
                  <input
                    type="text"
                    value={newNationForm.planet}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        planet: e.target.value,
                      })
                    }
                    list="planet-options"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                  <datalist id="planet-options">
                    <option value="Earth" />
                    <option value="Mars" />
                    <option value="Independent Orbit" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Working Population
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="100000"
                    value={newNationForm.workingPops}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        workingPops: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Initial Companies Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={newNationForm.companyCount}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        companyCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    K-Factor Scaler (Tools DVGP)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={newNationForm.kFactorScaler}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        kFactorScaler: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Literacy Rate ({Math.round(newNationForm.literacyRate * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={newNationForm.literacyRate}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        literacyRate: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Urbanisation ({Math.round(newNationForm.urbanisationIndex * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={newNationForm.urbanisationIndex}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        urbanisationIndex: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Infrastructure ({Math.round(newNationForm.infrastructureEfficiency * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={newNationForm.infrastructureEfficiency}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        infrastructureEfficiency: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Ruling Political Party
                  </label>
                  <select
                    value={newNationForm.rulingParty}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        rulingParty: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {(state.politicalParties || []).map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.politicalAlignment})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Specialized Sector (1.25x Growth Bonus)
                  </label>
                  <select
                    value={newNationForm.specializedIndustry}
                    onChange={(e) =>
                      setNewNationForm({
                        ...newNationForm,
                        specializedIndustry: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="No Specialization">No Specialization (1.0x All)</option>
                    <option value="Agricultural Sector GDP">Agricultural Sector GDP</option>
                    <option value="Industry & Manufacturing GDP">
                      Industry & Manufacturing GDP
                    </option>
                    <option value="Hospitality & Tourist Services GDP">
                      Hospitality & Tourist Services GDP
                    </option>
                    <option value="Office & Corporate Services GDP">
                      Office & Corporate Services GDP
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                >
                  Launch Nation / Colony
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

