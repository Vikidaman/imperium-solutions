import {
  evaluateSimulation,
  advanceSimulationTime,
  runBudgetAndDividendUpdater,
  transferTerritory,
  applyHistoricalEra,
  setCustomStartDate,
  triggerElectionAction,
  triggerLawAction,
  queueConstruction,
  resolveNewsDilemma,
  publishCustomNews,
} from "./server/engine.js";

const CHUNK_SIZE = 350000; // 350 KB per D1 row (well below D1's 1 MB limit)

// In-memory edge cache per isolate
const memorySessions = new Map();
const memoryAuth = new Map();
let schemaInitialized = false;

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
    planets: (state.planetsSummary || []).map((p) => ({
      name: p.name,
      aggregateGdp: p.aggregateGdp,
      sol: p.sol,
      unemploymentRate: p.unemploymentRate,
      workingPops: p.workingPops,
      netBudgetBalance: p.netBudgetBalance,
      treasuryBalance: p.treasuryBalance,
      totalValuation: p.totalValuation,
    })),
    nations: (state.nations || []).map((n) => ({
      id: n.id,
      name: n.name,
      planet: n.planet,
      aggregateGdp: n.computed?.aggregateGdp || 0,
      sol: n.computed?.sol || 0,
      unemploymentRate: n.computed?.unemploymentRate || 0,
      quarterlyWages: n.computed?.quarterlyWages || 0,
      crimeRate: n.computed?.crimeRate || 0,
      popGrowthRate: n.computed?.popGrowthRate || 0,
      netBudgetBalance: n.computed?.netBudgetBalance || 0,
      treasuryBalance: n.computed?.treasuryBalance || 0,
      totalValuation: n.computed?.totalValuation || 0,
      workingPops: n.computed?.effectiveWorkingPops || n.workingPops,
    })),
  };
}

function stripComputedBeforeSave(state) {
  // Strip derived fields (marketComputed, computed, globalMarket, planetsSummary) before persisting to D1
  // so D1 writes are fast and compact; evaluateSimulation() reconstructs them in ~12ms.
  const copy = {
    ...state,
    globalMarket: undefined,
    planetsSummary: undefined,
    nations: (state.nations || []).map((n) => ({
      ...n,
      computed: undefined,
      marketComputed: undefined,
    })),
  };
  return JSON.stringify(copy);
}

