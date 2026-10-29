import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  PlusCircle,
  Filter,
  ArrowUpDown,
  Trash2,
  CheckCircle2,
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
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 50;

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
      if (subsidyFilter === "GOVT_OWNED" && !(c.govtOwnedShares > 0)) return false;
      if (subsidyFilter === "ILLEGAL" && !c.illegal) return false;
      return true;
    });

    list.sort((a, b) => {
      const av = Number(a[sortBy]) || 0;
      const bv = Number(b[sortBy]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

    return list;
  }, [companies, searchQuery, sectorFilter, subsidyFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleCompanies = filteredCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    await onCreateCompany(nation.id, newCompForm);
    setShowAddModal(false);
    setNewCompForm((prev) => ({ ...prev, name: "" }));
  };

  return (
    <div className="space-y-5">
      {/* Nation Selector & Header */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {nations.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                onSelectNation(n.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/15 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Incorporate New Company in {nation?.name}
        </button>
      </div>

      {/* Filters & Search Strip */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${companies.length} companies by name, flagship good, or input method...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
          />
        </div>

        <div>
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
          >
            <option value="ALL">All 4 GDP Sectors</option>
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

        <div>
          <select
            value={subsidyFilter}
            onChange={(e) => {
              setSubsidyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
          >
            <option value="ALL">All Ownership & Legal Status</option>
            <option value="SUBSIDISED">State Subsidised Only</option>
            <option value="GOVT_OWNED">State Shares &gt; 0 Only</option>
            <option value="ILLEGAL">Illegal / Black Market Goods</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-300">
            Showing{" "}
            <span className="font-mono-num font-bold text-white">
              {visibleCompanies.length}
            </span>{" "}
            of{" "}
            <span className="font-mono-num font-bold text-cyan-300">
              {filteredCompanies.length}
            </span>{" "}
            companies in <span className="font-semibold text-white">{nation?.name}</span>{" "}
            ({nation?.stockExchangeName})
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 text-slate-200 cursor-pointer"
            >
              Prev
            </button>
            <span className="font-mono-num text-slate-400">
              Page {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40 text-slate-200 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3 px-3">Company Name</th>
                <th className="py-3 px-2">Flagship Good</th>
                <th className="py-3 px-2">Sector & Inputs</th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("hypeFactor")}
                >
                  Hype ↕
                </th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("employedPops")}
                >
                  Employees ↕
                </th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("vgp")}
                >
                  VGP (Output) ↕
                </th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("valuation")}
                >
                  Valuation ↕
                </th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("projectedRealGrowth")}
                >
                  Real Growth ↕
                </th>
                <th
                  className="py-3 px-2 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("dividendsPerShare")}
                >
                  Div / Share ↕
                </th>
                <th className="py-3 px-2 text-center">Subsidy</th>
                <th className="py-3 px-2 text-right">Govt Shares</th>
                <th className="py-3 px-3 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {visibleCompanies.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-medium text-white max-w-[180px]">
                    <div className="truncate" title={comp.name}>
                      {comp.name}
                    </div>
                    {comp.illegal && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                        <AlertTriangle className="w-3 h-3" /> Illegal Good
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-2">
                    <select
                      value={comp.flagshipGood}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          flagshipGood: e.target.value,
                        })
                      }
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-700/80 text-slate-200 text-[11px] max-w-[140px] cursor-pointer"
                    >
                      {goods.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded border ${getSectorBadgeClass(
                        comp.gdpSector
                      )}`}
                    >
                      {getShortSectorName(comp.gdpSector)}
                    </span>
                    <div
                      className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5"
                      title={`Inputs: ${comp.productionMethod}`}
                    >
                      In: {comp.productionMethod}
                    </div>
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      step="1"
                      value={Math.round(comp.hypeFactor)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          hypeFactor: Number(e.target.value),
                        })
                      }
                      className="w-14 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-amber-300"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="100"
                      step="1000"
                      value={Math.round(comp.employedPops)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          employedPops: Number(e.target.value),
                        })
                      }
                      className="w-24 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-slate-200"
                    />
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono-num text-slate-200">
                    {formatCurrency(comp.vgp)}
                  </td>

                  <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-cyan-300">
                    {formatCurrency(comp.valuation)}
                  </td>

                  <td
                    className={`py-2.5 px-2 text-right font-mono-num font-semibold ${
                      comp.projectedRealGrowth >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatPercent(comp.projectedRealGrowth, 2, true)}
                  </td>

                  <td
                    className={`py-2.5 px-2 text-right font-mono-num ${
                      comp.dividendsPerShare >= 0
                        ? "text-emerald-300"
                        : "text-rose-400"
                    }`}
                  >
                    {formatExactCurrency(comp.dividendsPerShare, 2)}
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="checkbox"
                        checked={Boolean(comp.subsidised)}
                        onChange={(e) =>
                          onUpdateCompany(nation.id, comp.id, {
                            subsidised: e.target.checked,
                          })
                        }
                        className="accent-cyan-400 cursor-pointer"
                        title="Toggle State Subsidy (Overrides Growth to Target Growth; Government pays negative dividend)"
                      />
                      {comp.subsidised && (
                        <input
                          type="number"
                          step="0.01"
                          value={comp.targetGrowth || 0.02}
                          onChange={(e) =>
                            onUpdateCompany(nation.id, comp.id, {
                              targetGrowth: Number(e.target.value),
                            })
                          }
                          className="w-14 px-1 py-0.5 text-[10px] rounded bg-slate-950 border border-cyan-500/40 font-mono-num text-cyan-300"
                          title="Subsidised Target Growth Rate"
                        />
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      value={Math.round(comp.govtOwnedShares || 0)}
                      onChange={(e) =>
                        onUpdateCompany(nation.id, comp.id, {
                          govtOwnedShares: Number(e.target.value),
                        })
                      }
                      className="w-20 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700/80 font-mono-num text-slate-300 text-[11px]"
                      title={`Out of ${formatCompactNumber(comp.numberOfShares)} total shares`}
                    />
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onDeleteCompany(nation.id, comp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Liquidate Company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Incorporate New Company in {nation?.name}
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
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ares Orbital Mining Corp"
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
                    Flagship Good
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
                    Employed Pops
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Hype Factor
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCompForm.hypeFactor}
                    onChange={(e) =>
                      setNewCompForm({
                        ...newCompForm,
                        hypeFactor: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Total Shares
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCompForm.numberOfShares}
                    onChange={(e) =>
                      setNewCompForm({
                        ...newCompForm,
                        numberOfShares: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Govt Shares
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCompForm.govtOwnedShares}
                    onChange={(e) =>
                      setNewCompForm({
                        ...newCompForm,
                        govtOwnedShares: Number(e.target.value),
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
                  Incorporate Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

