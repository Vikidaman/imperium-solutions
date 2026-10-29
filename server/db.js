import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateSimulation } from "./engine.js";

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

export function loadSeedFile(scenarioType = "interstellar") {
  const seedFile =
    scenarioType === "vietnam"
      ? path.join(__dirname, "..", "scripts", "vietnam_seed.json")
      : path.join(__dirname, "..", "scripts", "interstellar_seed.json");
  const raw = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  raw.strictSheetQuirks = false;
  return evaluateSimulation(raw);
}

export function ensureDefaultSessions() {
  const countRow = db.prepare("SELECT COUNT(*) as cnt FROM sessions").get();
  if (countRow && countRow.cnt > 0) return;

  const now = new Date().toISOString();

  // 1. Interstellar 2.0 Default Session
  const interstellarState = loadSeedFile("interstellar");
  db.prepare(
    `INSERT INTO sessions (id, name, description, scenario_type, state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "interstellar-default",
    "Interstellar 2.0: Earth & Mars Crisis",
    "15 nations across Earth & Mars, 202 tradeable goods, 9 Tech Eras, 7,506 companies, and planetary federations.",
    "interstellar",
    JSON.stringify(interstellarState),
    now,
    now
  );
  recordLedgerSnapshot("interstellar-default", interstellarState);
  logActivity(
    "interstellar-default",
    "System",
    "Initialized Session",
    "Seeded from Interstellar 2.0 Mastersheet.xlsx"
  );

  // 2. Vietnam 1977 Scenario Session
  const vietnamState = loadSeedFile("vietnam");
  db.prepare(
    `INSERT INTO sessions (id, name, description, scenario_type, state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "vietnam-1977",
    "Imperium 1977: Vietnam Reunification",
    "8 Vietnamese regional states, State-Owned Enterprises, Cooperatives, and post-war reconstruction.",
    "vietnam",
    JSON.stringify(vietnamState),
    now,
    now
  );
  recordLedgerSnapshot("vietnam-1977", vietnamState);
  logActivity(
    "vietnam-1977",
    "System",
    "Initialized Session",
    "Seeded from Imperium Solutions Mastersheet.xlsx"
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
  const state = customState
    ? evaluateSimulation(customState)
    : loadSeedFile(scenarioType || "interstellar");
  db.prepare(
    `INSERT INTO sessions (id, name, description, scenario_type, state_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    description || "",
    scenarioType || "interstellar",
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
    .prepare("SELECT scenario_type, name FROM sessions WHERE id = ?")
    .get(sessionId);
  if (!row) return null;
  const freshState = loadSeedFile(row.scenario_type);
  saveSessionState(sessionId, freshState);
  db.prepare("DELETE FROM ledger_history WHERE session_id = ?").run(sessionId);
  recordLedgerSnapshot(sessionId, freshState);
  logActivity(sessionId, "Director", "Reset Scenario", `Reset ${row.name} to initial spreadsheet state`);
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

