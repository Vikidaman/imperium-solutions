import {
  evaluateSimulation,
  advanceSimulationTime,
  runBudgetAndDividendUpdater,
  addDaysToSimDate,
} from "./server/engine.js";
import { buildSimplifiedSeed } from "./server/simplifiedSeedConfig.js";

const CHUNK_SIZE = 350000;
const DEFAULT_MASTER_PASSWORD = "imperium-2026";

const memorySessions = new Map();
const memoryAuth = new Map();
let schemaInitialized = false;
let defaultSessionsSeeded = false;

async function ensureSchema(db) {
  if (schemaInitialized || !db) return;
  await db
    .batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS sessions_meta (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          scenario_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS session_chunks (
          session_id TEXT NOT NULL,
          chunk_idx INTEGER NOT NULL,
          data TEXT NOT NULL,
          PRIMARY KEY (session_id, chunk_idx)
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS ledger_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          quarter INTEGER NOT NULL,
          crisis_date TEXT NOT NULL,
          snapshot_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          details TEXT,
          created_at TEXT NOT NULL
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS director_auth (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `),
    ])
    .catch(() => {});
  schemaInitialized = true;
}

async function getD1AuthValue(db, key, fallback = null) {
  await ensureSchema(db);
  if (db) {
    try {
      const row = await db
        .prepare("SELECT value FROM director_auth WHERE key = ?")
        .bind(key)
        .first();
      if (row && row.value) {
        return JSON.parse(row.value);
      }
    } catch {
      // fallback to memory
    }
  }
  return memoryAuth.has(key) ? memoryAuth.get(key) : fallback;
}

async function setD1AuthValue(db, key, value) {
  await ensureSchema(db);
  memoryAuth.set(key, value);
  if (db) {
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT OR REPLACE INTO director_auth (key, value, updated_at)
         VALUES (?, ?, ?)`
      )
      .bind(key, JSON.stringify(value), now)
      .run()
      .catch(() => {});
  }
}

function maskChatId(chatId) {
  const s = String(chatId || "");
  if (s.length <= 4) return s;
  return `***${s.slice(-4)}`;
}

function extractLedgerSnapshot(state) {
  const tm = state.timeManager || {};
  return {
    quarter: tm.quarterNumber || 1,
    daysElapsed: tm.daysElapsed || 0,
    crisisDate: tm.crisisDate || "2025-01-01",
    nations: (state.nations || []).map((n) => ({
      id: n.id,
      name: n.name,
      aggregateGdp: n.computed?.aggregateGdp || 0,
      sol: n.computed?.sol || 0,
      unemploymentRate: n.computed?.unemploymentRate || 0,
      quarterlyWages: n.computed?.quarterlyWages || 0,
      crimeRate: n.computed?.crimeRate || 0,
      popGrowthRate: n.computed?.popGrowthRate || 0,
      netBudgetBalance: n.computed?.netBudgetBalance || 0,
      treasuryBalance: n.computed?.treasuryBalance || 0,
      publicDebt: n.computed?.publicDebt ?? n.publicDebt ?? 34500000000000,
      workingPops: n.computed?.effectiveWorkingPops || n.workingPops,
    })),
  };
}

function stripComputedBeforeSave(state) {
  const copy = {
    ...state,
    globalMarket: undefined,
    nations: (state.nations || []).map((n) => ({
      ...n,
      computed: undefined,
      marketComputed: undefined,
    })),
  };
  return JSON.stringify(copy);
}

async function saveStateToD1(db, session) {
  const now = new Date().toISOString();
  session.updatedAt = now;
  if (session.state) {
    session.state.version = (Number(session.state.version) || 0) + 1;
    session.state.lastModifiedAt = Date.now();
  }
  memorySessions.set(session.id, session);
  if (!db) return;
  const raw = stripComputedBeforeSave(session.state);
  const chunks = [];
  for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
    chunks.push(raw.slice(i, i + CHUNK_SIZE));
  }

  const stmts = [
    db
      .prepare(
        `INSERT OR REPLACE INTO sessions_meta (id, name, description, scenario_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        session.id,
        session.name,
        session.description || "",
        session.scenarioType || "usa",
        session.createdAt || now,
        now
      ),
    db.prepare(`DELETE FROM session_chunks WHERE session_id = ?`).bind(session.id),
  ];

  for (let idx = 0; idx < chunks.length; idx++) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO session_chunks (session_id, chunk_idx, data) VALUES (?, ?, ?)`
        )
        .bind(session.id, idx, chunks[idx])
    );
  }

  await db.batch(stmts);
}

