import React, { useState } from "react";
import {
  Newspaper,
  Scale,
  Vote,
  Users,
  Hammer,
  Sparkles,
  Flame,
  ShieldCheck,
  Award,
  Megaphone,
  Coins,
  CheckCircle2,
  XCircle,
  FastForward,
  Plus,
  Filter,
  Crown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatCompactNumber } from "../utils/formatters";

const LAW_CATALOG_UI = {
  governance: {
    label: "Governance & Suffrage",
    options: [
      { id: "Autocracy", name: "Autocracy", desc: "Rule by decree (+300 Authority, no elections, Upper Strata +200% weight)." },
      { id: "Oligarchy", name: "Oligarchy", desc: "Plutocratic elite council (+200 Authority, no elections, Capitalist & Gentry dominance)." },
      { id: "Wealth Voting", name: "Wealth Voting", desc: "Property & wealth threshold voting. Empowers Industrialists & Petite Bourgeoisie." },
      { id: "Census Suffrage", name: "Census Suffrage", desc: "Literacy & tax-weighted franchise. Empowers Middle Strata & Intelligentsia." },
      { id: "Universal Suffrage", name: "Universal Suffrage", desc: "Equal universal franchise. Empowers Trade Unions, Rural Folk & popular coalitions." },
      { id: "Council Republic", name: "Council Republic", desc: "Worker syndicate assembly (+12% Worker GDP Share, strong Trade Unions clout)." },
    ],
  },
  economy: {
    label: "Economic System",
    options: [
      { id: "Traditionalism", name: "Traditionalism", desc: "Pre-industrial patronage economy (-15% tax efficiency, Landowners +25%)." },
      { id: "Agrarianism", name: "Agrarianism", desc: "Rural estate focus (+20% Agricultural GDP output, empowers Rural Folk)." },
      { id: "Interventionism", name: "Interventionism", desc: "Mixed economy with state subsidies, sovereign equity stakes & balanced growth." },
      { id: "Laissez-Faire", name: "Laissez-Faire", desc: "Free-market capitalism (+25% Corporate Growth, +10% Dividend Efficiency)." },
      { id: "Command Economy", name: "Command Economy", desc: "Centralized state planning (+20% Fiscal Capture, +100 Authority)." },
      { id: "Cooperative Ownership", name: "Cooperative Ownership", desc: "Worker-owned enterprises (+15% Worker GDP Share, +2.5 Lower Strata SoL)." },
    ],
  },
  trade: {
    label: "Trade Policy",
    options: [
      { id: "Isolationism", name: "Isolationism", desc: "Closed self-reliant market (+120 Authority, high tariff barrier)." },
      { id: "Mercantilism", name: "Mercantilism", desc: "Export surplus promotion (+15% Tariff Revenue efficiency)." },
      { id: "Protectionism", name: "Protectionism", desc: "Domestic industry protection (+20% Tariff Revenue efficiency)." },
      { id: "Free Trade", name: "Free Trade", desc: "Open global trade (+12% Company VGP competitiveness, lower tariff friction)." },
    ],
  },
  taxation: {
    label: "Taxation Law",
    options: [
      { id: "Consumption-Based Taxation", name: "Consumption-Based Taxation", desc: "Excise & sales levies (-1.2 Lower Strata SoL, favored by elites)." },
      { id: "Per-Capita Taxation", name: "Per-Capita Taxation", desc: "Flat poll & wage taxation (-0.4 Lower Strata SoL)." },
      { id: "Proportional Taxation", name: "Proportional Taxation", desc: "Balanced income & corporate tax scaling (+10% Revenue, +0.5 Lower SoL)." },
      { id: "Graduated Taxation", name: "Graduated Taxation", desc: "Progressive dividend & profit taxation (+25% Corp Tax yield, +1.8 Lower SoL)." },
    ],
  },
  policing: {
    label: "Internal Security",
    options: [
      { id: "Gentle Touch", name: "Gentle Touch", desc: "Civil liberties focus (+Intelligentsia approval, 1.5x crime rate)." },
      { id: "Beat Cops", name: "Beat Cops", desc: "Dedicated municipal police (0.9x crime rate)." },
      { id: "Profiling", name: "Profiling", desc: "Targeted security apparatus (+50 Authority, 0.75x crime rate)." },
      { id: "Militarized Police", name: "Militarized Police", desc: "Paramilitary internal security (+120 Authority, 0.1x crime rate)." },
    ],
  },
  welfare: {
    label: "Healthcare & Welfare",
    options: [
      { id: "Private Healthcare", name: "Private Healthcare", desc: "Market healthcare (1% mortality base, +2.0 Upper Strata SoL)." },
      { id: "State-run Healthcare", name: "State-run Healthcare", desc: "Universal public health system (1% mortality base, +2.2 Lower Strata SoL)." },
      { id: "Euthanasia", name: "Austerity / Triage Protocol", desc: "Extreme spreadsheet triage policy (30% mortality base, severe radicalism)." },
    ],
  },
};

