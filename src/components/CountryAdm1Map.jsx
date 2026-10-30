import React, { useState, useEffect, useMemo, useRef } from "react";
import { geoMercator, geoNaturalEarth1, geoAlbersUsa, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import { US_STATES_CATALOG, REGION_TINTS, getUsaStateData } from "../data/usStatesData";
import {
  Layers,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { loadCountryAdm1, resolveIso3 } from "../services/boundaryService";
import { getLinkedSubdivision } from "../data/adm1Mapping";

// Pre-extract US states GeoJSON feature collection and mesh
const US_STATES_GEO = topojson.feature(usAtlas, usAtlas.objects.states);
const US_STATES_MESH = topojson.mesh(usAtlas, usAtlas.objects.states, (a, b) => a !== b);

/**
 * CountryAdm1Map
 * Authoritative country-level cartography rendering true first-level administrative
 * units (states, provinces, prefectures, governorates) as interactive selectable polygons.
 */
export default function CountryAdm1Map({
  nation,
  selectedSubdivision,
  onSelectSubdivision,
  territoryMap = {},
  nationColor = "#06b6d4",
  economicSubdivisions = [],
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [layerMode, setLayerMode] = useState("administrative"); // "administrative" | "economic"
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const iso3 = useMemo(() => resolveIso3(nation?.id || nation?.name), [nation]);
  const isUsa = iso3 === "USA";

  // Map Dimensions
  const width = 640;
  const height = 400;

  // Load country ADM1 GeoJSON when active nation changes (for non-US nations)
  useEffect(() => {
    let active = true;
    setHoveredFeature(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    if (!nation) {
      setLoading(false);
      return;
    }

    if (isUsa) {
      setGeoData(US_STATES_GEO);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    loadCountryAdm1(nation.id || nation.name).then((res) => {
      if (!active) return;
      if (res.success && res.geojson) {
        setGeoData(res.geojson);
        setError(null);
      } else {
        setGeoData(null);
        setError(res.reason || "ADM1 geographic boundary dataset unavailable.");
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [nation, isUsa]);

  // D3 Projection and Path Generator fitted to the country bounds
  const { pathGenerator, computedFeatures, meshPath } = useMemo(() => {
    if (isUsa) {
      // Official Albers USA composite projection: lower 48 large & centered, Alaska/Hawaii neatly in corner
      const proj = geoAlbersUsa().fitExtent(
        [
          [20, 20],
          [width - 20, height - 20],
        ],
        US_STATES_GEO
      );
      const pathGen = geoPath(proj);
      const mesh = pathGen(US_STATES_MESH);

      const featuresWithSvg = US_STATES_GEO.features.map((f) => {
        const d = pathGen(f);
        const centroid = pathGen.centroid(f);
        const bounds = pathGen.bounds(f);
        const name = f.properties.name;
        const meta = getUsaStateData(name);
        return {
          id: f.id || name,
          properties: {
            name,
            code: meta?.code || "",
            region: meta?.region || "State",
            type: "State",
            iso: `US-${meta?.code || ""}`,
          },
          svgPath: d,
          centroid: Number.isFinite(centroid[0]) ? centroid : [width / 2, height / 2],
          bounds,
        };
      }).filter((f) => Boolean(f.svgPath));

      return { pathGenerator: pathGen, computedFeatures: featuresWithSvg, meshPath: mesh };
    }

    if (!geoData || !geoData.features || geoData.features.length === 0) {
      return { pathGenerator: null, computedFeatures: [], meshPath: null };
    }

    // For sovereign nations (COD, DEU, GBR, FRA, JPN, BRA, etc.), fit Mercator to bounds
    const projection = geoMercator().fitExtent(
      [
        [24, 24],
        [width - 24, height - 24],
      ],
      geoData
    );

    const pathGen = geoPath(projection);

    const featuresWithSvg = geoData.features.map((f, i) => {
      const d = pathGen(f);
      const centroid = pathGen.centroid(f);
      const bounds = pathGen.bounds(f);
      return {
        ...f,
        id: f.id || `${iso3}_${i}`,
        svgPath: d,
        centroid: Number.isFinite(centroid[0]) ? centroid : [width / 2, height / 2],
        bounds,
      };
    }).filter((f) => Boolean(f.svgPath));

    return { pathGenerator: pathGen, computedFeatures: featuresWithSvg, meshPath: null };
  }, [geoData, isUsa, iso3]);

  // Mouse Wheel Zoom & Pan handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((z) => Math.min(6, Math.max(0.8, Number((z * factor).toFixed(2)))));
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
      x: Math.max(-280, Math.min(280, dragStartRef.current.panX + dx)),
      y: Math.max(-200, Math.min(200, dragStartRef.current.panY + dy)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative select-none">
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {nation?.name}
          </span>
          {computedFeatures.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono-num font-bold">
              {computedFeatures.length} First-Level Units (ADM1)
            </span>
          )}
        </div>

        {/* Layer Mode Toggle (Administrative vs Economic) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLayerMode("administrative")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "administrative"
                ? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3 h-3" />
            Administrative (Real)
          </button>
          <button
            onClick={() => setLayerMode("economic")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "economic"
                ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Landmark className="w-3 h-3" />
            Economic Zones
          </button>
        </div>

        {/* Camera Zoom & Reset Controls */}
        <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setZoom((z) => Math.min(6, Number((z * 1.2).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.8, Number((z * 0.8).toFixed(2))))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-500 font-mono px-1">
            {zoom.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Main Cartographic Viewport */}
      <div
        className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {loading && (
          <div className="flex flex-col items-center gap-2 text-cyan-400 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Loading ADM1 Boundaries...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center max-w-sm text-center p-4 text-slate-400 bg-slate-900/80 rounded-2xl border border-slate-800">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              Geographic Boundary Unavailable
            </h4>
            <p className="text-xs text-slate-400 mb-3">{error}</p>
            <span className="text-[11px] text-cyan-400 font-medium">
              Simulation continues with aggregated national accounts.
            </span>
          </div>
        )}

        {!loading && !error && computedFeatures.length > 0 && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* Background Subdivisions */}
            <g>
              {computedFeatures.map((feat, index) => {
                const name = feat.properties.name || `Subdivision ${index + 1}`;
                const isSelected = selectedSubdivision === name;
                const isHovered = hoveredFeature?.properties?.name === name;

                // Check for secession
                const directOwner =
                  name === "Georgia"
                    ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || territoryMap["Georgia"]
                    : territoryMap[name];
                const isSeceded = directOwner && directOwner !== nation?.id && directOwner !== "usa";

                const linkedEcon = getLinkedSubdivision(iso3, name);
                const regionTint = isUsa ? REGION_TINTS[feat.properties.region] : null;

                const fillColor = isSeceded
                  ? "#f59e0b"
                  : isSelected
                  ? "#38bdf8"
                  : isHovered
                  ? "#22d3ee"
                  : isUsa && regionTint
                  ? regionTint
                  : layerMode === "economic" && linkedEcon
                  ? "#0284c7"
                  : nationColor;

                return (
                  <path
                    key={feat.id || `adm1_${index}`}
                    d={feat.svgPath}
                    fill={fillColor}
                    fillOpacity={
                      isSelected ? 0.98 : isHovered ? 0.92 : isSeceded ? 0.95 : 0.82
                    }
                    stroke={isSelected ? "#ffffff" : isHovered ? "#38bdf8" : isSeceded ? "#fef08a" : "#0f172a"}
                    strokeWidth={isSelected ? 2.0 / zoom : 0.85 / zoom}
                    className="transition-colors duration-150 hover:brightness-125 cursor-pointer"
                    onMouseEnter={() => setHoveredFeature(feat)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectSubdivision) {
                        onSelectSubdivision(name);
                      }
                    }}
                  />
                );
              })}
            </g>

            {/* Mesh Boundaries Overlay */}
            {meshPath ? (
              <path
                d={meshPath}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.65}
                strokeWidth={0.8 / zoom}
                strokeDasharray={`${2.5 / zoom},${1.5 / zoom}`}
                pointerEvents="none"
              />
            ) : (
              <g className="pointer-events-none">
                {computedFeatures.map((feat, index) => (
                  <path
                    key={`mesh_${feat.id || index}`}
                    d={feat.svgPath}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity={0.4}
                    strokeWidth={0.6 / zoom}
                  />
                ))}
              </g>
            )}

            {/* Postal Codes for USA or Clean Labels for Selected / Zoomed in Provinces */}
            <g className="pointer-events-none select-none">
              {computedFeatures.map((feat, index) => {
                const [cx, cy] = feat.centroid;
                const name = feat.properties.name;
                const isSelected = selectedSubdivision === name;
                if (!cx || !cy || isNaN(cx) || isNaN(cy) || cx <= 0) return null;

                // For USA: Clean, un-overlapping 2-letter postal code
                if (isUsa && feat.properties.code) {
                  return (
                    <text
                      key={`lbl_${feat.id || index}`}
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      fill={isSelected ? "#ffffff" : "#f1f5f9"}
                      fontSize={Math.max(6.5, 9 / Math.sqrt(zoom))}
                      fontWeight="bold"
                      fontFamily="monospace"
                      className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    >
                      {feat.properties.code}
                    </text>
                  );
                }

                // For other countries: Only show label if selected, hovered, or user zooms in
                if (isSelected || (zoom >= 1.8 && name.length <= 15)) {
                  return (
                    <text
                      key={`lbl_${feat.id || index}`}
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fill={isSelected ? "#ffffff" : "#f1f5f9"}
                      fontSize={Math.max(6, 8.5 / Math.sqrt(zoom))}
                      fontWeight={isSelected ? "bold" : "600"}
                      fontFamily="sans-serif"
                      className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                    >
                      {name}
                    </text>
                  );
                }

                return null;
              })}
            </g>
          </svg>
        )}

        {/* Hover / Selection Context Badge at bottom-left */}
        {hoveredFeature && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none flex flex-col gap-0.5 z-20 animate-in fade-in duration-100">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {hoveredFeature.properties.name}
            </span>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Type: <strong className="text-slate-200">{hoveredFeature.properties.type || "Province"}</strong></span>
              <span>•</span>
              <span>ISO: <strong className="text-cyan-300 font-mono">{hoveredFeature.properties.iso || "N/A"}</strong></span>
            </div>
            {(() => {
              const linked = getLinkedSubdivision(iso3, hoveredFeature.properties.name);
              return linked ? (
                <div className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 mt-1">
                  Simulation Zone: <strong>{linked.zoneName}</strong> ({linked.role})
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Metadata Source Footer */}
        <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 pointer-events-none">
          Cartography: {isUsa ? "US Census / Natural Earth" : "geoBoundaries gbOpen (CC-BY 4.0)"}
        </div>
      </div>
    </div>
  );
}
