import React, { useState, useEffect, useRef } from "react";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import { REGION_TINTS, getUsaStateData } from "../data/usStatesData";
import {
  getUsStateEndowment,
  ALL_US_RESOURCE_MARKERS,
} from "../data/usGeographicEndowments";
import {
  getUsStateServicesEndowment,
  ALL_US_SERVICE_CLUSTERS,
} from "../data/usServicesEndowments";
import { MAP_PROVIDERS } from "../data/mapProviders";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Landmark,
  Globe2,
  Pickaxe,
  Fuel,
  Wheat,
  Anchor,
  Sparkles,
  Briefcase,
  Laptop,
  Building2,
  GraduationCap,
  UtensilsCrossed,
} from "lucide-react";

const US_STATES_GEO = topojson.feature(usAtlas, usAtlas.objects.states);
const CONUS_BOUNDS = [
  [24.396308, -124.848974],
  [49.384358, -66.885444],
];

export default function CountryAdm1Map({
  selectedSubdivision,
  onSelectSubdivision,
  nationColor = "#06b6d4",
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const initializedBoundsRef = useRef(false);

  const [layerMode, setLayerMode] = useState("administrative"); // "administrative" | "resources" | "services"
  const [resourceCategory, setResourceCategory] = useState("all");
  const [serviceCategory, setServiceCategory] = useState("all");
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    let active = true;

    import("leaflet").then((LModule) => {
      if (!active || !mapContainerRef.current) return;
      const L = LModule.default || LModule;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
          fadeAnimation: true,
          markerZoomAnimation: true,
        });
        map.setView([38, -96], 4);
        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const provider = MAP_PROVIDERS.osm;
      const tileLayer = L.tileLayer(provider.url, {
        subdomains: provider.subdomains,
        maxZoom: provider.maxZoom,
        attribution: provider.attribution,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      if (geojsonLayerRef.current) {
        map.removeLayer(geojsonLayerRef.current);
        geojsonLayerRef.current = null;
      }

      const geoLayer = L.geoJSON(US_STATES_GEO, {
        style: (feature) => {
          const name = feature.properties?.name || "";
          const isSelected = selectedSubdivision === name;
          const stateMeta = getUsaStateData(name);
          const regionTint = REGION_TINTS[stateMeta?.region];

          let fillColor = regionTint || nationColor;
          let fillOpacity = 0.32;

          if (layerMode === "resources") {
            const endow = getUsStateEndowment(name);
            if (resourceCategory === "oil_gas") {
              const val = endow.hydrocarbonIndex || 0;
              if (val <= 0) {
                fillColor = "#0f172a";
                fillOpacity = 0.35;
              } else {
                const ratio = val / 100;
                fillColor = `hsl(38, 92%, ${Math.round(25 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.35, ratio * 0.85);
              }
            } else if (resourceCategory === "mineral") {
              const val = endow.mineralIndex || 0;
              if (val <= 0) {
                fillColor = "#0f172a";
                fillOpacity = 0.35;
              } else {
                const ratio = val / 100;
                fillColor = `hsl(275, 85%, ${Math.round(30 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.35, ratio * 0.85);
              }
            } else if (resourceCategory === "agri") {
              const val = endow.arableLandIndex || 0;
              if (val <= 0) {
                fillColor = "#0f172a";
                fillOpacity = 0.35;
              } else {
                const ratio = val / 100;
                fillColor = `hsl(142, 75%, ${Math.round(25 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.35, ratio * 0.85);
              }
            } else if (resourceCategory === "port") {
              const val = endow.logisticsWaterwayIndex || 0;
              if (val <= 0) {
                fillColor = "#0f172a";
                fillOpacity = 0.35;
              } else {
                const ratio = val / 100;
                fillColor = `hsl(199, 89%, ${Math.round(30 + ratio * 35)}%)`;
                fillOpacity = Math.max(0.35, ratio * 0.85);
              }
            } else {
              const totalEndow =
                ((endow.hydrocarbonIndex || 0) +
                  (endow.mineralIndex || 0) +
                  (endow.arableLandIndex || 0)) /
                300;
              if (totalEndow <= 0) {
                fillColor = "#0f172a";
                fillOpacity = 0.35;
              } else {
                fillColor = `hsl(180, 85%, ${Math.round(25 + totalEndow * 35)}%)`;
                fillOpacity = Math.max(0.35, totalEndow * 0.8);
              }
            }
          } else if (layerMode === "services") {
            const srvEndow = getUsStateServicesEndowment(name);
            if (serviceCategory === "tech") {
              const val =
                ((srvEndow.digitalConnectivityIndex || 50) +
                  (srvEndow.humanCapitalIndex || 50)) /
                2;
              const ratio = val / 100;
              fillColor = `hsl(220, 90%, ${Math.round(25 + ratio * 35)}%)`;
              fillOpacity = Math.max(0.35, ratio * 0.85);
            } else if (serviceCategory === "finance") {
              const val = srvEndow.financialDepthIndex || 0;
              const ratio = val / 100;
              fillColor = `hsl(158, 85%, ${Math.round(25 + ratio * 35)}%)`;
              fillOpacity = Math.max(0.35, ratio * 0.85);
            } else if (serviceCategory === "research") {
              const val = srvEndow.humanCapitalIndex || 0;
              const ratio = val / 100;
              fillColor = `hsl(270, 85%, ${Math.round(28 + ratio * 35)}%)`;
              fillOpacity = Math.max(0.35, ratio * 0.85);
            } else if (serviceCategory === "hospitality") {
              const val = srvEndow.consumerAmenityIndex || 0;
              const ratio = val / 100;
              fillColor = `hsl(340, 85%, ${Math.round(28 + ratio * 35)}%)`;
              fillOpacity = Math.max(0.35, ratio * 0.85);
            } else {
              const composite =
                ((srvEndow.humanCapitalIndex || 50) +
                  (srvEndow.urbanAgglomerationIndex || 50) +
                  (srvEndow.financialDepthIndex || 50) +
                  (srvEndow.digitalConnectivityIndex || 50) +
                  (srvEndow.consumerAmenityIndex || 50)) /
                500;
              fillColor = `hsl(205, 90%, ${Math.round(25 + composite * 35)}%)`;
              fillOpacity = Math.max(0.35, composite * 0.85);
            }
          }

          if (isSelected) {
            fillColor = "#38bdf8";
            fillOpacity = 0.68;
          }

          return {
            fillColor,
            fillOpacity,
            color: isSelected ? "#ffffff" : "#38bdf8",
            weight: isSelected ? 2.5 : 1.2,
            opacity: 0.85,
          };
        },

        onEachFeature: (feature, layer) => {
          const name = feature.properties?.name || "State";

          layer.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectSubdivision) {
              onSelectSubdivision(name);
            }
          });

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

          const endow = getUsStateEndowment(name);
          const srvEndow = getUsStateServicesEndowment(name);
          const stateMeta = getUsaStateData(name);

          let tooltipContent = `<div style="background-color: #090e17 !important; color: #f8fafc !important; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.45); padding: 10px; font-family: ui-sans-serif, system-ui, sans-serif; box-shadow: 0 14px 35px rgba(0,0,0,0.85);" class="min-w-[220px] max-w-[290px] text-xs">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(100, 116, 139, 0.5);">
              <span style="font-weight: bold; color: #ffffff; font-size: 13px;">${name}</span>
              ${stateMeta?.code ? `<span style="font-size: 10px; background-color: rgba(6, 182, 212, 0.25); color: #a5f3fc; border: 1px solid rgba(34, 211, 238, 0.5); font-family: ui-monospace, monospace; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${stateMeta.code}</span>` : ""}
            </div>`;

          if (stateMeta?.capital) {
            tooltipContent += `<div style="font-size: 11px; color: #cbd5e1; margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #94a3b8;">Capital:</span>
              <strong style="color: #ffffff; font-weight: 600;">${stateMeta.capital}</strong>
            </div>`;
          }

          if (srvEndow && layerMode === "services") {
            tooltipContent += `
              <div class="grid grid-cols-2 gap-1.5 mt-2 font-mono-num text-[10.5px]">
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-cyan-500/35 flex items-center justify-between">
                  <span class="text-cyan-300 font-semibold">🧠 STEM</span>
                  <strong class="text-white font-bold">${srvEndow.humanCapitalIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-indigo-500/35 flex items-center justify-between">
                  <span class="text-indigo-300 font-semibold">🏙️ Density</span>
                  <strong class="text-white font-bold">${srvEndow.urbanAgglomerationIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-emerald-500/35 flex items-center justify-between">
                  <span class="text-emerald-300 font-semibold">🏦 Finance</span>
                  <strong class="text-white font-bold">${srvEndow.financialDepthIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-blue-500/35 flex items-center justify-between">
                  <span class="text-blue-300 font-semibold">⚡ Digital</span>
                  <strong class="text-white font-bold">${srvEndow.digitalConnectivityIndex}%</strong>
                </div>
              </div>
              <div class="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono-num">
                <span class="text-slate-400">Services Output:</span>
                <strong class="text-cyan-300 font-bold">${srvEndow.modeledServicesOutput}</strong>
              </div>`;
          } else if (endow && layerMode === "resources") {
            tooltipContent += `
              <div class="grid grid-cols-2 gap-1.5 mt-2 font-mono-num text-[10.5px]">
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-amber-500/35 flex items-center justify-between">
                  <span class="text-amber-300 font-semibold">🛢️ Oil/Gas</span>
                  <strong class="text-white font-bold">${endow.hydrocarbonIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-purple-500/35 flex items-center justify-between">
                  <span class="text-purple-300 font-semibold">⛏️ Minerals</span>
                  <strong class="text-white font-bold">${endow.mineralIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-emerald-500/35 flex items-center justify-between">
                  <span class="text-emerald-300 font-semibold">🌾 Arable</span>
                  <strong class="text-white font-bold">${endow.arableLandIndex}%</strong>
                </div>
                <div class="px-2 py-1 rounded-md bg-slate-900/90 border border-cyan-500/35 flex items-center justify-between">
                  <span class="text-cyan-300 font-semibold">⚓ Ports</span>
                  <strong class="text-white font-bold">${endow.logisticsWaterwayIndex}%</strong>
                </div>
              </div>`;
          } else if (stateMeta) {
            tooltipContent += `
              <div class="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono-num">
                <span class="text-slate-400">Share of US GDP:</span>
                <strong class="text-emerald-300 font-bold">${(stateMeta.gdpShare * 100).toFixed(1)}%</strong>
              </div>`;
          }
          tooltipContent += `</div>`;

          layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: "custom-leaflet-tooltip",
          });
        },
      }).addTo(map);

      geojsonLayerRef.current = geoLayer;

      if (!initializedBoundsRef.current) {
        initializedBoundsRef.current = true;
        map.fitBounds(CONUS_BOUNDS, {
          padding: [15, 15],
          maxZoom: 6,
          animate: false,
        });
      }

      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }

      if (layerMode === "resources") {
        const markerGroup = L.layerGroup();
        const filteredMarkers = ALL_US_RESOURCE_MARKERS.filter((m) =>
          resourceCategory === "all" ? true : m.type === resourceCategory
        );

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
              <div class="flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} border-2 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-125 transition-transform duration-150">
                <span class="text-xs">${iconEmoji}</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const mLayer = L.marker([lat, lng], { icon: customIcon });
          mLayer.bindPopup(
            `
            <div style="background: #090e17; color: #f8fafc; border-radius: 10px;" class="p-2.5 space-y-1.5 text-xs max-w-xs font-sans">
              <div class="flex items-center gap-1.5 font-bold text-white text-sm">
                <span>${iconEmoji}</span>
                <span>${marker.name}</span>
              </div>
              <span class="text-[10px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 inline-block font-semibold">
                ${marker.state} (${marker.stateCode})
              </span>
              <p class="text-[11.5px] text-slate-200 leading-relaxed mt-1">
                ${marker.desc}
              </p>
            </div>
          `,
            { className: "custom-leaflet-popup" }
          );

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

      if (layerMode === "services") {
        const markerGroup = L.layerGroup();
        const filteredMarkers = ALL_US_SERVICE_CLUSTERS.filter((m) =>
          serviceCategory === "all" ? true : m.type === serviceCategory
        );

        filteredMarkers.forEach((marker) => {
          const [lng, lat] = marker.coords;
          if (!lng || !lat) return;

          let iconEmoji = "💻";
          let badgeColor = "bg-blue-600/80 border-blue-300 text-blue-100";
          if (marker.type === "finance") {
            iconEmoji = "🏦";
            badgeColor = "bg-emerald-600/80 border-emerald-300 text-emerald-100";
          } else if (marker.type === "research") {
            iconEmoji = "🔬";
            badgeColor = "bg-purple-600/80 border-purple-300 text-purple-100";
          } else if (marker.type === "hospitality") {
            iconEmoji = "🍸";
            badgeColor = "bg-rose-600/80 border-rose-300 text-rose-100";
          }

          const customIcon = L.divIcon({
            className: "custom-service-marker",
            html: `
              <div class="flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} border-2 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-125 transition-transform duration-150">
                <span class="text-xs">${iconEmoji}</span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const mLayer = L.marker([lat, lng], { icon: customIcon });
          mLayer.bindPopup(
            `
            <div style="background: #090e17; color: #f8fafc; border-radius: 10px;" class="p-2.5 space-y-1.5 text-xs max-w-xs font-sans">
              <div class="flex items-center gap-1.5 font-bold text-white text-sm">
                <span>${iconEmoji}</span>
                <span>${marker.name}</span>
              </div>
              <span class="text-[10px] font-mono-num uppercase px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 inline-block font-semibold">
                ${marker.state} (${marker.stateCode}) • ${marker.type.toUpperCase()}
              </span>
              <p class="text-[11.5px] text-slate-200 leading-relaxed mt-1">
                ${marker.desc}
              </p>
            </div>
          `,
            { className: "custom-leaflet-popup" }
          );

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
  }, [layerMode, resourceCategory, serviceCategory, selectedSubdivision, nationColor, onSelectSubdivision]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative select-none">
      {/* Top Controls Toolbar */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-xs">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            United States (50 States & Territories)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            OpenStreetMap
          </span>
        </div>

        {/* Layer Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLayerMode("administrative")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "administrative"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            States
          </button>

          <button
            onClick={() => setLayerMode("resources")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "resources"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-emerald-400 hover:text-emerald-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Natural Resources
          </button>

          <button
            onClick={() => setLayerMode("services")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
              layerMode === "services"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-indigo-400 hover:text-indigo-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Services & Knowledge
          </button>
        </div>

        {/* Camera Reset & Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 px-1 py-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => leafletMapRef.current?.zoomIn()}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => leafletMapRef.current?.zoomOut()}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => leafletMapRef.current?.fitBounds(CONUS_BOUNDS, { padding: [15, 15], maxZoom: 6 })}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Reset to Continental US Bounds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-bar for Resource Category Filters */}
      {layerMode === "resources" && (
        <div className="px-3.5 py-1.5 bg-slate-950/90 border-b border-emerald-500/30 flex items-center justify-between gap-2 z-10 text-[11px] overflow-x-auto">
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
              <Fuel className="w-3 h-3" /> Oil & Gas
            </button>
            <button
              onClick={() => setResourceCategory("mineral")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "mineral" ? "bg-purple-500 text-white font-bold" : "text-purple-400 hover:bg-slate-800"
              }`}
            >
              <Pickaxe className="w-3 h-3" /> Critical Minerals
            </button>
            <button
              onClick={() => setResourceCategory("agri")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "agri" ? "bg-emerald-500 text-slate-950 font-bold" : "text-emerald-400 hover:bg-slate-800"
              }`}
            >
              <Wheat className="w-3 h-3" /> Agriculture
            </button>
            <button
              onClick={() => setResourceCategory("port")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                resourceCategory === "port" ? "bg-cyan-500 text-slate-950 font-bold" : "text-cyan-400 hover:bg-slate-800"
              }`}
            >
              <Anchor className="w-3 h-3" /> Waterways & Ports
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-num">
            {ALL_US_RESOURCE_MARKERS.filter((m) => resourceCategory === "all" || m.type === resourceCategory).length} Key Formations
          </span>
        </div>
      )}

      {/* Sub-bar for Services Category Filters */}
      {layerMode === "services" && (
        <div className="px-3.5 py-1.5 bg-slate-950/90 border-b border-indigo-500/30 flex items-center justify-between gap-2 z-10 text-[11px] overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setServiceCategory("all")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition ${
                serviceCategory === "all" ? "bg-indigo-500 text-white font-bold" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              All Sectors
            </button>
            <button
              onClick={() => setServiceCategory("tech")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                serviceCategory === "tech" ? "bg-blue-600 text-white font-bold" : "text-blue-400 hover:bg-slate-800"
              }`}
            >
              <Laptop className="w-3 h-3" /> High-Tech & Cloud
            </button>
            <button
              onClick={() => setServiceCategory("finance")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                serviceCategory === "finance" ? "bg-emerald-600 text-white font-bold" : "text-emerald-400 hover:bg-slate-800"
              }`}
            >
              <Building2 className="w-3 h-3" /> Finance & Banking
            </button>
            <button
              onClick={() => setServiceCategory("research")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                serviceCategory === "research" ? "bg-purple-600 text-white font-bold" : "text-purple-400 hover:bg-slate-800"
              }`}
            >
              <GraduationCap className="w-3 h-3" /> STEM & R&D
            </button>
            <button
              onClick={() => setServiceCategory("hospitality")}
              className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition flex items-center gap-1 ${
                serviceCategory === "hospitality" ? "bg-rose-600 text-white font-bold" : "text-rose-400 hover:bg-slate-800"
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" /> Hospitality & Tourism
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-mono-num">
            {ALL_US_SERVICE_CLUSTERS.filter((m) => serviceCategory === "all" || m.type === serviceCategory).length} Metro Clusters
          </span>
        </div>
      )}

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full h-[420px] bg-slate-950 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {hoveredFeature && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xl pointer-events-none flex flex-col gap-0.5 z-20 max-w-xs">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {hoveredFeature.properties?.name}
            </span>
          </div>
        )}

        <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 pointer-events-none z-10 bg-slate-950/75 px-1.5 py-0.5 rounded border border-slate-800">
          Map: OpenStreetMap • USGS / EIA / USDA / BEA / BLS
        </div>
      </div>
    </div>
  );
}
