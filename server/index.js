import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDefaultSessions,
  listSessions,
  getSession,
  saveSessionState,
  createSession,
  resetSessionToSeed,
  recordLedgerSnapshot,
  getLedgerHistory,
  logActivity,
  getActivityLog,
  getAuthValue,
  setAuthValue,
} from "./db.js";
import {
  evaluateSimulation,
  advanceSimulationTime,
  runBudgetAndDividendUpdater,
  transferTerritory,
  setCustomStartDate,
  triggerElectionAction,
  triggerLawAction,
  queueConstruction,
  resolveNewsDilemma,
  publishCustomNews,
} from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const DIRECTOR_SECRET_KEY = process.env.DIRECTOR_SECRET_KEY || "imperium-director-9942";
const DEFAULT_MASTER_PASSWORD = process.env.DIRECTOR_MASTER_PASSWORD || "imperium-2026";

function isValidDirectorSessionToken(token) {
  if (!token) return false;
  if (token === DIRECTOR_SECRET_KEY) return true;
  const activeSessions = getAuthValue("sessions", {});
  return Boolean(activeSessions[token]);
}

function maskChatId(chatId) {
  const s = String(chatId || "");
  if (s.length <= 4) return s;
  return `***${s.slice(-4)}`;
}

// --- TELEGRAM 2FA AUTHENTICATION ROUTES ---
app.get("/api/auth/status", (req, res) => {
  const cfg = getAuthValue("config", {});
  const providedToken = req.headers["x-director-key"] || req.query.token;
  const activeSessions = getAuthValue("sessions", {});
  const sessionInfo = providedToken ? activeSessions[providedToken] : null;
  res.json({
    telegramConfigured: Boolean(cfg.botToken && cfg.chatId),
    maskedChatId: cfg.chatId ? maskChatId(cfg.chatId) : null,
    authenticated: Boolean(sessionInfo),
    username: sessionInfo?.username || null,
  });
});

app.post("/api/auth/telegram-detect", async (req, res) => {
  const { botToken } = req.body || {};
  if (!botToken || !String(botToken).includes(":")) {
    return res.status(400).json({ error: "Please provide a valid Telegram Bot Token from @BotFather." });
  }
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getUpdates`);
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(400).json({ error: tgData.description || "Invalid Telegram Bot Token." });
    }
    const results = tgData.result || [];
    for (let i = results.length - 1; i >= 0; i--) {
      const msg = results[i].message || results[i].edited_message || results[i].channel_post;
      if (msg && msg.chat && msg.chat.id) {
        return res.json({
          chatId: String(msg.chat.id),
          username: msg.chat.username ? `@${msg.chat.username}` : msg.chat.first_name || "Director",
          chatTitle:
            msg.chat.title ||
            [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ") ||
            msg.chat.username ||
            "Telegram Chat",
        });
      }
    }
    return res.status(404).json({
      error: "No messages found yet! Open your bot in Telegram, send '/start', and click Auto-Detect again.",
    });
  } catch (err) {
    return res.status(500).json({ error: `Telegram API connection error: ${err.message}` });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username = "Director", password, botToken, chatId } = req.body || {};
  const cfg = getAuthValue("config", { masterPassword: DEFAULT_MASTER_PASSWORD });
  const expectedPassword = cfg.masterPassword || DEFAULT_MASTER_PASSWORD;

  if (!password || password !== expectedPassword) {
    return res.status(401).json({ error: "Invalid Director Master Password." });
  }

  if (botToken && chatId) {
    const alreadyPaired = Boolean(cfg.botToken && cfg.chatId);
    const providedToken = req.headers["x-director-key"];
    if (alreadyPaired && !isValidDirectorSessionToken(providedToken)) {
      return res.status(403).json({
        error: "Telegram 2FA pairing is locked. Unlock with an active 2FA session to change it.",
      });
    }
    cfg.botToken = String(botToken).trim();
    cfg.chatId = String(chatId).trim();
    setAuthValue("config", cfg);
  }

  const activeBotToken = cfg.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const activeChatId = cfg.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!activeBotToken || !activeChatId) {
    return res.status(400).json({
      needsTelegramSetup: true,
      error: "Telegram 2FA is not paired yet. Please link your Telegram Bot & Chat ID.",
    });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;
  setAuthValue("pending_otp", {
    code,
    username: username.trim() || "Director",
    expiresAt,
  });

  const text =
    `🏛 *IMPERIUM WORLD SIMULATOR — 2FA LOGIN*\n\n` +
    `👤 *Director:* \`${username.trim() || "Director"}\`\n` +
    `🔐 *Your 6-Digit 2FA Code:* \`${code}\`\n\n` +
    `_Expires in 5 minutes. Enter this code in the Private Director Portal to unlock edit access._`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: activeChatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(400).json({
        error: `Telegram rejected message: ${tgData.description || "Check your Bot Token and Chat ID"}`,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `Failed to reach Telegram API: ${err.message}`,
    });
  }

  res.json({
    ok: true,
    maskedChatId: maskChatId(activeChatId),
    message: `6-digit 2FA verification code sent to Telegram (${maskChatId(activeChatId)})!`,
  });
});

