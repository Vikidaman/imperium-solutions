// Authoritative Historical Sources, Empirical Datasets & Academic Citations
// Powers the Imperium World Simulator's long-run historical eras, Leontief input-output matrices,
// USGS/EIA/USDA empirical endowments, and BEA regional accounts.

export const HISTORICAL_SOURCES = [
  {
    id: "maddison",
    title: "The Maddison Project Database (Historical World GDP & Demographics)",
    category: "Historical Eras & Macroeconomics",
    institution: "Groningen Growth and Development Centre (GGDC), University of Groningen",
    authors: "Angus Maddison (2007); Jutta Bolt & Jan Luiten van Zanden (2020)",
    citation:
      "Bolt, J., & van Zanden, J. L. (2020). Maddison Project Database, version 2020. Groningen Growth and Development Centre, University of Groningen. Maddison, A. (2007). Contours of the World Economy 1–2030 AD: Essays in Macro-Economic History. Oxford University Press.",
    url: "https://www.rug.nl/ggdc/historicaldevelopment/maddison/",
    iconName: "Calendar",
    color: "#f59e0b",
    summary:
      "The definitive global authority on long-run macroeconomic history, providing historical estimates of GDP per capita (in 1990 Geary-Khamis USD and 2011 USD PPP), population, and urbanization from classical antiquity to the present.",
    usedFor: [
      "500 BC Classical Antiquity: Population baselines for Achaemenid Persia (35M), Roman Republic (4.2M), and Hellenic Poleis (3.8M).",
      "117 AD Roman Empire Peak: Trajanic Roman Empire demographic and monetary calibration.",
      "1000 AD Medieval World: Song Dynasty China economic output and urbanization ratios.",
      "1776 Enlightenment & 1836 Early Industrial: Pre-industrial labor productivity, subsistence thresholds, and regional GDP accounting.",
      "1939 World War II: Global industrial output benchmarks and military mobilization constraints.",
    ],
  },
  {
    id: "leontief",
    title: "Leontief Inter-Industry Input-Output Economics",
    category: "Input-Output & Production Architecture",
    institution: "Harvard University / U.S. Bureau of Economic Analysis (BEA)",
    authors: "Wassily Leontief (Nobel Memorial Prize in Economic Sciences, 1973)",
    citation:
      "Leontief, W. (1986). Input-Output Economics (2nd ed.). Oxford University Press. U.S. Bureau of Economic Analysis. (2022). Benchmark Input-Output Accounts of the United States. U.S. Department of Commerce.",
    url: "https://www.bea.gov/industry/input-output-accounts-data",
    iconName: "Layers",
    color: "#06b6d4",
    summary:
      "Nobel Prize-winning structural economics modeling the technological dependencies of complex industrial economies through matrices of direct intermediate requirements.",
    usedFor: [
      "52-Sector Leontief Matrix: Simulates how raw materials (crude petroleum, iron ore, copper, grain) cascade through intermediate heavy manufacturing (steel, plastics, industrial chemicals) into final goods.",
      "Technological Input Coefficients: Calculates required input quantities for industrial machinery, motor vehicles, aerospace, electronics, and pharmaceuticals.",
      "Supply Chain Cascades & Shortage Propagation: Accurately reflects how disruptions in upstream commodities (e.g. oil or semiconductors) throttle downstream consumer and capital goods output.",
    ],
  },
  {
    id: "usgs",
    title: "USGS Mineral Commodity Summaries & National Minerals Information",
    category: "Geological & Critical Mineral Resources",
    institution: "United States Geological Survey (USGS), U.S. Department of the Interior",
    authors: "National Minerals Information Center",
    citation:
      "U.S. Geological Survey. (2024). Mineral Commodity Summaries 2024. U.S. Geological Survey, Reston, Virginia. https://doi.org/10.3133/mcs2024",
    url: "https://www.usgs.gov/centers/national-minerals-information-center",
    iconName: "Pickaxe",
    color: "#a855f7",
    summary:
      "The authoritative annual review of domestic and international mineral reserves, active mine operations, refining facilities, and strategic non-fuel mineral resources.",
    usedFor: [
      "All 50 US State Mineral Indices: Calibrated to USGS mine production data across base, precious, and critical minerals.",
      "Nevada Lithium Reserves: Silver Peak brine operations and McDermitt Caldera deposit profiling (100% mineral index).",
      "Minnesota Mesabi Iron Range: Taconite pellet mining and Great Lakes ore shipment corridors (94% mineral index).",
      "Arizona Porphyry Copper: Morenci, Bagdad, and Safford copper basins (92% mineral index).",
      "California Mountain Pass: Domestic Rare Earth Elements (REE) bastnäsite extraction.",
    ],
  },
  {
    id: "eia",
    title: "EIA State Energy Data System (SEDS) & Petroleum Statistics",
    category: "Energy & Hydrocarbons",
    institution: "U.S. Energy Information Administration (EIA), U.S. Department of Energy",
    authors: "Office of Energy Analysis",
    citation:
      "U.S. Energy Information Administration. (2024). State Energy Data System (SEDS): 1960–2022. U.S. Department of Energy, Washington, DC. https://www.eia.gov/state/seds/",
    url: "https://www.eia.gov/state/seds/",
    iconName: "Fuel",
    color: "#f59e0b",
    summary:
      "Comprehensive state-level historical and current database of energy production, consumption, petroleum refining capacity, pipeline receipts, and electricity generation.",
    usedFor: [
      "State Hydrocarbon Endowments: Real-world empirical indices for Texas Permian/Eagle Ford (100%), Alaska North Slope (96%), Louisiana offshore/refineries (92%), North Dakota Bakken (88%), and Pennsylvania Marcellus shale (82%).",
      "Strict Zero Baseline: Enforces zero-reserve reality for non-producing states (e.g. Vermont, Maine, Hawaii) rather than generic regional averages.",
      "Benchmark Energy Prices: Henry Hub natural gas ($2.12/MMBtu) and commercial electricity rates ($0.12/kWh).",
    ],
  },
  {
    id: "usda",
    title: "USDA NASS Census of Agriculture & Agricultural Price Reports",
    category: "Agriculture & Agro-Industrial Production",
    institution: "National Agricultural Statistics Service (NASS), U.S. Department of Agriculture",
    authors: "Agricultural Statistics Board",
    citation:
      "U.S. Department of Agriculture, National Agricultural Statistics Service. (2024). 2022 Census of Agriculture: United States Summary and State Data. Volume 1, Geographic Area Series, Part 51.",
    url: "https://www.nass.usda.gov/Publications/AgCensus/2022/",
    iconName: "Wheat",
    color: "#10b981",
    summary:
      "Authoritative quinquennial census of American agricultural land, total harvested acreage, cash receipts by commodity, and soil classification quality.",
    usedFor: [
      "State Arable Land Indices: Empirically grounds Iowa Corn Belt (98%), Kansas Wheat Belt (94%), Illinois Prairie Basin (92%), and California Central Valley (90%).",
      "Commodity Output Anchors: Kansas hard red winter wheat, Iowa feed grain/soybeans, and California specialty fruits, nuts, and vegetables.",
      "Agricultural Price Benchmarks: Corn ($4.15/bushel), Wheat ($5.48/bushel), Soybeans ($10.20/bushel), and Milk ($21.80/cwt).",
    ],
  },
  {
    id: "bea",
    title: "BEA Regional Economic Accounts (Gross Domestic Product by State)",
    category: "Services & Regional Economics",
    institution: "Bureau of Economic Analysis (BEA), U.S. Department of Commerce",
    authors: "Regional Product and Income Division",
    citation:
      "U.S. Bureau of Economic Analysis. (2024). Gross Domestic Product by State and Industry, 4th Quarter 2023 and Annual 2023. U.S. Department of Commerce, Washington, DC.",
    url: "https://www.bea.gov/data/gdp/gdp-state",
    iconName: "Landmark",
    color: "#38bdf8",
    summary:
      "Official government measure of economic output produced across each of the 50 states, subdivided across 21 primary, secondary, and tertiary industry sectors.",
    usedFor: [
      "Modern US GDP Calibration: Grounds total US annual output to empirical ~$27.4T, New York to $2.16T (8.2%), California to $3.89T (14.7%), Texas to $2.56T (9.6%), and Kansas to $226B (0.81%).",
      "Services Economy Specialization: Empirical calibration of Financial Depth (NY 100%, IL 86%, NC 85%), Tech/STEM Talent (CA 98%, MA 98%, WA 94%), and Hospitality (NV 100%, FL 95%, HI 92%).",
    ],
  },
  {
    id: "agglomeration",
    title: "New Economic Geography & Super-Linear Agglomeration Scaling",
    category: "Services & Regional Economics",
    institution: "Santa Fe Institute / Princeton University / MIT",
    authors: "Luís M. A. Bettencourt, José Lobo, Dirk Helbing, Christian Kühnert, Geoffrey B. West; Paul Krugman",
    citation:
      "Bettencourt, L. M. A., Lobo, J., Helbing, D., Kühnert, C., & West, G. B. (2007). Growth, innovation, scaling, and the pace of life in cities. Proceedings of the National Academy of Sciences (PNAS), 104(17), 7301–7306. Krugman, P. (1991). Geography and Trade. MIT Press.",
    url: "https://doi.org/10.1073/pnas.0610172104",
    iconName: "Building2",
    color: "#6366f1",
    summary:
      "Empirical discovery that modern knowledge-intensive and financial services exhibit super-linear increasing returns to scale (exponent α ≈ 1.15) with population density, while local consumer amenities exhibit sub-linear returns.",
    usedFor: [
      "Super-Linear Services Engine: Simulates agglomeration premiums in major metropolitan hubs (Silicon Valley, NYC Financial District, Seattle Cloud Hub, Boston Biotech Corridor).",
      "Labor Partitioning: Differentiates high-margin tradable professional services from localized non-tradable consumer services.",
    ],
  },
  {
    id: "usace_bts",
    title: "USACE Waterborne Commerce & BTS Freight Transportation Data",
    category: "Logistics, Ports & Freight Transit",
    institution: "US Army Corps of Engineers (USACE) & Bureau of Transportation Statistics (BTS)",
    authors: "Waterborne Commerce Statistics Center, Navigation Data Center",
    citation:
      "U.S. Army Corps of Engineers. (2023). Waterborne Commerce of the United States (WCUS): Calendar Year 2022. Part 5: National Summaries. Bureau of Transportation Statistics. (2024). Freight Transportation Services Index (TSI). U.S. Department of Transportation.",
    url: "https://www.navigationdatacenter.us/wcsc/wcsc.htm",
    iconName: "Anchor",
    color: "#0284c7",
    summary:
      "Primary record of all domestic waterborne cargo tonnage, container throughput (TEUs), maritime port rankings, and inland waterway lock operations.",
    usedFor: [
      "State Maritime Logistics Indices: Calibrated to cargo tonnage across Port of South Louisiana (98%), Port of Houston (96%), Port of NY & NJ (92%), and Port of Long Beach/LA (92%).",
      "Crisis Port Destruction Simulation: Dynamically models freight throughput contraction when major maritime gateways are disrupted (e.g. Hurricane Katrina port devastation).",
    ],
  },
  {
    id: "world_bank",
    title: "World Bank Commodity Markets ('The Pink Sheet')",
    category: "Commodity Benchmarks & Markets",
    institution: "World Bank Group, Prospects Group",
    authors: "Development Prospects Group",
    citation:
      "World Bank. (2024). Commodity Markets Outlook: Forces Behind the Swings. World Bank, Washington, DC. License: Creative Commons Attribution CC BY 3.0 IGO.",
    url: "https://www.worldbank.org/en/research/commodity-markets",
    iconName: "BarChart3",
    color: "#14b8a6",
    summary:
      "Global monthly benchmark price dataset for 46 internationally traded commodities covering energy, metals, fertilizers, food, and agricultural raw materials.",
    usedFor: [
      "Empirical Price Catalog: Provides real-world baseline pricing for crude oil ($82.50/bbl), iron ore ($96.30/dmtu), copper ($9,200/mt), gold ($2,650/oz), aluminum ($2,450/mt), and agricultural grains.",
      "Input-Output Monetary Anchors: Ensures the simulator's micro-transactions adhere strictly to real global commodity valuations.",
    ],
  },
  {
    id: "natural_earth",
    title: "Natural Earth Digital Boundary Cartography & OpenStreetMap",
    category: "Cartography & Administrative Boundaries",
    institution: "Natural Earth & OpenStreetMap Foundation",
    authors: "Tom Patterson, Nathaniel Vaughn Kelso, and OpenStreetMap Contributors",
    citation:
      "Natural Earth. (2024). 1:10m and 1:50m Cultural Vectors: Admin-1 States, Provinces, and Territories (Version 5.1.0). OpenStreetMap Contributors. (2024). Planet dump [Data file from OpenStreetMap]. Licensed under ODbL.",
    url: "https://www.naturalearthdata.com/",
    iconName: "Globe",
    color: "#22c55e",
    summary:
      "Public-domain, high-fidelity digital vector cartography providing 1st-order subnational administrative polygons (ADM1) for 240+ countries and sovereign territories worldwide.",
    usedFor: [
      "ADM1 Multi-Country Cartography: High-resolution borders for 50 US states, 26 DRC provinces, 47 Japanese prefectures, and sovereign global divisions.",
      "Interactive Choropleth Visualizations: Multi-provider basemaps powered by CartoDB (Dark Matter/Voyager), Esri World Imagery, and OpenStreetMap.",
    ],
  },
  {
    id: "bls_census",
    title: "U.S. Bureau of Labor Statistics (BLS) & Census Bureau ACS",
    category: "Labor Economics, Demographics & Human Capital",
    institution: "U.S. Bureau of Labor Statistics & U.S. Census Bureau",
    authors: "Office of Employment and Unemployment Statistics",
    citation:
      "U.S. Bureau of Labor Statistics. (2024). Occupational Employment and Wage Statistics (OEWS). U.S. Census Bureau. (2023). American Community Survey (ACS) 5-Year Data (2018–2022).",
    url: "https://www.bls.gov/oes/",
    iconName: "GraduationCap",
    color: "#ec4899",
    summary:
      "Comprehensive empirical sources for occupational employment distributions, STEM degree attainment, median weekly earnings, and consumer price indexes.",
    usedFor: [
      "Human Capital / STEM Index: Percentage of population with advanced degrees, scientific research appointments, and technology labor force shares.",
      "Producer Price Indexes (PPI): Heavy industrial equipment, motor vehicle assembly, semiconductor manufacturing, and structural metal fabrication.",
    ],
  },
];
