import React, { useEffect, useMemo, useRef, useState } from "react";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import usCountiesAtlas from "us-atlas/counties-10m.json";
import {
  Flag,
  Vote,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Search,
  Award,
  Users,
  TrendingUp,
  History,
  Crown,
  Calendar,
  Timer,
  AlertTriangle,
  Megaphone,
  Tv,
  Landmark,
  Building2,
  ArrowLeft,
  Compass,
  Layers,
} from "lucide-react";
import {
  DEFAULT_POLITICAL_PARTIES,
  FUNDING_TIERS,
  FEDERALISM_POLICY_CATALOG,
  FEDERALISM_POLICY_ORDER,
  POLICY_CATALOG,
  SOCIAL_POLICY_CATALOG,
  cloneDefaultPolicies,
  cloneDefaultSocialPolicies,
  computeTaxRatesFromPosture,
} from "../../server/simplifiedSeedConfig";
import { US_STATES_CATALOG } from "../data/usStatesData";

const FUNDING_TIER_ORDER = ["underfunded", "standard", "priority", "landmark"];
const SOCIAL_LEVEL_ORDER = ["low", "balanced", "strong"];
const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#eab308",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const NORTHEAST_CALLOUT_CODES = [
  "VT",
  "NH",
  "MA",
  "RI",
  "CT",
  "NJ",
  "DE",
  "MD",
  "DC",
];

// Build TopoJSON polygons once for instant rendering
const US_STATES_GEO = topojson.feature(usAtlas, usAtlas.objects.states);
const US_COUNTIES_GEO = topojson.feature(usCountiesAtlas, usCountiesAtlas.objects.counties);

// Albers Equal-Area Conic projection centered on CONUS -> 920x560 canvas
function projectConusAlbers(lon, lat) {
  const rad = Math.PI / 180;
  const phi0 = 37.5 * rad;
  const phi1 = 29.5 * rad;
  const phi2 = 45.5 * rad;
  const lam0 = -96 * rad;

  const n = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(Math.max(0.0001, c - 2 * n * Math.sin(phi0))) / n;

  const phi = lat * rad;
  const lam = lon * rad;
  const rho = Math.sqrt(Math.max(0.0001, c - 2 * n * Math.sin(phi))) / n;
  const theta = n * (lam - lam0);

  const scale = 1040;
  const x = 475 + scale * rho * Math.sin(theta);
  const y = 265 - scale * (rho0 - rho * Math.cos(theta));
  return [x, y];
}

function projectAlaska(lon, lat) {
  let l = lon;
  if (l > 0) l = l - 360; // unwrap Aleutians
  const x = 42 + ((l + 174) / (174 - 129)) * 165;
  const y = 415 + ((72 - lat) / (72 - 51)) * 120;
  return [x, y];
}

function projectHawaii(lon, lat) {
  const x = 225 + ((lon + 161) / 7.5) * 95;
  const y = 465 + ((22.6 - lat) / 4.2) * 65;
  return [x, y];
}

function ringToSvgPath(ring, projectFn) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const [x, y] = projectFn(lon, lat);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + "Z";
}

function featureToSvgPath(feature) {
  const name = feature.properties?.name || "";
  if (name === "Puerto Rico" || !feature.geometry) return "";
  const proj =
    name === "Alaska"
      ? projectAlaska
      : name === "Hawaii"
      ? projectHawaii
      : projectConusAlbers;

  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    return coordinates.map((r) => ringToSvgPath(r, proj)).join(" ");
  }
  if (type === "MultiPolygon") {
    return coordinates
      .map((poly) => poly.map((r) => ringToSvgPath(r, proj)).join(" "))
      .join(" ");
  }
  return "";
}

function daysBetweenYmd(aStr, bStr) {
  if (!aStr || !bStr) return null;
  const [ay, am, ad] = aStr.split("-").map(Number);
  const [by, bm, bd] = bStr.split("-").map(Number);
  if (!ay || !by) return null;
  const ta = Date.UTC(ay, (am || 1) - 1, ad || 1);
  const tb = Date.UTC(by, (bm || 1) - 1, bd || 1);
  return Math.round((ta - tb) / 86400000);
}

function getCnnFillStyle(st, highlightTossups) {
  if (!st) return { fill: "#1e293b", fillOpacity: 0.7, tierLabel: "NO DATA" };
  if (highlightTossups && st.cnnTier === "tossup") {
    return {
      fill: "#eab308",
      fillOpacity: 0.85,
      tierLabel: "TOSS-UP",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    };
  }
  const fill = st.winnerColor || "#64748b";
  if (st.cnnTier === "safe") {
    return {
      fill,
      fillOpacity: 0.94,
      tierLabel: "SAFE",
      badgeClass: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
    };
  }
  if (st.cnnTier === "likely") {
    return {
      fill,
      fillOpacity: 0.68,
      tierLabel: "LIKELY",
      badgeClass: "bg-sky-500/20 text-sky-200 border-sky-500/40",
    };
  }
  if (st.cnnTier === "lean") {
    return {
      fill,
      fillOpacity: 0.44,
      tierLabel: "LEAN",
      badgeClass: "bg-indigo-500/20 text-indigo-200 border-indigo-500/40",
    };
  }
  return {
    fill,
    fillOpacity: 0.28,
    tierLabel: "TILT",
    badgeClass: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  };
}

