import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const WATCH_PATHS = [
  "src",
  "server",
  "worker.js",
  "index.html",
  "vite.config.js",
  "wrangler.jsonc",
  "package.json",
  ".github",
];

let debounceTimer = null;
let isSyncing = false;
let pendingSync = false;

function runSync(reason = "File change detected") {
  if (isSyncing) {
    pendingSync = true;
    return;
  }
  isSyncing = true;
  console.log(`\n[Auto-Sync] ${new Date().toISOString()} — ${reason}`);

  try {
    const status = execSync("git status --porcelain", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();

    if (!status) {
      console.log("[Auto-Sync] Working tree clean, nothing to sync.");
      isSyncing = false;
      return;
    }

    console.log("[Auto-Sync] 1/3 Building frontend bundle (npm run build)...");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

    console.log("[Auto-Sync] 2/3 Committing & pushing to GitHub (origin/main)...");
    execSync("git add -A", { cwd: ROOT, stdio: "inherit" });
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    execSync(`git commit -m "Auto-sync: workspace update (${timestamp})"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });

    console.log("[Auto-Sync] 3/3 Deploying to Cloudflare Workers (wrangler deploy)...");
    execSync("npx wrangler deploy", { cwd: ROOT, stdio: "inherit" });

    console.log(
      "[Auto-Sync] ✅ Successfully synced workspace to GitHub & Cloudflare!"
    );
  } catch (err) {
    console.error("[Auto-Sync] Error during sync:", err.message);
  } finally {
    isSyncing = false;
    if (pendingSync) {
      pendingSync = false;
      scheduleSync("Follow-up changes queued during previous sync");
    }
  }
}

function scheduleSync(fileInfo) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSync(`Modified: ${fileInfo}`);
  }, 4000);
}

// Run one immediate check if --once is passed
if (process.argv.includes("--once")) {
  runSync("Manual sync trigger");
  process.exit(0);
}

console.log(
  "[Auto-Sync] Watching Imperium Solutions workspace for changes (auto-pushes to GitHub & deploys to Cloudflare)..."
);

for (const rel of WATCH_PATHS) {
  const fullPath = path.join(ROOT, rel);
  if (!fs.existsSync(fullPath)) continue;
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
      if (!filename || filename.endsWith("~") || filename.startsWith(".")) return;
      scheduleSync(`${rel}/${filename}`);
    });
  } else {
    fs.watch(fullPath, () => {
      scheduleSync(rel);
    });
  }
}

