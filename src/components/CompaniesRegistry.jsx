import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  PlusCircle,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  Landmark,
} from "lucide-react";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
  getSectorBadgeClass,
  getShortSectorName,
} from "../utils/formatters";

export default function CompaniesRegistry({
  state,
  selectedNationId,
  onSelectNation,
  onCreateCompany,
  onUpdateCompany,
  onDeleteCompany,
}) {
  const nations = state.nations || [];
  const goods = state.goodsCatalog || [];
  const nation =
    nations.find((n) => n.id === selectedNationId) || nations[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [subsidyFilter, setSubsidyFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("valuation");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompForm, setNewCompForm] = useState({
    name: "",
    flagshipGood: "Tools",
    employedPops: 50000,
    hypeFactor: 55,
    numberOfShares: 50000000,
    govtOwnedShares: 0,
    dividendEfficiency: 0.6,
    subsidised: false,
    targetGrowth: 0.03,
  });

  const companies = nation?.companies || [];

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = companies.filter((c) => {
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.flagshipGood.toLowerCase().includes(q) &&
        !(c.productionMethod || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (sectorFilter !== "ALL" && c.gdpSector !== sectorFilter) {
        return false;
      }
      if (subsidyFilter === "SUBSIDISED" && !c.subsidised) return false;
      if (subsidyFilter === "GOVT_OWNED" && !(c.govtOwnedShares > 0))
        return false;
      if (subsidyFilter === "ILLEGAL" && !c.illegal) return false;
      return true;
    });

    list.sort((a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0));
    return list;
  }, [companies, searchQuery, sectorFilter, subsidyFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const visibleCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAddCompany = async (e) => {
    e.preventDefault();
    await onCreateCompany(nation.id, newCompForm);
    setShowAddModal(false);
    setNewCompForm((prev) => ({ ...prev, name: "" }));
  };

  return (
    <div className="space-y-5">
      {/* Nation Selector & Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {nations.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                onSelectNation(n.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                n.id === nation?.id
                  ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {n.name} ({n.companies?.length || 0})
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/15 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Charter New Corporation in {nation?.name}
        </button>
      </div>

      {/* Filters, Search & Sort Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${companies.length} corporations in ${nation?.name}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => {
            setSectorFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white cursor-pointer"
        >
          <option value="ALL">All 4 Economic Sectors</option>
          <option value="Agricultural Sector GDP">Agriculture</option>
          <option value="Industry & Manufacturing GDP">
            Industry & Manufacturing
          </option>
          <option value="Hospitality & Tourist Services GDP">
            Hospitality & Tourism
          </option>
          <option value="Office & Corporate Services GDP">
            Office & Corporate
          </option>
        </select>

        <select
          value={subsidyFilter}
          onChange={(e) => {
            setSubsidyFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white cursor-pointer"
        >
          <option value="ALL">All Enterprises</option>
          <option value="SUBSIDISED">State-Subsidised Champions</option>
          <option value="GOVT_OWNED">State Equity Stake &gt; 0</option>
          <option value="ILLEGAL">Black-Market / Illicit Syndicates</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-semibold cursor-pointer"
        >
          <option value="valuation">Sort by Market Cap</option>
          <option value="vgp">Sort by Economic Output (VGP)</option>
          <option value="employedPops">Sort by Workforce Size</option>
          <option value="projectedRealGrowth">Sort by Real Growth Rate</option>
          <option value="hypeFactor">Sort by Brand Hype</option>
        </select>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="text-slate-400">
          Showing{" "}
          <span className="font-mono-num text-white font-bold">
            {visibleCompanies.length}
          </span>{" "}
          of{" "}
          <span className="font-mono-num text-cyan-300 font-bold">
            {filteredCompanies.length}
          </span>{" "}
          corporations in{" "}
          <span className="text-white font-semibold">{nation?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-200 cursor-pointer"
          >
            Previous
          </button>
          <span className="font-mono-num text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-slate-200 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Interactive Megacorp Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleCompanies.map((comp) => {
          const stateOwnershipPct =
            comp.numberOfShares > 0
              ? Math.min(
                  100,
                  ((comp.govtOwnedShares || 0) / comp.numberOfShares) * 100
                )
              : 0;

          return (
            <div
              key={comp.id}
              className="bg-slate-900/85 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 transition shadow-lg"
            >
              {/* Top Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border ${getSectorBadgeClass(
                      comp.gdpSector
                    )}`}
                  >
                    {getShortSectorName(comp.gdpSector)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {comp.illegal && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Contraband
                      </span>
                    )}
                    <button
                      onClick={() => onDeleteCompany(nation.id, comp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Liquidate Enterprise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold font-display text-white mt-1.5 truncate">
                  {comp.name}
                </h4>

                {/* Product Selector */}
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-slate-400">Flagship Product:</span>
                  <select
                    value={comp.flagshipGood}
                    onChange={(e) =>
                      onUpdateCompany(nation.id, comp.id, {
                        flagshipGood: e.target.value,
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-semibold text-xs max-w-[175px] cursor-pointer"
                  >
                    {goods.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Core Valuation, Output & Growth Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Market Cap
                  </span>
                  <span className="font-mono-num font-bold text-cyan-300 text-sm">
                    {formatCurrency(comp.valuation)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Output (VGP)
                  </span>
                  <span className="font-mono-num font-semibold text-slate-200 text-sm">
                    {formatCurrency(comp.vgp)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Real Growth
                  </span>
                  <span
                    className={`font-mono-num font-bold text-sm ${
                      comp.projectedRealGrowth >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatPercent(comp.projectedRealGrowth, 2, true)}
                  </span>
                </div>
              </div>

              {/* Interactive Workforce, Hype & State Nationalization Levers */}
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Workforce (Employees)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="5000"
                      value={Math.round(comp.employedPops)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          employedPops: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono-num text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Brand Hype ({Math.round(comp.hypeFactor)})
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={Math.round(comp.hypeFactor)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          hypeFactor: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-400 mt-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                {/* State Ownership / Nationalization Slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">
                      State Equity Stake ({stateOwnershipPct.toFixed(0)}%)
                    </span>
                    <span className="font-mono-num text-emerald-300">
                      Div/Sh: {formatExactCurrency(comp.dividendsPerShare, 2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={comp.numberOfShares || 50000000}
                    step={Math.max(
                      1,
                      Math.round((comp.numberOfShares || 50000000) / 20)
                    )}
                    value={comp.govtOwnedShares || 0}
                    onChange={(e) =>
                      onUpdateCompany(nation.id, comp.id, {
                        govtOwnedShares: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* State Subsidy Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(comp.subsidised)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          subsidised: e.target.checked,
                        })
                      }
                      className="accent-cyan-400"
                    />
                    State Industrial Subsidy
                  </label>
                  {comp.subsidised && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">
                        Guaranteed Growth:
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={comp.targetGrowth || 0.03}
                        onChange={(e) =>
                          onUpdateCompany(nation.id, comp.id, {
                            targetGrowth: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-cyan-500/50 font-mono-num text-cyan-300 text-right"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charter New Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Charter New Corporation in {nation?.name}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompany} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Corporation Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ares Orbital Mining Syndicate"
                  value={newCompForm.name}
                  onChange={(e) =>
                    setNewCompForm({ ...newCompForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Flagship Commodity
                  </label>
                  <select
                    value={newCompForm.flagshipGood}
                    onChange={(e) =>
                      setNewCompForm({
                        ...newCompForm,
                        flagshipGood: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    {goods.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} ({getShortSectorName(g.sector)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Initial Workforce
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={newCompForm.employedPops}
                    onChange={(e) =>
                      setNewCompForm({
                        ...newCompForm,
                        employedPops: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold cursor-pointer"
                >
                  Charter Enterprise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
