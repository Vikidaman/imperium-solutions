import React, { useEffect, useMemo, useState } from "react";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
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
} from "lucide-react";
import {
  DEFAULT_POLITICAL_PARTIES,
  FUNDING_TIERS,
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
            CNN Election Night Magic Wall — 538 Electoral Votes
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
              <span className="w-3 h-2.5 rounded-sm bg-yellow-500 inline-block opacity-85" /> Toss-Up (&lt;3%)
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

function buildPartyDraft(party = null) {
  if (!party) {
    return {
      isNew: true,
      originalName: "",
      name: "",
      color: "#8b5cf6",
      politicalAlignment: "Populist Center",
      platformSummary:
        "Custom political movement with tailored tax bell-curve, governance funding, and social charter priorities.",
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
  };
  const currentSimDate = state?.timeManager?.crisisDate || "2025-01-01";

  // 3 Pages: "elections" (CNN Map & Forecast) | "schedule" (Call & Schedule Elections) | "studio" (Party Studio)
  const [activeSubView, setActiveSubView] = useState("elections");
  const [selectedPartyName, setSelectedPartyName] = useState(rulingPartyName);
  const [draft, setDraft] = useState(() =>
    buildPartyDraft(parties.find((p) => p.name === rulingPartyName) || parties[0])
  );
  const [busyAction, setBusyAction] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [selectedMapState, setSelectedMapState] = useState("Pennsylvania");
  const [highlightTossups, setHighlightTossups] = useState(true);

  const [scheduleDraft, setScheduleDraft] = useState(serverSchedule);
  const [resetCycleFromToday, setResetCycleFromToday] = useState(true);

  useEffect(() => {
    setScheduleDraft({
      enabled: serverSchedule.enabled !== undefined ? Boolean(serverSchedule.enabled) : true,
      nextElectionDate: serverSchedule.nextElectionDate || "2028-11-07",
      cycleYears: Number(serverSchedule.cycleYears || 4),
      autoInaugurate:
        serverSchedule.autoInaugurate !== undefined
          ? Boolean(serverSchedule.autoInaugurate)
          : true,
    });
  }, [
    serverSchedule.enabled,
    serverSchedule.nextElectionDate,
    serverSchedule.cycleYears,
    serverSchedule.autoInaugurate,
  ]);

  useEffect(() => {
    if (draft.isNew) return;
    const matched = parties.find((p) => p.name === selectedPartyName) || parties[0];
    if (matched) {
      setDraft(buildPartyDraft(matched));
    }
  }, [parties, selectedPartyName]);

  const previewTaxRates = useMemo(
    () => computeTaxRatesFromPosture(draft.baseTaxLevel, draft.taxDistributionMode),
    [draft.baseTaxLevel, draft.taxDistributionMode]
  );

  const handleSelectParty = (party) => {
    setSelectedPartyName(party.name);
    setDraft(buildPartyDraft(party));
  };

  const handleStartNewParty = () => {
    setSelectedPartyName("__NEW__");
    setDraft(buildPartyDraft(null));
    setActiveSubView("studio");
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!canEdit || !onUpsertParty) return;
    if (!draft.name.trim()) return;
    setBusyAction(true);
    try {
      const payload = {
        name: draft.name.trim(),
        color: draft.color,
        politicalAlignment: draft.politicalAlignment,
        platformSummary: draft.platformSummary,
        baseTaxLevel: draft.baseTaxLevel,
        taxDistributionMode: draft.taxDistributionMode,
        workerShareOfGdp: draft.workerShareOfGdp,
        budgetAsPercentOfGdp: draft.budgetAsPercentOfGdp,
        deficitTargetAsPercentOfGdp: draft.deficitTargetAsPercentOfGdp,
        currentSupport: draft.currentSupport,
        defaultPolicies: draft.defaultPolicies,
        socialPolicies: draft.socialPolicies,
        makeRulingParty: draft.makeRulingParty,
        syncRulingNation: true,
      };
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
    setBusyAction(true);
    try {
      await onDeleteParty(draft.originalName);
      setSelectedPartyName(rulingPartyName);
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

  return (
    <div className="space-y-6">
      {/* Top Banner & 3-Page Sub-View Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Flag className="w-4 h-4" />
            Political System, Ideology & Electoral Simulator
          </div>
          <h2 className="text-xl font-bold text-white flex flex-wrap items-center gap-2.5">
            <span>Road to 270 & Party Platforms</span>
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
                {forecast.honeymoonActive ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 font-mono text-emerald-300 font-semibold flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    Honeymoon Active: {forecast.honeymoonDaysRemaining}d left
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono text-slate-300">
                    Post-Honeymoon Governance Track
                  </span>
                )}
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

          {/* Interactive CNN Magic Wall Choropleth Map */}
          <CnnElectoralWallMap
            stateResults={stateResults}
            selectedStateName={selectedMapState}
            onSelectState={setSelectedMapState}
            highlightTossups={highlightTossups}
          />

          {/* Voter Cohort Polling & Ideology Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                key: "lowIncome",
                title: "Lower-Income Households",
                subtitle: "Sensitive to sales tax, equality & healthcare",
              },
              {
                key: "middleClass",
                title: "Middle-Class Voters",
                subtitle: "Sensitive to income tax, inflation & infra",
              },
              {
                key: "upperClass",
                title: "Upper-Income & Capital",
                subtitle: "Sensitive to corporate/cap gains taxes & R&D",
              },
            ].map((cohort) => {
              const rows = cohortVotes[cohort.key] || [];
              return (
                <div
                  key={cohort.key}
                  className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      {cohort.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {cohort.subtitle}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {rows.map((r) => (
                      <div key={r.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.name}
                          </span>
                          <span className="font-mono font-semibold text-white">
                            {r.pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 51-Jurisdiction State-by-State Electoral Table */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  State-by-State Electoral Performance (50 States + D.C.)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any row to highlight on the CNN Magic Wall map above.
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
                    <th className="py-2.5 px-3">Leader</th>
                    <th className="py-2.5 px-3 text-right">Lead %</th>
                    <th className="py-2.5 px-3">Runner-Up</th>
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
                        <td className="py-2 px-3 text-slate-400">
                          {st.runnerUp} ({st.runnerUpPct}%)
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
                Automatically inaugurate winner with 180-day Honeymoon Period
              </label>

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
                    Honeymoon Period &amp; Speech-Weighted Accountability
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Inaugurating a new winner grants a{" "}
                    <span className="text-emerald-300 font-semibold">180-day Honeymoon Period</span>{" "}
                    so an unpopular outgoing crisis does not instantly flip polls on Day 1. Over subsequent months, approval evolves across{" "}
                    <span className="text-white font-semibold">all 8 Good Governance indicators</span>,{" "}
                    weighted heavily by the{" "}
                    <span className="text-sky-300 font-semibold">Freedom of Speech Index</span>{" "}
                    ({forecast.speechFreedomLabel}).
                  </p>
                </div>

                {forecast.honeymoonActive && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-center justify-between">
                    <span>Active Administration Honeymoon</span>
                    <span className="font-mono font-bold">
                      {forecast.honeymoonDaysRemaining} days remaining
                    </span>
                  </div>
                )}

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
                  Configure 0–100% tax levels, bell-curve class incidence, 6 core governance acts, and 7 social &amp; anti-corruption charter stances.
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
                      onClick={() => setDraft({ ...draft, color: hex })}
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

            {/* 0-100% Base Tax & Bell-Curve Distribution Sliders + Live Modifiers */}
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Party Tax Posture (0%–100%) &amp; Bell-Curve Class Incidence
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Live statutory tax calculator
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
                      setDraft({ ...draft, baseTaxLevel: Number(e.target.value) })
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
                      setDraft({ ...draft, taxDistributionMode: Number(e.target.value) })
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{spec.shortName}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                defaultPolicies: {
                                  ...draft.defaultPolicies,
                                  [spec.id]: { ...cur, enacted: !cur.enacted },
                                },
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
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
                                setDraft({
                                  ...draft,
                                  defaultPolicies: {
                                    ...draft.defaultPolicies,
                                    [spec.id]: { enacted: true, funding: tKey },
                                  },
                                })
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
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-white truncate">
                          {spec.shortName}
                        </span>
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
                                setDraft({
                                  ...draft,
                                  socialPolicies: {
                                    ...draft.socialPolicies,
                                    [spec.id]: lvlKey,
                                  },
                                })
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
                Immediately inaugurate as Governing Ruling Party (with 180d Honeymoon)
              </label>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
