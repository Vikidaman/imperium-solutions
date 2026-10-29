import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Globe,
  Cpu,
  Search,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
  getSectorBadgeClass,
  getShortSectorName,
} from "../utils/formatters";

export default function MarketsAndTechView({
  state,
  selectedNationId,
  onSelectNation,
  onUpdateMarket,
  onUpdateCompanion,
}) {
  const [subTab, setSubTab] = useState("local"); // "local" | "global" | "tech"
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");

  // Bulk market policy state
  const [bulkSector, setBulkSector] = useState("");
  const [bulkImportTariff, setBulkImportTariff] = useState(0.1);
  const [bulkExportTariff, setBulkExportTariff] = useState(0.0);
  const [bulkDdMultiplier, setBulkDdMultiplier] = useState(1.0);

  const nations = state.nations || [];
  const nation =
    nations.find((n) => n.id === selectedNationId) || nations[0];

  const marketRows = nation?.marketComputed || [];

  const filteredMarketRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return marketRows.filter((m) => {
      if (
        q &&
        !m.goodName.toLowerCase().includes(q) &&
        !(m.productionMethod || "").toLowerCase().includes(q) &&
        !(m.era || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (sectorFilter !== "ALL" && m.category !== sectorFilter) {
        return false;
      }
      return true;
    });
  }, [marketRows, searchQuery, sectorFilter]);

  const filteredGlobalRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (state.globalMarket || []).filter((g) => {
      if (q && !g.goodName.toLowerCase().includes(q)) return false;
      if (sectorFilter !== "ALL" && g.category !== sectorFilter) return false;
      return true;
    });
  }, [state.globalMarket, searchQuery, sectorFilter]);

  const handleApplyBulk = () => {
    onUpdateMarket(nation.id, {
      bulkUpdate: {
        sector: bulkSector || undefined,
        importTariffRate: Number(bulkImportTariff),
        exportTariffRate: Number(bulkExportTariff),
        ddMultiplier: Number(bulkDdMultiplier),
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab("local")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "local"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            National Local Market & Tariffs ({nation?.name})
          </button>

          <button
            onClick={() => setSubTab("global")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "global"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Market Benchmark (AMEP)
          </button>

          <button
            onClick={() => setSubTab("tech")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "tech"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Production Methods & 9 Tech Eras
          </button>
        </div>

        {/* Nation Switcher when on Local Market tab */}
        {subTab === "local" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Active Market:</span>
            <select
              value={nation?.id || ""}
              onChange={(e) => onSelectNation(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold cursor-pointer"
            >
              {nations.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.planet})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: LOCAL MARKET & TARIFFS */}
      {subTab === "local" && (
        <div className="space-y-4">
          {/* Trade Summary & Bulk Tariff Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">
                  Total Exports to Global Market
                </div>
                <div className="text-xl font-bold font-mono-num text-emerald-400 mt-0.5">
                  {formatCurrency(nation?.computed?.totalExportsValue)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Export Tariff Rev:{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(nation?.computed?.totalExportTariffRevenues)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">
                  Total Imports from Global Market
                </div>
                <div className="text-xl font-bold font-mono-num text-amber-400 mt-0.5">
                  {formatCurrency(nation?.computed?.totalImportsValue)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Import Tariff Rev:{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(nation?.computed?.totalImportTariffRevenues)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bulk Tariff / DD Tool */}
            <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-end justify-between gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Bulk Policy Target Sector
                </label>
                <select
                  value={bulkSector}
                  onChange={(e) => setBulkSector(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="">All 202 Goods</option>
                  <option value="Agricultural Sector GDP">
                    Agricultural Sector Only
                  </option>
                  <option value="Industry & Manufacturing GDP">
                    Industry & Mfg Sector Only
                  </option>
                  <option value="Hospitality & Tourist Services GDP">
                    Hospitality Sector Only
                  </option>
                  <option value="Office & Corporate Services GDP">
                    Office & Corporate Sector Only
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Import Tariff (0–1)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  value={bulkImportTariff}
                  onChange={(e) => setBulkImportTariff(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Export Tariff (0–1)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  value={bulkExportTariff}
                  onChange={(e) => setBulkExportTariff(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Domestic Demand (DD)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={bulkDdMultiplier}
                  onChange={(e) => setBulkDdMultiplier(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                />
              </div>

              <button
                onClick={handleApplyBulk}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                Apply Bulk Market Policy
              </button>
            </div>
          </div>

          {/* Search & Sector Filter */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search 202 goods by name, input chain, or Tech Era..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
            >
              <option value="ALL">All 4 Sectors ({marketRows.length} Goods)</option>
              <option value="Agricultural Sector GDP">Agricultural Sector</option>
              <option value="Industry & Manufacturing GDP">
                Industry & Manufacturing
              </option>
              <option value="Hospitality & Tourist Services GDP">
                Hospitality & Tourism
              </option>
              <option value="Office & Corporate Services GDP">
                Office & Corporate Services
              </option>
            </select>
          </div>

          {/* Local Market Table */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-950">
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Good</th>
                    <th className="py-3 px-2">Sector & Inputs</th>
                    <th className="py-3 px-2 text-right">Hype</th>
                    <th className="py-3 px-2 text-right" title="Trade Balance Price Factor">
                      TBPF (E)
                    </th>
                    <th className="py-3 px-2 text-right" title="min(Post-Import Price, Adjusted Domestic Price)">
                      Local Price (F)
                    </th>
                    <th className="py-3 px-2 text-right" title="Domestic Value of Good Produced">
                      DVGP (G)
                    </th>
                    <th className="py-3 px-2 text-right" title="Domestic Demand Multiplier">
                      DD (J)
                    </th>
                    <th className="py-3 px-2 text-right" title="Global Average Market Export Price">
                      Global (K)
                    </th>
                    <th className="py-3 px-2 text-right">Sell Orders (L)</th>
                    <th className="py-3 px-2 text-right">Import Needed (R)</th>
                    <th className="py-3 px-2 text-right">Export Tariff</th>
                    <th className="py-3 px-2 text-right">Import Tariff</th>
                    <th className="py-3 px-3 text-center">Illegal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredMarketRows.map((m) => (
                    <tr key={m.goodName} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">
                        <div>{m.goodName}</div>
                        <div className="text-[10px] text-slate-500">{m.era}</div>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${getSectorBadgeClass(
                            m.category
                          )}`}
                        >
                          {getShortSectorName(m.category)}
                        </span>
                        <div
                          className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5"
                          title={m.productionMethod}
                        >
                          In: {m.productionMethod || "None"}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={m.hype}
                          onChange={(e) =>
                            onUpdateMarket(nation.id, {
                              goodName: m.goodName,
                              updates: { hype: Number(e.target.value) },
                            })
                          }
                          className="w-14 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-amber-300"
                        />
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono-num ${
                          m.tbpf > 0
                            ? "text-emerald-400"
                            : m.tbpf < 0
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {m.tbpf.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num font-bold text-cyan-300">
                        {formatExactCurrency(m.localPrice, 2)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num text-slate-300">
                        {formatExactCurrency(m.dvgp, 2)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="10"
                          value={m.ddMultiplier}
                          onChange={(e) =>
                            onUpdateMarket(nation.id, {
                              goodName: m.goodName,
                              updates: { ddMultiplier: Number(e.target.value) },
                            })
                          }
                          className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-white"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num text-slate-300">
                        {formatExactCurrency(m.globalPrice, 2)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num text-emerald-300">
                        {formatCompactNumber(m.sellOrders)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono-num text-amber-300">
                        {formatCompactNumber(m.importOrdersNeeded)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.02"
                          min="0"
                          max="2"
                          value={m.exportTariffRate}
                          onChange={(e) =>
                            onUpdateMarket(nation.id, {
                              goodName: m.goodName,
                              updates: {
                                exportTariffRate: Number(e.target.value),
                              },
                            })
                          }
                          className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-slate-200"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="0.02"
                          min="0"
                          max="2"
                          value={m.importTariffRate}
                          onChange={(e) =>
                            onUpdateMarket(nation.id, {
                              goodName: m.goodName,
                              updates: {
                                importTariffRate: Number(e.target.value),
                              },
                            })
                          }
                          className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-slate-200"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(m.illegal)}
                          onChange={(e) =>
                            onUpdateMarket(nation.id, {
                              goodName: m.goodName,
                              updates: { illegal: e.target.checked },
                            })
                          }
                          className="accent-rose-500 cursor-pointer"
                          title="Mark Good as Illegal (Employed Pops count as Criminals)"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GLOBAL MARKET BENCHMARK (AMEP) */}
      {subTab === "global" && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Global Market goods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div className="text-slate-400">
              Global AMEP = Average Market Export Price across primary exporting economies
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-950">
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Good</th>
                    <th className="py-3 px-2">Sector</th>
                    <th className="py-3 px-3 text-right text-cyan-300">
                      Global AMEP
                    </th>
                    {nations.slice(0, 8).map((n) => (
                      <th key={n.id} className="py-3 px-2 text-right">
                        {n.name} Exp
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredGlobalRows.map((g) => (
                    <tr key={g.goodName} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold text-white">
                        {g.goodName}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${getSectorBadgeClass(
                            g.category
                          )}`}
                        >
                          {getShortSectorName(g.category)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono-num font-bold text-cyan-300">
                        {formatExactCurrency(g.amep, 2)}
                      </td>
                      {nations.slice(0, 8).map((n) => (
                        <td
                          key={n.id}
                          className="py-2 px-2 text-right font-mono-num text-slate-300"
                        >
                          {formatExactCurrency(g.exportPrices?.[n.name] || 0, 2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRODUCTION METHODS & 9 TECH ERAS COMPANION */}
      {subTab === "tech" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 9 Tech Eras Panel */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Production Methods Companion — 9 Tech Eras
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Toggling Tech Eras dynamically updates the required inputs for{" "}
                <span className="text-white font-semibold">Tools</span>, which
                cascades across all 202 goods' DVGPs and global trade demand!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(state.techEras || []).map((era, idx) => (
                <div
                  key={era.name}
                  onClick={() =>
                    onUpdateCompanion({
                      techEraName: era.name,
                      unlocked: !era.unlocked,
                    })
                  }
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    era.unlocked
                      ? "bg-cyan-950/30 border-cyan-500/50 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Era {idx + 1}
                    </div>
                    <div className="text-sm font-bold">{era.name}</div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                      era.unlocked
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {era.unlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Companies Companion: 4 Sectors K-Factor Bonus & Sentiment */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Companies Companion — Sector K-Factor Bonuses & Sentiment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Controls the value-added multiplier{" "}
                <span className="font-mono-num text-slate-200">
                  (1 + K-Factor Bonus)
                </span>{" "}
                applied at each step of the 202-good supply chain.
              </p>
            </div>

            <div className="space-y-4">
              {(state.sectorsConfig || []).map((sec) => (
                <div
                  key={sec.name}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{sec.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] ${getSectorBadgeClass(
                        sec.name
                      )}`}
                    >
                      K-Bonus: +{Math.round(sec.kFactorBonus * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Sector K-Factor Bonus (DVGP Multiplier)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="3.0"
                        value={sec.kFactorBonus}
                        onChange={(e) =>
                          onUpdateCompanion({
                            sectorName: sec.name,
                            kFactorBonus: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Sector Market Sentiment (1–100)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={sec.sentiment}
                        onChange={(e) =>
                          onUpdateCompanion({
                            sectorName: sec.name,
                            sentiment: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono-num"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

