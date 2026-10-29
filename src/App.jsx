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
  Scale,
  Newspaper,
  Calendar,
  Eye,
  ShieldCheck,
  Lock,
  LogOut,
} from "lucide-react";
import InteractiveWorldMap from "./components/InteractiveWorldMap";
import NationSimulatorDesk from "./components/NationSimulatorDesk";
import CompaniesRegistry from "./components/CompaniesRegistry";
import MarketsAndTechView from "./components/MarketsAndTechView";
import PoliticalPartiesAndStockView from "./components/PoliticalPartiesAndStockView";
import LedgerAndTimeView from "./components/LedgerAndTimeView";
import VictoriaStatecraftAndNewsView from "./components/VictoriaStatecraftAndNewsView";
import DirectorLoginPortal from "./components/DirectorLoginPortal";
import { formatCurrency } from "./utils/formatters";

const DIRECTOR_SECRET_KEY = "imperium-director-9942";

function detectPrivatePortalRoute() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const queryKey =
    params.get("access") || params.get("key") || params.get("portal") || params.get("director");
  const pathMatch =
    window.location.pathname.includes("director-9942") ||
    window.location.pathname.includes("director");
  return (
    queryKey === DIRECTOR_SECRET_KEY ||
    queryKey === "director" ||
    queryKey === "private" ||
    pathMatch
  );
}

