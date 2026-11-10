import "dotenv/config";
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
  rollbackSession,
  getAuthValue,
  setAuthValue,
} from "./db.js";
import {
  evaluateSimulation,
  advanceSimulationTime,
  runBudgetAndDividendUpdater,
  addDaysToSimDate,
} from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const DIRECTOR_SECRET_KEY = process.env.DIRECTOR_SECRET_KEY || null;
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

  // If directLogin is requested OR Telegram is not yet configured, authenticate directly with Master Password!
  if (req.body?.directLogin || !activeBotToken || !activeChatId) {
    const sessionToken = `dir_sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    const activeSessions = getAuthValue("sessions", {});
    activeSessions[sessionToken] = {
      username: username.trim() || "Director",
      createdAt: new Date().toISOString(),
    };
    setAuthValue("sessions", activeSessions);
    return res.json({
      ok: true,
      sessionToken,
      username: activeSessions[sessionToken].username,
      directLogin: true,
      message: "Authenticated successfully with Director Master Password!",
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
    `🏛 *IMPERIUM US SIMULATOR — 2FA LOGIN*\n\n` +
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

// Enforce Read-Only Public Mode vs. Private Director Mode on mutating API endpoints
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

const sessionCache = new Map();
const sseClients = new Map();
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

function persistAndBroadcast(sessionId, actor, action, details = "", skipEvaluate = false) {
  const sess = sessionCache.get(sessionId);
  if (!sess) return;
  if (sess.state) {
    sess.state.version = (Number(sess.state.version) || 0) + 1;
    sess.state.lastModifiedAt = Date.now();
  }
  sess.updatedAt = new Date().toISOString();
  if (!skipEvaluate) {
    evaluateSimulation(sess.state);
  }
  setImmediate(() => {
    try {
      saveSessionState(sessionId, sess.state);
      if (action) {
        logActivity(sessionId, actor || "Director", action, details);
      }
    } catch (e) {
      console.error("Background persistence error:", e);
    }
  });
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
    const timer = setInterval(() => {
      const currentSess = getCachedSession(sessionId);
      if (!currentSess || !currentSess.state.timeManager?.isLive) {
        clearInterval(timer);
        liveTimers.delete(sessionId);
        return;
      }
      const intervalVal = Number(currentSess.state.timeManager.intervalDaysPerHour) || 90;
      const daysToAdd = intervalVal / 60;
      const { quartersCrossed } = advanceSimulationTime(currentSess.state, daysToAdd);
      if (quartersCrossed > 0) {
        recordLedgerSnapshot(sessionId, currentSess.state);
      }
      persistAndBroadcast(
        sessionId,
        "Auto-Clock",
        quartersCrossed > 0
          ? `Quarterly Settlement Executed (Q${currentSess.state.timeManager.quarterNumber})`
          : `Timer Tick (+${daysToAdd.toFixed(2)}d)`,
        `Date: ${currentSess.state.timeManager.crisisDate}`
      );
    }, 3000);
    liveTimers.set(sessionId, timer);
  }
}

// --- API ROUTES ---

app.get("/api/sessions", (req, res) => {
  res.json({ sessions: listSessions() });
});

app.post("/api/sessions", (req, res) => {
  const { name, description, customState, actor } = req.body;
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
    scenarioType: "usa",
    customState,
  });
  sessionCache.set(id, created);
  if (actor) {
    logActivity(id, actor, "Created Scenario", name);
  }
  res.json({ session: created });
});

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

app.post("/api/sessions/:id/rollback", (req, res) => {
  const id = req.params.id;
  const { targetQuarter, targetId, actor } = req.body || {};
  try {
    const rolled = rollbackSession(id, targetQuarter, targetId);
    sessionCache.set(id, rolled);
    broadcastSessionUpdate(id, {
      type: "STATE_UPDATED",
      actor: actor || "Director",
      action: "Simulation Rollback",
      details: `Rolled back to Quarter ${rolled.rolledBackTo} (${rolled.crisisDate})`,
      timestamp: new Date().toISOString(),
    });
    res.json({
      ok: true,
      session: rolled,
      ledgerHistory: getLedgerHistory(id),
      activityLog: getActivityLog(id, 60),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/sessions/:id/ledger", (req, res) => {
  res.json({ ledgerHistory: getLedgerHistory(req.params.id) });
});

app.get("/api/sessions/:id/activity", (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 60);
  res.json({ activityLog: getActivityLog(req.params.id, limit) });
});

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

app.post("/api/sessions/:id/time", (req, res) => {
  const id = req.params.id;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const {
    command,
    daysToAdd,
    isLive,
    intervalDaysPerHour,
    crisisStartDate,
    actor,
  } = req.body;

  const tm = sess.state.timeManager;
  let actionDesc = "Updated Time Manager";
  let toastMessage = null;

  if (command === "LOAD") {
    if (tm.liveStatus === "VIRGIN") {
      tm.crisisDate = tm.crisisStartDate || "2025-01-01";
    }
    tm.isLive = true;
    tm.liveStatus = "TRUE";
    syncLiveTimer(id);
    toastMessage = "Auto-Clock started.";
    actionDesc = "Started Auto-Clock";
  } else if (command === "LOCK") {
    tm.isLive = false;
    tm.liveStatus = "FALSE";
    syncLiveTimer(id);
    toastMessage = "Auto-Clock paused.";
    actionDesc = "Paused Auto-Clock";
  } else if (command === "RESET_TIMER") {
    tm.isLive = false;
    tm.liveStatus = "VIRGIN";
    syncLiveTimer(id);
    const startStr = tm.crisisStartDate || "2025-01-01";
    tm.crisisDate = startStr;
    tm.nextPaymentDate = addDaysToSimDate(startStr, 90);
    toastMessage = "Time Manager reset to start date.";
    actionDesc = "Reset Time Manager";
  } else if (command === "TIMER_TICK") {
    const d = (Number(tm.intervalDaysPerHour) || 90) / 60;
    const { quartersCrossed } = advanceSimulationTime(sess.state, d);
    if (quartersCrossed > 0) {
      recordLedgerSnapshot(id, sess.state);
    }
    actionDesc = `Timer Tick (+${d.toFixed(2)} days)`;
  } else if (command === "NUEVO_GDP_MANAGER") {
    tm.nextPaymentDate = addDaysToSimDate(tm.nextPaymentDate || "2025-04-01", 90);
    runBudgetAndDividendUpdater(sess.state);
    recordLedgerSnapshot(id, sess.state);
    toastMessage = "Quarterly budget & macroeconomic settlement executed!";
    actionDesc = "Quarterly Settlement Executed";
  } else if (command === "SET_START_DATE") {
    const startDate = crisisStartDate || req.body.startDate || "2025-01-01";
    tm.crisisStartDate = startDate;
    tm.crisisDate = startDate;
    tm.nextPaymentDate = addDaysToSimDate(startDate, 90);
    tm.quarterNumber = 1;
    tm.daysElapsed = 0;
    toastMessage = `Start date set to ${startDate}`;
    actionDesc = `Set Start Date to ${startDate}`;
  }

  if (crisisStartDate !== undefined && command !== "SET_START_DATE") {
    tm.crisisStartDate = crisisStartDate;
  }

  if (intervalDaysPerHour !== undefined) {
    tm.intervalDaysPerHour = Math.max(1, Number(intervalDaysPerHour) || 90);
  }

  if (isLive !== undefined && !command) {
    tm.isLive = Boolean(isLive);
    tm.liveStatus = isLive ? "TRUE" : "FALSE";
    syncLiveTimer(id);
  }

  if (daysToAdd && Number(daysToAdd) !== 0) {
    const d = Number(daysToAdd);
    const { quartersCrossed } = advanceSimulationTime(sess.state, d);
    if (quartersCrossed > 0) {
      recordLedgerSnapshot(id, sess.state);
    }
    actionDesc =
      quartersCrossed > 0
        ? `Advanced +${d} days — Quarter Q${sess.state.timeManager.quarterNumber} Settled`
        : `Advanced +${d} days (${sess.state.timeManager.crisisDate})`;
  } else {
    evaluateSimulation(sess.state);
  }

  persistAndBroadcast(id, actor, actionDesc, `Date: ${sess.state.timeManager.crisisDate}`);
  res.json({
    session: sess,
    toastMessage,
    ledgerHistory: getLedgerHistory(id),
    activityLog: getActivityLog(id, 60),
  });
});

app.patch("/api/sessions/:id/nations/:nationId", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId) || sess.state.nations[0];
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const { actor, ...updates } = req.body;
  const allowedFields = [
    "name",
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
    "publicDebt",
    "specializedIndustry",
    "crimePolicy",
    "healthcarePolicy",
    "highImmigration",
    "incomeTaxOverride",
    "salesTaxOverride",
    "corporateTaxOverride",
    "workerShareOverride",
    "budgetPercentOverride",
    "centralBankRate",
    "freightDelayFriction",
    "cumulativeGrowthFactor",
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
    `Updated ${nation.name} Policy`,
    `Modified: ${changedKeys.join(", ")}`
  );

  res.json({
    session: sess,
    activityLog: getActivityLog(id, 60),
  });
});

app.patch("/api/sessions/:id/nations/:nationId/market", (req, res) => {
  const { id, nationId } = req.params;
  const sess = getCachedSession(id);
  if (!sess) return res.status(404).json({ error: "Session not found" });

  const nation = sess.state.nations.find((n) => n.id === nationId) || sess.state.nations[0];
  if (!nation) return res.status(404).json({ error: "Nation not found" });

  const { goodName, updates, bulkUpdate, actor } = req.body;

  if (bulkUpdate) {
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
      `Imperium United States Macroeconomic Simulator running at http://localhost:${PORT}`
    );
  });
}

startServer();
