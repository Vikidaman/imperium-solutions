import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateSimulation } from "./engine.js";
import { buildSimplifiedSeed } from "./simplifiedSeedConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "imperium.sqlite");
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL,
    state_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ledger_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    quarter INTEGER NOT NULL,
    crisis_date TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS director_auth (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS forecast_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    nation_id TEXT NOT NULL,
    quarter INTEGER NOT NULL,
    sim_date TEXT NOT NULL,
    model_version TEXT NOT NULL,
    baseline_forecast REAL NOT NULL,
    structural_adj REAL NOT NULL,
    crisis_adj REAL NOT NULL,
    final_growth REAL NOT NULL,
    interval_80_lower REAL NOT NULL,
    interval_80_upper REAL NOT NULL,
    interval_95_lower REAL NOT NULL,
    interval_95_upper REAL NOT NULL,
    features_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function getAuthValue(key, fallback = null) {
  const row = db
    .prepare("SELECT value FROM director_auth WHERE key = ?")
    .get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setAuthValue(key, value) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR REPLACE INTO director_auth (key, value, updated_at)
     VALUES (?, ?, ?)`
  ).run(key, JSON.stringify(value), now);
}

export function extractLedgerSnapshot(state) {
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
      workingPops: n.computed?.effectiveWorkingPops || n.workingPops,
    })),
  };
}

export function loadSeedFile() {
  const seedFile = path.join(__dirname, "..", "scripts", "interstellar_seed.json");
  let raw = {};
  if (fs.existsSync(seedFile)) {
    raw = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  }
  const cleanSeed = buildSimplifiedSeed(raw);
  return evaluateSimulation(cleanSeed);
}

export function ensureDefaultSessions() {
  // Remove legacy Vietnam session if present
  db.prepare("DELETE FROM sessions WHERE id = 'vietnam-1977'").run();

  const existing = db
    .prepare("SELECT state_json FROM sessions WHERE id = 'interstellar-default'")
    .get();

  if (existing) {
    try {
      const parsed = JSON.parse(existing.state_json);
      if ((parsed.nations || []).length > 1) {
        const freshState = loadSeedFile();
        saveSessionState("interstellar-default", freshState);
      }
      return;
    } catch {
      // recreate below
    }
  }

  const now = new Date().toISOString();
  const usaState = loadSeedFile();
  db.prepare(
    `INSERT OR REPLACE INTO sessions (id, name, description, scenario_type, state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "interstellar-default",
    "United States Macroeconomic Simulator",
    "50 US States & Territories, 60 Leontief Input-Output Sectors, Fiscal & Monetary Policy Levers.",
    "usa",
    JSON.stringify(usaState),
    now,
    now
  );
  recordLedgerSnapshot("interstellar-default", usaState);
  logActivity(
    "interstellar-default",
    "System",
    "Initialized Session",
    "Initialized United States 50-State Macroeconomic Baseline"
  );
}

export function listSessions() {
  return db
    .prepare(
      "SELECT id, name, description, scenario_type, created_at, updated_at FROM sessions ORDER BY created_at ASC"
    )
    .all();
}

export function getSession(sessionId) {
  const row = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId);
  if (!row) return null;
  const state = JSON.parse(row.state_json);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    scenarioType: row.scenario_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    state,
  };
}

export function saveSessionState(sessionId, state) {
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE sessions SET state_json = ?, updated_at = ? WHERE id = ?"
  ).run(JSON.stringify(state), now, sessionId);
}