export default function App() {
  const [showLoginPortal, setShowLoginPortal] = useState(() =>
    detectPrivatePortalRoute()
  );
  const [directorToken, setDirectorToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("imperium_director_2fa_token") || "";
  });
  const [isDirector, setIsDirector] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const isReadOnly = !isDirector;
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [customStartDateInput, setCustomStartDateInput] = useState("1836-01-01");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Verify saved 2FA session token on load
  useEffect(() => {
    if (!directorToken) {
      setIsDirector(false);
      setAuthChecking(false);
      return;
    }
    fetch(`/api/auth/status?token=${encodeURIComponent(directorToken)}`, {
      headers: { "X-Director-Key": directorToken },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setIsDirector(true);
          setShowLoginPortal(false);
          if (data.username) setActorName(data.username);
        } else {
          localStorage.removeItem("imperium_director_2fa_token");
          setDirectorToken("");
          setIsDirector(false);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, [directorToken]);

  const handleDirectorLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Director-Key": directorToken,
        },
      });
    } catch {
      // ignore
    }
    localStorage.removeItem("imperium_director_2fa_token");
    setDirectorToken("");
    setIsDirector(false);
    setShowLoginPortal(detectPrivatePortalRoute());
    showToast("Logged out of Private Director Portal.");
  };

  const getMutationHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      ...(isDirector && directorToken
        ? { "X-Director-Key": directorToken }
        : {}),
    };
  }, [isDirector, directorToken]);

  const guardReadOnly = useCallback(() => {
    if (isReadOnly) {
      showToast("Public Spectator Mode (View-Only): Editing is disabled on the public link.");
      return true;
    }
    return false;
  }, [isReadOnly, showToast]);

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
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/time`, {
      method: "POST",
      headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/territories`, {
      method: "POST",
      headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}`,
      {
        method: "PATCH",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/nations`, {
      method: "POST",
      headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}`,
      {
        method: "DELETE",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies`,
      {
        method: "POST",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies/${companyId}`,
      {
        method: "PATCH",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/companies/${companyId}`,
      {
        method: "DELETE",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/nations/${nationId}/market`,
      {
        method: "PATCH",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/companion`, {
      method: "PATCH",
      headers: getMutationHeaders(),
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleSaveParty = async (partyData) => {
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/parties`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ ...partyData, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleCreateStockAccount = async (payload) => {
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/stock-accounts`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
    }
  };

  const handleExecuteTrade = async (accountId, payload) => {
    if (guardReadOnly()) return;
    const res = await fetch(
      `/api/sessions/${activeSessionId}/stock-accounts/${accountId}/trade`,
      {
        method: "POST",
        headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/reset`, {
      method: "POST",
      headers: getMutationHeaders(),
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
    if (guardReadOnly()) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchSessionsList();
      setActiveSessionId(data.session.id);
    }
  };

  const handleVictoriaAction = async (payload) => {
    if (guardReadOnly()) return;
    const res = await fetch(`/api/sessions/${activeSessionId}/victoria`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ ...payload, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.toastMessage) {
        showToast(data.toastMessage);
      }
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
  const latestNews = state.newsFeed?.[0];
  const dilemmaCount = state.activeDilemmas?.length || 0;

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
                  {isReadOnly ? (
                    <span className="text-[10px] font-mono-num uppercase px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" /> Public Spectator View (Read-Only)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono-num uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Private Director Link (Full Edit Access)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Custom Start Date, Pops & Interest Groups, Laws, Dynamic Elections & Global Gazette
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

          {/* Right World Clock, Custom Start Date Picker, Quick Quarter Advance & Multiplayer Callsign */}
          <div className="flex flex-wrap items-center gap-3 text-xs relative">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 flex items-center gap-3">
              <div
                onClick={() => {
                  if (isReadOnly) return;
                  setCustomStartDateInput(tm.crisisStartDate || "1836-01-01");
                  setShowStartDatePicker(!showStartDatePicker);
                }}
                className={isReadOnly ? "" : "cursor-pointer group"}
                title={
                  isReadOnly
                    ? "Current World Date"
                    : "Click to set your custom campaign start date"
                }
              >
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                  <Calendar className="w-3 h-3" />{" "}
                  {isReadOnly ? "World Date" : "World Date (Set Start)"}
                </span>
                <span className="font-mono-num font-bold text-white group-hover:text-amber-300 transition">
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

            {/* Custom Start Date Popover (Private Director Only) */}
            {!isReadOnly && showStartDatePicker && (
              <div className="absolute top-14 left-0 z-50 w-80 bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-300">
                    Set Custom Campaign Start Date
                  </span>
                  <button
                    onClick={() => setShowStartDatePicker(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Anchor the simulation clock, quarterly settlements, and national election schedules to any historical or future date:
                </p>
                <input
                  type="date"
                  value={customStartDateInput}
                  onChange={(e) => setCustomStartDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono-num text-white"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "1836 Victorian", date: "1836-01-01" },
                    { label: "1914 Great War", date: "1914-01-01" },
                    { label: "1977 Cold War", date: "1977-01-01" },
                    { label: "2026 Modern", date: "2026-01-01" },
                    { label: "2150 Interstellar", date: "2150-01-01" },
                  ].map((preset) => (
                    <button
                      key={preset.date}
                      type="button"
                      onClick={() => setCustomStartDateInput(preset.date)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[10px] font-mono-num cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    handleTimeAction({
                      command: "SET_START_DATE",
                      startDate: customStartDateInput,
                      resetCurrentDate: true,
                    });
                    setShowStartDatePicker(false);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Apply Start Date ({customStartDateInput})
                </button>
              </div>
            )}

            {!isReadOnly && (
              <>
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
              </>
            )}

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono-num text-slate-300">
                {onlineCount} Online
              </span>
              {!isReadOnly && (
                <input
                  type="text"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-cyan-300"
                  title="Your Callsign"
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-[1650px] mx-auto mt-3 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "map",
                label: "Interactive World Map",
                icon: Globe2,
              },
              {
                id: "victoria",
                label: "Laws, Dynamic Elections & Gazette",
                icon: Scale,
                badge: dilemmaCount,
              },
              {
                id: "desk",
                label: `Cabinet & Fiscal (${currentNationName})`,
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
                  {tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                      {tab.badge}
                    </span>
                  )}
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

        {/* Live Breaking World Gazette Ticker */}
        {latestNews && (
          <div
            onClick={() => setActiveTab("victoria")}
            className="max-w-[1650px] mx-auto mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs cursor-pointer transition"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] uppercase flex items-center gap-1 shrink-0">
                <Newspaper className="w-3 h-3" /> {latestNews.category || "GAZETTE"}
              </span>
              <span className="font-mono-num text-amber-300 text-[11px] shrink-0">
                [{latestNews.date}]
              </span>
              <span className="font-bold text-white truncate">
                {latestNews.headline}
              </span>
              <span className="text-slate-400 hidden xl:inline truncate">
                — {latestNews.summary}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-300 shrink-0">
              {dilemmaCount > 0
                ? `${dilemmaCount} Policy Dispatch Pending →`
                : "Read Full Gazette →"}
            </span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-[1650px] w-full mx-auto px-4 lg:px-8 py-6 ${
          isReadOnly ? "read-only-spectator" : ""
        }`}
      >
        {activeTab === "map" && (
          <InteractiveWorldMap
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onUpdateNation={handleUpdateNation}
            onTransferTerritory={handleTransferTerritory}
            onCreateNation={handleCreateNation}
            onJumpToTab={setActiveTab}
            onVictoriaAction={handleVictoriaAction}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === "victoria" && (
          <VictoriaStatecraftAndNewsView
            state={state}
            selectedNationId={selectedNationId}
            onSelectNation={setSelectedNationId}
            onVictoriaAction={handleVictoriaAction}
            isReadOnly={isReadOnly}
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