async function saveStateToD1(db, session) {
  if (!db) return;
  const now = new Date().toISOString();
  session.updatedAt = now;
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
        session.scenarioType || "interstellar",
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

async function loadSeedFromAssets(env, requestUrl, scenarioType = "interstellar") {
  const file =
    scenarioType === "vietnam"
      ? "/seeds/vietnam_seed.json"
      : "/seeds/interstellar_seed.json";
  const url = new URL(file, requestUrl);
  const res = await env.ASSETS.fetch(new Request(url));
  const data = await res.json();
  data.strictSheetQuirks = false;
  return evaluateSimulation(data);
}

async function ensureDefaultSessions(env, requestUrl) {
  const db = env.DB;
  await ensureSchema(db);

  if (db) {
    const chunkRows = await db
      .prepare(
        "SELECT data FROM session_chunks WHERE session_id = 'interstellar-default' ORDER BY chunk_idx ASC"
      )
      .all();
    if (chunkRows?.results?.length > 0) {
      try {
        const rawJson = chunkRows.results.map((r) => r.data).join("");
        const parsed = JSON.parse(rawJson);
        const hasOldCompanies = (parsed.nations || []).some(
          (n) => (n.companies || []).length > 0
        );
        const hasOldGoods = (parsed.goodsCatalog || []).length > 60;
        if (!hasOldCompanies && !hasOldGoods && parsed.powerBlocs?.length > 0) {
          return;
        }
      } catch {
        // reseed if corrupted
      }
    }
  } else if (memorySessions.size > 0) {
    const existing = memorySessions.get("interstellar-default");
    if (existing?.state) {
      const hasOldCompanies = (existing.state.nations || []).some(
        (n) => (n.companies || []).length > 0
      );
      const hasOldGoods = (existing.state.goodsCatalog || []).length > 60;
      if (!hasOldCompanies && !hasOldGoods && existing.state.powerBlocs?.length > 0) {
        return;
      }
    }
  }

  const now = new Date().toISOString();
  const interstellarState = await loadSeedFromAssets(
    env,
    requestUrl,
    "interstellar"
  );
  const s1 = {
    id: "interstellar-default",
    name: "Interstellar 2.0: Earth & Mars Crisis",
    description:
      "15 nations across Earth & Mars, 60 essential tradeable goods, 9 Tech Eras, zero micro-companies, and planetary power blocs.",
    scenarioType: "interstellar",
    createdAt: now,
    updatedAt: now,
    state: interstellarState,
  };
  memorySessions.set(s1.id, s1);

  const vietnamState = await loadSeedFromAssets(env, requestUrl, "vietnam");
  const s2 = {
    id: "vietnam-1977",
    name: "Imperium 1977: Vietnam Reunification",
    description:
      "8 Vietnamese regional states, 60 goods, State-Owned Enterprises, Cooperatives, and post-war reconstruction.",
    scenarioType: "vietnam",
    createdAt: now,
    updatedAt: now,
    state: vietnamState,
  };
  memorySessions.set(s2.id, s2);

  if (db) {
    await saveStateToD1(db, s1);
    await saveStateToD1(db, s2);
    await recordLedgerSnapshot(db, s1.id, s1.state);
    await recordLedgerSnapshot(db, s2.id, s2.state);
    await logActivity(
      db,
      s1.id,
      "System",
      "Initialized Session",
      "Seeded from Interstellar 2.0 Mastersheet.xlsx"
    );
    await logActivity(
      db,
      s2.id,
      "System",
      "Initialized Session",
      "Seeded from Imperium Solutions Mastersheet.xlsx"
    );
  }
}

async function getSession(env, requestUrl, sessionId) {
  await ensureDefaultSessions(env, requestUrl);
  if (memorySessions.has(sessionId)) {
    const cached = memorySessions.get(sessionId);
    if (!cached.state.planetsSummary) {
      evaluateSimulation(cached.state);
    }
    return cached;
  }

  const db = env.DB;
  if (!db) return null;

  const meta = await db
    .prepare("SELECT * FROM sessions_meta WHERE id = ?")
    .bind(sessionId)
    .first();
  if (!meta) return null;

  const chunkRows = await db
    .prepare(
      "SELECT data FROM session_chunks WHERE session_id = ? ORDER BY chunk_idx ASC"
    )
    .bind(sessionId)
    .all();

  const rawJson = (chunkRows.results || []).map((r) => r.data).join("");
  const state = evaluateSimulation(JSON.parse(rawJson));
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

const DIRECTOR_SECRET_KEY = "imperium-director-9942";
const DEFAULT_MASTER_PASSWORD = "imperium-2026";

async function isValidDirectorToken(db, token) {
  if (!token) return false;
  if (token === DIRECTOR_SECRET_KEY) return true;
  const activeSessions = await getD1AuthValue(db, "sessions", {});
  return Boolean(activeSessions[token]);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
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
    const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

    // --- TELEGRAM 2FA AUTHENTICATION ROUTES ---
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

      if (subRoute === "telegram-detect" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const botToken = body.botToken;
        if (!botToken || !String(botToken).includes(":")) {
          return jsonResponse(
            { error: "Please provide a valid Telegram Bot Token from @BotFather." },
            400
          );
        }
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${String(botToken).trim()}/getUpdates`
          );
          const tgData = await tgRes.json();
          if (!tgData.ok) {
            return jsonResponse(
              { error: tgData.description || "Invalid Telegram Bot Token." },
              400
            );
          }
          const results = tgData.result || [];
          for (let i = results.length - 1; i >= 0; i--) {
            const msg =
              results[i].message ||
              results[i].edited_message ||
              results[i].channel_post;
            if (msg && msg.chat && msg.chat.id) {
              return jsonResponse({
                chatId: String(msg.chat.id),
                username: msg.chat.username
                  ? `@${msg.chat.username}`
                  : msg.chat.first_name || "Director",
                chatTitle:
                  msg.chat.title ||
                  [msg.chat.first_name, msg.chat.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  msg.chat.username ||
                  "Telegram Chat",
              });
            }
          }
          return jsonResponse(
            {
              error:
                "No messages found yet! Open your bot in Telegram, send '/start', and click Auto-Detect again.",
            },
            404
          );
        } catch (err) {
          return jsonResponse(
            { error: `Telegram API connection error: ${err.message}` },
            500
          );
        }
      }

      if (subRoute === "login" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { username = "Director", password, botToken, chatId } = body;
        const cfg = await getD1AuthValue(db, "config", {
          masterPassword: DEFAULT_MASTER_PASSWORD,
        });
        const expectedPassword = cfg.masterPassword || DEFAULT_MASTER_PASSWORD;

        if (!password || password !== expectedPassword) {
          return jsonResponse(
            { error: "Invalid Director Master Password." },
            401
          );
        }

        if (botToken && chatId) {
          const alreadyPaired = Boolean(cfg.botToken && cfg.chatId);
          const providedToken = request.headers.get("x-director-key");
          if (alreadyPaired && !(await isValidDirectorToken(db, providedToken))) {
            return jsonResponse(
              {
                error:
                  "Telegram 2FA pairing is locked. Unlock with an active 2FA session to change it.",
              },
              403
            );
          }
          cfg.botToken = String(botToken).trim();
          cfg.chatId = String(chatId).trim();
          await setD1AuthValue(db, "config", cfg);
        }

        const activeBotToken = cfg.botToken || env.TELEGRAM_BOT_TOKEN;
        const activeChatId = cfg.chatId || env.TELEGRAM_CHAT_ID;

        if (!activeBotToken || !activeChatId) {
          return jsonResponse(
            {
              needsTelegramSetup: true,
              error:
                "Telegram 2FA is not paired yet. Please link your Telegram Bot & Chat ID.",
            },
            400
          );
        }

        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 5 * 60 * 1000;
        await setD1AuthValue(db, "pending_otp", {
          code,
          username: String(username || "Director").trim(),
          expiresAt,
        });

        const text =
          `🏛 *IMPERIUM WORLD SIMULATOR — 2FA LOGIN*\n\n` +
          `👤 *Director:* \`${String(username || "Director").trim()}\`\n` +
          `🔐 *Your 6-Digit 2FA Code:* \`${code}\`\n\n` +
          `_Expires in 5 minutes. Enter this code in the Private Director Portal to unlock edit access._`;

        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${activeBotToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: activeChatId,
                text,
                parse_mode: "Markdown",
              }),
            }
          );
          const tgData = await tgRes.json();
          if (!tgData.ok) {
            return jsonResponse(
              {
                error: `Telegram rejected message: ${
                  tgData.description || "Check your Bot Token and Chat ID"
                }`,
              },
              400
            );
          }
        } catch (err) {
          return jsonResponse(
            { error: `Failed to reach Telegram API: ${err.message}` },
            500
          );
        }

        return jsonResponse({
          ok: true,
          maskedChatId: maskChatId(activeChatId),
          message: `6-digit 2FA verification code sent to Telegram (${maskChatId(
            activeChatId
          )})!`,
        });
      }

      if (subRoute === "verify-2fa" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const { username = "Director", otpCode } = body;
        const pending = await getD1AuthValue(db, "pending_otp", null);

        if (!pending || !pending.code) {
          return jsonResponse(
            { error: "No pending 2FA code found. Please request a new code." },
            400
          );
        }
        if (Date.now() > pending.expiresAt) {
          return jsonResponse(
            { error: "2FA code has expired. Please request a new code." },
            400
          );
        }
        if (String(otpCode || "").trim() !== String(pending.code)) {
          return jsonResponse(
            { error: "Invalid 6-digit 2FA verification code." },
            401
          );
        }

        const sessionToken = `dir_sess_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 12)}`;
        const activeSessions = await getD1AuthValue(db, "sessions", {});
        activeSessions[sessionToken] = {
          username: String(username || pending.username || "Director").trim(),
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

      if (subRoute === "logout" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const providedToken =
          request.headers.get("x-director-key") || body.sessionToken;
        if (providedToken) {
          const activeSessions = await getD1AuthValue(db, "sessions", {});
          delete activeSessions[providedToken];
          await setD1AuthValue(db, "sessions", activeSessions);
        }
        return jsonResponse({ ok: true });
      }
    }

    // Enforce Public Read-Only Mode vs. Private Director Mode on all mutating endpoints
    if (["POST", "PATCH", "DELETE", "PUT"].includes(request.method)) {
      const providedKey =
        request.headers.get("x-director-key") || url.searchParams.get("access");
      if (!(await isValidDirectorToken(db, providedKey))) {
        return jsonResponse(
          {
            error:
              "Read-Only Public Spectator Mode: Editing requires authentication via the Private Director Telegram 2FA Login Portal.",
          },
          403
        );
      }
    }

    try {
      // GET /api/sessions
      if (parts.length === 2 && parts[1] === "sessions" && request.method === "GET") {
        await ensureDefaultSessions(env, request.url);
        if (db) {
          const rows = await db
            .prepare(
              "SELECT id, name, description, scenario_type, created_at, updated_at FROM sessions_meta ORDER BY created_at ASC"
            )
            .all();
          return jsonResponse({ sessions: rows.results || [] });
        }
        return jsonResponse({
          sessions: Array.from(memorySessions.values()).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            scenario_type: s.scenarioType,
            created_at: s.createdAt,
            updated_at: s.updatedAt,
          })),
        });
      }

      // POST /api/sessions
      if (parts.length === 2 && parts[1] === "sessions" && request.method === "POST") {
        await ensureDefaultSessions(env, request.url);
        const body = await request.json();
        const id =
          body.id ||
          `${(body.name || "session")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
        const state = body.customState
          ? evaluateSimulation(body.customState)
          : await loadSeedFromAssets(
              env,
              request.url,
              body.scenarioType || "interstellar"
            );
        if (body.startDate) {
          setCustomStartDate(state, {
            startDate: body.startDate,
            resetCurrentDate: true,
            electionIntervalDays: body.electionIntervalDays,
          });
          evaluateSimulation(state);
        }
        const now = new Date().toISOString();
        const newSess = {
          id,
          name: body.name || "New Scenario",
          description: body.description || "",
          scenarioType: body.scenarioType || "interstellar",
          createdAt: now,
          updatedAt: now,
          state,
        };
        memorySessions.set(id, newSess);
        await saveStateToD1(db, newSess);
        await recordLedgerSnapshot(db, id, state);
        await logActivity(db, id, body.actor || "Director", "Created Scenario", newSess.name);
        return jsonResponse({ session: newSess });
      }

      const sessionId = parts[2];
      if (!sessionId) return jsonResponse({ error: "Missing session ID" }, 400);

      // GET /api/sessions/:id/stream (SSE endpoint)
      if (parts[3] === "stream" && request.method === "GET") {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "CONNECTED", onlineCount: 1 })}\n\n`
              )
            );
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const sess = await getSession(env, request.url, sessionId);
      if (!sess) return jsonResponse({ error: "Session not found" }, 404);

      // GET /api/sessions/:id
      if (parts.length === 3 && request.method === "GET") {
        return jsonResponse({
          session: sess,
          ledgerHistory: await getLedgerHistory(db, sessionId, sess.state),
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // POST /api/sessions/:id/reset
      if (parts[3] === "reset" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const freshState = await loadSeedFromAssets(
          env,
          request.url,
          sess.scenarioType || "interstellar"
        );
        sess.state = freshState;
        memorySessions.set(sessionId, sess);
        if (db) {
          await db
            .prepare("DELETE FROM ledger_history WHERE session_id = ?")
            .bind(sessionId)
            .run();
        }
        await saveStateToD1(db, sess);
        await recordLedgerSnapshot(db, sessionId, freshState);
        await logActivity(
          db,
          sessionId,
          body.actor || "Director",
          "Reset() [I4]: Reset Scenario to Initial Mastersheet",
          ""
        );
        return jsonResponse({
          session: sess,
          ledgerHistory: await getLedgerHistory(db, sessionId, sess.state),
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // POST /api/sessions/:id/time
      if (parts[3] === "time" && request.method === "POST") {
        const body = await request.json();
        const {
          command,
          daysToAdd,
          randomizeHype,
          isLive,
          intervalDaysPerHour,
          crisisStartDate,
          strictSheetQuirks,
          actor,
        } = body;

        const tm = sess.state.timeManager;
        let actionDesc = "Updated Time Manager";
        let toastMessage = null;

        if (command === "LOAD") {
          if (tm.liveStatus === "VIRGIN") {
            tm.crisisDate = tm.crisisStartDate || "2025-01-01";
          }
          tm.isLive = true;
          tm.liveStatus = "TRUE";
          toastMessage = "Sheets started. God bless us all!";
          actionDesc = "Load() [I2]: Sheets started. God bless us all!";
        } else if (command === "LOCK") {
          tm.isLive = false;
          tm.liveStatus = "FALSE";
          toastMessage = "Sheets stopped. Enjoy your state-sanctioned break!";
          actionDesc =
            "Lock() [I3]: Sheets stopped. Enjoy your state-sanctioned break!";
        } else if (command === "RESET_TIMER") {
          tm.isLive = false;
          tm.liveStatus = "VIRGIN";
          const startStr = tm.crisisStartDate || "2025-01-01";
          tm.crisisDate = startStr;
          const nextDt = new Date(`${startStr}T00:00:00Z`);
          nextDt.setUTCDate(nextDt.getUTCDate() + 90);
          tm.nextPaymentDate = nextDt.toISOString().split("T")[0];
          toastMessage = "Time Manager reset to VIRGIN state.";
          actionDesc = "Reset() [I4]: Reset Time Manager to VIRGIN";
        } else if (command === "TIMER_TICK") {
          const d = (Number(tm.intervalDaysPerHour) || 90) / 60;
          const { quartersCrossed } = advanceSimulationTime(
            sess.state,
            d,
            Boolean(randomizeHype)
          );
          if (quartersCrossed > 0) {
            await recordLedgerSnapshot(db, sessionId, sess.state);
          }
          actionDesc = `Timer() Tick (+${d.toFixed(2)} days)`;
        } else if (command === "NUEVO_GDP_MANAGER") {
          const nextDt = new Date(
            `${tm.nextPaymentDate || "2025-04-01"}T00:00:00Z`
          );
          nextDt.setUTCDate(nextDt.getUTCDate() + 90);
          tm.nextPaymentDate = nextDt.toISOString().split("T")[0];
          runBudgetAndDividendUpdater(sess.state, Boolean(randomizeHype));
          await recordLedgerSnapshot(db, sessionId, sess.state);
          toastMessage =
            "NuevoGDPManager executed: BudgetUpdater & DividendUpdater completed!";
          actionDesc =
            "NuevoGDPManager(): Updated Budgets, Pops, Employment & Dividends";
        } else if (command === "SET_START_DATE") {
          const resStart = setCustomStartDate(sess.state, {
            startDate: crisisStartDate || body.startDate || "2025-01-01",
            resetCurrentDate: body.resetCurrentDate !== false,
            electionIntervalDays: body.electionIntervalDays,
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
        }

        if (daysToAdd && Number(daysToAdd) !== 0) {
          const d = Number(daysToAdd);
          const { quartersCrossed } = advanceSimulationTime(
            sess.state,
            d,
            Boolean(randomizeHype)
          );
          if (quartersCrossed > 0) {
            await recordLedgerSnapshot(db, sessionId, sess.state);
          }
          actionDesc =
            quartersCrossed > 0
              ? `Advanced +${d} days — NuevoGDPManager triggered (Q${sess.state.timeManager.quarterNumber})`
              : `Advanced +${d} days (${sess.state.timeManager.crisisDate})`;
        } else {
          evaluateSimulation(sess.state);
        }

        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor,
          actionDesc,
          `Date: ${sess.state.timeManager.crisisDate}`
        );
        return jsonResponse({
          session: sess,
          toastMessage,
          ledgerHistory: await getLedgerHistory(db, sessionId, sess.state),
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // Nations routes: /api/sessions/:id/nations...
      if (parts[3] === "nations") {
        const nationId = parts[4];

        // POST /api/sessions/:id/nations (Create Nation)
        if (!nationId && request.method === "POST") {
          const body = await request.json();
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
          } = body;

          const newId = `${(name || "nation")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36).slice(-4)}`;
          const templateNation =
            sess.state.nations.find((n) => n.id === templateNationId) ||
            sess.state.nations[0];
          const market = (templateNation?.market || []).map((m) => ({ ...m }));
          const companies = [];

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
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            actor,
            `Founded ${newNation.name}`,
            `Planet: ${newNation.planet}`
          );
          return jsonResponse({
            session: sess,
            newNationId: newId,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }

        const nation = sess.state.nations.find((n) => n.id === nationId);
        if (!nation) return jsonResponse({ error: "Nation not found" }, 404);

        // PATCH /api/sessions/:id/nations/:nationId
        if (parts.length === 5 && request.method === "PATCH") {
          const { actor, ...updates } = await request.json();
          for (const [k, v] of Object.entries(updates)) {
            nation[k] = v;
          }
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            actor,
            `Updated ${nation.name}`,
            Object.keys(updates).join(", ")
          );
          return jsonResponse({
            session: sess,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }

        // DELETE /api/sessions/:id/nations/:nationId
        if (parts.length === 5 && request.method === "DELETE") {
          const body = await request.json().catch(() => ({}));
          sess.state.nations = sess.state.nations.filter((n) => n.id !== nationId);
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            body.actor,
            `Dissolved ${nation.name}`,
            ""
          );
          return jsonResponse({
            session: sess,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }

        // Companies subroutes: /api/sessions/:id/nations/:nationId/companies...
        if (parts[5] === "companies") {
          const companyId = parts[6];
          if (!companyId && request.method === "POST") {
            const body = await request.json();
            const compId = `${nation.id}_comp_${Date.now().toString(36)}`;
            const newComp = {
              id: compId,
              name: (body.name || `${nation.name} Corp`).trim(),
              hqCountry: nation.name,
              flagshipGood: body.flagshipGood || "Tools",
              gdpSector: "Industry & Manufacturing GDP",
              hypeFactor: Number(body.hypeFactor) || 50,
              valuation: 0,
              vgp: 0,
              employedPops: Math.max(1, Number(body.employedPops) || 25000),
              projectedRealGrowth: 0,
              govtOwnedShares: Math.max(0, Number(body.govtOwnedShares) || 0),
              numberOfShares: Math.max(1, Number(body.numberOfShares) || 50000000),
              dividendEfficiency: Number(body.dividendEfficiency) ?? 0.6,
              dividendsPerShare: 0,
              productionMethod: "Tools",
              subsidised: Boolean(body.subsidised),
              targetGrowth: Number(body.targetGrowth) || 0.03,
              illegal: false,
            };
            nation.companies.unshift(newComp);
            evaluateSimulation(sess.state);
            await saveStateToD1(db, sess);
            await logActivity(
              db,
              sessionId,
              body.actor,
              `Incorporated ${newComp.name}`,
              nation.name
            );
            return jsonResponse({
              session: sess,
              company: newComp,
              activityLog: await getActivityLog(db, sessionId, 60),
            });
          }

          if (companyId && request.method === "PATCH") {
            const { actor, ...updates } = await request.json();
            const comp = nation.companies.find((c) => c.id === companyId);
            if (!comp) return jsonResponse({ error: "Company not found" }, 404);
            Object.assign(comp, updates);
            evaluateSimulation(sess.state);
            await saveStateToD1(db, sess);
            await logActivity(
              db,
              sessionId,
              actor,
              `Updated ${comp.name}`,
              nation.name
            );
            return jsonResponse({
              session: sess,
              company: comp,
              activityLog: await getActivityLog(db, sessionId, 60),
            });
          }

          if (companyId && request.method === "DELETE") {
            const body = await request.json().catch(() => ({}));
            nation.companies = nation.companies.filter((c) => c.id !== companyId);
            evaluateSimulation(sess.state);
            await saveStateToD1(db, sess);
            await logActivity(
              db,
              sessionId,
              body.actor,
              `Liquidated Company`,
              nation.name
            );
            return jsonResponse({
              session: sess,
              activityLog: await getActivityLog(db, sessionId, 60),
            });
          }
        }

        // Market subroute: PATCH /api/sessions/:id/nations/:nationId/market
        if (parts[5] === "market" && request.method === "PATCH") {
          const { goodName, updates, bulkUpdate, actor } = await request.json();
          if (bulkUpdate) {
            const sectorGoodSet = new Set(
              (sess.state.goodsCatalog || [])
                .filter(
                  (g) => !bulkUpdate.sector || g.sector === bulkUpdate.sector
                )
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
              }
            }
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
            Object.assign(mItem, updates);
          }
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            actor,
            `Updated Market (${nation.name})`,
            goodName || "Bulk Policy"
          );
          return jsonResponse({
            session: sess,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }
      }

      // PATCH /api/sessions/:id/director-config
      if (parts[3] === "director-config" && request.method === "PATCH") {
        const body = await request.json().catch(() => ({}));
        const { actor, planetsConfig, powerBlocs, actionType, blocData, planetData } = body;

        if (planetsConfig) sess.state.planetsConfig = planetsConfig;
        if (powerBlocs) sess.state.powerBlocs = powerBlocs;

        if (actionType === "SAVE_BLOC" && blocData) {
          sess.state.powerBlocs = sess.state.powerBlocs || [];
          const idx = sess.state.powerBlocs.findIndex((b) => b.id === blocData.id);
          if (idx >= 0) {
            sess.state.powerBlocs[idx] = { ...sess.state.powerBlocs[idx], ...blocData };
          } else {
            sess.state.powerBlocs.push({
              id: blocData.id || `bloc_${Date.now().toString(36)}`,
              name: blocData.name || "New Power Bloc",
              type: blocData.type || "TRADE_LEAGUE",
              leaderNationId: blocData.leaderNationId || "usa",
              memberNationIds: blocData.memberNationIds || ["usa"],
              cohesion: Number(blocData.cohesion) || 80,
              customsUnion: Boolean(blocData.customsUnion),
              defensivePact: Boolean(blocData.defensivePact),
              mandate: blocData.mandate || "Mutual economic growth and defense.",
              federalContributionRate: Number(blocData.federalContributionRate) || 0.08,
            });
          }
        }

        if (actionType === "DELETE_BLOC") {
          const targetId = body.blocId || blocData?.id;
          if (targetId) {
            sess.state.powerBlocs = (sess.state.powerBlocs || []).filter((b) => b.id !== targetId);
          }
        }

        if (actionType === "SAVE_PLANET" && planetData) {
          sess.state.planetsConfig = sess.state.planetsConfig || [];
          const idx = sess.state.planetsConfig.findIndex((p) => p.id === planetData.id || p.name === planetData.name);
          if (idx >= 0) {
            sess.state.planetsConfig[idx] = { ...sess.state.planetsConfig[idx], ...planetData };
          } else {
            sess.state.planetsConfig.push({
              id: planetData.id || planetData.name,
              name: planetData.name || "New Planet",
              description: planetData.description || "Orbital or planetary territory.",
              freightTariffRate: Number(planetData.freightTariffRate) || 0.1,
              transitDays: Number(planetData.transitDays) || 30,
              habitability: Number(planetData.habitability) || 0.5,
              independenceDesire: Number(planetData.independenceDesire) || 25,
            });
          }
        }

        if (actionType === "DELETE_PLANET") {
          const targetId = body.planetId || planetData?.id || planetData?.name;
          if (targetId) {
            const lowerTarget = String(targetId).toLowerCase().trim();
            const existing = (sess.state.planetsConfig || []).find(
              (p) =>
                String(p.id).toLowerCase() === lowerTarget ||
                p.name?.toLowerCase() === lowerTarget ||
                p.name?.toLowerCase().includes(lowerTarget)
            );
            const planetName = existing?.name || targetId;

            sess.state.planetsConfig = (sess.state.planetsConfig || []).filter(
              (p) =>
                String(p.id).toLowerCase() !== lowerTarget &&
                p.name?.toLowerCase() !== lowerTarget &&
                !p.name?.toLowerCase().includes(lowerTarget)
            );

            const fallbackPlanet = sess.state.planetsConfig[0]?.name || "Earth";
            (sess.state.nations || []).forEach((n) => {
              if (
                (n.planet || "").toLowerCase() === String(planetName).toLowerCase() ||
                (n.planet || "").toLowerCase().includes(lowerTarget)
              ) {
                n.planet = fallbackPlanet;
              }
            });

            sess.state.planetsSummary = (sess.state.planetsSummary || []).filter(
              (p) =>
                p.name?.toLowerCase() !== String(planetName).toLowerCase() &&
                !p.name?.toLowerCase().includes(lowerTarget)
            );
          }
        }

        let toastMessage = "Updated Director Configuration";

        // Helper action: apply historical era borders (500 BC to 2026)
        if (actionType === "APPLY_HISTORICAL_ERA" || body.eraId || body.historicalDate) {
          const eraResult = applyHistoricalEra(
            sess.state,
            body.eraId || body.historicalDate
          );
          toastMessage = eraResult.toastMessage || eraResult.action;
        }

        evaluateSimulation(sess.state);
        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor || "Director",
          toastMessage,
          `Planets: ${sess.state.planetsConfig?.length || 0}, Blocs: ${sess.state.powerBlocs?.length || 0}`
        );
        return jsonResponse({
          session: sess,
          toastMessage,
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // PATCH /api/sessions/:id/companion
      if (parts[3] === "companion" && request.method === "PATCH") {
        const { techEraName, unlocked, sectorName, sentiment, kFactorBonus, actor } =
          await request.json();
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
        evaluateSimulation(sess.state);
        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor,
          `Updated Companion Settings`,
          techEraName || sectorName || ""
        );
        return jsonResponse({
          session: sess,
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // POST /api/sessions/:id/parties
      if (parts[3] === "parties" && request.method === "POST") {
        const { actor, ...partyData } = await request.json();
        const existing = sess.state.politicalParties.find(
          (p) => p.name.toLowerCase() === (partyData.name || "").toLowerCase()
        );
        if (existing) {
          Object.assign(existing, partyData);
        } else {
          sess.state.politicalParties.push(partyData);
        }
        evaluateSimulation(sess.state);
        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor,
          `Updated Political Party: ${partyData.name}`,
          ""
        );
        return jsonResponse({
          session: sess,
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // Stock Exchange Accounts: /api/sessions/:id/stock-accounts...
      if (parts[3] === "stock-accounts") {
        const accountId = parts[4];
        if (!accountId && request.method === "POST") {
          const { holderName, cashBalance = 10000000000, actor } =
            await request.json();
          const newAcc = {
            id: `acc_${Date.now().toString(36)}`,
            holderName: (holderName || "Investor").trim(),
            dividendPot: 0,
            cashBalance: Number(cashBalance) || 10000000000,
            holdings: [],
          };
          sess.state.stockAccounts.push(newAcc);
          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            actor,
            `Opened Brokerage Account: ${newAcc.holderName}`,
            ""
          );
          return jsonResponse({
            session: sess,
            account: newAcc,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }

        if (accountId && parts[5] === "trade" && request.method === "POST") {
          const acc = sess.state.stockAccounts.find((a) => a.id === accountId);
          if (!acc) return jsonResponse({ error: "Account not found" }, 404);
          const { action, companyName, hqCountry, units, actor } =
            await request.json();

          if (action === "CLAIM_DIVIDENDS") {
            acc.cashBalance =
              (Number(acc.cashBalance) || 0) + (Number(acc.dividendPot) || 0);
            acc.dividendPot = 0;
          } else {
            const nation = sess.state.nations.find(
              (n) => n.name.toLowerCase() === (hqCountry || "").toLowerCase()
            );
            const comp = nation?.companies?.find(
              (c) => c.name.toLowerCase() === (companyName || "").toLowerCase()
            );
            if (!comp)
              return jsonResponse({ error: "Target company not found" }, 404);

            const numUnits = Math.max(0, Number(units) || 0);
            const sharePrice =
              Number(comp.sharePrice) ||
              Number(comp.valuation) / Math.max(1, comp.numberOfShares);
            const totalCost = numUnits * sharePrice;

            let holding = acc.holdings.find(
              (h) =>
                h.companyName.toLowerCase() === comp.name.toLowerCase() &&
                h.hqCountry.toLowerCase() === nation.name.toLowerCase()
            );

            if (action === "BUY") {
              acc.cashBalance = (Number(acc.cashBalance) || 0) - totalCost;
              if (holding) holding.units += numUnits;
              else
                acc.holdings.push({
                  companyName: comp.name,
                  hqCountry: nation.name,
                  units: numUnits,
                });
            } else if (action === "SELL") {
              if (!holding || holding.units < numUnits) {
                return jsonResponse(
                  { error: "Insufficient shares in portfolio" },
                  400
                );
              }
              holding.units -= numUnits;
              acc.cashBalance = (Number(acc.cashBalance) || 0) + totalCost;
              if (holding.units <= 0) {
                acc.holdings = acc.holdings.filter((h) => h !== holding);
              }
            }
          }

          evaluateSimulation(sess.state);
          await saveStateToD1(db, sess);
          await logActivity(
            db,
            sessionId,
            actor || acc.holderName,
            `Stock Trade (${action})`,
            companyName || "Claimed Dividends"
          );
          return jsonResponse({
            session: sess,
            activityLog: await getActivityLog(db, sessionId, 60),
          });
        }
      }

      // POST /api/sessions/:id/territories (Dynamic Border Changes)
      if (parts[3] === "territories" && request.method === "POST") {
        const { territoryName, targetNationId, mode = "ANNEX", planet = "Earth", actor } =
          await request.json();
        const result = transferTerritory(sess.state, {
          territoryName,
          targetNationId,
          mode,
          planet,
        });
        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor,
          result.action,
          `Territory: ${territoryName}`
        );
        return jsonResponse({
          session: sess,
          nationId: result.nationId,
          toastMessage: result.action,
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      // POST /api/sessions/:id/statecraft or /api/sessions/:id/victoria (Elections, Laws, Construction, Gazette & Dilemmas)
      if ((parts[3] === "statecraft" || parts[3] === "victoria") && request.method === "POST") {
        const body = await request.json();
        const { type, actor } = body;
        let result = { action: "Updated statecraft", toastMessage: null };

        if (type === "ELECTION_ACTION") {
          result = triggerElectionAction(sess.state, body);
        } else if (type === "LAW_ACTION") {
          result = triggerLawAction(sess.state, body);
        } else if (type === "QUEUE_CONSTRUCTION") {
          result = queueConstruction(sess.state, body);
        } else if (type === "RESOLVE_DILEMMA") {
          result = resolveNewsDilemma(sess.state, body);
        } else if (type === "PUBLISH_NEWS") {
          result = publishCustomNews(sess.state, body);
        } else if (type === "SET_START_DATE") {
          result = setCustomStartDate(sess.state, body);
        }

        evaluateSimulation(sess.state);
        await saveStateToD1(db, sess);
        await logActivity(
          db,
          sessionId,
          actor,
          result.action,
          type || "Statecraft"
        );
        return jsonResponse({
          session: sess,
          toastMessage: result.toastMessage || result.action,
          activityLog: await getActivityLog(db, sessionId, 60),
        });
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      return jsonResponse({ error: err.message || "Internal error" }, 500);
    }
  },
};

