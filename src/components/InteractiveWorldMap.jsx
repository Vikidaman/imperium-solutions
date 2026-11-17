import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Award,
  Layers,
  MapPin,
  Search,
  Sliders,
  RotateCcw,
  Percent,
  Building2,
  Droplets,
  Pickaxe,
  Wheat,
  Anchor,
  Cpu,
  Landmark,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Edit2,
  X,
  Check,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { formatCompactCurrency, formatCompactNumber } from "../utils/formatters";
import { US_STATES_CATALOG } from "../data/usStatesData";
import { getUsStateEndowment } from "../data/usGeographicEndowments";
import { getUsStateServicesEndowment } from "../data/usServicesEndowments";
import {
  DEFAULT_POLITICAL_PARTIES,
  FUNDING_TIERS,
  FEDERALISM_POLICY_CATALOG,
  POLICY_CATALOG,
  SOCIAL_POLICY_CATALOG,
  resolvePoliticalParty,
  cloneDefaultPolicies,
  cloneDefaultSocialPolicies,
  computeTaxRatesFromPosture,
} from "../../server/simplifiedSeedConfig";
import CountryAdm1Map from "./CountryAdm1Map";

const DEFAULT_PARTY_NAMES = DEFAULT_POLITICAL_PARTIES.map((p) => p.name);
const FUNDING_TIER_ORDER = ["underfunded", "standard", "priority", "landmark"];
const SOCIAL_LEVEL_ORDER = ["low", "balanced", "strong"];

const SPECIALIZATION_OPTIONS = [
  { id: "", label: "Balanced Diversified Economy" },
  {
    id: "Industry & Manufacturing GDP",
    label: "Advanced Manufacturing & Industry (+15% Ind)",
  },
  {
    id: "Agricultural Sector GDP",
    label: "Agribusiness & Resource Extraction (+15% Agri)",
  },
  {
    id: "Office & Corporate Services GDP",
    label: "Corporate Finance & Tech Services (+15% Services)",
  },
  {
    id: "Hospitality & Tourist Services GDP",
    label: "Hospitality, Leisure & Retail (+15% Hosp)",
  },
];

const BufferedRangeSlider = ({
  value,
  min,
  max,
  step,
  disabled,
  className,
  onCommit,
}) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const commitValue = (val) => {
    if (disabled) return;
    const num = Number(val);
    if (num !== Number(value)) {
      onCommit(num);
    }
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={localVal}
      onChange={(e) => setLocalVal(Number(e.target.value))}
      onMouseUp={(e) => commitValue(e.currentTarget.value)}
      onTouchEnd={(e) => commitValue(e.currentTarget.value)}
      onKeyUp={(e) => commitValue(e.currentTarget.value)}
      onBlur={(e) => commitValue(e.currentTarget.value)}
      className={className}
    />
  );
};

