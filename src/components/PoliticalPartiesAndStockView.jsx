import React, { useState } from "react";
import {
  Flag,
  Briefcase,
  PlusCircle,
  Coins,
  Building2,
  Users,
  Shield,
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
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("parties")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subTab === "parties"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Flag className="w-4 h-4" />
            Political Movements & Ideologies ({parties.length})
          </button>
          <button
            onClick={() => setSubTab("stock")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              subTab === "stock"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Global Stock Exchange & Sovereign Funds ({accounts.length})
          </button>
        </div>

        {subTab === "parties" && (
          <button
            onClick={() => setShowPartyModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Found New Political Movement
          </button>
        )}
      </div>

      {/* SUB-TAB 1: POLITICAL MOVEMENTS CARDS GRID */}
      {subTab === "parties" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {parties.map((p) => {
            const governedNations = (state.nations || []).filter(
              (n) => n.rulingParty === p.name
            );
            return (
              <div
                key={p.name}
                className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-display text-white">
                        {p.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {p.politicalAlignment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Origin: {p.nation} • Governing:{" "}
                      {governedNations.length > 0
                        ? governedNations.map((n) => n.name).join(", ")
                        : "In Opposition"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      Popular Support
                    </span>
                    <span className="font-mono-num font-bold text-emerald-400 text-sm">
                      {formatPercent(p.currentSupport, 0)}
                    </span>
                  </div>
                </div>

                {/* Tax & Labor Platform Sliders */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Income Tax</span>
                      <span className="font-mono-num text-cyan-300 font-bold">
                        {formatPercent(p.incomeTaxPreference, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.75"
                      step="0.01"
                      value={p.incomeTaxPreference}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          incomeTaxPreference: Number(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Corporate Tax</span>
                      <span className="font-mono-num text-cyan-300 font-bold">
                        {formatPercent(p.corporateTaxRate, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.75"
                      step="0.01"
                      value={p.corporateTaxRate}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          corporateTaxRate: Number(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Labor Wage Share</span>
                      <span className="font-mono-num text-emerald-300 font-bold">
                        {formatPercent(p.workerShareOfGdp, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.85"
                      step="0.01"
                      value={p.workerShareOfGdp}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          workerShareOfGdp: Number(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">State Spending</span>
                      <span className="font-mono-num text-amber-300 font-bold">
                        {formatPercent(p.budgetAsPercentOfGdp, 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.65"
                      step="0.01"
                      value={p.budgetAsPercentOfGdp}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          budgetAsPercentOfGdp: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Policing & Healthcare Doctrines */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Policing Doctrine
                    </label>
                    <select
                      value={p.localCrimePolicy}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          localCrimePolicy: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-[11px]"
                    >
                      <option value="Gentle Touch">Gentle Touch</option>
                      <option value="Beat Cops">Beat Cops</option>
                      <option value="Profiling">Profiling</option>
                      <option value="Militarized Police">
                        Militarized Police
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Healthcare System
                    </label>
                    <select
                      value={p.healthcarePolicy}
                      onChange={(e) =>
                        onSaveParty({
                          ...p,
                          healthcarePolicy: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-[11px]"
                    >
                      <option value="Private Healthcare">
                        Private Healthcare
                      </option>
                      <option value="State-run Healthcare">
                        State-run Healthcare
                      </option>
                      <option value="No Healthcare">Unregulated</option>
                      <option value="Euthanasia">Euthanasia</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: STOCK EXCHANGE & INVESTOR PORTFOLIOS */}
      {subTab === "stock" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Account Selector & Order Execution */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Sovereign Wealth & Investor Funds
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
                          Dividends: {formatCurrency(acc.dividendPot)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="New Sovereign / Private Fund..."
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

            {/* Order Terminal */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Global Bourse Order Terminal
              </h3>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  National Exchange
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
                  Corporation
                </label>
                <select
                  value={selectedTradeCompany?.name || ""}
                  onChange={(e) => setTradeCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  {(tradeNation?.companies || []).slice(0, 150).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.flagshipGood}) —{" "}
                      {formatExactCurrency(c.sharePrice, 2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Shares to Trade
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
                  Acquire Stake
                </button>
                <button
                  onClick={() => handleTrade("SELL")}
                  className="py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold cursor-pointer"
                >
                  Divest Stake
                </button>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Visual Equity Position Cards */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeAccount?.holderName} — Active Equity Holdings
                </h3>
                <p className="text-xs text-slate-400">
                  Dividends automatically compound into your fund's reserve at the end of every quarter
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">
                    Accrued Dividends
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
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer"
                >
                  Collect Dividends
                </button>
              </div>
            </div>

            {(activeAccount?.holdings || []).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No equity stakes held in this fund yet. Use the Bourse Order Terminal on the left to acquire shares.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(activeAccount?.holdings || []).map((h, i) => (
                  <div
                    key={i}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {h.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          HQ: {h.hqCountry}
                        </div>
                      </div>
                      <span className="font-mono-num font-bold text-cyan-300 text-sm">
                        {formatCurrency(h.holdingValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono-num">
                      <span className="text-slate-300">
                        {formatCompactNumber(h.units)} shares @{" "}
                        {formatExactCurrency(h.sharePrice, 2)}
                      </span>
                      <span className="text-emerald-400">
                        +{formatCurrency(h.holdingDividends)}/Q
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Found New Political Party Modal */}
      {showPartyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Found New Political Movement
            </h3>
            <form onSubmit={handleCreateParty} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Movement Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Martian Technocratic Union"
                    value={partyForm.name}
                    onChange={(e) =>
                      setPartyForm({ ...partyForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ideology</label>
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
                  Launch Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