async function loadSeedFromAssets(env, requestUrl) {
  try {
    const url = new URL("/seeds/interstellar_seed.json", requestUrl);
    const res = await env.ASSETS.fetch(new Request(url));
    if (res.ok) {
      const data = await res.json();
      return evaluateSimulation(buildSimplifiedSeed(data));
    }
  } catch {
    // fallback to built-in seed
  }
  return evaluateSimulation(buildSimplifiedSeed({}));
}

async function ensureDefaultSessions(env, requestUrl) {
  if (defaultSessionsSeeded) return;
  const db = env.DB;
  await ensureSchema(db);

  if (db) {
    const existingMeta = await db
      .prepare("SELECT id FROM sessions_meta WHERE id = 'interstellar-default' LIMIT 1")
      .first();
    if (existingMeta?.id) {
      defaultSessionsSeeded = true;
      return;
    }
  } else if (memorySessions.size > 0) {
    const existing = memorySessions.get("interstellar-default");
    if (existing?.state?.nations?.length > 0 && existing?.state?.timeManager) {
      defaultSessionsSeeded = true;
      return;
    }
  }

  const now = new Date().toISOString();
  const usaState = await loadSeedFromAssets(env, requestUrl);
  const s1 = {
    id: "interstellar-default",
    name: "United States Macroeconomic Simulator",
    description:
      "50 US States & Territories, 60 Leontief Input-Output Sectors, Fiscal & Monetary Policy Levers.",
    scenarioType: "usa",
    createdAt: now,
    updatedAt: now,
    state: usaState,
  };
  memorySessions.set(s1.id, s1);
  defaultSessionsSeeded = true;

  if (db) {
    await saveStateToD1(db, s1);
    await recordLedgerSnapshot(db, s1.id, s1.state);
    await logActivity(
      db,
      s1.id,
      "System",
      "Initialized Session",
      "Initialized United States 50-State Macroeconomic Baseline"
    );
  }
}

async function getSession(env, requestUrl, sessionId, skipEvaluate = false) {
  await ensureDefaultSessions(env, requestUrl);
  const db = env.DB;

  if (!db) {
    if (memorySessions.has(sessionId)) {
      const cached = memorySessions.get(sessionId);
      if (!skipEvaluate) {
        evaluateSimulation(cached.state);
      }
      return cached;
    }
    return null;
  }

  const meta = await db
    .prepare("SELECT * FROM sessions_meta WHERE id = ?")
    .bind(sessionId)
    .first();
  if (!meta) {
    return memorySessions.get(sessionId) || null;
  }

  const cached = memorySessions.get(sessionId);
  if (cached && cached.updatedAt === meta.updated_at) {
    if (!skipEvaluate) {
      evaluateSimulation(cached.state);
    }
    return cached;
  }

  const chunkRows = await db
    .prepare(
      "SELECT data FROM session_chunks WHERE session_id = ? ORDER BY chunk_idx ASC"
    )
    .bind(sessionId)
    .all();

  const rawJson = (chunkRows.results || []).map((r) => r.data).join("");
  const parsed = JSON.parse(rawJson);
  const state = skipEvaluate ? parsed : evaluateSimulation(parsed);
  const sess = {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    scenarioType: meta.scenario_type,
    createdAt: meta.created_at,
    updatedAt: meta.updated_at,
    state,
  };
  memorySessions.set(sessionId, sess);
  return sess;
}

