import React, { useState } from "react";
import {
  Globe2,
  Rocket,
  ShieldCheck,
  Flag,
  PlusCircle,
  Trash2,
  Sliders,
  Users,
  Compass,
  ArrowRight,
  ArrowRightLeft,
  Landmark,
  Scale,
  Sparkles,
  Building,
  CheckCircle2,
  Percent,
  History,
  Star,
  Calendar,
  Activity,
  RotateCcw,
  AlertTriangle,
  Play,
  Pause,
  FastForward,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { HISTORICAL_ERAS, getHistoricalEraForDate } from "../data/historicalEras";
import { formatCurrency, formatCompactNumber } from "../utils/formatters";

export default function DirectorConfigView({
  state,
  onUpdateDirectorConfig,
  onSelectNation,
  onTransferTerritory,
  onRollbackSession,
  activityLog = [],
  ledgerHistory = [],
  onTimeAction,
  isReadOnly,
}) {
  const [activeSubTab, setActiveSubTab] = useState("planets"); // "planets" | "powerblocs" | "historical_borders" | "operations"
  const [editingBloc, setEditingBloc] = useState(null);
  const [editingPlanet, setEditingPlanet] = useState(null);
  const [selectedEraId, setSelectedEraId] = useState(state.currentEraId || "era_2015");
  const [customYearInput, setCustomYearInput] = useState(2015);
  const [inspectedNationId, setInspectedNationId] = useState(state.nations?.[0]?.id || "usa");
  const [transferModalTerritory, setTransferModalTerritory] = useState(null);
  const [transferTargetNationId, setTransferTargetNationId] = useState("");

  const nations = state.nations || [];
  const powerBlocs = state.powerBlocs || [];
  const planetsConfig = state.planetsConfig || [];
  const planetsSummary = state.planetsSummary || [];
  const territoryMap = state.territoryMap || {};

  const handleSaveBloc = (e) => {
    e.preventDefault();
    if (!editingBloc?.name) return;
    onUpdateDirectorConfig({
      actionType: "SAVE_BLOC",
      blocData: editingBloc,
    });
    setEditingBloc(null);
  };

  const handleDeleteBloc = (blocId) => {
    if (window.confirm("Disband this Power Bloc?")) {
      onUpdateDirectorConfig({
        actionType: "DELETE_BLOC",
        blocData: { id: blocId },
      });
    }
  };

  const handleSavePlanet = (e) => {
    e.preventDefault();
    if (!editingPlanet?.name) return;
    onUpdateDirectorConfig({
      actionType: "SAVE_PLANET",
      planetData: editingPlanet,
    });
    setEditingPlanet(null);
  };

  const handleDeletePlanet = (planetId, planetName) => {
    if (
      window.confirm(
        `Disband and delete planetary system "${planetName}"?\n\nMember nations and colonies will be repatriated.`
      )
    ) {
      onUpdateDirectorConfig({
        actionType: "DELETE_PLANET",
        planetId,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Nav */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab("planets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "planets"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Rocket className="w-4 h-4" />
            Planetary Systems & Orbital Transit ({planetsConfig.length})
          </button>

          <button
            onClick={() => setActiveSubTab("powerblocs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "powerblocs"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Power Blocs & Federal Diplomacy ({powerBlocs.length})
          </button>

          <button
            onClick={() => setActiveSubTab("historical_borders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "historical_borders"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            Historical Eras & Internal Borders (500 BC – Present)
          </button>

          <button
            onClick={() => setActiveSubTab("operations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === "operations"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Operations & Snapshot Rollback ({ledgerHistory?.length || 0})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono-num flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Director Supreme Jurisdiction Active
        </div>
      </div>

      {/* SUBTAB 1: PLANETS & INTERPLANETARY INTERACTION */}
      {activeSubTab === "planets" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                Interplanetary Federations & Orbital Physics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure planetary colonization, orbital transfer freight tariffs, and federal resource redistribution.
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() =>
                  setEditingPlanet({
                    id: `planet_${Date.now().toString(36)}`,
                    name: "New Colony",
                    description: "Colonial settlement or deep orbital habitat.",
                    freightTariffRate: 0.1,
                    transitDays: 45,
                    habitability: 0.5,
                    independenceDesire: 15,
                  })
                }
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Add Planetary Colony
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {planetsConfig.map((planet) => {
              const summary = planetsSummary.find(
                (p) => p.name?.toLowerCase() === planet.name?.toLowerCase()
              );
              const planetNations = nations.filter(
                (n) => n.planet?.toLowerCase() === planet.name?.toLowerCase()
              );

              return (
                <div
                  key={planet.id || planet.name}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-cyan-500/40 transition shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono-num uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Orbit: {planet.transitDays} Days Transit
                        </span>
                        <h4 className="text-lg font-bold font-display text-white mt-1">
                          {planet.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono-num font-bold text-amber-300">
                        Habitability: {Math.round((planet.habitability || 1) * 100)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {planet.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Member Nations</span>
                        <span className="font-mono-num font-bold text-white text-sm">
                          {planetNations.length} States
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Orbital Tariff</span>
                        <span className="font-mono-num font-bold text-cyan-300 text-sm">
                          {Math.round((planet.freightTariffRate || 0.05) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Independence Desire</span>
                        <span className="font-mono-num font-bold text-rose-400 text-sm">
                          {planet.independenceDesire || 0}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Federal Balance</span>
                        <span className="font-mono-num font-bold text-emerald-400 text-sm">
                          ${((summary?.aggregateGdp || 0) / 1e12).toFixed(1)}T
                        </span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Sovereign Colonies on {planet.name}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {planetNations.length > 0 ? (
                          planetNations.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => onSelectNation(n.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] cursor-pointer"
                            >
                              {n.name}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">No nations settled yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDeletePlanet(planet.id || planet.name, planet.name)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                        title={`Delete ${planet.name} planetary system`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete System
                      </button>

                      <button
                        onClick={() => setEditingPlanet({ ...planet })}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Configure Physics & Tariffs
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Edit Planet Modal */}
          {editingPlanet && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleSavePlanet}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    Configure Planetary World: {editingPlanet.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingPlanet(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Planet Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlanet.name}
                    onChange={(e) => setEditingPlanet({ ...editingPlanet, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingPlanet.description}
                    onChange={(e) => setEditingPlanet({ ...editingPlanet, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Orbital Transit Days ({editingPlanet.transitDays}d)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={editingPlanet.transitDays}
                      onChange={(e) => setEditingPlanet({ ...editingPlanet, transitDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Freight Tariff Rate ({Math.round(editingPlanet.freightTariffRate * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="0.5"
                      value={editingPlanet.freightTariffRate}
                      onChange={(e) => setEditingPlanet({ ...editingPlanet, freightTariffRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Habitability Multiplier ({editingPlanet.habitability})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={editingPlanet.habitability}
                      onChange={(e) => setEditingPlanet({ ...editingPlanet, habitability: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Colonial Independence Desire ({editingPlanet.independenceDesire}%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingPlanet.independenceDesire}
                      onChange={(e) => setEditingPlanet({ ...editingPlanet, independenceDesire: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingPlanet(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold cursor-pointer"
                  >
                    Save Planetary Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: POWER BLOCS & FEDERAL DIPLOMACY */}
      {activeSubTab === "powerblocs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Power Blocs, Customs Unions & Geopolitical Alliances
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Design custom multilateral pacts, configure customs unions, common defense treaties, and federal contribution rates.
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() =>
                  setEditingBloc({
                    id: `bloc_${Date.now().toString(36)}`,
                    name: "New Power Bloc",
                    type: "TRADE_LEAGUE",
                    leaderNationId: nations[0]?.id || "usa",
                    memberNationIds: [nations[0]?.id || "usa"],
                    cohesion: 85,
                    customsUnion: true,
                    defensivePact: true,
                    mandate: "Common market integration and regional security pact.",
                    federalContributionRate: 0.08,
                  })
                }
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Charter New Power Bloc
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {powerBlocs.map((bloc) => {
              const leader = nations.find((n) => n.id === bloc.leaderNationId);
              const members = nations.filter((n) => bloc.memberNationIds?.includes(n.id));

              return (
                <div
                  key={bloc.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-amber-500/40 transition shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono-num uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {bloc.type.replace(/_/g, " ")}
                        </span>
                        <h4 className="text-lg font-bold font-display text-white mt-1">
                          {bloc.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono-num font-bold text-emerald-300">
                        Cohesion: {bloc.cohesion}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {bloc.mandate}
                    </p>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Bloc Leader</span>
                        <span className="font-mono-num font-bold text-cyan-300 text-sm">
                          {leader?.name || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Federal Levy</span>
                        <span className="font-mono-num font-bold text-amber-300 text-sm">
                          {Math.round((bloc.federalContributionRate || 0.08) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Customs Union</span>
                        <span className={`font-mono-num font-bold text-sm ${bloc.customsUnion ? "text-emerald-400" : "text-slate-500"}`}>
                          {bloc.customsUnion ? "Active (Zero Internal Tariff)" : "Disabled"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Defensive Treaty</span>
                        <span className={`font-mono-num font-bold text-sm ${bloc.defensivePact ? "text-emerald-400" : "text-slate-500"}`}>
                          {bloc.defensivePact ? "Mutual Defense" : "Non-Aggression"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Member States ({members.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((m) => (
                          <span
                            key={m.id}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              m.id === leader?.id
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {m.name} {m.id === leader?.id && "★"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleDeleteBloc(bloc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Disband
                      </button>
                      <button
                        onClick={() => setEditingBloc({ ...bloc })}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold cursor-pointer"
                      >
                        Configure Mandate & Members
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Edit Power Bloc Modal */}
          {editingBloc && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveBloc}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Configure Power Bloc: {editingBloc.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingBloc(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bloc Name</label>
                  <input
                    type="text"
                    required
                    value={editingBloc.name}
                    onChange={(e) => setEditingBloc({ ...editingBloc, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Bloc Archetype</label>
                    <select
                      value={editingBloc.type}
                      onChange={(e) => setEditingBloc({ ...editingBloc, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white cursor-pointer"
                    >
                      <option value="TRADE_LEAGUE">Trade League (Customs Union)</option>
                      <option value="MILITARY_PACT">Military Treaty Alliance</option>
                      <option value="SOVEREIGN_EMPIRE">Sovereign Empire (Hegemony)</option>
                      <option value="IDEOLOGICAL_UNION">Ideological Union (Clout Alignment)</option>
                      <option value="FEDERAL_COMMONWEALTH">Federal Commonwealth</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Leading Superpower</label>
                    <select
                      value={editingBloc.leaderNationId}
                      onChange={(e) => setEditingBloc({ ...editingBloc, leaderNationId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white cursor-pointer"
                    >
                      {nations.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.planet})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bloc Mandate & Doctrine</label>
                  <textarea
                    rows={2}
                    value={editingBloc.mandate}
                    onChange={(e) => setEditingBloc({ ...editingBloc, mandate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cohesion Score ({editingBloc.cohesion}%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={editingBloc.cohesion}
                      onChange={(e) => setEditingBloc({ ...editingBloc, cohesion: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Federal Contribution Rate ({Math.round(editingBloc.federalContributionRate * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.25"
                      value={editingBloc.federalContributionRate}
                      onChange={(e) => setEditingBloc({ ...editingBloc, federalContributionRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-num"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(editingBloc.customsUnion)}
                      onChange={(e) => setEditingBloc({ ...editingBloc, customsUnion: e.target.checked })}
                      className="accent-amber-400"
                    />
                    Customs Union (0% Internal Tariffs)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(editingBloc.defensivePact)}
                      onChange={(e) => setEditingBloc({ ...editingBloc, defensivePact: e.target.checked })}
                      className="accent-amber-400"
                    />
                    Mutual Defensive Pact
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Select Member Nations
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {nations.map((n) => {
                      const isMember = editingBloc.memberNationIds?.includes(n.id);
                      return (
                        <label
                          key={n.id}
                          className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition ${
                            isMember ? "bg-amber-500/20 text-amber-200 font-bold" : "text-slate-400 hover:bg-slate-900"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isMember}
                            onChange={(e) => {
                              const curr = new Set(editingBloc.memberNationIds || []);
                              if (e.target.checked) curr.add(n.id);
                              else curr.delete(n.id);
                              setEditingBloc({ ...editingBloc, memberNationIds: Array.from(curr) });
                            }}
                            className="accent-amber-400"
                          />
                          <span className="truncate">{n.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingBloc(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold cursor-pointer"
                  >
                    Save Power Bloc
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: HISTORICAL ERAS, BORDERS & INTERNAL DIVISIONS (500 BC to Present) */}
      {activeSubTab === "historical_borders" && (() => {
        const selectedEra = HISTORICAL_ERAS.find((e) => e.id === selectedEraId) || HISTORICAL_ERAS[6];
        const activeNationObj = nations.find((n) => n.id === inspectedNationId) || nations[0];
        const isUnitary = activeNationObj?.isSeceded || activeNationObj?.isUnitaryState;

        const currentStates = activeNationObj?.constituentStates || [];
        const currentTerritories = activeNationObj?.unincorporatedTerritories || [];

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  Historical Eras & Constituent Border Configuration (500 BC – Present)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revamp world sovereign borders and internal constituent state divisions across historical epochs.
                  Seceded states become unitary sovereign states with no sub-provinces; newly annexed lands enter as unincorporated territories first.
                </p>
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Apply ${selectedEra.label} to the world simulation?\n\nThis will align all sovereign borders, territory ownership, and internal state divisions to ${selectedEra.shortLabel}.`
                      )
                    ) {
                      onUpdateDirectorConfig({
                        actionType: "APPLY_HISTORICAL_ERA",
                        eraId: selectedEra.id,
                      });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply {selectedEra.shortLabel} Borders to World
                </button>
              )}
            </div>

            {/* Historical Era Carousel / Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {HISTORICAL_ERAS.map((era) => {
                const isSelected = era.id === selectedEra.id;
                return (
                  <div
                    key={era.id}
                    onClick={() => {
                      setSelectedEraId(era.id);
                      setCustomYearInput(era.year);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition text-left space-y-1.5 flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-num font-bold text-emerald-400">
                          {era.year < 0 ? `${Math.abs(era.year)} BC` : `${era.year} AD`}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <h4 className="text-xs font-bold mt-1 line-clamp-1">{era.shortLabel}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {era.label.split("—")[1]?.trim() || era.label}
                      </p>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono-num pt-1 border-t border-slate-900">
                      {era.nations.length} Primary Empires
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Era / Date Slider */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-300 whitespace-nowrap">
                  Interpolate Year (-500 to 2026):
                </span>
                <input
                  type="range"
                  min="-500"
                  max="2026"
                  step="25"
                  value={customYearInput}
                  onChange={(e) => {
                    const yr = parseInt(e.target.value, 10);
                    setCustomYearInput(yr);
                    const matched = getHistoricalEraForDate(yr);
                    if (matched) setSelectedEraId(matched.id);
                  }}
                  className="flex-1 accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono-num font-bold text-emerald-300 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                  {customYearInput < 0 ? `${Math.abs(customYearInput)} BC` : `${customYearInput} AD`}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Resolved Era: <strong className="text-white">{selectedEra.label}</strong>
              </div>
            </div>

            {/* Era Overview Banner */}
            <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono-num">
                  Selected Era Overview
                </span>
                <h4 className="text-sm font-bold text-white">{selectedEra.label}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedEra.description}</p>
            </div>

            {/* Internal State Divisions & Sovereignty Inspector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-cyan-400" />
                    Country Constituent Divisions & Territorial Statehood
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure individual states and unincorporated territories for each country.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Inspect Country:</span>
                  <select
                    value={activeNationObj?.id || ""}
                    onChange={(e) => setInspectedNationId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  >
                    {nations.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.planet || "Earth"}) {n.isSeceded ? "• Unitary State" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unitary State Notice (Seceded Nations) */}
              {isUnitary ? (
                <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto font-bold text-sm">
                    ★
                  </div>
                  <h4 className="text-sm font-bold text-white">Unitary Sovereign State</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    <strong className="text-cyan-300">{activeNationObj.name}</strong> is an independent constituent state that seceded from its former sovereign. In accordance with statecraft rules, it is a unitary sovereign entity and contains no further sub-provinces or internal subdivisions.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Category 1: Constituent States (Full Statehood) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Constituent States ({currentStates.length})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Full statehood with legislative representation
                      </span>
                    </div>

                    {currentStates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentStates.map((st, idx) => (
                          <div
                            key={st.name || idx}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  <span className="text-xs font-bold text-white">{st.name}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">{st.role}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold">
                                STATE
                              </span>
                            </div>

                            {!isReadOnly && onTransferTerritory && (
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                                <button
                                  onClick={() => {
                                    setTransferModalTerritory({ name: st.name, currentNation: activeNationObj });
                                    setTransferTargetNationId("");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                  title="Transfer this state to another country (enters as territory first)"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Release ${st.name} as a sovereign unitary state?\n\nIt will have NO sub-provinces since it is a constituent state itself.`
                                      )
                                    ) {
                                      onTransferTerritory({
                                        territoryName: st.name,
                                        mode: "RELEASE",
                                        planet: activeNationObj.planet || "Earth",
                                      });
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                  title="Secede and proclaim independence as a unitary state"
                                >
                                  Secede
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                        No constituent states currently cataloged.
                      </div>
                    )}
                  </div>

                  {/* Category 2: Unincorporated Territories & Dependencies */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Unincorporated Territories ({currentTerritories.length})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Annexed dependencies awaiting formal statehood integration
                      </span>
                    </div>

                    {currentTerritories.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentTerritories.map((tr, idx) => (
                          <div
                            key={tr.name || idx}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span className="text-xs font-bold text-white">{tr.name}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">{tr.role}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                TERRITORY
                              </span>
                            </div>

                            {!isReadOnly && onTransferTerritory && (
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                                <button
                                  onClick={() =>
                                    onTransferTerritory({
                                      territoryName: tr.name,
                                      targetNationId: activeNationObj.id,
                                      mode: "INTEGRATE",
                                      planet: activeNationObj.planet || "Earth",
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Elevate this territory into full Constituent Statehood"
                                >
                                  <Star className="w-3 h-3 text-emerald-400" /> Integrate as State
                                </button>
                                <button
                                  onClick={() =>
                                    onTransferTerritory({
                                      territoryName: tr.name,
                                      mode: "RELEASE",
                                      planet: activeNationObj.planet || "Earth",
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-semibold cursor-pointer"
                                  title="Release territory as an independent state"
                                >
                                  Release
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                        No unincorporated territories. Any newly annexed territories will appear here first before being granted statehood.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* In-Tab Transfer Territory Modal */}
            {transferModalTerritory && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Transfer Territorial Jurisdiction</h4>
                        <p className="text-[11px] text-slate-400">
                          Transfer <span className="text-amber-300 font-bold">{transferModalTerritory.name}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTransferModalTerritory(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                    <p>
                      In accordance with Imperium statehood rules, transferred territories enter the recipient country as an <strong className="text-amber-300">Unincorporated Territory</strong> first, before they can be integrated into statehood.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">
                      Recipient Sovereign Nation:
                    </label>
                    <select
                      value={transferTargetNationId}
                      onChange={(e) => setTransferTargetNationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="">-- Choose Recipient Nation --</option>
                      {nations
                        .filter((n) => n.id !== transferModalTerritory.currentNation?.id)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} ({n.planet || "Earth"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setTransferModalTerritory(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!transferTargetNationId}
                      onClick={() => {
                        if (!transferTargetNationId || !onTransferTerritory) return;
                        onTransferTerritory({
                          territoryName: transferModalTerritory.name,
                          targetNationId: transferTargetNationId,
                          mode: "ANNEX",
                          planet: transferModalTerritory.currentNation?.planet || "Earth",
                        });
                        setTransferModalTerritory(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold cursor-pointer"
                    >
                      Confirm Transfer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* SUBTAB 4: LIVE OPERATIONS, DECISION AUDIT LOG & SNAPSHOT ROLLBACK */}
      {activeSubTab === "operations" && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Live Event Operations & Controlled Rollback
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor participant activity in real-time, execute deterministic quarter progressions, and safely rollback simulation state if an interruption occurs.
                </p>
              </div>

              {/* Time advancement buttons */}
              {onTimeAction && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isReadOnly}
                    onClick={() => onTimeAction({ command: "ADVANCE_DAYS", daysToAdd: 30 })}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    +30 Days
                  </button>
                  <button
                    disabled={isReadOnly}
                    onClick={() => onTimeAction({ command: "ADVANCE_QUARTER", daysToAdd: 90 })}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Advance Quarter (+90 Days)
                  </button>
                  <button
                    disabled={isReadOnly}
                    onClick={() =>
                      onTimeAction({
                        command: state.timeManager?.isLive ? "LOCK" : "LOAD",
                      })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                      state.timeManager?.isLive
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    }`}
                  >
                    {state.timeManager?.isLive ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause Timer
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Start Timer
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Current Simulation Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Crisis Date</span>
                <span className="text-sm font-bold text-cyan-300 font-mono-num">{state.timeManager?.crisisDate || "N/A"}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Quarter</span>
                <span className="text-sm font-bold text-purple-300 font-mono-num">Quarter {state.timeManager?.quarter ?? 1}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Timer Mode</span>
                <span className={`text-sm font-bold font-mono-num ${state.timeManager?.isLive ? "text-emerald-400" : "text-amber-400"}`}>
                  {state.timeManager?.isLive ? "RUNNING (60s tick)" : "PAUSED"}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Nations</span>
                <span className="text-sm font-bold text-white font-mono-num">{nations.length} Sovereignties</span>
              </div>
            </div>
          </div>

          {/* Participant Readiness & Macro Health Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Participant Readiness & Sovereign Stability Checklist
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Nation / Bloc</th>
                    <th className="pb-2.5 font-semibold">Sovereign Treasury</th>
                    <th className="pb-2.5 font-semibold">Sol Index</th>
                    <th className="pb-2.5 font-semibold">Unemployment</th>
                    <th className="pb-2.5 font-semibold">Construction</th>
                    <th className="pb-2.5 font-semibold">Legitimacy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {nations.map((n) => {
                    const c = n.computed || {};
                    const isDeficit = (n.cashTreasury || 0) < 0;
                    return (
                      <tr key={n.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          {n.name}
                        </td>
                        <td className="py-2.5 font-mono-num font-semibold">
                          <span className={isDeficit ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {formatCurrency(n.cashTreasury || 0)}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono-num text-cyan-300">
                          {(c.sol || 15).toFixed(1)}
                        </td>
                        <td className="py-2.5 font-mono-num text-amber-300">
                          {((c.unemploymentRate || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-slate-400">
                          {(n.constructionQueue || []).length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                              {(n.constructionQueue || []).length} active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Idle</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono-num text-purple-300">
                          {n.legitimacy ?? 75}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rollback Console */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Historical Snapshot Rollback Console
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every quarter progression creates an immutable database snapshot. Restoring a prior quarter will revert national balances, legislation, and territory to that point.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono-num bg-slate-800/80 px-2.5 py-1 rounded-lg">
                {ledgerHistory.length} Snapshots Stored
              </span>
            </div>

            {ledgerHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No prior snapshots saved yet. Snapshots are automatically recorded as quarters advance.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ledgerHistory.map((snap) => (
                  <div
                    key={snap.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">
                        Quarter {snap.quarter}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono-num">{snap.crisisDate}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>World GDP:</span>
                        <span className="font-mono-num text-slate-200">
                          {formatCurrency(snap.snapshot?.globalStats?.totalGdp || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Population:</span>
                        <span className="font-mono-num text-slate-200">
                          {formatCompactNumber(snap.snapshot?.globalStats?.totalPopulation || 0)}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={isReadOnly}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to rollback the simulation to Quarter ${snap.quarter} (${snap.crisisDate})? Forward timeline progress will be replaced.`
                          )
                        ) {
                          onRollbackSession && onRollbackSession(snap.quarter, snap.id);
                        }
                      }}
                      className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rollback to Q{snap.quarter}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decision Audit Log & Timeline */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              Live Decision Audit Log & Event Timeline
            </h4>
            {activityLog.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No actions logged in this session yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {activityLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.actor === "Director"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {log.actor}
                        </span>
                        <span className="font-bold text-white">{log.action}</span>
                      </div>
                      {log.details && (
                        <p className="text-slate-400 text-[11px]">{log.details}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono-num whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

