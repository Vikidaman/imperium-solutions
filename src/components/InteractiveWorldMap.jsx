import React, { useState, useMemo, useRef } from "react";
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
  Layers,
} from "lucide-react";
import {
  formatCurrency,
  formatExactCurrency,
  formatCompactNumber,
  formatPercent,
  getShortSectorName,
} from "../utils/formatters";

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

// Vietnam 1977 Regional Theater Polygons (960 x 500 viewBox)
const VIETNAM_REGION_POLYGONS = [
  {
    name: "NorthWest Vietnam",
    points: "320,30 430,35 435,130 330,120",
    cx: 380,
    cy: 80,
  },
  {
    name: "NorthEast Vietnam",
    points: "430,35 560,25 570,115 495,120 435,100",
    cx: 500,
    cy: 72,
  },
  {
    name: "Red River Delta",
    points: "435,100 495,120 520,165 445,165 435,130",
    cx: 472,
    cy: 138,
  },
  {
    name: "North Central Coast",
    points: "390,145 445,165 520,165 565,255 495,265 405,195",
    cx: 475,
    cy: 210,
  },
  {
    name: "South Central Coast",
    points: "495,265 565,255 615,345 555,395 525,365",
    cx: 562,
    cy: 325,
  },
  {
    name: "Central Highlands",
    points: "455,275 495,265 525,365 475,385 440,335",
    cx: 482,
    cy: 330,
  },
  {
    name: "SouthEast Vietnam",
    points: "440,365 475,385 555,395 515,435 435,415",
    cx: 488,
    cy: 402,
  },
  {
    name: "Mekong Delta",
    points: "365,415 435,415 515,435 445,485 355,465",
    cx: 432,
    cy: 450,
  },
];

