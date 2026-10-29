import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Globe,
  Cpu,
  Search,
  Sliders,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  TrendingUp,
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
  const [subTab, setSubTab] = useState("supplychain"); // "supplychain" | "tech" | "global"
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [selectedGoodName, setSelectedGoodName] = useState("Tools");

  // Bulk market policy state
  const [bulkSector, setBulkSector] = useState("");
  const [bulkImportTariff, setBulkImportTariff] = useState(0.1);
  const [bulkExportTariff, setBulkExportTariff] = useState(0.0);
  const [bulkDdMultiplier, setBulkDdMultiplier] = useState(1.0);

  const nations = state.nations || [];
  const nation =
    nations.find((n) => n.id === selectedNationId) || nations[0];

  const marketRows = nation?.marketComputed || [];
  const marketByName = useMemo(
    () => new Map(marketRows.map((m) => [m.goodName, m])),
    [marketRows]
  );

  const activeGood =
    marketByName.get(selectedGoodName) || marketRows[0] || null;

  // Compute downstream goods that require activeGood as an input
  const downstreamGoods = useMemo(() => {
    if (!activeGood) return [];
    return marketRows.filter((m) =>
      (m.inputsList || []).includes(activeGood.goodName)
    );
  }, [marketRows, activeGood]);

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
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab("supplychain")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subTab === "supplychain"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Supply Chain Network & Trade Policy ({nation?.name})
          </button>

          <button
            onClick={() => setSubTab("tech")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subTab === "tech"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Civilization Tech Tree & Sector Productivity
          </button>

          <button
            onClick={() => setSubTab("global")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subTab === "global"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Commodity Exchange
          </button>
        </div>

        {/* Nation Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Nation:</span>
          <select
            value={nation?.id || ""}
            onChange={(e) => onSelectNation(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold cursor-pointer"
          >
            {nations.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.planet})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: VISUAL SUPPLY CHAIN NETWORK & TRADE POLICY */}
      {subTab === "supplychain" && (
        <div className="space-y-5">
          {/* Interactive Supply Chain Dependency Graph & Inspector for Selected Good */}
          {activeGood && (
            <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 shadow-xl">
              {/* Left 7 Cols: Visual Upstream -> Active Commodity -> Downstream Graph */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded border mb-1 ${getSectorBadgeClass(
                        activeGood.category
                      )}`}
                    >
                      {getShortSectorName(activeGood.category)} • {activeGood.era}
                    </span>
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      {activeGood.goodName} Supply Chain Flow
                    </h3>
                  </div>
                  <div className="text-right font-mono-num">
                    <div className="text-[11px] text-slate-400">
                      Domestic Clearing Price
                    </div>
                    <div className="text-xl font-bold text-cyan-300">
                      {formatExactCurrency(activeGood.localPrice, 2)}
                    </div>
                  </div>
                </div>

                {/* 3-Stage Visual Supply Chain Diagram */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                  {/* Stage 1: Upstream Required Inputs */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Upstream Inputs ({activeGood.inputsList?.length || 0})
                    </div>
                    {(activeGood.inputsList || []).length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-500">
                        Primary Resource (No Inputs)
                      </div>
                    ) : (
                      (activeGood.inputsList || []).map((inpName) => {
                        const inpRow = marketByName.get(inpName);
                        return (
                          <button
                            key={inpName}
                            onClick={() => setSelectedGoodName(inpName)}
                            className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-amber-300 truncate">
                              {inpName}
                            </span>
                            <span className="font-mono-num text-[11px] text-slate-300">
                              {inpRow
                                ? formatExactCurrency(inpRow.localPrice, 0)
                                : ""}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Stage 2: Selected Commodity Node */}
                  <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border-2 border-cyan-500/60 shadow-lg">
                    <div className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
                      Selected Commodity
                    </div>
                    <div className="text-base font-bold text-white mt-1">
                      {activeGood.goodName}
                    </div>
                    <div className="text-xs font-mono-num text-emerald-300 mt-2">
                      Output: {formatCompactNumber(activeGood.sellOrders)} units
                    </div>
                    <div className="text-[11px] font-mono-num text-amber-300 mt-0.5">
                      Input Demand: {formatCompactNumber(activeGood.importOrdersNeeded)}
                    </div>
                  </div>

                  {/* Stage 3: Downstream Industries Powered by this Commodity */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Downstream Industries ({downstreamGoods.length})
                    </div>
                    {downstreamGoods.length === 0 ? (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-500">
                        Final Consumer Good
                      </div>
                    ) : (
                      downstreamGoods.slice(0, 8).map((dg) => (
                        <button
                          key={dg.goodName}
                          onClick={() => setSelectedGoodName(dg.goodName)}
                          className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-cyan-300 truncate">
                            {dg.goodName}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Commodity Tariff, Demand & Embargo Controls */}
              <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="font-bold uppercase tracking-wider text-amber-400">
                    {activeGood.goodName} Policy Levers ({nation?.name})
                  </span>
                  <span className="font-mono-num text-slate-400">
                    World Price: {formatExactCurrency(activeGood.globalPrice, 2)}
                  </span>
                </div>

                {/* Sliders for Import Tariff, Export Tariff, Domestic Demand, Hype */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Import Tariff</span>
                      <span className="font-mono-num font-bold text-amber-300">
                        {formatPercent(activeGood.importTariffRate, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={activeGood.importTariffRate}
                      onChange={(e) =>
                        onUpdateMarket(nation.id, {
                          goodName: activeGood.goodName,
                          updates: {
                            importTariffRate: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Export Tariff</span>
                      <span className="font-mono-num font-bold text-cyan-300">
                        {formatPercent(activeGood.exportTariffRate, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={activeGood.exportTariffRate}
                      onChange={(e) =>
                        onUpdateMarket(nation.id, {
                          goodName: activeGood.goodName,
                          updates: {
                            exportTariffRate: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Domestic Demand</span>
                      <span className="font-mono-num font-bold text-emerald-300">
                        {activeGood.ddMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={activeGood.ddMultiplier}
                      onChange={(e) =>
                        onUpdateMarket(nation.id, {
                          goodName: activeGood.goodName,
                          updates: {
                            ddMultiplier: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Consumer Hype</span>
                      <span className="font-mono-num font-bold text-purple-300">
                        {activeGood.hype}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={activeGood.hype}
                      onChange={(e) =>
                        onUpdateMarket(nation.id, {
                          goodName: activeGood.goodName,
                          updates: {
                            hype: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Contraband Toggle */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Outlaw / Black-Market Contraband Status
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Outlawing this good classifies its workers as illicit syndicate operatives
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(activeGood.illegal)}
                    onChange={(e) =>
                      onUpdateMarket(nation.id, {
                        goodName: activeGood.goodName,
                        updates: { illegal: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sector Filter, Search & Bulk Sector Policy Strip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter 202 commodities & industries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white cursor-pointer"
              >
                <option value="ALL">All 4 Sectors ({marketRows.length})</option>
                <option value="Agricultural Sector GDP">Agriculture</option>
                <option value="Industry & Manufacturing GDP">
                  Industry & Mfg
                </option>
                <option value="Hospitality & Tourist Services GDP">
                  Hospitality & Tourism
                </option>
                <option value="Office & Corporate Services GDP">
                  Office & Corporate
                </option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Sector-Wide Tariff:</span>
              <select
                value={bulkSector}
                onChange={(e) => setBulkSector(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="">All Sectors</option>
                <option value="Agricultural Sector GDP">Agriculture</option>
                <option value="Industry & Manufacturing GDP">Industry</option>
                <option value="Hospitality & Tourist Services GDP">
                  Hospitality
                </option>
                <option value="Office & Corporate Services GDP">Office</option>
              </select>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={bulkImportTariff}
                onChange={(e) => setBulkImportTariff(e.target.value)}
                className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                title="Import Tariff Rate"
              />
              <button
                onClick={handleApplyBulk}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
              >
                Apply Sector Policy
              </button>
            </div>
          </div>

          {/* Interactive Commodity Cards Grid (Replaces 13-column spreadsheet table) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredMarketRows.map((m) => {
              const isSelected = activeGood?.goodName === m.goodName;
              return (
                <div
                  key={m.goodName}
                  onClick={() => setSelectedGoodName(m.goodName)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10"
                      : "bg-slate-900/75 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${getSectorBadgeClass(
                          m.category
                        )}`}
                      >
                        {getShortSectorName(m.category)}
                      </span>
                      <span className="font-mono-num text-sm font-bold text-cyan-300">
                        {formatExactCurrency(m.localPrice, 1)}
                      </span>
                    </div>

                    <div className="font-bold text-white text-sm mt-2 flex items-center justify-between">
                      <span>{m.goodName}</span>
                      {m.illegal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          Illegal
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      Inputs: {m.productionMethod || "Primary"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2.5 mt-2.5 border-t border-slate-800/80 text-[10px] font-mono-num">
                    <div>
                      <span className="text-slate-500 block">Domestic</span>
                      <span className="text-emerald-300">
                        {formatCompactNumber(m.sellOrders)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Import Req</span>
                      <span className="text-amber-300">
                        {formatCompactNumber(m.importOrdersNeeded)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Tariff</span>
                      <span className="text-slate-200">
                        {formatPercent(m.importTariffRate, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CIVILIZATION TECH TREE & SECTOR PRODUCTIVITY */}
      {subTab === "tech" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Civilization Technology Eras (9 Epochs)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Unlocking technological epochs integrates advanced inputs into industrial tooling and compounds value across all downstream industries.
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
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    era.unlocked
                      ? "bg-gradient-to-r from-cyan-950/50 to-slate-900 border-cyan-500/60 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400"
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
                      Epoch {idx + 1}
                    </div>
                    <div className="text-sm font-bold mt-0.5">{era.name}</div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      era.unlocked
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {era.unlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Active
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

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Global Sector Productivity Multipliers & Market Sentiment
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Adjusts the value-added productivity multiplier and investor sentiment for each macroeconomic sector.
              </p>
            </div>

            <div className="space-y-3.5">
              {(state.sectorsConfig || []).map((sec) => (
                <div
                  key={sec.name}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {getShortSectorName(sec.name)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] ${getSectorBadgeClass(
                        sec.name
                      )}`}
                    >
                      Value-Added Bonus: +{Math.round(sec.kFactorBonus * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">
                          Value-Added Multiplier
                        </span>
                        <span className="font-mono-num text-cyan-300">
                          +{Math.round(sec.kFactorBonus * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        step="0.05"
                        min="0.05"
                        max="2.0"
                        value={sec.kFactorBonus}
                        onChange={(e) =>
                          onUpdateCompanion({
                            sectorName: sec.name,
                            kFactorBonus: Number(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">
                          Investor Sentiment
                        </span>
                        <span className="font-mono-num text-amber-300">
                          {sec.sentiment} / 100
                        </span>
                      </div>
                      <input
                        type="range"
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
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GLOBAL COMMODITY EXCHANGE CARDS */}
      {subTab === "global" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {(state.globalMarket || []).slice(0, 60).map((g) => (
            <div
              key={g.goodName}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border ${getSectorBadgeClass(
                    g.category
                  )}`}
                >
                  {getShortSectorName(g.category)}
                </span>
                <span className="text-[10px] text-slate-400">{g.era}</span>
              </div>
              <div className="font-bold text-sm text-white">{g.goodName}</div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">World Clearing Price</span>
                <span className="font-mono-num font-bold text-cyan-300 text-sm">
                  {formatExactCurrency(g.amep, 2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
