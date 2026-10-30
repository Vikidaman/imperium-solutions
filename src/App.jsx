import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import {
  Globe2,
  GitBranch,
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
  Sliders,
} from "lucide-react";
import InteractiveWorldMap from "./components/InteractiveWorldMap";
import DirectorLoginPortal from "./components/DirectorLoginPortal";

const MarketsAndTechView = lazy(() => import("./components/MarketsAndTechView"));
const LedgerAndTimeView = lazy(() => import("./components/LedgerAndTimeView"));
const VictoriaStatecraftAndNewsView = lazy(() =>
  import("./components/VictoriaStatecraftAndNewsView")
);
const DirectorConfigView = lazy(() => import("./components/DirectorConfigView"));

function detectPrivatePortalRoute() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const queryKey =
    params.get("access") || params.get("key") || params.get("portal") || params.get("director");
  const pathMatch = window.location.pathname.includes("director");
  return (
    queryKey === "director" ||
    queryKey === "true" ||
    queryKey === "private" ||
    pathMatch
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-base font-bold text-white">Simulation Module Notice</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || "Module encountered an unexpected issue."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Reload Simulator
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
  const [marketsSubTab, setMarketsSubTab] = useState("supplychain");
  const [, setOnlineCount] = useState(1);
  const [actorName, setActorName] = useState("World Director");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [customStartDateInput, setCustomStartDateInput] = useState("1836-01-01");
  const lastMutationTimeRef = useRef(0);

  const handleJumpToTab = useCallback((tabId) => {
    let resolved = tabId;
    if (resolved === "victoria") resolved = "statecraft";

    if (resolved === "companies") {
      setMarketsSubTab("corporations");
      setActiveTab("markets");
    } else if (resolved === "politics") {
      setMarketsSubTab("global");
      setActiveTab("markets");
    } else if (resolved === "desk") {
      setActiveTab("map");
    } else {
      if (resolved === "markets") setMarketsSubTab("supplychain");
      setActiveTab(resolved);
    }
  }, []);

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
          // Skip redundant full-state refetch if we just mutated locally within 1200ms
          if (Date.now() - lastMutationTimeRef.current > 1200) {
            fetchSessionDetail(activeSessionId);
          }
          if (payload.action) {
            showToast(`${payload.actor}: ${payload.action}`);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    // Resilient fallback polling for multiplayer spectators when SSE is quiet
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        if (Date.now() - lastMutationTimeRef.current > 3000) {
          fetchSessionDetail(activeSessionId);
        }
      }
    }, 4500);

    return () => {
      es.close();
      clearInterval(pollInterval);
    };
  }, [activeSessionId, fetchSessionDetail, showToast]);

  // API Mutation Helpers
  const handleTimeAction = async (body) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
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

  // Auto-Clock simulation ticker for Serverless / Cloudflare Pages execution
  useEffect(() => {
    const isLive = sessionData?.state?.timeManager?.isLive;
    if (!isLive || isReadOnly) return;

    let inFlight = false;
    const interval = setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await handleTimeAction({ daysToAdd: 3 });
      } catch (err) {
        console.error("Auto tick error:", err);
      } finally {
        inFlight = false;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [sessionData?.state?.timeManager?.isLive, isReadOnly, activeSessionId]);

  const handleTransferTerritory = async (payload) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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
    lastMutationTimeRef.current = Date.now();
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

  const handleAiShock = async ({ prompt, selectedStateName, shockResult }) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
    const res = await fetch(`/api/sessions/${activeSessionId}/ai-shock`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ prompt, selectedStateName, shockResult, actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.toastMessage) {
        showToast(data.toastMessage);
      }
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to execute crisis shock.");
    }
  };

  const handleRestoreShock = async () => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
    const res = await fetch(`/api/sessions/${activeSessionId}/restore-shock`, {
      method: "POST",
      headers: getMutationHeaders(),
      body: JSON.stringify({ actor: actorName }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessionData(data.session);
      setActivityLog(data.activityLog || []);
      if (data.toastMessage) {
        showToast(data.toastMessage);
      }
      return data;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to restore infrastructure.");
    }
  };

  const handleUpdateDirectorConfig = async (payload) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
    const res = await fetch(`/api/sessions/${activeSessionId}/director-config`, {
      method: "PATCH",
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

  const handleRollbackSession = async (targetQuarter, targetId) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();
    try {
      const res = await fetch(`/api/sessions/${activeSessionId}/rollback`, {
        method: "POST",
        headers: getMutationHeaders(),
        body: JSON.stringify({ targetQuarter, targetId, actor: actorName }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionData(data.session);
        setLedgerHistory(data.ledgerHistory || []);
        setActivityLog(data.activityLog || []);
        showToast(
          `Simulation rolled back to Quarter ${data.session?.state?.timeManager?.quarter || targetQuarter} (${data.session?.state?.timeManager?.crisisDate || ""})`
        );
      } else {
        const err = await res.json();
        showToast(`Rollback failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      showToast(`Rollback error: ${e.message}`);
    }
  };

  if (!authChecking && showLoginPortal && !isDirector) {
    return (
      <DirectorLoginPortal
        onAuthenticated={({ token, username }) => {
          localStorage.setItem("imperium_director_2fa_token", token);
          setDirectorToken(token);
          setIsDirector(true);
          setShowLoginPortal(false);
          if (username) setActorName(username);
          showToast(`Welcome, Director ${username || ""}! Full edit privileges unlocked.`);
        }}
        onSwitchToPublicView={() => {
          setShowLoginPortal(false);
        }}
      />
    );
  }

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
  const latestNews = state.newsFeed?.[0];
  const dilemmaCount = state.activeDilemmas?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sleek Single-Row Top HUD Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Clean Brand Title Only */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20">
              IS
            </div>
            <h1 className="text-base font-bold font-display tracking-tight text-white">
              Imperium World Simulator
            </h1>
          </div>

          {/* Center: Consolidated Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "map",
                label: "World Map & Cabinet",
                icon: Globe2,
              },
              {
                id: "statecraft",
                label: "Politics, Laws & Gazette",
                icon: Scale,
                badge: dilemmaCount,
              },
              {
                id: "director",
                label: "Director & Planetary Controls",
                icon: Sliders,
              },
              {
                id: "markets",
                label: "Economy, Tech & Corporations",
                icon: GitBranch,
              },
              {
                id: "ledger",
                label: "World Ledger & History",
                icon: Clock,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleJumpToTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
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

          {/* Right: Compact World Date, Time Controls & Director Lock */}
          <div className="flex flex-wrap items-center gap-2 text-xs relative">
            {toast && (
              <div className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                {toast}
              </div>
            )}

            <div
              onClick={() => {
                if (isReadOnly) return;
                setCustomStartDateInput(tm.crisisStartDate || "1836-01-01");
                setShowStartDatePicker(!showStartDatePicker);
              }}
              className={`bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 ${
                isReadOnly ? "" : "cursor-pointer hover:border-amber-500/40 transition"
              }`}
              title={
                isReadOnly
                  ? "Current World Date"
                  : "Click to set custom campaign start date"
              }
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono-num font-bold text-white">
                {tm.crisisDate}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono-num font-bold text-cyan-400">
                Q{tm.quarterNumber}
              </span>
            </div>

            {/* Custom Start Date Popover (Private Director Only) */}
            {!isReadOnly && showStartDatePicker && (
              <div className="absolute top-12 right-0 z-50 w-80 bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3">
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
                    { label: "500 BC Classical", date: "-0500-01-01" },
                    { label: "117 AD Roman Peak", date: "0117-01-01" },
                    { label: "1000 AD Medieval", date: "1000-01-01" },
                    { label: "1776 Revolution", date: "1776-07-04" },
                    { label: "1836 Industrial", date: "1836-01-01" },
                    { label: "1939 World War II", date: "1939-09-01" },
                    { label: "2015 Modern", date: "2015-01-01" },
                    { label: "2026 Present", date: "2026-01-01" },
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
                    handleUpdateDirectorConfig({
                      actionType: "APPLY_HISTORICAL_ERA",
                      historicalDate: customStartDateInput,
                    });
                    handleTimeAction({
                      command: "SET_START_DATE",
                      startDate: customStartDateInput,
                      resetCurrentDate: true,
                    });
                    setShowStartDatePicker(false);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Apply Start Date & Internal Borders ({customStartDateInput})
                </button>
              </div>
            )}

            {!isReadOnly && (
              <>
                <button
                  onClick={() =>
                    handleTimeAction({ command: tm.isLive ? "LOCK" : "LOAD" })
                  }
                  className={`px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer ${
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
                      <Play className="w-3.5 h-3.5" /> Auto
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleTimeAction({ daysToAdd: 90 })}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1 shadow-sm shadow-cyan-500/20 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  +1Q
                </button>
              </>
            )}

            {isReadOnly ? (
              <button
                type="button"
                onClick={() => setShowLoginPortal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1.5 cursor-pointer transition"
                title="Director Login (Telegram 2FA)"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-semibold">Spectator</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDirectorLogout}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 border border-emerald-500/30 hover:border-rose-500/40 flex items-center gap-1.5 cursor-pointer transition"
                title="Lock Private Director Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">Director</span>
                <LogOut className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Live Breaking World Gazette Ticker */}
        {latestNews && (
          <div
            onClick={() => handleJumpToTab("victoria")}
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
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="py-20 text-center text-xs text-slate-400 font-mono-num">
                Loading module...
              </div>
            }
          >
            {activeTab === "map" && (
              <InteractiveWorldMap
                state={state}
                selectedNationId={selectedNationId}
                onSelectNation={setSelectedNationId}
                onUpdateNation={handleUpdateNation}
                onDeleteNation={handleDeleteNation}
                onTransferTerritory={handleTransferTerritory}
                onCreateNation={handleCreateNation}
                onJumpToTab={handleJumpToTab}
                onVictoriaAction={handleVictoriaAction}
                onAiShock={handleAiShock}
                onRestoreShock={handleRestoreShock}
                isReadOnly={isReadOnly}
              />
            )}

            {(activeTab === "statecraft" || activeTab === "victoria") && (
              <VictoriaStatecraftAndNewsView
                state={state}
                selectedNationId={selectedNationId}
                onSelectNation={setSelectedNationId}
                onVictoriaAction={handleVictoriaAction}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === "director" && (
              <DirectorConfigView
                state={state}
                onUpdateDirectorConfig={handleUpdateDirectorConfig}
                onSelectNation={setSelectedNationId}
                onTransferTerritory={handleTransferTerritory}
                onRollbackSession={handleRollbackSession}
                activityLog={activityLog}
                ledgerHistory={ledgerHistory}
                onTimeAction={handleTimeAction}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === "markets" && (
              <MarketsAndTechView
                state={state}
                selectedNationId={selectedNationId}
                onSelectNation={setSelectedNationId}
                onUpdateMarket={handleUpdateMarket}
                onUpdateCompanion={handleUpdateCompanion}
                onCreateCompany={handleCreateCompany}
                onUpdateCompany={handleUpdateCompany}
                onDeleteCompany={handleDeleteCompany}
                onSaveParty={handleSaveParty}
                onCreateStockAccount={handleCreateStockAccount}
                onExecuteTrade={handleExecuteTrade}
                initialSubTab={marketsSubTab}
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
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
