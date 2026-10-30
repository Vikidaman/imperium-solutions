import React, { useState, useEffect, useMemo, useRef } from "react";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import { US_STATES_CATALOG, REGION_TINTS, getUsaStateData } from "../data/usStatesData";
import {
  US_GEOGRAPHIC_ENDOWMENTS,
  getUsStateEndowment,
  ALL_US_RESOURCE_MARKERS,
} from "../data/usGeographicEndowments";
import { MAP_PROVIDERS } from "../data/mapProviders";
import {
  Layers,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Globe2,
  Pickaxe,
  Fuel,
  Wheat,
  Anchor,
  Sparkles,
} from "lucide-react";
import { loadCountryAdm1, resolveIso3, getContinentalBounds } from "../services/boundaryService";
import { getLinkedSubdivision } from "../data/adm1Mapping";

// Pre-extract US states GeoJSON feature collection and mesh
const US_STATES_GEO = topojson.feature(usAtlas, usAtlas.objects.states);

/**
 * CountryAdm1Map
 * High-performance interactive cartography for Country & Constituent States.
 * Powered by multi-provider tile basemaps (CartoDB, Esri Satellite, OSM)
 * and interactive administrative & natural resource endowment overlays.
 */
export default function CountryAdm1Map({
  nation,
  selectedSubdivision,
  onSelectSubdivision,
  territoryMap = {},
  nationColor = "#06b6d4",
  economicSubdivisions = [],
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const prevNationIdRef = useRef(null);

  const [mapProvider, setMapProvider] = useState("osm"); // Default to OpenStreetMap as requested
  const [layerMode, setLayerMode] = useState("administrative"); // "administrative" | "resources"
  const [resourceCategory, setResourceCategory] = useState("all"); // "all" | "oil_gas" | "mineral" | "agri" | "port"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const iso3 = useMemo(() => resolveIso3(nation?.id || nation?.name), [nation]);
  const isUsa = iso3 === "USA";

  // Load country boundary GeoJSON
  useEffect(() => {
    let active = true;
    setHoveredFeature(null);

    if (!nation) {
      setGeoData(null);
      return;
    }

    if (isUsa) {
      setGeoData(US_STATES_GEO);
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

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    let active = true;

    import("leaflet").then((LModule) => {
      if (!active || !mapContainerRef.current) return;
      const L = LModule.default || LModule;

      // 1. Initialize Leaflet Map Instance if not created
      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
          fadeAnimation: true,
          markerZoomAnimation: true,
        });

        // Set initial world view
        map.setView([38, -96], 4);
        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      // 2. Update Basemap Tile Layer
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const provider = MAP_PROVIDERS[mapProvider] || MAP_PROVIDERS.carto_dark;
      const tileLayer = L.tileLayer(provider.url, {
        subdomains: provider.subdomains,
        maxZoom: provider.maxZoom,
        attribution: provider.attribution,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // 3. Render GeoJSON Boundaries Layer
      if (geojsonLayerRef.current) {
        map.removeLayer(geojsonLayerRef.current);
        geojsonLayerRef.current = null;
      }

      if (geoData && geoData.features && geoData.features.length > 0) {
        const geoLayer = L.geoJSON(geoData, {
          style: (feature) => {
            const name = feature.properties?.name || "";
            const isSelected = selectedSubdivision === name;
            const region = feature.properties?.region;
            const regionTint = isUsa ? REGION_TINTS[region] : null;

            // Secession check
            const directOwner =
              name === "Georgia"
                ? territoryMap["Georgia (USA)"] || territoryMap["Georgia:Atlanta"] || territoryMap["Georgia"]
                : territoryMap[name];
            const isSeceded = directOwner && directOwner !== nation?.id && directOwner !== "usa";

            // Color based on layer mode
            let fillColor = nationColor;
            let fillOpacity = 0.28;

            if (isSeceded) {
              fillColor = "#f59e0b";
              fillOpacity = 0.65;
            } else if (layerMode === "resources" && isUsa) {
              const endow = getUsStateEndowment(name);
              if (resourceCategory === "oil_gas") {
                const ratio = (endow.hydrocarbonIndex || 0) / 100;
                fillColor = `hsl(38, 92%, ${Math.round(20 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.2, ratio * 0.75);
              } else if (resourceCategory === "mineral") {
                const ratio = (endow.mineralIndex || 0) / 100;
                fillColor = `hsl(275, 85%, ${Math.round(25 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.2, ratio * 0.75);
              } else if (resourceCategory === "agri") {
                const ratio = (endow.arableLandIndex || 0) / 100;
                fillColor = `hsl(142, 75%, ${Math.round(22 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.2, ratio * 0.75);
              } else if (resourceCategory === "port") {
                const ratio = (endow.logisticsWaterwayIndex || 0) / 100;
                fillColor = `hsl(199, 89%, ${Math.round(25 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.2, ratio * 0.75);
              } else {
                const totalEndow = ((endow.hydrocarbonIndex || 0) + (endow.mineralIndex || 0) + (endow.arableLandIndex || 0)) / 300;
                fillColor = `hsl(180, 85%, ${Math.round(25 + totalEndow * 35)}%)`;
                fillOpacity = Math.max(0.25, totalEndow * 0.7);
              }
            } else if (isUsa && regionTint) {
              fillColor = regionTint;
              fillOpacity = 0.32;
            } else {
              fillColor = nationColor;
              fillOpacity = 0.28;
            }

            if (isSelected) {
              fillColor = "#38bdf8";
              fillOpacity = 0.68;
            }

            return {
              fillColor,
              fillOpacity,
              color: isSelected ? "#ffffff" : isSeceded ? "#fef08a" : "#38bdf8",
              weight: isSelected ? 2.5 : 1.2,
              opacity: 0.85,
              dashArray: isSeceded ? "4, 3" : "",
            };
          },

          onEachFeature: (feature, layer) => {
            const name = feature.properties?.name || "Constituent Unit";

            // Click to select subdivision
            layer.on("click", (e) => {
              L.DomEvent.stopPropagation(e);
              if (onSelectSubdivision) {
                onSelectSubdivision(name);
              }
            });

            // Hover effects
            layer.on("mouseover", (e) => {
              setHoveredFeature(feature);
              const target = e.target;
              target.setStyle({
                weight: 2.5,
                color: "#22d3ee",
                fillOpacity: 0.55,
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                target.bringToFront();
              }
            });

            layer.on("mouseout", () => {
              setHoveredFeature(null);
              geoLayer.resetStyle(layer);
            });

            // Clean Tooltip
            const endow = isUsa ? getUsStateEndowment(name) : null;
            const stateMeta = isUsa ? getUsaStateData(name) : null;
            let tooltipContent = `<div class="px-2.5 py-1.5 text-xs font-sans">
              <div class="flex items-center gap-1.5">
                <strong class="text-white block font-bold">${name}</strong>
                ${stateMeta?.code ? `<span class="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-1 rounded">${stateMeta.code}</span>` : ""}
              </div>`;
            if (stateMeta?.capital) {
              tooltipContent += `<div class="text-[10px] text-slate-300">Capital: <strong class="text-white">${stateMeta.capital}</strong></div>`;
            }
            if (endow && layerMode === "resources") {
              tooltipContent += `<div class="text-[10px] text-amber-300 mt-1 font-mono">
                🛢️ Oil/Gas: ${endow.hydrocarbonIndex}% | ⛏️ Minerals: ${endow.mineralIndex}%
              </div>
              <div class="text-[10px] text-emerald-300 font-mono">
                🌾 Arable: ${endow.arableLandIndex}% | ⚓ Ports: ${endow.logisticsWaterwayIndex}%
              </div>`;
            } else if (stateMeta) {
              tooltipContent += `<div class="text-[10px] text-emerald-400 font-mono mt-0.5">Share of US GDP: ${(stateMeta.gdpShare * 100).toFixed(1)}%</div>`;
            } else {
              tooltipContent += `<span class="text-[10px] text-slate-400">Click to inspect constituent unit</span>`;
            }
            tooltipContent += `</div>`;

            layer.bindTooltip(tooltipContent, {
              sticky: true,
              className: "custom-leaflet-tooltip",
            });
          },
        }).addTo(map);

        geojsonLayerRef.current = geoLayer;

        // Auto-fit bounds ONLY when switching countries or on initial mount.
        // Clicking a state while zoomed in keeps the view fixed without auto-zooming out!
        const isNationChange = prevNationIdRef.current !== (nation?.id || nation?.name);
        if (isNationChange) {
          prevNationIdRef.current = nation?.id || nation?.name;
          const continental = getContinentalBounds(iso3);
          if (continental) {
            map.fitBounds(continental, {
              padding: [15, 15],
              maxZoom: 6,
              animate: false,
            });
          } else {
            try {
              const bounds = geoLayer.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds, {
                  padding: [20, 20],
                  maxZoom: 7,
                  animate: false,
                });
              }
            } catch {
              // fallback bounds
            }
          }
        }
      }

      // 4. Render Natural Resource Basin Markers in "resources" mode
      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }

      if (layerMode === "resources" && isUsa) {
        const markerGroup = L.layerGroup();

        const filteredMarkers = ALL_US_RESOURCE_MARKERS.filter((m) => {
          if (resourceCategory === "all") return true;
          return m.type === resourceCategory;
        });

        filteredMarkers.forEach((marker) => {
          const [lng, lat] = marker.coords;
          if (!lng || !lat) return;

          let iconEmoji = "⛏️";
          let badgeColor = "bg-purple-500/80 border-purple-300 text-purple-100";
          if (marker.type === "oil_gas") {
            iconEmoji = "🛢️";
            badgeColor = "bg-amber-500/80 border-amber-300 text-amber-100";
          } else if (marker.type === "agri") {
            iconEmoji = "🌾";
            badgeColor = "bg-emerald-500/80 border-emerald-300 text-emerald-100";
          } else if (marker.type === "port") {
            iconEmoji = "⚓";
            badgeColor = "bg-cyan-500/80 border-cyan-300 text-cyan-100";
          }

          const customIcon = L.divIcon({
            className: "custom-resource-marker",
            html: `
              <div class="flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} border-2 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-125 transition-transform duration-150 animate-pulse">
                <span class="text-xs">${iconEmoji}</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const mLayer = L.marker([lat, lng], { icon: customIcon });

          mLayer.bindPopup(`
            <div class="p-2 space-y-1.5 text-xs max-w-xs font-sans">
              <div class="flex items-center gap-1.5 font-bold text-white text-sm">
                <span>${iconEmoji}</span>
                <span>${marker.name}</span>
              </div>
              <span class="text-[10px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                ${marker.state} (${marker.stateCode})
              </span>
              <p class="text-[11px] text-slate-300 leading-relaxed mt-1">
                ${marker.desc}
              </p>
            </div>
          `, { className: "custom-leaflet-popup" });

          mLayer.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectSubdivision) {
              onSelectSubdivision(marker.state);
            }
          });

          markerGroup.addLayer(mLayer);
        });

        markerGroup.addTo(map);
        markersLayerRef.current = markerGroup;
      }
    });

    return () => {
      active = false;
    };
  }, [geoData, mapProvider, layerMode, resourceCategory, isUsa, nation, selectedSubdivision, nationColor]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  const handleResetBounds = () => {
    if (leafletMapRef.current) {
      const continental = getContinentalBounds(iso3);
      if (continental) {
        leafletMapRef.current.fitBounds(continental, { padding: [15, 15], maxZoom: 6 });
      } else if (geojsonLayerRef.current) {
        try {
          const bounds = geojsonLayerRef.current.getBounds();
          if (bounds.isValid()) {
            leafletMapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 7 });
          }
        } catch {
          leafletMapRef.current.setView([38, -96], 4);
        }
      }
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative select-none">
      {/* Top Controls Toolbar */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {nation?.name}
          </span>
          {geoData?.features && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono-num font-bold">
              {geoData.features.length} ADM1 Units
            </span>
          )}
        </div>

        {/* Map Provider Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Provider:</span>
          <select
            value={mapProvider}
            onChange={(e) => setMapProvider(e.target.value)}
            className="bg-transparent text-white font-semibold text-[11px] focus:outline-none cursor-pointer pr-1"
          >
            {Object.values(MAP_PROVIDERS).map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Layer Mode Toggle (Administrative vs Economic vs Natural Endowments) */}
        {/* Layer Mode: States (Administrative) vs Natural Resources View */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLayerMode("administrative")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "administrative"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Real constitutional administrative boundaries and statehood"
          >
            <Landmark className="w-3.5 h-3.5" />
            States (Administrative)
          </button>

          <button
            onClick={() => setLayerMode("resources")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "resources"
                ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                : "text-emerald-400 hover:text-emerald-200"
            }`}
            title="USGS, EIA & USDA naturally occurring geological resources and agricultural endowments"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Natural Resources
          </button>
        </div>

        {/* Camera Reset & Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-xl border border-slate-800">
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetBounds}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Reset to Country Bounds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-bar for Resource Category Filters (Active when layerMode === "resources") */}
      {layerMode === "resources" && isUsa && (
        <div className="px-3.5 py-1.5 bg-slate-950/90 border-b border-emerald-500/30 flex items-center justify-between gap-2 z-10 text-[11px] overflow-x-auto">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Endowments:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setResourceCategory("all")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition ${
                resourceCategory === "all" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setResourceCategory("oil_gas")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "oil_gas" ? "bg-amber-500 text-slate-950 font-bold" : "text-amber-400 hover:bg-slate-800"
              }`}
            >
              <Fuel className="w-3 h-3" /> 🛢️ Oil & Gas
            </button>
            <button
              onClick={() => setResourceCategory("mineral")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "mineral" ? "bg-purple-500 text-white font-bold" : "text-purple-400 hover:bg-slate-800"
              }`}
            >
              <Pickaxe className="w-3 h-3" /> ⛏️ Critical Minerals
            </button>
            <button
              onClick={() => setResourceCategory("agri")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "agri" ? "bg-emerald-500 text-slate-950 font-bold" : "text-emerald-400 hover:bg-slate-800"
              }`}
            >
              <Wheat className="w-3 h-3" /> 🌾 Agriculture
            </button>
            <button
              onClick={() => setResourceCategory("port")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "port" ? "bg-cyan-500 text-slate-950 font-bold" : "text-cyan-400 hover:bg-slate-800"
              }`}
            >
              <Anchor className="w-3 h-3" /> ⚓ Waterways & Ports
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-num">
            {ALL_US_RESOURCE_MARKERS.filter((m) => resourceCategory === "all" || m.type === resourceCategory).length} Key Formations
          </span>
        </div>
      )}

      {/* Main Interactive Map Viewport (Leaflet Container) */}
      <div className="relative w-full h-[400px] bg-slate-950 overflow-hidden">
        {/* Leaflet DOM mounting target */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center gap-3 z-20">
            <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-slate-300">
              Loading cartographic boundaries...
            </span>
          </div>
        )}

        {/* Error Fallback */}
        {error && !loading && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Geographic Data Unavailable</h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Hover / Selection Context Badge at bottom-left */}
        {hoveredFeature && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none flex flex-col gap-0.5 z-20 animate-in fade-in duration-100 max-w-xs">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {hoveredFeature.properties?.name}
              {hoveredFeature.properties?.code && (
                <span className="text-[10px] font-mono-num font-bold text-cyan-300 bg-cyan-500/20 px-1 py-0.2 rounded">
                  {hoveredFeature.properties.code}
                </span>
              )}
            </span>

            {isUsa && (
              (() => {
                const endow = getUsStateEndowment(hoveredFeature.properties?.name);
                return (
                  <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                    <div className="text-slate-300 font-mono-num">
                      🛢️ Oil/Gas: <strong className="text-amber-400">{endow.hydrocarbonIndex}%</strong> | ⛏️ Minerals: <strong className="text-purple-400">{endow.mineralIndex}%</strong>
                    </div>
                    <div className="text-slate-300 font-mono-num">
                      🌾 Arable: <strong className="text-emerald-400">{endow.arableLandIndex}%</strong> | ⚓ Ports: <strong className="text-cyan-400">{endow.logisticsWaterwayIndex}%</strong>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Metadata Source Footer */}
        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none z-10 bg-slate-950/75 px-1.5 py-0.5 rounded border border-slate-800">
          Map: {MAP_PROVIDERS[mapProvider]?.name} • USGS / EIA / USDA
        </div>
      </div>
    </div>
  );
}
