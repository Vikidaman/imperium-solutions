# Imperium Solutions — United States Macroeconomic Simulator

**Imperium Solutions** is a streamlined, full-stack **United States Macroeconomic & 50-State Supply Chain Simulator**. Grounded in empirical USGS/EIA/USDA state resource endowments, BEA/BLS services & agglomeration metrics, and a 60-commodity Leontief input-output price model, it provides an interactive sandbox for modeling US fiscal policy, trade tariffs, technological productivity, and state-by-state economic output.

---

## Key Features

### 1. Interactive 50-State Choropleth Map & State Dossier
- **Multi-Layer US Cartography (`CountryAdm1Map.jsx`)**: Powered by `leaflet` and `us-atlas`, featuring interactive map layers for:
  - **Administrative Regions**: All 50 US states, District of Columbia, and US territories with regional GDP and workforce shares.
  - **Natural Resource Endowments**: State-level USGS/EIA/USDA indices for **Hydrocarbons (Oil & Gas)**, **Critical Minerals & Mining**, **Arable Land & Agriculture**, and **Deepwater Ports & Navigable Waterways**, plus point markers for major basins and ports.
  - **Services & Knowledge Capital**: State-level BEA/BLS/NSF indices for **High-Tech & Digital Infrastructure**, **Capital Markets & Finance**, **STEM & University Talent**, and **Hospitality & Tourism**, plus point markers for major metro clusters.
- **50-State Registry & Filter Table**: Search, filter, and sort all US states by State GDP, Workforce, Energy, Minerals, Agriculture, High-Tech, or Finance.

### 2. US Macroeconomic & Fiscal Policy Cabinet
- **Real-Time Policy Sliders (`InteractiveWorldMap.jsx`)**:
  - **Fiscal Policy**: Federal Income Tax, Corporate Profits Tax, National Sales/Consumption Tax, Labor Share of GDP, and Federal Expenditure Target (% of GDP).
  - **Structural Drivers**: Infrastructure & Logistics Efficiency, Workforce Literacy & Education, Urban Agglomeration, Household Consumer Sentiment, and Total Factor Productivity (`K-Factor`).
- **4-Sector GDP & Distributional Analytics**:
  - Tracks **Agriculture & Extraction**, **Manufacturing & Industry**, **Hospitality & Retail**, and **Corporate Finance & Tech Services**.
  - Models 3 household income cohorts (**Low-Income**, **Middle Class**, **Upper Class**), Gini inequality, inflation, and a 1-year Econometric GDP Growth Forecast (`forecastingEngine.js`).

### 3. 60-Commodity Leontief Supply Chain & Tech Tree
- **US Supply Chain Flow (`MarketsAndTechView.jsx`)**: Inspect upstream inputs, domestic clearing prices, world benchmark prices (`empiricalPriceCatalog.js`), import/export tariffs, and domestic demand multipliers across 60 core commodities.
- **9 Technological Epochs**: Toggle technological eras (`Wooden Tools` through `AI` and `Space Age`) and adjust sector-wide value-added productivity multipliers.

### 4. Quarterly Ledger, Time Controls & Director Portal
- **Quarterly Simulation Cycle (`LedgerAndTimeView.jsx`)**: Advance the US economy by 1 month, 1 quarter (90 days), or 1 year, or run the real-time auto-clock.
- **Snapshots & One-Click Rollback**: Export/import simulation JSON snapshots or roll back the session to any previous quarter.
- **Spectator & Director Modes**: Read-only public spectator mode by default, with a private Director Login Portal (`/?access=director`) protected by Master Password and optional **Telegram 2FA OTP**.

---

## Project Structure

```text
imperium-solutions/
├── src/
│   ├── components/
│   │   ├── InteractiveWorldMap.jsx  # US 50-State Map, State Dossier & Macro Policy Cabinet
│   │   ├── CountryAdm1Map.jsx       # Leaflet US Choropleth Map (States, Resources, Services)
│   │   ├── MarketsAndTechView.jsx   # 60-Commodity Supply Chain, Tariffs & Tech Eras
│   │   ├── LedgerAndTimeView.jsx    # Simulation Clock, Historical Charts & Rollback
│   │   ├── DirectorLoginPortal.jsx  # Director Authentication UI
│   │   └── BufferedRangeSlider.jsx  # Smooth range input control
│   ├── data/
│   │   ├── usStatesData.js          # 50 US States & Territories catalog (capitals, GDP/pop shares)
│   │   ├── usGeographicEndowments.js# Empirical USGS/EIA/USDA state resource endowments
│   │   ├── usServicesEndowments.js  # Empirical BEA/BLS/NSF state services endowments
│   │   └── mapProviders.js          # CartoDB, Esri Satellite & OSM tile configurations
│   ├── utils/
│   │   └── formatters.js            # Currency, compact number & sector badge formatters
│   ├── App.jsx                      # Main 3-tab application shell
│   └── main.jsx                     # React entry point
├── server/
│   ├── index.js                     # Express API server & Vite middleware
│   ├── engine.js                    # Core US macroeconomic & Leontief input-output engine
│   ├── simplifiedSeedConfig.js      # 60-good catalog & United States baseline seed builder
│   ├── forecastingEngine.js         # Gradient-boosting GDP growth forecaster
│   ├── geographicProductionEngine.js# State natural resource production model
│   ├── servicesProductionEngine.js  # Super-linear urban agglomeration & services model
│   ├── empiricalPriceCatalog.js     # World Bank Pink Sheet & BEA commodity price anchors
│   └── db.js                        # Node.js SQLite persistence layer
├── worker.js                        # Cloudflare Worker & D1 serverless backend
├── tests/                           # Automated Node.js test suite (node --test)
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** `v22.5.0+` (uses built-in `node:sqlite` and `node:test`)
- **npm** `v10+`

### Installation & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser:
   - **Spectator View**: `http://localhost:3000`
   - **Director Portal**: `http://localhost:3000/?access=director`

### Running Tests

Run the automated test suite covering US geographic endowments, services agglomeration, macroeconomic formulas, round progression, and session rollbacks:
```bash
npm test
```