app.post("/api/auth/verify-2fa", (req, res) => {
  const { username = "Director", otpCode } = req.body || {};
  const pending = getAuthValue("pending_otp", null);

  if (!pending || !pending.code) {
    return res.status(400).json({ error: "No pending 2FA code found. Please request a new code." });
  }
  if (Date.now() > pending.expiresAt) {
    return res.status(400).json({ error: "2FA code has expired. Please request a new code." });
  }
  if (String(otpCode || "").trim() !== String(pending.code)) {
    return res.status(401).json({ error: "Invalid 6-digit 2FA verification code." });
  }

  const sessionToken = `dir_sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  const activeSessions = getAuthValue("sessions", {});
  activeSessions[sessionToken] = {
    username: username.trim() || pending.username || "Director",
    createdAt: new Date().toISOString(),
  };
  setAuthValue("sessions", activeSessions);
  setAuthValue("pending_otp", null);

  res.json({
    ok: true,
    sessionToken,
    username: activeSessions[sessionToken].username,
  });
});

app.post("/api/auth/logout", (req, res) => {
  const providedToken = req.headers["x-director-key"] || req.body?.sessionToken;
  if (providedToken) {
    const activeSessions = getAuthValue("sessions", {});
    delete activeSessions[providedToken];
    setAuthValue("sessions", activeSessions);
  }
  res.json({ ok: true });
});

// Enforce Read-Only Public Mode vs. Private Director Mode on all mutating API endpoints
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth/")) {
    return next();
  }
  if (["POST", "PATCH", "DELETE", "PUT"].includes(req.method)) {
    const providedKey =
      req.headers["x-director-key"] || req.query.access || req.body?.directorKey;
    if (!isValidDirectorSessionToken(providedKey)) {
      return res.status(403).json({
        error:
          "Read-Only Public Spectator Mode: Editing requires authentication via the Private Director Telegram 2FA Login Portal.",
      });
    }
  }
  next();
});

ensureDefaultSessions();

// In-memory cache of active session states for instant 15ms evaluations
const sessionCache = new Map();
// SSE clients per sessionId
const sseClients = new Map();
// Active live timers per sessionId
const liveTimers = new Map();

function getCachedSession(sessionId) {
  if (!sessionCache.has(sessionId)) {
    const sess = getSession(sessionId);
    if (!sess) return null;
    evaluateSimulation(sess.state);
    sessionCache.set(sessionId, sess);
  }
  return sessionCache.get(sessionId);
}

function persistAndBroadcast(sessionId, actor, action, details = "") {
  const sess = sessionCache.get(sessionId);
  if (!sess) return;
  evaluateSimulation(sess.state);
  saveSessionState(sessionId, sess.state);
  if (action) {
    logActivity(sessionId, actor || "Director", action, details);
  }
  broadcastSessionUpdate(sessionId, {
    type: "STATE_UPDATED",
    actor: actor || "Director",
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

function broadcastSessionUpdate(sessionId, payload) {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.size === 0) return;
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(msg);
    } catch {
      clients.delete(res);
    }
  }
}

function syncLiveTimer(sessionId) {
  const sess = getCachedSession(sessionId);
  if (!sess) return;
  const tm = sess.state.timeManager;

  if (liveTimers.has(sessionId)) {
    clearInterval(liveTimers.get(sessionId));
    liveTimers.delete(sessionId);
  }

  if (tm && tm.isLive) {
    // Matches Timer() from Apps Script:
    // var daystoadd = interval.getValue()/60;
    const timer = setInterval(() => {
      const currentSess = getCachedSession(sessionId);
      if (!currentSess || !currentSess.state.timeManager?.isLive) {
        clearInterval(timer);
        liveTimers.delete(sessionId);
        return;
      }
      const intervalVal =
        Number(currentSess.state.timeManager.intervalDaysPerHour) || 90;
      const daysToAdd = intervalVal / 60;
      const { quartersCrossed } = advanceSimulationTime(
        currentSess.state,
        daysToAdd,
        true
      );
      if (quartersCrossed > 0) {
        recordLedgerSnapshot(sessionId, currentSess.state);
      }
      persistAndBroadcast(
        sessionId,
        "Timer() / NuevoGDPManager()",
        quartersCrossed > 0
          ? `NuevoGDPManager: BudgetUpdater & DividendUpdater executed (Q${currentSess.state.timeManager.quarterNumber})`
          : `Timer Tick (+${daysToAdd.toFixed(2)}d)`,
        `Date: ${currentSess.state.timeManager.crisisDate}`
      );
    }, 3000);
    liveTimers.set(sessionId, timer);
  }
}

// --- API ROUTES ---

// 1. List all sessions
app.get("/api/sessions", (req, res) => {
  res.json({ sessions: listSessions() });
});

// 2. Create a new session
app.post("/api/sessions", (req, res) => {
  const { name, description, scenarioType, customState, startDate, electionIntervalDays, actor } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Session name is required" });
  }
  const id =
    req.body.id ||
    `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  const created = createSession({
    id,
    name,
    description,
    scenarioType: scenarioType || "interstellar",
    customState,
  });
  if (startDate) {
    setCustomStartDate(created.state, {
      startDate,
      resetCurrentDate: true,
      electionIntervalDays,
    });
    evaluateSimulation(created.state);
    saveSessionState(id, created.state);
  }
  sessionCache.set(id, created);
  if (actor) {
    logActivity(id, actor, "Created Scenario", `${name}${startDate ? ` (Start: ${startDate})` : ""}`);
  }
  res.json({ session: created });
});

