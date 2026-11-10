# Imperium Solutions — Interstellar 2.0 Crisis & Macroeconomic Simulator

**Imperium Solutions (Interstellar 2.0)** is a full-stack macroeconomic, geopolitical, and statecraft crisis simulation platform. Built on empirical macroeconomic formulas, geographic resource endowments, historical era baselines (1836–2050+), and Victoria-inspired statecraft mechanics, it enables real-time multi-nation simulation, policy modeling, sovereign debt management, supply-chain analysis, and AI-driven economic shock testing.

---

## Key Features

### 1. Interactive Geopolitical & Sub-National Mapping
- **Planetary & Sovereign Overview**: Interactive world map powered by `d3-geo`, `leaflet`, and TopoJSON (`world-atlas` / `us-atlas`).
- **ADM1 & US State Drill-Down**: Sub-national regional boundaries (`CountryAdm1Map`), state-level geographic production endowments, and territorial transfer / annexation mechanics.
- **Historical Era Baselines**: Jump across historical eras (`1836` to modern and future scenarios) with calibrated technological eras, demographic baselines, and historical data sources.

### 2. Macroeconomic & Supply Chain Engine
- **Empirical Commodity & Production Engine**: Models primary resources, industrial goods, and tech-era tool inputs (`Wood`, `Stone`, `Iron`, `Steel`, `Semi-Conductor`, `Atomic`, `Internet`, `AI`, `Space Age`) alongside World Bank Pink Sheet price benchmarks.
- **Services & Agglomeration Engine**: Super-linear urban agglomeration, financial/consumer services production, and state-level service endowments.
- **Econometric GDP Forecaster**: Computes baseline GDP growth, structural adjustments, crisis adjustments, and 80%/95% confidence intervals (`forecastingEngine.js`).
- **Corporations & Equities Registry**: Track corporate performance, stock valuations, dividends, and sector supply chains.

### 3. Victoria Statecraft, Legislation & Monetary Policy
- **Law & Policy Catalog**: Enact laws across taxation, policing, healthcare, trade, labor, and governance with dynamic modifiers on stability, mortality, crime, and productivity.
- **Central Banking & Sovereign Debt**: Set national policy interest rates, manage sovereign credit ratings, and issue or repay sovereign bonds.
- **Elections, Political Parties & News Dilemmas**: Trigger national elections, manage party coalitions, queue state construction projects, and resolve interactive crisis news dilemmas.

### 4. AI Economic Advisor & Shock Simulator
- **Groq LLM Intelligence**: Powered by Groq inference (`openai/gpt-oss-120b` with automatic fallback to `qwen/qwen3.8-27b`) to generate real-time macroeconomic advisory reports and simulate custom economic shocks with state restoration support.

### 5. Director Portal & Ledger Time-Travel
- **Protected Director Mode**: Read-only public spectator view by default, with a private Director Portal (`/director` or `?access=director`) secured via Master Password and **Telegram 2FA OTP** authentication.
- **Quarterly Ledger & Rollback**: Automatic snapshots of every simulation quarter, full audit activity logs, and one-click session rollback to any prior point in time.

---

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Recharts, D3-Geo, Leaflet, Lucide Icons
- **Backend (Local / Node)**: Express 5, native Node.js SQLite (`node:sqlite` storing state in `data/imperium.sqlite`)
- **Edge Deployment**: Cloudflare Pages + Cloudflare Workers (`worker.js` / `functions/api/[[route]].js`) + Cloudflare D1 (`imperium-db`)
- **Machine Learning & Data Ingestion**: Python scripts (`ml/` & `scripts/`) for training macroeconomic forecasting weights, empirical commodity prices, and ADM1 boundary ingestion

---

## Project Structure

```text
imperium-solutions/
├── src/
│   ├── components/          # React UI views (Map, Statecraft, Markets, Ledger, Director Portal)
│   ├── data/                # Nations catalog, US state endowments, historical eras, ADM1 mappings
│   ├── services/            # Boundary & geospatial services
│   ├── utils/               # Number & currency formatters
│   ├── App.jsx              # Main application shell & routing
│   └── main.jsx             # React entry point
├── server/
│   ├── index.js             # Express API server & Vite middleware integration
│   ├── engine.js            # Core macroeconomic & simulation formula engine
│   ├── victoriaMechanics.js # Laws, elections, construction, bonds, and news dilemmas
│   ├── statecraftMechanics.js
│   ├── forecastingEngine.js # Econometric GDP growth forecaster
│   ├── geographicProductionEngine.js
│   ├── servicesProductionEngine.js
│   ├── aiEconomicAdvisor.js # Groq LLM advisory & economic shock simulator
│   ├── empiricalPriceCatalog.js
│   └── db.js                # Node.js SQLite persistence layer
├── functions/api/           # Cloudflare Pages Functions API routing
├── worker.js                # Cloudflare Worker & D1 serverless backend
├── ml/                      # Macroeconomic panel datasets & model training scripts
├── scripts/                 # Seed extractors (Excel mastersheets), ADM1 ingestion & auto-sync
├── tests/                   # Node.js test suite (node --test)
├── vite.config.js           # Vite bundler configuration
└── wrangler.jsonc           # Cloudflare Pages & D1 configuration
```

---

## Getting Started

### Prerequisites
- **Node.js** `v22.5.0+` (required for built-in `node:sqlite` support)
- **npm** `v10+`
- *(Optional)* **Python 3.10+** for running ML training or Excel seed extraction scripts in `ml/` and `scripts/`

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables by creating a `.env` file in the project root (all variables are optional for local development):
   ```env
   # Port for local Express + Vite server (default: 3000)
   PORT=3000

   # Director Authentication
   DIRECTOR_MASTER_PASSWORD=imperium-2026
   DIRECTOR_SECRET_KEY=your-optional-static-director-token

   # Telegram 2FA Bot Pairing (can also be paired interactively in the UI)
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id

   # Groq API Key for AI Economic Advisor & Shock Simulation
   GROQ_API_KEY=your-groq-api-key
   ```

### Running Locally

Start the development server (runs Express API + Vite dev middleware on a single port):
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.
- **Public Spectator Mode**: `http://localhost:3000`
- **Director Login Portal**: `http://localhost:3000/?access=director`

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local Express + Vite server in development mode |
| `npm run build` | Builds the production frontend bundle into `dist/` |
| `npm start` | Runs the production server (`NODE_ENV=production node server/index.js`) |
| `npm test` | Runs the automated test suite via `node --test tests/*.test.js` |
| `npm run deploy` | Builds the project and deploys to Cloudflare Pages via Wrangler |
| `npm run sync` | Runs a one-time build, Git commit/push, and Cloudflare Pages deploy |
| `npm run watch:sync` | Watches workspace files and auto-syncs to GitHub & Cloudflare Pages |

---

## Testing

The project uses Node's native test runner (`node:test`) covering macroeconomic formulas, statecraft mechanics, ADM1 boundaries, European sovereignty, AI shock simulation, round progression, and session rollbacks:

```bash
npm test
```

---

## Deployment (Cloudflare Pages & D1)

Production deployments run on **Cloudflare Pages** backed by **Cloudflare D1** (`imperium-db`), configured in `wrangler.jsonc` and `.github/workflows/deploy.yml`.

To deploy manually from your machine:
```bash
npm run deploy
```