function CnnElectoralWallMap({
  stateResults = [],
  selectedStateName,
  onSelectState,
  highlightTossups = true,
  wallTitle = "CNN Election Night Magic Wall — 538 Electoral Votes",
}) {
  const byName = useMemo(() => {
    const m = new Map();
    for (const s of stateResults) {
      m.set(s.stateName, s);
    }
    return m;
  }, [stateResults]);

  const [hoveredState, setHoveredState] = useState(null);
  const inspectedStateName = hoveredState || selectedStateName || "Pennsylvania";
  const inspected = byName.get(inspectedStateName) || stateResults[0];

  const statePaths = useMemo(
    () =>
      US_STATES_GEO.features
        .map((feat) => ({
          name: feat.properties?.name || "",
          d: featureToSvgPath(feat),
        }))
        .filter((f) => f.d && byName.has(f.name)),
    [byName]
  );

  const calloutStates = useMemo(
    () =>
      NORTHEAST_CALLOUT_CODES.map((code) =>
        stateResults.find((s) => s.code === code)
      ).filter(Boolean),
    [stateResults]
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 bg-[#070b14] border border-slate-800 rounded-2xl p-4 shadow-2xl">
      {/* Left 8 Cols: CNN Election Night SVG Map */}
      <div className="xl:col-span-8 flex flex-col justify-between space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-200">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {wallTitle}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-2.5 rounded-sm bg-blue-600 inline-block opacity-95" /> Safe (&ge;13%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2.5 rounded-sm bg-blue-500 inline-block opacity-70" /> Likely (7–13%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2.5 rounded-sm bg-blue-400 inline-block opacity-45" /> Lean (3–7%)
            </span>
            <span className="flex items-center gap-1">
              {highlightTossups ? (
                <>
                  <span className="w-3 h-2.5 rounded-sm bg-yellow-500 inline-block opacity-85" /> Toss-Up (&lt;3%)
                </>
              ) : (
                <>
                  <span className="w-3 h-2.5 rounded-sm bg-blue-300 inline-block opacity-35" /> Tilt (&lt;3%, Leader Awarded)
                </>
              )}
            </span>
          </div>
        </div>

        <div className="relative bg-[#0b1120] border border-slate-800/90 rounded-xl p-2 overflow-hidden">
          <svg
            viewBox="0 0 940 560"
            className="w-full h-auto select-none"
            role="img"
            aria-label="CNN Election Night United States Electoral College Map"
          >
            {/* Inset Borders for Alaska & Hawaii */}
            <rect
              x="25"
              y="402"
              width="192"
              height="145"
              rx="8"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text x="34" y="418" fill="#64748b" fontSize="10" fontWeight="700">
              ALASKA (3 EV)
            </text>
            <rect
              x="222"
              y="450"
              width="115"
              height="97"
              rx="8"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text x="230" y="465" fill="#64748b" fontSize="10" fontWeight="700">
              HAWAII (4 EV)
            </text>

            {/* State Polygons */}
            {statePaths.map((sp) => {
              const st = byName.get(sp.name);
              const style = getCnnFillStyle(st, highlightTossups);
              const isSelected = inspectedStateName === sp.name;
              return (
                <path
                  key={sp.name}
                  d={sp.d}
                  fill={style.fill}
                  fillOpacity={style.fillOpacity}
                  stroke={isSelected ? "#ffffff" : "#090d16"}
                  strokeWidth={isSelected ? 2.2 : 0.9}
                  className="cursor-pointer transition-opacity hover:brightness-125"
                  onMouseEnter={() => setHoveredState(sp.name)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState?.(sp.name)}
                >
                  <title>
                    {sp.name} ({st?.ev || 0} EV) — {st?.winner} +{st?.margin}%
                  </title>
                </path>
              );
            })}

            {/* State Code + EV Labels on Larger States */}
            {stateResults.map((st) => {
              const meta = US_STATES_CATALOG[st.stateName];
              if (!meta || NORTHEAST_CALLOUT_CODES.includes(st.code)) return null;
              let pt;
              if (st.stateName === "Alaska") pt = [115, 480];
              else if (st.stateName === "Hawaii") pt = [280, 505];
              else if (meta.coords) pt = projectConusAlbers(meta.coords[1], meta.coords[0]);
              if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return null;
              return (
                <g
                  key={`lbl-${st.code}`}
                  className="pointer-events-none"
                  transform={`translate(${pt[0].toFixed(1)}, ${pt[1].toFixed(1)})`}
                >
                  <text
                    textAnchor="middle"
                    y="-1"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="800"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {st.code}
                  </text>
                  <text
                    textAnchor="middle"
                    y="9"
                    fill="#e2e8f0"
                    fontSize="8"
                    fontWeight="700"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {st.ev}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Compact East Coast / D.C. Small State EV Callout Bar */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 justify-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1 font-semibold">
              Northeast & D.C.:
            </span>
            {calloutStates.map((st) => {
              const style = getCnnFillStyle(st, highlightTossups);
              const active = inspectedStateName === st.stateName;
              return (
                <button
                  key={st.code}
                  type="button"
                  onMouseEnter={() => setHoveredState(st.stateName)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState?.(st.stateName)}
                  style={{
                    backgroundColor: style.fill,
                    opacity: Math.max(0.45, style.fillOpacity),
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border cursor-pointer transition ${
                    active ? "border-white scale-105" : "border-slate-900"
                  }`}
                >
                  {st.code} {st.ev}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right 4 Cols: CNN Race Call Desk / State Inspector */}
      <div className="xl:col-span-4 bg-[#0b1120] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-4">
        {inspected ? (
          <>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {inspected.region} · Key State Desk
                  </div>
                  <h4 className="text-lg font-extrabold text-white mt-0.5">
                    {inspected.stateName} ({inspected.code})
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-black text-white leading-none">
                    {inspected.ev}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    Electoral Votes
                  </div>
                </div>
              </div>

              {(() => {
                const style = getCnnFillStyle(inspected, highlightTossups);
                return (
                  <div className="flex items-center justify-between gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">
                        {highlightTossups && inspected.cnnTier === "tossup"
                          ? "TOO CLOSE TO CALL"
                          : `CNN CALL: ${inspected.winner.toUpperCase()}`}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${style.badgeClass}`}
                    >
                      {style.tierLabel} +{inspected.margin}%
                    </span>
                  </div>
                );
              })()}

              {/* State Party Vote Breakdown */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Modeled State Vote Share
                </div>
                {(inspected.shares || []).slice(0, 5).map((sh, idx) => (
                  <div key={sh.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sh.color }}
                        />
                        <span>{sh.name}</span>
                        {idx === 0 && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {sh.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${sh.pct}%`,
                          backgroundColor: sh.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">
                Quick Hover or Click Any State
              </div>
              <p className="leading-relaxed">
                Winner-take-all allocation awards all{" "}
                <span className="text-white font-semibold">{inspected.ev} EVs</span>{" "}
                to the plurality leader. Narrow margins (&lt;3%) highlight as{" "}
                <span className="text-amber-300 font-semibold">Toss-Ups</span>{" "}
                in gold when Undecided Mode is enabled.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StateCountyImpressionMap({ stateObj }) {
  const fips = stateObj?.fips || "";
  const [hoveredCountyId, setHoveredCountyId] = useState(null);
  const [selectedCountyId, setSelectedCountyId] = useState(null);

  const countyModel = useMemo(() => {
    if (!fips) return { paths: [], width: 640, height: 380 };
    const feats = US_COUNTIES_GEO.features.filter((f) =>
      String(f.id || "").padStart(5, "0").startsWith(fips)
    );
    if (feats.length === 0) return { paths: [], width: 640, height: 380 };

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    const normLon = (lon) => (fips === "02" && lon > 0 ? lon - 360 : lon);

    const iterateRings = (geom, fn) => {
      if (!geom) return;
      if (geom.type === "Polygon") {
        for (const r of geom.coordinates) fn(r);
      } else if (geom.type === "MultiPolygon") {
        for (const poly of geom.coordinates) {
          for (const r of poly) fn(r);
        }
      }
    };

    for (const feat of feats) {
      iterateRings(feat.geometry, (ring) => {
        for (const [rawLon, lat] of ring) {
          const lon = normLon(rawLon);
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      });
    }

    const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
    const cosLat = Math.max(0.25, Math.cos(midLatRad));
    const spanLon = Math.max(0.05, (maxLon - minLon) * cosLat);
    const spanLat = Math.max(0.05, maxLat - minLat);

    const W = 640;
    const H = 380;
    const pad = 22;
    const scale = Math.min((W - pad * 2) / spanLon, (H - pad * 2) / spanLat);
    const offX = (W - spanLon * scale) / 2;
    const offY = (H - spanLat * scale) / 2;

    const projPt = (rawLon, lat) => {
      const lon = normLon(rawLon);
      return [offX + (lon - minLon) * cosLat * scale, offY + (maxLat - lat) * scale];
    };

    const clusters = stateObj.federalism?.primaryClusters || [];
    const basins = stateObj.federalism?.primaryBasins || [];
    const shares = stateObj.shares || [];
    const winParty = shares[0] || {
      name: stateObj.winner,
      color: stateObj.winnerColor,
      pct: stateObj.winnerPct,
    };
    const runnerParty = shares[1] || {
      name: stateObj.runnerUp,
      color: "#94a3b8",
      pct: stateObj.runnerUpPct,
    };
    const winIsMetroLean =
      winParty.name === "Democratic" ||
      winParty.name === "Progressive Labor" ||
      winParty.name === "Centrist Technocrats";

    const paths = feats.map((feat) => {
      let d = "";
      let sumLon = 0;
      let sumLat = 0;
      let cnt = 0;
      iterateRings(feat.geometry, (ring) => {
        for (let i = 0; i < ring.length; i++) {
          const [rawLon, lat] = ring[i];
          sumLon += normLon(rawLon);
          sumLat += lat;
          cnt++;
          const [px, py] = projPt(rawLon, lat);
          d += `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
        }
        d += "Z";
      });

      const cLon = cnt ? sumLon / cnt : (minLon + maxLon) / 2;
      const cLat = cnt ? sumLat / cnt : (minLat + maxLat) / 2;

      let metroPull = 0;
      let metroName = "";
      let bestMetroDist = Infinity;
      for (const cl of clusters) {
        if (!Array.isArray(cl.coords)) continue;
        const dist = Math.hypot(cLon - normLon(cl.coords[0]), cLat - cl.coords[1]);
        const w = Math.exp(-(dist * dist) / 0.85);
        metroPull += w * (cl.type === "research" || cl.type === "finance" || cl.type === "tech" ? 1.0 : 0.65);
        if (dist < bestMetroDist) {
          bestMetroDist = dist;
          metroName = cl.name;
        }
      }

      let resourcePull = 0;
      let basinName = "";
      let bestBasinDist = Infinity;
      for (const b of basins) {
        if (!Array.isArray(b.coords)) continue;
        const dist = Math.hypot(cLon - normLon(b.coords[0]), cLat - b.coords[1]);
        const w = Math.exp(-(dist * dist) / 1.15);
        const sign = b.type === "port" ? -0.4 : 1.0;
        resourcePull += w * sign;
        if (dist < bestBasinDist) {
          bestBasinDist = dist;
          basinName = b.name;
        }
      }

      const idStr = String(feat.id || "00000").padStart(5, "0");
      const fipsNum = parseInt(idStr.slice(2), 10) || 1;
      const jitter = (((fipsNum % 19) - 9) / 9) * 4.5;
      const metroEdge = metroPull * 18.0 - resourcePull * 12.0 + jitter;
      const orientedShift = winIsMetroLean ? metroEdge : -metroEdge;

      const winShare = Math.max(12, Math.min(88, (winParty.pct || 50) + orientedShift));
      const runShare = Math.max(8, Math.min(85, 100 - winShare - Math.max(0, 100 - ((winParty.pct || 50) + (runnerParty.pct || 45)))));
      const countyWinner = winShare >= runShare ? winParty : runnerParty;
      const countyRunner = winShare >= runShare ? runnerParty : winParty;
      const margin = Number(Math.abs(winShare - runShare).toFixed(1));
      const fillOpacity = margin >= 18 ? 0.92 : margin >= 9 ? 0.68 : margin >= 3 ? 0.46 : 0.28;

      let economicCharacter = "Mixed Suburban & Regional Town";
      if (metroPull >= 0.45) {
        economicCharacter = `Services & Knowledge Corridor (${metroName || "Metro"})`;
      } else if (resourcePull >= 0.35) {
        economicCharacter = `Natural Resource / Ag Basin (${basinName || "Extraction"})`;
      }

      return {
        id: idStr,
        name: feat.properties?.name || `County ${idStr}`,
        d,
        fill: countyWinner.color || "#64748b",
        fillOpacity,
        winner: countyWinner.name,
        winnerPct: Number(Math.max(winShare, runShare).toFixed(1)),
        runnerUp: countyRunner.name,
        runnerUpPct: Number(Math.min(winShare, runShare).toFixed(1)),
        margin,
        economicCharacter,
      };
    });

    return { paths, width: W, height: H };
  }, [fips, stateObj]);

  const activeCounty =
    countyModel.paths.find((c) => c.id === (hoveredCountyId || selectedCountyId)) ||
    countyModel.paths[0] ||
    null;

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          County-Level Electoral &amp; Economic Impression ({countyModel.paths.length} Counties)
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Synthesized from metro clusters &amp; resource basins
        </span>
      </div>

      {countyModel.paths.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-7 bg-[#070b14] border border-slate-800/80 rounded-lg p-2">
            <svg
              viewBox={`0 0 ${countyModel.width} ${countyModel.height}`}
              className="w-full h-auto max-h-72 select-none"
              role="img"
              aria-label={`County-level political map of ${stateObj?.stateName}`}
            >
              {countyModel.paths.map((cp) => {
                const isActive = activeCounty?.id === cp.id;
                return (
                  <path
                    key={cp.id}
                    d={cp.d}
                    fill={cp.fill}
                    fillOpacity={cp.fillOpacity}
                    stroke={isActive ? "#ffffff" : "#090d16"}
                    strokeWidth={isActive ? 1.5 : 0.45}
                    className="cursor-pointer transition-opacity hover:brightness-125"
                    onMouseEnter={() => setHoveredCountyId(cp.id)}
                    onMouseLeave={() => setHoveredCountyId(null)}
                    onClick={() => setSelectedCountyId(cp.id)}
                  >
                    <title>
                      {cp.name}: {cp.winner} {cp.winnerPct}% vs {cp.runnerUp} {cp.runnerUpPct}% ({cp.economicCharacter})
                    </title>
                  </path>
                );
              })}
            </svg>
          </div>

          <div className="md:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5 text-xs">
            {activeCounty && (
              <>
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      FIPS {activeCounty.id} · Hover or Click County
                    </div>
                    <div className="text-sm font-bold text-white">
                      {activeCounty.name} {stateObj?.stateName === "Louisiana" ? "Parish" : stateObj?.stateName === "District of Columbia" ? "" : "County"}
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: activeCounty.fill }}
                  >
                    +{activeCounty.margin}%
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1.5">
                  {activeCounty.economicCharacter}
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{activeCounty.winner}</span>
                    <span className="font-mono">{activeCounty.winnerPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{activeCounty.runnerUp}</span>
                    <span className="font-mono">{activeCounty.runnerUpPct}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 p-3">
          No county boundary geometries found for FIPS {fips}.
        </div>
      )}
    </div>
  );
}

function buildPartyDraft(party = null) {
  if (!party) {
    return {
      isNew: true,
      originalName: "",
      name: "",
      color: "#8b5cf6",
      politicalAlignment: "Populist Center",
      federalismPolicy: "moderate",
      platformSummary:
        "Custom political movement with tailored tax bell-curve, federalism doctrine, governance funding, and social charter priorities.",
      baseTaxLevel: 0.24,
      taxDistributionMode: 0.54,
      workerShareOfGdp: 0.55,
      budgetAsPercentOfGdp: 0.215,
      deficitTargetAsPercentOfGdp: -0.025,
      currentSupport: 0.14,
      defaultPolicies: cloneDefaultPolicies("Democratic"),
      socialPolicies: cloneDefaultSocialPolicies("Democratic"),
      makeRulingParty: false,
      syncRulingNation: true,
    };
  }
  return {
    isNew: false,
    originalName: party.name,
    name: party.name,
    color: party.color || "#3b82f6",
    politicalAlignment: party.politicalAlignment || "Center",
    federalismPolicy: party.federalismPolicy || "moderate",
    platformSummary: party.platformSummary || "",
    baseTaxLevel: Number(party.baseTaxLevel ?? 0.24),
    taxDistributionMode: Number(party.taxDistributionMode ?? 0.55),
    workerShareOfGdp: Number(party.workerShareOfGdp ?? 0.55),
    budgetAsPercentOfGdp: Number(party.budgetAsPercentOfGdp ?? 0.215),
    deficitTargetAsPercentOfGdp: Number(party.deficitTargetAsPercentOfGdp ?? -0.025),
    currentSupport: Number(party.currentSupport ?? 0.12),
    defaultPolicies: party.defaultPolicies
      ? structuredClone(party.defaultPolicies)
      : cloneDefaultPolicies(party.name),
    socialPolicies: party.socialPolicies
      ? structuredClone(party.socialPolicies)
      : cloneDefaultSocialPolicies(party.name),
    makeRulingParty: false,
    syncRulingNation: true,
  };
}

export default function PoliticalPartiesAndElectionsView({
  state,
  role = "director",
  isReadOnly = false,
  initialSubView = "elections",
  initialSelectedState = null,
  onUpsertParty,
  onDeleteParty,
  onRunElection,
  onSetRulingParty,
}) {
  const canEdit = role === "director" && !isReadOnly;
  const parties = useMemo(
    () =>
      Array.isArray(state?.politicalParties) && state.politicalParties.length > 0
        ? state.politicalParties
        : DEFAULT_POLITICAL_PARTIES,
    [state?.politicalParties]
  );

  const usa = state?.nations?.[0] || {};
  const rulingPartyName = usa.rulingParty || "Democratic";
  const forecast = state?.electionForecast || {};
  const electionHistory = Array.isArray(usa.electionHistory) ? usa.electionHistory : [];
  const serverSchedule = state?.electionSchedule || {
    enabled: true,
    nextElectionDate: "2028-11-07",
    cycleYears: 4,
    autoInaugurate: true,
    midtermEnabled: true,
    nextMidtermDate: "2026-11-03",
  };
  const currentSimDate = state?.timeManager?.crisisDate || "2025-01-01";

  // 3 Pages: "elections" (Default CNN Map & Forecast) | "schedule" (Call & Schedule Elections) | "studio" (Party Studio)
  const [activeSubView, setActiveSubView] = useState(initialSubView || "elections");
  const [selectedPartyName, setSelectedPartyName] = useState(rulingPartyName);
  const [draft, setDraft] = useState(() =>
    buildPartyDraft(parties.find((p) => p.name === rulingPartyName) || parties[0])
  );
  const [busyAction, setBusyAction] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  // null = National U.S. View & National Polls; string = clicked state's County Map, Federalism & State Polls
  const [selectedMapState, setSelectedMapState] = useState(initialSelectedState || null);
  const [highlightTossups, setHighlightTossups] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [selectedHistMapState, setSelectedHistMapState] = useState("Pennsylvania");
  const [demoCategoryFilter, setDemoCategoryFilter] = useState("all");
  const liveSaveTimerRef = useRef(null);

  const [scheduleDraft, setScheduleDraft] = useState(serverSchedule);
  const [resetCycleFromToday, setResetCycleFromToday] = useState(true);

  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  useEffect(() => {
    setSelectedMapState(initialSelectedState || null);
  }, [initialSelectedState]);

  useEffect(() => {
    return () => {
      if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setScheduleDraft({
      enabled: serverSchedule.enabled !== undefined ? Boolean(serverSchedule.enabled) : true,
      nextElectionDate: serverSchedule.nextElectionDate || "2028-11-07",
      cycleYears: Number(serverSchedule.cycleYears || 4),
      autoInaugurate:
        serverSchedule.autoInaugurate !== undefined
          ? Boolean(serverSchedule.autoInaugurate)
          : true,
      midtermEnabled:
        serverSchedule.midtermEnabled !== undefined
          ? Boolean(serverSchedule.midtermEnabled)
          : true,
      nextMidtermDate: serverSchedule.nextMidtermDate || "2026-11-03",
    });
  }, [
    serverSchedule.enabled,
    serverSchedule.nextElectionDate,
    serverSchedule.cycleYears,
    serverSchedule.autoInaugurate,
    serverSchedule.midtermEnabled,
    serverSchedule.nextMidtermDate,
  ]);

  // Only resync the editor draft when the user picks a different party roster item,
  // preventing periodic SSE/poll updates on `state.politicalParties` from overwriting edits.
  useEffect(() => {
    if (selectedPartyName === "__NEW__") return;
    const matched = parties.find((p) => p.name === selectedPartyName) || parties[0];
    if (matched) {
      setDraft(buildPartyDraft(matched));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartyName]);

  const buildPartyPayload = (d) => ({
    name: (d.name || "").trim(),
    color: d.color,
    politicalAlignment: d.politicalAlignment,
    federalismPolicy: d.federalismPolicy || "moderate",
    platformSummary: d.platformSummary,
    baseTaxLevel: d.baseTaxLevel,
    taxDistributionMode: d.taxDistributionMode,
    workerShareOfGdp: d.workerShareOfGdp,
    budgetAsPercentOfGdp: d.budgetAsPercentOfGdp,
    deficitTargetAsPercentOfGdp: d.deficitTargetAsPercentOfGdp,
    currentSupport: d.currentSupport,
    defaultPolicies: d.defaultPolicies,
    socialPolicies: d.socialPolicies,
    makeRulingParty: d.makeRulingParty,
    syncRulingNation: true,
  });

  const persistExistingDraft = (nextDraft, immediate = false) => {
    setDraft(nextDraft);
    if (!canEdit || !onUpsertParty || nextDraft.isNew || !nextDraft.name?.trim()) return;
    if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    const runSave = () => {
      onUpsertParty(buildPartyPayload(nextDraft), nextDraft.originalName);
    };
    if (immediate) {
      runSave();
    } else {
      liveSaveTimerRef.current = setTimeout(runSave, 220);
    }
  };

  const previewTaxRates = useMemo(
    () => computeTaxRatesFromPosture(draft.baseTaxLevel, draft.taxDistributionMode),
    [draft.baseTaxLevel, draft.taxDistributionMode]
  );

  const handleSelectParty = (party) => {
    if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    setSelectedPartyName(party.name);
    setDraft(buildPartyDraft(party));
  };

  const handleStartNewParty = () => {
    if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    setSelectedPartyName("__NEW__");
    setDraft(buildPartyDraft(null));
    setActiveSubView("studio");
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!canEdit || !onUpsertParty) return;
    if (!draft.name.trim()) return;
    if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    setBusyAction(true);
    try {
      const payload = buildPartyPayload(draft);
      await onUpsertParty(payload, draft.isNew ? null : draft.originalName);
      setSelectedPartyName(payload.name);
      setDraft((prev) => ({
        ...prev,
        isNew: false,
        originalName: payload.name,
        makeRulingParty: false,
      }));
    } finally {
      setBusyAction(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!canEdit || !onDeleteParty || draft.isNew) return;
    if (draft.originalName === rulingPartyName) return;
    if (liveSaveTimerRef.current) clearTimeout(liveSaveTimerRef.current);
    setBusyAction(true);
    try {
      await onDeleteParty(draft.originalName);
      const fallback = parties.find((p) => p.name === rulingPartyName) || parties[0];
      setSelectedPartyName(fallback?.name || rulingPartyName);
      if (fallback) setDraft(buildPartyDraft(fallback));
    } finally {
      setBusyAction(false);
    }
  };

  const handleTriggerElection = async (inaugurateWinner, electionType = "Snap Election") => {
    if (!canEdit || !onRunElection) return;
    setBusyAction(true);
    try {
      await onRunElection({
        inaugurateWinner,
        electionType,
        resetCycleFromToday,
      });
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!canEdit || !onRunElection) return;
    setBusyAction(true);
    try {
      await onRunElection({
        scheduleOnly: true,
        schedule: scheduleDraft,
      });
    } finally {
      setBusyAction(false);
    }
  };

  const evStandings = forecast.electoralStandings || [];
  const nationalPolls = forecast.nationalPolls || [];
  const battlegrounds = forecast.battlegrounds || [];
  const stateResults = forecast.stateResults || [];
  const cohortVotes = forecast.cohortVotes || {};

  // CNN Head-to-Head Contender EVs (excluding Toss-Ups when Undecided mode is active)
  const cnnTally = useMemo(() => {
    const evMap = {};
    for (const st of stateResults) {
      if (highlightTossups && st.cnnTier === "tossup") continue;
      evMap[st.winner] = (evMap[st.winner] || 0) + st.ev;
    }
    const tossupEv = highlightTossups
      ? stateResults
          .filter((s) => s.cnnTier === "tossup")
          .reduce((acc, s) => acc + s.ev, 0)
      : 0;

    const topTwo = evStandings.slice(0, 2);
    const left = topTwo[0] || { name: "Democratic", color: "#3b82f6", ev: 0, pollPct: 50 };
    const right = topTwo[1] || { name: "Republican", color: "#ef4444", ev: 0, pollPct: 50 };
    const others = evStandings.slice(2).filter((p) => (evMap[p.name] || 0) > 0);
    return {
      left: { ...left, calledEv: evMap[left.name] || 0 },
      right: { ...right, calledEv: evMap[right.name] || 0 },
      others: others.map((p) => ({ ...p, calledEv: evMap[p.name] || 0 })),
      tossupEv,
    };
  }, [stateResults, evStandings, highlightTossups]);

  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    return stateResults.filter((st) => {
      if (stateFilter === "battleground" && !st.isBattleground) return false;
      if (stateFilter === "tossup" && st.cnnTier !== "tossup") return false;
      if (
        stateFilter !== "all" &&
        stateFilter !== "battleground" &&
        stateFilter !== "tossup" &&
        st.winner !== stateFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        st.stateName.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q) ||
        st.winner.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q)
      );
    });
  }, [stateResults, stateSearch, stateFilter]);

  const daysUntilScheduled = daysBetweenYmd(scheduleDraft.nextElectionDate, currentSimDate);
  const [schedY, schedM, schedD] = (scheduleDraft.nextElectionDate || "2028-11-07")
    .split("-")
    .map(Number);

  const updateScheduleYmdPart = (part, numVal) => {
    const curY = schedY || 2028;
    const curM = schedM || 11;
    const curD = schedD || 7;
    const nextY = part === "y" ? Math.max(1, Math.min(3000, numVal || 2028)) : curY;
    const nextM = part === "m" ? Math.max(1, Math.min(12, numVal || 1)) : curM;
    const nextD = part === "d" ? Math.max(1, Math.min(31, numVal || 1)) : curD;
    const ymd = `${String(nextY).padStart(4, "0")}-${String(nextM).padStart(2, "0")}-${String(nextD).padStart(2, "0")}`;
    setScheduleDraft((prev) => ({ ...prev, nextElectionDate: ymd }));
  };

  const fatigueVal = Number(forecast.governmentFatigue ?? usa.governmentFatigue ?? 0);
  const fatigueRate = Number(forecast.fatigueRatePerQuarter ?? 0);
  const fatigueStatus = forecast.fatigueStatusLabel || "Satisfied";
  const fatigueReason =
    forecast.fatigueTrajectoryReason ||
    "Resets to 0% whenever a new party enters office and climbs slowly under strong reform or rapidly during mismanaged crises.";
  const fatigueFactors = Array.isArray(forecast.fatigueFactors) ? forecast.fatigueFactors : [];
  const congress = forecast.congress || {
    house: { totalSeats: 435, majorityThreshold: 218, standings: [], leaderParty: rulingPartyName, leaderColor: "#3b82f6", isMajority: true },
    senate: { totalSeats: 100, majorityThreshold: 51, standings: [], leaderParty: rulingPartyName, leaderColor: "#3b82f6", isMajority: true },
    legislativeControlLabel: "Unified Government",
    midtermFatiguePenaltyPts: 0,
    nextMidtermDate: scheduleDraft.nextMidtermDate || "2026-11-03",
  };

  const activeStateObj = useMemo(() => {
    if (!selectedMapState) return null;
    return stateResults.find((s) => s.stateName === selectedMapState) || null;
  }, [selectedMapState, stateResults]);

  const activeExitPolls = activeStateObj?.approvalBreakdown || forecast.approvalBreakdown || {};
  const activeDemoPolls = activeStateObj?.demographicPolls || forecast.demographicPolls || {};

  const selectedHistRecord = useMemo(() => {
    if (electionHistory.length === 0) return null;
    if (selectedHistoryId) {
      const found = electionHistory.find((r) => r.id === selectedHistoryId);
      if (found) return found;
    }
    return electionHistory[0];
  }, [electionHistory, selectedHistoryId]);

  const histSummaryStandings = useMemo(() => {
    if (!selectedHistRecord) return [];
    if (Array.isArray(selectedHistRecord.electoralStandings) && selectedHistRecord.electoralStandings.length > 0) {
      return selectedHistRecord.electoralStandings;
    }
    const tally = {};
    for (const s of selectedHistRecord.stateResults || []) {
      tally[s.winner] = {
        name: s.winner,
        color: s.winnerColor || "#64748b",
        ev: (tally[s.winner]?.ev || 0) + (s.ev || 0),
      };
    }
    return Object.values(tally).sort((a, b) => b.ev - a.ev);
  }, [selectedHistRecord]);

  return (
    <div className="space-y-6">
      {/* Top Banner & 3-Page Sub-View Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Flag className="w-4 h-4" />
            Political System, Federalism, Congress &amp; Electoral Simulator
          </div>
          <h2 className="text-xl font-bold text-white flex flex-wrap items-center gap-2.5">
            <span>Road to 270, Federalism &amp; Midterm Politics</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              Incumbent: {rulingPartyName}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setActiveSubView("elections")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubView === "elections"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Election Forecast &amp; CNN Map
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView("schedule")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubView === "schedule"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Call &amp; Schedule Elections
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView("studio")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubView === "studio"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Party Studio ({parties.length})
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleStartNewParty}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Party
            </button>
          )}
        </div>
      </div>

      {/* PAGE 1: CNN ELECTION NIGHT MAP & FORECAST */}
      {activeSubView === "elections" && (
        <div className="space-y-6">
          {/* CNN 270 TO WIN Head-to-Head Contender Bar */}
          <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono text-white font-semibold">
                  Approval: {Number(forecast.incumbentApproval ?? 50).toFixed(1)}%
                </span>
                <span
                  title={fatigueReason}
                  className={`px-2.5 py-1 rounded-full border font-mono font-semibold flex items-center gap-1 ${
                    fatigueVal >= 55
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                      : fatigueVal >= 25
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  Gov Fatigue: {fatigueVal.toFixed(1)}% (+{fatigueRate.toFixed(1)}/qtr · {fatigueStatus})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 font-mono text-sky-300 flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  {forecast.speechFreedomLabel ||
                    `Speech Sensitivity: ${forecast.speechSensitivityMultiplier ?? 1.15}x`}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full border font-mono ${
                    Number(forecast.corruptionIndex ?? 20) >= 40
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                      : "bg-slate-900 border-slate-700 text-slate-300"
                  }`}
                >
                  Corruption: {forecast.corruptionIndex ?? 20}/100
                </span>
              </div>

              <button
                type="button"
                onClick={() => setHighlightTossups((v) => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  highlightTossups
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    : "bg-slate-900 text-slate-300 border-slate-700"
                }`}
              >
                {highlightTossups
                  ? "Showing Undecided Toss-Ups (<3%)"
                  : "Projecting All 538 Electoral Votes"}
              </button>
            </div>

            {/* CNN Top Contender Head-to-Head Display */}
            <div className="grid grid-cols-3 items-end gap-2">
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {cnnTally.left.name === rulingPartyName ? "Incumbent Leader" : "Leading Contender"}
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="text-3xl sm:text-4xl font-black font-mono"
                    style={{ color: cnnTally.left.color }}
                  >
                    {cnnTally.left.calledEv}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {cnnTally.left.name}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {cnnTally.left.pollPct}% National Vote
                </div>
              </div>

              <div className="text-center pb-1">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-black tracking-widest text-white">
                  270 TO WIN
                </div>
                {highlightTossups && cnnTally.tossupEv > 0 && (
                  <div className="text-[11px] font-mono font-bold text-amber-300 mt-1">
                    {cnnTally.tossupEv} EV Toss-Up
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {cnnTally.right.name === rulingPartyName ? "Incumbent" : "Primary Challenger"}
                </div>
                <div className="flex items-baseline justify-end gap-2.5">
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {cnnTally.right.name}
                  </span>
                  <span
                    className="text-3xl sm:text-4xl font-black font-mono"
                    style={{ color: cnnTally.right.color }}
                  >
                    {cnnTally.right.calledEv}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {cnnTally.right.pollPct}% National Vote
                </div>
              </div>
            </div>

            {/* Tug-of-War 538 Bar (Left grows right, Toss-Up center, Right grows left) */}
            <div className="relative">
              <div className="w-full h-7 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex">
                <div
                  style={{
                    width: `${(cnnTally.left.calledEv / 538) * 100}%`,
                    backgroundColor: cnnTally.left.color,
                  }}
                  className="h-full transition-all flex items-center justify-start px-2 text-[11px] font-mono font-black text-white"
                >
                  {cnnTally.left.calledEv >= 25 ? cnnTally.left.calledEv : ""}
                </div>
                {cnnTally.others.map((o) => (
                  <div
                    key={o.name}
                    style={{
                      width: `${(o.calledEv / 538) * 100}%`,
                      backgroundColor: o.color,
                    }}
                    className="h-full transition-all"
                    title={`${o.name}: ${o.calledEv} EV`}
                  />
                ))}
                <div
                  style={{ width: `${(cnnTally.tossupEv / 538) * 100}%` }}
                  className="h-full bg-amber-500/35 border-x border-amber-400/30 flex items-center justify-center text-[10px] font-mono font-bold text-amber-200 transition-all"
                >
                  {cnnTally.tossupEv >= 24 ? `${cnnTally.tossupEv}` : ""}
                </div>
                <div
                  style={{
                    width: `${(cnnTally.right.calledEv / 538) * 100}%`,
                    backgroundColor: cnnTally.right.color,
                  }}
                  className="h-full transition-all flex items-center justify-end px-2 text-[11px] font-mono font-black text-white ml-auto"
                >
                  {cnnTally.right.calledEv >= 25 ? cnnTally.right.calledEv : ""}
                </div>
              </div>
              {/* Center 270 Pin */}
              <div
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white shadow"
                aria-hidden="true"
              />
            </div>

            {cnnTally.others.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                <span className="text-slate-500">Other Electoral Vote Winners:</span>
                {cnnTally.others.map((o) => (
                  <span
                    key={o.name}
                    className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-200 font-mono flex items-center gap-1.5"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: o.color }}
                    />
                    {o.name}: {o.calledEv} EV ({o.pollPct}%)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Map Scope Banner + Interactive CNN Magic Wall Choropleth Map */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                {activeStateObj ? (
                  <span>
                    Inspecting{" "}
                    <span className="font-bold text-white">
                      {activeStateObj.stateName} ({activeStateObj.code})
                    </span>{" "}
                    — County Map, State Federalism &amp; State-Level Exit/Demographic Polls loaded below.
                  </span>
                ) : (
                  <span>
                    <span className="font-bold text-white">National U.S. View</span> — Click any state on the CNN Magic Wall map (or table row) to inspect its County Impression, Federalism Adherence &amp; State Polls.
                  </span>
                )}
              </div>
              {activeStateObj && (
                <button
                  type="button"
                  onClick={() => setSelectedMapState(null)}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to National Map &amp; Polls
                </button>
              )}
            </div>

            <CnnElectoralWallMap
              stateResults={stateResults}
              selectedStateName={selectedMapState}
              onSelectState={(stName) =>
                setSelectedMapState((prev) => (prev === stName ? null : stName))
              }
              highlightTossups={highlightTossups}
            />
          </div>

          {/* Conditional State Federalism & County Impression Drill-Down */}
          {activeStateObj && (
            <div className="bg-slate-900/80 border border-cyan-500/35 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    State Federalism, Resource &amp; Knowledge Economy — {activeStateObj.stateName} ({activeStateObj.code})
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    County political alignment driven by state metro knowledge clusters vs. resource basins alongside federal-state regulatory adherence.
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    (activeStateObj.federalism?.federalAdherencePct ?? 70) < 50
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : (activeStateObj.federalism?.federalAdherencePct ?? 70) < 75
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {activeStateObj.federalism?.federalStateTensionLabel} (
                  {activeStateObj.federalism?.federalAdherencePct}% Adherence)
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-7">
                  <StateCountyImpressionMap stateObj={activeStateObj} />
                </div>

                <div className="xl:col-span-5 bg-slate-950/75 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 text-xs">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-[10px] text-slate-400">Governor Control</div>
                        <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: activeStateObj.federalism?.governorColor }}
                          />
                          {activeStateObj.federalism?.governorParty}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                        <div className="text-[10px] text-slate-400">State Legislature</div>
                        <div className="font-bold text-slate-200 mt-0.5 truncate">
                          {activeStateObj.federalism?.stateLegislatureParty}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">Federal Policy Adherence</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {activeStateObj.federalism?.federalAdherencePct}% ·{" "}
                          {activeStateObj.federalism?.federalismLabel}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{
                            width: `${activeStateObj.federalism?.federalAdherencePct ?? 68}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Natural Resources</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {activeStateObj.federalism?.resourceLeveragePct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{
                              width: `${activeStateObj.federalism?.resourceLeveragePct ?? 60}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Services &amp; STEM</span>
                          <span className="font-mono text-emerald-300 font-bold">
                            {activeStateObj.federalism?.servicesLeveragePct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{
                              width: `${activeStateObj.federalism?.servicesLeveragePct ?? 65}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-900/70 rounded-lg px-2.5 py-1.5 flex justify-between">
                        <span className="text-slate-400">State GDP Growth</span>
                        <span className="font-mono font-bold text-white">
                          {activeStateObj.federalism?.stateGdpGrowthPct}%
                        </span>
                      </div>
                      <div className="bg-slate-900/70 rounded-lg px-2.5 py-1.5 flex justify-between">
                        <span className="text-slate-400">State U3 Jobless</span>
                        <span className="font-mono font-bold text-white">
                          {activeStateObj.federalism?.stateUnemploymentPct}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {(activeStateObj.federalism?.dominantSectors || []).map((sec) => (
                        <span
                          key={sec}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-200"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeStateObj.stateName !== "District of Columbia" && (
                    <div className="border-t border-slate-800 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-400">Congressional Delegation:</span>
                      <span className="font-mono text-white font-semibold">
                        House ({activeStateObj.houseSeats}):{" "}
                        {Object.entries(activeStateObj.houseSeatSplit || {})
                          .filter(([, cnt]) => cnt > 0)
                          .map(([p, cnt]) => `${p.split(" ")[0]} ${cnt}`)
                          .join(" · ")}{" "}
                        | Senate (2):{" "}
                        {Object.entries(activeStateObj.senateSeatSplit || {})
                          .filter(([, cnt]) => cnt > 0)
                          .map(([p, cnt]) => `${p.split(" ")[0]} ${cnt}`)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED WIDGET 1: Full-Sized Government Fatigue Meter & Factor Breakdown */}
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4" />
                  Government Fatigue &amp; Incumbent Weariness Meter
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{fatigueReason}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className={`px-3 py-1 rounded-full border font-bold ${
                    fatigueVal >= 55
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                      : fatigueVal >= 25
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  {fatigueStatus} · {fatigueVal.toFixed(1)}%
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                  +{fatigueRate.toFixed(2)}% / qtr
                </span>
              </div>
            </div>

            {/* Full-Size Segmented Progress Bar */}
            <div className="space-y-1.5">
              <div className="relative w-full h-5 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-l-xl ${
                    fatigueVal >= 65
                      ? "bg-gradient-to-r from-amber-500 to-rose-600"
                      : fatigueVal >= 32
                      ? "bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-400"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, fatigueVal))}%` }}
                />
                {/* 32% Pivot Marker */}
                <div
                  className="absolute top-0 bottom-0 left-[32%] w-0.5 bg-white/60"
                  title="32% Opposition Surge Threshold"
                />
                {/* 65% Exhaustion Marker */}
                <div
                  className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-rose-300/60"
                  title="65% Severe Voter Exhaustion"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% Fresh Mandate</span>
                <span>32% Opposition Surge Threshold</span>
                <span>65% Severe Exhaustion</span>
                <span>100%</span>
              </div>
            </div>

            {fatigueFactors.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {fatigueFactors.map((fac) => (
                  <div
                    key={fac.id}
                    className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white truncate">{fac.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                          fac.impactDirection === "slowing"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : fac.impactDirection === "accelerating"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {fac.valueText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{fac.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DEDICATED WIDGET 2 & 3 SIDE-BY-SIDE: Approval & CNN Exit Polls + U.S. Congress & Midterms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Presidential Approval & Dynamic CNN Exit Poll Drivers (National OR Clicked State) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4" />
                    {activeStateObj
                      ? `${activeStateObj.stateName} Approval & CNN Exit Polls`
                      : "Presidential Approval & Dynamic CNN Exit Polls"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time voter mood questions &amp; pocketbook sentiment updated from macroeconomic conditions.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-950 border border-slate-700 text-white">
                  Net: {(activeExitPolls.netApproval ?? 0) >= 0 ? "+" : ""}
                  {activeExitPolls.netApproval ?? 0}%
                </span>
              </div>

              {/* Approve / Disapprove Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-300">
                    Approve: {activeExitPolls.approvePct ?? forecast.incumbentApproval ?? 50}%
                  </span>
                  <span className="text-rose-300">
                    Disapprove: {activeExitPolls.disapprovePct ?? 50}%
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${activeExitPolls.approvePct ?? 50}%` }}
                  />
                  <div
                    className="h-full bg-rose-500/80 ml-auto transition-all"
                    style={{ width: `${activeExitPolls.disapprovePct ?? 50}%` }}
                  />
                </div>
              </div>

              {/* CNN Exit Poll Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="font-semibold text-slate-200">
                    Is the {activeStateObj ? "State" : "Country"} Going in the Right Direction?
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-emerald-300">
                      Right Direction: {activeExitPolls.rightDirectionPct ?? 45}%
                    </span>
                    <span className="text-rose-300">
                      Wrong Track: {activeExitPolls.wrongTrackPct ?? 55}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${activeExitPolls.rightDirectionPct ?? 45}%` }}
                    />
                    <div
                      className="h-full bg-rose-500/85"
                      style={{ width: `${activeExitPolls.wrongTrackPct ?? 55}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="font-semibold text-slate-200">
                    Financial Situation vs. Previous Election
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-emerald-300">
                      Better: {activeExitPolls.financialSituation?.betterOffPct ?? 34}%
                    </span>
                    <span className="text-slate-300">
                      Same: {activeExitPolls.financialSituation?.samePct ?? 33}%
                    </span>
                    <span className="text-rose-300">
                      Worse: {activeExitPolls.financialSituation?.worseOffPct ?? 33}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${activeExitPolls.financialSituation?.betterOffPct ?? 34}%`,
                      }}
                    />
                    <div
                      className="h-full bg-slate-500"
                      style={{
                        width: `${activeExitPolls.financialSituation?.samePct ?? 33}%`,
                      }}
                    />
                    <div
                      className="h-full bg-rose-500/85"
                      style={{
                        width: `${activeExitPolls.financialSituation?.worseOffPct ?? 33}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Top Issues & Trusted Party + Approval Factor Drivers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Most Important Issue &amp; Leader
                  </div>
                  {(activeExitPolls.topIssues || []).slice(0, 4).map((iss) => (
                    <div key={iss.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-200 truncate">{iss.label}</span>
                      <span className="flex items-center gap-1.5 shrink-0 font-mono">
                        <span className="text-slate-400">{iss.pct}%</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: iss.leaderColor }}
                          title={`Trusted Party: ${iss.leaderParty}`}
                        />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Key Approval Score Drivers
                  </div>
                  {(activeExitPolls.drivers || []).map((drv) => (
                    <div
                      key={drv.label}
                      className="flex items-center justify-between gap-2 text-[11px]"
                      title={drv.detail}
                    >
                      <span className="text-slate-300 truncate">{drv.label}</span>
                      <span
                        className={`font-mono font-bold shrink-0 ${
                          drv.impactPts >= 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {drv.impactPts >= 0 ? "+" : ""}
                        {drv.impactPts} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* U.S. Congress (435 House + 100 Senate) & Midterms Projection */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4" />
                      U.S. Congress &amp; Midterm Forecast
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {congress.legislativeControlLabel}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950 border border-slate-700 text-slate-300">
                    Midterm Wave: {congress.midtermFatiguePenaltyPts >= 0 ? "+" : ""}
                    {congress.midtermFatiguePenaltyPts} pts
                  </span>
                </div>

                {/* House of Representatives (435) */}
                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      U.S. House (435 Seats · 218 Majority)
                    </span>
                    <span
                      className="font-mono font-bold text-[11px]"
                      style={{ color: congress.house?.leaderColor }}
                    >
                      {congress.house?.leaderParty} ({congress.house?.standings?.[0]?.seats || 0})
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex relative">
                    {(congress.house?.standings || [])
                      .filter((s) => s.seats > 0)
                      .map((s) => (
                        <div
                          key={s.name}
                          style={{
                            width: `${(s.seats / 435) * 100}%`,
                            backgroundColor: s.color,
                          }}
                          title={`${s.name}: ${s.seats} House seats`}
                          className="h-full flex items-center justify-center text-[9px] font-mono font-bold text-white"
                        >
                          {s.seats >= 40 ? s.seats : ""}
                        </div>
                      ))}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/80" />
                  </div>
                  <div className="flex flex-wrap gap-2.5 text-[10px] font-mono text-slate-300">
                    {(congress.house?.standings || [])
                      .filter((s) => s.seats > 0)
                      .map((s) => (
                        <span key={s.name} className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}: {s.seats}
                        </span>
                      ))}
                  </div>
                </div>

                {/* U.S. Senate (100) */}
                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      U.S. Senate (100 Seats · 51 Majority)
                    </span>
                    <span
                      className="font-mono font-bold text-[11px]"
                      style={{ color: congress.senate?.leaderColor }}
                    >
                      {congress.senate?.leaderParty} ({congress.senate?.standings?.[0]?.seats || 0})
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex relative">
                    {(congress.senate?.standings || [])
                      .filter((s) => s.seats > 0)
                      .map((s) => (
                        <div
                          key={s.name}
                          style={{
                            width: `${(s.seats / 100) * 100}%`,
                            backgroundColor: s.color,
                          }}
                          title={`${s.name}: ${s.seats} Senate seats`}
                          className="h-full flex items-center justify-center text-[9px] font-mono font-bold text-white"
                        >
                          {s.seats >= 12 ? s.seats : ""}
                        </div>
                      ))}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/80" />
                  </div>
                  <div className="flex flex-wrap gap-2.5 text-[10px] font-mono text-slate-300">
                    {(congress.senate?.standings || [])
                      .filter((s) => s.seats > 0)
                      .map((s) => (
                        <span key={s.name} className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}: {s.seats}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                <span>
                  Next Scheduled Midterm:{" "}
                  <span className="font-mono text-white font-semibold">
                    {congress.nextMidtermDate}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubView("schedule")}
                  className="text-violet-300 hover:text-violet-200 font-semibold underline cursor-pointer"
                >
                  Midterm Controls &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* EXPANDED CNN EXIT POLL MULTI-DEMOGRAPHIC VOTER INTENTION MATRIX (National OR State) */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  {activeStateObj
                    ? `${activeStateObj.stateName} State Polls — CNN Demographic Voter Intention`
                    : "National Voter Intention — CNN Exit Poll Demographics"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeStateObj
                    ? `Showing ${activeStateObj.stateName} demographic crosstabs across Income, Race, Gender, Education & Community Type.`
                    : "Showing National U.S. crosstabs across Income, Race, Gender, Education, Age & Community Type (click any state above for state polls)."}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "All Cohorts" },
                  { id: "income", label: "Income" },
                  { id: "race", label: "Race / Ethnicity" },
                  { id: "gender", label: "Gender" },
                  { id: "educationAndAge", label: "Education & Age" },
                  { id: "communityType", label: "Urban / Rural" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDemoCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                      demoCategoryFilter === cat.id
                        ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                ...(demoCategoryFilter === "all" || demoCategoryFilter === "income"
                  ? (activeDemoPolls.income || [
                      { id: "lowIncome", label: "Lower-Income (<$50k)", votes: cohortVotes.lowIncome || [] },
                      { id: "middleClass", label: "Middle-Class ($50k–$150k)", votes: cohortVotes.middleClass || [] },
                      { id: "upperClass", label: "Upper-Income (>$150k)", votes: cohortVotes.upperClass || [] },
                    ]).map((d) => ({ ...d, groupTag: "Income" }))
                  : []),
                ...(demoCategoryFilter === "all" || demoCategoryFilter === "race"
                  ? (activeDemoPolls.race || []).map((d) => ({ ...d, groupTag: "Race / Ethnicity" }))
                  : []),
                ...(demoCategoryFilter === "all" || demoCategoryFilter === "gender"
                  ? (activeDemoPolls.gender || []).map((d) => ({ ...d, groupTag: "Gender" }))
                  : []),
                ...(demoCategoryFilter === "all" || demoCategoryFilter === "educationAndAge"
                  ? (activeDemoPolls.educationAndAge || []).map((d) => ({ ...d, groupTag: "Education & Age" }))
                  : []),
                ...(demoCategoryFilter === "all" || demoCategoryFilter === "communityType"
                  ? (activeDemoPolls.communityType || []).map((d) => ({ ...d, groupTag: "Community" }))
                  : []),
              ].map((cohort) => (
                <div
                  key={`${cohort.groupTag}-${cohort.id}`}
                  className="bg-slate-950/75 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{cohort.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-slate-900 border border-slate-800 text-cyan-300">
                      {cohort.groupTag}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(cohort.votes || []).slice(0, 4).map((r) => (
                      <div key={r.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.name}
                          </span>
                          <span className="font-mono font-semibold text-white">{r.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 51-Jurisdiction State-by-State Electoral & Federalism Table */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  State-by-State Electoral, Congress &amp; Federalism Performance (50 States + D.C.)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any state row to inspect its County Impression Map, Federal Adherence, and State Polls.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Filter state, code, party..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All 51 Jurisdictions</option>
                  <option value="tossup">CNN Toss-Ups (&lt;3%)</option>
                  <option value="battleground">Swing States (&lt;5%)</option>
                  {parties.map((p) => (
                    <option key={p.name} value={p.name}>
                      Led by {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">State / Jurisdiction</th>
                    <th className="py-2.5 px-3 text-right">EV</th>
                    <th className="py-2.5 px-3 text-right">House</th>
                    <th className="py-2.5 px-3">Leader / Gov</th>
                    <th className="py-2.5 px-3 text-right">Lead %</th>
                    <th className="py-2.5 px-3 text-right">Fed Adh.</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3">CNN Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
                  {filteredStates.map((st) => {
                    const style = getCnnFillStyle(st, highlightTossups);
                    return (
                      <tr
                        key={st.stateName}
                        onClick={() => setSelectedMapState(st.stateName)}
                        className={`cursor-pointer transition ${
                          selectedMapState === st.stateName
                            ? "bg-blue-950/50"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-2 px-3 font-medium text-white">
                          {st.stateName}{" "}
                          <span className="text-[10px] font-mono text-slate-500">
                            ({st.code})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                          {st.ev}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">
                          {st.houseSeats || 0}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: st.winnerColor }}
                            />
                            {st.winner}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">
                          {st.winnerPct}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-cyan-300">
                          {st.federalism?.federalAdherencePct ?? 68}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200">
                          +{st.margin}%
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badgeClass}`}
                          >
                            {style.tierLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Presidential Elections & Full 538-EV Map Archive (Toss-Ups Awarded to Leader) */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  Past Elections Archive — Full Presidential Map (Toss-Ups Awarded to Leader)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Every historical election displays all 51 jurisdictions with close toss-up states assigned directly to the leading party.
                </p>
              </div>
              {electionHistory.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
                  {electionHistory.length} Recorded {electionHistory.length === 1 ? "Election" : "Elections"}
                </span>
              )}
            </div>

            {electionHistory.length === 0 ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>
                  No historical elections have been held yet. Call a snap election or let simulation time reach Election Day to inspect past full-map results here.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubView("schedule")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-pointer"
                >
                  Go to Call &amp; Schedule Elections
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {electionHistory.map((rec) => {
                    const isSel = selectedHistRecord?.id === rec.id;
                    const winStanding = (rec.electoralStandings || []).find(
                      (e) => e.name === rec.winner
                    );
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => setSelectedHistoryId(rec.id)}
                        className={`text-left px-3 py-2 rounded-xl border text-xs transition cursor-pointer space-y-0.5 ${
                          isSel
                            ? "bg-slate-800 border-blue-500/70 shadow-lg"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
                          <span>Q{rec.quarter} · {rec.date}</span>
                          <span className="uppercase text-blue-300">
                            {rec.electionType || "Election"}
                          </span>
                        </div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: winStanding?.color || "#3b82f6" }}
                          />
                          <span>{rec.winner}</span>
                          <span className="font-mono text-slate-300 font-semibold">
                            ({rec.winnerEv} EV · {rec.winnerPollPct}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedHistRecord && (
                  <div className="space-y-3">
                    {/* Historical Final EV Breakdown Bar (All 538 EVs Awarded) */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="font-semibold text-white">
                          Certified {selectedHistRecord.electionType || "Election"} ({selectedHistRecord.date}) — Winner:{" "}
                          <span className="text-emerald-300">{selectedHistRecord.winner}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>Incumbent Fatigue: {Number(selectedHistRecord.governmentFatigue ?? 0).toFixed(1)}%</span>
                          <span>·</span>
                          <span>Approval: {Number(selectedHistRecord.incumbentApproval ?? 50).toFixed(1)}%</span>
                          {selectedHistRecord.inaugurated && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-sans text-[10px] font-semibold">
                              Inaugurated
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-5 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex">
                        {histSummaryStandings.map((s) => (
                          <div
                            key={s.name}
                            style={{
                              width: `${(Number(s.ev || 0) / 538) * 100}%`,
                              backgroundColor: s.color || "#64748b",
                            }}
                            title={`${s.name}: ${s.ev} EV`}
                            className="h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                          >
                            {s.ev >= 28 ? `${s.ev}` : ""}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-300 font-mono">
                        {histSummaryStandings.map((s) => {
                          const pop = (selectedHistRecord.nationalPolls || []).find(
                            (p) => p.name === s.name
                          );
                          return (
                            <span key={s.name} className="inline-flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: s.color || "#64748b" }}
                              />
                              {s.name}: {s.ev} EV{pop ? ` (${pop.pollPct}%)` : ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {Array.isArray(selectedHistRecord.stateResults) &&
                    selectedHistRecord.stateResults.length > 0 ? (
                      <CnnElectoralWallMap
                        stateResults={selectedHistRecord.stateResults}
                        selectedStateName={selectedHistMapState}
                        onSelectState={setSelectedHistMapState}
                        highlightTossups={false}
                        wallTitle={`Past Election Archive Map — Q${selectedHistRecord.quarter} (${selectedHistRecord.date}) · Toss-Ups Awarded to Leader`}
                      />
                    ) : (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
                        This earlier election record was logged before full 51-state archive snapshots were enabled.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 2: CALL & SCHEDULE ELECTIONS */}
      {activeSubView === "schedule" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Scheduled Election Configuration */}
            <form
              onSubmit={handleSaveSchedule}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Regularly Scheduled Elections
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Automatically holds a national election when simulation time reaches your configured Election Day.
                  </p>
                </div>
                {daysUntilScheduled !== null && scheduleDraft.enabled && (
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/40">
                    {daysUntilScheduled >= 0
                      ? `In ${daysUntilScheduled}d`
                      : "Due next tick"}
                  </span>
                )}
              </div>

              <label className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl p-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Enable Automatic Scheduled Elections
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Current Date: <span className="font-mono text-slate-200">{currentSimDate}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={scheduleDraft.enabled}
                  onChange={(e) =>
                    setScheduleDraft({ ...scheduleDraft, enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Next Election Date Picker
                  </label>
                  <input
                    type="date"
                    disabled={!canEdit}
                    value={scheduleDraft.nextElectionDate}
                    onChange={(e) =>
                      setScheduleDraft({
                        ...scheduleDraft,
                        nextElectionDate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Election Cycle Interval (Years)
                  </label>
                  <select
                    disabled={!canEdit}
                    value={scheduleDraft.cycleYears}
                    onChange={(e) =>
                      setScheduleDraft({
                        ...scheduleDraft,
                        cycleYears: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <option key={y} value={y}>
                        Every {y} {y === 1 ? "Year" : "Years"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Explicit Year / Month / Day override inputs so ANY historical or future year is easy */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Year of Choice
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3000}
                    disabled={!canEdit}
                    value={schedY || 2028}
                    onChange={(e) => updateScheduleYmdPart("y", Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Month (1–12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    disabled={!canEdit}
                    value={schedM || 11}
                    onChange={(e) => updateScheduleYmdPart("m", Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Day (1–31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={!canEdit}
                    value={schedD || 7}
                    onChange={(e) => updateScheduleYmdPart("d", Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={scheduleDraft.autoInaugurate}
                  onChange={(e) =>
                    setScheduleDraft({
                      ...scheduleDraft,
                      autoInaugurate: e.target.checked,
                    })
                  }
                  className="accent-emerald-500"
                />
                Automatically inaugurate winner (resets Government Fatigue to 0% if party changes)
              </label>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    Enable Automatic Midterm Congressional Elections (435 House + 100 Senate)
                  </span>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={Boolean(scheduleDraft.midtermEnabled)}
                    onChange={(e) =>
                      setScheduleDraft({
                        ...scheduleDraft,
                        midtermEnabled: e.target.checked,
                      })
                    }
                    className="accent-violet-500 w-4 h-4"
                  />
                </label>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Next Midterm Election Date:</span>
                  <input
                    type="date"
                    disabled={!canEdit}
                    value={scheduleDraft.nextMidtermDate || "2026-11-03"}
                    onChange={(e) =>
                      setScheduleDraft({
                        ...scheduleDraft,
                        nextMidtermDate: e.target.value,
                      })
                    }
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {canEdit && (
                <button
                  type="submit"
                  disabled={busyAction}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow cursor-pointer transition"
                >
                  <Save className="w-4 h-4" />
                  Save Election Schedule
                </button>
              )}
            </form>

            {/* Call Immediate Snap Election Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Vote className="w-4 h-4" />
                    Call Immediate Snap Election
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Speech Sensitivity: {forecast.speechSensitivityMultiplier ?? 1.15}x
                  </span>
                </div>

                <div className="bg-slate-950/75 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-emerald-400" />
                    Government Fatigue &amp; Speech-Weighted Accountability
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <span className="text-emerald-300 font-semibold">Government Fatigue</span> resets to{" "}
                    <span className="text-white font-mono font-semibold">0%</span> when a different party takes power and accumulates based on national trajectory: very slowly for swift decisive fixes, proportionally slower when alleviating hardship, moderately under stagnant crises, and sharply under harmful policy mistakes. High fatigue triggers an opposition surge while broad satisfaction strengthens the incumbent.
                  </p>
                </div>

                <div
                  className={`border rounded-xl p-3 text-xs space-y-1 ${
                    fatigueVal >= 55
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                      : fatigueVal >= 25
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Incumbent Fatigue: {fatigueStatus}
                    </span>
                    <span className="font-mono font-bold">
                      {fatigueVal.toFixed(1)}% (+{fatigueRate.toFixed(1)}/qtr)
                    </span>
                  </div>
                  <div className="text-[11px] opacity-85">{fatigueReason}</div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={resetCycleFromToday}
                    onChange={(e) => setResetCycleFromToday(e.target.checked)}
                    className="accent-rose-500"
                  />
                  Reset next scheduled election cycle countdown from today ({currentSimDate})
                </label>
              </div>

              {canEdit ? (
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleTriggerElection(true, "Snap Election")}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow cursor-pointer transition"
                  >
                    <Crown className="w-4 h-4" />
                    Call Snap Election &amp; Inaugurate Winner
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleTriggerElection(false, "Midterm Congressional Election")}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-violet-600/80 hover:bg-violet-600 disabled:opacity-50 text-white border border-violet-500/40 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Landmark className="w-4 h-4" />
                    Call Midterm Congressional Election (435 House + 100 Senate)
                  </button>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleTriggerElection(false, "Snap Poll")}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 cursor-pointer transition"
                  >
                    Hold Non-Binding Snap Poll (Record Result Only)
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  Spectator View — only the Simulation Director can schedule or call elections.
                </div>
              )}
            </div>
          </div>

          {/* Certified National Election History Ledger */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <History className="w-4 h-4 text-blue-400" />
              Certified National Election History
            </div>
            {electionHistory.length === 0 ? (
              <p className="text-xs text-slate-500">
                No elections certified yet. Scheduled elections trigger automatically on Election Day or when you call a snap election above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {electionHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        Q{rec.quarter} · {rec.date}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {rec.electionType || "Election"}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm flex items-center justify-between">
                      <span>Winner: {rec.winner}</span>
                      {rec.inaugurated && (
                        <span className="text-[9px] uppercase text-emerald-300 font-semibold">
                          Inaugurated
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      {rec.winnerEv} / 538 EV · {rec.winnerPollPct}% Popular Vote
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGE 3: PARTY STUDIO */}
      {activeSubView === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Rail: Roster of Parties */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Registered Parties
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleStartNewParty}
                    className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Party
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {parties.map((p) => {
                  const isRuling = p.name === rulingPartyName;
                  const isSelected = !draft.isNew && selectedPartyName === p.name;
                  const pollEntry = nationalPolls.find((n) => n.name === p.name);
                  const evEntry = evStandings.find((n) => n.name === p.name);
                  return (
                    <div
                      key={p.name}
                      onClick={() => handleSelectParty(p)}
                      className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? "bg-slate-800/80 border-blue-500/60 shadow-lg"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-white truncate">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: p.color || "#94a3b8" }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {isRuling && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shrink-0">
                            Ruling
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{p.politicalAlignment}</span>
                        <span className="font-mono text-slate-300">
                          {evEntry ? `${evEntry.ev} EV` : ""} ·{" "}
                          {pollEntry ? `${pollEntry.pollPct}%` : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/70">
                        <span>Base Tax: {Math.round(Number(p.baseTaxLevel ?? 0.24) * 100)}%</span>
                        <span>Mode: P{Math.round(Number(p.taxDistributionMode ?? 0.55) * 100)}</span>
                        {!isRuling && canEdit && onSetRulingParty && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onSetRulingParty(p);
                            }}
                            className="text-blue-400 hover:text-blue-300 font-sans font-semibold cursor-pointer"
                          >
                            Install in Office
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Form: Party Posture Configurator & Creator */}
          <form
            onSubmit={handleSaveDraft}
            className="lg:col-span-8 bg-slate-900/75 border border-slate-800 rounded-2xl p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-white">
                  {draft.isNew
                    ? "Create New Political Party"
                    : `Edit Party Posture: ${draft.originalName}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {draft.isNew
                    ? "Configure 0–100% tax levels, bell-curve class incidence, 6 core governance acts, and 7 social & anti-corruption charter stances."
                    : "Primary workspace for party tax posture, 6 core governance acts, and 7 social charter & corruption stances — slider/policy updates save live without background resets."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!draft.isNew &&
                  draft.originalName !== rulingPartyName &&
                  parties.length > 2 &&
                  canEdit && (
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Party
                    </button>
                  )}
                {canEdit && (
                  <button
                    type="submit"
                    disabled={busyAction || !draft.name.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow cursor-pointer transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {draft.isNew ? "Create Party" : "Save Party Posture"}
                  </button>
                )}
              </div>
            </div>

            {/* Identity & Platform */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Party Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Forward Technocrats"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Ideological Alignment
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={draft.politicalAlignment}
                  onChange={(e) =>
                    setDraft({ ...draft, politicalAlignment: e.target.value })
                  }
                  placeholder="Center-Left / Techno-Progressive"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Electoral Color
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => persistExistingDraft({ ...draft, color: hex }, true)}
                      className={`w-6 h-6 rounded-full border-2 cursor-pointer transition ${
                        draft.color === hex
                          ? "border-white scale-110"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Party Manifesto &amp; Economic Platform
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={draft.platformSummary}
                onChange={(e) =>
                  setDraft({ ...draft, platformSummary: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Federalism & State Policy Adherence Doctrine */}
            <div className="bg-slate-950/70 border border-violet-500/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Federalism &amp; State Adherence Doctrine
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Baseline State Adherence:{" "}
                  {Math.round(
                    (FEDERALISM_POLICY_CATALOG[draft.federalismPolicy || "moderate"]?.adherenceRate ?? 0.68) * 100
                  )}
                  %
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FEDERALISM_POLICY_ORDER.map((fedId) => {
                  const spec = FEDERALISM_POLICY_CATALOG[fedId];
                  const isSel = (draft.federalismPolicy || "moderate") === fedId;
                  return (
                    <button
                      key={fedId}
                      type="button"
                      disabled={!canEdit}
                      onClick={() =>
                        persistExistingDraft({ ...draft, federalismPolicy: fedId }, true)
                      }
                      className={`text-left p-2.5 rounded-xl border transition cursor-pointer space-y-1 ${
                        isSel
                          ? "bg-violet-500/20 border-violet-500/60 text-white shadow"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-bold">
                        <span>{spec.shortLabel}</span>
                        <span className="font-mono text-[10px] text-violet-300">
                          {Math.round(spec.adherenceRate * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {spec.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 0-100% Base Tax & Bell-Curve Distribution Sliders + Live Modifiers */}
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Party Tax Posture (0%–100%) &amp; Bell-Curve Class Incidence
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {draft.isNew ? "Live preview" : "Auto-syncs active posture"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">
                      Base Level of Tax (% National Income)
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {Math.round(draft.baseTaxLevel * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    disabled={!canEdit}
                    value={draft.baseTaxLevel}
                    onChange={(e) =>
                      persistExistingDraft(
                        { ...draft, baseTaxLevel: Number(e.target.value) },
                        false
                      )
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0% Tax Free</span>
                    <span>50% Heavy State</span>
                    <span>100% Command Confiscation</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">
                      Bell-Curve Modal Position
                    </span>
                    <span className="font-mono font-bold text-sky-300">
                      P{Math.round(draft.taxDistributionMode * 100)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.10}
                    max={0.90}
                    step={0.02}
                    disabled={!canEdit}
                    value={draft.taxDistributionMode}
                    onChange={(e) =>
                      persistExistingDraft(
                        { ...draft, taxDistributionMode: Number(e.target.value) },
                        false
                      )
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Lower Class (Sales Max)</span>
                    <span>Middle (Income Max)</span>
                    <span>Upper (Corp/CG Max)</span>
                  </div>
                </div>
              </div>

              {draft.baseTaxLevel > 0.55 && (
                <div className="text-[11px] text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Extreme Laffer Zone: taxing &gt;55% of national income severely depresses private consumption and corporate capex.
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Income Tax</div>
                  <div className="font-mono font-bold text-sky-300 text-sm">
                    {(previewTaxRates.incomeTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Corporate Profit</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    {(previewTaxRates.corporateTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Capital Gains</div>
                  <div className="font-mono font-bold text-emerald-300 text-sm">
                    {(previewTaxRates.capitalGainsTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                  <div className="text-[10px] text-slate-400">Sales / VAT</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {(previewTaxRates.salesTax * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Core Funding Priorities + 7 Social Charter Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Default Core Act Funding ({POLICY_CATALOG.length})
                </div>
                {POLICY_CATALOG.map((spec) => {
                  const cur = draft.defaultPolicies?.[spec.id] || {
                    enacted: true,
                    funding: "standard",
                  };
                  return (
                    <div
                      key={spec.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <div>
                          <div className="font-semibold text-white">{spec.name || spec.shortName}</div>
                          {Array.isArray(spec.drives) && spec.drives.length > 0 && (
                            <div className="text-[10px] text-cyan-300/90 mt-0.5">
                              Drives: {spec.drives.join(" · ")}
                            </div>
                          )}
                          {spec.description && (
                            <p className="text-[11px] text-slate-400 leading-snug mt-1">
                              {spec.description}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              persistExistingDraft(
                                {
                                  ...draft,
                                  defaultPolicies: {
                                    ...draft.defaultPolicies,
                                    [spec.id]: { ...cur, enacted: !cur.enacted },
                                  },
                                },
                                true
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 cursor-pointer ${
                              cur.enacted
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {cur.enacted ? "Enacted" : "Repealed"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {FUNDING_TIER_ORDER.map((tKey) => {
                          const isSel = cur.enacted && cur.funding === tKey;
                          return (
                            <button
                              key={tKey}
                              type="button"
                              disabled={!canEdit}
                              onClick={() =>
                                persistExistingDraft(
                                  {
                                    ...draft,
                                    defaultPolicies: {
                                      ...draft.defaultPolicies,
                                      [spec.id]: { enacted: true, funding: tKey },
                                    },
                                  },
                                  true
                                )
                              }
                              className={`py-1 rounded text-[10px] font-semibold border cursor-pointer ${
                                isSel
                                  ? "bg-cyan-500/20 text-cyan-200 border-cyan-500/50"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                            >
                              {FUNDING_TIERS[tKey].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Social Charter, Corruption &amp; Duties ({SOCIAL_POLICY_CATALOG.length})
                </div>
                {SOCIAL_POLICY_CATALOG.map((spec) => {
                  const curLevel = draft.socialPolicies?.[spec.id] || "balanced";
                  const isFreedom = spec.category === "individual_freedom";
                  const isCorruption = spec.id === "antiCorruptionAndEthics";
                  return (
                    <div
                      key={spec.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2 text-[11px]">
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            {spec.shortName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {spec.articleRef}
                            {Array.isArray(spec.drives) && spec.drives.length > 0
                              ? ` · Drives: ${spec.drives.join(" · ")}`
                              : ""}
                          </div>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            isCorruption
                              ? "bg-rose-500/15 text-rose-300"
                              : isFreedom
                              ? "bg-sky-500/15 text-sky-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {isCorruption ? "Corruption" : isFreedom ? "UDHR" : "Duty"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {SOCIAL_LEVEL_ORDER.map((lvlKey) => {
                          const lvl = spec.levels[lvlKey];
                          const isSel = curLevel === lvlKey;
                          return (
                            <button
                              key={lvlKey}
                              type="button"
                              disabled={!canEdit}
                              onClick={() =>
                                persistExistingDraft(
                                  {
                                    ...draft,
                                    socialPolicies: {
                                      ...draft.socialPolicies,
                                      [spec.id]: lvlKey,
                                    },
                                  },
                                  true
                                )
                              }
                              className={`py-1 px-1 rounded text-[9px] font-semibold border truncate cursor-pointer ${
                                isSel
                                  ? isFreedom
                                    ? "bg-sky-500/20 text-sky-200 border-sky-500/50"
                                    : "bg-amber-500/20 text-amber-200 border-amber-500/50"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                              title={lvl.label}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {draft.isNew && canEdit && (
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.makeRulingParty}
                  onChange={(e) =>
                    setDraft({ ...draft, makeRulingParty: e.target.checked })
                  }
                  className="rounded accent-emerald-500"
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Immediately inaugurate as Governing Ruling Party (resets Government Fatigue to 0%)
              </label>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