async function recordLedgerSnapshot(db, sessionId, state) {
  if (!db) return;
  const snap = extractLedgerSnapshot(state);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO ledger_history (session_id, quarter, crisis_date, snapshot_json, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(sessionId, snap.quarter, snap.crisisDate, JSON.stringify(snap), now)
    .run();
}

async function getLedgerHistory(db, sessionId, fallbackState) {
  if (!db) {
    return [
      {
        id: 1,
        quarter: 1,
        crisisDate: fallbackState?.timeManager?.crisisDate || "2025-01-01",
        createdAt: new Date().toISOString(),
        snapshot: extractLedgerSnapshot(fallbackState || {}),
      },
    ];
  }
  const rows = await db
    .prepare(
      "SELECT id, quarter, crisis_date, snapshot_json, created_at FROM ledger_history WHERE session_id = ? ORDER BY id ASC"
    )
    .bind(sessionId)
    .all();
  return (rows.results || []).map((r) => ({
    id: r.id,
    quarter: r.quarter,
    crisisDate: r.crisis_date,
    createdAt: r.created_at,
    snapshot: JSON.parse(r.snapshot_json),
  }));
}

async function logActivity(db, sessionId, actor, action, details = "") {
  if (!db) return;
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO activity_log (session_id, actor, action, details, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(sessionId, actor || "Director", action, details, now)
    .run();
}

async function getActivityLog(db, sessionId, limit = 50) {
  if (!db) return [];
  const rows = await db
    .prepare(
      "SELECT id, actor, action, details, created_at FROM activity_log WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    )
    .bind(sessionId, limit)
    .all();
  return rows.results || [];
}

async function isValidDirectorToken(db, token, env) {
  if (!token) return false;
  if (env?.DIRECTOR_SECRET_KEY && token === env.DIRECTOR_SECRET_KEY) return true;
  if (!db && typeof token === "string" && token.startsWith("dir_sess_") && token.length >= 20) {
    return true;
  }
  const activeSessions = await getD1AuthValue(db, "sessions", {});
  return Boolean(activeSessions[token]);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Director-Key",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true });
    }

    if (!url.pathname.startsWith("/api/")) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status === 404 && !url.pathname.includes(".")) {
        const indexUrl = new URL("/index.html", request.url);
        return env.ASSETS.fetch(new Request(indexUrl));
      }
      return assetRes;
    }

    const db = env.DB;
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[1] === "auth") {
      const subRoute = parts[2];
      if (subRoute === "status" && request.method === "GET") {
        const cfg = await getD1AuthValue(db, "config", {});
        const providedToken =
          request.headers.get("x-director-key") || url.searchParams.get("token");
        const activeSessions = await getD1AuthValue(db, "sessions", {});
        const sessionInfo = providedToken ? activeSessions[providedToken] : null;
        return jsonResponse({
          telegramConfigured: Boolean(cfg.botToken && cfg.chatId),
          maskedChatId: cfg.chatId ? maskChatId(cfg.chatId) : null,
          authenticated: Boolean(sessionInfo),
          username: sessionInfo?.username || null,
        });
      }

      if (subRoute === "login" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { username = "Director", password, directLogin, botToken, chatId } = body;
        const cfg = await getD1AuthValue(db, "config", { masterPassword: DEFAULT_MASTER_PASSWORD });
        const expectedPassword = env?.DIRECTOR_MASTER_PASSWORD || cfg.masterPassword || DEFAULT_MASTER_PASSWORD;

        if (!password || (password !== expectedPassword && password !== env?.DIRECTOR_SECRET_KEY)) {
          return jsonResponse({ error: "Invalid Director Master Password." }, 401);
        }

        if (botToken && chatId) {
          const alreadyPaired = Boolean(cfg.botToken && cfg.chatId);
          const providedToken = request.headers.get("x-director-key");
          if (alreadyPaired && !(await isValidDirectorToken(db, providedToken, env))) {
            return jsonResponse(
              { error: "Telegram 2FA pairing is locked. Unlock with an active 2FA session to change it." },
              403
            );
          }
          cfg.botToken = String(botToken).trim();
          cfg.chatId = String(chatId).trim();
          await setD1AuthValue(db, "config", cfg);
        }

        const activeBotToken = cfg.botToken || env?.TELEGRAM_BOT_TOKEN;
        const activeChatId = cfg.chatId || env?.TELEGRAM_CHAT_ID;

        // If directLogin is requested OR Telegram is not yet configured, authenticate directly with Master Password!
        if (directLogin || !activeBotToken || !activeChatId) {
          const sessionToken = `dir_sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
          const activeSessions = await getD1AuthValue(db, "sessions", {});
          activeSessions[sessionToken] = {
            username: username.trim() || "Director",
            createdAt: new Date().toISOString(),
          };
          await setD1AuthValue(db, "sessions", activeSessions);
          return jsonResponse({
            ok: true,
            sessionToken,
            username: activeSessions[sessionToken].username,
            directLogin: true,
            message: "Authenticated successfully with Director Master Password!",
          });
        }

        // If Telegram IS configured, dispatch 6-digit OTP code to Telegram!
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 5 * 60 * 1000;
        await setD1AuthValue(db, "pending_otp", {
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
            return jsonResponse(
              { error: `Telegram rejected message: ${tgData.description || "Check your Bot Token and Chat ID"}` },
              400
            );
          }
        } catch (err) {
          return jsonResponse({ error: `Failed to reach Telegram API: ${err.message}` }, 500);
        }

        return jsonResponse({
          ok: true,
          maskedChatId: maskChatId(activeChatId),
          message: `6-digit 2FA verification code sent to Telegram (${maskChatId(activeChatId)})!`,
        });
      }

      if (subRoute === "verify-2fa" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { username = "Director", otpCode } = body;
        const pending = await getD1AuthValue(db, "pending_otp", null);

        if (!pending || !pending.code) {
          return jsonResponse({ error: "No pending 2FA code found. Please request a new code." }, 400);
        }
        if (Date.now() > pending.expiresAt) {
          return jsonResponse({ error: "2FA code has expired. Please request a new code." }, 400);
        }
        if (String(otpCode || "").trim() !== String(pending.code)) {
          return jsonResponse({ error: "Invalid 6-digit 2FA verification code." }, 401);
        }

        const sessionToken = `dir_sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
        const activeSessions = await getD1AuthValue(db, "sessions", {});
        activeSessions[sessionToken] = {
          username: username.trim() || pending.username || "Director",
          createdAt: new Date().toISOString(),
        };
        await setD1AuthValue(db, "sessions", activeSessions);
        await setD1AuthValue(db, "pending_otp", null);

        return jsonResponse({
          ok: true,
          sessionToken,
          username: activeSessions[sessionToken].username,
        });
      }

      if (subRoute === "telegram-detect" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { botToken } = body;
        if (!botToken || !String(botToken).trim()) {
          return jsonResponse({ error: "Bot token is required." }, 400);
        }
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${String(botToken).trim()}/getUpdates`);
          const tgData = await tgRes.json();
          if (!tgData.ok) {
            return jsonResponse({ error: tgData.description || "Invalid Bot Token" }, 400);
          }
          const updates = tgData.result || [];
          for (let i = updates.length - 1; i >= 0; i--) {
            const msg = updates[i].message || updates[i].channel_post;
            if (msg && msg.chat && msg.chat.id) {
              return jsonResponse({
                ok: true,
                chatId: msg.chat.id,
                username: msg.chat.username ? `@${msg.chat.username}` : msg.chat.first_name || "Director",
                chatTitle:
                  msg.chat.title ||
                  [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ") ||
                  msg.chat.username ||
                  "Telegram Chat",
              });
            }
          }
          return jsonResponse(
            { error: "No messages found yet! Open your bot in Telegram, send '/start', and click Auto-Detect again." },
            404
          );
        } catch (err) {
          return jsonResponse({ error: `Telegram API connection error: ${err.message}` }, 500);
        }
      }

      if (subRoute === "logout" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const providedToken =
          request.headers.get("x-director-key") || body?.sessionToken;
        if (providedToken) {
          const activeSessions = await getD1AuthValue(db, "sessions", {});
          delete activeSessions[providedToken];
          await setD1AuthValue(db, "sessions", activeSessions);
        }
        return jsonResponse({ ok: true });
      }
    }

    if (["POST", "PATCH", "DELETE", "PUT"].includes(request.method) && parts[1] !== "auth") {
      const providedKey =
        request.headers.get("x-director-key") || url.searchParams.get("access");
      if (!(await isValidDirectorToken(db, providedKey, env))) {
        return jsonResponse(
          {
            error:
              "Read-Only Public Spectator Mode: Editing requires authentication via the Private Director Portal.",
          },
          403
        );
      }
    }

    if (parts[1] === "sessions") {
      if (parts.length === 2 && request.method === "GET") {
        await ensureDefaultSessions(env, request.url);
        const sess = await getSession(env, request.url, "interstellar-default", true);
        return jsonResponse({
          sessions: sess
            ? [
                {
                  id: sess.id,
                  name: sess.name,
                  description: sess.description,
                  scenario_type: sess.scenarioType,
                  created_at: sess.createdAt,
                  updated_at: sess.updatedAt,
                },
              ]
            : [],
        });
      }

      const sessionId = parts[2];
      const subAction = parts[3];

      if (!subAction && request.method === "GET") {
        const sess = await getSession(env, request.url, sessionId);
        if (!sess) return jsonResponse({ error: "Session not found" }, 404);
        const ledgerHistory = await getLedgerHistory(db, sessionId, sess.state);
        const activityLog = await getActivityLog(db, sessionId, 60);
        return jsonResponse({ session: sess, ledgerHistory, activityLog });
      }

      if (subAction === "reset" && request.method === "POST") {
        const sess = await getSession(env, request.url, sessionId, true);
        if (!sess) return jsonResponse({ error: "Session not found" }, 404);
        sess.state = await loadSeedFromAssets(env, request.url);
        await saveStateToD1(db, sess);
        if (db) {
          await db.prepare("DELETE FROM ledger_history WHERE session_id = ?").bind(sessionId).run();
        }
        await recordLedgerSnapshot(db, sessionId, sess.state);
        await logActivity(db, sessionId, "Director", "Reset Scenario", "Reset to initial US baseline");
        return jsonResponse({
          session: sess,
          ledgerHistory: await getLedgerHistory(db, sessionId, sess.state),
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      if (subAction === "time" && request.method === "POST") {
        const sess = await getSession(env, request.url, sessionId);
        if (!sess) return jsonResponse({ error: "Session not found" }, 404);
        const body = await request.json().catch(() => ({}));
        const tm = sess.state.timeManager;
        let toastMessage = null;

        if (body.command === "LOAD") {
          tm.isLive = true;
          tm.liveStatus = "TRUE";
          toastMessage = "Auto-Clock started.";
        } else if (body.command === "LOCK") {
          tm.isLive = false;
          tm.liveStatus = "FALSE";
          toastMessage = "Auto-Clock paused.";
        } else if (body.command === "RESET_TIMER") {
          tm.isLive = false;
          tm.liveStatus = "VIRGIN";
          const startStr = tm.crisisStartDate || "2025-01-01";
          tm.crisisDate = startStr;
          tm.nextPaymentDate = addDaysToSimDate(startStr, 90);
          toastMessage = "Time Manager reset.";
        } else if (body.command === "TIMER_TICK") {
          const d = (Number(tm.intervalDaysPerHour) || 90) / 60;
          const { quartersCrossed } = advanceSimulationTime(sess.state, d);
          if (quartersCrossed > 0) {
            await recordLedgerSnapshot(db, sessionId, sess.state);
          }
        } else if (body.command === "NUEVO_GDP_MANAGER") {
          tm.nextPaymentDate = addDaysToSimDate(tm.nextPaymentDate || "2025-04-01", 90);
          runBudgetAndDividendUpdater(sess.state);
          await recordLedgerSnapshot(db, sessionId, sess.state);
          toastMessage = "Quarterly settlement executed!";
        } else if (body.command === "SET_START_DATE") {
          const startDate = body.crisisStartDate || body.startDate || "2025-01-01";
          tm.crisisStartDate = startDate;
          tm.crisisDate = startDate;
          tm.nextPaymentDate = addDaysToSimDate(startDate, 90);
          tm.quarterNumber = 1;
          tm.daysElapsed = 0;
          toastMessage = `Start date set to ${startDate}`;
        }

        if (body.crisisStartDate !== undefined && body.command !== "SET_START_DATE") {
          tm.crisisStartDate = body.crisisStartDate;
        }
        if (body.intervalDaysPerHour !== undefined) {
          tm.intervalDaysPerHour = Math.max(1, Number(body.intervalDaysPerHour) || 90);
        }

        if (body.daysToAdd && Number(body.daysToAdd) !== 0) {
          const { quartersCrossed } = advanceSimulationTime(sess.state, Number(body.daysToAdd));
          if (quartersCrossed > 0) {
            await recordLedgerSnapshot(db, sessionId, sess.state);
          }
        } else if (body.command !== "TIMER_TICK" && body.command !== "NUEVO_GDP_MANAGER") {
          evaluateSimulation(sess.state);
        }

        await saveStateToD1(db, sess);
        return jsonResponse({
          session: sess,
          toastMessage,
          ledgerHistory: await getLedgerHistory(db, sessionId, sess.state),
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      if (subAction === "nations" && parts[4]) {
        const nationId = parts[4];
        const nationSub = parts[5];
        const sess = await getSession(env, request.url, sessionId);
        if (!sess) return jsonResponse({ error: "Session not found" }, 404);
        const nation = sess.state.nations.find((n) => n.id === nationId) || sess.state.nations[0];
        if (!nation) return jsonResponse({ error: "Nation not found" }, 404);
        const body = await request.json().catch(() => ({}));

        if (!nationSub && request.method === "PATCH") {
          const allowed = [
            "name",
            "consumerSentiment",
            "kFactorScaler",
            "workingPops",
            "literacyRate",
            "urbanisationIndex",
            "infrastructureEfficiency",
            "rulingParty",
            "enactedPolicies",
            "startingBaseline",
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
          for (const k of allowed) {
            if (body[k] !== undefined) nation[k] = body[k];
          }
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          return jsonResponse({ session: sess, activityLog: await getActivityLog(db, sessionId, 60) });
        }

        if (nationSub === "market" && request.method === "PATCH") {
          const { goodName, updates, bulkUpdate } = body;
          if (bulkUpdate) {
            const sectorGoodSet = new Set(
              (sess.state.goodsCatalog || [])
                .filter((g) => !bulkUpdate.sector || g.sector === bulkUpdate.sector)
                .map((g) => g.name)
            );
            for (const m of nation.market) {
              if (sectorGoodSet.has(m.goodName)) {
                if (bulkUpdate.importTariffRate !== undefined) m.importTariffRate = Number(bulkUpdate.importTariffRate);
                if (bulkUpdate.exportTariffRate !== undefined) m.exportTariffRate = Number(bulkUpdate.exportTariffRate);
                if (bulkUpdate.ddMultiplier !== undefined) m.ddMultiplier = Number(bulkUpdate.ddMultiplier);
                if (bulkUpdate.hype !== undefined) m.hype = Number(bulkUpdate.hype);
              }
            }
          } else if (goodName && updates) {
            let mItem = nation.market.find((m) => m.goodName === goodName);
            if (!mItem) {
              mItem = { goodName, hype: 50, ddMultiplier: 1.0, exportTariffRate: 0, importTariffRate: 0, illegal: false };
              nation.market.push(mItem);
            }
            for (const k of ["hype", "ddMultiplier", "exportTariffRate", "importTariffRate", "illegal"]) {
              if (updates[k] !== undefined) mItem[k] = updates[k];
            }
          }
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          return jsonResponse({ session: sess, activityLog: await getActivityLog(db, sessionId, 60) });
        }
      }

      if (subAction === "companion" && request.method === "PATCH") {
        const sess = await getSession(env, request.url, sessionId);
        if (!sess) return jsonResponse({ error: "Session not found" }, 404);
        const { techEraName, unlocked, sectorName, sentiment, kFactorBonus, goodName, inputs } =
          await request.json().catch(() => ({}));
        if (techEraName !== undefined) {
          const era = sess.state.techEras.find((e) => e.name === techEraName);
          if (era) era.unlocked = Boolean(unlocked);
        }
        if (sectorName !== undefined) {
          const sec = sess.state.sectorsConfig.find((s) => s.name === sectorName);
          if (sec) {
            if (sentiment !== undefined) sec.sentiment = Number(sentiment);
            if (kFactorBonus !== undefined) sec.kFactorBonus = Number(kFactorBonus);
          }
        }
        if (goodName !== undefined && Array.isArray(inputs)) {
          const g = sess.state.goodsCatalog.find((x) => x.name === goodName);
          if (g) g.inputs = inputs;
        }
        evaluateSimulation(sess.state);
        await saveStateToD1(db, sess);
        return jsonResponse({ session: sess, activityLog: await getActivityLog(db, sessionId, 60) });
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