export default function InteractiveWorldMap({
  state,
  selectedNationId,
  onSelectNation,
  onUpdateNation,
  onTransferTerritory,
  onCreateNation,
  onJumpToTab,
  onVictoriaAction,
  isReadOnly = false,
}) {
  const nations = state.nations || [];
  const territoryMap = state.territoryMap || {};

  // Determine default theater from scenario
  const hasVietnam = nations.some((n) =>
    (n.planet || "").toLowerCase().includes("vietnam")
  );
  const [theater, setTheater] = useState(hasVietnam ? "Vietnam" : "Earth"); // "Earth" | "Mars" | "Vietnam"
  const [mapLens, setMapLens] = useState("sovereignty"); // "sovereignty" | "gdp" | "sol" | "unrest"
  const [interactionMode, setInteractionMode] = useState("inspect"); // "inspect" | "annex" | "release"
  const [hoveredTerritory, setHoveredTerritory] = useState(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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

  // Build D3 Geo paths & dynamic merged borders for Earth from world-atlas TopoJSON
  const { earthFeatures, sovereignBorderPath, internalBorderPath, projection } =
    useMemo(() => {
      const proj = geoNaturalEarth1()
        .scale(175)
        .translate([480, 265]);
      const pathGen = geoPath(proj);

      const geojson = topojson.feature(
        worldAtlas,
        worldAtlas.objects.countries
      );

      // Compute centroids for capital/label markers
      const features = geojson.features
        .filter((f) => f.properties.name !== "Antarctica")
        .map((f) => {
          const centroid = pathGen.centroid(f);
          return {
            ...f,
            name: f.properties.name,
            d: pathGen(f),
            centroid: Number.isFinite(centroid[0]) ? centroid : [0, 0],
          };
        });

      // Sovereign border mesh: drawn wherever two adjacent countries have DIFFERENT controlling nations
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

      // Internal provincial border mesh: drawn subtly where two adjacent countries share the SAME controlling superpower (e.g. EU or annexed territories)
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
        earthFeatures: features,
        sovereignBorderPath: pathGen(sovMesh),
        internalBorderPath: pathGen(intMesh),
        projection: proj,
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
      onSelectNation(controllingNation.id);
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

  return (
    <div className="space-y-5">
      {/* Top Map Command Bar: Theater Switcher, Map Lenses & Border Redraw Tools */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Left: Planetary Theater Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTheater("Earth");
              resetCamera();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              theater === "Earth"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            Earth Theater
          </button>

          <button
            onClick={() => {
              setTheater("Mars");
              resetCamera();
              const marsNation = nations.find((n) =>
                (n.planet || "").toLowerCase().includes("mars")
              );
              if (marsNation) onSelectNation(marsNation.id);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              theater === "Mars"
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25"
                : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Rocket className="w-4 h-4" />
            Mars Planetary Grid
          </button>

          {hasVietnam && (
            <button
              onClick={() => {
                setTheater("Vietnam");
                resetCamera();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                theater === "Vietnam"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                  : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Vietnam 1977 Theater
            </button>
          )}
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
            onClick={() => setInteractionMode("inspect")}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              interactionMode === "inspect"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
            title="Click any territory to inspect and govern its controlling nation"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Inspect Nation
          </button>

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
        </div>
      </div>

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

          {/* Floating Hovered Territory Tooltip (Top-Right inside Map) */}
          {hoveredTerritory && (
            <div className="absolute top-14 right-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl pointer-events-none text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <span>{hoveredTerritory.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                  {hoveredTerritory.controllerName}
                </span>
              </div>
              {hoveredTerritory.gdp !== undefined && (
                <div className="text-[11px] text-slate-300 font-mono-num mt-1 flex items-center gap-3">
                  <span>GDP: {formatCurrency(hoveredTerritory.gdp)}</span>
                  <span>SOL: {hoveredTerritory.sol?.toFixed(2)}</span>
                  <span>Pops: {formatCompactNumber(hoveredTerritory.pops)}</span>
                </div>
              )}
              <div className="text-[10px] text-amber-300 mt-1">
                {interactionMode === "annex"
                  ? `Click to Annex into ${activeNation?.name}`
                  : interactionMode === "release"
                  ? `Click to Release ${hoveredTerritory.name} as Independent State`
                  : hoveredTerritory.isControlled
                  ? "Click to Inspect & Govern"
                  : "Click to Awaken as Playable Nation or Annex"}
              </div>
            </div>
          )}

          {/* SVG Interactive Map Viewport */}
          <div
            onWheel={handleWheel}
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
                          stroke={isSelected ? "#ffffff" : "#0f172a"}
                          strokeWidth={(isSelected ? 1.2 : 0.35) / zoom}
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

                    {/* Internal Provincial Borders (Same Controller, e.g. inside EU or Expanded Empires) */}
                    {internalBorderPath && (
                      <path
                        d={internalBorderPath}
                        fill="none"
                        stroke="#020617"
                        strokeOpacity={0.35}
                        strokeWidth={0.5 / zoom}
                        strokeDasharray={`${2 / zoom},${2 / zoom}`}
                        pointerEvents="none"
                      />
                    )}

                    {/* Dynamic Merged Sovereign International Borders */}
                    {sovereignBorderPath && (
                      <path
                        d={sovereignBorderPath}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeOpacity={0.85}
                        strokeWidth={1.1 / zoom}
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
                            stroke={isSelected ? "#ffffff" : "#fdba74"}
                            strokeOpacity={isSelected ? 1 : 0.45}
                            strokeWidth={(isSelected ? 2.2 : 1) / zoom}
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

                {/* THEATER 3: VIETNAM 1977 REGIONAL MAP */}
                {theater === "Vietnam" && (
                  <>
                    {VIETNAM_REGION_POLYGONS.map((reg) => {
                      const ctrlId =
                        territoryMap[reg.name] ||
                        reg.name.toLowerCase().replace(/\s+/g, "_");
                      const ctrlNation = nationById.get(ctrlId);
                      const isSelected =
                        ctrlNation && ctrlNation.id === activeNation?.id;
                      const fill = ctrlNation
                        ? nationColorMap.get(ctrlNation.id)
                        : "#1e293b";

                      return (
                        <g
                          key={reg.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTerritoryClick(
                              reg.name,
                              "Vietnam (1977 Regions)"
                            );
                          }}
                          onMouseEnter={() =>
                            setHoveredTerritory({
                              name: reg.name,
                              isControlled: Boolean(ctrlNation),
                              controllerName: ctrlNation?.name || reg.name,
                              gdp: ctrlNation?.computed?.aggregateGdp,
                              sol: ctrlNation?.computed?.sol,
                              pops: ctrlNation?.computed?.effectiveWorkingPops,
                            })
                          }
                          onMouseLeave={() => setHoveredTerritory(null)}
                          className="cursor-pointer"
                        >
                          <polygon
                            points={reg.points}
                            fill={fill}
                            fillOpacity={isSelected ? 0.92 : 0.72}
                            stroke={isSelected ? "#ffffff" : "#e2e8f0"}
                            strokeWidth={(isSelected ? 2.4 : 1.1) / zoom}
                            className="transition duration-150 hover:brightness-125"
                          />
                          <text
                            x={reg.cx}
                            y={reg.cy}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={10 / Math.sqrt(zoom)}
                            fontWeight="700"
                            style={{ textShadow: "0 1px 4px #000" }}
                          >
                            {reg.name}
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
                {onVictoriaAction && (
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

            {/* Interactive Statecraft & Cabinet Levers (No spreadsheet jargon!) */}
            <div className="space-y-3 text-xs">
              <div className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Cabinet Policy & Macroeconomic Levers
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

              {/* Tax & Wage Sliders */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Income Tax</span>
                    <span className="font-mono-num text-cyan-300 font-bold">
                      {formatPercent(c.incomeTax, 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.7"
                    step="0.01"
                    value={c.incomeTax}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        incomeTaxOverride: Number(e.target.value),
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
                  <input
                    type="range"
                    min="0"
                    max="0.7"
                    step="0.01"
                    value={c.corporateTax}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        corporateTaxOverride: Number(e.target.value),
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
                  <input
                    type="range"
                    min="0.1"
                    max="0.85"
                    step="0.01"
                    value={c.workerShareOfGdp}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        workerShareOverride: Number(e.target.value),
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
                  <input
                    type="range"
                    min="0.05"
                    max="0.6"
                    step="0.01"
                    value={c.stateBudgetPercent}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        budgetPercentOverride: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Infrastructure, Literacy & Social Doctrines */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-2.5">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Infrastructure</span>
                    <span className="font-mono-num text-amber-300">
                      {formatPercent(c.infrastructureEfficiency, 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.01"
                    value={c.infrastructureEfficiency}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        infrastructureEfficiency: Number(e.target.value),
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
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={c.literacyRate}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        literacyRate: Number(e.target.value),
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
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.01"
                    value={c.urbanisationIndex}
                    onChange={(e) =>
                      onUpdateNation(activeNation.id, {
                        urbanisationIndex: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Top Flagship Corporations Preview & Deep-Dive Navigation Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Flagship National Champions ({activeNation.companies?.length || 0})
                </span>
                <button
                  onClick={() => onJumpToTab("companies")}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  Manage All Corporations <ArrowRight className="w-3 h-3" />
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

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onJumpToTab("desk")}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Full Cabinet & Fiscal Desk
                </button>
                <button
                  onClick={() => onJumpToTab("markets")}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  Supply Chains & Tech Tree
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
