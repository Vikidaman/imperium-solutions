import React from "react";
import {
  Landmark,
  Sliders,
  Users,
  Shield,
  HeartPulse,
  Building2,
  Coins,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Factory,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
  getShortSectorName,
} from "../utils/formatters";

export default function NationSimulatorDesk({
  state,
  selectedNationId,
  onSelectNation,
  onUpdateNation,
  onDeleteNation,
  onJumpToTab,
}) {
  const nations = state.nations || [];
  const nation =
    nations.find((n) => n.id === selectedNationId) || nations[0];

  if (!nation) return null;
  const c = nation.computed || {};
  const parties = state.politicalParties || [];
  const currentParty =
    parties.find((p) => p.name === nation.rulingParty) || parties[0] || {};

  const hasOverrides =
    nation.incomeTaxOverride !== undefined &&
    nation.incomeTaxOverride !== null ||
    nation.salesTaxOverride !== undefined &&
    nation.salesTaxOverride !== null ||
    nation.corporateTaxOverride !== undefined &&
    nation.corporateTaxOverride !== null ||
    nation.workerShareOverride !== undefined &&
    nation.workerShareOverride !== null ||
    nation.budgetPercentOverride !== undefined &&
    nation.budgetPercentOverride !== null;

  const clearTaxOverrides = () => {
    onUpdateNation(nation.id, {
      incomeTaxOverride: null,
      salesTaxOverride: null,
      corporateTaxOverride: null,
      workerShareOverride: null,
      budgetPercentOverride: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Nation Selector Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {nations.map((n) => {
            const active = n.id === nation.id;
            const isMars = (n.planet || "").toLowerCase().includes("mars");
            return (
              <button
                key={n.id}
                onClick={() => onSelectNation(n.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? isMars
                      ? "bg-orange-500 text-slate-950 shadow-sm shadow-orange-500/30"
                      : "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{n.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    active
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-slate-950/60 text-slate-400"
                  }`}
                >
                  {n.planet}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onJumpToTab("companies")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            {nation.companies?.length || 0} Companies
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => onJumpToTab("markets")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Local Market & Tariffs
            <ArrowRight className="w-3 h-3" />
          </button>
          {nations.length > 1 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to dissolve ${nation.name}?`
                  )
                ) {
                  onDeleteNation(nation.id);
                }
              }}
              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 cursor-pointer"
              title="Dissolve Nation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Top 8 Macro KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Aggregate GDP</div>
          <div className="text-lg font-bold font-mono-num text-white mt-0.5">
            {formatCurrency(c.aggregateGdp)}
          </div>
          <div className="text-[10px] text-cyan-400 font-mono-num mt-1">
            Avg Corp Growth: {formatPercent(c.averageCompanyGrowth, 2, true)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Market Valuation</div>
          <div className="text-lg font-bold font-mono-num text-cyan-300 mt-0.5">
            {formatCurrency(c.totalValuation)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {nation.stockExchangeName}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Quarterly Wages</div>
          <div className="text-lg font-bold font-mono-num text-emerald-300 mt-0.5">
            {formatExactCurrency(c.quarterlyWages, 2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Worker Share: {formatPercent(c.workerShareOfGdp, 0)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Standard of Living</div>
          <div className="text-lg font-bold font-mono-num text-amber-300 mt-0.5">
            {(c.sol || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Confidence: {c.consumerConfidence}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Unemployment</div>
          <div
            className={`text-lg font-bold font-mono-num mt-0.5 ${
              c.unemploymentRate > 0.12
                ? "text-amber-400"
                : c.unemploymentRate < 0
                ? "text-rose-400"
                : "text-slate-100"
            }`}
          >
            {formatPercent(c.unemploymentRate, 2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Emp: {formatCompactNumber(c.totalEmployed)} /{" "}
            {formatCompactNumber(c.effectiveWorkingPops)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Pop Growth / Q</div>
          <div
            className={`text-lg font-bold font-mono-num mt-0.5 ${
              c.popGrowthRate >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatPercent(c.popGrowthRate, 2, true)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Fert: {formatPercent(c.fertilityRate, 2)} | Mort:{" "}
            {formatPercent(c.mortalityRate, 2)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Net Budget / Q</div>
          <div
            className={`text-lg font-bold font-mono-num mt-0.5 ${
              c.netBudgetBalance >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(c.netBudgetBalance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Income: {formatCurrency(c.stateIncome)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">Treasury Reserve</div>
          <div
            className={`text-lg font-bold font-mono-num mt-0.5 ${
              c.treasuryBalance >= 0 ? "text-cyan-300" : "text-rose-400"
            }`}
          >
            {formatCurrency(c.treasuryBalance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Criminals: {formatCompactNumber(c.numberOfCriminals)}
          </div>
        </div>
      </div>

      {/* Main 3-Column Interactive Simulator Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Fiscal, Tax & Political levers */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Governance & Tax Levers
            </h3>
            {hasOverrides && (
              <button
                onClick={clearTaxOverrides}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Reset custom tax overrides to Ruling Party defaults"
              >
                <RotateCcw className="w-3 h-3" />
                Use Party Platform
              </button>
            )}
          </div>

          {/* Ruling Party Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ruling Political Party (Governs Base Tax & Social Platform)
            </label>
            <select
              value={nation.rulingParty}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  rulingParty: e.target.value,
                  crimePolicy:
                    parties.find((p) => p.name === e.target.value)
                      ?.localCrimePolicy || nation.crimePolicy,
                  healthcarePolicy:
                    parties.find((p) => p.name === e.target.value)
                      ?.healthcarePolicy || nation.healthcarePolicy,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white cursor-pointer"
            >
              {parties.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.politicalAlignment} — Support:{" "}
                  {Math.round((p.currentSupport || 0) * 100)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Income Tax Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Income Tax Rate{" "}
                {nation.incomeTaxOverride !== undefined &&
                  nation.incomeTaxOverride !== null && (
                    <span className="text-amber-400 text-[10px]">(Override)</span>
                  )}
              </span>
              <span className="font-mono-num font-bold text-cyan-300">
                {formatPercent(c.incomeTax, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.75"
              step="0.01"
              value={c.incomeTax}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  incomeTaxOverride: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Sales Tax Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Sales / Consumption Tax Rate{" "}
                {nation.salesTaxOverride !== undefined &&
                  nation.salesTaxOverride !== null && (
                    <span className="text-amber-400 text-[10px]">(Override)</span>
                  )}
              </span>
              <span className="font-mono-num font-bold text-cyan-300">
                {formatPercent(c.salesTax, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.50"
              step="0.01"
              value={c.salesTax}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  salesTaxOverride: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Corporate Tax Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Corporate Tax Rate{" "}
                {nation.corporateTaxOverride !== undefined &&
                  nation.corporateTaxOverride !== null && (
                    <span className="text-amber-400 text-[10px]">(Override)</span>
                  )}
              </span>
              <span className="font-mono-num font-bold text-cyan-300">
                {formatPercent(c.corporateTax, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.75"
              step="0.01"
              value={c.corporateTax}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  corporateTaxOverride: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Worker Share of GDP Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Worker Share of GDP (Wage vs Profit Split)
              </span>
              <span className="font-mono-num font-bold text-emerald-300">
                {formatPercent(c.workerShareOfGdp, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.90"
              step="0.01"
              value={c.workerShareOfGdp}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  workerShareOverride: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* State Budget % of GDP Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                State Expenditure Target (% of GDP)
              </span>
              <span className="font-mono-num font-bold text-amber-300">
                {formatPercent(c.stateBudgetPercent, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.65"
              step="0.01"
              value={c.stateBudgetPercent}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  budgetPercentOverride: Number(e.target.value),
                })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Federal Cooperativity Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Federal Cooperativity (% of State Income Pooled)
              </span>
              <span className="font-mono-num font-bold text-purple-300">
                {formatPercent(nation.federalCooperativity || 0, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.50"
              step="0.01"
              value={nation.federalCooperativity || 0}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  federalCooperativity: Number(e.target.value),
                })
              }
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Diplomatic Expenses & K-Factor Scaler */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Diplomatic / Aid Balance ($)
              </label>
              <input
                type="number"
                step="100000000"
                value={nation.diplomaticExpenses || 0}
                onChange={(e) =>
                  onUpdateNation(nation.id, {
                    diplomaticExpenses: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                K-Factor Scaler (Tools Base)
              </label>
              <input
                type="number"
                step="50"
                min="100"
                value={nation.kFactorScaler || 1500}
                onChange={(e) =>
                  onUpdateNation(nation.id, {
                    kFactorScaler: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Demographics, Infrastructure, Crime & Healthcare */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Demographics, Social & Industrial Policy
            </h3>
          </div>

          {/* Working Population & Consumer Sentiment */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Working Population
              </label>
              <input
                type="number"
                step="500000"
                min="1000"
                value={Math.round(c.effectiveWorkingPops || nation.workingPops)}
                onChange={(e) =>
                  onUpdateNation(nation.id, {
                    workingPops: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Consumer Confidence (1–100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={nation.consumerSentiment || 50}
                onChange={(e) =>
                  onUpdateNation(nation.id, {
                    consumerSentiment: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono-num"
              />
            </div>
          </div>

          {/* Literacy Rate Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Literacy Rate (Boosts SOL, Fertility & Base RGDP Growth)
              </span>
              <span className="font-mono-num font-bold text-emerald-300">
                {formatPercent(c.literacyRate, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.99"
              step="0.01"
              value={c.literacyRate}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  literacyRate: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Urbanisation Index Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Urbanisation Index (Boosts SOL & Immigration; Scales Crime Mortality)
              </span>
              <span className="font-mono-num font-bold text-cyan-300">
                {formatPercent(c.urbanisationIndex, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.99"
              step="0.01"
              value={c.urbanisationIndex}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  urbanisationIndex: Number(e.target.value),
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Infrastructure Efficiency Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">
                Infrastructure Efficiency (Multiplies Corporate BASERGDPGROWTH)
              </span>
              <span className="font-mono-num font-bold text-amber-300">
                {formatPercent(c.infrastructureEfficiency, 1)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={c.infrastructureEfficiency}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  infrastructureEfficiency: Number(e.target.value),
                })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Specialized Industry */}
          <div className="text-xs">
            <label className="block text-slate-300 font-medium mb-1">
              National Specialized Sector (1.25x Growth Bonus vs 0.75x Other)
            </label>
            <select
              value={nation.specializedIndustry || "No Specialization"}
              onChange={(e) =>
                onUpdateNation(nation.id, {
                  specializedIndustry: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
            >
              <option value="No Specialization">
                No Specialization (1.0x Balanced Across All Sectors)
              </option>
              <option value="Agricultural Sector GDP">
                Agricultural Sector GDP (1.25x)
              </option>
              <option value="Industry & Manufacturing GDP">
                Industry & Manufacturing GDP (1.25x)
              </option>
              <option value="Hospitality & Tourist Services GDP">
                Hospitality & Tourist Services GDP (1.25x)
              </option>
              <option value="Office & Corporate Services GDP">
                Office & Corporate Services GDP (1.25x)
              </option>
            </select>
          </div>

          {/* Crime Policy & Healthcare Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Local Crime Policing Doctrine
              </label>
              <select
                value={c.crimePolicy}
                onChange={(e) =>
                  onUpdateNation(nation.id, { crimePolicy: e.target.value })
                }
                className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
              >
                <option value="Gentle Touch">Gentle Touch (1.5x Crime Mult)</option>
                <option value="Beat Cops">Beat Cops (0.9x Crime Mult)</option>
                <option value="Profiling">Profiling (0.75x Crime Mult)</option>
                <option value="Militarized Police">
                  Militarized Police (0.1x Crime Mult)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                National Healthcare System
              </label>
              <select
                value={c.healthcarePolicy}
                onChange={(e) =>
                  onUpdateNation(nation.id, { healthcarePolicy: e.target.value })
                }
                className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
              >
                <option value="Private Healthcare">
                  Private Healthcare (+1% Base Mortality)
                </option>
                <option value="State-run Healthcare">
                  State-run Healthcare (+1% Base Mortality)
                </option>
                <option value="No Healthcare">
                  Unregulated / None (+5% Base Mortality)
                </option>
                <option value="Euthanasia">
                  Mandatory Euthanasia (+30% Mortality)
                </option>
              </select>
            </div>
          </div>

          {/* High Immigration Destination Toggle */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-200 font-medium block">
                High-Immigration Magnet Status
              </span>
              <span className="text-slate-400 text-[11px]">
                10% SOL × Urbanisation attraction coefficient (vs 1% standard)
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(nation.highImmigration)}
              onChange={(e) =>
                onUpdateNation(nation.id, { highImmigration: e.target.checked })
              }
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Column 3: Fiscal Waterfall & Sector Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Quarterly Fiscal & Trade Balance Sheet
            </h3>
          </div>

          {/* Sector GDP Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              4-Sector GDP Composition
            </div>
            {[
              {
                label: "Agricultural Sector GDP",
                val: c.agriculturalGdp,
                color: "bg-emerald-500",
              },
              {
                label: "Industry & Manufacturing GDP",
                val: c.industryGdp,
                color: "bg-amber-500",
              },
              {
                label: "Hospitality & Tourist Services GDP",
                val: c.hospitalityGdp,
                color: "bg-purple-500",
              },
              {
                label: "Office & Corporate Services GDP",
                val: c.officeGdp,
                color: "bg-cyan-500",
              },
            ].map((sec) => {
              const pct =
                c.aggregateGdp > 0 ? (sec.val / c.aggregateGdp) * 100 : 0;
              return (
                <div key={sec.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-300">
                      {getShortSectorName(sec.label)}
                    </span>
                    <span className="font-mono-num text-slate-200">
                      {formatCurrency(sec.val)}{" "}
                      <span className="text-slate-500">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${sec.color}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* State Income Breakdown */}
          <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
              State Revenues (Quarterly)
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Income Tax Revenue</span>
              <span className="font-mono-num text-slate-200">
                {formatCurrency(c.incomeTaxRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Corporate Tax Revenue</span>
              <span className="font-mono-num text-slate-200">
                {formatCurrency(c.corporateTaxRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sales Tax Revenue</span>
              <span className="font-mono-num text-slate-200">
                {formatCurrency(c.salesTaxRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                Tariff Revenues (Import + Export)
              </span>
              <span className="font-mono-num text-slate-200">
                {formatCurrency(c.tariffRevenues)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                State-Owned Enterprise Dividends
              </span>
              <span
                className={`font-mono-num ${
                  c.govtDividends >= 0 ? "text-emerald-300" : "text-rose-400"
                }`}
              >
                {formatCurrency(c.govtDividends)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80 font-semibold text-white">
              <span>Total State Income</span>
              <span className="font-mono-num text-emerald-400">
                {formatCurrency(c.stateIncome)}
              </span>
            </div>
          </div>

          {/* Expenditures & Federal Flows */}
          <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold">
              Expenditures & Planetary Federation Flows
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                State Budget ({formatPercent(c.stateBudgetPercent, 0)} GDP) + Pool
              </span>
              <span className="font-mono-num text-rose-300">
                -{formatCurrency(c.stateExpenditures)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                State Contribution to Federation
              </span>
              <span className="font-mono-num text-slate-300">
                {formatCurrency(c.stateContributions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">
                Federal Equalization Receipt
              </span>
              <span className="font-mono-num text-cyan-300">
                +{formatCurrency(c.federalContributions)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Diplomatic / Aid Balance</span>
              <span className="font-mono-num text-slate-300">
                {formatCurrency(c.diplomaticExpenses)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
              <span className="text-white">Net Quarterly Fiscal Balance</span>
              <span
                className={`font-mono-num ${
                  c.netBudgetBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(c.netBudgetBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

