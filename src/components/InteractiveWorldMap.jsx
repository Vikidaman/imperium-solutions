import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
import usAtlas from "us-atlas/states-10m.json";
import { US_STATES_CATALOG, REGION_TINTS, getUsaStateData } from "../data/usStatesData";
import {
  Globe2,
  Rocket,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sword,
  Flag,
  MousePointer,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Coins,
  Building2,
  ShoppingBag,
  Sliders,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  Layers,
  Compass,
  RotateCcw,
  Trash2,
  PlusCircle,
  CheckCircle2,
  Search,
  ChevronRight,
  Landmark,
  BarChart3,
  PieChart,
  Fuel,
  Pickaxe,
  Wheat,
  Anchor,
  Briefcase,
  Laptop,
  GraduationCap,
  UtensilsCrossed,
  Zap,
  Flame,
  AlertTriangle,
  X,
  Activity,
  FileText,
  RefreshCw,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import BufferedRangeSlider from "./BufferedRangeSlider";
import CountryAdm1Map from "./CountryAdm1Map";
import { ALL_NATIONS_BY_ID, ALL_NATIONS_BY_NAME, ALL_SOVEREIGN_NATIONS, getSovereignNation } from "../data/nationsCatalog";
import { getUsStateEndowment } from "../data/usGeographicEndowments";
import { getUsStateServicesEndowment } from "../data/usServicesEndowments";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
  getShortSectorName,
} from "../utils/formatters";

// Precompute static Earth projection & TopoJSON country geometries ONCE at module load
const STATIC_EARTH_PROJECTION = geoNaturalEarth1()
  .scale(175)
  .translate([480, 265]);
const STATIC_PATH_GEN = geoPath(STATIC_EARTH_PROJECTION);
const STATIC_EARTH_FEATURES = topojson
  .feature(worldAtlas, worldAtlas.objects.countries)
  .features.filter((f) => f.properties.name !== "Antarctica")
  .map((f) => {
    const centroid = STATIC_PATH_GEN.centroid(f);
    const bounds = STATIC_PATH_GEN.bounds(f);
    return {
      id: f.id,
      name: f.properties.name,
      d: STATIC_PATH_GEN(f),
      centroid: Number.isFinite(centroid[0]) ? centroid : [0, 0],
      bounds: bounds || [[0, 0], [0, 0]],
    };
  });

// Precompute static United States individual 50 state & territory features
const STATIC_US_STATE_FEATURES = topojson
  .feature(usAtlas, usAtlas.objects.states)
  .features.map((f) => {
    const centroid = STATIC_PATH_GEN.centroid(f);
    const bounds = STATIC_PATH_GEN.bounds(f);
    return {
      id: f.id,
      name: f.properties.name,
      d: STATIC_PATH_GEN(f),
      centroid: Number.isFinite(centroid[0]) ? centroid : [0, 0],
      bounds: bounds || [[0, 0], [0, 0]],
    };
  });

// Precompute crisp boundary mesh lines between all US states
const STATIC_US_STATES_MESH = STATIC_PATH_GEN(
  topojson.mesh(usAtlas, usAtlas.objects.states, (a, b) => a !== b)
);

// Regional geographic coordinates for other major global nations
const GLOBAL_REGIONAL_CENTROIDS = {
  china: [
    { name: "Pearl River Delta & Guangdong", coords: [113.3, 23.1] },
    { name: "Yangtze River Economic Basin", coords: [120.5, 31.0] },
    { name: "Beijing-Tianjin-Hebei Capital Core", coords: [116.4, 39.9] },
    { name: "Sichuan-Chongqing Industrial Basin", coords: [106.5, 29.5] },
    { name: "Northwestern Resource Corridor", coords: [87.6, 43.8] },
  ],
  russia: [
    { name: "Central Federal District (Moscow)", coords: [37.6, 55.7] },
    { name: "Northwestern Region (St. Petersburg)", coords: [30.3, 59.9] },
    { name: "Volga-Ural Heavy Industrial Heartland", coords: [50.1, 53.2] },
    { name: "Siberian Hydrocarbon & Minerals Belt", coords: [82.9, 55.0] },
    { name: "Far East Pacific Gateway (Vladivostok)", coords: [131.9, 43.1] },
  ],
  india: [
    { name: "Maharashtra & Western Commercial Coast", coords: [73.5, 19.0] },
    { name: "Deccan Tech Corridor (Bengaluru-Hyd)", coords: [77.6, 14.5] },
    { name: "Indo-Gangetic Industrial Belt (Delhi-UP)", coords: [78.5, 27.5] },
    { name: "Tamil Nadu Southern Automotive Hub", coords: [79.5, 11.5] },
    { name: "Eastern Mineral & Steel Shelf", coords: [86.5, 23.0] },
  ],
  mexico: [
    { name: "Northern Nearshoring & Automotive Corridor", coords: [-103.0, 26.5] },
    { name: "Central Valley & Mexico City Megalopolis", coords: [-99.1, 19.4] },
    { name: "Bajio Advanced Manufacturing Corridor", coords: [-101.5, 21.0] },
    { name: "Gulf Energy Basin & Deepwater Ports", coords: [-95.5, 20.0] },
    { name: "Southern Pacific & Cultural Belt", coords: [-94.0, 16.8] },
  ],
  brazil: [
    { name: "São Paulo Southeastern Megalopolis", coords: [-47.0, -23.0] },
    { name: "Rio de Janeiro Offshore Basin", coords: [-42.5, -22.5] },
    { name: "Southern Agro-Industrial Belt", coords: [-51.5, -28.0] },
    { name: "Amazonian Mineral & Bio-Reserve", coords: [-60.0, -4.0] },
    { name: "Northeastern Littoral & Clean Tech", coords: [-38.5, -10.0] },
  ],
  germany: [
    { name: "Bavaria High-Tech & Automotive Core", coords: [11.5, 48.5] },
    { name: "North Rhine-Westphalia Industrial Ruhr", coords: [7.2, 51.5] },
    { name: "Baden-Württemberg Precision Engineering", coords: [9.0, 48.5] },
    { name: "Berlin-Brandenburg Capital & Innovation", coords: [13.4, 52.5] },
    { name: "Northern Maritime Hansa & Ports", coords: [9.9, 53.5] },
  ],
  japan: [
    { name: "Kanto Plain & Tokyo Megalopolis", coords: [139.7, 35.7] },
    { name: "Kansai Region (Osaka-Kyoto-Kobe)", coords: [135.5, 34.7] },
    { name: "Chubu Industrial Corridor (Nagoya)", coords: [136.9, 35.2] },
    { name: "Kyushu & Southwestern Tech Island", coords: [130.4, 33.6] },
  ],
};

// Subcontinent Presets for Tier-2 Subcontinent Zoom
const SUBCONTINENT_PRESETS = [
  { id: "all", name: "World Overview", zoom: 1, pan: { x: 0, y: 0 } },
  { id: "na", name: "North America", zoom: 2.2, pan: { x: 260, y: 130 } },
  { id: "sa", name: "South America", zoom: 2.2, pan: { x: 140, y: -110 } },
  { id: "we", name: "Western Europe", zoom: 3.5, pan: { x: -60, y: 180 } },
  { id: "ee", name: "Eastern Europe & Eurasia", zoom: 2.1, pan: { x: -160, y: 200 } },
  { id: "ea", name: "East Asia", zoom: 2.4, pan: { x: -360, y: 120 } },
  { id: "sa_asia", name: "South Asia", zoom: 3.2, pan: { x: -360, y: 70 } },
  { id: "sea", name: "Southeast Asia", zoom: 2.8, pan: { x: -440, y: -40 } },
  { id: "me", name: "Middle East", zoom: 2.8, pan: { x: -200, y: 80 } },
  { id: "af", name: "Africa", zoom: 2.0, pan: { x: -50, y: -50 } },
  { id: "oc", name: "Oceania", zoom: 2.4, pan: { x: -470, y: -180 } },
];

export const COUNTRY_TO_SUBCONTINENT = {
  usa: "na", canada: "na", mexico: "na", cuba: "na", haiti: "na", dominican_republic: "na", guatemala: "na", panama: "na",
  brazil: "sa", argentina: "sa", chile: "sa", colombia: "sa", peru: "sa", venezuela: "sa", ecuador: "sa", bolivia: "sa", uruguay: "sa", paraguay: "sa",
  uk: "we", germany: "we", france: "we", italy: "we", spain: "we", netherlands: "we", switzerland: "we", sweden: "we", belgium: "we", austria: "we", norway: "we", denmark: "we", ireland: "we", portugal: "we", greece: "we", finland: "we",
  russia: "ee", poland: "ee", ukraine: "ee", turkey: "ee", kazakhstan: "ee", romania: "ee", czechia: "ee", hungary: "ee", belarus: "ee", bulgaria: "ee", slovakia: "ee", serbia: "ee",
  china: "ea", japan: "ea", south_korea: "ea", taiwan: "ea", mongolia: "ea", north_korea: "ea",
  india: "sa_asia", pakistan: "sa_asia", bangladesh: "sa_asia", sri_lanka: "sa_asia", nepal: "sa_asia",
  indonesia: "sea", vietnam: "sea", thailand: "sea", philippines: "sea", malaysia: "sea", singapore: "sea", myanmar: "sea", cambodia: "sea",
  saudi_arabia: "me", iran: "me", uae: "me", israel: "me", egypt: "me", iraq: "me", qatar: "me", kuwait: "me", oman: "me", jordan: "me",
  south_africa: "af", nigeria: "af", kenya: "af", ethiopia: "af", morocco: "af", algeria: "af", ghana: "af", angola: "af", tanzania: "af", congo: "af",
  australia: "oc", new_zealand: "oc", papua_new_guinea: "oc", fiji: "oc",
};

export function getSubcontinentForCountry(countryId) {
  if (!countryId) return "we";
  const cleanId = String(countryId).toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return COUNTRY_TO_SUBCONTINENT[cleanId] || "we";
}