const BUILDINGS_CATALOG_UI = [
  {
    id: "industrial_complex",
    name: "Heavy Industrial & Steel Complex",
    good: "Steel",
    cost: 4500000000,
    daysRequired: 90,
    jobsCreated: 185000,
    desc: "Spawns a major Steel & Tooling enterprise (+185k jobs, +Industrialists clout).",
  },
  {
    id: "semiconductor_foundry",
    name: "Advanced Semiconductor Foundry",
    good: "Semi-Conductor",
    cost: 8500000000,
    daysRequired: 120,
    jobsCreated: 140000,
    desc: "Spawns a high-tech wafer foundry (+140k jobs, +Intelligentsia clout).",
  },
  {
    id: "agrarian_estates",
    name: "Mechanized Agricultural Estates",
    good: "Grain",
    cost: 2400000000,
    daysRequired: 60,
    jobsCreated: 220000,
    desc: "Expands food supply & lowers living costs (+220k jobs, +Rural Folk clout).",
  },
  {
    id: "financial_district",
    name: "Sovereign Financial & Bourse Tower",
    good: "Banking",
    cost: 6200000000,
    daysRequired: 90,
    jobsCreated: 130000,
    desc: "Expands capital markets & corporate services (+130k jobs, +Upper/Middle SoL).",
  },
  {
    id: "infrastructure_grid",
    name: "National Railway & Power Grid",
    good: "Electricity",
    cost: 5000000000,
    daysRequired: 90,
    jobsCreated: 110000,
    desc: "Permanently increases National Infrastructure Efficiency (+5%).",
  },
  {
    id: "university_academy",
    name: "National Academy of Sciences",
    good: "Tools",
    cost: 3800000000,
    daysRequired: 75,
    jobsCreated: 65000,
    desc: "Permanently increases National Literacy Rate (+4%, +Intelligentsia clout).",
  },
];