// 3. Get full session state, ledger history, and activity log
app.get("/api/sessions/:id", (req, res) => {
  const sess = getCachedSession(req.params.id);
  if (!sess) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json({
    session: sess,
    ledgerHistory: getLedgerHistory(req.params.id),
    activityLog: getActivityLog(req.params.id, 60),
  });
});

// 4. Reset session to initial spreadsheet state
app.post("/api/sessions/:id/reset", (req, res) => {
  const id = req.params.id;
  if (liveTimers.has(id)) {
    clearInterval(liveTimers.get(id));
    liveTimers.delete(id);
  }
  const fresh = resetSessionToSeed(id);
  if (!fresh) {
    return res.status(404).json({ error: "Session not found" });
  }
  sessionCache.set(id, fresh);
  broadcastSessionUpdate(id, {
    type: "STATE_UPDATED",
    actor: req.body?.actor || "Director",
    action: "Reset Scenario",
    timestamp: new Date().toISOString(),
  });
  res.json({
    session: fresh,
    ledgerHistory: getLedgerHistory(id),
    activityLog: getActivityLog(id, 60),
  });
});

// 5. SSE Stream for multiplayer real-time sync
app.get("/api/sessions/:id/stream", (req, res) => {
  const id = req.params.id;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  if (!sseClients.has(id)) {
    sseClients.set(id, new Set());
  }
  const clients = sseClients.get(id);
  clients.add(res);

  res.write(
    `data: ${JSON.stringify({
      type: "CONNECTED",
      onlineCount: clients.size,
    })}\n\n`
  );

  // Broadcast updated player count
  broadcastSessionUpdate(id, {
    type: "PRESENCE",
    onlineCount: clients.size,
  });

  req.on("close", () => {
    clients.delete(res);
    broadcastSessionUpdate(id, {
      type: "PRESENCE",
      onlineCount: clients.size,
    });
  });
});

