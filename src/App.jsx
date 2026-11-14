import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import {
  Globe2,
  GitBranch,
  Clock,
  FastForward,
  Play,
  Pause,
  Radio,
  Calendar,
  RotateCcw,
  Eye,
  ShieldCheck,
  Lock,
  LogOut,
} from "lucide-react";
import InteractiveWorldMap from "./components/InteractiveWorldMap";
import DirectorLoginPortal from "./components/DirectorLoginPortal";

const MarketsAndTechView = lazy(() => import("./components/MarketsAndTechView"));
const LedgerAndTimeView = lazy(() => import("./components/LedgerAndTimeView"));

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
  const [activeSessionId, setActiveSessionId] = useState("interstellar-default");
  const [sessionData, setSessionData] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const [marketsSubTab, setMarketsSubTab] = useState("supplychain");
  const [actorName, setActorName] = useState("Director");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const lastMutationTimeRef = useRef(0);
  const mutationInFlightRef = useRef(0);
  const stateVersionRef = useRef(0);

  const handleJumpToTab = useCallback((tabId) => {
    if (tabId === "markets") setMarketsSubTab("supplychain");
    setActiveTab(tabId);
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
      showToast("Public Spectator Mode (View-Only): Authenticate as Director to modify policies.");
      return true;
    }
    return false;
  }, [isReadOnly, showToast]);

  const fetchSessionDetail = useCallback(async (id, isBackgroundPoll = false) => {
    const fetchStartedAt = Date.now();
    try {
      const res = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      if (
        isBackgroundPoll &&
        (mutationInFlightRef.current > 0 ||
          fetchStartedAt < lastMutationTimeRef.current ||
          Date.now() - lastMutationTimeRef.current < 8000)
      ) {
        return;
      }

      const incomingVersion = Number(data.session?.state?.version) || 0;
      if (
        isBackgroundPoll &&
        incomingVersion > 0 &&
        stateVersionRef.current > 0 &&
        incomingVersion < stateVersionRef.current
      ) {
        return;
      }
      if (incomingVersion > stateVersionRef.current) {
        stateVersionRef.current = incomingVersion;
      }

      setSessionData(data.session);
      setLedgerHistory(data.ledgerHistory || []);
      setActivityLog(data.activityLog || []);
      setLoading(false);
    } catch (e) {
      console.error("Failed to load session detail", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    stateVersionRef.current = 0;
    fetchSessionDetail(activeSessionId, false);

    const es = new EventSource(`/api/sessions/${activeSessionId}/stream`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "STATE_UPDATED") {
          if (
            mutationInFlightRef.current === 0 &&
            Date.now() - lastMutationTimeRef.current > 8000
          ) {
            fetchSessionDetail(activeSessionId, true);
          }
          if (payload.action) {
            showToast(`${payload.actor}: ${payload.action}`);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        if (
          mutationInFlightRef.current === 0 &&
          Date.now() - lastMutationTimeRef.current > 8000
        ) {
          fetchSessionDetail(activeSessionId, true);
        }
      }
    }, 6000);

    return () => {
      es.close();
      clearInterval(pollInterval);
    };
  }, [activeSessionId, fetchSessionDetail, showToast]);

  const handleTimeAction = async (body) => {
    if (guardReadOnly()) return;
    lastMutationTimeRef.current = Date.now();

    if (body.command === "LOAD" || body.command === "LOCK") {
      const nextLive = body.command === "LOAD";
      setSessionData((prev) => {
        if (!prev?.state?.timeManager) return prev;
        return {
          ...prev,
          state: {
            ...prev.state,
            timeManager: {
              ...prev.state.timeManager,
              isLive: nextLive,
              liveStatus: nextLive ? "TRUE" : "FALSE",
            },
          },
        };
      });
    }

    try {
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
    } catch (err) {
      console.error("Time action error:", err);
    }
  };

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
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionData?.state?.timeManager?.isLive, isReadOnly, activeSessionId]);

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
      setActiveSessionId(data.session.id);
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
          `Simulation rolled back to Quarter ${data.session?.state?.timeManager?.quarter || targetQuarter}`
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
          showToast(`Welcome, Director ${username || ""}! Edit privileges unlocked.`);
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
            Loading United States Macroeconomic Simulator...
          </div>
        </div>
      </div>
    );
  }

  const state = sessionData.state;
  const tm = state.timeManager || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top HUD Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-[1650px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20">
              US
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight text-white">
                United States Macroeconomic Simulator
              </h1>
            </div>
          </div>

          {/* 3 Focused Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {[
              {
                id: "map",
                label: "US Map, 50 States & Cabinet",
                icon: Globe2,
              },
              {
                id: "markets",
                label: "Supply Chain & Tech",
                icon: GitBranch,
              },
              {
                id: "ledger",
                label: "Ledger & History",
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
                </button>
              );
            })}
          </nav>

          {/* Right: Simulation Date, Time Controls & Director Lock */}
          <div className="flex flex-wrap items-center gap-2 text-xs relative">
            {toast && (
              <div className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                {toast}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono-num font-bold text-white">
                {tm.crisisDate}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono-num font-bold text-cyan-400">
                Q{tm.quarterNumber}
              </span>
            </div>

            {!isReadOnly && (
              <>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset the United States simulation to start date (2025-01-01, Q1) and baseline conditions?"
                      )
                    ) {
                      handleResetScenario();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset simulation to initial start date (2025-01-01, Q1) and baseline conditions"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Baseline
                </button>

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
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1.5 cursor-pointer transition"
                title="Read-only Spectator view — Click to sign in as Director"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-semibold">Spectator View</span>
                <Lock className="w-3 h-3 text-slate-500" />
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
                onUpdateNation={handleUpdateNation}
                onResetScenario={handleResetScenario}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === "markets" && (
              <MarketsAndTechView
                state={state}
                onUpdateMarket={handleUpdateMarket}
                onUpdateCompanion={handleUpdateCompanion}
                initialSubTab={marketsSubTab}
                isReadOnly={isReadOnly}
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
                onRollbackSession={handleRollbackSession}
                isReadOnly={isReadOnly}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