export default function VictoriaStatecraftAndNewsView({
  state,
  selectedNationId,
  onSelectNation,
  onVictoriaAction,
  initialSubTab = "overview",
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("ALL");
  const [customHeadline, setCustomHeadline] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [showPublishForm, setShowPublishForm] = useState(false);

  const nations = state.nations || [];
  const nation = nations.find((n) => n.id === selectedNationId) || nations[0];
  if (!nation) return null;

  const strata = nation.strata || {};
  const radicals = nation.radicals || {};
  const capacities = nation.capacities || {};
  const igs = nation.interestGroups || [];
  const es = nation.electionState || {};
  const polls = es.polls || [];
  const activeLaw = nation.activeLawEnactment;
  const newsFeed = state.newsFeed || [];
  const activeDilemmas = state.activeDilemmas || [];

  const filteredNews =
    newsCategoryFilter === "ALL"
      ? newsFeed
      : newsFeed.filter((n) => (n.category || "").includes(newsCategoryFilter));

  const handlePublishDispatch = (e) => {
    e.preventDefault();
    if (!customHeadline.trim()) return;
    onVictoriaAction({
      type: "PUBLISH_NEWS",
      headline: customHeadline.trim(),
      summary:
        customSummary.trim() ||
        `Official dispatch issued from ${nation.name} on ${state.timeManager?.crisisDate}.`,
      category: "SPECIAL EDITION",
      nationName: nation.name,
    });
    setCustomHeadline("");
    setCustomSummary("");
    setShowPublishForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Nation Selector & Victoria 3 National Capacities Ribbon */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 block">
              Victoria 3 Statecraft & Gazette Desk
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={nation.id}
                onChange={(e) => onSelectNation(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-base font-bold text-white cursor-pointer"
              >
                {nations.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.planet}) — #{n.capacities?.globalRank || 1}{" "}
                    {n.capacities?.rankTitle || "Power"}
                  </option>
                ))}
              </select>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono-num font-bold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> #{capacities.globalRank}{" "}
                {capacities.rankTitle} ({capacities.prestige} Prestige)
              </span>
            </div>
          </div>
        </div>

        {/* Victoria 3 Core Capacities Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1 max-w-4xl">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400 uppercase">Bureaucracy</div>
            <div
              className={`text-sm font-bold font-mono-num ${
                (capacities.bureaucracyBalance || 0) >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {(capacities.bureaucracyBalance || 0) >= 0 ? "+" : ""}
              {capacities.bureaucracyBalance || 0}
            </div>
            <div className="text-[10px] text-slate-500">
              {capacities.bureaucracyProduced} prod / {capacities.bureaucracyUsed} used
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400 uppercase">Authority</div>
            <div className="text-sm font-bold font-mono-num text-amber-400">
              +{capacities.authority || 100}
            </div>
            <div className="text-[10px] text-slate-500">{nation.laws?.governance}</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400 uppercase">Legitimacy</div>
            <div
              className={`text-sm font-bold font-mono-num ${
                (radicals.legitimacy || 70) >= 75
                  ? "text-emerald-400"
                  : (radicals.legitimacy || 70) >= 50
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {radicals.legitimacy || 70}/100
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {radicals.legitimacyTier}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400 uppercase">
              Standard of Living
            </div>
            <div className="text-sm font-bold font-mono-num text-cyan-400">
              {strata.averageSol || 16.0}{" "}
              <span className="text-xs font-normal text-slate-300">
                ({strata.solTier})
              </span>
            </div>
            <div className="text-[10px] text-slate-500">1–50 Victoria Scale</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
            <div className="text-[10px] text-slate-400 uppercase">
              Loyalists / Radicals
            </div>
            <div className="text-xs font-bold font-mono-num flex items-center gap-2 mt-0.5">
              <span className="text-emerald-400">
                {radicals.loyalistShare || 15}% Loy
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400">
                {radicals.share || 8}% Rad
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Turmoil: {radicals.turmoil || 8}%
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            id: "overview",
            label: "Pops, Interest Groups & Laws",
            icon: Scale,
          },
          {
            id: "elections",
            label: `Dynamic Elections (${es.daysUntilElection ?? 180}d)`,
            icon: Vote,
          },
          {
            id: "construction",
            label: `Construction Queue (${nation.constructionQueue?.length || 0})`,
            icon: Hammer,
          },
          {
            id: "gazette",
            label: `World Gazette & Dispatches (${newsFeed.length})`,
            icon: Newspaper,
            badge: activeDilemmas.length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                active
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {tab.badge} Dilemma{tab.badge > 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Policy Dilemmas Banner (if any exist) */}
      {activeDilemmas.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Active Statecraft Dispatch Requiring Your Decision ({activeDilemmas.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono-num">
              {activeDilemmas[0].date} • {activeDilemmas[0].nationName}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h4 className="text-base font-bold text-white">
              {activeDilemmas[0].title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {activeDilemmas[0].description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {(activeDilemmas[0].options || []).map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onVictoriaAction({
                      type: "RESOLVE_DILEMMA",
                      dilemmaId: activeDilemmas[0].id,
                      optionIndex: idx,
                    })
                  }
                  className="text-left p-3.5 rounded-xl bg-slate-900 hover:bg-amber-500/15 border border-slate-700 hover:border-amber-500/50 transition cursor-pointer group"
                >
                  <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    Option {idx + 1}: {opt.label}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-mono-num">
                    {opt.effectSummary}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1: POPS, INTEREST GROUPS & LAWS */}
      {subTab === "overview" && (
        <div className="space-y-6">
          {/* 3 Pop Strata Cards (Lower, Middle, Upper) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[strata.lower, strata.middle, strata.upper].map(
              (st, idx) =>
                st && (
                  <div
                    key={idx}
                    className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {idx === 0
                            ? "62% Workforce"
                            : idx === 1
                            ? "28% Workforce"
                            : "10% Workforce"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                          SoL {st.sol} ({st.tier})
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5">
                        {st.name}
                      </h3>
                      <div className="text-xl font-bold font-mono-num text-slate-100 mt-2">
                        {formatCompactNumber(st.pops)} Pops
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Standard of Living Bar</span>
                      <div className="w-32 h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400"
                          style={{ width: `${Math.min(100, (st.sol / 40) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
            )}
          </div>

          {/* 8 Interest Groups Grid */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Interest Groups & Parliamentary Clout ({nation.name})
                </h3>
                <p className="text-xs text-slate-400">
                  Click any Interest Group to toggle whether they sit{" "}
                  <span className="text-emerald-400 font-semibold">
                    In Government
                  </span>{" "}
                  or{" "}
                  <span className="text-slate-300 font-semibold">
                    In Opposition
                  </span>
                  , directly adjusting Government Legitimacy ({radicals.legitimacy}/100).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {igs.map((ig) => (
                <div
                  key={ig.id}
                  onClick={() =>
                    onVictoriaAction({
                      type: "ELECTION_ACTION",
                      nationId: nation.id,
                      actionType: "TOGGLE_IG_GOVERNMENT",
                      partyName: ig.id,
                    })
                  }
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    ig.inGovernment
                      ? "bg-emerald-950/25 border-emerald-500/40 hover:border-emerald-400"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${ig.color}22`,
                        color: ig.color,
                        border: `1px solid ${ig.color}55`,
                      }}
                    >
                      {ig.clout}% Clout
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ig.inGovernment
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {ig.inGovernment ? "In Gov" : "Opposition"}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-2">
                    {ig.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {ig.ideology}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate">
                      Party: <strong className="text-slate-200">{ig.party}</strong>
                    </span>
                    <span
                      className={`font-mono-num font-bold ${
                        ig.approval > 0
                          ? "text-emerald-400"
                          : ig.approval < 0
                          ? "text-rose-400"
                          : "text-slate-300"
                      }`}
                    >
                      {ig.approval > 0 ? `+${ig.approval}` : ig.approval} Appr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active 3-Phase Law Enactment Progress Tracker */}
          {activeLaw && (
            <div className="glass-panel rounded-2xl p-5 border border-cyan-500/40 bg-cyan-950/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Active Parliamentary Bill • Phase {activeLaw.phase} of 3 (
                    {activeLaw.phase === 1
                      ? "Debate"
                      : activeLaw.phase === 2
                      ? "Committee Vote"
                      : "Final Assent"}
                    )
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Enacting {activeLaw.lawName} ({activeLaw.categoryLabel})
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeLaw.lastOutcome}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onVictoriaAction({
                        type: "LAW_ACTION",
                        nationId: nation.id,
                        actionType: "ADVANCE_PHASE",
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" /> Push Bill to Next Phase
                  </button>
                  <button
                    onClick={() =>
                      onVictoriaAction({
                        type: "LAW_ACTION",
                        nationId: nation.id,
                        actionType: "CANCEL_ENACTMENT",
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel Bill
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[1, 2, 3].map((pNum) => (
                  <div
                    key={pNum}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold ${
                      activeLaw.phase > pNum
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : activeLaw.phase === pNum
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 animate-pulse"
                        : "bg-slate-900/60 border-slate-800 text-slate-500"
                    }`}
                  >
                    Phase {pNum}:{" "}
                    {pNum === 1
                      ? "Floor Debate"
                      : pNum === 2
                      ? "Committee Vote"
                      : "Sovereign Assent"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6 Law Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(LAW_CATALOG_UI).map(([catKey, catObj]) => {
              const currentLawId = nation.laws?.[catKey];
              return (
                <div
                  key={catKey}
                  className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {catObj.label}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      Active: {currentLawId}
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {catObj.options.map((opt) => {
                      const isActive = opt.id === currentLawId;
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border transition ${
                            isActive
                              ? "bg-amber-500/15 border-amber-500/50"
                              : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">
                              {opt.name}
                            </span>
                            {isActive ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Enacted
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    onVictoriaAction({
                                      type: "LAW_ACTION",
                                      nationId: nation.id,
                                      category: catKey,
                                      lawId: opt.id,
                                      actionType: "START_ENACTMENT",
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold cursor-pointer"
                                >
                                  Debate Bill
                                </button>
                                <button
                                  onClick={() =>
                                    onVictoriaAction({
                                      type: "LAW_ACTION",
                                      nationId: nation.id,
                                      category: catKey,
                                      lawId: opt.id,
                                      actionType: "INSTANT_DECREE",
                                    })
                                  }
                                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-semibold cursor-pointer"
                                  title="Enact immediately by Sovereign Decree"
                                >
                                  Decree
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {opt.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: DYNAMIC ELECTIONS & PARLIAMENTARY COALITIONS */}
      {subTab === "elections" && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Dynamic Parliamentary Election Engine • {nation.laws?.governance}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {nation.name} National Parliament (500 Seats)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Next Scheduled General Election:{" "}
                  <strong className="text-white font-mono-num">
                    {es.nextElectionDate}
                  </strong>{" "}
                  ({es.daysUntilElection} days remaining) • Ruling Party:{" "}
                  <strong className="text-emerald-400">{nation.rulingParty}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={es.electionIntervalDays || 360}
                  onChange={(e) =>
                    onVictoriaAction({
                      type: "ELECTION_ACTION",
                      nationId: nation.id,
                      actionType: "REFORM_GOVERNMENT",
                      electionIntervalDays: Number(e.target.value),
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  <option value={180}>Election Cycle: Every 180 Days</option>
                  <option value={360}>Election Cycle: Every 1 Year (360d)</option>
                  <option value={720}>Election Cycle: Every 2 Years (720d)</option>
                  <option value={1460}>Election Cycle: Every 4 Years (1460d)</option>
                </select>

                <button
                  onClick={() =>
                    onVictoriaAction({
                      type: "ELECTION_ACTION",
                      nationId: nation.id,
                      actionType: "CALL_SNAP_ELECTION",
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Vote className="w-4 h-4" /> Call Snap General Election Now
                </button>
              </div>
            </div>

            {/* 500-Seat Parliamentary Distribution Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Live Projected Parliamentary Seat Distribution (500 Seats)</span>
                <span>Majority Threshold: 251 Seats</span>
              </div>
              <div className="h-6 w-full rounded-xl overflow-hidden flex border border-slate-800 bg-slate-950">
                {polls.map((p, idx) => {
                  const palette = [
                    "#06b6d4",
                    "#f59e0b",
                    "#10b981",
                    "#a855f7",
                    "#ef4444",
                    "#3b82f6",
                  ];
                  const col = palette[idx % palette.length];
                  return (
                    <div
                      key={p.partyName}
                      style={{
                        width: `${p.projectedVoteShare}%`,
                        backgroundColor: col,
                      }}
                      className="h-full flex items-center justify-center text-[10px] font-bold text-slate-950 truncate px-1 transition-all duration-300"
                      title={`${p.partyName}: ${p.projectedVoteShare}% (${p.projectedSeats} seats)`}
                    >
                      {p.projectedVoteShare >= 8
                        ? `${p.partyName} (${p.projectedSeats})`
                        : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Competing Political Parties & Campaign Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {polls.map((poll, idx) => {
                const partyObj = (state.politicalParties || []).find(
                  (p) => p.name === poll.partyName
                );
                return (
                  <div
                    key={poll.partyName}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                      poll.isRuling
                        ? "bg-cyan-950/25 border-cyan-500/50"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono-num font-bold text-cyan-400">
                          #{idx + 1} in Polls • {poll.projectedVoteShare}% Vote
                        </span>
                        {poll.isRuling && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                            Ruling Party
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {poll.partyName}
                      </h4>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>
                          Projected Seats:{" "}
                          <strong className="text-white font-mono-num">
                            {poll.projectedSeats}/500
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Momentum:{" "}
                          <strong className="text-amber-300 font-mono-num">
                            +{poll.momentum}
                          </strong>
                        </span>
                      </div>

                      {partyObj && (
                        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300">
                          <div>
                            Income Tax:{" "}
                            <span className="font-mono-num text-white">
                              {Math.round(partyObj.incomeTaxPreference * 100)}%
                            </span>
                          </div>
                          <div>
                            Corp Tax:{" "}
                            <span className="font-mono-num text-white">
                              {Math.round(partyObj.corporateTaxRate * 100)}%
                            </span>
                          </div>
                          <div>
                            Worker Share:{" "}
                            <span className="font-mono-num text-emerald-400">
                              {Math.round(partyObj.workerShareOfGdp * 100)}%
                            </span>
                          </div>
                          <div>
                            Health:{" "}
                            <span className="text-cyan-300">
                              {partyObj.healthcarePolicy}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() =>
                          onVictoriaAction({
                            type: "ELECTION_ACTION",
                            nationId: nation.id,
                            actionType: "RALLY_PARTY",
                            partyName: poll.partyName,
                          })
                        }
                        className="flex-1 px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Megaphone className="w-3.5 h-3.5" /> Rally (+12)
                      </button>
                      <button
                        onClick={() =>
                          onVictoriaAction({
                            type: "ELECTION_ACTION",
                            nationId: nation.id,
                            actionType: "FUND_PARTY",
                            partyName: poll.partyName,
                          })
                        }
                        className="flex-1 px-2.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" /> Fund ($2B)
                      </button>
                      {!poll.isRuling && (
                        <button
                          onClick={() =>
                            onVictoriaAction({
                              type: "ELECTION_ACTION",
                              nationId: nation.id,
                              actionType: "REFORM_GOVERNMENT",
                              coalitionParties: [poll.partyName, nation.rulingParty],
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Appoint {poll.partyName} to Lead Coalition
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: STATE CONSTRUCTION SECTOR QUEUE */}
      {subTab === "construction" && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Victoria 3 National Construction Sector
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  State-Funded Industrial & Infrastructure Expansion ({nation.name})
                </h3>
                <p className="text-xs text-slate-400">
                  Construction Capacity:{" "}
                  <strong className="text-amber-300 font-mono-num">
                    {capacities.constructionCapacity} Points
                  </strong>{" "}
                  • Sovereign Treasury:{" "}
                  <strong className="text-emerald-400 font-mono-num">
                    {formatCurrency(nation.computed?.treasuryBalance || 0)}
                  </strong>
                </p>
              </div>
            </div>

            {/* Active Construction Queue */}
            {(nation.constructionQueue || []).length > 0 ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-300">
                  Active Construction Queue ({nation.constructionQueue.length})
                </div>
                {nation.constructionQueue.map((item, idx) => (
                  <div
                    key={item.queueId || idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {idx + 1}. {item.name} ({item.good})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono-num text-xs font-bold">
                        {item.daysRemaining}d remaining
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                No buildings currently queued. Select a project below to expand {nation.name}&apos;s industrial base or infrastructure.
              </div>
            )}

            {/* Buildable Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {BUILDINGS_CATALOG_UI.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 flex flex-col justify-between space-y-3 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-num uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                        {b.good}
                      </span>
                      <span className="text-xs font-mono-num font-bold text-amber-400">
                        {formatCurrency(b.cost)} • {b.daysRequired}d
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">
                      {b.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">{b.desc}</p>
                  </div>

                  <button
                    onClick={() =>
                      onVictoriaAction({
                        type: "QUEUE_CONSTRUCTION",
                        nationId: nation.id,
                        buildingId: b.id,
                      })
                    }
                    className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Hammer className="w-3.5 h-3.5" /> Construct in {nation.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: THE IMPERIAL GAZETTE & REGULAR WORLD NEWS */}
      {subTab === "gazette" && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono-num uppercase tracking-widest text-amber-400">
                  The Imperial Gazette • World Broadsheet & Chronicle
                </span>
                <h3 className="text-2xl font-bold font-display text-white mt-0.5">
                  Global News Dispatches & Historical Press Archive
                </h3>
                <p className="text-xs text-slate-400">
                  Edition Date: {state.timeManager?.crisisDate} (Q
                  {state.timeManager?.quarterNumber}) • Automatically chronicles elections, economic shifts, laws, and border changes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["ALL", "ELECTION", "QUARTERLY", "DIPLOMATIC", "LAW", "CONSTRUCTION"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewsCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        newsCategoryFilter === cat
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
                <button
                  onClick={() => setShowPublishForm(!showPublishForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish Press Dispatch
                </button>
              </div>
            </div>

            {showPublishForm && (
              <form
                onSubmit={handlePublishDispatch}
                className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3"
              >
                <div className="text-xs font-bold text-cyan-300 uppercase">
                  Issue Official Press Dispatch to Global Gazette
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Headline (e.g., Pacific Trade Pact Signed in Tokyo)"
                    value={customHeadline}
                    onChange={(e) => setCustomHeadline(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Summary details..."
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Publish to Front Page
                </button>
              </form>
            )}

            {/* Newspaper Front Page Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNews.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-5 rounded-2xl border transition ${
                    idx === 0
                      ? "md:col-span-2 bg-gradient-to-r from-amber-950/25 via-slate-900 to-slate-900 border-amber-500/40"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                        {item.category || "WORLD NEWS"}
                      </span>
                      <span className="text-cyan-400 font-semibold">
                        {item.nationName}
                      </span>
                    </div>
                    <span className="font-mono-num text-slate-400">
                      {item.date} (Q{item.quarter || 1})
                    </span>
                  </div>
                  <h4
                    className={`${
                      idx === 0 ? "text-lg" : "text-base"
                    } font-bold text-white mt-2`}
                  >
                    {item.headline}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {item.summary}
                  </p>
                  {item.impact && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono-num text-emerald-400">
                      Impact: {item.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
