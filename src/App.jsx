import React, { useState, useEffect, useCallback } from "react";
import {
  Globe2,
  Landmark,
  Building2,
  GitBranch,
  Briefcase,
  Clock,
  FastForward,
  Play,
  Pause,
  Radio,
} from "lucide-react";
import InteractiveWorldMap from "./components/InteractiveWorldMap";
import NationSimulatorDesk from "./components/NationSimulatorDesk";
import CompaniesRegistry from "./components/CompaniesRegistry";
import MarketsAndTechView from "./components/MarketsAndTechView";
import PoliticalPartiesAndStockView from "./components/PoliticalPartiesAndStockView";
import LedgerAndTimeView from "./components/LedgerAndTimeView";
import { formatCurrency } from "./utils/formatters";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("interstellar-default");
  const [sessionData, setSessionData] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedNationId, setSelectedNationId] = useState("usa");
  const [activeTab, setActiveTab] = useState("map");
  const [onlineCount, setOnlineCount] = useState(1);
  const [actorName, setActorName] = useState("World Director");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const fetchSessionsList = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions list", e);
    }
  }, []);

  const fetchSessionDetail = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSessionData(data.session);
      setLedgerHistory(data.ledgerHistory || []);
      setActivityLog(data.activityLog || []);
      setLoading(false);

      const nations = data.session?.state?.nations || [];
      if (nations.length > 0) {
        setSelectedNationId((prev) =>
          nations.some((n) => n.id === prev) ? prev : nations[0].id
        );
      }
    } catch (e) {
      console.error("Failed to load session detail", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionsList();
  }, [fetchSessionsList]);

  useEffect(() => {
    setLoading(true);
    fetchSessionDetail(activeSessionId);

    const es = new EventSource(`/api/sessions/${activeSessionId}/stream`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "CONNECTED" || payload.type === "PRESENCE") {
          setOnlineCount(payload.onlineCount || 1);
        } else if (payload.type === "STATE_UPDATED") {
          fetchSessionDetail(activeSessionId);
          if (payload.action) {
            showToast(`${payload.actor}: ${payload.action}`);
          }
        }
      } catch {
        // ignore parse errors
      }
    };
    return () => es.close();
  }, [activeSessionId, fetchSessionDetail, showToast]);

  // API Mutation Helpers
  const handleTimeAction = async (body) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setLedgerHistory(data.ledgerHistory || []);
      setActivityLog(data.activityLog || []);
      if (data.toastMessage) {
        showToast(data.toastMessage);
      }
    }
  };

  const handleTransferTerritory = async (payload) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/territories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.nationId) {
        setSelectedNationId(data.nationId);
      }
      if (data.toastMessage) {
        showToast(data.toastMessage);
      }
    }
  };

  const handleUpdateNation = async (nationId, updates) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleCreateNation = async (nationForm) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/nations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nationForm, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.newNationId) {
        setSelectedNationId(data.newNationId);
      }
    }
  };

  const handleDeleteNation = async (nationId) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.session?.state?.nations?.[0]) {
        setSelectedNationId(data.session.state.nations[0].id);
      }
    }
  };

  const handleCreateCompany = async (nationId, compForm) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...compForm, actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleUpdateCompany = async (nationId, companyId, updates) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies/${companyId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleDeleteCompany = async (nationId, companyId) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies/${companyId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleUpdateMarket = async (nationId, payload) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/market`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleUpdateCompanion = async (payload) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/companion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleSaveParty = async (partyData) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...partyData, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleCreateStockAccount = async (payload) => {
    const res = await fetch(`/api/sessions/${activeSessionId}/stock-accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleExecuteTrade = async (accountId, payload) => {
    const res = await fetch(
      `/api/sessions/${activeSessionId}/stock-accounts/${accountId}/trade`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, actor: actorName }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    } else {
      const err = await res.json();
      alert(err.error || "Trade failed");
    }
  };

  const handleResetScenario = async () => {
    const res = await fetch(`/api/sessions/${activeSessionId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setLedgerHistory(data.ledgerHistory || []);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleCreateNewScenario = async (payload) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchSessionsList();
      setActiveSessionId(data.session.id);
    }
  };

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center animate-pulse">
            <Globe2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-sm font-display font-semibold">
            Loading Imperium World Geopolitical & Economic Simulator...
          </div>
        </div>
      </div>
    );
  }

  const state = sessionData.state;
  const tm = state.timeManager || {};
  const totalWorldGdp = (state.planetsSummary || []).reduce(
    (acc, p) => acc + (p.aggregateGdp || 0),
    0
  );
  const totalCompaniesCount = (state.nations || []).reduce(
    (acc, n) => acc + (n.companies?.length || 0),
    0
  );
  const currentNationName =
    state.nations?.find((n) => n.id === selectedNationId)?.name || "Select";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top World Simulator HUD Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Scenario Selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
                IS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold font-display tracking-tight text-white">
                    IMPERIUM WORLD SIMULATOR
                  </h1>
                  <span className="text-[10px] font-mono-num uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Geopolitics & Macroeconomics
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Interactive Planetary Borders, Supply Chains & Sovereign Statecraft
                </p>
              </div>
            </div>

            <select
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-300 cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  World: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right World Clock, Quick Quarter Advance & Multiplayer Callsign */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  World Date
                </span>
                <span className="font-mono-num font-bold text-white">
                  {tm.crisisDate}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">Era</span>
                <span className="font-mono-num font-bold text-cyan-400">
                  Q{tm.quarterNumber}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">
                  World GDP
                </span>
                <span className="font-mono-num font-bold text-emerald-400">
                  {formatCurrency(totalWorldGdp)}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                handleTimeAction({ command: tm.isLive ? "LOCK" : "LOAD" })
              }
              className={`px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                tm.isLive
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {tm.isLive ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Auto-Run
                </>
              )}
            </button>

            <button
              onClick={() => handleTimeAction({ daysToAdd: 90 })}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              Next Quarter
            </button>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono-num text-slate-300">
                {onlineCount} Online
              </span>
              <input
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-cyan-300"
                title="Your Callsign"
              />
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1650px] mx-auto mt-3 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "map",
                label: "Interactive World & Planetary Map",
                icon: Globe2,
              },
              {
                id: "desk",
                label: `Cabinet & Statecraft (${currentNationName})`,
                icon: Landmark,
              },
              {
                id: "markets",
                label: "Supply Chains & Tech Tree",
                icon: GitBranch,
              },
              {
                id: "companies",
                label: `Corporate Dynasties (${totalCompaniesCount.toLocaleString()})`,
                icon: Building2,
              },
              {
                id: "politics",
                label: "Ideologies & Global Bourse",
                icon: Briefcase,
              },
              {
                id: "ledger",
                label: "World Clock & Analytics",
                icon: Clock,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    active
                      ? "bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {toast && (
            <div className="text-[11px] px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              {toast}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1650px] w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === "map" && (
          <InteractiveWorldMap
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onUpdateNation={handleUpdateNation}
            onTransferTerritory={handleTransferTerritory}
            onCreateNation={handleCreateNation}
            onJumpToTab={setActiveTab}
          />
        )}

        {activeTab === "desk" && (
          <NationSimulatorDesk
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onUpdateNation={handleUpdateNation}
            onDeleteNation={handleDeleteNation}
            onJumpToTab={setActiveTab}
          />
        )}

        {activeTab === "companies" && (
          <CompaniesRegistry
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onCreateCompany={handleCreateCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}

        {activeTab === "markets" && (
          <MarketsAndTechView
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onUpdateMarket={handleUpdateMarket}
            onUpdateCompanion={handleUpdateCompanion}
          />
        )}

        {activeTab === "politics" && (
          <PoliticalPartiesAndStockView
            state={state}
            onSaveParty={handleSaveParty}
            onCreateStockAccount={handleCreateStockAccount}
            onExecuteTrade={handleExecuteTrade}
          />
        )}

        {activeTab === "ledger" && (
          <LedgerAndTimeView
            session={sessionData}
            ledgerHistory={ledgerHistory}
            activityLog={activityLog}
            onTimeAction={handleTimeAction}
            onResetScenario={handleResetScenario}
            onCreateNewScenario={handleCreateNewScenario}
          />
        )}
      </main>
    </div>
  );
}