export function getFeatureFitTransform(features, width = 960, height = 500, padding = 60) {
  if (!features || features.length === 0) return { zoom: 1, pan: { x: 0, y: 0 } };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    if (!f || !f.bounds) continue;
    const [[x0, y0], [x1, y1]] = f.bounds;
    if (x0 < minX) minX = x0;
    if (y0 < minY) minY = y0;
    if (x1 > maxX) maxX = x1;
    if (y1 > maxY) maxY = y1;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return { zoom: 1, pan: { x: 0, y: 0 } };
  const dx = Math.max(10, maxX - minX);
  const dy = Math.max(10, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const k = Math.min(6.5, Math.max(1.1, 0.78 / Math.max(dx / width, dy / height)));
  const tx = width / 2 - k * cx;
  const ty = height / 2 - k * cy;
  return { zoom: Number(k.toFixed(2)), pan: { x: Math.round(tx), y: Math.round(ty) } };
}

// Constituent Regional States for deep macroeconomic statecraft
const CONSTITUENT_REGIONAL_STATES = {
  usa: [
    { name: "California & Pacific Coast", gdpShare: 0.22, popShare: 0.20, role: "High-Tech, Silicon Valley & Aerospace Core" },
    { name: "Texas & Gulf Energy Corridor", gdpShare: 0.19, popShare: 0.17, role: "Petrochemicals, Energy Grid & Heavy Refining" },
    { name: "Northeast Atlantic Megalopolis", gdpShare: 0.23, popShare: 0.21, role: "Financial Bourse, Corporate HQs & Commerce" },
    { name: "Midwest Industrial Rustbelt", gdpShare: 0.16, popShare: 0.18, role: "Automotive, Machine Tools & Grain Agriculture" },
    { name: "Mountain West & Frontier Shelf", gdpShare: 0.11, popShare: 0.12, role: "Rare Earths, Mining & Orbital Defense" },
    { name: "Southern Logistics Sunbelt", gdpShare: 0.09, popShare: 0.12, role: "Advanced Manufacturing & Deepwater Shipping" },
  ],
  china: [
    { name: "Pearl River Delta & Guangdong", gdpShare: 0.25, popShare: 0.22, role: "Global Electronics & Precision Manufacturing" },
    { name: "Yangtze River Economic Basin", gdpShare: 0.26, popShare: 0.24, role: "Shanghai Financial Hub & Heavy Machinery" },
    { name: "Beijing-Tianjin-Hebei Capital Core", gdpShare: 0.20, popShare: 0.18, role: "Administrative Statecraft & Quantum R&D" },
    { name: "Sichuan-Chongqing Industrial Basin", gdpShare: 0.15, popShare: 0.18, role: "Inland Logistics & Renewable Energy Hub" },
    { name: "Northwestern Resource Corridor", gdpShare: 0.14, popShare: 0.18, role: "Rare Earth Metallurgy & Solar Fields" },
  ],
  russia: [
    { name: "Central Federal District (Moscow)", gdpShare: 0.35, popShare: 0.28, role: "Imperial Command, Sovereign Vault & Services" },
    { name: "Northwestern Region (St. Petersburg)", gdpShare: 0.18, popShare: 0.16, role: "Baltic Maritime Shipyards & Optics" },
    { name: "Volga-Ural Heavy Industrial Heartland", gdpShare: 0.22, popShare: 0.24, role: "Steel Forges, Machine Tools & Metallurgy" },
    { name: "Siberian Hydrocarbon & Minerals Belt", gdpShare: 0.15, popShare: 0.18, role: "Hydrocarbons, Nickel & Rare Metals Extraction" },
    { name: "Far East Pacific Gateway (Vladivostok)", gdpShare: 0.10, popShare: 0.14, role: "Pacific Logistics & Deepwater Trade" },
  ],
  india: [
    { name: "Maharashtra & Western Commercial Coast", gdpShare: 0.26, popShare: 0.20, role: "Mumbai Bourse, Finance & Pharmaceuticals" },
    { name: "Deccan Tech Corridor (Bengaluru-Hyd)", gdpShare: 0.22, popShare: 0.18, role: "Semiconductors, Artificial Intelligence & Software" },
    { name: "Indo-Gangetic Industrial Belt (Delhi-UP)", gdpShare: 0.22, popShare: 0.28, role: "National Governance, Textiles & Agriculture" },
    { name: "Tamil Nadu Southern Automotive Hub", gdpShare: 0.16, popShare: 0.16, role: "Precision Engineering & Heavy Vehicle Assembly" },
    { name: "Eastern Mineral & Steel Shelf", gdpShare: 0.14, popShare: 0.18, role: "Iron Ore, Bauxite & Blast Furnaces" },
  ],
  japan: [
    { name: "Kanto Plain & Tokyo Megalopolis", gdpShare: 0.42, popShare: 0.38, role: "Financial Exchanges, Robotics & Corporate HQs" },
    { name: "Kansai Region (Osaka-Kyoto-Kobe)", gdpShare: 0.24, popShare: 0.22, role: "Advanced Chemicals, Electronics & High-Speed Transit" },
    { name: "Chubu Industrial Corridor (Nagoya)", gdpShare: 0.20, popShare: 0.20, role: "Automotive Heavy Assembly & Aerospace Parts" },
    { name: "Kyushu & Southwestern Tech Island", gdpShare: 0.14, popShare: 0.20, role: "Silicon Wafer Fabrication & Agricultural Basin" },
  ],
  brazil: [
    { name: "São Paulo Southeastern Megalopolis", gdpShare: 0.45, popShare: 0.35, role: "Financial Center, Automotive & Bio-Refineries" },
    { name: "Rio de Janeiro Offshore Basin", gdpShare: 0.20, popShare: 0.18, role: "Deepwater Oil Extraction & Petrochemicals" },
    { name: "Southern Agro-Industrial Belt", gdpShare: 0.20, popShare: 0.22, role: "Grains, Machinery & Livestock Export" },
    { name: "Amazonian Mineral & Bio-Reserve", gdpShare: 0.15, popShare: 0.25, role: "Hydroelectric Power & Rare Minerals" },
  ],
  australia: [
    { name: "New South Wales (Sydney)", gdpShare: 0.36, popShare: 0.34, role: "Financial Services & Maritime Trade" },
    { name: "Victoria (Melbourne)", gdpShare: 0.28, popShare: 0.27, role: "Biotech, Advanced Manufacturing & Culture" },
    { name: "Western Australia Mining Shelf", gdpShare: 0.22, popShare: 0.18, role: "Iron Ore, Lithium & Rare Earths Export" },
    { name: "Queensland Tropical Energy Coast", gdpShare: 0.14, popShare: 0.21, role: "Metallurgical Coal & Bauxite Extraction" },
  ],
  mexico: [
    { name: "Valley of Mexico (Federal District)", gdpShare: 0.32, popShare: 0.28, role: "Capital Administration & Corporate Commerce" },
    { name: "Northern Nearshoring Border Corridor", gdpShare: 0.30, popShare: 0.25, role: "Automotive Assembly & Electronics Export" },
    { name: "Bajio Aerospace & Machine Hub", gdpShare: 0.20, popShare: 0.22, role: "Precision Tooling & Chemical Plants" },
    { name: "Gulf Coast Oil & Southern Belt", gdpShare: 0.18, popShare: 0.25, role: "Petroleum Extraction & Agriculture" },
  ],
  olympus: [
    { name: "Olympus Mons Central Caldera", gdpShare: 0.40, popShare: 0.35, role: "Planetary Space Elevator & Mag-Lev Terminal" },
    { name: "Tharsis Volcanic Highlands", gdpShare: 0.32, popShare: 0.33, role: "Geothermal Extraction & Heavy Foundry Grid" },
    { name: "Marineris Canyon Logistics Shelf", gdpShare: 0.28, popShare: 0.32, role: "Pressurized Biosphere & Hydroponic Farms" },
  ],
  heinan: [
    { name: "Heinan Crater Habitation Ring", gdpShare: 0.52, popShare: 0.48, role: "Deep-Drilling Regolith Refinery & Subterranean Core" },
    { name: "Elysium Planitia Solar Array", gdpShare: 0.48, popShare: 0.52, role: "Orbital Relay Station & Rare Gas Extraction" },
  ],
  mitsubishi: [
    { name: "Mitsubishi Heavy Martian Arcology", gdpShare: 0.55, popShare: 0.50, role: "Automated Foundry Complex & Exo-Suit Fabrication" },
    { name: "Utopia Planitia Sub-Surface Mines", gdpShare: 0.45, popShare: 0.50, role: "Water-Ice Extraction & Fusion Fuel Depots" },
  ],
  sumitomo: [
    { name: "Sumitomo Bio-Dome Mega-Cluster", gdpShare: 0.52, popShare: 0.52, role: "Hydroponics, Oxygen Scrubbers & Life Support" },
    { name: "Argyre Impact Basin Depot", gdpShare: 0.48, popShare: 0.48, role: "Freight Rail Terminal & Heavy Rare Earth Processing" },
  ],
  ifc: [
    { name: "Interstellar Financial Center Spire", gdpShare: 0.60, popShare: 0.45, role: "Off-World Bourse, Banking Vaults & AI Data Shrines" },
    { name: "Phobos-Deimos Orbital Gateway", gdpShare: 0.40, popShare: 0.55, role: "Deep Space Freight Dock & Ion Propulsion Yard" },
  ],
};

// Distinct sovereign color palette for nations
const NATION_PALETTE = [
  "#06b6d4", // Cyan (USA)
  "#ef4444", // Red (China)
  "#f43f5e", // Rose (Japan)
  "#3b82f6", // Royal Blue (EU)
  "#f59e0b", // Amber (India)
  "#10b981", // Emerald (Russia)
  "#a855f7", // Purple (Botswana)
  "#22c55e", // Green (Brazil)
  "#eab308", // Gold (Australia)
  "#14b8a6", // Teal (Mexico)
  "#f97316", // Orange (Olympus)
  "#ec4899", // Pink (Heinan)
  "#6366f1", // Indigo (Mitsubishi)
  "#84cc16", // Lime (Sumitomo)
  "#0ea5e9", // Sky (I.F.C)
  "#d946ef", // Fuchsia
  "#fb7185", // Coral
  "#38bdf8", // Light Blue
];

// Contiguous polygonal provinces for the Mars Planetary Map (960 x 500 viewBox)
const MARS_PROVINCE_POLYGONS = [
  {
    name: "Vastitas Borealis",
    points: "80,20 880,20 910,85 50,85",
    cx: 480,
    cy: 52,
    terrain: "Polar Ice & Boreal Plains",
  },
  {
    name: "Arcadia Planitia",
    points: "50,85 260,85 240,185 40,185",
    cx: 150,
    cy: 135,
    terrain: "Volcanic Sheet Plains",
  },
  {
    name: "Alba Mons",
    points: "260,85 450,85 430,185 240,185",
    cx: 345,
    cy: 135,
    terrain: "Northern Shield Volcano",
  },
  {
    name: "Tempe Terra",
    points: "450,85 610,85 595,185 430,185",
    cx: 520,
    cy: 135,
    terrain: "Fractured Highland Plateau",
  },
  {
    name: "Acidalia Planitia",
    points: "610,85 770,85 755,185 595,185",
    cx: 680,
    cy: 135,
    terrain: "Lowland Basin",
  },
  {
    name: "Utopia Planitia",
    points: "770,85 910,85 920,210 755,185",
    cx: 840,
    cy: 145,
    terrain: "Subsurface Ice Reserve",
  },
  {
    name: "Amazonis Planitia",
    points: "40,185 190,185 180,300 35,300",
    cx: 112,
    cy: 242,
    terrain: "Smooth Dust Plains",
  },
  {
    name: "Olympus Mons",
    points: "190,185 335,185 320,295 180,300",
    cx: 255,
    cy: 240,
    terrain: "21km Caldera Citadel",
  },
  {
    name: "Tharsis Montes",
    points: "335,185 465,185 445,305 320,295",
    cx: 392,
    cy: 245,
    terrain: "Three-Volcano Industrial Ridge",
  },
  {
    name: "Chryse Planitia",
    points: "465,185 605,185 590,285 445,305",
    cx: 525,
    cy: 240,
    terrain: "Outflow Channel Delta",
  },
  {
    name: "Arabia Terra",
    points: "605,185 755,185 745,290 590,285",
    cx: 672,
    cy: 238,
    terrain: "Cratered Quartz Highlands",
  },
  {
    name: "Syrtis Major",
    points: "755,185 845,198 835,305 745,290",
    cx: 795,
    cy: 245,
    terrain: "Basaltic Shield Plateau",
  },
  {
    name: "Elysium Planitia",
    points: "845,198 920,210 925,320 835,305",
    cx: 880,
    cy: 260,
    terrain: "Equatorial Spaceport Hub",
  },
  {
    name: "Sirenum Terra",
    points: "35,300 220,298 235,405 45,405",
    cx: 135,
    cy: 352,
    terrain: "Southern Magnetic Ridges",
  },
  {
    name: "Noctis Labyrinthus",
    points: "220,298 355,298 350,380 235,405",
    cx: 290,
    cy: 345,
    terrain: "Deep Canyon Maze",
  },
  {
    name: "Valles Marineris",
    points: "355,298 555,288 545,375 350,380",
    cx: 452,
    cy: 336,
    terrain: "4,000km Grand Rift Metropole",
  },
  {
    name: "Meridiani Planum",
    points: "555,288 695,288 685,380 545,375",
    cx: 620,
    cy: 334,
    terrain: "Hematite Ore Flats",
  },
  {
    name: "Isidis Planitia",
    points: "695,288 815,300 800,385 685,380",
    cx: 750,
    cy: 338,
    terrain: "Impact Mineral Basin",
  },
  {
    name: "Hesperia Planum",
    points: "815,300 925,320 905,415 800,385",
    cx: 862,
    cy: 358,
    terrain: "Ridged Lava Plains",
  },
  {
    name: "Solis Planum",
    points: "235,405 425,378 420,470 210,470",
    cx: 325,
    cy: 430,
    terrain: "Highland Solar Arrays",
  },
  {
    name: "Argyre Planitia",
    points: "425,378 585,376 575,470 420,470",
    cx: 500,
    cy: 425,
    terrain: "Southern Impact Basin",
  },
  {
    name: "Noachis Terra",
    points: "585,376 735,382 725,470 575,470",
    cx: 655,
    cy: 425,
    terrain: "Ancient Noachian Crust",
  },
  {
    name: "Hellas Planitia",
    points: "735,382 905,415 880,475 725,470",
    cx: 810,
    cy: 432,
    terrain: "7km Deep Atmospheric Basin",
  },
  {
    name: "Cimmeria Terra",
    points: "45,405 235,405 210,470 70,470",
    cx: 140,
    cy: 438,
    terrain: "Southern Highland Crags",
  },
];

const MapHoverTooltip = forwardRef(function MapHoverTooltip(
  { interactionMode, activeNationName },
  ref
) {
  const [hovered, setHovered] = useState(null);
  useImperativeHandle(ref, () => ({
    setHover: (val) => setHovered(val),
  }));
  if (!hovered) return null;
  return (
    <div className="absolute top-14 right-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl pointer-events-none text-xs space-y-1">
      <div className="font-bold text-white flex items-center gap-2">
        <span>{hovered.name}</span>
        {hovered.code && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-num font-bold">
            {hovered.code}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
          {hovered.status || hovered.controllerName}
        </span>
      </div>
      {hovered.role && (
        <div className="text-[11px] text-slate-400 font-medium leading-tight">
          {hovered.role}
        </div>
      )}
      {hovered.gdp !== undefined && (
        <div className="text-[11px] text-slate-300 font-mono-num pt-0.5 flex items-center gap-3">
          <span>GDP: {formatCurrency(hovered.gdp)}</span>
          {hovered.sol !== undefined && <span>SOL: {hovered.sol?.toFixed(2)}</span>}
          <span>Pops: {formatCompactNumber(hovered.pops)}</span>
        </div>
      )}
      <div className="text-[10px] text-amber-300">
        {interactionMode === "annex"
          ? `Click to Annex into ${activeNationName || ""}`
          : interactionMode === "release"
          ? `Click to Release ${hovered.name} as Independent State`
          : hovered.isControlled
          ? "Click to Inspect & Govern"
          : "Click to Awaken as Playable Nation or Annex"}
      </div>
    </div>
  );
});

export default function InteractiveWorldMap({
  state,
  selectedNationId,
  onSelectNation,
  onUpdateNation,
  onDeleteNation,
  onTransferTerritory,
  onCreateNation,
  onJumpToTab,
  onVictoriaAction,
  onAiShock,
  onRestoreShock,
  isReadOnly = false,
}) {
  const nations = state.nations || [];
  const territoryMap = state.territoryMap || {};

  const [theater, setTheater] = useState("Earth"); // "Earth" | "Mars"
  const [mapLens, setMapLens] = useState("sovereignty"); // "sovereignty" | "gdp" | "sol" | "unrest"
  const [interactionMode, setInteractionMode] = useState("inspect"); // "inspect" | "annex" | "release"
  const [mapLocation, setMapLocation] = useState({ level: "world" }); // { level: "world" } | { level: "subcontinent", subcontinentId } | { level: "country", countryId }
  const [viewTier, setViewTier] = useState("worldwide"); // "worldwide" | "subcontinent" | "country"
  const [rightPanelTab, setRightPanelTab] = useState("states"); // "states" | "cabinet"
  const [selectedSubcontinent, setSelectedSubcontinent] = useState("all");
  const [showProvinceManager, setShowProvinceManager] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");
  const [transferringState, setTransferringState] = useState(null);
  const [transferTargetNationId, setTransferTargetNationId] = useState("");
  const [selectedStateName, setSelectedStateName] = useState(null);
  const [stateSearchQuery, setStateSearchQuery] = useState("");
  const [showStatesTableModal, setShowStatesTableModal] = useState(false);
  const [statesModalFilter, setStatesModalFilter] = useState("all"); // "all" | "state" | "territory" | "energy" | "minerals" | "agri"
  const [statesModalSort, setStatesModalSort] = useState("gdp"); // "gdp" | "pops" | "name" | "energy" | "minerals" | "agri" | "infra"
  const [hoveredModalState, setHoveredModalState] = useState(null);
  const tooltipRef = useRef(null);
  const setHoveredTerritory = (val) => tooltipRef.current?.setHover(val);

  // Groq AI Macroeconomic Shock & Crisis Engine state
  const [showShockModal, setShowShockModal] = useState(false);
  const [shockPrompt, setShockPrompt] = useState("");
  const [shockLoading, setShockLoading] = useState(false);
  const [shockError, setShockError] = useState(null);
  const [shockResultData, setShockResultData] = useState(null);
  const [shockDiffData, setShockDiffData] = useState(null);

  // Groq AI Economic Advisory state
  const [aiAdvisory, setAiAdvisory] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTarget, setAiTarget] = useState(null);

  const requestAiAdvisory = async (stateName, stateData, endowments) => {
    setAiLoading(true);
    setAiTarget(stateName);
    try {
      const res = await fetch("/api/ai/economic-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationName: activeNation?.name || "USA",
          stateName,
          stateData,
          endowments,
        }),
      });
      const data = await res.json();
      setAiAdvisory(data.advisory);
    } catch (err) {
      setAiAdvisory("Failed to generate AI advisory: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const SHOCK_PRESETS = [
    {
      id: "katrina",
      title: "🌪️ Category 5 Hurricane Katrina",
      badge: "Gulf Disaster",
      desc: "Massive storm surge breaches New Orleans levees, flooding Port of South Louisiana and Port of New Orleans (-70% port logistics), shutting down regional oil refineries (-40% hydrocarbons), and increasing national freight transit delay by 2.5x.",
      prompt: "Category 5 Hurricane Katrina strikes the Louisiana and Mississippi Gulf Coast. Severe storm surges flood the Port of South Louisiana and Port of New Orleans deepwater berths (-70% logistics waterway index), knock offline regional oil refineries and Gulf platforms (-40% hydrocarbons), destroy coastal amenities, and spike national freight delay friction to 2.5x normal, heavily contracting goods-based manufacturing output.",
    },
    {
      id: "opec",
      title: "🛢️ 1970s OPEC Oil Embargo",
      badge: "Energy Shock",
      desc: "OPEC cartel announces an immediate crude export embargo and extraction quota cuts, driving energy spot prices up +45%, creating severe refinery feed shortages, and spiking transportation freight friction.",
      prompt: "Geopolitical conflict triggers a severe OPEC oil embargo and production cut. Crude oil spot prices spike +45%, refined fuel and diesel supply plummets, freight delay friction rises to 2.2x, and petrochemical manufacturing and heavy industries contract nationwide.",
    },
    {
      id: "drought",
      title: "🌾 Great Plains Mega-Drought",
      badge: "Agriculture",
      desc: "Severe contiguous drought and heatwave across Kansas, Nebraska, Iowa, and the Midwest. Arable land crop yields plummet -60%, shallow river navigation restricts grain barge shipping, and food prices spike.",
      prompt: "A historic contiguous megadrought hits Kansas, Nebraska, Iowa, and the Midwest grain belt. Arable land output plummets -60%, shallow river levels restrict barge grain exports along the Mississippi-Missouri system, and agricultural GDP drops steeply.",
    },
    {
      id: "cyber",
      title: "💻 Colonial Pipeline & Grid Cyberattack",
      badge: "Cyber Warfare",
      desc: "Catastrophic nation-state cyber offensive disables Eastern fuel pipelines and regional power substations, crippling freight logistics and digital infrastructure.",
      prompt: "A catastrophic state-sponsored cyberattack strikes Eastern pipeline SCADA networks and regional grid substations. Refined product pipelines halt, digital connectivity drops -30%, freight delay increases to 2.4x, and industrial assembly plants are paralyzed.",
    },
    {
      id: "strike",
      title: "⚓ West Coast Longshoremen Strike",
      badge: "Supply Chain",
      desc: "Coordinated labor shutdown at Port of Los Angeles and Port of Long Beach. Over 100 container ships stranded at anchor, causing 3.0x freight delay for manufactured goods.",
      prompt: "A total labor strike paralyzes the Port of Los Angeles and Port of Long Beach in California. Container terminals shut down completely (-75% Pacific logistics), freight delay friction escalates to 3.0x, and manufacturing assembly lines stall for lack of intermediate components.",
    },
  ];

  const handleExecuteShock = async (overridePrompt = null) => {
    const text = overridePrompt || shockPrompt;
    if (!text || !text.trim()) {
      setShockError("Please enter a disaster or crisis description, or select a preset.");
      return;
    }
    setShockLoading(true);
    setShockError(null);

    try {
      if (onAiShock) {
        const res = await onAiShock({
          prompt: text.trim(),
          selectedStateName: selectedStateName || undefined,
        });
        setShockResultData(res.shockResult);
        setShockDiffData(res.beforeAfterDiff);
      } else {
        // Fallback direct endpoint call
        const res = await fetch("/api/ai/simulate-shock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text.trim(),
            state,
            nationName: activeNation?.name || "USA",
            selectedStateName: selectedStateName || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Shock simulation failed.");
        setShockResultData(json.shockResult);
      }
    } catch (err) {
      setShockError(err.message || "Failed to simulate economic shock.");
    } finally {
      setShockLoading(false);
    }
  };

  const handleRestoreInfrastructure = async () => {
    setShockLoading(true);
    try {
      if (onRestoreShock) {
        await onRestoreShock();
      } else {
        await fetch("/api/ai/restore-shock", { method: "POST" });
      }
      setShockResultData(null);
      setShockDiffData(null);
      setShowShockModal(false);
    } catch (err) {
      setShockError(err.message || "Failed to restore infrastructure.");
    } finally {
      setShockLoading(false);
    }
  };

  const planetsConfig = state.planetsConfig || [
    { id: "earth", name: "Earth" },
    { id: "mars", name: "Mars" },
  ];

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Sync theater if current theater was deleted in Director view
  useEffect(() => {
    const exists = planetsConfig.some(
      (p) => p.name.toLowerCase() === theater.toLowerCase()
    );
    if (!exists && planetsConfig.length > 0) {
      setTheater(planetsConfig[0].name);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [planetsConfig, theater]);

  // Reset to full world view
  const navigateToWorld = () => {
    setMapLocation({ level: "world" });
    setViewTier("worldwide");
    setSelectedStateName(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Focus camera on a selected subcontinent
  const navigateToSubcontinent = (subId) => {
    const validSubId = subId && subId !== "all" ? subId : "we";
    setSelectedSubcontinent(validSubId);
    setMapLocation({ level: "subcontinent", subcontinentId: validSubId });
    setViewTier("subcontinent");
    setSelectedStateName(null);
    const preset = SUBCONTINENT_PRESETS.find((p) => p.id === validSubId) || SUBCONTINENT_PRESETS[1];
    setZoom(preset.zoom);
    setPan(preset.pan);
  };

  const handleSelectSubcontinent = (subId) => {
    navigateToSubcontinent(subId);
  };

  // Focus camera on a specific nation (geometry-based fit)
  const navigateToCountry = (targetNation, openModal = false) => {
    if (!targetNation) return;
    const targetId = targetNation.id || targetNation.name?.toLowerCase() || "usa";
    const subId = getSubcontinentForCountry(targetId);
    setSelectedSubcontinent(subId);
    setMapLocation({ level: "country", countryId: targetId, subcontinentId: subId });
    setViewTier("country");
    onSelectNation(targetId);
    setSelectedStateName(null);
    setRightPanelTab("states");
    if (openModal) {
      setShowStatesTableModal(true);
    }

    const isMars = (targetNation.planet || "").toLowerCase().includes("mars");
    if (isMars) {
      setTheater("Mars");
      setZoom(2.0);
      setPan({ x: 0, y: 0 });
      return;
    }
    setTheater("Earth");
    const matchedFeatures = STATIC_EARTH_FEATURES.filter(
      (f) =>
        f.name.toLowerCase() === (targetNation.name || "").toLowerCase() ||
        (targetId === "usa" && f.name === "United States of America") ||
        territoryMap[f.name] === targetId
    );
    if (matchedFeatures.length > 0) {
      const { zoom: fitZ, pan: fitP } = getFeatureFitTransform(matchedFeatures, 960, 500, 60);
      setZoom(fitZ);
      setPan(fitP);
    } else {
      setZoom(2.8);
      setPan({ x: 0, y: 0 });
    }
  };

  const focusOnCountry = (targetNation) => {
    navigateToCountry(targetNation, false);
  };

  // Close the country cartography / subdivisions modal and cleanly return to the regional subcontinent view
  const closeStatesModal = () => {
    setShowStatesTableModal(false);
  };

  // Focus camera on a specific territory / state
  const focusOnTerritory = (territoryName) => {
    setSelectedStateName(territoryName);

    // 1. Check US individual states first
    const usFeat = STATIC_US_STATE_FEATURES.find(
      (f) => f.name.toLowerCase() === territoryName.toLowerCase()
    );
    if (usFeat && usFeat.centroid && usFeat.centroid[0] > 0) {
      const [cx, cy] = usFeat.centroid;
      setTheater("Earth");
      setZoom(3.8);
      setPan({ x: Math.round(480 - cx), y: Math.round(250 - cy) });
      return;
    }

    // 2. Check general Earth country & territory features
    const feat = STATIC_EARTH_FEATURES.find(
      (f) => f.name.toLowerCase() === territoryName.toLowerCase()
    );
    if (feat && feat.centroid && feat.centroid[0] > 0) {
      const [cx, cy] = feat.centroid;
      setTheater("Earth");
      setZoom(3.8);
      setPan({ x: Math.round(480 - cx), y: Math.round(250 - cy) });
    }
  };

  // Nation lookup & color assignment
  const { nationById, nationColorMap } = useMemo(() => {
    const byId = new Map();
    const colorMap = new Map();
    nations.forEach((n, idx) => {
      byId.set(n.id, n);
      colorMap.set(n.id, NATION_PALETTE[idx % NATION_PALETTE.length]);
    });
    return { nationById: byId, nationColorMap: colorMap };
  }, [nations]);

  const activeNation = useMemo(() => {
    const raw =
      nationById.get(selectedNationId) ||
      getSovereignNation(selectedNationId) ||
      nations.find((n) =>
        theater === "Mars"
          ? (n.planet || "").toLowerCase().includes("mars")
          : !(n.planet || "").toLowerCase().includes("mars")
      ) ||
      nations[0];
    if (!raw) return nations[0] || null;
    return {
      ...raw,
      computed: raw.computed || {
        aggregateGdp: raw.gdp || 250e9,
        effectiveWorkingPops: raw.population || 15e6,
        treasury: raw.treasuryBalance || 10e9,
        sol: 15.0,
        unemploymentRate: 0.045,
        inflationRate: 0.02,
      },
    };
  }, [selectedNationId, nationById, nations, theater]);

  // Dynamic merged border paths (uses precomputed STATIC_EARTH_FEATURES & STATIC_PATH_GEN)
  const { earthFeatures, sovereignBorderPath, internalBorderPath } =
    useMemo(() => {
      const sovMesh = topojson.mesh(
        worldAtlas,
        worldAtlas.objects.countries,
        (a, b) => {
          if (a === b) return true; // coastline
          const ctrlA = territoryMap[a.properties?.name] || a.properties?.name;
          const ctrlB = territoryMap[b.properties?.name] || b.properties?.name;
          return ctrlA !== ctrlB;
        }
      );

      const intMesh = topojson.mesh(
        worldAtlas,
        worldAtlas.objects.countries,
        (a, b) => {
          if (a === b) return false;
          const ctrlA = territoryMap[a.properties?.name] || a.properties?.name;
          const ctrlB = territoryMap[b.properties?.name] || b.properties?.name;
          return ctrlA === ctrlB;
        }
      );

      return {
        earthFeatures: STATIC_EARTH_FEATURES,
        sovereignBorderPath: STATIC_PATH_GEN(sovMesh),
        internalBorderPath: STATIC_PATH_GEN(intMesh),
      };
    }, [territoryMap]);

  // Compute fill color for any territory based on selected Map Lens
  const getTerritoryFill = (territoryName) => {
    const controllerId = territoryMap[territoryName];
    const nation = nationById.get(controllerId);
    if (!nation) {
      return "#1e293b"; // Non-aligned / Unclaimed territory
    }

    if (mapLens === "sovereignty") {
      return nationColorMap.get(nation.id) || "#06b6d4";
    }

    const c = nation.computed || {};
    if (mapLens === "gdp") {
      const gdpTrillions = (c.aggregateGdp || 0) / 1e12;
      const ratio = Math.min(1, Math.max(0.1, gdpTrillions / 2.2));
      return `hsl(${155 + ratio * 35}, 80%, ${22 + ratio * 32}%)`;
    }
    if (mapLens === "sol") {
      const sol = c.sol || 0;
      const ratio = Math.min(1, Math.max(0.1, (sol + 2) / 10));
      return `hsl(${185 + ratio * 25}, 85%, ${22 + ratio * 34}%)`;
    }
    if (mapLens === "unrest") {
      const crime = (c.crimeRate || 0) * 100;
      const unemp = Math.max(0, (c.unemploymentRate || 0) * 100);
      const stress = Math.min(1, (crime * 2 + unemp) / 35);
      return `hsl(${Math.round((1 - stress) * 130)}, 80%, 38%)`;
    }
    return nationColorMap.get(nation.id) || "#06b6d4";
  };

  // Handle clicking a territory on Earth, Mars, or Vietnam
  const handleTerritoryClick = (territoryName, planetName) => {
    const controllerId = territoryMap[territoryName];
    const controllingNation = nationById.get(controllerId);

    if (interactionMode === "annex") {
      if (!activeNation) return;
      onTransferTerritory({
        territoryName,
        targetNationId: activeNation.id,
        mode: "ANNEX",
        planet: planetName,
      });
      return;
    }

    if (interactionMode === "release") {
      onTransferTerritory({
        territoryName,
        mode: "RELEASE",
        planet: planetName,
      });
      return;
    }

    // Default Inspect Mode:
    if (controllingNation) {
      focusOnCountry(controllingNation);
      setShowStatesTableModal(true);
    } else if (!isReadOnly) {
      // Clicked a non-aligned or unclaimed territory -> prompt to either Annex into active nation or Awaken as Sovereign Nation
      if (
        window.confirm(
          `"${territoryName}" is currently Non-Aligned.\n\nClick OK to Awaken "${territoryName}" as a playable Sovereign Nation, or Cancel to Annex it into ${activeNation?.name}.`
        )
      ) {
        onTransferTerritory({
          territoryName,
          mode: "RELEASE",
          planet: planetName,
        });
      } else if (activeNation) {
        onTransferTerritory({
          territoryName,
          targetNationId: activeNation.id,
          mode: "ANNEX",
          planet: planetName,
        });
      }
    }
  };

  // Mouse Wheel Zoom & Drag Pan handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.18 : 0.85;
    setZoom((z) => {
      const next = Math.min(9, Math.max(1, Number((z * factor).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.x) / zoom;
    const dy = (e.clientY - dragStartRef.current.y) / zoom;
    setPan({
      x: Math.max(-420, Math.min(420, dragStartRef.current.panX + dx)),
      y: Math.max(-240, Math.min(240, dragStartRef.current.panY + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const c = activeNation?.computed || {};
  const parties = state.politicalParties || [];

  // Constituent States & Internal Territorial Divisions
  const nationalStatesList = useMemo(() => {
    if (!activeNation) return [];

    // "When one state within a country secedes, it should not have any more state and provinces since it is a state itself."
    if (activeNation.isSeceded || activeNation.isUnitaryState) {
      return [];
    }

    const territoryStatusMap = state.territoryStatusMap || {};

    // 1. United States 50 Individual Constituent States & Territories
    if (activeNation.id === "usa" || activeNation.name?.toLowerCase().includes("united states")) {
      const statesList = Object.entries(US_STATES_CATALOG).map(([name, meta]) => {
        const assignedId = territoryMap[name];
        if (assignedId && assignedId !== "usa") return null; // Transferred away

        const status = territoryStatusMap[name] || meta.status || "STATE";
        return {
          name,
          code: meta.code,
          capital: meta.capital,
          region: meta.region,
          role: meta.role,
          status,
          isCore: status !== "TERRITORY",
          gdp: (c.aggregateGdp || 0) * meta.gdpShare,
          pops: Math.round((c.effectiveWorkingPops || 0) * meta.popShare),
          infra: c.infrastructureEfficiency || 0.88,
          literacy: c.literacyRate || 0.90,
          urban: c.urbanisationIndex || 0.82,
        };
      }).filter(Boolean);

      // Include any foreign annexed territories acquired into USA
      const annexedIntoUsa = Object.entries(territoryMap)
        .filter(([terr, cid]) => cid === "usa" && terr !== "United States of America" && !US_STATES_CATALOG[terr])
        .map(([name]) => ({
          name,
          status: territoryStatusMap[name] || "TERRITORY",
          role: "Annexed Dependent Territory",
          isCore: false,
          gdp: (c.aggregateGdp || 0) * 0.005,
          pops: Math.round((c.effectiveWorkingPops || 0) * 0.005),
          infra: (c.infrastructureEfficiency || 0.8) * 0.75,
          literacy: (c.literacyRate || 0.85) * 0.8,
          urban: (c.urbanisationIndex || 0.75) * 0.7,
        }));

      return [...statesList, ...annexedIntoUsa];
    }

    // 2. If explicit constituentStates and unincorporatedTerritories are defined on the nation (from historical era / statehood)
    if (
      (activeNation.constituentStates && activeNation.constituentStates.length > 0) ||
      (activeNation.unincorporatedTerritories && activeNation.unincorporatedTerritories.length > 0)
    ) {
      const states = (activeNation.constituentStates || []).map((s) => ({
        ...s,
        status: territoryStatusMap[s.name] || s.status || "STATE",
        isCore: true,
        gdp: (c.aggregateGdp || 0) * (s.gdpShare || 0.2),
        pops: Math.round((c.effectiveWorkingPops || 0) * (s.popShare || 0.2)),
        infra: c.infrastructureEfficiency || 0.8,
        literacy: c.literacyRate || 0.85,
        urban: c.urbanisationIndex || 0.75,
      }));
      const territories = (activeNation.unincorporatedTerritories || []).map((t) => ({
        ...t,
        status: territoryStatusMap[t.name] || t.status || "TERRITORY",
        isCore: false,
        gdp: ((c.aggregateGdp || 0) * 0.1) / Math.max(1, activeNation.unincorporatedTerritories.length),
        pops: Math.round(((c.effectiveWorkingPops || 0) * 0.1) / Math.max(1, activeNation.unincorporatedTerritories.length)),
        infra: (c.infrastructureEfficiency || 0.8) * 0.8,
        literacy: (c.literacyRate || 0.85) * 0.85,
        urban: (c.urbanisationIndex || 0.75) * 0.7,
      }));
      return [...states, ...territories];
    }

    const directTerritories = [];
    for (const [terr, cid] of Object.entries(territoryMap)) {
      if (cid === activeNation.id) {
        directTerritories.push(terr);
      }
    }
    // Direct constituent regional states from template
    const regional = CONSTITUENT_REGIONAL_STATES[activeNation.id.toLowerCase()] || [];
    const activeRegional = regional.filter((r) => {
      const assigned = territoryMap[r.name];
      return !assigned || assigned === activeNation.id;
    });

    // Also include any regional states from other nations that were transferred into activeNation
    const transferredIn = Object.entries(territoryMap)
      .filter(([terr, cid]) => cid === activeNation.id && !directTerritories.includes(terr))
      .map(([terr]) => terr);

    const combinedTerritories = [...new Set([...directTerritories, ...transferredIn])];

    if (combinedTerritories.length > 1) {
      const gdpPerTerr = (c.aggregateGdp || 0) / combinedTerritories.length;
      const popPerTerr = (c.effectiveWorkingPops || 0) / combinedTerritories.length;
      return combinedTerritories.map((name) => {
        const isCore = name.toLowerCase() === activeNation.name.toLowerCase();
        const explicitStatus = territoryStatusMap[name];
        // Newly annexed lands default to "TERRITORY", while homeland core defaults to "STATE"
        const status = explicitStatus || (isCore ? "STATE" : "TERRITORY");
        return {
          name,
          status,
          role: status === "STATE" ? "Incorporated Constituent State" : "Unincorporated Dependent Territory",
          isCore,
          gdp: gdpPerTerr,
          pops: Math.round(popPerTerr),
          infra: c.infrastructureEfficiency || 0.8,
          literacy: c.literacyRate || 0.85,
          urban: c.urbanisationIndex || 0.75,
        };
      });
    }

    if (activeRegional.length > 0) {
      return activeRegional.map((r) => ({
        name: r.name,
        role: r.role,
        status: territoryStatusMap[r.name] || "STATE",
        isCore: true,
        gdp: (c.aggregateGdp || 0) * r.gdpShare,
        pops: Math.round((c.effectiveWorkingPops || 0) * r.popShare),
        infra: (c.infrastructureEfficiency || 0.8) * (0.9 + r.gdpShare * 0.4),
        literacy: c.literacyRate || 0.85,
        urban: (c.urbanisationIndex || 0.75) * (0.85 + r.popShare * 0.6),
      }));
    }

    // Fallback constituent states (only for multi-state non-seceded nations)
    const basePops = Math.round((c.effectiveWorkingPops || 0) / 4);
    const baseGdp = (c.aggregateGdp || 0) / 4;
    return [
      {
        name: `${activeNation.name} Capital District`,
        role: "Metropolitan Administration & Financial Core",
        status: "STATE",
        isCore: true,
        gdp: baseGdp * 1.5,
        pops: Math.round(basePops * 1.3),
        infra: c.infrastructureEfficiency || 0.85,
        literacy: c.literacyRate || 0.9,
        urban: c.urbanisationIndex || 0.8,
      },
      {
        name: `${activeNation.name} Industrial Basin`,
        role: "Heavy Manufacturing & Energy Infrastructure",
        status: "STATE",
        isCore: true,
        gdp: baseGdp * 1.2,
        pops: Math.round(basePops * 1.1),
        infra: c.infrastructureEfficiency || 0.8,
        literacy: c.literacyRate || 0.82,
        urban: c.urbanisationIndex || 0.75,
      },
      {
        name: `${activeNation.name} Agro-Resource Belt`,
        role: "Primary Commodities & Food Security",
        status: "STATE",
        isCore: true,
        gdp: baseGdp * 0.7,
        pops: Math.round(basePops * 0.8),
        infra: (c.infrastructureEfficiency || 0.8) * 0.85,
        literacy: c.literacyRate || 0.8,
        urban: (c.urbanisationIndex || 0.75) * 0.6,
      },
      {
        name: `${activeNation.name} Maritime/Orbital Gateway`,
        role: "Interstellar Freight & Trade Logistics Hub",
        status: "STATE",
        isCore: true,
        gdp: baseGdp * 0.6,
        pops: Math.round(basePops * 0.8),
        infra: c.infrastructureEfficiency || 0.85,
        literacy: c.literacyRate || 0.85,
        urban: c.urbanisationIndex || 0.78,
      },
    ];
  }, [activeNation, territoryMap, state.territoryStatusMap, c]);

  const subcontinentNations = useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const n of nations) {
      if (getSubcontinentForCountry(n.id) === selectedSubcontinent && !seen.has(n.id)) {
        seen.add(n.id);
        list.push(n);
      }
    }
    for (const n of ALL_SOVEREIGN_NATIONS) {
      if (getSubcontinentForCountry(n.id) === selectedSubcontinent && !seen.has(n.id)) {
        seen.add(n.id);
        list.push(n);
      }
    }
    return list.slice(0, 10);
  }, [nations, selectedSubcontinent]);

  // Filtered & Sorted constituent states for the Country & States Table Pop Up Modal
  const modalFilteredStates = useMemo(() => {
    let list = [...nationalStatesList];
    if (statesModalFilter === "state") {
      list = list.filter((s) => s.status === "STATE");
    } else if (statesModalFilter === "territory") {
      list = list.filter((s) => s.status === "TERRITORY");
    } else if (statesModalFilter === "energy") {
      list = list.filter((s) => {
        const endow = getUsStateEndowment(s.name);
        return (endow?.hydrocarbonIndex || 0) >= 40;
      });
    } else if (statesModalFilter === "minerals") {
      list = list.filter((s) => {
        const endow = getUsStateEndowment(s.name);
        return (endow?.mineralIndex || 0) >= 50;
      });
    } else if (statesModalFilter === "agri") {
      list = list.filter((s) => {
        const endow = getUsStateEndowment(s.name);
        return (endow?.arableLandIndex || 0) >= 60;
      });
    } else if (statesModalFilter === "tech") {
      list = list.filter((s) => {
        const srv = getUsStateServicesEndowment(s.name);
        return (srv?.digitalConnectivityIndex || 0) >= 75 || (srv?.humanCapitalIndex || 0) >= 75;
      });
    } else if (statesModalFilter === "finance") {
      list = list.filter((s) => {
        const srv = getUsStateServicesEndowment(s.name);
        return (srv?.financialDepthIndex || 0) >= 65;
      });
    } else if (statesModalFilter === "hospitality") {
      list = list.filter((s) => {
        const srv = getUsStateServicesEndowment(s.name);
        return (srv?.consumerAmenityIndex || 0) >= 75;
      });
    }

    if (stateSearchQuery.trim()) {
      const q = stateSearchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const endow = getUsStateEndowment(s.name);
        const srv = getUsStateServicesEndowment(s.name);
        return (
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.capital && s.capital.toLowerCase().includes(q)) ||
          (s.role && s.role.toLowerCase().includes(q)) ||
          (s.region && s.region.toLowerCase().includes(q)) ||
          (endow?.resources?.hydrocarbons && endow.resources.hydrocarbons.toLowerCase().includes(q)) ||
          (endow?.resources?.criticalMinerals && endow.resources.criticalMinerals.toLowerCase().includes(q)) ||
          (endow?.resources?.agriculture && endow.resources.agriculture.toLowerCase().includes(q)) ||
          (srv?.servicesProfile?.techAndDefense && srv.servicesProfile.techAndDefense.toLowerCase().includes(q)) ||
          (srv?.servicesProfile?.banking && srv.servicesProfile.banking.toLowerCase().includes(q)) ||
          (srv?.servicesProfile?.hospitality && srv.servicesProfile.hospitality.toLowerCase().includes(q))
        );
      });
    }

    if (statesModalSort === "gdp") {
      list.sort((a, b) => (b.gdp || 0) - (a.gdp || 0));
    } else if (statesModalSort === "pops") {
      list.sort((a, b) => (b.pops || 0) - (a.pops || 0));
    } else if (statesModalSort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (statesModalSort === "energy") {
      list.sort((a, b) => (getUsStateEndowment(b.name)?.hydrocarbonIndex || 0) - (getUsStateEndowment(a.name)?.hydrocarbonIndex || 0));
    } else if (statesModalSort === "minerals") {
      list.sort((a, b) => (getUsStateEndowment(b.name)?.mineralIndex || 0) - (getUsStateEndowment(a.name)?.mineralIndex || 0));
    } else if (statesModalSort === "agri") {
      list.sort((a, b) => (getUsStateEndowment(b.name)?.arableLandIndex || 0) - (getUsStateEndowment(a.name)?.arableLandIndex || 0));
    } else if (statesModalSort === "tech") {
      list.sort((a, b) => {
        const srvA = getUsStateServicesEndowment(a.name);
        const srvB = getUsStateServicesEndowment(b.name);
        return ((srvB?.digitalConnectivityIndex || 0) + (srvB?.humanCapitalIndex || 0)) - ((srvA?.digitalConnectivityIndex || 0) + (srvA?.humanCapitalIndex || 0));
      });
    } else if (statesModalSort === "finance") {
      list.sort((a, b) => (getUsStateServicesEndowment(b.name)?.financialDepthIndex || 0) - (getUsStateServicesEndowment(a.name)?.financialDepthIndex || 0));
    } else if (statesModalSort === "amenity") {
      list.sort((a, b) => (getUsStateServicesEndowment(b.name)?.consumerAmenityIndex || 0) - (getUsStateServicesEndowment(a.name)?.consumerAmenityIndex || 0));
    } else if (statesModalSort === "infra") {
      list.sort((a, b) => (b.infra || 0) - (a.infra || 0));
    }
    return list;
  }, [nationalStatesList, statesModalFilter, stateSearchQuery, statesModalSort]);

  // Comprehensive Global Available Provinces & Outer Space Sectors Catalog (Seceded Lands Filtered Out)
  const allGlobalProvinces = useMemo(() => {
    const list = [];
    const seen = new Set();

    // Helper to check if a territory has seceded as an independent sovereign state
    const isSecededTerritory = (name) => {
      const ownerId =
        name === "Georgia"
          ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || territoryMap["Georgia"]
          : territoryMap[name];
      const ownerNation = nationById.get(ownerId);
      return Boolean(ownerNation?.isSeceded);
    };

    // 1. All base Earth nations from STATIC_EARTH_FEATURES
    STATIC_EARTH_FEATURES.forEach((f) => {
      if (isSecededTerritory(f.name)) return;
      seen.add(f.name);
      list.push({
        name: f.name,
        planet: "Earth",
        type: "Nation",
        capital: nations.find((n) => n.name.toLowerCase() === f.name.toLowerCase())?.capital || "",
      });
    });

    // 2. All US 50 States & Territories
    Object.entries(US_STATES_CATALOG).forEach(([name, meta]) => {
      if (isSecededTerritory(name)) return;
      if (!seen.has(name)) {
        seen.add(name);
        list.push({
          name,
          planet: "Earth",
          type: meta.status || "State",
          capital: meta.capital || "City",
          code: meta.code,
        });
      }
    });

    // 3. All constituent regional states from global catalog (e.g. Bavaria, Scotland, Guangdong)
    Object.values(CONSTITUENT_REGIONAL_STATES).flat().forEach((r) => {
      if (isSecededTerritory(r.name)) return;
      if (!seen.has(r.name)) {
        seen.add(r.name);
        list.push({
          name: r.name,
          planet: "Earth",
          type: "Constituent State",
          capital: "",
        });
      }
    });

    // 4. Mars Sectors
    const MARS_SECTORS = [
      "Olympus Mons",
      "Valles Marineris",
      "Elysium Planitia",
      "Hellas Basin",
      "Utopia Planitia",
      "Isidis Planitia",
      "Chryse Planitia",
      "Noachis Terra",
      "Argyre Basin",
      "Syrtis Major",
      "Sirenum Terra",
      "Hesperia Planum",
      "Vastitas Borealis",
    ];
    MARS_SECTORS.forEach((name) => {
      if (isSecededTerritory(name)) return;
      if (!seen.has(name)) {
        seen.add(name);
        list.push({
          name,
          planet: "Mars",
          type: "Orbital Sector",
          capital: "",
        });
      }
    });

    // 5. Non-seceded entries in state.territoryMap
    Object.keys(territoryMap).forEach((name) => {
      if (isSecededTerritory(name)) return;
      if (!seen.has(name)) {
        seen.add(name);
        const ownerId = territoryMap[name];
        const ownerNation = nationById.get(ownerId);
        list.push({
          name,
          planet: ownerNation?.planet || "Earth",
          type: "Territory",
          capital: ownerNation?.capital || "",
        });
      }
    });

    return list;
  }, [territoryMap, nationById, nations]);

  return (
    <div className="space-y-5">
      {/* Top Map Command Bar: Theater Switcher, Map Lenses & Border Redraw Tools */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Planetary Theater Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {planetsConfig.map((planet) => {
            const isEarth = planet.name.toLowerCase() === "earth";
            const active = theater.toLowerCase() === planet.name.toLowerCase();
            const Icon = isEarth ? Globe2 : Rocket;

            return (
              <button
                key={planet.id || planet.name}
                onClick={() => {
                  setTheater(planet.name);
                  resetCamera();
                  const planetNation = nations.find(
                    (n) => (n.planet || "").toLowerCase() === planet.name.toLowerCase()
                  );
                  if (planetNation) onSelectNation(planetNation.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  active
                    ? isEarth
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                      : "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25"
                    : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {planet.name} Theater
              </button>
            );
          })}
        </div>

        {/* Center: Choropleth Map Lenses */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">
          {[
            { id: "sovereignty", label: "Sovereignty & Borders" },
            { id: "gdp", label: "GDP Output Lens" },
            { id: "sol", label: "Prosperity (SOL)" },
            { id: "unrest", label: "Stability & Crime" },
          ].map((lens) => (
            <button
              key={lens.id}
              onClick={() => setMapLens(lens.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                mapLens === lens.id
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {lens.label}
            </button>
          ))}
        </div>

        {/* Right: Dynamic Border Redraw & Diplomacy Tools */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setShowProvinceManager(true)}
            className="px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 cursor-pointer transition"
            title="Open Country Province Manager to annex or release global provinces"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Province Manager
          </button>

          <button
            onClick={() => setInteractionMode("inspect")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              interactionMode === "inspect"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
            title="Click any territory to inspect its controlling nation"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Inspect Nation
          </button>

          {!isReadOnly && (
            <>
              <button
                onClick={() => setInteractionMode("annex")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  interactionMode === "annex"
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                    : "text-amber-300 hover:bg-slate-800"
                }`}
                title={`Click any territory on the map to annex it into ${activeNation?.name} and redraw borders`}
              >
                <Sword className="w-3.5 h-3.5" />
                Annex for {activeNation?.name}
              </button>

              <button
                onClick={() => setInteractionMode("release")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  interactionMode === "release"
                    ? "bg-purple-500 text-slate-950 shadow-sm shadow-purple-500/30"
                    : "text-purple-300 hover:bg-slate-800"
                }`}
                title="Click any territory to release or awaken it as an independent sovereign nation"
              >
                <Flag className="w-3.5 h-3.5" />
                Release / Awaken State
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Tier Map View Navigation Bar & Persistent Breadcrumbs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-slate-400 font-bold">
              Map View Tier:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => navigateToWorld()}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mapLocation.level === "world"
                    ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                1. World-Wide
              </button>

              <button
                onClick={() => {
                  const subId = selectedSubcontinent && selectedSubcontinent !== "all" ? selectedSubcontinent : "we";
                  navigateToSubcontinent(subId);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mapLocation.level === "subcontinent"
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                2. Subcontinent Focus
              </button>

              <button
                onClick={() => {
                  if (activeNation) navigateToCountry(activeNation);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mapLocation.level === "country"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                3. Country & States
              </button>
            </div>
          </div>

          {/* Active Nation Quick Selector & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px]">Nation:</span>
              <select
                value={activeNation?.id || ""}
                onChange={(e) => {
                  const target = nations.find((n) => n.id === e.target.value);
                  if (target) navigateToCountry(target);
                }}
                className="bg-transparent text-cyan-300 font-bold text-xs cursor-pointer focus:outline-none"
              >
                {nations.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-white">
                    {n.name} ({n.planet})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowStatesTableModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="Open interactive state-by-state map and constituent divisions table in pop up"
            >
              <Layers className="w-3.5 h-3.5" />
              States Table Pop-Up
            </button>

            <button
              onClick={() => setShowShockModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/50 border border-rose-400/50 cursor-pointer transition active:scale-95"
              title="Trigger an economic shock, natural disaster, or port shutdown using Groq AI"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-300" />
              ⚡ Groq AI Crisis Simulator
            </button>

            {!isReadOnly && (
              <button
                onClick={() => setShowProvinceManager(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                Manage Provinces
              </button>
            )}
          </div>
        </div>

        {/* PERSISTENT GEOGRAPHIC BREADCRUMBS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-slate-300">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono-num font-bold">Location:</span>
            
            <button
              onClick={() => navigateToWorld()}
              className={`flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer ${
                mapLocation.level === "world" ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              World
            </button>

            {mapLocation.level !== "world" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => {
                    const subId = mapLocation.subcontinentId || getSubcontinentForCountry(activeNation?.id) || "we";
                    navigateToSubcontinent(subId);
                  }}
                  className={`flex items-center gap-1 hover:text-amber-400 transition cursor-pointer ${
                    mapLocation.level === "subcontinent" ? "text-amber-400 font-bold" : "text-slate-400"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  {SUBCONTINENT_PRESETS.find((p) => p.id === (mapLocation.subcontinentId || getSubcontinentForCountry(activeNation?.id)))?.name || "Region"}
                </button>
              </>
            )}

            {mapLocation.level === "country" && activeNation && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => navigateToCountry(activeNation)}
                  className="flex items-center gap-1 text-emerald-400 font-bold cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  {activeNation.name}
                </button>
              </>
            )}

            {selectedStateName && mapLocation.level === "country" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30">
                  {selectedStateName}
                </span>
              </>
            )}
          </div>

          {/* Subcontinent Switcher Pills (when in Subcontinent View) */}
          {mapLocation.level === "subcontinent" && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Subcontinents:</span>
              {SUBCONTINENT_PRESETS.filter((p) => p.id !== "all").map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigateToSubcontinent(p.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    selectedSubcontinent === p.id
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subcontinent View Regional Indicators Banner */}
        {mapLocation.level === "subcontinent" && (
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs mt-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {SUBCONTINENT_PRESETS.find((p) => p.id === selectedSubcontinent)?.name || "Subcontinent"} Regional Focus
                </h4>
                <p className="text-[11px] text-slate-400">
                  Click any country on the map or select below to inspect constituent states & regional administration.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {subcontinentNations.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigateToCountry(n)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nationColorMap.get(n.id) || n.color || "#06b6d4" }} />
                  {n.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Country View National & State Overview Banner */}
        {mapLocation.level === "country" && activeNation && (
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs mt-1">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                style={{ backgroundColor: activeNation.color || "#0284c7" }}
              >
                {activeNation.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">{activeNation.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeNation.governmentSystem || "Sovereign Republic"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono-num">
                  <span>GDP: <strong className="text-white">{formatCurrency(activeNation.computed?.aggregateGdp || 0)}</strong></span>
                  <span>Pops: <strong className="text-cyan-300">{formatCompactNumber(activeNation.computed?.effectiveWorkingPops || 0)}</strong></span>
                  <span>SoL: <strong className="text-emerald-300">{(activeNation.computed?.sol || 15).toFixed(1)}</strong></span>
                  <span>Unemp: <strong className="text-amber-300">{((activeNation.computed?.unemploymentRate || 0) * 100).toFixed(1)}%</strong></span>
                  <span>Inflation: <strong className="text-purple-300">{((activeNation.computed?.inflationRate || 0.02) * 100).toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToSubcontinent(getSubcontinentForCountry(activeNation.id))}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <ArrowLeft className="w-3 h-3 text-amber-400" />
                Back to Subcontinent
              </button>
              <button
                onClick={() => navigateToWorld()}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Globe2 className="w-3 h-3 text-cyan-400" />
                World View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Crisis Alert Banner */}
      {state?.activeEconomicShock && (
        <div className="bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-amber-950/95 border border-rose-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="flex h-3.5 w-3.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-600/60 shadow-sm">
                  {state.activeEconomicShock.severity || "HIGH"} CRISIS
                </span>
                <strong className="text-white font-bold text-sm tracking-wide">
                  {state.activeEconomicShock.headline}
                </strong>
              </div>
              <p className="text-rose-200/90 text-xs mt-1 leading-snug max-w-4xl">
                {state.activeEconomicShock.sitrep}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowShockModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition shadow"
            >
              Inspect SitRep
            </button>
            <button
              onClick={handleRestoreInfrastructure}
              disabled={shockLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg cursor-pointer transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Rebuild Infrastructure
            </button>
          </div>
        </div>
      )}

      {/* Main Split View: Interactive Map Canvas (Left 7 Cols) + Nation Command Drawer (Right 5 Cols) */}
      {viewTier === "country" && activeNation ? (
        /* TIER 3: COUNTRY & CONSTITUENT STATES DEDICATED IN-PAGE VIEW */
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* 1. Interactive ADM1 Leaflet Cartography (Left 7 Cols) */}
            <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4">
              <CountryAdm1Map
                nation={activeNation}
                selectedSubdivision={selectedStateName}
                onSelectSubdivision={(name) => setSelectedStateName(name)}
                territoryMap={territoryMap}
                nationColor={nationColorMap.get(activeNation.id) || activeNation.color || "#06b6d4"}
                economicSubdivisions={nationalStatesList}
                customEndowments={state?.customStateEndowments}
              />
            </div>

            {/* 2. State & Natural Resources Dossier Panel (Right 5 Cols) */}
            <div className="xl:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800 text-xs shadow-2xl space-y-3">
              {(() => {
                const isUsa = activeNation.id === "usa" || activeNation.name?.toLowerCase().includes("united states");
                const activeDossier = (selectedStateName
                  ? nationalStatesList.find((s) => s.name === selectedStateName)
                  : (hoveredModalState || nationalStatesList[0])) || (selectedStateName ? {
                      name: selectedStateName,
                      role: "Constituent Sovereign State",
                      status: "STATE",
                    } : null);

                if (activeDossier) {
                  const stateMeta = isUsa ? getUsaStateData(activeDossier.name) : null;
                  const stateGdp = activeDossier.gdp || (stateMeta ? (c.aggregateGdp || 0) * stateMeta.gdpShare : 0);
                  const statePops = activeDossier.pops || (stateMeta ? Math.round((c.effectiveWorkingPops || 0) * stateMeta.popShare) : 0);
                  const gdpSharePercent = stateMeta ? (stateMeta.gdpShare * 100).toFixed(1) : (c.aggregateGdp > 0 ? ((stateGdp / c.aggregateGdp) * 100).toFixed(1) : "0.0");
                  const popSharePercent = stateMeta ? (stateMeta.popShare * 100).toFixed(1) : (c.effectiveWorkingPops > 0 ? ((statePops / c.effectiveWorkingPops) * 100).toFixed(1) : "0.0");
                  const capital = activeDossier.capital || stateMeta?.capital || (activeDossier.name === "Georgia" ? "Atlanta" : "");

                  return (
                    <div className="space-y-3 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <span className="font-bold text-white text-base flex items-center gap-1.5 flex-wrap">
                            {activeDossier.name}
                            {(activeDossier.code || stateMeta?.code) && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-num text-xs font-bold">
                                {activeDossier.code || stateMeta?.code}
                              </span>
                            )}
                          </span>
                          {capital && (
                            <span className="text-xs text-slate-400 font-normal block mt-0.5">
                              Capital: <strong className="text-slate-200">{capital}</strong>
                            </span>
                          )}
                        </div>
                        {activeDossier.isSeceded ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                            ★ Seceded Sovereign
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                            {activeDossier.status || "STATE"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {activeDossier.region || activeDossier.role || "Constituent Sovereign State"}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono-num text-xs">
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">State GDP & National Share:</span>
                          <strong className="text-emerald-400 text-sm">
                            {formatCurrency(stateGdp)}
                          </strong>
                          <span className="text-cyan-400 font-bold block text-[10px] mt-0.5">
                            {gdpSharePercent}% of {activeNation.name} GDP
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Constituent Workforce:</span>
                          <strong className="text-white text-sm">
                            {formatCompactNumber(statePops)}
                          </strong>
                          <span className="text-slate-400 block text-[10px] mt-0.5">
                            {popSharePercent}% of Workforce
                          </span>
                        </div>
                      </div>

                      {/* Geographic Resource Endowments Breakdown (USGS, EIA, USDA) */}
                      {isUsa && (() => {
                        const endow = getUsStateEndowment(activeDossier.name);
                        if (!endow) return null;
                        return (
                          <div className="mt-2 pt-2 border-t border-slate-800/90 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span className="text-cyan-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                Geographic Resource Endowments:
                              </span>
                              {onJumpToTab ? (
                                <button
                                  type="button"
                                  onClick={() => onJumpToTab("sources")}
                                  className="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 font-mono-num text-[10px] cursor-pointer flex items-center gap-1 transition"
                                  title="Inspect full historical and empirical sources"
                                >
                                  USGS / EIA / USDA <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <span className="text-slate-500 font-mono-num">USGS / EIA / USDA</span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-num">
                              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200">
                                <span className="text-[9px] text-amber-400 block font-bold flex items-center gap-1">
                                  <Fuel className="w-3 h-3" /> 🛢️ Oil & Gas:
                                </span>
                                <strong>{endow.hydrocarbonIndex}%</strong> ({endow.hydrocarbonIndex > 60 ? "Abundant Reserves" : endow.hydrocarbonIndex > 25 ? "Moderate Play" : endow.hydrocarbonIndex > 0 ? "Marginal" : "None / 0%"})
                              </div>
                              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-200">
                                <span className="text-[9px] text-purple-400 block font-bold flex items-center gap-1">
                                  <Pickaxe className="w-3 h-3" /> ⛏️ Minerals:
                                </span>
                                <strong>{endow.mineralIndex}%</strong> ({endow.mineralIndex > 60 ? "Rich Deposits" : endow.mineralIndex > 30 ? "Standard" : endow.mineralIndex > 0 ? "Minor Aggregates" : "None / 0%"})
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
                                <span className="text-[9px] text-emerald-400 block font-bold flex items-center gap-1">
                                  <Wheat className="w-3 h-3" /> 🌾 Arable Land:
                                </span>
                                <strong>{endow.arableLandIndex}%</strong> ({endow.arableLandIndex > 70 ? "Prime Breadbasket" : endow.arableLandIndex > 35 ? "Arable Soil / Grazing" : endow.arableLandIndex > 0 ? "Marginal" : "Non-Arable / 0%"})
                              </div>
                              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-200">
                                <span className="text-[9px] text-cyan-400 block font-bold flex items-center gap-1">
                                  <Anchor className="w-3 h-3" /> ⚓ Logistics & Ports:
                                </span>
                                <strong>{endow.logisticsWaterwayIndex}%</strong> ({endow.logisticsWaterwayIndex > 80 ? "Super-Hub Gateway" : endow.logisticsWaterwayIndex > 40 ? "Regional Artery" : endow.logisticsWaterwayIndex > 0 ? "Minor Inland River" : "Landlocked / 0%"})
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
                              <p className="text-slate-300">
                                <strong className="text-amber-300">Hydrocarbons:</strong> {endow.resources?.hydrocarbons || "Regional distribution"}
                              </p>
                              <p className="text-slate-300">
                                <strong className="text-purple-300">Critical Minerals:</strong> {endow.resources?.criticalMinerals || "Aggregates & stone"}
                              </p>
                              <p className="text-slate-300">
                                <strong className="text-emerald-300">Agriculture:</strong> {endow.resources?.agriculture || "Diversified farming"}
                              </p>
                              <div className="pt-1 mt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                                <span>Modeled Industrial: <strong className="text-cyan-300">{endow.modeledIndustrialOutput}</strong></span>
                                <span>Agri: <strong className="text-emerald-300">{endow.modeledAgriculturalOutput}</strong></span>
                              </div>
                            </div>

                            {/* Groq AI Economic Advisory Trigger */}
                            <button
                              onClick={() => requestAiAdvisory(activeDossier.name, activeDossier, endow)}
                              disabled={aiLoading}
                              className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-purple-600/50 border border-cyan-500/40 text-cyan-200 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                              {aiLoading && aiTarget === activeDossier.name ? "Generating Strategy with Groq AI..." : `Ask Groq AI: Strategy for ${activeDossier.name}`}
                            </button>
                            {aiAdvisory && aiTarget === activeDossier.name && (
                              <div className="mt-2 p-2.5 rounded-xl bg-slate-950/95 border border-purple-500/40 text-[10px] text-slate-200 space-y-1.5 max-h-56 overflow-y-auto font-sans leading-relaxed">
                                <div className="flex items-center justify-between font-bold text-purple-300 text-[10.5px] pb-1 border-b border-purple-500/20">
                                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-400" /> Groq AI Economic Intelligence</span>
                                  <button onClick={() => setAiAdvisory(null)} className="text-slate-500 hover:text-white text-xs cursor-pointer">✕</button>
                                </div>
                                <div className="whitespace-pre-line text-slate-300 pt-0.5">{aiAdvisory}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                }

                return (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-cyan-400/80" />
                    <p className="font-bold text-slate-200 text-sm">Interactive Cartography Overview</p>
                    <p className="text-xs text-slate-400">
                      Click on any real administrative polygon or table row below to inspect its natural resources and state economic contribution.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 3. Full Constituent States & Natural Resources Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Toolbar */}
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Status & Natural Resource Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto">
                  <button
                    onClick={() => setStatesModalFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "all"
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Subdivisions ({nationalStatesList.length})
                  </button>
                  <button
                    onClick={() => setStatesModalFilter("state")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "state"
                        ? "bg-slate-800 text-cyan-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Core States
                  </button>
                  <button
                    onClick={() => setStatesModalFilter("territory")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "territory"
                        ? "bg-slate-800 text-amber-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Territories
                  </button>

                  {activeNation.id === "usa" && (
                    <>
                      <button
                        onClick={() => setStatesModalFilter("energy")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "energy"
                            ? "bg-amber-500/25 border border-amber-500/50 text-amber-300 font-bold"
                            : "text-amber-400 hover:text-amber-200"
                        }`}
                      >
                        <Fuel className="w-3 h-3" /> 🛢️ Energy
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("minerals")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "minerals"
                            ? "bg-purple-500/25 border border-purple-500/50 text-purple-300 font-bold"
                            : "text-purple-400 hover:text-purple-200"
                        }`}
                      >
                        <Pickaxe className="w-3 h-3" /> ⛏️ Minerals
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("agri")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "agri"
                            ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold"
                            : "text-emerald-400 hover:text-emerald-200"
                        }`}
                      >
                        <Wheat className="w-3 h-3" /> 🌾 Agriculture
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("tech")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "tech"
                            ? "bg-blue-500/25 border border-blue-500/50 text-blue-300 font-bold"
                            : "text-blue-400 hover:text-blue-200"
                        }`}
                      >
                        <Laptop className="w-3 h-3" /> 💻 High-Tech & R&D
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("finance")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "finance"
                            ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold"
                            : "text-emerald-400 hover:text-emerald-200"
                        }`}
                      >
                        <Building2 className="w-3 h-3" /> 🏦 Finance
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("hospitality")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "hospitality"
                            ? "bg-rose-500/25 border border-rose-500/50 text-rose-300 font-bold"
                            : "text-rose-400 hover:text-rose-200"
                        }`}
                      >
                        <UtensilsCrossed className="w-3 h-3" /> 🍸 Hospitality
                      </button>
                    </>
                  )}
                </div>

                {/* Search Box */}
                <div className="relative min-w-[200px] max-w-xs flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      activeNation.id === "usa"
                        ? "Search 56 states, capitals, minerals, basins..."
                        : "Search states or subdivisions..."
                    }
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Sort By:</span>
                <select
                  value={statesModalSort}
                  onChange={(e) => setStatesModalSort(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="gdp">State GDP (% of National Economy)</option>
                  <option value="pops">Working Population</option>
                  <option value="name">State Name (A → Z)</option>
                  {activeNation.id === "usa" && (
                    <>
                      <option value="energy">🛢️ Oil & Gas Endowments</option>
                      <option value="minerals">⛏️ Critical Minerals Endowments</option>
                      <option value="agri">🌾 Agricultural Endowments</option>
                      <option value="tech">💻 High-Tech & STEM Strength</option>
                      <option value="finance">🏦 Financial Depth</option>
                      <option value="amenity">🍸 Tourism & Amenities</option>
                    </>
                  )}
                  <option value="infra">Infrastructure Efficiency</option>
                </select>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {modalFilteredStates.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-sm font-bold">
                    ∅
                  </div>
                  <h4 className="text-sm font-bold text-white">No States or Territories Found</h4>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search query or filter settings.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950/90 text-[10px] uppercase tracking-wider text-slate-400 font-mono-num border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">State & Capital</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-3">Primary Natural Resources & Role</th>
                      <th className="py-3 px-3 text-right">State GDP & Share</th>
                      <th className="py-3 px-3 text-right">Workforce</th>
                      <th className="py-3 px-3 text-right">Modeled Production</th>
                      <th className="py-3 px-4 text-center">Statecraft Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono-num">
                    {modalFilteredStates.map((st, idx) => {
                      const isTerritory = st.status === "TERRITORY";
                      const isSelectedState = selectedStateName === st.name;
                      const gdpPercent =
                        c.aggregateGdp > 0 ? (st.gdp / c.aggregateGdp) * 100 : 0;
                      const popPercent =
                        c.effectiveWorkingPops > 0
                          ? (st.pops / c.effectiveWorkingPops) * 100
                          : 0;

                      return (
                        <tr
                          key={st.name || idx}
                          onClick={() => setSelectedStateName(st.name)}
                          className={`transition cursor-pointer ${
                            isSelectedState
                              ? "bg-cyan-950/60 ring-2 ring-cyan-500 shadow-md"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-500 font-bold text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isTerritory ? "bg-amber-400" : "bg-cyan-400"
                                }`}
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">
                                    {st.name}
                                  </span>
                                  {st.code && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                                      {st.code}
                                    </span>
                                  )}
                                </div>
                                {st.capital && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Capital: <strong className="text-slate-300">{st.capital}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-num ${
                                isTerritory
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              }`}
                            >
                              {st.status || "STATE"}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <span className="text-slate-300 block truncate font-medium">
                              {st.role || "Constituent Sovereign State"}
                            </span>
                            {activeNation.id === "usa" && (() => {
                              const endow = getUsStateEndowment(st.name);
                              if (!endow) return null;
                              return (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                  {endow.hydrocarbonIndex > 30 && (
                                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                                      <Fuel className="w-2.5 h-2.5" /> 🛢️ {endow.hydrocarbonIndex}%
                                    </span>
                                  )}
                                  {endow.mineralIndex > 40 && (
                                    <span className="text-purple-400 flex items-center gap-0.5 font-bold">
                                      <Pickaxe className="w-2.5 h-2.5" /> ⛏️ {endow.mineralIndex}%
                                    </span>
                                  )}
                                  {endow.arableLandIndex > 50 && (
                                    <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                                      <Wheat className="w-2.5 h-2.5" /> 🌾 {endow.arableLandIndex}%
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-emerald-400 text-xs block">
                              {formatCurrency(st.gdp)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-bold">
                              {gdpPercent.toFixed(1)}% of {activeNation.name} GDP
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-white text-xs block">
                              {formatCompactNumber(st.pops)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              ({popPercent.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-[11px]">
                            {activeNation.id === "usa" ? (() => {
                              const endow = getUsStateEndowment(st.name);
                              return (
                                <div className="text-right font-mono-num">
                                  <span className="text-slate-300 block text-[10px]">
                                    Ind: <strong className="text-cyan-300">{endow.modeledIndustrialOutput?.split(' ')[0] || '-'}</strong>
                                  </span>
                                  <span className="text-slate-400 block text-[10px]">
                                    Agri: <strong className="text-emerald-300">{endow.modeledAgriculturalOutput?.split(' ')[0] || '-'}</strong>
                                  </span>
                                </div>
                              );
                            })() : (
                              <span className="text-amber-300 font-bold">{formatPercent(st.infra, 0)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStateName(st.name);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                                  isSelectedState
                                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                                    : "bg-slate-800 hover:bg-slate-700 text-cyan-300"
                                }`}
                                title="Display complete state details and natural resources on the side panel"
                              >
                                <Sparkles className="w-3 h-3" /> Inspect Details
                              </button>

                              {isTerritory && !isReadOnly && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTransferTerritory({
                                      territoryName: st.name,
                                      targetNationId: activeNation.id,
                                      mode: "INTEGRATE",
                                      planet: activeNation.planet || "Earth",
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Elevate this territory into full Constituent Statehood"
                                >
                                  ★ Integrate
                                </button>
                              )}

                              {!isReadOnly && nations.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferringState(st);
                                    setTransferTargetNationId("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                  title="Transfer this state/territory to another country"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono-num">
              <span>
                Showing <strong className="text-white">{modalFilteredStates.length}</strong> of{" "}
                <strong className="text-white">{nationalStatesList.length}</strong> subdivisions in{" "}
                <strong className="text-cyan-300">{activeNation.name}</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
      /* Main Split View: Interactive Map Canvas (Left 7 Cols) + Nation Command Drawer (Right 5 Cols) */
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* INTERACTIVE VECTOR MAP CANVAS */}
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
          {/* Active Mode Banner */}
          {interactionMode !== "inspect" && (
            <div
              className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                interactionMode === "annex"
                  ? "bg-amber-500/20 border-b border-amber-500/40 text-amber-200"
                  : "bg-purple-500/20 border-b border-purple-500/40 text-purple-200"
              }`}
            >
              <span>
                {interactionMode === "annex"
                  ? `BORDER EXPANSION MODE: Click any territory on ${theater} to annex it into ${activeNation?.name} and merge borders.`
                  : `DECOLONIZE / AWAKEN MODE: Click any territory on ${theater} to grant it independent borders and sovereignty.`}
              </span>
              <button
                onClick={() => setInteractionMode("inspect")}
                className="px-2 py-0.5 rounded bg-slate-950/60 text-white hover:bg-slate-950 cursor-pointer"
              >
                Exit Mode
              </button>
            </div>
          )}

          {/* Floating Camera Controls (Top-Left inside Map) */}
          <div className="absolute top-14 left-4 z-20 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.min(9, Number((z * 1.35).toFixed(2))))}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 cursor-pointer"
              title="Zoom In (or use Mouse Scroll Wheel)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setZoom((z) => {
                  const next = Math.max(1, Number((z / 1.35).toFixed(2)));
                  if (next === 1) setPan({ x: 0, y: 0 });
                  return next;
                })
              }
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetCamera}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 cursor-pointer"
              title="Reset Map Camera"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-mono-num text-center text-cyan-400 pt-0.5 border-t border-slate-800">
              {zoom.toFixed(1)}x
            </div>
          </div>

          {/* Floating Hovered Territory Tooltip (Isolated from Map Re-renders) */}
          <MapHoverTooltip
            ref={tooltipRef}
            interactionMode={interactionMode}
            activeNationName={activeNation?.name}
          />

          {/* SVG Interactive Map Viewport (Scroll-to-zoom disabled for natural page scroll; use zoom buttons or drag) */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-[540px] select-none overflow-hidden ${
              isDragging
                ? "cursor-grabbing"
                : interactionMode !== "inspect"
                ? "cursor-crosshair"
                : "cursor-grab"
            } ${
              theater === "Mars"
                ? "bg-[radial-gradient(circle_at_center,#2a120a_0%,#090504_100%)]"
                : "bg-[radial-gradient(circle_at_center,#081e36_0%,#020617_100%)]"
            }`}
          >
            <svg viewBox="0 0 960 500" className="w-full h-full">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g
                transform={`translate(480, 250) scale(${zoom}) translate(${
                  -480 + pan.x
                }, ${-250 + pan.y})`}
                style={{
                  transition: isDragging ? "none" : "transform 160ms ease-out",
                }}
              >
                {/* THEATER 1: EARTH WORLD MAP */}
                {theater === "Earth" && (
                  <>
                    {/* Subtle Graticule / Ocean Latitude Lines */}
                    {[100, 175, 250, 325, 400].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        y1={y}
                        x2="920"
                        y2={y}
                        stroke="#0f2942"
                        strokeWidth={0.6 / zoom}
                        strokeDasharray="3,3"
                      />
                    ))}

                    {/* Country Territory Polygons on Earth */}
                    {(() => {
                      return (
                        <>
                          {earthFeatures.map((feat) => {
                            const ctrlId = territoryMap[feat.name] || (feat.name === "United States of America" ? (territoryMap["United States of America"] || "usa") : null);
                            const ctrlNation = nationById.get(ctrlId) || (feat.name === "United States of America" ? nationById.get("usa") : null) || ALL_NATIONS_BY_NAME.get(feat.name.toLowerCase());
                            const isSelected =
                              ctrlNation && ctrlNation.id === activeNation?.id;
                            const fill = getTerritoryFill(feat.name);

                            return (
                              <path
                                key={feat.id || feat.name}
                                d={feat.d}
                                fill={fill}
                                fillOpacity={
                                  isSelected ? 0.92 : ctrlNation ? 0.75 : 0.45
                                }
                                stroke={isSelected ? "#38bdf8" : "#475569"}
                                strokeOpacity={isSelected ? 1 : 0.75}
                                strokeWidth={(isSelected ? 1.5 : 0.85) / zoom}
                                className="transition-colors duration-150 hover:brightness-125 cursor-pointer"
                                onMouseEnter={() =>
                                  setHoveredTerritory({
                                    name: feat.name,
                                    isControlled: Boolean(ctrlNation),
                                    controllerName:
                                      ctrlNation?.name || "Non-Aligned Territory",
                                    gdp: ctrlNation?.computed?.aggregateGdp,
                                    sol: ctrlNation?.computed?.sol,
                                    pops: ctrlNation?.computed?.effectiveWorkingPops,
                                  })
                                }
                                onMouseLeave={() => setHoveredTerritory(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target =
                                    ctrlNation ||
                                    getSovereignNation(feat.name) ||
                                    nationById.get(feat.name) ||
                                    ALL_NATIONS_BY_NAME.get(feat.name.toLowerCase()) ||
                                    ALL_NATIONS_BY_ID.get(feat.name.toLowerCase());
                                  if (target) {
                                    navigateToCountry(target);
                                  } else {
                                    handleTerritoryClick(feat.name, "Earth");
                                  }
                                }}
                              />
                            );
                          })}

                          {/* United States Seceded Sovereign Republics (e.g. California Republic, Texas) rendered on main map ONLY if seceded */}
                          {STATIC_US_STATE_FEATURES.map((stFeat) => {
                            const directOwnerId =
                              stFeat.name === "Georgia"
                                ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || (territoryMap["Georgia"] === "usa" ? "usa" : territoryMap["Georgia"] || "usa")
                                : territoryMap[stFeat.name] || territoryMap["United States of America"] || "usa";

                            const isSeceded = directOwnerId !== "usa" && directOwnerId !== territoryMap["United States of America"];
                            
                            // Never render regular constituent states on main map — they belong strictly in the Country Cartography pop-up!
                            if (!isSeceded) {
                              return null;
                            }

                            const stNation = nationById.get(directOwnerId) || nationById.get("usa");
                            const isSelected = stNation && stNation.id === activeNation?.id;
                            const meta = getUsaStateData(stFeat.name);

                            const fillColor = stNation?.color || "#f59e0b";

                            return (
                              <path
                                key={`us_state_${stFeat.name}`}
                                d={stFeat.d}
                                fill={fillColor}
                                fillOpacity={0.94}
                                stroke={isSelected ? "#38bdf8" : "#ffffff"}
                                strokeOpacity={0.95}
                                strokeWidth={(isSelected ? 1.8 : 0.8) / zoom}
                                className="transition-colors duration-150 hover:brightness-125 cursor-pointer"
                                onMouseEnter={() => {
                                  setHoveredTerritory({
                                    name: stFeat.name,
                                    isControlled: true,
                                    controllerName: stNation?.name || "Seceded Sovereign State",
                                    gdp: stNation?.computed?.aggregateGdp,
                                    sol: stNation?.computed?.sol,
                                    pops: stNation?.computed?.effectiveWorkingPops,
                                    status: "SECEDED SOVEREIGN STATE",
                                  });
                                }}
                                onMouseLeave={() => setHoveredTerritory(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStateName(stFeat.name);
                                  navigateToCountry(stNation || activeNation, true);
                                }}
                              />
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Internal Provincial Borders (Distinct Provincial Delineations across Nations) */}
                    {internalBorderPath && (
                      <path
                        d={internalBorderPath}
                        fill="none"
                        stroke="#38bdf8"
                        strokeOpacity={0.7}
                        strokeWidth={0.95 / zoom}
                        strokeDasharray={`${3 / zoom},${2 / zoom}`}
                        pointerEvents="none"
                      />
                    )}

                    {/* Dynamic Merged Sovereign International Borders */}
                    {sovereignBorderPath && (
                      <path
                        d={sovereignBorderPath}
                        fill="none"
                        stroke="#f8fafc"
                        strokeOpacity={0.95}
                        strokeWidth={1.5 / zoom}
                        pointerEvents="none"
                      />
                    )}

                    {/* Capital Markers & Nation Badges on Earth */}
                    {earthFeatures
                      .filter((f) => {
                        const ctrlId = territoryMap[f.name] || (f.name === "United States of America" ? "usa" : null);
                        const n = nationById.get(ctrlId) || (f.name === "United States of America" ? nationById.get("usa") : null) || ALL_NATIONS_BY_NAME.get(f.name.toLowerCase());
                        if (!n) return false;
                        return n.name?.toLowerCase() === f.name.toLowerCase() || (n.id === "usa" && f.name === "United States of America");
                      })
                      .map((f) => {
                        const ctrlId = territoryMap[f.name] || (f.name === "United States of America" ? "usa" : null);
                        const n = nationById.get(ctrlId) || (f.name === "United States of America" ? nationById.get("usa") : null) || ALL_NATIONS_BY_NAME.get(f.name.toLowerCase());
                        const [cx, cy] = f.centroid;
                        const isSelected = n.id === activeNation?.id;
                        return (
                          <g
                            key={`label_${f.name}`}
                            transform={`translate(${cx}, ${cy})`}
                            className="pointer-events-none"
                          >
                            <circle
                              r={(isSelected ? 4.5 : 3) / Math.sqrt(zoom)}
                              fill={isSelected ? "#22d3ee" : "#ffffff"}
                              stroke="#020617"
                              strokeWidth={1 / Math.sqrt(zoom)}
                            />
                            {/* Clean map: Only show country name text at subcontinent level */}
                            {viewTier === "subcontinent" && (
                              <text
                                y={-6 / Math.sqrt(zoom)}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize={10 / Math.sqrt(zoom)}
                                fontWeight="700"
                                style={{
                                  textShadow: "0 1px 4px rgba(0,0,0,0.95)",
                                }}
                              >
                                {n.name}
                              </text>
                            )}
                          </g>
                        );
                      })}

                    {/* Seceded Nation Capital Pins & Labels on Earth */}
                    {STATIC_US_STATE_FEATURES.map((stFeat) => {
                      const directOwnerId =
                        stFeat.name === "Georgia"
                          ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || (territoryMap["Georgia"] === "usa" ? "usa" : territoryMap["Georgia"])
                          : territoryMap[stFeat.name];
                      const usaOwnerId = territoryMap["United States of America"] || "usa";
                      if (!directOwnerId || directOwnerId === usaOwnerId) return null;

                      const stNation = nationById.get(directOwnerId);
                      if (!stNation) return null;
                      const [cx, cy] = stFeat.centroid;
                      if (!cx || !cy || cx <= 0) return null;
                      const isSelected = stNation.id === activeNation?.id;

                      return (
                        <g
                          key={`seceded_pin_${stFeat.name}`}
                          transform={`translate(${cx}, ${cy})`}
                          className="cursor-pointer group pointer-events-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusOnCountry(stNation);
                            setShowStatesTableModal(true);
                          }}
                        >
                          <circle
                            r={(isSelected ? 5.0 : 3.8) / Math.sqrt(zoom)}
                            fill={stNation.color || "#f59e0b"}
                            stroke="#ffffff"
                            strokeWidth={1.2 / Math.sqrt(zoom)}
                          />
                          <circle r={1.6 / Math.sqrt(zoom)} fill="#020617" />
                          {/* Only show text label at subcontinent level */}
                          {viewTier === "subcontinent" && (
                            <text
                              y={-6 / Math.sqrt(zoom)}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={9 / Math.sqrt(zoom)}
                              fontWeight="bold"
                              fontFamily="sans-serif"
                              className="pointer-events-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
                            >
                              {stNation.name}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Regional Constituent States for Other Major Global Nations */}
                    {viewTier === "country" &&
                      activeNation &&
                      activeNation.id !== "usa" && (
                        <g key="global_regional_states_pins" className="pointer-events-none">
                          {(
                            GLOBAL_REGIONAL_CENTROIDS[
                              activeNation.id.toLowerCase()
                            ] || []
                          ).map((reg, idx) => {
                            const pt = STATIC_PATH_GEN.projection()(reg.coords);
                            if (!pt) return null;
                            const [rx, ry] = pt;
                            const isRegSelected =
                              selectedStateName &&
                              reg.name
                                .toLowerCase()
                                .includes(selectedStateName.toLowerCase());

                            return (
                              <g
                                key={`reg_marker_${idx}`}
                                transform={`translate(${rx}, ${ry})`}
                              >
                                <circle
                                  r={(isRegSelected ? 4.2 : 2.8) / Math.sqrt(zoom)}
                                  fill={isRegSelected ? "#ffffff" : "#38bdf8"}
                                  stroke="#020617"
                                  strokeWidth={0.8 / Math.sqrt(zoom)}
                                />
                                <text
                                  y={-4 / Math.sqrt(zoom)}
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize={7.8 / Math.sqrt(zoom)}
                                  fontWeight="700"
                                  style={{
                                    textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                                  }}
                                >
                                  {reg.name.split(" ")[0]}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      )}
                  </>
                )}

                {/* THEATER 2: MARS PLANETARY SECTOR MAP */}
                {theater === "Mars" && (
                  <>
                    {MARS_PROVINCE_POLYGONS.map((prov) => {
                      const ctrlId = territoryMap[prov.name];
                      const ctrlNation = nationById.get(ctrlId);
                      const isSelected =
                        ctrlNation && ctrlNation.id === activeNation?.id;
                      const fill = ctrlNation
                        ? getTerritoryFill(prov.name)
                        : "#3b1d14";

                      return (
                        <g
                          key={prov.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTerritoryClick(prov.name, "Mars");
                          }}
                          onMouseEnter={() =>
                            setHoveredTerritory({
                              name: `${prov.name} (${prov.terrain})`,
                              isControlled: Boolean(ctrlNation),
                              controllerName:
                                ctrlNation?.name || "Unclaimed Martian Frontier",
                              gdp: ctrlNation?.computed?.aggregateGdp,
                              sol: ctrlNation?.computed?.sol,
                              pops: ctrlNation?.computed?.effectiveWorkingPops,
                            })
                          }
                          onMouseLeave={() => setHoveredTerritory(null)}
                          className="cursor-pointer group"
                        >
                          <polygon
                            points={prov.points}
                            fill={fill}
                            fillOpacity={
                              isSelected ? 0.9 : ctrlNation ? 0.72 : 0.45
                            }
                            stroke={isSelected ? "#ffffff" : "#fb923c"}
                            strokeOpacity={isSelected ? 1 : 0.8}
                            strokeWidth={(isSelected ? 2.4 : 1.35) / zoom}
                            className="transition duration-150 hover:brightness-125"
                          />
                          <circle
                            cx={prov.cx}
                            cy={prov.cy}
                            r={3 / Math.sqrt(zoom)}
                            fill={ctrlNation ? "#ffffff" : "#fb923c"}
                          />
                          <text
                            x={prov.cx}
                            y={prov.cy - 7 / Math.sqrt(zoom)}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={10 / Math.sqrt(zoom)}
                            fontWeight="700"
                            style={{ textShadow: "0 1px 4px #000" }}
                          >
                            {prov.name}
                          </text>
                          <text
                            x={prov.cx}
                            y={prov.cy + 12 / Math.sqrt(zoom)}
                            textAnchor="middle"
                            fill="#fed7aa"
                            fontSize={8.5 / Math.sqrt(zoom)}
                            fontWeight="600"
                          >
                            {ctrlNation ? `[${ctrlNation.name}]` : "Unclaimed"}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
              </g>
            </svg>
          </div>

          {/* Bottom Nation Quick-Select Legend Strip inside Map Card */}
          <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {nations.map((n) => {
                const active = n.id === activeNation?.id;
                const color = nationColorMap.get(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onSelectNation(n.id);
                      const isMars = (n.planet || "")
                        .toLowerCase()
                        .includes("mars");
                      if (isMars && theater !== "Mars") setTheater("Mars");
                      if (!isMars && theater === "Mars") setTheater("Earth");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                      active
                        ? "bg-slate-800 text-white border-cyan-400 shadow-sm"
                        : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{n.name}</span>
                    {n.territoryCount > 1 && (
                      <span className="text-[10px] font-mono-num text-slate-400">
                        ({n.territoryCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (5 Cols): NATION COMMAND & STATECRAFT DRAWER */}
        {activeNation && (
          <div className="xl:col-span-5 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl">
            {/* Nation Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-lg"
                  style={{
                    backgroundColor:
                      nationColorMap.get(activeNation.id) || "#06b6d4",
                  }}
                >
                  {activeNation.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-display text-white">
                      {activeNation.name}
                    </h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                      {activeNation.planet} • {activeNation.territoryCount || 1}{" "}
                      {activeNation.territoryCount === 1
                        ? "Territory"
                        : "Territories"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Governing Coalition:{" "}
                    <span className="text-slate-200 font-semibold">
                      {activeNation.rulingParty}
                    </span>{" "}
                    • Bourse: {activeNation.stockExchangeName}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-400">National GDP</div>
                <div className="text-2xl font-bold font-mono-num text-white">
                  {formatCurrency(c.aggregateGdp)}
                </div>
              </div>
            </div>

            {/* Drawer View Switcher: States & Provinces vs Cabinet & Economy */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setRightPanelTab("states")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightPanelTab === "states"
                    ? "bg-cyan-500 text-slate-950 shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                States & Provinces ({nationalStatesList.length})
              </button>
              <button
                onClick={() => setRightPanelTab("cabinet")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightPanelTab === "cabinet"
                    ? "bg-cyan-500 text-slate-950 shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Cabinet & Economy
              </button>
            </div>

            {/* VIEW 1: STATES & PROVINCES BREAKDOWN */}
            {rightPanelTab === "states" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono-num uppercase tracking-wider text-cyan-400 font-bold block">
                      Provincial Sovereignty & Local Development
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Constituent States of {activeNation.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowStatesTableModal(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                      title="Open Pop Up Table of States & Territories"
                    >
                      <Layers className="w-3.5 h-3.5" /> Table Pop Up
                    </button>

                    {!isReadOnly && (
                      <button
                        onClick={() => setShowProvinceManager(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Annex
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Search Filter across States */}
                {nationalStatesList.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${nationalStatesList.length} states/regions... (e.g. Texas, CA)`}
                      value={stateSearchQuery}
                      onChange={(e) => setStateSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                    />
                  </div>
                )}

                {/* List of States & Provinces */}
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {nationalStatesList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto font-bold text-xs">
                        ★
                      </div>
                      <h4 className="text-sm font-bold text-white">Unitary Sovereign State</h4>
                      <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                        <strong className="text-cyan-300">{activeNation.name}</strong> is an independent constituent state that seceded from its former sovereign. In accordance with statecraft rules, it is a unitary sovereign entity and contains no further sub-provinces or internal subdivisions.
                      </p>
                    </div>
                  ) : (
                    nationalStatesList
                      .filter((st) => {
                        if (!stateSearchQuery.trim()) return true;
                        const q = stateSearchQuery.toLowerCase().trim();
                        return (
                          st.name.toLowerCase().includes(q) ||
                          (st.code && st.code.toLowerCase().includes(q)) ||
                          (st.region && st.region.toLowerCase().includes(q))
                        );
                      })
                      .map((st, idx) => {
                        const isTerritory = st.status === "TERRITORY";
                        const isSelectedState = selectedStateName === st.name;

                        return (
                          <div
                            key={st.name || idx}
                            className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                              isSelectedState
                                ? "ring-2 ring-cyan-400 bg-cyan-950/50 border-cyan-400/80 shadow-lg shadow-cyan-500/10"
                                : isTerritory
                                ? "bg-slate-950/80 border-amber-500/30"
                                : "bg-slate-950/70 border-slate-800 hover:border-cyan-500/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isTerritory ? "bg-amber-400" : "bg-cyan-400"
                                    }`}
                                  />
                                  <h4 className="text-sm font-bold text-white">{st.name}</h4>
                                  {st.code && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold font-mono-num">
                                      {st.code}
                                    </span>
                                  )}
                                  {isTerritory ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold font-mono-num">
                                      TERRITORY
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono-num">
                                      State #{idx + 1}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">{st.role}</p>
                              </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-500 block">Regional GDP</span>
                              <span className="text-xs font-bold font-mono-num text-emerald-400">
                                {formatCurrency(st.gdp)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-lg text-[10px] font-mono-num text-slate-300">
                            <div>
                              <span className="text-slate-500 block">Working Pops:</span>
                              <span className="text-white font-bold">{formatCompactNumber(st.pops)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Infra Efficiency:</span>
                              <span className="text-amber-300 font-bold">{formatPercent(st.infra, 0)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Urbanisation:</span>
                              <span className="text-cyan-300 font-bold">{formatPercent(st.urban, 0)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900 flex-wrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => focusOnTerritory(st.name)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                              >
                                <MapPin className="w-3 h-3" /> Focus on Map
                              </button>

                              {isTerritory && !isReadOnly && (
                                <button
                                  onClick={() =>
                                    onTransferTerritory({
                                      territoryName: st.name,
                                      targetNationId: activeNation.id,
                                      mode: "INTEGRATE",
                                      planet: activeNation.planet || "Earth",
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Elevate this territory into full Constituent Statehood"
                                >
                                  ★ Integrate as State
                                </button>
                              )}

                              {!isReadOnly && nations.length > 1 && (
                                <button
                                  onClick={() => {
                                    setTransferringState(st);
                                    setTransferTargetNationId("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                  title="Transfer this territory/state to another country (enters as territory first)"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                                </button>
                              )}
                            </div>

                            {!isReadOnly && (
                              <button
                                onClick={() => {
                                  let defaultCap =
                                    st.capital ||
                                    US_STATES_CATALOG[st.name]?.capital ||
                                    (st.name === "Georgia" ? "Atlanta" : "");
                                  let chosenCapital = defaultCap;
                                  if (!chosenCapital) {
                                    chosenCapital = window.prompt(
                                      `Enter capital city for seceding nation "${st.name}" (creates unique Country-Capital tag):`,
                                      `${st.name} City`
                                    );
                                    if (!chosenCapital) return;
                                  }
                                  onTransferTerritory({
                                    territoryName: st.name,
                                    mode: "RELEASE",
                                    planet: activeNation.planet || "Earth",
                                    capital: chosenCapital,
                                  });
                                }}
                                className="text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer font-semibold transition"
                                title="Release this territory as an independent unitary state (with no sub-provinces)"
                              >
                                Secede as Sovereign State
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: CABINET, TAXES & POLICIES */}
            {rightPanelTab === "cabinet" && (
              <div className="space-y-5">
                {/* 6 Core Visual Gauges */}
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">
                  Standard of Living
                </div>
                <div className="text-lg font-bold font-mono-num text-cyan-300 mt-0.5">
                  {(c.sol || 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Wages: {formatCurrency(c.quarterlyWages)}/Q
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Workforce</div>
                <div className="text-lg font-bold font-mono-num text-white mt-0.5">
                  {formatCompactNumber(c.effectiveWorkingPops)}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono-num">
                  Unemp: {formatPercent(c.unemploymentRate, 1)}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Treasury & Fiscal</div>
                <div
                  className={`text-lg font-bold font-mono-num mt-0.5 ${
                    c.netBudgetBalance >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {formatCurrency(c.netBudgetBalance)}/Q
                </div>
                <div className="text-[10px] text-slate-400 font-mono-num">
                  Reserves: {formatCurrency(c.treasuryBalance)}
                </div>
              </div>
            </div>

            {/* National Statecraft, Legitimacy & Dynamic Elections Quick Card */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  {activeNation.governmentSystem || "Sovereign Republic"} •{" "}
                  {activeNation.laws?.governance || "Universal Suffrage"}
                </span>
                <span className="font-mono-num text-emerald-400 font-bold">
                  Legitimacy: {activeNation.radicals?.legitimacy || 75}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/70 rounded-lg p-2 border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Prosperity (SoL)</span>
                  <strong className="text-cyan-300 font-mono-num">
                    {activeNation.strata?.averageSol || 16.5} (
                    {activeNation.strata?.solTier || "Middling"})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Loyal / Radical</span>
                  <strong className="text-emerald-400 font-mono-num">
                    {activeNation.radicals?.loyalistShare || 18}%
                  </strong>{" "}
                  /{" "}
                  <strong className="text-rose-400 font-mono-num">
                    {activeNation.radicals?.share || 7}%
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Next Election</span>
                  <strong className="text-amber-300 font-mono-num">
                    {activeNation.electionState?.daysUntilElection ?? 180}d (
                    {activeNation.electionState?.nextElectionDate || "Soon"})
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && onVictoriaAction && (
                  <button
                    onClick={() =>
                      onVictoriaAction({
                        type: "ELECTION_ACTION",
                        nationId: activeNation.id,
                        actionType: "CALL_SNAP_ELECTION",
                      })
                    }
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] cursor-pointer"
                  >
                    Hold Snap Election Now
                  </button>
                )}
                {onJumpToTab && (
                  <button
                    onClick={() => onJumpToTab("statecraft")}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold text-[11px] cursor-pointer"
                  >
                    Laws, IGs & Gazette →
                  </button>
                )}
              </div>
            </div>

            {/* 4-Sector Economic Structure Ring/Bar */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Economic Sector Composition
                </span>
                <span className="font-mono-num text-cyan-300 text-[11px]">
                  Corp Growth: {formatPercent(c.averageCompanyGrowth, 2, true)}
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
                {[
                  { val: c.agriculturalGdp, color: "bg-emerald-500" },
                  { val: c.industryGdp, color: "bg-amber-500" },
                  { val: c.hospitalityGdp, color: "bg-purple-500" },
                  { val: c.officeGdp, color: "bg-cyan-500" },
                ].map((s, idx) => {
                  const pct =
                    c.aggregateGdp > 0 ? (s.val / c.aggregateGdp) * 100 : 25;
                  return (
                    <div
                      key={idx}
                      className={s.color}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                  <span className="text-slate-400">Agri:</span>{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(c.agriculturalGdp, 1)}
                  </span>
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
                  <span className="text-slate-400">Ind:</span>{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(c.industryGdp, 1)}
                  </span>
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />
                  <span className="text-slate-400">Hosp:</span>{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(c.hospitalityGdp, 1)}
                  </span>
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" />
                  <span className="text-slate-400">Corp:</span>{" "}
                  <span className="font-mono-num text-slate-200">
                    {formatCurrency(c.officeGdp, 1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Statecraft & Cabinet Levers */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Cabinet Policy & Fiscal Levers
                </div>
                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNation(activeNation.id, {
                          incomeTaxOverride: null,
                          salesTaxOverride: null,
                          corporateTaxOverride: null,
                          workerShareOverride: null,
                          budgetPercentOverride: null,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Reset custom tax overrides to Ruling Coalition defaults"
                    >
                      <RotateCcw className="w-3 h-3" /> Party Defaults
                    </button>
                    {nations.length > 1 && onDeleteNation && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Dissolve ${activeNation.name} from the world map?`
                            )
                          ) {
                            onDeleteNation(activeNation.id);
                          }
                        }}
                        className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/70 text-rose-400 border border-rose-800/50 cursor-pointer"
                        title="Dissolve Nation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Ruling Coalition
                  </label>
                  <select
                    value={activeNation.rulingParty}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        rulingParty: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
                  >
                    {parties.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.politicalAlignment})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Industrial Focus (1.25x Growth)
                  </label>
                  <select
                    value={
                      activeNation.specializedIndustry || "No Specialization"
                    }
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        specializedIndustry: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer"
                  >
                    <option value="No Specialization">Balanced Economy</option>
                    <option value="Agricultural Sector GDP">
                      Agri-Tech Powerhouse
                    </option>
                    <option value="Industry & Manufacturing GDP">
                      Heavy Manufacturing Hub
                    </option>
                    <option value="Hospitality & Tourist Services GDP">
                      Tourism & Services Hub
                    </option>
                    <option value="Office & Corporate Services GDP">
                      Financial & Corporate Center
                    </option>
                  </select>
                </div>
              </div>

              {/* Buffered 60fps Tax & Wage Sliders */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Income Tax</span>
                    <span className="font-mono-num text-cyan-300 font-bold">
                      {formatPercent(c.incomeTax, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0}
                    max={0.7}
                    step={0.01}
                    value={c.incomeTax}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        incomeTaxOverride: val,
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Corporate Tax</span>
                    <span className="font-mono-num text-cyan-300 font-bold">
                      {formatPercent(c.corporateTax, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0}
                    max={0.7}
                    step={0.01}
                    value={c.corporateTax}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        corporateTaxOverride: val,
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Labor Share of GDP</span>
                    <span className="font-mono-num text-emerald-300 font-bold">
                      {formatPercent(c.workerShareOfGdp, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0.1}
                    max={0.85}
                    step={0.01}
                    value={c.workerShareOfGdp}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        workerShareOverride: val,
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">State Spending</span>
                    <span className="font-mono-num text-amber-300 font-bold">
                      {formatPercent(c.stateBudgetPercent, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0.05}
                    max={0.6}
                    step={0.01}
                    value={c.stateBudgetPercent}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        budgetPercentOverride: val,
                      })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Infrastructure, Literacy & Urbanisation Buffered Sliders */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Infrastructure</span>
                    <span className="font-mono-num text-amber-300">
                      {formatPercent(c.infrastructureEfficiency, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={c.infrastructureEfficiency}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        infrastructureEfficiency: val,
                      })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Literacy</span>
                    <span className="font-mono-num text-emerald-300">
                      {formatPercent(c.literacyRate, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0.1}
                    max={0.99}
                    step={0.01}
                    value={c.literacyRate}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        literacyRate: val,
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Urbanisation</span>
                    <span className="font-mono-num text-cyan-300">
                      {formatPercent(c.urbanisationIndex, 0)}
                    </span>
                  </div>
                  <BufferedRangeSlider
                    min={0.1}
                    max={0.99}
                    step={0.01}
                    value={c.urbanisationIndex}
                    onChangeCommitted={(val) =>
                      onUpdateNation(activeNation.id, {
                        urbanisationIndex: val,
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Integrated Quarterly Fiscal Breakdown (Replaces separate Cabinet tab) */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Tax Revenues</span>
                  <span className="font-mono-num font-semibold text-emerald-300">
                    {formatCurrency(
                      (c.incomeTaxRevenue || 0) +
                        (c.corporateTaxRevenue || 0) +
                        (c.salesTaxRevenue || 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tariffs & Divs</span>
                  <span className="font-mono-num font-semibold text-cyan-300">
                    {formatCurrency(
                      (c.importTariffRevenues || 0) +
                        (c.exportTariffRevenues || 0) +
                        (c.govtDividends || 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">State Expenses</span>
                  <span className="font-mono-num font-semibold text-amber-300">
                    {formatCurrency(
                      (c.stateExpenditure || 0) + (c.subsidiesCost || 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Trade Balance</span>
                  <span
                    className={`font-mono-num font-semibold ${
                      (c.netTradeBalance || 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(c.netTradeBalance || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Flagship Corporations Preview & Deep-Dive Navigation */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Flagship National Champions ({activeNation.companies?.length || 0})
                </span>
                <button
                  onClick={() => onJumpToTab("markets")}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  Open Economy & Corporations <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(activeNation.companies || [])
                  .slice()
                  .sort((a, b) => (b.valuation || 0) - (a.valuation || 0))
                  .slice(0, 4)
                  .map((comp) => (
                    <div
                      key={comp.id}
                      className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 text-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white truncate">
                          {comp.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {comp.flagshipGood} •{" "}
                          {formatCompactNumber(comp.employedPops)} workers
                        </div>
                      </div>
                      <div className="text-right font-mono-num shrink-0">
                        <div className="text-cyan-300 font-bold">
                          {formatCurrency(comp.valuation, 1)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            comp.projectedRealGrowth >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {formatPercent(comp.projectedRealGrowth, 1, true)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )}
      </div>
    )}

      {/* CONSTITUENT STATE TRANSFER MODAL */}
      {transferringState && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transfer Constituent State</h3>
                  <p className="text-xs text-slate-400">
                    Cede <span className="text-amber-300 font-semibold">{transferringState.name}</span> to another nation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTransferringState(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Sovereign:</span>
                  <span className="font-semibold text-white">{activeNation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Constituent State / Province:</span>
                  <span className="font-semibold text-amber-300">{transferringState.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regional Working Pops:</span>
                  <span className="font-mono-num text-slate-300">{formatCompactNumber(transferringState.pops || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regional GDP:</span>
                  <span className="font-mono-num text-emerald-400">{formatCurrency(transferringState.gdp || 0)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select Recipient Sovereign Country:
                </label>
                <select
                  value={transferTargetNationId}
                  onChange={(e) => setTransferTargetNationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- Choose Target Nation --</option>
                  {nations
                    .filter((n) => n.id !== activeNation?.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.planet || "Earth"})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setTransferringState(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!transferTargetNationId}
                onClick={() => {
                  if (!transferTargetNationId) return;
                  onTransferTerritory({
                    territoryName: transferringState.name,
                    targetNationId: transferTargetNationId,
                    mode: "ANNEX",
                    planet: activeNation?.planet || "Earth",
                  });
                  setTransferringState(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Execute State Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTRY & CONSTITUENT STATES TABLE POP UP MODAL */}
      {showStatesTableModal && activeNation && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg"
                  style={{
                    backgroundColor: nationColorMap.get(activeNation.id) || "#06b6d4",
                  }}
                >
                  {activeNation.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {activeNation.name}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono-num font-bold">
                        {activeNation.governmentSystem || activeNation.laws?.governance || "Presidential Republic"}
                      </span>
                    </h2>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono-num font-bold">
                      {activeNation.id === "usa" ? "50 Sovereign States (+ 6 Territories)" : `${nationalStatesList.length} Constituent Subdivisions`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2.5 flex-wrap">
                    <span>Capital: <strong className="text-slate-200">{activeNation.capital || "National Capital"}</strong></span>
                    <span>•</span>
                    <span>Ruling Party: <strong className="text-cyan-300">{activeNation.rulingParty || "Civic Alliance"}</strong></span>
                    <span>•</span>
                    <span>GDP: <strong className="text-emerald-400 font-mono-num">{formatCurrency(c.aggregateGdp)}</strong></span>
                    <span>•</span>
                    <span>Pops: <strong className="text-white font-mono-num">{formatCompactNumber(c.effectiveWorkingPops)}</strong></span>
                    <span>•</span>
                    <span>Treasury: <strong className="text-amber-400 font-mono-num">{formatCurrency(activeNation.treasuryBalance || 25e9)}</strong></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setShowProvinceManager(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-cyan-500/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Annex Territory
                  </button>
                )}
                <button
                  onClick={closeStatesModal}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-base"
                  title="Close Pop Up"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Interactive Country & ADM1 Administrative Boundaries Map inside Modal */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-3/5">
                <CountryAdm1Map
                  nation={activeNation}
                  selectedSubdivision={selectedStateName}
                  onSelectSubdivision={(name) => setSelectedStateName(name)}
                  territoryMap={territoryMap}
                  nationColor={nationColorMap.get(activeNation.id) || activeNation.color || "#06b6d4"}
                  economicSubdivisions={nationalStatesList}
                  customEndowments={state?.customStateEndowments}
                />
              </div>

              {/* Selected / Hovered State or Country Quick Dossier Card */}
              <div className="w-full md:w-2/5 glass-panel rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
                {(() => {
                  const isUsa = activeNation.id === "usa" || activeNation.name?.toLowerCase().includes("united states");
                  const activeDossier = (selectedStateName
                    ? nationalStatesList.find((s) => s.name === selectedStateName)
                    : (hoveredModalState || nationalStatesList[0])) || (selectedStateName ? {
                        name: selectedStateName,
                        role: "Constituent Sovereign State",
                        status: "STATE",
                      } : null);

                  if (activeDossier) {
                    const stateMeta = isUsa ? getUsaStateData(activeDossier.name) : null;
                    const stateGdp = activeDossier.gdp || (stateMeta ? (c.aggregateGdp || 0) * stateMeta.gdpShare : 0);
                    const statePops = activeDossier.pops || (stateMeta ? Math.round((c.effectiveWorkingPops || 0) * stateMeta.popShare) : 0);
                    const gdpSharePercent = stateMeta ? (stateMeta.gdpShare * 100).toFixed(1) : (c.aggregateGdp > 0 ? ((stateGdp / c.aggregateGdp) * 100).toFixed(1) : "0.0");
                    const popSharePercent = stateMeta ? (stateMeta.popShare * 100).toFixed(1) : (c.effectiveWorkingPops > 0 ? ((statePops / c.effectiveWorkingPops) * 100).toFixed(1) : "0.0");
                    const capital = activeDossier.capital || stateMeta?.capital || (activeDossier.name === "Georgia" ? "Atlanta" : "");

                    return (
                      <div className="space-y-2 animate-in fade-in duration-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                            {activeDossier.name}
                            {(activeDossier.code || stateMeta?.code) && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-num text-[10px] font-bold">
                                {activeDossier.code || stateMeta?.code}
                              </span>
                            )}
                            {capital && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                • Capital: <strong className="text-slate-200">{capital}</strong>
                              </span>
                            )}
                          </span>
                          {activeDossier.isSeceded && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              ★ Seceded Sovereign
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {activeDossier.region || activeDossier.role || "Constituent Sovereign State"}
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1 font-mono-num text-[11px]">
                          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">State GDP & National Share:</span>
                            <strong className="text-emerald-400 text-sm">
                              {formatCurrency(stateGdp)}
                            </strong>
                            <span className="text-cyan-400 font-bold block text-[10px] mt-0.5">
                              {gdpSharePercent}% of US National GDP
                            </span>
                          </div>
                          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[10px]">Constituent Workforce:</span>
                            <strong className="text-white text-sm">
                              {formatCompactNumber(statePops)}
                            </strong>
                            <span className="text-slate-400 block text-[10px] mt-0.5">
                              {popSharePercent}% of US Workforce
                            </span>
                          </div>
                        </div>

                        {/* Geographic Resource Endowments Breakdown (USGS, EIA, USDA) */}
                        {isUsa && (() => {
                          const endow = getUsStateEndowment(activeDossier.name);
                          if (!endow) return null;
                          return (
                            <div className="mt-2 pt-2 border-t border-slate-800/90 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span className="text-cyan-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-cyan-400" />
                                  Geographic Resource Endowments:
                                </span>
                                {onJumpToTab ? (
                                <button
                                  type="button"
                                  onClick={() => onJumpToTab("sources")}
                                  className="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 font-mono-num text-[10px] cursor-pointer flex items-center gap-1 transition"
                                  title="Inspect full historical and empirical sources"
                                >
                                  USGS / EIA / USDA <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              ) : (
                                <span className="text-slate-500 font-mono-num">USGS / EIA / USDA</span>
                              )}
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-num">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200">
                                  <span className="text-[9px] text-amber-400 block font-bold flex items-center gap-1">
                                    <Fuel className="w-3 h-3" /> 🛢️ Oil & Gas:
                                  </span>
                                  <strong>{endow.hydrocarbonIndex}%</strong> ({endow.hydrocarbonIndex > 60 ? "Abundant Reserves" : endow.hydrocarbonIndex > 25 ? "Moderate Play" : endow.hydrocarbonIndex > 0 ? "Marginal" : "None / 0%"})
                                </div>
                                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-200">
                                  <span className="text-[9px] text-purple-400 block font-bold flex items-center gap-1">
                                    <Pickaxe className="w-3 h-3" /> ⛏️ Minerals:
                                  </span>
                                  <strong>{endow.mineralIndex}%</strong> ({endow.mineralIndex > 60 ? "Rich Deposits" : endow.mineralIndex > 30 ? "Standard" : endow.mineralIndex > 0 ? "Minor Aggregates" : "None / 0%"})
                                </div>
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
                                  <span className="text-[9px] text-emerald-400 block font-bold flex items-center gap-1">
                                    <Wheat className="w-3 h-3" /> 🌾 Arable Land:
                                  </span>
                                  <strong>{endow.arableLandIndex}%</strong> ({endow.arableLandIndex > 70 ? "Prime Breadbasket" : endow.arableLandIndex > 35 ? "Arable Soil / Grazing" : endow.arableLandIndex > 0 ? "Marginal" : "Non-Arable / 0%"})
                                </div>
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-200">
                                  <span className="text-[9px] text-cyan-400 block font-bold flex items-center gap-1">
                                    <Anchor className="w-3 h-3" /> ⚓ Logistics & Ports:
                                  </span>
                                  <strong>{endow.logisticsWaterwayIndex}%</strong> ({endow.logisticsWaterwayIndex > 80 ? "Super-Hub Gateway" : endow.logisticsWaterwayIndex > 40 ? "Regional Artery" : endow.logisticsWaterwayIndex > 0 ? "Minor Inland River" : "Landlocked / 0%"})
                                </div>
                              </div>

                              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
                                <p className="text-slate-300">
                                  <strong className="text-amber-300">Hydrocarbons:</strong> {endow.resources?.hydrocarbons || "Regional distribution"}
                                </p>
                                <p className="text-slate-300">
                                  <strong className="text-purple-300">Critical Minerals:</strong> {endow.resources?.criticalMinerals || "Aggregates & stone"}
                                </p>
                                <p className="text-slate-300">
                                  <strong className="text-emerald-300">Agriculture:</strong> {endow.resources?.agriculture || "Diversified farming"}
                                </p>
                                <div className="pt-1 mt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                                  <span>Modeled Industrial: <strong className="text-cyan-300">{endow.modeledIndustrialOutput}</strong></span>
                                  <span>Agri: <strong className="text-emerald-300">{endow.modeledAgriculturalOutput}</strong></span>
                                </div>
                              </div>

                              {/* Services & Knowledge Economy Breakdown (BEA, BLS, NSF, FDIC) */}
                              {(() => {
                                const srvEndow = getUsStateServicesEndowment(activeDossier.name);
                                if (!srvEndow) return null;
                                return (
                                  <div className="mt-2 pt-2 border-t border-slate-800/90 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                      <span className="text-indigo-400 flex items-center gap-1">
                                        <Briefcase className="w-3 h-3 text-indigo-400" />
                                        Services & Knowledge Endowments:
                                      </span>
                                      <span className="text-slate-500 font-mono-num">BEA / BLS / NSF / FDIC</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-num">
                                      <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-200">
                                        <span className="text-[9px] text-indigo-400 block font-bold flex items-center gap-1">
                                          <GraduationCap className="w-3 h-3" /> 🧠 STEM Talent:
                                        </span>
                                        <strong>{srvEndow.humanCapitalIndex}%</strong> ({srvEndow.humanCapitalIndex > 80 ? "Elite R&D" : srvEndow.humanCapitalIndex > 65 ? "Tier-1 STEM" : "Standard"})
                                      </div>
                                      <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-200">
                                        <span className="text-[9px] text-blue-400 block font-bold flex items-center gap-1">
                                          <Laptop className="w-3 h-3" /> 🏙️ Urban Agglom:
                                        </span>
                                        <strong>{srvEndow.urbanAgglomerationIndex}%</strong> ({srvEndow.urbanAgglomerationIndex > 80 ? "Super-Linear" : srvEndow.urbanAgglomerationIndex > 60 ? "Dense Metro" : "Regional"})
                                      </div>
                                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200">
                                        <span className="text-[9px] text-emerald-400 block font-bold flex items-center gap-1">
                                          <Building2 className="w-3 h-3" /> 🏦 Finance Depth:
                                        </span>
                                        <strong>{srvEndow.financialDepthIndex}%</strong> ({srvEndow.financialDepthIndex > 80 ? "Global Bourse" : srvEndow.financialDepthIndex > 60 ? "Deep Banking" : "Commercial"})
                                      </div>
                                      <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-200">
                                        <span className="text-[9px] text-rose-400 block font-bold flex items-center gap-1">
                                          <UtensilsCrossed className="w-3 h-3" /> 🍸 Hospitality:
                                        </span>
                                        <strong>{srvEndow.consumerAmenityIndex}%</strong> ({srvEndow.consumerAmenityIndex > 80 ? "Premier Hub" : srvEndow.consumerAmenityIndex > 65 ? "High Amenity" : "Local Retail"})
                                      </div>
                                    </div>

                                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
                                      <p className="text-slate-300">
                                        <strong className="text-blue-300">Tech & Corporate:</strong> {srvEndow.servicesProfile?.techAndDefense || "Regional enterprise IT and business services"}
                                      </p>
                                      <p className="text-slate-300">
                                        <strong className="text-emerald-300">Finance & Banking:</strong> {srvEndow.servicesProfile?.banking || "Commercial banking & local finance"}
                                      </p>
                                      <div className="pt-1 mt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
                                        <span>Digital Infra: <strong className="text-indigo-300">{srvEndow.digitalConnectivityIndex}%</strong></span>
                                        <span>Services Output: <strong className="text-cyan-300">{srvEndow.modeledServicesOutput}</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Groq AI Economic Advisory Trigger */}
                              <button
                                onClick={() => requestAiAdvisory(activeDossier.name, activeDossier, endow)}
                                disabled={aiLoading}
                                className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-purple-600/50 border border-cyan-500/40 text-cyan-200 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                                {aiLoading && aiTarget === activeDossier.name ? "Generating Strategy with Groq AI..." : `Ask Groq AI: Strategy for ${activeDossier.name}`}
                              </button>
                              {aiAdvisory && aiTarget === activeDossier.name && (
                                <div className="mt-2 p-2.5 rounded-xl bg-slate-950/95 border border-purple-500/40 text-[10px] text-slate-200 space-y-1.5 max-h-56 overflow-y-auto font-sans leading-relaxed">
                                  <div className="flex items-center justify-between font-bold text-purple-300 text-[10.5px] pb-1 border-b border-purple-500/20">
                                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-400" /> Groq AI Economic Intelligence</span>
                                    <button onClick={() => setAiAdvisory(null)} className="text-slate-500 hover:text-white text-xs cursor-pointer">✕</button>
                                  </div>
                                  <div className="whitespace-pre-line text-slate-300 pt-0.5">{aiAdvisory}</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 text-center text-slate-400 space-y-1">
                      <Compass className="w-5 h-5 mx-auto text-cyan-400/80" />
                      <p className="font-medium text-slate-300 text-xs">Interactive Cartography Overview</p>
                      <p className="text-[11px] text-slate-500">
                        Click on any real administrative polygon or table row to inspect its natural resources and state economic contribution.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Filters & Search Toolbar */}
            <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Status & Natural Resource Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto">
                  <button
                    onClick={() => setStatesModalFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "all"
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Subdivisions ({nationalStatesList.length})
                  </button>
                  <button
                    onClick={() => setStatesModalFilter("state")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "state"
                        ? "bg-slate-800 text-cyan-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Core States (50)
                  </button>
                  <button
                    onClick={() => setStatesModalFilter("territory")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      statesModalFilter === "territory"
                        ? "bg-slate-800 text-amber-300 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Territories
                  </button>

                  {activeNation.id === "usa" && (
                    <>
                      <button
                        onClick={() => setStatesModalFilter("energy")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "energy"
                            ? "bg-amber-500/25 border border-amber-500/50 text-amber-300 font-bold"
                            : "text-amber-400 hover:text-amber-200"
                        }`}
                      >
                        <Fuel className="w-3 h-3" /> 🛢️ Energy
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("minerals")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "minerals"
                            ? "bg-purple-500/25 border border-purple-500/50 text-purple-300 font-bold"
                            : "text-purple-400 hover:text-purple-200"
                        }`}
                      >
                        <Pickaxe className="w-3 h-3" /> ⛏️ Minerals
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("agri")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "agri"
                            ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold"
                            : "text-emerald-400 hover:text-emerald-200"
                        }`}
                      >
                        <Wheat className="w-3 h-3" /> 🌾 Agriculture
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("tech")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "tech"
                            ? "bg-blue-500/25 border border-blue-500/50 text-blue-300 font-bold"
                            : "text-blue-400 hover:text-blue-200"
                        }`}
                      >
                        <Laptop className="w-3 h-3" /> 💻 High-Tech & R&D
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("finance")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "finance"
                            ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold"
                            : "text-emerald-400 hover:text-emerald-200"
                        }`}
                      >
                        <Building2 className="w-3 h-3" /> 🏦 Finance
                      </button>
                      <button
                        onClick={() => setStatesModalFilter("hospitality")}
                        className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                          statesModalFilter === "hospitality"
                            ? "bg-rose-500/25 border border-rose-500/50 text-rose-300 font-bold"
                            : "text-rose-400 hover:text-rose-200"
                        }`}
                      >
                        <UtensilsCrossed className="w-3 h-3" /> 🍸 Hospitality
                      </button>
                    </>
                  )}
                </div>

                {/* Search Box */}
                <div className="relative min-w-[200px] max-w-xs flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      activeNation.id === "usa"
                        ? "Search 56 states, capitals, minerals, basins..."
                        : "Search states or subdivisions..."
                    }
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Sort By:</span>
                <select
                  value={statesModalSort}
                  onChange={(e) => setStatesModalSort(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="gdp">State GDP (% of National Economy)</option>
                  <option value="pops">Working Population</option>
                  <option value="name">State Name (A → Z)</option>
                  {activeNation.id === "usa" && (
                    <>
                      <option value="energy">🛢️ Oil & Gas Endowments</option>
                      <option value="minerals">⛏️ Critical Minerals Endowments</option>
                      <option value="agri">🌾 Agricultural Endowments</option>
                      <option value="tech">💻 High-Tech & STEM Strength</option>
                      <option value="finance">🏦 Financial Depth</option>
                      <option value="amenity">🍸 Tourism & Amenities</option>
                    </>
                  )}
                  <option value="infra">Infrastructure Efficiency</option>
                </select>
              </div>
            </div>

            {/* Modal Table Container */}
            <div className="flex-1 overflow-y-auto">
              {modalFilteredStates.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-sm font-bold">
                    ∅
                  </div>
                  <h4 className="text-sm font-bold text-white">No States or Territories Found</h4>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search query or filter settings.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950/90 text-[10px] uppercase tracking-wider text-slate-400 font-mono-num border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">State & Capital</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-3">Primary Natural Resources & Role</th>
                      <th className="py-3 px-3 text-right">State GDP & Share</th>
                      <th className="py-3 px-3 text-right">Workforce</th>
                      <th className="py-3 px-3 text-right">Modeled Production</th>
                      <th className="py-3 px-4 text-center">Statecraft Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono-num">
                    {modalFilteredStates.map((st, idx) => {
                      const isTerritory = st.status === "TERRITORY";
                      const isSelectedState = selectedStateName === st.name;
                      const gdpPercent =
                        c.aggregateGdp > 0 ? (st.gdp / c.aggregateGdp) * 100 : 0;
                      const popPercent =
                        c.effectiveWorkingPops > 0
                          ? (st.pops / c.effectiveWorkingPops) * 100
                          : 0;

                      return (
                        <tr
                          key={st.name || idx}
                          onClick={() => setSelectedStateName(st.name)}
                          className={`transition cursor-pointer ${
                            isSelectedState
                              ? "bg-cyan-950/60 ring-2 ring-cyan-500 shadow-md"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-500 font-bold text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isTerritory ? "bg-amber-400" : "bg-cyan-400"
                                }`}
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">
                                    {st.name}
                                  </span>
                                  {st.code && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                                      {st.code}
                                    </span>
                                  )}
                                </div>
                                {st.capital && (
                                  <span className="text-[10px] text-slate-400 block font-normal">
                                    Cap: <strong className="text-slate-300">{st.capital}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {isTerritory ? (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                                TERRITORY
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                                CORE STATE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {activeNation.id === "usa" ? (() => {
                              const endow = getUsStateEndowment(st.name);
                              const srv = getUsStateServicesEndowment(st.name);
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {endow.hydrocarbonIndex >= 30 && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <Fuel className="w-2.5 h-2.5" /> {endow.hydrocarbonIndex}%
                                      </span>
                                    )}
                                    {endow.mineralIndex >= 30 && (
                                      <span className="px-1.5 py-0.2 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <Pickaxe className="w-2.5 h-2.5" /> {endow.mineralIndex}%
                                      </span>
                                    )}
                                    {endow.arableLandIndex >= 40 && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <Wheat className="w-2.5 h-2.5" /> {endow.arableLandIndex}%
                                      </span>
                                    )}
                                    {srv?.digitalConnectivityIndex >= 70 && (
                                      <span className="px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <Laptop className="w-2.5 h-2.5" /> {srv.digitalConnectivityIndex}%
                                      </span>
                                    )}
                                    {srv?.financialDepthIndex >= 65 && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <Building2 className="w-2.5 h-2.5" /> {srv.financialDepthIndex}%
                                      </span>
                                    )}
                                    {srv?.consumerAmenityIndex >= 75 && (
                                      <span className="px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold flex items-center gap-0.5">
                                        <UtensilsCrossed className="w-2.5 h-2.5" /> {srv.consumerAmenityIndex}%
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] text-slate-300 font-sans truncate" title={st.role}>
                                    {st.role}
                                  </p>
                                </div>
                              );
                            })() : (
                              <span className="text-[11px] text-slate-300 font-sans truncate block">{st.role}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-emerald-400 font-bold">
                              {formatCurrency(st.gdp)}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold block">
                              {gdpPercent.toFixed(1)}% of US GDP
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-white font-bold">
                              {formatCompactNumber(st.pops)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              ({popPercent.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-[11px]">
                            {activeNation.id === "usa" ? (() => {
                              const endow = getUsStateEndowment(st.name);
                              const srv = getUsStateServicesEndowment(st.name);
                              return (
                                <div className="text-right font-mono-num">
                                  <span className="text-slate-300 block text-[10px]">
                                    Srv: <strong className="text-indigo-300">{srv?.modeledServicesOutput?.split(' ')[0] || '-'}</strong>
                                  </span>
                                  <span className="text-slate-400 block text-[10px]">
                                    Ind: <strong className="text-cyan-300">{endow.modeledIndustrialOutput?.split(' ')[0] || '-'}</strong>
                                  </span>
                                </div>
                              );
                            })() : (
                              <span className="text-amber-300 font-bold">{formatPercent(st.infra, 0)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStateName(st.name);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                                  isSelectedState
                                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                                    : "bg-slate-800 hover:bg-slate-700 text-cyan-300"
                                }`}
                                title="Display complete state details and natural resources on the side panel"
                              >
                                <Sparkles className="w-3 h-3" /> Inspect Details
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  focusOnTerritory(st.name);
                                  setShowStatesTableModal(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                title="Focus camera directly on this state on the world map"
                              >
                                <MapPin className="w-3 h-3" /> Focus on Map
                              </button>

                              {isTerritory && !isReadOnly && (
                                <button
                                  onClick={() =>
                                    onTransferTerritory({
                                      territoryName: st.name,
                                      targetNationId: activeNation.id,
                                      mode: "INTEGRATE",
                                      planet: activeNation.planet || "Earth",
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                                  title="Elevate this territory into full Constituent Statehood"
                                >
                                  ★ Integrate as State
                                </button>
                              )}

                              {!isReadOnly && nations.length > 1 && (
                                <button
                                  onClick={() => {
                                    setTransferringState(st);
                                    setTransferTargetNationId("");
                                    setShowStatesTableModal(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                                  title="Transfer this state/territory to another country (enters as territory first)"
                                >
                                  <ArrowRightLeft className="w-3 h-3" /> Transfer
                                </button>
                              )}

                              {!isReadOnly && (
                                <button
                                  onClick={() => {
                                    let defaultCap =
                                      st.capital ||
                                      US_STATES_CATALOG[st.name]?.capital ||
                                      (st.name === "Georgia" ? "Atlanta" : "");
                                    let chosenCapital = defaultCap;
                                    if (!chosenCapital) {
                                      chosenCapital = window.prompt(
                                        `Enter capital city for seceding nation "${st.name}" (creates unique Country-Capital tag):`,
                                        `${st.name} City`
                                      );
                                      if (!chosenCapital) return;
                                    }
                                    if (
                                      window.confirm(
                                        `Release "${st.name}" (Capital: ${chosenCapital}) as an independent sovereign nation? It will become a unitary state with its own borders and sovereignty.`
                                      )
                                    ) {
                                      onTransferTerritory({
                                        territoryName: st.name,
                                        mode: "RELEASE",
                                        planet: activeNation.planet || "Earth",
                                        capital: chosenCapital,
                                      });
                                      setShowStatesTableModal(false);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold cursor-pointer transition"
                                  title="Release this territory as an independent unitary state (with no sub-provinces)"
                                >
                                  Secede
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 font-mono-num text-[11px]">
                Showing <strong className="text-white">{modalFilteredStates.length}</strong> of{" "}
                <strong className="text-white">{nationalStatesList.length}</strong> subdivisions in{" "}
                <strong className="text-cyan-300">{activeNation.name}</strong>
              </div>
              <button
                onClick={closeStatesModal}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow-md"
              >
                Close & View Interactive Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTRY PROVINCE MANAGER MODAL */}
      {showProvinceManager && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Country Province Manager — {activeNation?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Add, transfer, or release territories and provinces from around Earth & Mars into {activeNation?.name}'s sovereign control.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProvinceManager(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            {/* Target Country Selector & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Controlling Country:
                </label>
                <select
                  value={activeNation?.id || ""}
                  onChange={(e) => onSelectNation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-bold"
                >
                  {nations.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.planet} • {n.territoryCount || 1} territories)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Search Global Provinces & Territories:
                </label>
                <input
                  type="text"
                  placeholder="Filter 177 Earth nations & Mars sectors (e.g. Canada, Germany, Olympus)..."
                  value={provinceSearchQuery}
                  onChange={(e) => setProvinceSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Territory Lists: Current Controlled Territories vs Global Available */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Current Territories */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase text-amber-400 text-[11px] tracking-wider">
                    Currently Annexed / Controlled by {activeNation?.name} ({
                      Object.entries(territoryMap).filter(([, cid]) => cid === activeNation?.id).length
                    })
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click 'Release' to restore independent sovereignty
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(territoryMap)
                    .filter(([, cid]) => cid === activeNation?.id)
                    .map(([terrName]) => (
                      <div
                        key={terrName}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 shadow-sm"
                      >
                        <span className="font-semibold">{terrName}</span>
                        {!isReadOnly && (
                          <button
                            onClick={() =>
                              onTransferTerritory({
                                territoryName: terrName,
                                mode: "RELEASE",
                                planet: activeNation?.planet || "Earth",
                              })
                            }
                            className="text-slate-400 hover:text-rose-400 cursor-pointer text-[10px] uppercase font-bold"
                            title="Release as Independent Nation"
                          >
                            Release
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Global Provinces & Territories Catalog */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <span className="font-bold uppercase text-slate-300 text-[11px] tracking-wider block mb-3">
                  All Global Territories & Outer Space Sectors (Click 'Annex' to add to {activeNation?.name}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {allGlobalProvinces.filter((p) => {
                    const currentControllerId =
                      p.name === "Georgia"
                        ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || territoryMap["Georgia"]
                        : territoryMap[p.name];
                    const currentController = nationById.get(currentControllerId);
                    if (currentController?.isSeceded) return false;

                    const q = provinceSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.type && p.type.toLowerCase().includes(q)) ||
                      (p.capital && p.capital.toLowerCase().includes(q))
                    );
                  }).map((p) => {
                    const currentControllerId =
                      p.name === "Georgia"
                        ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || territoryMap["Georgia"]
                        : territoryMap[p.name];
                    const currentController = nationById.get(currentControllerId);
                    const isControlledByActive = currentControllerId === activeNation?.id;

                    return (
                      <div
                        key={p.name}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                          isControlledByActive
                            ? "bg-cyan-950/30 border-cyan-500/50"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            {p.name}
                            {p.code && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono-num font-bold">
                                {p.code}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-500">{p.planet} • {p.type || "Territory"}</span>
                            {p.capital && <span className="text-slate-400 font-mono-num">• {p.capital}</span>}
                            <span>•</span>
                            <span className={currentController ? "text-cyan-300 font-medium" : "text-slate-500"}>
                              {currentController ? currentController.name : "Non-Aligned"}
                            </span>
                          </div>
                        </div>

                        {!isReadOnly && !isControlledByActive && (
                          <button
                            onClick={() =>
                              onTransferTerritory({
                                territoryName: p.name,
                                targetNationId: activeNation.id,
                                mode: "ANNEX",
                                planet: p.planet || "Earth",
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer shrink-0 transition"
                          >
                            + Annex
                          </button>
                        )}
                        {!isReadOnly && isControlledByActive && (
                          <button
                            onClick={() =>
                              onTransferTerritory({
                                territoryName: p.name,
                                mode: "RELEASE",
                                planet: p.planet || "Earth",
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold cursor-pointer shrink-0 transition"
                            title="Release as sovereign independent nation"
                          >
                            Release
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setShowProvinceManager(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Close Province Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GROQ AI CRISIS & MACROECONOMIC SHOCK SIMULATOR MODAL
         ======================================================== */}
      {showShockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/80 via-slate-950/90 to-amber-950/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-rose-950/80">
                  <Zap className="w-6 h-6 text-amber-200 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                      Groq AI Crisis & Economic Shock Simulator
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-400/50 font-mono-num font-bold uppercase tracking-wider">
                      Ultra-Fast LLM Inference
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Describe any real or hypothetical disaster, port strike, or embargo. Groq AI mutates state endowments, bottlenecks freight, and dampens goods GDP.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowShockModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close Crisis Terminal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-200">
              {/* Quick Crisis Scenario Presets */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Quick Scenario Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SHOCK_PRESETS.map((p) => {
                    const isSelected = shockPrompt === p.prompt;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShockPrompt(p.prompt);
                          setShockError(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? "bg-rose-950/70 border-rose-500 shadow-md ring-1 ring-rose-500/50"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-xs">{p.title}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-3">
                            {p.desc}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-cyan-400 font-semibold">
                          <span>Load scenario</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Natural Language Prompt & Target Selector */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Custom Disaster or Shock Prompt:
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Epicenter State (optional):</span>
                    <select
                      value={selectedStateName || ""}
                      onChange={(e) => setSelectedStateName(e.target.value || null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">National / Multi-State</option>
                      {nationalStatesList.map((st) => (
                        <option key={st.name} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={shockPrompt}
                  onChange={(e) => setShockPrompt(e.target.value)}
                  placeholder="e.g., A major earthquake strikes Southern California, fracturing highway overpasses, closing the Port of Long Beach, and halting semiconductor distribution..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans leading-relaxed"
                />

                {shockError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{shockError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Groq will extract damaged ports, severed waterways, hydrocarbon refinery loss, and calculate Leontief goods GDP contraction.
                  </span>
                  <button
                    onClick={() => handleExecuteShock()}
                    disabled={shockLoading || !shockPrompt.trim()}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl transition active:scale-95 cursor-pointer ${
                      shockLoading || !shockPrompt.trim()
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white border border-rose-400/50 shadow-rose-950/50"
                    }`}
                  >
                    {shockLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Simulating Economic Shockwave...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-200 fill-amber-300" />
                        <span>Simulate & Execute Shock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Simulation Result / SitRep / Quantitative Damage Diff */}
              {(shockResultData || state?.activeEconomicShock) && (
                (() => {
                  const shock = shockResultData || state.activeEconomicShock;
                  const diff = shockDiffData;
                  return (
                    <div className="bg-slate-950/80 border border-rose-500/60 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200 shadow-2xl">
                      {/* SitRep Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-600/60">
                              {shock.severity || "HIGH"} CRISIS
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {shock.category}
                            </span>
                            <h3 className="text-base font-extrabold text-white tracking-wide">
                              {shock.headline}
                            </h3>
                          </div>
                          <p className="text-xs text-rose-200/90 mt-2 leading-relaxed max-w-4xl font-sans">
                            {shock.sitrep}
                          </p>
                        </div>

                        <button
                          onClick={handleRestoreInfrastructure}
                          disabled={shockLoading}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition shrink-0 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Rebuild Infrastructure
                        </button>
                      </div>

                      {/* Quantitative Macroeconomic Aftermath Diff */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                          Macroeconomic Aftermath & Goods Contraction:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono-num">
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                            <span className="text-slate-400 text-[11px]">Total National GDP</span>
                            <div className="mt-1">
                              <div className="text-base font-bold text-white">
                                {diff ? formatCurrency(diff.postGdp) : formatCurrency(activeNation?.computed?.aggregateGdp || 0)}
                              </div>
                              {diff && (
                                <div className={`text-[11px] font-bold ${diff.gdpDelta < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {diff.gdpDelta < 0 ? "▼" : "▲"} {formatCurrency(Math.abs(diff.gdpDelta))} ({diff.gdpPctChange.toFixed(1)}%)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 flex flex-col justify-between">
                            <span className="text-rose-300 text-[11px] font-semibold">Goods Output (Mfg + Agri)</span>
                            <div className="mt-1">
                              <div className="text-base font-bold text-rose-200">
                                {diff ? formatCurrency(diff.postGoodsGdp) : formatCurrency((activeNation?.computed?.industryGdp || 0) + (activeNation?.computed?.agriculturalGdp || 0))}
                              </div>
                              {diff && (
                                <div className={`text-[11px] font-bold ${diff.goodsGdpDelta < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                  {diff.goodsGdpDelta < 0 ? "▼" : "▲"} {formatCurrency(Math.abs(diff.goodsGdpDelta))} ({diff.goodsPctChange.toFixed(1)}%)
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 flex flex-col justify-between">
                            <span className="text-amber-300 text-[11px] font-semibold">Freight Transit Delay</span>
                            <div className="mt-1">
                              <div className="text-base font-bold text-amber-200">
                                {shock.macroMutations?.freightDelayFriction || 2.0}x
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Transit bottleneck / port blockage
                              </span>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                            <span className="text-slate-400 text-[11px]">Treasury Emergency Aid</span>
                            <div className="mt-1">
                              <div className="text-base font-bold text-cyan-300">
                                {formatCurrency(shock.macroMutations?.emergencyReliefCost || 50000000000)}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Disbursed from federal reserve
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Affected States & Damaged Endowments */}
                      {Array.isArray(shock.affectedStates) && shock.affectedStates.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                            Disrupted Constituent States & Damaged Infrastructure:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {shock.affectedStates.map((st, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                    {st.stateName}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                                    Disrupted
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[10.5px] font-mono-num text-slate-300 pt-1">
                                  {st.logisticsWaterwayIndexDelta !== 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-200">
                                      ⚓ Ports: <strong>{st.logisticsWaterwayIndexDelta}%</strong>
                                    </span>
                                  )}
                                  {st.hydrocarbonIndexDelta !== 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-200">
                                      🛢️ Oil/Gas: <strong>{st.hydrocarbonIndexDelta}%</strong>
                                    </span>
                                  )}
                                  {st.arableLandIndexDelta !== 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200">
                                      🌾 Crops: <strong>{st.arableLandIndexDelta}%</strong>
                                    </span>
                                  )}
                                  {st.consumerAmenityIndexDelta !== 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-200">
                                      🍸 Hospitality: <strong>{st.consumerAmenityIndexDelta}%</strong>
                                    </span>
                                  )}
                                </div>

                                {st.reason && (
                                  <p className="text-[11px] text-slate-400 leading-snug pt-0.5">
                                    {st.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sovereign Directives */}
                      {shock.recommendedAction && (
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-cyan-300 text-xs block">
                              Sovereign Executive Directive:
                            </span>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {shock.recommendedAction}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Map polygons update in real time with red warning boundaries when shocks are active.
              </span>
              <button
                onClick={() => setShowShockModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
              >
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
