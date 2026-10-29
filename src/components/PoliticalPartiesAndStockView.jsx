import React, { useState } from "react";
import {
  Flag,
  Briefcase,
  PlusCircle,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
} from "lucide-react";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
} from "../utils/formatters";

export default function PoliticalPartiesAndStockView({
  state,
  onSaveParty,
  onCreateStockAccount,
  onExecuteTrade,
}) {
  const [subTab, setSubTab] = useState("parties"); // "parties" | "stock"

  // New Party Modal State
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partyForm, setPartyForm] = useState({
    nation: "Global",
    name: "",
    currentSupport: 0.25,
    incomeTaxPreference: 0.22,
    salesTaxPreference: 0.1,
    corporateTaxRate: 0.18,
    workerShareOfGdp: 0.45,
    budgetAsPercentOfGdp: 0.16,
    federalisedPolicy: "Confederated",
    localCrimePolicy: "Beat Cops",
    healthcarePolicy: "State-run Healthcare",
    politicalAlignment: "Centre",
  });

  // Stock Trading State
  const [selectedAccountId, setSelectedAccountId] = useState(
    state.stockAccounts?.[0]?.id || "acc_1"
  );
  const [tradeNationId, setTradeNationId] = useState(
    state.nations?.[0]?.id || "usa"
  );
  const [tradeCompanyName, setTradeCompanyName] = useState("");
  const [tradeUnits, setTradeUnits] = useState(100000);
  const [newHolderName, setNewHolderName] = useState("");

  const parties = state.politicalParties || [];
  const accounts = state.stockAccounts || [];
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const tradeNation =
    (state.nations || []).find((n) => n.id === tradeNationId) ||
    state.nations?.[0];
  const selectedTradeCompany =
    tradeNation?.companies?.find((c) => c.name === tradeCompanyName) ||
    tradeNation?.companies?.[0];

  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!partyForm.name.trim()) return;
    await onSaveParty(partyForm);
    setShowPartyModal(false);
    setPartyForm((prev) => ({ ...prev, name: "" }));
  };

  const handleTrade = (action) => {
    if (!activeAccount || !selectedTradeCompany || !tradeNation) return;
    onExecuteTrade(activeAccount.id, {
      action,
      companyName: selectedTradeCompany.name,
      hqCountry: tradeNation.name,
      units: Number(tradeUnits),
    });
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("parties")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "parties"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Flag className="w-4 h-4" />
            Political Parties Registry ({parties.length})
          </button>
          <button
            onClick={() => setSubTab("stock")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              subTab === "stock"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Stock Exchange & Investor Accounts ({accounts.length})
          </button>
        </div>

        {subTab === "parties" && (
          <button
            onClick={() => setShowPartyModal(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Found New Political Party
          </button>
        )}
      </div>

      {/* SUB-TAB 1: POLITICAL PARTIES */}
      {subTab === "parties" && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Political Parties & Macroeconomic Platforms
            </h3>
            <p className="text-xs text-slate-400">
              Editing any party's tax, wage share, budget, crime, or healthcare preferences immediately recalculates all nations governed by that party
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-2">Origin</th>
                  <th className="py-3 px-2">Alignment</th>
                  <th className="py-3 px-2 text-right">Support</th>
                  <th className="py-3 px-2 text-right">Income Tax</th>
                  <th className="py-3 px-2 text-right">Sales Tax</th>
                  <th className="py-3 px-2 text-right">Corp Tax</th>
                  <th className="py-3 px-2 text-right">Worker Share</th>
                  <th className="py-3 px-2 text-right">Budget % GDP</th>
                  <th className="py-3 px-2">Crime Policy</th>
                  <th className="py-3 px-3">Healthcare Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {parties.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-2.5 px-2 text-slate-300">{p.nation}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[11px]">
                        {p.politicalAlignment}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={p.currentSupport}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            currentSupport: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-slate-200"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.9"
                        value={p.incomeTaxPreference}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            incomeTaxPreference: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-cyan-300"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.9"
                        value={p.salesTaxPreference}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            salesTaxPreference: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-cyan-300"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.9"
                        value={p.corporateTaxRate}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            corporateTaxRate: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-cyan-300"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0.05"
                        max="0.95"
                        value={p.workerShareOfGdp}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            workerShareOfGdp: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-emerald-300"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="0.8"
                        value={p.budgetAsPercentOfGdp}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            budgetAsPercentOfGdp: Number(e.target.value),
                          })
                        }
                        className="w-16 px-1.5 py-1 text-right rounded bg-slate-950 border border-slate-700 font-mono-num text-amber-300"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={p.localCrimePolicy}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            localCrimePolicy: e.target.value,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-[11px]"
                      >
                        <option value="Gentle Touch">Gentle Touch</option>
                        <option value="Beat Cops">Beat Cops</option>
                        <option value="Profiling">Profiling</option>
                        <option value="Militarized Police">Militarized Police</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={p.healthcarePolicy}
                        onChange={(e) =>
                          onSaveParty({
                            ...p,
                            healthcarePolicy: e.target.value,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-[11px]"
                      >
                        <option value="Private Healthcare">Private Healthcare</option>
                        <option value="State-run Healthcare">
                          State-run Healthcare
                        </option>
                        <option value="Euthanasia">Euthanasia</option>
                        <option value="No Healthcare">No Healthcare</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STOCK EXCHANGE & INVESTOR PORTFOLIOS */}
      {subTab === "stock" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Selector & New Account */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Stock Exchange Brokerage Accounts
              </h3>
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const active = acc.id === activeAccount?.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        active
                          ? "bg-cyan-950/30 border-cyan-500/60"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {acc.holderName}
                        </span>
                        <span className="text-xs font-mono-num text-cyan-300 font-semibold">
                          {formatCurrency(acc.portfolioValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Cash: {formatCurrency(acc.cashBalance)}</span>
                        <span className="text-emerald-400 font-mono-num">
                          Div Pot: {formatCurrency(acc.dividendPot)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create New Investor Account */}
              <div className="pt-3 border-t border-slate-800 flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="New Investor / Fund Name..."
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
                <button
                  onClick={() => {
                    if (!newHolderName.trim()) return;
                    onCreateStockAccount({ holderName: newHolderName.trim() });
                    setNewHolderName("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold cursor-pointer"
                >
                  Open
                </button>
              </div>
            </div>

            {/* Order Execution Terminal */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Execute Equity Order ({activeAccount?.holderName})
              </h3>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Exchange / HQ Nation
                </label>
                <select
                  value={tradeNation?.id || ""}
                  onChange={(e) => {
                    setTradeNationId(e.target.value);
                    const n = state.nations.find((x) => x.id === e.target.value);
                    setTradeCompanyName(n?.companies?.[0]?.name || "");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  {(state.nations || []).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} — {n.stockExchangeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Target Listed Company
                </label>
                <select
                  value={selectedTradeCompany?.name || ""}
                  onChange={(e) => setTradeCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  {(tradeNation?.companies || []).slice(0, 150).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.flagshipGood}) — Share:{" "}
                      {formatExactCurrency(c.sharePrice, 2)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTradeCompany && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Share Price</span>
                    <span className="font-mono-num font-bold text-cyan-300">
                      {formatExactCurrency(selectedTradeCompany.sharePrice, 2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Div / Share</span>
                    <span className="font-mono-num font-bold text-emerald-300">
                      {formatExactCurrency(
                        selectedTradeCompany.dividendsPerShare,
                        2
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Market Cap</span>
                    <span className="font-mono-num font-bold text-white">
                      {formatCurrency(selectedTradeCompany.valuation)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Number of Shares to Trade
                </label>
                <input
                  type="number"
                  min="1"
                  step="10000"
                  value={tradeUnits}
                  onChange={(e) => setTradeUnits(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono-num"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleTrade("BUY")}
                  className="py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                >
                  Buy Shares
                </button>
                <button
                  onClick={() => handleTrade("SELL")}
                  className="py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold cursor-pointer"
                >
                  Sell Shares
                </button>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Active Account Portfolio Holdings */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeAccount?.holderName} — Equity Portfolio
                </h3>
                <p className="text-xs text-slate-400">
                  Quarterly dividends automatically accrue into the Dividend Pot whenever a quarter advances
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">
                    Unclaimed Dividend Pot
                  </div>
                  <div className="text-lg font-bold font-mono-num text-emerald-400">
                    {formatCurrency(activeAccount?.dividendPot)}
                  </div>
                </div>
                <button
                  onClick={() =>
                    onExecuteTrade(activeAccount.id, {
                      action: "CLAIM_DIVIDENDS",
                    })
                  }
                  className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer"
                >
                  Claim Dividends to Cash
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">HQ Nation</th>
                    <th className="py-2.5 px-3 text-right">Shares Held</th>
                    <th className="py-2.5 px-3 text-right">Share Price</th>
                    <th className="py-2.5 px-3 text-right">Position Value</th>
                    <th className="py-2.5 px-3 text-right">Est. Quarterly Div</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(activeAccount?.holdings || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-500"
                      >
                        No equity positions held yet. Use the order terminal on the left to purchase shares.
                      </td>
                    </tr>
                  ) : (
                    (activeAccount?.holdings || []).map((h, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {h.companyName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {h.hqCountry}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-slate-200">
                          {formatCompactNumber(h.units)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-cyan-300">
                          {formatExactCurrency(h.sharePrice, 2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-bold text-white">
                          {formatCurrency(h.holdingValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-emerald-400">
                          +{formatCurrency(h.holdingDividends)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Found New Political Party Modal */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Found New Political Party
            </h3>
            <form onSubmit={handleCreateParty} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Party Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Martian Technocratic Front"
                    value={partyForm.name}
                    onChange={(e) =>
                      setPartyForm({ ...partyForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Alignment</label>
                  <input
                    type="text"
                    value={partyForm.politicalAlignment}
                    onChange={(e) =>
                      setPartyForm({
                        ...partyForm,
                        politicalAlignment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Income Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partyForm.incomeTaxPreference}
                    onChange={(e) =>
                      setPartyForm({
                        ...partyForm,
                        incomeTaxPreference: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Sales Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partyForm.salesTaxPreference}
                    onChange={(e) =>
                      setPartyForm({
                        ...partyForm,
                        salesTaxPreference: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Corp Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partyForm.corporateTaxRate}
                    onChange={(e) =>
                      setPartyForm({
                        ...partyForm,
                        corporateTaxRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-500 text-slate-950 font-bold cursor-pointer"
                >
                  Register Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