const TaxBellCurveSvg = ({ curvePoints = [], mode = 0.62, skewDirection = "left-tailed" }) => {
  const width = 320;
  const height = 78;
  const padX = 8;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pts =
    Array.isArray(curvePoints) && curvePoints.length > 0
      ? curvePoints
      : Array.from({ length: 21 }, (_, i) => {
          const x = i / 20;
          const sL = 0.16 + 0.42 * mode;
          const sR = 0.16 + 0.42 * (1 - mode);
          const s = x < mode ? sL : sR;
          return { x, density: Math.exp(-Math.pow(x - mode, 2) / (2 * s * s)) };
        });

  const coords = pts.map((p) => {
    const px = padX + p.x * innerW;
    const py = padY + innerH - Math.max(0.02, p.density) * (innerH - 6);
    return [px, py];
  });

  const linePath = coords
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${(padX + innerW).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${padX.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;
  const modeX = padX + Math.max(0.05, Math.min(0.95, mode)) * innerW;

  const strokeColor =
    skewDirection === "right-tailed"
      ? "#f59e0b"
      : skewDirection === "left-tailed"
      ? "#10b981"
      : "#38bdf8";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-20 rounded-lg bg-slate-900/75 border border-slate-800/80"
      aria-label="Tax burden distribution bell curve"
    >
      {/* Cohort zone background bands: Low (0-0.40), Middle (0.40-0.85), Upper (0.85-1.0) */}
      <rect x={padX} y={padY} width={innerW * 0.4} height={innerH} fill="rgba(245, 158, 11, 0.06)" />
      <rect x={padX + innerW * 0.4} y={padY} width={innerW * 0.45} height={innerH} fill="rgba(59, 130, 246, 0.05)" />
      <rect x={padX + innerW * 0.85} y={padY} width={innerW * 0.15} height={innerH} fill="rgba(16, 185, 129, 0.07)" />

      {/* Area fill */}
      <path d={areaPath} fill={strokeColor} fillOpacity="0.18" />
      {/* Bell curve stroke */}
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />

      {/* Modal peak line */}
      <line
        x1={modeX}
        y1={padY}
        x2={modeX}
        y2={padY + innerH}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <circle cx={modeX} cy={padY + 6} r="3" fill={strokeColor} />
    </svg>
  );
};

const InteractiveWorldMap = ({
  state,
  nations: nationsProp,
  onUpdateNation,
  onResetScenario,
  onRunElection,
  onOpenPartyStudio,
  onOpenElectionsForecast,
  canConfigure,
  isReadOnly = false,
}) => {
  const nations = nationsProp || state?.nations || [];
  const canEdit = canConfigure !== undefined ? canConfigure : !isReadOnly;
  const usa = nations[0] || null;
  const c = usa?.computed || {};

  const [selectedStateName, setSelectedStateName] = useState("California");
  const [stateSearch, setStateSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("gdp");

  const statesWithMetrics = useMemo(() => {
    const totalGdp = Number(c.aggregateGdp || 0);
    const totalPops = Number(
      c.effectiveWorkingPops || usa?.workingPops || 168_000_000
    );
    const mult = c.endowmentPolicyMultipliers || {};
    const stemMult = Number(mult.stemTalentMultiplier ?? 1);
    const digitalMult = Number(mult.digitalInfraMultiplier ?? 1);
    const financeMult = Number(mult.financeDepthMultiplier ?? 1);
    const amenityMult = Number(mult.hospitalityAmenityMultiplier ?? 1);
    const portMult = Number(mult.portLogisticsMultiplier ?? 1);
    const resourceMult = Number(mult.resourceExtractionMultiplier ?? 1);
    const agriMult = Number(mult.agriYieldMultiplier ?? 1);
    const urbanMult = Number(mult.urbanAgglomerationMultiplier ?? 1);

    return Object.entries(US_STATES_CATALOG).map(([name, meta]) => {
      const geoRaw = getUsStateEndowment(name) || {};
      const srvRaw = getUsStateServicesEndowment(name) || {};
      const stateGdp = totalGdp * (meta.gdpShare || 0);
      const statePops = totalPops * (meta.popShare || 0);
      const gdpPerWorker = statePops > 0 ? stateGdp / statePops : 0;

      const scaleIndex = (rawVal, factor) =>
        Math.min(100, Math.max(0, Math.round((rawVal || 0) * factor)));

      const hydrocarbonIndex = scaleIndex(geoRaw.hydrocarbonIndex, resourceMult);
      const mineralIndex = scaleIndex(geoRaw.mineralIndex, resourceMult);
      const arableLandIndex = scaleIndex(geoRaw.arableLandIndex, agriMult);
      const logisticsWaterwayIndex = scaleIndex(geoRaw.logisticsWaterwayIndex, portMult);

      const humanCapitalIndex = scaleIndex(srvRaw.humanCapitalIndex, stemMult);
      const urbanAgglomerationIndex = scaleIndex(srvRaw.urbanAgglomerationIndex, urbanMult);
      const financialDepthIndex = scaleIndex(srvRaw.financialDepthIndex, financeMult);
      const digitalConnectivityIndex = scaleIndex(srvRaw.digitalConnectivityIndex, digitalMult);
      const consumerAmenityIndex = scaleIndex(srvRaw.consumerAmenityIndex, amenityMult);

      const geoComposite = Math.round(
        (hydrocarbonIndex +
          mineralIndex +
          arableLandIndex +
          logisticsWaterwayIndex) /
          4
      );
      const srvComposite = Math.round(
        (humanCapitalIndex +
          urbanAgglomerationIndex +
          financialDepthIndex +
          digitalConnectivityIndex +
          consumerAmenityIndex) /
          5
      );

      return {
        id: meta.code || name.slice(0, 2).toUpperCase(),
        name,
        capital: meta.capital,
        region: meta.region,
        role: meta.role,
        gdpShare: meta.gdpShare || 0,
        popShare: meta.popShare || 0,
        isTerritory: meta.status === "TERRITORY",
        stateGdp,
        statePops,
        gdpPerWorker,
        geo: {
          ...geoRaw,
          hydrocarbonIndex,
          mineralIndex,
          arableLandIndex,
          logisticsWaterwayIndex,
          rawHydrocarbonIndex: geoRaw.hydrocarbonIndex || 0,
          rawMineralIndex: geoRaw.mineralIndex || 0,
          rawArableLandIndex: geoRaw.arableLandIndex || 0,
          rawLogisticsWaterwayIndex: geoRaw.logisticsWaterwayIndex || 0,
          compositeScore: geoComposite,
        },
        srv: {
          ...srvRaw,
          humanCapitalIndex,
          urbanAgglomerationIndex,
          financialDepthIndex,
          digitalConnectivityIndex,
          consumerAmenityIndex,
          rawHumanCapitalIndex: srvRaw.humanCapitalIndex || 0,
          rawUrbanAgglomerationIndex: srvRaw.urbanAgglomerationIndex || 0,
          rawFinancialDepthIndex: srvRaw.financialDepthIndex || 0,
          rawDigitalConnectivityIndex: srvRaw.digitalConnectivityIndex || 0,
          rawConsumerAmenityIndex: srvRaw.consumerAmenityIndex || 0,
          compositeServicesScore: srvComposite,
        },
      };
    });
  }, [c.aggregateGdp, c.effectiveWorkingPops, c.endowmentPolicyMultipliers, usa?.workingPops]);

  const selectedState = useMemo(() => {
    return (
      statesWithMetrics.find((s) => s.name === selectedStateName) ||
      statesWithMetrics[0]
    );
  }, [statesWithMetrics, selectedStateName]);

  const filteredStates = useMemo(() => {
    return statesWithMetrics
      .filter((st) => {
        if (stateSearch.trim()) {
          const q = stateSearch.toLowerCase();
          const matchName = st.name.toLowerCase().includes(q);
          const matchCode = st.id.toLowerCase().includes(q);
          const matchCap = (st.capital || "").toLowerCase().includes(q);
          const matchRegion = (st.region || "").toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchCap && !matchRegion) return false;
        }
        if (stateFilter === "states") return !st.isTerritory;
        if (stateFilter === "territories") return Boolean(st.isTerritory);
        if (stateFilter === "energy") return (st.geo?.hydrocarbonIndex || 0) >= 55;
        if (stateFilter === "minerals") return (st.geo?.mineralIndex || 0) >= 55;
        if (stateFilter === "agriculture") return (st.geo?.arableLandIndex || 0) >= 65;
        if (stateFilter === "tech")
          return (st.srv?.digitalConnectivityIndex || 0) >= 75;
        if (stateFilter === "finance") return (st.srv?.financialDepthIndex || 0) >= 70;
        if (stateFilter === "hospitality")
          return (st.srv?.consumerAmenityIndex || 0) >= 75;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "gdp") return b.stateGdp - a.stateGdp;
        if (sortBy === "pops") return b.statePops - a.statePops;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "energy")
          return (b.geo?.hydrocarbonIndex || 0) - (a.geo?.hydrocarbonIndex || 0);
        if (sortBy === "minerals")
          return (b.geo?.mineralIndex || 0) - (a.geo?.mineralIndex || 0);
        if (sortBy === "agriculture")
          return (b.geo?.arableLandIndex || 0) - (a.geo?.arableLandIndex || 0);
        if (sortBy === "tech")
          return (
            (b.srv?.digitalConnectivityIndex || 0) -
            (a.srv?.digitalConnectivityIndex || 0)
          );
        if (sortBy === "finance")
          return (
            (b.srv?.financialDepthIndex || 0) - (a.srv?.financialDepthIndex || 0)
          );
        return b.stateGdp - a.stateGdp;
      });
  }, [statesWithMetrics, stateSearch, stateFilter, sortBy]);

  if (!usa) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Loading United States Simulation Data...
      </div>
    );
  }

  const updatePolicy = (patch) => {
    if (!canEdit || !onUpdateNation) return;
    onUpdateNation(usa.id, patch);
  };

  const resetOverrides = () => {
    const activeParty = resolvePoliticalParty(state?.politicalParties, usa.rulingParty);
    const defaultPolicies = activeParty.defaultPolicies
      ? structuredClone(activeParty.defaultPolicies)
      : cloneDefaultPolicies(activeParty.name);
    const defaultSocialPolicies = activeParty.socialPolicies
      ? structuredClone(activeParty.socialPolicies)
      : cloneDefaultSocialPolicies(activeParty.name);
    updatePolicy({
      rulingParty: activeParty.name,
      crimePolicy: activeParty.localCrimePolicy,
      healthcarePolicy: activeParty.healthcarePolicy,
      enactedPolicies: defaultPolicies,
      socialPolicies: defaultSocialPolicies,
      incomeTaxOverride: null,
      corporateTaxOverride: null,
      salesTaxOverride: null,
      capitalGainsTaxOverride: null,
      workerShareOverride: null,
      budgetPercentOverride: null,
      baseTaxLevel: activeParty.baseTaxLevel ?? 0.24,
      taxDistributionMode: activeParty.taxDistributionMode ?? 0.62,
      equalityDrift: 0,
      centralBankRate: 0.045,
      infrastructureEfficiency: 0.82,
      literacyRate: 0.92,
      urbanisationIndex: 0.83,
      racialEqualityIndex: 0.68,
      crimeControlIndex: 0.74,
      consumerSentiment: 65,
      kFactorScaler: 1500,
      freightDelayFriction: 0,
      cumulativeGrowthFactor: 1.0,
      startingBaseline: {
        literacyRate: 0.92,
        infrastructureEfficiency: 0.82,
        urbanisationIndex: 0.83,
        consumerSentiment: 65,
        kFactorScaler: 1500,
        incomeEqualityIndex: 0.615,
        racialEqualityIndex: 0.68,
        crimeControlIndex: 0.74,
        publicDebt: Number(usa.publicDebt ?? 34500000000000),
      },
    });
  };

  const partyList = useMemo(() => {
    const parties = state?.politicalParties;
    if (Array.isArray(parties) && parties.length > 0) {
      return parties.map((p) => p.name);
    }
    return DEFAULT_PARTY_NAMES;
  }, [state?.politicalParties]);

  const activeParty = resolvePoliticalParty(state?.politicalParties, usa.rulingParty);
  const partyPrefs = c.partyPreferences || {
    name: activeParty.name,
    politicalAlignment: activeParty.politicalAlignment,
    platformSummary: activeParty.platformSummary,
    baseTaxLevel: activeParty.baseTaxLevel ?? 0.24,
    incomeTaxPreference: activeParty.incomeTaxPreference,
    corporateTaxRate: activeParty.corporateTaxRate,
    capitalGainsTaxRate: activeParty.capitalGainsTaxRate ?? 0.20,
    salesTaxPreference: activeParty.salesTaxPreference,
    workerShareOfGdp: activeParty.workerShareOfGdp,
    taxDistributionMode: activeParty.taxDistributionMode ?? 0.62,
    infrastructureInvestmentShare: activeParty.infrastructureInvestmentShare,
    educationGovernanceShare: activeParty.educationGovernanceShare,
    deficitTargetAsPercentOfGdp: activeParty.deficitTargetAsPercentOfGdp,
    budgetAsPercentOfGdp: activeParty.budgetAsPercentOfGdp,
  };
  const policyProg = c.policyProgression || {
    literacyDelta: 0,
    infrastructureDelta: 0,
    urbanisationDelta: 0,
    sentimentDelta: 0,
    tfpDelta: 0,
    equalityDelta: 0,
    neglectedCount: 0,
    neglectMultiplier: 1.0,
    policyBudgetAdjustmentPct: 0,
    policies: usa.enactedPolicies || cloneDefaultPolicies(activeParty.name),
  };
  const enactedPolicies =
    usa.enactedPolicies || policyProg.policies || cloneDefaultPolicies(activeParty.name);
  const socialEffects = c.socialPolicyEval || {
    humanRightsIndex: 48,
    civicObligationIndex: 56,
    socialSolBonus: 0,
    equalityBonus: 0,
    stemInnovationBonus: 0,
    socialPolicies: activeParty.socialPolicies,
  };
  const socialPolicies =
    usa.socialPolicies ||
    socialEffects.socialPolicies ||
    activeParty.socialPolicies ||
    cloneDefaultSocialPolicies(activeParty.name);
  const startingBaseline = usa.startingBaseline || c.startingBaseline || {
    literacyRate: 0.92,
    infrastructureEfficiency: 0.82,
    urbanisationIndex: 0.83,
    consumerSentiment: 65,
    kFactorScaler: 1500,
    incomeEqualityIndex: 0.615,
    publicDebt: 34500000000000,
  };

  const effectiveBaseTax = Number(
    usa.baseTaxLevel ?? c.baseTaxLevel ?? partyPrefs.baseTaxLevel ?? 0.24
  );
  const effectiveTaxMode = Number(
    usa.taxDistributionMode ?? c.taxDistributionMode ?? partyPrefs.taxDistributionMode ?? 0.62
  );
  const bellCurveTax = c.bellCurveTaxIncidence || {};
  const govDiag = c.governanceDiagnostics || { explanations: {}, maluses: {}, totals: {} };
  const solBreakdown = c.solBreakdown || {};
  const correlatedRates = useMemo(
    () => computeTaxRatesFromPosture(effectiveBaseTax, effectiveTaxMode),
    [effectiveBaseTax, effectiveTaxMode]
  );

  const effectiveIncomeTax = Number(
    c.incomeTax ?? correlatedRates.incomeTax ?? partyPrefs.incomeTaxPreference ?? 0.28
  );
  const effectiveCorpTax = Number(
    c.corporateTax ?? correlatedRates.corporateTax ?? partyPrefs.corporateTaxRate ?? 0.25
  );
  const effectiveCapGainsTax = Number(
    c.capitalGainsTax ?? correlatedRates.capitalGainsTax ?? partyPrefs.capitalGainsTaxRate ?? 0.20
  );
  const effectiveSalesTax = Number(
    c.salesTax ?? correlatedRates.salesTax ?? partyPrefs.salesTaxPreference ?? 0.06
  );
  const effectiveWorkerShare = Number(c.workerShareOfGdp ?? partyPrefs.workerShareOfGdp ?? 0.55);
  const effectiveBudgetPct = Number(c.stateBudgetPercent ?? partyPrefs.budgetAsPercentOfGdp ?? 0.22);
  const actualFiscalBalancePct = Number(
    c.fiscalBalancePctOfGdp ??
      (Number(c.aggregateGdp || 0) > 0
        ? (Number(c.netBudgetBalance || 0) / (Number(c.aggregateGdp || 1) / 4))
        : partyPrefs.deficitTargetAsPercentOfGdp ?? -0.032)
  );

  const totalGdp = Math.max(1, Number(c.aggregateGdp || 1));
  const agriShare = (Number(c.agriculturalGdp || 0) / totalGdp) * 100;
  const indShare = (Number(c.industryGdp || 0) / totalGdp) * 100;
  const hospShare = (Number(c.hospitalityGdp || 0) / totalGdp) * 100;
  const officeShare = (Number(c.officeGdp || 0) / totalGdp) * 100;

  const forecast = c.forecast || {};
  const annualGrowthPct = Number(
    forecast.finalGrowth ?? c.annualRealGdpGrowth ?? 2.4
  );
  const projectedGdp1Y = totalGdp * (1 + annualGrowthPct / 100);
  const gdpPerWorker =
    (c.effectiveWorkingPops || 0) > 0
      ? totalGdp / c.effectiveWorkingPops
      : 0;

  const treasuryVal = Number(
    usa.treasuryBalance ?? c.treasuryBalance ?? 0
  );
  const currentDebt = Number(usa.publicDebt ?? c.publicDebt ?? 34500000000000);
  const currentDebtInTrillions = Number((currentDebt / 1e12).toFixed(2));
  const debtToGdpRatio = Number(
    c.debtToGdpRatio ?? (totalGdp > 0 ? (currentDebt / totalGdp) * 100 : 127.7)
  );

  const [editingDebtModal, setEditingDebtModal] = useState(false);
  const [debtInputVal, setDebtInputVal] = useState(currentDebtInTrillions.toString());

  useEffect(() => {
    setDebtInputVal(currentDebtInTrillions.toString());
  }, [currentDebtInTrillions]);

  return (
    <div className="space-y-6">
      {/* Top KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span>US Aggregate GDP</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCompactCurrency(c.aggregateGdp || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Per Worker:</span>
            <span className="text-emerald-300 font-mono">
              {formatCompactCurrency(gdpPerWorker)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span>Standard of Living</span>
            <Award className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {Number(c.sol || 0).toFixed(1)}{" "}
            <span className="text-xs font-normal text-blue-400">/ 50.0</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Gov Trajectory Agg:</span>
            <span className="text-blue-300 font-mono">
              {Number(
                solBreakdown.govCompositePct ??
                  (Number(c.sol || 0) / 50) * 100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span>US Workforce</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {formatCompactNumber(c.effectiveWorkingPops || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Unemployment:</span>
            <span className="text-indigo-300 font-mono">
              {((c.unemploymentRate || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg relative group">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <span>Federal Debt</span>
              <span
                className={`text-[10px] font-mono px-1 rounded font-semibold ${
                  debtToGdpRatio > 120
                    ? "bg-rose-500/20 text-rose-300"
                    : debtToGdpRatio > 80
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {debtToGdpRatio.toFixed(0)}% GDP
              </span>
            </span>
            <div className="flex items-center gap-1">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditingDebtModal(true)}
                  title="Manually edit starting Federal Debt"
                  className="opacity-75 hover:opacity-100 p-0.5 rounded text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <Landmark className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 flex items-center justify-between">
            <span>{formatCompactCurrency(currentDebt)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Treasury:</span>
            <span
              className={`font-mono ${
                treasuryVal >= 0 ? "text-amber-300" : "text-rose-400"
              }`}
            >
              {formatCompactCurrency(treasuryVal)}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span>Inflation & Gini</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {((c.inflationRate || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Equality / Gini:</span>
            <span className="text-purple-300 font-mono">
              {((c.incomeEqualityIndex ?? 0.613) * 100).toFixed(1)}% ({Number(c.giniCoefficient || 0.387).toFixed(3)})
            </span>
          </div>
        </div>

        <div className="bg-slate-900/75 border border-slate-800/90 rounded-xl p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
            <span>1-Year GDP Outlook</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono flex items-center gap-1">
            {annualGrowthPct >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
            {annualGrowthPct >= 0 ? "+" : ""}
            {annualGrowthPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Proj 4Q GDP:</span>
            <span className="text-cyan-200 font-mono">
              {formatCompactCurrency(projectedGdp1Y)}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left (US Map & 50 States) | Right (Macroeconomic Cabinet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive US Map, State Dossier, and 50 States Registry */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive US ADM1 Choropleth Map */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    United States Interactive Choropleth Map (50 States & Endowments)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Click any state on the map or table below to inspect its regional GDP, workforce, natural resources, and services endowments.
                  </p>
                </div>
              </div>
              {selectedState && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/40 text-xs font-semibold text-blue-300">
                  Selected: {selectedState.name} ({selectedState.id})
                </span>
              )}
            </div>

            <CountryAdm1Map
              selectedSubdivision={selectedStateName}
              onSelectSubdivision={(name) => {
                if (name) setSelectedStateName(name);
              }}
            />
          </div>

          {/* Selected State Dossier Card */}
          {selectedState && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">
                      {selectedState.name}{" "}
                      <span className="text-xs font-mono text-slate-400">
                        [{selectedState.id}]
                      </span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedState.region}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Capital:{" "}
                    <span className="text-slate-200 font-medium">
                      {selectedState.capital}
                    </span>{" "}
                    • Specialization:{" "}
                    <span className="text-blue-300 font-medium">
                      {selectedState.role}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      State GDP Share
                    </div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {formatCompactCurrency(selectedState.stateGdp)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {(selectedState.gdpShare * 100).toFixed(2)}% of US Output
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      State Workforce
                    </div>
                    <div className="text-base font-bold text-indigo-300 font-mono">
                      {formatCompactNumber(selectedState.statePops)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {(selectedState.popShare * 100).toFixed(2)}% of US Labor
                    </div>
                  </div>
                </div>
              </div>

              {/* State Natural Resources & Services Endowments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Natural Resource Endowments</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Avg: {selectedState.geo?.compositeScore || 0}/100
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      {
                        label: "Hydrocarbons (Oil & Gas)",
                        val: selectedState.geo?.hydrocarbonIndex || 0,
                        raw: selectedState.geo?.rawHydrocarbonIndex || 0,
                        icon: Droplets,
                        color: "bg-amber-500",
                      },
                      {
                        label: "Critical Minerals & Mining",
                        val: selectedState.geo?.mineralIndex || 0,
                        raw: selectedState.geo?.rawMineralIndex || 0,
                        icon: Pickaxe,
                        color: "bg-purple-500",
                      },
                      {
                        label: "Arable Land & Agriculture",
                        val: selectedState.geo?.arableLandIndex || 0,
                        raw: selectedState.geo?.rawArableLandIndex || 0,
                        icon: Wheat,
                        color: "bg-emerald-500",
                      },
                      {
                        label: "Ports & Navigable Waterways",
                        val: selectedState.geo?.logisticsWaterwayIndex || 0,
                        raw: selectedState.geo?.rawLogisticsWaterwayIndex || 0,
                        icon: Anchor,
                        color: "bg-cyan-500",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <item.icon className="w-3 h-3 text-slate-400" />
                            {item.label}
                          </span>
                          <span className="font-mono text-slate-200">
                            {item.val}/100
                            {item.raw > item.val && (
                              <span className="text-[10px] text-amber-400/90 ml-1">
                                (Base {item.raw})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${Math.min(100, item.val)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Services & Knowledge Capital</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Avg: {selectedState.srv?.compositeServicesScore || 0}/100
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      {
                        label: "Digital & Cloud Infrastructure",
                        val: selectedState.srv?.digitalConnectivityIndex || 0,
                        raw: selectedState.srv?.rawDigitalConnectivityIndex || 0,
                        icon: Cpu,
                        color: "bg-indigo-500",
                      },
                      {
                        label: "Capital Markets & Finance",
                        val: selectedState.srv?.financialDepthIndex || 0,
                        raw: selectedState.srv?.rawFinancialDepthIndex || 0,
                        icon: Landmark,
                        color: "bg-emerald-500",
                      },
                      {
                        label: "STEM & University Talent",
                        val: selectedState.srv?.humanCapitalIndex || 0,
                        raw: selectedState.srv?.rawHumanCapitalIndex || 0,
                        icon: Briefcase,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Hospitality, Tourism & Amenities",
                        val: selectedState.srv?.consumerAmenityIndex || 0,
                        raw: selectedState.srv?.rawConsumerAmenityIndex || 0,
                        icon: Building2,
                        color: "bg-pink-500",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-slate-300 flex items-center gap-1.5">
                            <item.icon className="w-3 h-3 text-slate-400" />
                            {item.label}
                          </span>
                          <span className="font-mono text-slate-200">
                            {item.val}/100
                            {item.raw > item.val && (
                              <span className="text-[10px] text-amber-400/90 ml-1">
                                (Base {item.raw})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${Math.min(100, item.val)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 50 States & Territories Registry Table */}
          <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  US States & Territories Economic Registry ({filteredStates.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Filter by resource or service specialization and click any state to synchronize with the map.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state, capital, region..."
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="gdp">Sort: State GDP</option>
                  <option value="pops">Sort: Workforce</option>
                  <option value="energy">Sort: Oil & Gas</option>
                  <option value="minerals">Sort: Minerals</option>
                  <option value="agriculture">Sort: Agriculture</option>
                  <option value="tech">Sort: High-Tech</option>
                  <option value="finance">Sort: Finance</option>
                  <option value="name">Sort: Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { id: "all", label: "All (56)" },
                { id: "states", label: "50 States & DC" },
                { id: "territories", label: "Territories" },
                { id: "energy", label: "Energy Hubs" },
                { id: "minerals", label: "Mining & Minerals" },
                { id: "agriculture", label: "Agribusiness Belt" },
                { id: "tech", label: "High-Tech Hubs" },
                { id: "finance", label: "Financial Centers" },
                { id: "hospitality", label: "Tourism & Hospitality" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStateFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    stateFilter === pill.id
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950/90 text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">State</th>
                    <th className="py-2 px-2">Region</th>
                    <th className="py-2 px-2 text-right">State GDP</th>
                    <th className="py-2 px-2 text-right">Workforce</th>
                    <th className="py-2 px-2 text-center">Res. Score</th>
                    <th className="py-2 px-3 text-center">Srv. Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStates.map((st) => {
                    const isSelected = st.name === selectedStateName;
                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStateName(st.name)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-600/20 text-white"
                            : "hover:bg-slate-800/50 text-slate-300"
                        }`}
                      >
                        <td className="py-2 px-3 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {st.id}
                            </span>
                            <span>{st.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-slate-400 text-[11px]">
                          {st.region}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-300">
                          {formatCompactCurrency(st.stateGdp)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-indigo-300">
                          {formatCompactNumber(st.statePops)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-amber-300">
                          {st.geo?.compositeScore || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-cyan-300">
                          {st.srv?.compositeServicesScore || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: US Macroeconomic & Fiscal Cabinet */}
        <div className="lg:col-span-5 space-y-5">
          {/* 4-Sector GDP Composition Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  US 4-Sector GDP Composition
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Services Agglomeration:{" "}
                {Number(
                  c.servicesEvaluation?.agglomerationMultiplier || 1.15
                ).toFixed(2)}
                x
              </span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 mb-3">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.max(2, agriShare)}%` }}
                title="Agriculture & Extraction"
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${Math.max(2, indShare)}%` }}
                title="Industry & Manufacturing"
              />
              <div
                className="bg-pink-500 h-full"
                style={{ width: `${Math.max(2, hospShare)}%` }}
                title="Hospitality, Retail & Tourism"
              />
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${Math.max(2, officeShare)}%` }}
                title="Corporate, Finance & Tech Services"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Agriculture & Mining
                </span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {formatCompactCurrency(c.agriculturalGdp || 0)}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Manufacturing & Ind.
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {formatCompactCurrency(c.industryGdp || 0)}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  Hospitality & Retail
                </span>
                <span className="font-mono text-pink-300 font-semibold">
                  {formatCompactCurrency(c.hospitalityGdp || 0)}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Finance & Tech Srv.
                </span>
                <span className="font-mono text-indigo-300 font-semibold">
                  {formatCompactCurrency(c.officeGdp || 0)}
                </span>
              </div>
            </div>

            {/* Aggregate Demand (Y = C + I + G + NX) Breakdown */}
            {c.aggregateDemand && (
              <div className="mt-4 pt-3.5 border-t border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold text-white">
                      {canEdit
                        ? "Aggregate Demand Identity (Y = C + I + G + NX)"
                        : "National Output Breakdown"}
                    </span>
                  </div>
                  {canEdit && (
                    <span className="text-[11px] font-mono text-cyan-300">
                      AD Multiplier: {Number(c.aggregateDemand.adMultiplier || 1).toFixed(3)}x
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-950/75 border border-slate-800/90 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                      <span>Consumption (C)</span>
                      <span className="text-cyan-300 font-mono">
                        {Number(c.aggregateDemand.consumptionShare || 68).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      {formatCompactCurrency(c.aggregateDemand.consumption || 0)}
                    </div>
                    {forecast.adGrowthBreakdown && (
                      <div className="text-[10px] font-mono text-emerald-300 mt-0.5">
                        Growth: {forecast.adGrowthBreakdown.consumptionGrowth >= 0 ? "+" : ""}
                        {Number(forecast.adGrowthBreakdown.consumptionGrowth).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/75 border border-slate-800/90 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                      <span>Investment (I)</span>
                      <span className="text-blue-300 font-mono">
                        {Number(c.aggregateDemand.investmentShare || 18).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      {formatCompactCurrency(c.aggregateDemand.investment || 0)}
                    </div>
                    {forecast.adGrowthBreakdown && (
                      <div className="text-[10px] font-mono text-blue-300 mt-0.5">
                        Growth: {forecast.adGrowthBreakdown.investmentGrowth >= 0 ? "+" : ""}
                        {Number(forecast.adGrowthBreakdown.investmentGrowth).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/75 border border-slate-800/90 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                      <span>Govt Spending (G)</span>
                      <span className="text-amber-300 font-mono">
                        {Number(c.aggregateDemand.governmentShare || 17).toFixed(1)}%
                      </span>
                    </div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      {formatCompactCurrency(c.aggregateDemand.governmentSpending || 0)}
                    </div>
                    {forecast.adGrowthBreakdown && (
                      <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                        Growth: {forecast.adGrowthBreakdown.governmentGrowth >= 0 ? "+" : ""}
                        {Number(forecast.adGrowthBreakdown.governmentGrowth).toFixed(2)}%
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/75 border border-slate-800/90 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                      <span>Net Exports (NX)</span>
                      <span
                        className={`font-mono ${
                          Number(c.aggregateDemand.netExportsShare || 0) >= 0
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {Number(c.aggregateDemand.netExportsShare || -3).toFixed(1)}%
                      </span>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm mt-0.5 ${
                        Number(c.aggregateDemand.netExports || 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {formatCompactCurrency(c.aggregateDemand.netExports || 0)}
                    </div>
                    {forecast.adGrowthBreakdown && (
                      <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                        Growth: {forecast.adGrowthBreakdown.netExportsGrowth >= 0 ? "+" : ""}
                        {Number(forecast.adGrowthBreakdown.netExportsGrowth).toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* US Macroeconomic, Party Fiscal Mandate & Policy Governance Cabinet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {canEdit ? (
                  <Sliders className="w-4 h-4 text-blue-400" />
                ) : (
                  <Eye className="w-4 h-4 text-cyan-400" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {canEdit
                      ? "US Macroeconomic & Fiscal Policy Cabinet"
                      : "US Governing Platform & Economic Trajectory"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {canEdit
                      ? "Ruling party sets fiscal & infrastructure targets; enact policies below to shape governance over time."
                      : "Party fiscal mandate, Fed interest rate, active legislation, and governance progress since Q1."}
                  </p>
                </div>
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {onResetScenario && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Reset the United States simulation to start date (2025-01-01, Q1) and initial baseline conditions?"
                          )
                        ) {
                          onResetScenario();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset simulation to initial start date and conditions"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Baseline
                    </button>
                  )}
                  <button
                    onClick={resetOverrides}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Restore party baseline rates and default Q1 governance metrics"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore Party Defaults
                  </button>
                </div>
              )}
            </div>

            {/* Party Fiscal & Policy Posture (Party in Power Determined by Election Forecast & CNN Map) */}
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="space-y-1 flex-1 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Party Fiscal &amp; Policy Posture
                    </span>
                    <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                      {activeParty.name}
                    </span>
                    {partyPrefs.politicalAlignment && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {partyPrefs.politicalAlignment}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Federalism: {(FEDERALISM_POLICY_CATALOG[activeParty.federalismPolicy || "moderate"] || FEDERALISM_POLICY_CATALOG.moderate).shortLabel}
                    </span>
                  </div>
                  {(partyPrefs.platformSummary || activeParty.platformSummary) && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {partyPrefs.platformSummary || activeParty.platformSummary}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span>
                      Ruling party in power is determined by the winner of the{" "}
                      <button
                        type="button"
                        onClick={() => onOpenElectionsForecast?.()}
                        className="text-sky-300 hover:text-sky-200 underline cursor-pointer font-semibold"
                      >
                        Election Forecast &amp; CNN Map
                      </button>
                      {state?.electionForecast?.electoralStandings?.[0] && (
                        <>
                          {" "}
                          (Current leader:{" "}
                          <span className="text-white font-semibold">
                            {state.electionForecast.electoralStandings[0].name}
                          </span>{" "}
                          · {state.electionForecast.electoralStandings[0].ev} EV)
                        </>
                      )}
                      .
                    </span>
                    {canEdit &&
                      onRunElection &&
                      state?.electionForecast?.electoralStandings?.[0]?.name &&
                      state.electionForecast.electoralStandings[0].name !== activeParty.name && (
                        <button
                          type="button"
                          onClick={() =>
                            onRunElection({
                              inaugurateWinner: true,
                              electionType: "Electoral Mandate Sync",
                            })
                          }
                          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-semibold cursor-pointer"
                        >
                          Seat CNN Map Winner ({state.electionForecast.electoralStandings[0].name})
                        </button>
                      )}
                  </div>
                </div>
                {onOpenPartyStudio && (
                  <button
                    type="button"
                    onClick={() => onOpenPartyStudio()}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    <Edit2 className="w-3 h-3" />
                    Open Party Studio
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Active Statutory Tax Profile & Fatigue / Corruption Summary */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Base Tax</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5">
                    {(effectiveBaseTax * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Income Tax</div>
                  <div className="font-mono font-bold text-sky-300 mt-0.5">
                    {(effectiveIncomeTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Corp Tax</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5">
                    {(effectiveCorpTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Cap Gains</div>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5">
                    {(effectiveCapGainsTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Sales / VAT</div>
                  <div className="font-mono font-bold text-amber-300 mt-0.5">
                    {(effectiveSalesTax * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-900/75 border border-slate-800/80 rounded-lg p-2">
                  <div className="text-[9px] text-slate-400">Gov Fatigue</div>
                  <div
                    className={`font-mono font-bold mt-0.5 ${
                      Number(c.governmentFatigue ?? 0) >= 40
                        ? "text-rose-300"
                        : Number(c.governmentFatigue ?? 0) >= 20
                        ? "text-amber-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {Number(c.governmentFatigue ?? 0).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Bell Curve Visualization (Read-Only Summary) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/70">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-400" />
                    Tax Burden Bell Curve: {bellCurveTax.skewLabel || "Modal incidence"}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    Mode: P{Math.round(effectiveTaxMode * 100)}
                  </span>
                </div>
                <TaxBellCurveSvg
                  curvePoints={bellCurveTax.curvePoints}
                  mode={effectiveTaxMode}
                  skewDirection={bellCurveTax.skewDirection}
                />
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="bg-slate-900/70 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-400">Low Tax:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {((bellCurveTax.cohortTaxBurdens?.lowIncome ?? 0.2) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/70 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-400">Mid Tax:</span>
                    <span className="font-mono font-bold text-blue-300">
                      {((bellCurveTax.cohortTaxBurdens?.middleClass ?? 0.38) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/70 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-400">Top Tax:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {((bellCurveTax.cohortTaxBurdens?.upperClass ?? 0.44) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Active Core Acts & Social Charter Summary */}
              <div className="pt-2 border-t border-slate-800/70 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span className="font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Active Policy &amp; Charter Stances
                  </span>
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="text-sky-300">
                      UDHR: {Math.round(Number(socialEffects.humanRightsIndex ?? 48))}/100
                    </span>
                    <span className="text-amber-300">
                      Duty: {Math.round(Number(socialEffects.civicObligationIndex ?? 56))}/100
                    </span>
                    <span
                      className={
                        Number(socialEffects.corruptionIndex ?? 20) >= 40
                          ? "text-rose-300 font-bold"
                          : "text-emerald-300"
                      }
                    >
                      Corruption: {Math.round(Number(socialEffects.corruptionIndex ?? 20))}/100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {POLICY_CATALOG.map((spec) => {
                    const entry = enactedPolicies[spec.id] || {
                      enacted: true,
                      funding: "standard",
                    };
                    const tierMeta = FUNDING_TIERS[entry.funding] || FUNDING_TIERS.standard;
                    return (
                      <div
                        key={spec.id}
                        className="bg-slate-900/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 text-[10px]"
                      >
                        <span className="text-slate-200 font-medium truncate">
                          {spec.shortName}
                        </span>
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded font-semibold ${
                            !entry.enacted
                              ? "bg-rose-500/15 text-rose-300"
                              : entry.funding === "underfunded"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {entry.enacted ? tierMeta.label : "Repealed"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {onOpenPartyStudio && (
                  <button
                    type="button"
                    onClick={() => onOpenPartyStudio()}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modify Taxes, Core Acts &amp; Social Charter in Party Studio
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Monetary Policy & Sovereign Debt */}
            <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3.5 space-y-3.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-semibold">
                      Federal Reserve Interest Rate
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Independent central bank monetary stance
                    </div>
                  </div>
                  <span className="font-mono text-blue-300 font-bold text-sm">
                    {(Number(usa.centralBankRate ?? 0.045) * 100).toFixed(2)}%
                  </span>
                </div>
                {canEdit ? (
                  <BufferedRangeSlider
                    min={0.0}
                    max={0.15}
                    step={0.0025}
                    value={Number(usa.centralBankRate ?? 0.045)}
                    disabled={!canEdit}
                    onCommit={(num) => updatePolicy({ centralBankRate: num })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                ) : (
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (Number(usa.centralBankRate ?? 0.045) / 0.15) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        {canEdit ? "Starting Federal Public Debt" : "Federal Public Debt"}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Actual Balance:{" "}
                        <span
                          className={`font-mono font-semibold ${
                            actualFiscalBalancePct >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {actualFiscalBalancePct >= 0 ? "+" : ""}
                          {(actualFiscalBalancePct * 100).toFixed(2)}% GDP
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-300 text-sm">
                      ${currentDebtInTrillions.toFixed(2)}T
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {debtToGdpRatio.toFixed(1)}% of GDP
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        { label: "$34.5T", val: 34.5 },
                        { label: "$25.0T", val: 25.0 },
                        { label: "$15.0T", val: 15.0 },
                        { label: "$0T", val: 0.0 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => updatePolicy({ publicDebt: Math.round(p.val * 1e12) })}
                          className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingDebtModal(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Edit2 className="w-3 h-3 text-rose-400" />
                      Set Baseline ($T)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Good Governance & Structural Progression (From Q1 Starting Baseline — Sliderless) */}
            <div className="border-t border-slate-800 pt-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  Good Governance Trajectory (From Q1 Start)
                </span>
                <span className="text-[10px] text-slate-500">
                  Evolved by enacted policies
                </span>
              </div>

              {(policyProg.neglectedCount || 0) >= 2 && (
                <div className="bg-rose-500/15 border border-rose-500/40 rounded-lg px-3 py-2 text-[11px] text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Compounding Institutional Neglect ({policyProg.neglectMultiplier}x Decay):</span>{" "}
                    {policyProg.neglectedCount} core acts are underfunded or repealed, accelerating structural erosion across GDP growth, equality, and workforce capability.
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {[
                  {
                    key: "literacy",
                    label: "Workforce Literacy & Education",
                    current: Number(usa.literacyRate ?? c.literacyRate ?? 0.92),
                    start: Number(startingBaseline.literacyRate ?? 0.92),
                    delta: Number(policyProg.literacyDelta ?? 0),
                    min: 0.4,
                    max: 1.0,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.literacy,
                    malus: govDiag.maluses?.literacy,
                  },
                  {
                    key: "infrastructure",
                    label: "Infrastructure & Logistics",
                    current: Number(
                      usa.infrastructureEfficiency ?? c.infrastructureEfficiency ?? 0.82
                    ),
                    start: Number(startingBaseline.infrastructureEfficiency ?? 0.82),
                    delta: Number(policyProg.infrastructureDelta ?? 0),
                    min: 0.35,
                    max: 1.0,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.infrastructure,
                    malus: govDiag.maluses?.infrastructure,
                  },
                  {
                    key: "urbanisation",
                    label: "Urban Agglomeration Rate",
                    current: Number(usa.urbanisationIndex ?? c.urbanisationIndex ?? 0.83),
                    start: Number(startingBaseline.urbanisationIndex ?? 0.83),
                    delta: Number(policyProg.urbanisationDelta ?? 0),
                    min: 0.35,
                    max: 1.0,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.urbanisation,
                    malus: govDiag.maluses?.urbanisation,
                  },
                  {
                    key: "sentiment",
                    label: "Household Consumer Sentiment",
                    current: Number(usa.consumerSentiment ?? c.consumerConfidence ?? 65),
                    start: Number(startingBaseline.consumerSentiment ?? 65),
                    delta: Number(policyProg.sentimentDelta ?? 0),
                    min: 20,
                    max: 115,
                    fmt: (v) => `${v.toFixed(1)} idx`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}/qtr`,
                    explanation: govDiag.explanations?.sentiment,
                    malus: govDiag.maluses?.sentiment,
                  },
                  {
                    key: "productivity",
                    label: "Total Factor Productivity (K-Factor)",
                    current: Number(usa.kFactorScaler ?? 1500),
                    start: Number(startingBaseline.kFactorScaler ?? 1500),
                    delta: Number(policyProg.tfpDelta ?? 0),
                    min: 600,
                    max: 3500,
                    fmt: (v) => `${(v / 1500).toFixed(2)}x (${Math.round(v)})`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${Math.round(d)}/qtr`,
                    explanation: govDiag.explanations?.productivity,
                    malus: govDiag.maluses?.productivity,
                  },
                  {
                    key: "equality",
                    label: "Income Equality Index (1 - Gini)",
                    current: Number(c.incomeEqualityIndex ?? 0.615),
                    start: Number(startingBaseline.incomeEqualityIndex ?? 0.615),
                    delta: Number(policyProg.equalityDelta ?? 0),
                    min: 0.32,
                    max: 0.78,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.equality,
                    malus: govDiag.maluses?.equality,
                  },
                  {
                    key: "racialEquality",
                    label: "Racial Equality & Civil Inclusion",
                    current: Number(usa.racialEqualityIndex ?? c.racialEqualityIndex ?? 0.68),
                    start: Number(startingBaseline.racialEqualityIndex ?? 0.68),
                    delta: Number(policyProg.racialEqualityDelta ?? 0),
                    min: 0.25,
                    max: 1.0,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.racialEquality,
                    malus: govDiag.maluses?.racialEquality,
                  },
                  {
                    key: "crimeControl",
                    label: "Public Safety & Crime Control",
                    current: Number(usa.crimeControlIndex ?? c.crimeControlIndex ?? 0.74),
                    start: Number(startingBaseline.crimeControlIndex ?? 0.74),
                    delta: Number(policyProg.crimeControlDelta ?? 0),
                    min: 0.20,
                    max: 1.0,
                    fmt: (v) => `${(v * 100).toFixed(1)}%`,
                    fmtDelta: (d) => `${d >= 0 ? "+" : ""}${(d * 100).toFixed(2)}%/qtr`,
                    explanation: govDiag.explanations?.crimeControl,
                    malus: govDiag.maluses?.crimeControl,
                  },
                ].map((metric) => {
                  const pctFill = Math.min(
                    100,
                    Math.max(4, ((metric.current - metric.min) / (metric.max - metric.min)) * 100)
                  );
                  const isNegativeDelta = metric.delta < 0;
                  return (
                    <div
                      key={metric.label}
                      className={`rounded-lg p-2.5 space-y-1.5 border ${
                        isNegativeDelta
                          ? "bg-rose-950/20 border-rose-500/30"
                          : "bg-slate-950/60 border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-200 font-semibold">{metric.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`font-bold ${
                              metric.malus?.active
                                ? "text-amber-300"
                                : isNegativeDelta
                                ? "text-rose-300"
                                : "text-emerald-300"
                            }`}
                          >
                            {metric.fmt(metric.current)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              metric.delta > 0
                                ? "bg-emerald-500/15 text-emerald-300"
                                : metric.delta < 0
                                ? "bg-rose-500/25 text-rose-200 border border-rose-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {metric.fmtDelta(metric.delta)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isNegativeDelta
                              ? "bg-rose-500/85"
                              : metric.malus?.active
                              ? "bg-amber-400/85"
                              : "bg-emerald-500/85"
                          }`}
                          style={{ width: `${pctFill}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Q1 Start: {metric.fmt(metric.start)}</span>
                        <span>
                          Net:{" "}
                          {metric.current - metric.start >= 0 ? "+" : ""}
                          {metric.max <= 1
                            ? `${((metric.current - metric.start) * 100).toFixed(2)}%`
                            : (metric.current - metric.start).toFixed(1)}
                        </span>
                      </div>
                      {metric.explanation && (
                        <p className="text-[10px] text-slate-300/90 leading-snug pt-0.5">
                          {metric.explanation}
                        </p>
                      )}
                      {metric.malus?.active && (
                        <div className="bg-amber-500/10 border border-amber-500/35 rounded px-2 py-1 text-[10px] text-amber-200 flex items-start gap-1.5 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              High-Level Malus ({metric.malus.penaltyLabel}):
                            </span>{" "}
                            {metric.malus.detail}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quarterly Fiscal Breakdown & Income Cohorts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Percent className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Quarterly Federal Budget & Trade Summary
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex justify-between">
                  <span className="text-slate-400">Tax Revenues:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatCompactCurrency(
                      (c.stateIncome || 0) - (c.tariffRevenues || 0)
                    )}
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex justify-between">
                  <span className="text-slate-400">Tariff Revenues:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {formatCompactCurrency(c.tariffRevenues || 0)}
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex justify-between">
                  <span className="text-slate-400">Federal Spending:</span>
                  <span className="font-mono text-rose-300 font-semibold">
                    {formatCompactCurrency(c.stateExpenditures || 0)}
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex justify-between">
                  <span className="text-slate-400">Net Trade Balance:</span>
                  <span
                    className={`font-mono font-semibold ${
                      (c.netTradeBalance || 0) >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatCompactCurrency(c.netTradeBalance || 0)}
                  </span>
                </div>
              </div>
            </div>

            {c.cohorts && (
              <div className="border-t border-slate-800 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-white">
                    US Household Income Distribution Cohorts
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Equality: {((c.incomeEqualityIndex ?? 0.615) * 100).toFixed(1)}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Gini: {Number(c.giniCoefficient || 0.387).toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    {
                      key: "lowIncome",
                      data: c.cohorts.lowIncome,
                      color: "text-amber-300",
                    },
                    {
                      key: "middleClass",
                      data: c.cohorts.middleClass,
                      color: "text-blue-300",
                    },
                    {
                      key: "upperClass",
                      data: c.cohorts.upperClass,
                      color: "text-emerald-300",
                    },
                  ].map(({ key, data, color }) =>
                    data ? (
                      <div
                        key={key}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 truncate">
                          {data.name} ({Math.round((data.popShare || 0) * 100)}%)
                        </div>
                        <div
                          className={`font-mono font-bold text-sm mt-0.5 ${color}`}
                        >
                          {formatCompactCurrency(data.averageWage || 0)}/qtr
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          SoL: {Number(data.livingStandard || 0).toFixed(1)} • Tax:{" "}
                          {((data.taxBurden || 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Edit Starting Federal Debt Modal */}
      {editingDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Starting Federal Debt
                  </h3>
                  <p className="text-xs text-slate-400">
                    Set the United States sovereign public debt baseline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDebtModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                National Debt (in Trillions USD)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="150"
                  value={debtInputVal}
                  onChange={(e) => setDebtInputVal(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-2 font-mono text-lg font-bold text-rose-300 focus:outline-none"
                  placeholder="34.50"
                />
                <span className="text-sm font-semibold text-slate-300">Trillion</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Quick Presets:</span>
                {[
                  { label: "$34.5T Baseline", val: 34.5 },
                  { label: "$25.0T (2019)", val: 25.0 },
                  { label: "$15.0T (2012)", val: 15.0 },
                  { label: "$0T (Zero Debt)", val: 0.0 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDebtInputVal(p.val.toString())}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-rose-500/50 transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Projected Debt-to-GDP Ratio:</span>
                  <span className="font-mono text-rose-300 font-semibold">
                    {totalGdp > 0
                      ? `${((((parseFloat(debtInputVal) || 0) * 1e12) / totalGdp) * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Quarterly federal budget balance (+/-) will automatically accumulate onto this sovereign debt ledger.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDebtModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(debtInputVal);
                  if (!isNaN(val) && val >= 0) {
                    updatePolicy({ publicDebt: Math.round(val * 1e12) });
                  }
                  setEditingDebtModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save Debt Baseline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveWorldMap;