export function createSession({ id, name, description, scenarioType, customState }) {
  const now = new Date().toISOString();
  const state = customState ? evaluateSimulation(customState) : loadSeedFile();
  db.prepare(
    `INSERT INTO sessions (id, name, description, scenario_type, state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    description || "",
    scenarioType || "usa",
    JSON.stringify(state),
    now,
    now
  );
  recordLedgerSnapshot(id, state);
  logActivity(id, "Director", "Created Session", `Created ${name}`);
  return getSession(id);
}

export function resetSessionToSeed(sessionId) {
  const row = db
    .prepare("SELECT name FROM sessions WHERE id = ?")
    .get(sessionId);
  if (!row) return null;
  const freshState = loadSeedFile();
  saveSessionState(sessionId, freshState);
  db.prepare("DELETE FROM ledger_history WHERE session_id = ?").run(sessionId);
  recordLedgerSnapshot(sessionId, freshState);
  logActivity(sessionId, "Director", "Reset Scenario", `Reset ${row.name} to initial US baseline`);
  return getSession(sessionId);
}

export function recordLedgerSnapshot(sessionId, state) {
  const snap = extractLedgerSnapshot(state);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO ledger_history (session_id, quarter, crisis_date, snapshot_json, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, snap.quarter, snap.crisisDate, JSON.stringify(snap), now);
}

export function getLedgerHistory(sessionId) {
  const rows = db
    .prepare(
      "SELECT id, quarter, crisis_date, snapshot_json, created_at FROM ledger_history WHERE session_id = ? ORDER BY id ASC"
    )
    .all(sessionId);
  return rows.map((r) => ({
    id: r.id,
    quarter: r.quarter,
    crisisDate: r.crisis_date,
    createdAt: r.created_at,
    snapshot: JSON.parse(r.snapshot_json),
  }));
}

export function logActivity(sessionId, actor, action, details = "") {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO activity_log (session_id, actor, action, details, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, actor || "Player", action, details, now);
}

export function getActivityLog(sessionId, limit = 50) {
  return db
    .prepare(
      "SELECT id, actor, action, details, created_at FROM activity_log WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    )
    .all(sessionId, limit);
}

export function rollbackSession(sessionId, targetQuarter, targetId) {
  let row;
  if (targetId) {
    row = db
      .prepare("SELECT * FROM ledger_history WHERE session_id = ? AND id = ?")
      .get(sessionId, targetId);
  } else if (targetQuarter != null) {
    row = db
      .prepare(
        "SELECT * FROM ledger_history WHERE session_id = ? AND quarter = ? ORDER BY id DESC LIMIT 1"
      )
      .get(sessionId, targetQuarter);
  }
  if (!row) {
    throw new Error(`Snapshot not found for session ${sessionId}`);
  }
  const snap = JSON.parse(row.snapshot_json);
  snap.version = (snap.version || 0) + 1;
  saveSessionState(sessionId, snap);
  db.prepare("DELETE FROM ledger_history WHERE session_id = ? AND id > ?").run(
    sessionId,
    row.id
  );
  logActivity(
    sessionId,
    "Director",
    "Simulation Rollback",
    `Rolled back to Quarter ${row.quarter} (${row.crisis_date})`
  );
  return {
    id: sessionId,
    state: snap,
    rolledBackTo: row.quarter,
    crisisDate: row.crisis_date,
  };
}

export function recordForecastEntry(sessionId, entry) {
  const stmt = db.prepare(`
    INSERT INTO forecast_history (
      session_id, nation_id, quarter, sim_date, model_version,
      baseline_forecast, structural_adj, crisis_adj, final_growth,
      interval_80_lower, interval_80_upper, interval_95_lower, interval_95_upper,
      features_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    sessionId,
    entry.nationId,
    entry.quarter || 1,
    entry.simDate || "",
    entry.modelVersion || "1.0.0",
    entry.baselineForecast || 0,
    entry.structuralAdj || 0,
    entry.crisisAdj || 0,
    entry.finalGrowth || 0,
    entry.interval80Lower || 0,
    entry.interval80Upper || 0,
    entry.interval95Lower || 0,
    entry.interval95Upper || 0,
    JSON.stringify(entry.features || {}),
    new Date().toISOString()
  );
}

export function getForecastRecords(sessionId, nationId = null, limit = 100) {
  if (nationId) {
    return db
      .prepare(
        "SELECT * FROM forecast_history WHERE session_id = ? AND nation_id = ? ORDER BY id DESC LIMIT ?"
      )
      .all(sessionId, nationId, limit);
  }
  return db
    .prepare(
      "SELECT * FROM forecast_history WHERE session_id = ? ORDER BY id DESC LIMIT ?"
    )
    .all(sessionId, limit);
}