// 6. Time Manager & Engine Mode Controls (Implements Load, Lock, Reset, Timer, NuevoGDPManager, Summarizer)
app.post("/api/sessions/:id/time", (req, res) => {
  const id = req.params.id;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const {
    command,
    daysToAdd,
    randomizeHype,
    isLive,
    intervalDaysPerHour,
    crisisStartDate,
    strictSheetQuirks,
    actor,
  } = req.body;

  const tm = sess.state.timeManager;
  let actionDesc = "Updated Time Manager";
  let toastMessage = null;

  if (command === "LOAD") {
    // Exact Load() from Apps Script (Checkbox I2)
    if (tm.liveStatus === "VIRGIN") {
      tm.crisisDate = tm.crisisStartDate || "2025-01-01";
    }
    tm.isLive = true;
    tm.liveStatus = "TRUE";
    syncLiveTimer(id);
    toastMessage = "Sheets started. God bless us all!";
    actionDesc = "Load() [I2]: Sheets started. God bless us all!";
  } else if (command === "LOCK") {
    // Exact Lock() from Apps Script (Checkbox I3)
    tm.isLive = false;
    tm.liveStatus = "FALSE";
    syncLiveTimer(id);
    toastMessage = "Sheets stopped. Enjoy your state-sanctioned break!";
    actionDesc = "Lock() [I3]: Sheets stopped. Enjoy your state-sanctioned break!";
  } else if (command === "RESET_TIMER") {
    // Exact Reset() from Apps Script (Checkbox I4)
    tm.isLive = false;
    tm.liveStatus = "VIRGIN";
    syncLiveTimer(id);
    const startStr = tm.crisisStartDate || "2025-01-01";
    tm.crisisDate = startStr;
    const nextDt = new Date(`${startStr}T00:00:00Z`);
    nextDt.setUTCDate(nextDt.getUTCDate() + 90);
    tm.nextPaymentDate = nextDt.toISOString().split("T")[0];
    toastMessage = "Time Manager reset to VIRGIN state & Next Payment Date +90d.";
    actionDesc = "Reset() [I4]: Reset Time Manager to VIRGIN";
  } else if (command === "TIMER_TICK") {
    // Exact single Timer() tick: daystoadd = interval / 60
    const d = (Number(tm.intervalDaysPerHour) || 90) / 60;
    const { quartersCrossed } = advanceSimulationTime(
      sess.state,
      d,
      Boolean(randomizeHype)
    );
    if (quartersCrossed > 0) {
      recordLedgerSnapshot(id, sess.state);
    }
    actionDesc = `Timer() Tick (+${d.toFixed(2)} days)`;
  } else if (command === "NUEVO_GDP_MANAGER") {
    // Direct invocation of NuevoGDPManager() -> +90d Next Payment Date + BudgetUpdater() + DividendUpdater()
    const nextDt = new Date(
      `${tm.nextPaymentDate || "2025-04-01"}T00:00:00Z`
    );
    nextDt.setUTCDate(nextDt.getUTCDate() + 90);
    tm.nextPaymentDate = nextDt.toISOString().split("T")[0];
    runBudgetAndDividendUpdater(sess.state, Boolean(randomizeHype));
    recordLedgerSnapshot(id, sess.state);
    toastMessage =
      "NuevoGDPManager executed: BudgetUpdater & DividendUpdater completed!";
    actionDesc = "NuevoGDPManager(): Updated Budgets, Pops, Employment & Dividends";
  } else if (command === "SET_START_DATE") {
    const resStart = setCustomStartDate(sess.state, {
      startDate: crisisStartDate || req.body.startDate || "2025-01-01",
      resetCurrentDate: req.body.resetCurrentDate !== false,
      electionIntervalDays: req.body.electionIntervalDays,
    });
    toastMessage = resStart.toastMessage;
    actionDesc = resStart.action;
  }

  if (strictSheetQuirks !== undefined) {
    sess.state.strictSheetQuirks = Boolean(strictSheetQuirks);
    actionDesc = `Switched Engine to ${
      strictSheetQuirks ? "Strict Sheet Formula Mode" : "Balanced VGP Mode"
    }`;
  }

  if (crisisStartDate !== undefined && command !== "SET_START_DATE") {
    tm.crisisStartDate = crisisStartDate;
  }

  if (intervalDaysPerHour !== undefined) {
    tm.intervalDaysPerHour = Math.max(1, Number(intervalDaysPerHour) || 90);
  }

  if (isLive !== undefined && !command) {
    if (isLive && tm.liveStatus === "VIRGIN") {
      tm.crisisDate = tm.crisisStartDate || "2025-01-01";
    }
    tm.isLive = Boolean(isLive);
    tm.liveStatus = isLive ? "TRUE" : "FALSE";
    toastMessage = isLive
      ? "Sheets started. God bless us all!"
      : "Sheets stopped. Enjoy your state-sanctioned break!";
    actionDesc = toastMessage;
    syncLiveTimer(id);
  }

  if (daysToAdd && Number(daysToAdd) !== 0) {
    const d = Number(daysToAdd);
    const { quartersCrossed } = advanceSimulationTime(
      sess.state,
      d,
      Boolean(randomizeHype)
    );
    if (quartersCrossed > 0) {
      recordLedgerSnapshot(id, sess.state);
    }
    actionDesc =
      quartersCrossed > 0
        ? `Advanced +${d} days — NuevoGDPManager triggered (Q${sess.state.timeManager.quarterNumber})`
        : `Advanced +${d} days (${sess.state.timeManager.crisisDate})`;
  } else {
    evaluateSimulation(sess.state);
  }

  persistAndBroadcast(
    id,
    actor,
    actionDesc,
    `Date: ${sess.state.timeManager.crisisDate}`
  );
  res.json({
    session: sess,
    toastMessage,
    ledgerHistory: getLedgerHistory(id),
    activityLog: getActivityLog(id, 60),
  });
});

