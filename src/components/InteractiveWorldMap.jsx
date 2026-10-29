import React, { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
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
} from "lucide-react";
import BufferedRangeSlider from "./BufferedRangeSlider";
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

// Constituent Regional States for Victoria 3-style state-level deep dive
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
    <div className="absolute top-14 right-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl pointer-events-none text-xs">
      <div className="font-bold text-white flex items-center gap-2">
        <span>{hovered.name}</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
          {hovered.controllerName}
        </span>
      </div>
      {hovered.gdp !== undefined && (
        <div className="text-[11px] text-slate-300 font-mono-num mt-1 flex items-center gap-3">
          <span>GDP: {formatCurrency(hovered.gdp)}</span>
          <span>SOL: {hovered.sol?.toFixed(2)}</span>
          <span>Pops: {formatCompactNumber(hovered.pops)}</span>
        </div>
      )}
      <div className="text-[10px] text-amber-300 mt-1">
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
  isReadOnly = false,
}) {
  const nations = state.nations || [];
  const territoryMap = state.territoryMap || {};

  const [theater, setTheater] = useState("Earth"); // "Earth" | "Mars"
  const [mapLens, setMapLens] = useState("sovereignty"); // "sovereignty" | "gdp" | "sol" | "unrest"
  const [interactionMode, setInteractionMode] = useState("inspect"); // "inspect" | "annex" | "release"
  const [viewTier, setViewTier] = useState("worldwide"); // "worldwide" | "subcontinent" | "country"
  const [rightPanelTab, setRightPanelTab] = useState("states"); // "states" | "cabinet"
  const [selectedSubcontinent, setSelectedSubcontinent] = useState("all");
  const [showProvinceManager, setShowProvinceManager] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");
  const [transferringState, setTransferringState] = useState(null);
  const [transferTargetNationId, setTransferTargetNationId] = useState("");
  const tooltipRef = useRef(null);
  const setHoveredTerritory = (val) => tooltipRef.current?.setHover(val);

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

  // Focus camera on a selected subcontinent
  const handleSelectSubcontinent = (subId) => {
    setSelectedSubcontinent(subId);
    const preset = SUBCONTINENT_PRESETS.find((p) => p.id === subId) || SUBCONTINENT_PRESETS[0];
    setZoom(preset.zoom);
    setPan(preset.pan);
  };

  // Focus camera on a specific nation (Tier 3: Country & States)
  const focusOnCountry = (targetNation) => {
    if (!targetNation) return;
    onSelectNation(targetNation.id);
    setViewTier("country");
    setRightPanelTab("states");

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
        f.name.toLowerCase() === targetNation.name.toLowerCase() ||
        (targetNation.id === "usa" && f.name === "United States of America") ||
        territoryMap[f.name] === targetNation.id
    );
    if (matchedFeatures.length > 0) {
      let sumX = 0, sumY = 0;
      matchedFeatures.forEach((f) => {
        sumX += f.centroid[0];
        sumY += f.centroid[1];
      });
      const cx = sumX / matchedFeatures.length;
      const cy = sumY / matchedFeatures.length;
      setZoom(3.2);
      setPan({ x: Math.round(480 - cx), y: Math.round(250 - cy) });
    } else {
      setZoom(2.2);
      setPan({ x: 0, y: 0 });
    }
  };

  // Focus camera on a specific territory / state
  const focusOnTerritory = (territoryName) => {
    const feat = STATIC_EARTH_FEATURES.find(
      (f) => f.name.toLowerCase() === territoryName.toLowerCase()
    );
    if (feat && feat.centroid) {
      const [cx, cy] = feat.centroid;
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

  const activeNation =
    nationById.get(selectedNationId) ||
    nations.find((n) =>
      theater === "Mars"
        ? (n.planet || "").toLowerCase().includes("mars")
        : !(n.planet || "").toLowerCase().includes("mars")
    ) ||
    nations[0];

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

    // 1. If explicit constituentStates and unincorporatedTerritories are defined on the nation (from historical era / statehood)
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

      {/* 3-Tier Map View Switcher Bar (World-Wide / Subcontinent / Country & States) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-num uppercase tracking-wider text-slate-400 font-bold">
            Map View Tier:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setViewTier("worldwide");
                resetCamera();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewTier === "worldwide"
                  ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              1. World-Wide
            </button>

            <button
              onClick={() => {
                setViewTier("subcontinent");
                if (selectedSubcontinent === "all") handleSelectSubcontinent("we");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewTier === "subcontinent"
                  ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              2. Subcontinent Focus
            </button>

            <button
              onClick={() => {
                setViewTier("country");
                focusOnCountry(activeNation);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewTier === "country"
                  ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              3. Country & States ({activeNation?.name})
            </button>
          </div>
        </div>

        {/* Subcontinent Presets (Visible when Subcontinent Tier is active) */}
        {viewTier === "subcontinent" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Region:</span>
            {SUBCONTINENT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectSubcontinent(p.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  selectedSubcontinent === p.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Country Tier Quick Focus (Visible when Country Tier is active) */}
        {viewTier === "country" && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Focus State:</span>
            <select
              value={activeNation?.id || ""}
              onChange={(e) => {
                const target = nations.find((n) => n.id === e.target.value);
                if (target) focusOnCountry(target);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs cursor-pointer"
            >
              {nations.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.planet} • {n.territoryCount || 1} territories)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Country View Banner when Tier 3 Country & States is Active */}
      {viewTier === "country" && activeNation && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
              style={{
                backgroundColor: nationColorMap.get(activeNation.id) || "#06b6d4",
              }}
            >
              {activeNation.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-num uppercase tracking-wider text-cyan-400 font-bold">
                  Country & State View
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeNation.planet} • {nationalStatesList.length} States
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {activeNation.name} Sovereignty & Constituent States
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewTier("worldwide");
                resetCamera();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              ← Back to World Map
            </button>

            {!isReadOnly && (
              <button
                onClick={() => setShowProvinceManager(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-md shadow-cyan-500/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                + Annex / Add State
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Split View: Interactive Map Canvas (Left 7 Cols) + Nation Command Drawer (Right 5 Cols) */}
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

                    {/* Country Territory Polygons */}
                    {earthFeatures.map((feat) => {
                      const ctrlId = territoryMap[feat.name];
                      const ctrlNation = nationById.get(ctrlId);
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
                            handleTerritoryClick(feat.name, "Earth");
                          }}
                        />
                      );
                    })}

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
                        const ctrlId = territoryMap[f.name];
                        const n = nationById.get(ctrlId);
                        if (!n) return false;
                        // Show primary label on main homeland territory
                        if (
                          n.id === "european_union" &&
                          f.name === "France"
                        )
                          return true;
                        if (
                          n.id === "usa" &&
                          f.name === "United States of America"
                        )
                          return true;
                        return n.name.toLowerCase() === f.name.toLowerCase();
                      })
                      .map((f) => {
                        const ctrlId = territoryMap[f.name];
                        const n = nationById.get(ctrlId);
                        const [cx, cy] = f.centroid;
                        const isSelected = n.id === activeNation?.id;
                        return (
                          <g
                            key={`label_${n.id}`}
                            transform={`translate(${cx}, ${cy})`}
                            className="pointer-events-none"
                          >
                            <circle
                              r={(isSelected ? 4.5 : 3) / Math.sqrt(zoom)}
                              fill={isSelected ? "#22d3ee" : "#ffffff"}
                              stroke="#020617"
                              strokeWidth={1 / Math.sqrt(zoom)}
                            />
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
                          </g>
                        );
                      })}
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono-num uppercase tracking-wider text-cyan-400 font-bold block">
                      Provincial Sovereignty & Local Development
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Constituent States of {activeNation.name}
                    </h3>
                  </div>

                  {!isReadOnly && (
                    <button
                      onClick={() => setShowProvinceManager(true)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Annex Province
                    </button>
                  )}
                </div>

                {/* List of States & Provinces */}
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {nationalStatesList.map((st, idx) => (
                    <div
                      key={st.name || idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            <h4 className="text-sm font-bold text-white">{st.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono-num">
                              State #{idx + 1}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{st.role}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 block">State GDP</span>
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

                          {!isReadOnly && nations.length > 1 && (
                            <button
                              onClick={() => {
                                setTransferringState(st);
                                setTransferTargetNationId("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                              title="Transfer this constituent state to another country"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Transfer State
                            </button>
                          )}
                        </div>

                        {!isReadOnly && nationalStatesList.length > 1 && (
                          <button
                            onClick={() =>
                              onTransferTerritory({
                                territoryName: st.name,
                                mode: "RELEASE",
                                planet: activeNation.planet || "Earth",
                              })
                            }
                            className="text-[11px] text-slate-500 hover:text-rose-400 cursor-pointer font-semibold transition"
                            title="Release this territory as an independent sovereign nation"
                          >
                            Release as Sovereign State
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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

            {/* Victoria 3 Statecraft, Legitimacy & Dynamic Elections Quick Card */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-amber-300">
                  #{activeNation.capacities?.globalRank || 1}{" "}
                  {activeNation.capacities?.rankTitle || "Great Power"} •{" "}
                  {activeNation.laws?.governance || "Universal Suffrage"}
                </span>
                <span className="font-mono-num text-emerald-400 font-bold">
                  Legitimacy: {activeNation.radicals?.legitimacy || 75}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/70 rounded-lg p-2 border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Victoria SoL</span>
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
                    onClick={() => onJumpToTab("victoria")}
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
                  {STATIC_EARTH_FEATURES.filter((f) =>
                    !provinceSearchQuery.trim() ||
                    f.name.toLowerCase().includes(provinceSearchQuery.trim().toLowerCase())
                  ).map((f) => {
                    const currentControllerId = territoryMap[f.name];
                    const currentController = nationById.get(currentControllerId);
                    const isControlledByActive = currentControllerId === activeNation?.id;

                    return (
                      <div
                        key={f.name}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                          isControlledByActive
                            ? "bg-cyan-950/30 border-cyan-500/50"
                            : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{f.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {currentController ? currentController.name : "Non-Aligned"}
                          </div>
                        </div>

                        {!isReadOnly && !isControlledByActive && (
                          <button
                            onClick={() =>
                              onTransferTerritory({
                                territoryName: f.name,
                                targetNationId: activeNation.id,
                                mode: "ANNEX",
                                planet: "Earth",
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            + Annex
                          </button>
                        )}
                        {isControlledByActive && (
                          <span className="text-[10px] font-mono-num text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10">
                            Core
                          </span>
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
    </div>
  );
}
