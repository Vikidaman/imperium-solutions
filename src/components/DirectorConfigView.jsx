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
} from "lucide-react";
import { HISTORICAL_ERAS, getHistoricalEraForDate } from "../data/historicalEras";
import { formatCurrency, formatCompactNumber } from "../utils/formatters";

export default function DirectorConfigView({
  state,
  onUpdateDirectorConfig,
  onSelectNation,
  onTransferTerritory,
  isReadOnly,
}) {
  const [activeSubTab, setActiveSubTab] = useState("planets"); // "planets" | "powerblocs" | "historical_borders"
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
    </div>
  );
}