// 7. Update Nation Parameters & Policies
app.patch("/api/sessions/:id/nations/:nationId", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId);
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const { actor, ...updates } = req.body;
  const allowedFields = [
    "name",
    "planet",
    "stockExchangeName",
    "consumerSentiment",
    "kFactorScaler",
    "workingPops",
    "literacyRate",
    "urbanisationIndex",
    "infrastructureEfficiency",
    "rulingParty",
    "federalCooperativity",
    "diplomaticExpenses",
    "treasuryBalance",
    "specializedIndustry",
    "crimePolicy",
    "healthcarePolicy",
    "highImmigration",
    "incomeTaxOverride",
    "salesTaxOverride",
    "corporateTaxOverride",
    "workerShareOverride",
    "budgetPercentOverride",
  ];

  const changedKeys = [];
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      nation[key] = updates[key];
      changedKeys.push(key);
    }
  }

  persistAndBroadcast(
    id,
    actor,
    `Updated ${nation.name}`,
    `Modified: ${changedKeys.join(", ")}`
  );

  res.json({
    session: sess,
    activityLog: getActivityLog(id, 60),
  });
});

// 8. Create a New Country / Colony or Declare Independence
app.post("/api/sessions/:id/nations", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const {
    name,
    planet = "Earth",
    templateNationId,
    workingPops = 25000000,
    literacyRate = 0.85,
    urbanisationIndex = 0.75,
    infrastructureEfficiency = 0.8,
    rulingParty,
    specializedIndustry = "Industry & Manufacturing GDP",
    crimePolicy = "Beat Cops",
    healthcarePolicy = "State-run Healthcare",
    kFactorScaler = 1500,
    companyCount = 25,
    actor,
  } = req.body;

  if (!name) return res.status(400).json({ error: "Nation name is required" });

  const newId = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()
    .toString(36)
    .slice(-4)}`;

  const templateNation =
    sess.state.nations.find((n) => n.id === templateNationId) ||
    sess.state.nations[0];

  const market = (templateNation?.market || []).map((m) => ({
    ...m,
  }));

  const count = Math.min(200, Math.max(1, Number(companyCount) || 20));
  const companies = [];
  const sampleGoods = [
    "Tools",
    "Steel",
    "Semi-Conductor",
    "Electricity",
    "Grain",
    "Automobile",
    "Software",
    "Pharmaceuticals",
    "Aerospace",
    "Banking",
    "International Trade",
    "Construction",
  ];

  for (let i = 1; i <= count; i++) {
    const gName =
      templateNation?.companies?.[i - 1]?.flagshipGood ||
      sampleGoods[(i - 1) % sampleGoods.length];
    companies.push({
      id: `${newId}_comp_${i}`,
      name: `${name} Enterprise ${i}`,
      hqCountry: name,
      flagshipGood: gName,
      gdpSector: "Industry & Manufacturing GDP",
      hypeFactor: 50,
      valuation: 0,
      vgp: 0,
      employedPops: Math.round((Number(workingPops) * 0.9) / count),
      projectedRealGrowth: 0.02,
      govtOwnedShares: 0,
      numberOfShares: 10000000,
      dividendEfficiency: 0.6,
      dividendsPerShare: 0,
      productionMethod: "Tools",
      subsidised: false,
      targetGrowth: 0.03,
      illegal: false,
    });
  }

  const newNation = {
    id: newId,
    name: name.trim(),
    planet: planet.trim(),
    stockExchangeName: `${name.trim()} Exchange`,
    consumerSentiment: 55,
    kFactorScaler: Number(kFactorScaler) || 1500,
    workingPops: Number(workingPops) || 25000000,
    literacyRate: Number(literacyRate) || 0.85,
    urbanisationIndex: Number(urbanisationIndex) || 0.75,
    infrastructureEfficiency: Number(infrastructureEfficiency) || 0.8,
    rulingParty:
      rulingParty || sess.state.politicalParties?.[0]?.name || "Republican",
    federalCooperativity: 0.1,
    diplomaticExpenses: 0,
    treasuryBalance: 50000000000,
    specializedIndustry,
    crimePolicy,
    healthcarePolicy,
    highImmigration: true,
    companies,
    market,
  };

  sess.state.nations.push(newNation);
  if (!sess.state.territoryMap) sess.state.territoryMap = {};
  sess.state.territoryMap[newNation.name] = newNation.id;
  persistAndBroadcast(
    id,
    actor,
    `Founded ${newNation.name}`,
    `Planet/Region: ${newNation.planet}, Pops: ${newNation.workingPops.toLocaleString()}`
  );

  res.json({
    session: sess,
    newNationId: newId,
    activityLog: getActivityLog(id, 60),
  });
});

// 9. Delete a Nation
app.delete("/api/sessions/:id/nations/:nationId", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });
  if (sess.state.nations.length <= 1) {
    return res.status(400).json({ error: "Cannot delete the last remaining nation" });
  }
  const idx = sess.state.nations.findIndex((n) => n.id === nationId);
  if (idx === -1) return res.status(404).json({ error: "Nation not found" });
  const removed = sess.state.nations.splice(idx, 1)[0];

  persistAndBroadcast(id, req.body?.actor, `Dissolved ${removed.name}`, "");
  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 10. Create a Company in a Nation
app.post("/api/sessions/:id/nations/:nationId/companies", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId);
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const {
    name,
    flagshipGood = "Tools",
    employedPops = 25000,
    hypeFactor = 55,
    numberOfShares = 50000000,
    govtOwnedShares = 0,
    dividendEfficiency = 0.6,
    subsidised = false,
    targetGrowth = 0.03,
    actor,
  } = req.body;

  const compId = `${nation.id}_comp_${Date.now().toString(36)}`;
  const newComp = {
    id: compId,
    name: (name || `${nation.name} Corp ${nation.companies.length + 1}`).trim(),
    hqCountry: nation.name,
    flagshipGood,
    gdpSector: "Industry & Manufacturing GDP",
    hypeFactor: Number(hypeFactor) || 50,
    valuation: 0,
    vgp: 0,
    employedPops: Math.max(1, Number(employedPops) || 25000),
    projectedRealGrowth: 0,
    govtOwnedShares: Math.max(0, Number(govtOwnedShares) || 0),
    numberOfShares: Math.max(1, Number(numberOfShares) || 50000000),
    dividendEfficiency: Number(dividendEfficiency) ?? 0.6,
    dividendsPerShare: 0,
    productionMethod: "Tools",
    subsidised: Boolean(subsidised),
    targetGrowth: Number(targetGrowth) || 0.03,
    illegal: false,
  };

  nation.companies.unshift(newComp);
  persistAndBroadcast(
    id,
    actor,
    `Incorporated ${newComp.name}`,
    `HQ: ${nation.name}, Good: ${flagshipGood}`
  );

  res.json({ session: sess, company: newComp, activityLog: getActivityLog(id, 60) });
});

// 11. Update a Company
app.patch("/api/sessions/:id/nations/:nationId/companies/:companyId", (req, res) => {
  const { id, nationId, companyId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId);
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const comp = nation.companies.find((c) => c.id === companyId);
  if (!comp) return res.status(404).json({ error: "Company not found" });

  const { actor, ...updates } = req.body;
  const allowed = [
    "name",
    "flagshipGood",
    "hypeFactor",
    "employedPops",
    "govtOwnedShares",
    "numberOfShares",
    "dividendEfficiency",
    "subsidised",
    "targetGrowth",
  ];
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      comp[k] = updates[k];
    }
  }

  persistAndBroadcast(
    id,
    actor,
    `Updated ${comp.name} (${nation.name})`,
    `Good: ${comp.flagshipGood}, Emp: ${Number(comp.employedPops).toLocaleString()}`
  );

  res.json({ session: sess, company: comp, activityLog: getActivityLog(id, 60) });
});

// 12. Delete a Company
app.delete("/api/sessions/:id/nations/:nationId/companies/:companyId", (req, res) => {
  const { id, nationId, companyId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId);
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const idx = nation.companies.findIndex((c) => c.id === companyId);
  if (idx === -1) return res.status(404).json({ error: "Company not found" });
  const removed = nation.companies.splice(idx, 1)[0];

  persistAndBroadcast(
    id,
    req.body?.actor,
    `Liquidated ${removed.name}`,
    `HQ: ${nation.name}`
  );
  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 13. Update Nation Local Market (Single Good or Bulk Tariff/DD)
app.patch("/api/sessions/:id/nations/:nationId/market", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId);
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const { goodName, updates, bulkUpdate, actor } = req.body;

  if (bulkUpdate) {
    // e.g. { importTariffRate: 0.15, exportTariffRate: 0.05, sector: "Agricultural Sector GDP" }
    const sectorGoodSet = new Set(
      (sess.state.goodsCatalog || [])
        .filter((g) => !bulkUpdate.sector || g.sector === bulkUpdate.sector)
        .map((g) => g.name)
    );
    for (const m of nation.market) {
      if (sectorGoodSet.has(m.goodName)) {
        if (bulkUpdate.importTariffRate !== undefined) {
          m.importTariffRate = Number(bulkUpdate.importTariffRate);
        }
        if (bulkUpdate.exportTariffRate !== undefined) {
          m.exportTariffRate = Number(bulkUpdate.exportTariffRate);
        }
        if (bulkUpdate.ddMultiplier !== undefined) {
          m.ddMultiplier = Number(bulkUpdate.ddMultiplier);
        }
        if (bulkUpdate.hype !== undefined) {
          m.hype = Number(bulkUpdate.hype);
        }
      }
    }
    persistAndBroadcast(
      id,
      actor,
      `Bulk Market Policy in ${nation.name}`,
      bulkUpdate.sector || "All Sectors"
    );
  } else if (goodName && updates) {
    let mItem = nation.market.find((m) => m.goodName === goodName);
    if (!mItem) {
      mItem = {
        goodName,
        hype: 50,
        ddMultiplier: 1.0,
        exportTariffRate: 0,
        importTariffRate: 0,
        illegal: false,
      };
      nation.market.push(mItem);
    }
    for (const k of [
      "hype",
      "ddMultiplier",
      "exportTariffRate",
      "importTariffRate",
      "illegal",
    ]) {
      if (updates[k] !== undefined) {
        mItem[k] = updates[k];
      }
    }
    persistAndBroadcast(
      id,
      actor,
      `Adjusted ${goodName} Market (${nation.name})`,
      JSON.stringify(updates)
    );
  }

  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 14. Update Tech Eras & Sector Configurations (Production Methods Companion & Companies Companion)
app.patch("/api/sessions/:id/companion", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const { techEraName, unlocked, sectorName, sentiment, kFactorBonus, goodName, inputs, actor } =
    req.body;

  let desc = "Updated Companion Settings";
  if (techEraName !== undefined) {
    const era = sess.state.techEras.find((e) => e.name === techEraName);
    if (era) {
      era.unlocked = Boolean(unlocked);
      desc = `${era.unlocked ? "Unlocked" : "Locked"} Tech Era: ${techEraName}`;
    }
  }

  if (sectorName !== undefined) {
    const sec = sess.state.sectorsConfig.find((s) => s.name === sectorName);
    if (sec) {
      if (sentiment !== undefined) sec.sentiment = Number(sentiment);
      if (kFactorBonus !== undefined) sec.kFactorBonus = Number(kFactorBonus);
      desc = `Updated Sector ${sectorName}`;
    }
  }

  if (goodName !== undefined && Array.isArray(inputs)) {
    const g = sess.state.goodsCatalog.find((x) => x.name === goodName);
    if (g) {
      g.inputs = inputs;
      desc = `Updated Production Inputs for ${goodName}`;
    }
  }

  persistAndBroadcast(id, actor, desc, "");
  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 15. Create or Update Political Party
app.post("/api/sessions/:id/parties", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const { actor, ...partyData } = req.body;
  if (!partyData.name) {
    return res.status(400).json({ error: "Party name is required" });
  }

  const existing = sess.state.politicalParties.find(
    (p) => p.name.toLowerCase() === partyData.name.toLowerCase()
  );
  if (existing) {
    Object.assign(existing, partyData);
    persistAndBroadcast(id, actor, `Updated Party: ${existing.name}`, "");
  } else {
    const newParty = {
      nation: partyData.nation || "Global",
      name: partyData.name.trim(),
      currentSupport: Number(partyData.currentSupport) ?? 0.25,
      incomeTaxPreference: Number(partyData.incomeTaxPreference) ?? 0.2,
      salesTaxPreference: Number(partyData.salesTaxPreference) ?? 0.1,
      corporateTaxRate: Number(partyData.corporateTaxRate) ?? 0.2,
      subsidyPreference: partyData.subsidyPreference || "None",
      nationalizationPreference:
        partyData.nationalizationPreference || "No Nationalization",
      workerShareOfGdp: Number(partyData.workerShareOfGdp) ?? 0.45,
      budgetAsPercentOfGdp: Number(partyData.budgetAsPercentOfGdp) ?? 0.15,
      federalisedPolicy: partyData.federalisedPolicy || "Confederated",
      localCrimePolicy: partyData.localCrimePolicy || "Beat Cops",
      healthcarePolicy: partyData.healthcarePolicy || "Private Healthcare",
      politicalAlignment: partyData.politicalAlignment || "Centre",
    };
    sess.state.politicalParties.push(newParty);
    persistAndBroadcast(id, actor, `Founded Political Party: ${newParty.name}`, "");
  }

  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 16. Stock Exchange Accounts & Trading
app.post("/api/sessions/:id/stock-accounts", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const { holderName, cashBalance = 10000000000, actor } = req.body;
  if (!holderName) {
    return res.status(400).json({ error: "Account holder name is required" });
  }

  const newAcc = {
    id: `acc_${Date.now().toString(36)}`,
    holderName: holderName.trim(),
    dividendPot: 0,
    cashBalance: Number(cashBalance) || 10000000000,
    holdings: [],
  };
  sess.state.stockAccounts.push(newAcc);
  persistAndBroadcast(id, actor, `Opened Brokerage Account: ${newAcc.holderName}`, "");
  res.json({ session: sess, account: newAcc, activityLog: getActivityLog(id, 60) });
});

app.post("/api/sessions/:id/stock-accounts/:accountId/trade", (req, res) => {
  const { id, accountId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const acc = sess.state.stockAccounts.find((a) => a.id === accountId);
  if (!acc) return res.status(404).json({ error: "Account not found" });

  const { action, companyName, hqCountry, units, actor } = req.body;

  if (action === "CLAIM_DIVIDENDS") {
    const claimed = Number(acc.dividendPot) || 0;
    acc.cashBalance = (Number(acc.cashBalance) || 0) + claimed;
    acc.dividendPot = 0;
    persistAndBroadcast(
      id,
      actor || acc.holderName,
      `Claimed Dividends (${acc.holderName})`,
      `$${Math.round(claimed).toLocaleString()}`
    );
    return res.json({ session: sess, activityLog: getActivityLog(id, 60) });
  }

  const nation = sess.state.nations.find(
    (n) => n.name.toLowerCase() === (hqCountry || "").toLowerCase()
  );
  const comp = nation?.companies?.find(
    (c) => c.name.toLowerCase() === (companyName || "").toLowerCase()
  );
  if (!comp) {
    return res.status(404).json({ error: "Target company not found" });
  }

  const numUnits = Math.max(0, Number(units) || 0);
  const sharePrice = Number(comp.sharePrice) || Number(comp.valuation) / Math.max(1, comp.numberOfShares);
  const totalCost = numUnits * sharePrice;

  let holding = acc.holdings.find(
    (h) =>
      h.companyName.toLowerCase() === comp.name.toLowerCase() &&
      h.hqCountry.toLowerCase() === nation.name.toLowerCase()
  );

  if (action === "BUY") {
    acc.cashBalance = (Number(acc.cashBalance) || 0) - totalCost;
    if (holding) {
      holding.units += numUnits;
    } else {
      acc.holdings.push({
        companyName: comp.name,
        hqCountry: nation.name,
        units: numUnits,
      });
    }
    persistAndBroadcast(
      id,
      actor || acc.holderName,
      `Bought ${numUnits.toLocaleString()} shares of ${comp.name}`,
      `Account: ${acc.holderName}`
    );
  } else if (action === "SELL") {
    if (!holding || holding.units < numUnits) {
      return res.status(400).json({ error: "Insufficient shares in portfolio" });
    }
    holding.units -= numUnits;
    acc.cashBalance = (Number(acc.cashBalance) || 0) + totalCost;
    if (holding.units <= 0) {
      acc.holdings = acc.holdings.filter((h) => h !== holding);
    }
    persistAndBroadcast(
      id,
      actor || acc.holderName,
      `Sold ${numUnits.toLocaleString()} shares of ${comp.name}`,
      `Account: ${acc.holderName}`
    );
  }

  res.json({ session: sess, activityLog: getActivityLog(id, 60) });
});

// 17. Dynamic Border Changes: Annex / Transfer Territory or Release Independent Nation
app.post("/api/sessions/:id/territories", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const { territoryName, targetNationId, mode = "ANNEX", planet = "Earth", actor } =
    req.body;
  if (!territoryName) {
    return res.status(400).json({ error: "territoryName is required" });
  }

  const result = transferTerritory(sess.state, {
    territoryName,
    targetNationId,
    mode,
    planet,
  });

  persistAndBroadcast(id, actor, result.action, `Territory: ${territoryName}`);
  res.json({
    session: sess,
    nationId: result.nationId,
    toastMessage: result.action,
    activityLog: getActivityLog(id, 60),
  });
});

// 18. Victoria 3 Mechanics: Elections, Laws, Construction Queue, Gazette Dispatches & Dilemmas
app.post("/api/sessions/:id/victoria", (req, res) => {
  const { id } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const { type, actor } = req.body;
  let result = { action: "Updated statecraft", toastMessage: null };

  if (type === "ELECTION_ACTION") {
    result = triggerElectionAction(sess.state, req.body);
  } else if (type === "LAW_ACTION") {
    result = triggerLawAction(sess.state, req.body);
  } else if (type === "QUEUE_CONSTRUCTION") {
    result = queueConstruction(sess.state, req.body);
  } else if (type === "RESOLVE_DILEMMA") {
    result = resolveNewsDilemma(sess.state, req.body);
  } else if (type === "PUBLISH_NEWS") {
    result = publishCustomNews(sess.state, req.body);
  } else if (type === "SET_START_DATE") {
    result = setCustomStartDate(sess.state, req.body);
  }

  persistAndBroadcast(id, actor, result.action, type || "Statecraft");
  res.json({
    session: sess,
    toastMessage: result.toastMessage || result.action,
    activityLog: getActivityLog(id, 60),
  });
});

// Mount Vite in development or static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(
      `Imperium Interstellar 2.0 Crisis Engine running at http://localhost:${PORT}`
    );
  });
}

startServer();

