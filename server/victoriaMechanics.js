// Victoria 3-Inspired Socio-Economic, Law, Interest Group, Dynamic Election & World News Engine

export const LAW_CATALOG = {
  governance: {
    label: "Governance & Suffrage",
    options: [
      {
        id: "Autocracy",
        name: "Autocracy",
        desc: "Sovereign rules by decree; no elections. High Authority (+300),Upper Strata clout +50%, low legitimacy from popular movements.",
        authorityBonus: 300,
        allowElections: false,
        upperWeight: 3.0,
        middleWeight: 0.5,
        lowerWeight: 0.05,
        supportedBy: ["Landowners", "Armed Forces"],
        opposedBy: ["Intelligentsia", "Trade Unions"],
      },
      {
        id: "Oligarchy",
        name: "Oligarchy",
        desc: "Power rests with wealthy elites and megacorp directors. High Authority (+200), Capitalist & Aristocrat clout +40%.",
        authorityBonus: 200,
        allowElections: false,
        upperWeight: 2.8,
        middleWeight: 0.8,
        lowerWeight: 0.1,
        supportedBy: ["Industrialists", "Landowners"],
        opposedBy: ["Trade Unions", "Rural Folk"],
      },
      {
        id: "Wealth Voting",
        name: "Wealth Voting",
        desc: "Franchise restricted by property and wealth threshold. Elections empower Industrialists and Petite Bourgeoisie.",
        authorityBonus: 100,
        allowElections: true,
        upperWeight: 3.2,
        middleWeight: 1.6,
        lowerWeight: 0.25,
        supportedBy: ["Industrialists", "Petite Bourgeoisie"],
        opposedBy: ["Trade Unions"],
      },
      {
        id: "Census Suffrage",
        name: "Census Suffrage",
        desc: "Literacy and tax contribution determine voting rights. Balances Middle Strata, Intelligentsia, and Industrialists.",
        authorityBonus: 50,
        allowElections: true,
        upperWeight: 1.8,
        middleWeight: 2.0,
        lowerWeight: 0.75,
        supportedBy: ["Intelligentsia", "Petite Bourgeoisie", "Rural Folk"],
        opposedBy: ["Landowners"],
      },
      {
        id: "Universal Suffrage",
        name: "Universal Suffrage",
        desc: "One person, one vote across all strata. Massively empowers Trade Unions, Rural Folk, and popular coalitions.",
        authorityBonus: 0,
        allowElections: true,
        upperWeight: 1.0,
        middleWeight: 1.2,
        lowerWeight: 1.5,
        supportedBy: ["Trade Unions", "Intelligentsia", "Rural Folk"],
        opposedBy: ["Landowners", "Industrialists"],
      },
      {
        id: "Council Republic",
        name: "Council Republic",
        desc: "Worker syndicates and popular assemblies elect delegates. Boosts Worker Share (+12%) and Trade Union clout.",
        authorityBonus: 50,
        allowElections: true,
        upperWeight: 0.2,
        middleWeight: 1.3,
        lowerWeight: 2.4,
        workerShareBonus: 0.12,
        supportedBy: ["Trade Unions"],
        opposedBy: ["Industrialists", "Landowners", "Petite Bourgeoisie"],
      },
    ],
  },
  economy: {
    label: "Economic System",
    options: [
      {
        id: "Traditionalism",
        name: "Traditionalism",
        desc: "Subsistence & patronage economy. Lower tax efficiency (-15%), Landowners clout +25%.",
        corpGrowthMult: 0.85,
        taxEffMult: 0.85,
        supportedBy: ["Landowners", "Devout"],
        opposedBy: ["Industrialists", "Trade Unions"],
      },
      {
        id: "Agrarianism",
        name: "Agrarianism",
        desc: "Prioritizes agricultural estates and rural output (+20% Agricultural GDP bonus).",
        corpGrowthMult: 0.95,
        agGdpMult: 1.2,
        taxEffMult: 0.95,
        supportedBy: ["Rural Folk", "Landowners"],
        opposedBy: ["Industrialists"],
      },
      {
        id: "Interventionism",
        name: "Interventionism",
        desc: "Balanced mixed economy allowing state subsidies, sovereign equity stakes, and regulated growth.",
        corpGrowthMult: 1.05,
        taxEffMult: 1.0,
        supportedBy: ["Petite Bourgeoisie", "Intelligentsia", "Armed Forces"],
        opposedBy: [],
      },
      {
        id: "Laissez-Faire",
        name: "Laissez-Faire",
        desc: "Unfettered free-market capitalism. +25% Corporate Growth & Valuation, +15% Dividend Efficiency.",
        corpGrowthMult: 1.25,
        divEffBonus: 0.1,
        taxEffMult: 1.0,
        supportedBy: ["Industrialists"],
        opposedBy: ["Trade Unions", "Rural Folk"],
      },
      {
        id: "Command Economy",
        name: "Command Economy",
        desc: "Centralized state planning. +20% State Tax & Dividend capture, +15% Authority, lower private hype.",
        corpGrowthMult: 0.95,
        taxEffMult: 1.2,
        authorityBonus: 100,
        supportedBy: ["Armed Forces", "Trade Unions"],
        opposedBy: ["Industrialists", "Landowners"],
      },
      {
        id: "Cooperative Ownership",
        name: "Cooperative Ownership",
        desc: "Worker-owned enterprises distribute profits directly to wages (+15% Worker GDP Share, +2.5 Lower Strata SoL).",
        corpGrowthMult: 1.02,
        workerShareBonus: 0.15,
        solBonus: 2.5,
        supportedBy: ["Trade Unions", "Intelligentsia"],
        opposedBy: ["Industrialists", "Landowners"],
      },
    ],
  },
  trade: {
    label: "Trade Policy",
    options: [
      {
        id: "Isolationism",
        name: "Isolationism",
        desc: "Self-reliant closed market. +25% Authority, +15% Domestic Demand, severely restricted external trade.",
        tariffMult: 1.5,
        authorityBonus: 120,
        supportedBy: ["Landowners", "Rural Folk"],
        opposedBy: ["Industrialists", "Intelligentsia"],
      },
      {
        id: "Mercantilism",
        name: "Mercantilism",
        desc: "Export-oriented state trade policy. +15% Export Tariff Revenue efficiency.",
        tariffMult: 1.15,
        supportedBy: ["Petite Bourgeoisie", "Landowners"],
        opposedBy: ["Intelligentsia"],
      },
      {
        id: "Protectionism",
        name: "Protectionism",
        desc: "Shields domestic industries with flexible import tariffs (+20% Tariff Revenues).",
        tariffMult: 1.2,
        supportedBy: ["Petite Bourgeoisie", "Rural Folk", "Trade Unions"],
        opposedBy: ["Industrialists"],
      },
      {
        id: "Free Trade",
        name: "Free Trade",
        desc: "Open global commerce. +18% Trade Competitiveness & Company VGP, lower tariff dependency.",
        tariffMult: 0.75,
        vgpMult: 1.12,
        supportedBy: ["Industrialists", "Intelligentsia"],
        opposedBy: ["Rural Folk", "Petite Bourgeoisie"],
      },
    ],
  },
  taxation: {
    label: "Taxation Structure",
    options: [
      {
        id: "Consumption-Based Taxation",
        name: "Consumption-Based Taxation",
        desc: "Relies on sales & excise taxes. Regressive impact on Lower Strata SoL (-1.2), favored by elites.",
        salesTaxMult: 1.25,
        incomeTaxMult: 0.7,
        lowerSolMod: -1.2,
        supportedBy: ["Landowners", "Industrialists"],
        opposedBy: ["Trade Unions"],
      },
      {
        id: "Per-Capita Taxation",
        name: "Per-Capita Taxation",
        desc: "Flat poll and income levies on working population. Standard early-industrial fiscal model.",
        salesTaxMult: 1.0,
        incomeTaxMult: 1.0,
        lowerSolMod: -0.4,
        supportedBy: ["Petite Bourgeoisie", "Armed Forces"],
        opposedBy: ["Trade Unions"],
      },
      {
        id: "Proportional Taxation",
        name: "Proportional Taxation",
        desc: "Balanced income and corporate taxation scaling with earnings (+10% Fiscal Revenue).",
        salesTaxMult: 1.0,
        incomeTaxMult: 1.1,
        corpTaxMult: 1.1,
        lowerSolMod: 0.5,
        supportedBy: ["Intelligentsia", "Petite Bourgeoisie"],
        opposedBy: ["Landowners"],
      },
      {
        id: "Graduated Taxation",
        name: "Graduated Taxation",
        desc: "Progressive taxation on high incomes and corporate profits. +25% Corporate Tax yield, +1.8 Lower Strata SoL.",
        salesTaxMult: 0.85,
        incomeTaxMult: 1.15,
        corpTaxMult: 1.25,
        lowerSolMod: 1.8,
        supportedBy: ["Trade Unions", "Intelligentsia"],
        opposedBy: ["Industrialists", "Landowners"],
      },
    ],
  },
  policing: {
    label: "Internal Security & Policing",
    options: [
      {
        id: "Gentle Touch",
        name: "Gentle Touch",
        desc: "Minimal state policing. Civil liberties protected (+10 Intelligentsia approval), higher crime multiplier (1.5x).",
        supportedBy: ["Intelligentsia", "Rural Folk"],
        opposedBy: ["Armed Forces", "Petite Bourgeoisie"],
      },
      {
        id: "Beat Cops",
        name: "Beat Cops",
        desc: "Dedicated local police force reducing urban turmoil and crime (0.9x multiplier).",
        supportedBy: ["Petite Bourgeoisie", "Industrialists"],
        opposedBy: [],
      },
      {
        id: "Profiling",
        name: "Profiling",
        desc: "Surveillance & targeted policing (0.75x crime multiplier, +50 Authority, increases Lower Strata radicalism).",
        authorityBonus: 50,
        supportedBy: ["Petite Bourgeoisie", "Armed Forces"],
        opposedBy: ["Intelligentsia", "Trade Unions"],
      },
      {
        id: "Militarized Police",
        name: "Militarized Police",
        desc: "Heavy paramilitary security (0.1x crime multiplier, +120 Authority, suppresses radical turmoil by 40%).",
        authorityBonus: 120,
        supportedBy: ["Armed Forces", "Landowners"],
        opposedBy: ["Intelligentsia", "Trade Unions"],
      },
    ],
  },
  welfare: {
    label: "Healthcare & Welfare",
    options: [
      {
        id: "Private Healthcare",
        name: "Private Healthcare",
        desc: "Market-driven medical care. Low mortality (1%), boosts Upper/Middle Strata SoL (+2.0) & Corporate Services.",
        upperSolMod: 2.0,
        lowerSolMod: 0.2,
        supportedBy: ["Industrialists", "Petite Bourgeoisie"],
        opposedBy: ["Trade Unions"],
      },
      {
        id: "State-run Healthcare",
        name: "State-run Healthcare",
        desc: "Universal public health system. Low mortality (1%), boosts Lower & Middle Strata SoL (+2.2).",
        lowerSolMod: 2.2,
        middleSolMod: 1.5,
        supportedBy: ["Trade Unions", "Intelligentsia", "Devout"],
        opposedBy: ["Industrialists"],
      },
      {
        id: "Euthanasia",
        name: "Austerity / Triage Protocol",
        desc: "Extreme population triage policy from spreadsheet rules (30% mortality base, causes severe radicalism).",
        lowerSolMod: -4.0,
        supportedBy: [],
        opposedBy: ["Devout", "Trade Unions", "Intelligentsia"],
      },
    ],
  },
};

export const INTEREST_GROUP_TEMPLATES = [
  {
    id: "industrialists",
    name: "Industrialists",
    icon: "Factory",
    color: "#f59e0b",
    ideology: "Laissez-Faire & Plutocratic",
    leaderName: "Victor Sterling",
    defaultParty: "Republican",
    strataAffinity: "upper",
  },
  {
    id: "trade_unions",
    name: "Trade Unions",
    icon: "Hammer",
    color: "#ef4444",
    ideology: "Social Democratic & Proletarian",
    leaderName: "Clara Vance",
    defaultParty: "Democratic",
    strataAffinity: "lower",
  },
  {
    id: "intelligentsia",
    name: "Intelligentsia",
    icon: "BookOpen",
    color: "#38bdf8",
    ideology: "Liberal, Reformist & Technocratic",
    leaderName: "Dr. Julian Thorne",
    defaultParty: "Democratic",
    strataAffinity: "middle",
  },
  {
    id: "petite_bourgeoisie",
    name: "Petite Bourgeoisie",
    icon: "Store",
    color: "#a855f7",
    ideology: "Mercantile & Fiscal Conservative",
    leaderName: "Arthur Pendelton",
    defaultParty: "Republican",
    strataAffinity: "middle",
  },
  {
    id: "armed_forces",
    name: "Armed Forces",
    icon: "Shield",
    color: "#64748b",
    ideology: "Jingoist & Patriotic Order",
    leaderName: "Gen. Marcus Vance",
    defaultParty: "Nationalist",
    strataAffinity: "middle",
  },
  {
    id: "landowners",
    name: "Landowners & Gentry",
    icon: "Crown",
    color: "#8b5cf6",
    ideology: "Paternalistic & Traditionalist",
    leaderName: "Lord Edmund Cross",
    defaultParty: "Republican",
    strataAffinity: "upper",
  },
  {
    id: "rural_folk",
    name: "Rural Folk",
    icon: "Wheat",
    color: "#10b981",
    ideology: "Agrarian Populist",
    leaderName: "Hannah Miller",
    defaultParty: "Agrarian",
    strataAffinity: "lower",
  },
  {
    id: "devout",
    name: "Moralist Fellowship",
    icon: "Sparkles",
    color: "#eab308",
    ideology: "Traditional Moralist & Corporatist",
    leaderName: "Prelate Solis",
    defaultParty: "Republican",
    strataAffinity: "lower",
  },
];

export const CONSTRUCTION_BUILDINGS = [
  {
    id: "industrial_complex",
    name: "Heavy Industrial & Steel Complex",
    sector: "Industry & Manufacturing GDP",
    good: "Steel",
    cost: 4500000000,
    daysRequired: 90,
    jobsCreated: 185000,
    desc: "Expands national steel and tooling capacity, employing 185k machinists and boosting Industrialists clout.",
  },
  {
    id: "semiconductor_foundry",
    name: "Advanced Semiconductor & Tech Foundry",
    sector: "Industry & Manufacturing GDP",
    good: "Semi-Conductor",
    cost: 8500000000,
    daysRequired: 120,
    jobsCreated: 140000,
    desc: "Builds high-value silicon wafer fabs, boosting DVGP supply chain output and Intelligentsia clout.",
  },
  {
    id: "agrarian_estates",
    name: "Mechanized Agricultural Estates",
    sector: "Agricultural Sector GDP",
    good: "Grain",
    cost: 2400000000,
    daysRequired: 60,
    jobsCreated: 220000,
    desc: "Increases domestic food security, lowers grain prices for Lower Strata SoL, and empowers Rural Folk.",
  },
  {
    id: "financial_district",
    name: "Sovereign Financial & Bourse Tower",
    sector: "Office & Corporate Services GDP",
    good: "Banking",
    cost: 6200000000,
    daysRequired: 90,
    jobsCreated: 130000,
    desc: "Expands capital markets and corporate services, boosting Middle/Upper Strata SoL and Petite Bourgeoisie.",
  },
  {
    id: "infrastructure_grid",
    name: "National Railway & Power Grid",
    sector: "Infrastructure",
    good: "Electricity",
    cost: 5000000000,
    daysRequired: 90,
    jobsCreated: 110000,
    infraBonus: 0.05,
    desc: "Permanently increases National Infrastructure Efficiency (+5%) and expands power generation.",
  },
  {
    id: "university_academy",
    name: "National Academy of Sciences",
    sector: "Education",
    good: "Tools",
    cost: 3800000000,
    daysRequired: 75,
    jobsCreated: 65000,
    literacyBonus: 0.04,
    desc: "Permanently raises National Literacy Rate (+4%), boosting innovation and Intelligentsia clout.",
  },
];

function addDaysToIso(isoStr, days) {
  const dt = new Date(`${(isoStr || "2025-01-01").split("T")[0]}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) {
    return "2025-01-01";
  }
  dt.setUTCDate(dt.getUTCDate() + Math.round(days));
  return dt.toISOString().split("T")[0];
}

function diffDaysIso(targetIso, currentIso) {
  const t = new Date(`${(targetIso || "2025-01-01").split("T")[0]}T00:00:00Z`).getTime();
  const c = new Date(`${(currentIso || "2025-01-01").split("T")[0]}T00:00:00Z`).getTime();
  if (Number.isNaN(t) || Number.isNaN(c)) return 360;
  return Math.round((t - c) / 86400000);
}

export function getSolTierLabel(solScore) {
  if (solScore < 5) return { label: "Starving", color: "text-rose-500" };
  if (solScore < 10) return { label: "Struggling", color: "text-orange-400" };
  if (solScore < 15) return { label: "Impoverished", color: "text-amber-400" };
  if (solScore < 20) return { label: "Middling", color: "text-yellow-300" };
  if (solScore < 25) return { label: "Secure", color: "text-emerald-300" };
  if (solScore < 30) return { label: "Prosperous", color: "text-emerald-400" };
  if (solScore < 40) return { label: "Affluent", color: "text-cyan-400" };
  return { label: "Lavish", color: "text-purple-400" };
}

export function ensureVictoriaState(state) {
  const curDate = state.timeManager?.crisisDate || state.timeManager?.crisisStartDate || "2025-01-01";

  // Ensure at least 4 distinct ideological parties exist for dynamic multi-party elections
  if (!state.politicalParties || state.politicalParties.length === 0) {
    state.politicalParties = [];
  }
  const existingPartyNames = new Set(state.politicalParties.map((p) => p.name));
  const defaultExtraParties = [
    {
      name: "Social Democratic Front",
      incomeTaxPreference: 0.28,
      salesTaxPreference: 0.12,
      corporateTaxRate: 0.26,
      workerShareOfGdp: 0.52,
      budgetAsPercentOfGdp: 0.24,
      federalisedPolicy: "Federalised",
      localCrimePolicy: "Beat Cops",
      healthcarePolicy: "State-run Healthcare",
    },
    {
      name: "Liberal Reform Alliance",
      incomeTaxPreference: 0.2,
      salesTaxPreference: 0.15,
      corporateTaxRate: 0.18,
      workerShareOfGdp: 0.44,
      budgetAsPercentOfGdp: 0.19,
      federalisedPolicy: "Federalised",
      localCrimePolicy: "Gentle Touch",
      healthcarePolicy: "State-run Healthcare",
    },
    {
      name: "National Sovereignty Union",
      incomeTaxPreference: 0.22,
      salesTaxPreference: 0.22,
      corporateTaxRate: 0.2,
      workerShareOfGdp: 0.36,
      budgetAsPercentOfGdp: 0.25,
      federalisedPolicy: "Confederated",
      localCrimePolicy: "Militarized Police",
      healthcarePolicy: "Private Healthcare",
    },
  ];
  for (const ep of defaultExtraParties) {
    if (!existingPartyNames.has(ep.name)) {
      state.politicalParties.push(ep);
      existingPartyNames.add(ep.name);
    }
  }

  // Ensure Global News Feed & Active Dilemmas
  if (!state.newsFeed || !Array.isArray(state.newsFeed) || state.newsFeed.length === 0) {
    state.newsFeed = [
      {
        id: "news_inaugural_1",
        date: curDate,
        quarter: state.timeManager?.quarterNumber || 1,
        category: "WORLD CHRONICLE",
        headline: "The Grand Ledger Opens: Great Powers Compete for Planetary Hegemony",
        summary:
          "Industrial syndicates, sovereign bourses, and parliamentary coalitions mobilize across Earth and Mars as the new era begins. Markets await fiscal and tariff directives from national capitals.",
        nationName: "Global",
        impact: "All Markets & Interest Groups Active",
      },
      {
        id: "news_inaugural_2",
        date: curDate,
        quarter: state.timeManager?.quarterNumber || 1,
        category: "ELECTION WATCH",
        headline: "Parliamentary Coalitions Prepare for Upcoming National Elections",
        summary:
          "Trade Unions, Industrialists, and the Intelligentsia have begun organizing campaign rallies across major republics. Standard of Living and employment numbers are expected to dominate voter sentiment.",
        nationName: state.nations?.[0]?.name || "USA",
        impact: "Dynamic Election Campaigns Underway",
      },
      {
        id: "news_inaugural_3",
        date: curDate,
        quarter: state.timeManager?.quarterNumber || 1,
        category: "ECONOMIC DISPATCH",
        headline: "Semiconductor & Steel Supply Chains Anchor Global Manufacturing",
        summary:
          "Analysts at the Global Bourse report strong upstream demand for Tools, Steel, and Semi-Conductors. Nations investing in construction sectors and free trade agreements stand to capture export surpluses.",
        nationName: "Global Market",
        impact: "Supply Chain Price Discovery Live",
      },
    ];
  }

  if (!state.activeDilemmas || !Array.isArray(state.activeDilemmas)) {
    const primaryNation = state.nations?.[0];
    state.activeDilemmas = primaryNation
      ? [
          {
            id: "dilemma_initial_1",
            date: curDate,
            nationId: primaryNation.id,
            nationName: primaryNation.name,
            title: "Industrialists Petition for Deregulation & Export Subsidies",
            description: `Captains of industry in ${primaryNation.name} have presented a joint memorandum demanding lower corporate tax burdens and state-backed industrial expansion, while Trade Unions warn that worker living standards must not be sacrificed.`,
            options: [
              {
                label: "Back the Industrial Syndicate (+Industrialists Approval, +Corp Hype)",
                effectSummary: "+4 Industrialists Approval, +3 Consumer Sentiment, -2 Trade Unions Approval",
                type: "FAVOR_INDUSTRIALISTS",
              },
              {
                label: "Enact Worker Wage Protections (+Trade Unions Approval, +Worker Share)",
                effectSummary: "+4 Trade Unions Approval, +3% Worker GDP Share, -2 Industrialists Approval",
                type: "FAVOR_UNIONS",
              },
              {
                label: "Broker a Technocratic Compromise (+Intelligentsia, +Legitimacy)",
                effectSummary: "+3 Intelligentsia Approval, +2% Literacy investment",
                type: "FAVOR_INTELLIGENTSIA",
              },
            ],
          },
        ]
      : [];
  }

  // Ensure per-nation Victoria 3 structures
  const partyNames = state.politicalParties.map((p) => p.name);
  for (let idx = 0; idx < (state.nations || []).length; idx++) {
    const nation = state.nations[idx];

    if (!nation.laws) {
      const isAutocratic =
        nation.name === "China" || nation.name === "Russia" || nation.planet === "Mars";
      nation.laws = {
        governance: isAutocratic ? "Oligarchy" : "Universal Suffrage",
        economy:
          nation.name === "USA" || nation.planet === "Mars"
            ? "Laissez-Faire"
            : nation.name === "China"
            ? "Command Economy"
            : "Interventionism",
        trade: nation.name === "USA" || nation.name === "Japan" ? "Free Trade" : "Protectionism",
        taxation:
          nation.rulingParty === "Democratic" || nation.name === "European Union"
            ? "Graduated Taxation"
            : "Proportional Taxation",
        policing: nation.crimePolicy || "Beat Cops",
        welfare: nation.healthcarePolicy || "State-run Healthcare",
      };
    } else {
      // Keep policing and welfare synced with nation.crimePolicy and nation.healthcarePolicy
      if (nation.crimePolicy) nation.laws.policing = nation.crimePolicy;
      if (nation.healthcarePolicy) nation.laws.welfare = nation.healthcarePolicy;
    }

    if (!nation.interestGroups || !Array.isArray(nation.interestGroups)) {
      nation.interestGroups = INTEREST_GROUP_TEMPLATES.map((tpl, igIdx) => {
        let partyAffiliation = partyNames[0] || "Republican";
        if (tpl.id === "trade_unions" || tpl.id === "rural_folk") {
          partyAffiliation =
            partyNames.find((p) => p.toLowerCase().includes("social") || p.toLowerCase().includes("democrat")) ||
            partyNames[1] ||
            partyNames[0];
        } else if (tpl.id === "intelligentsia") {
          partyAffiliation =
            partyNames.find((p) => p.toLowerCase().includes("liberal") || p.toLowerCase().includes("democrat")) ||
            partyNames[1] ||
            partyNames[0];
        } else if (tpl.id === "armed_forces" || tpl.id === "landowners") {
          partyAffiliation =
            partyNames.find((p) => p.toLowerCase().includes("national") || p.toLowerCase().includes("republican")) ||
            partyNames[0];
        }
        return {
          id: tpl.id,
          name: tpl.name,
          icon: tpl.icon,
          color: tpl.color,
          ideology: tpl.ideology,
          leaderName: tpl.leaderName,
          strataAffinity: tpl.strataAffinity,
          clout: Number((100 / INTEREST_GROUP_TEMPLATES.length).toFixed(1)),
          approval: igIdx < 3 ? 4 : 1,
          inGovernment: igIdx < 3,
          party: partyAffiliation,
        };
      });
    }

    if (!nation.electionState) {
      const intervalDays = 360; // Dynamic elections every 360 days (4 quarters) by default so gameplay is lively
      nation.electionState = {
        electionIntervalDays: intervalDays,
        lastElectionDate: curDate,
        nextElectionDate: addDaysToIso(curDate, intervalDays),
        campaignActive: true,
        totalElectionsHeld: 0,
        partyMomentum: {},
        coalitionParties: [nation.rulingParty || partyNames[0]],
        lastResults: [],
      };
      for (const pName of partyNames) {
        nation.electionState.partyMomentum[pName] = pName === nation.rulingParty ? 12 : 5;
      }
    }

    if (!nation.constructionQueue) {
      nation.constructionQueue = [];
    }

    if (nation.activeLawEnactment === undefined) {
      nation.activeLawEnactment = null;
    }
  }
}

export function getNationLawModifiers(nation) {
  const laws = nation.laws || {};
  const govOpt =
    LAW_CATALOG.governance.options.find((o) => o.id === laws.governance) ||
    LAW_CATALOG.governance.options[4];
  const ecoOpt =
    LAW_CATALOG.economy.options.find((o) => o.id === laws.economy) ||
    LAW_CATALOG.economy.options[2];
  const trdOpt =
    LAW_CATALOG.trade.options.find((o) => o.id === laws.trade) ||
    LAW_CATALOG.trade.options[2];
  const taxOpt =
    LAW_CATALOG.taxation.options.find((o) => o.id === laws.taxation) ||
    LAW_CATALOG.taxation.options[2];
  const polOpt =
    LAW_CATALOG.policing.options.find((o) => o.id === laws.policing) ||
    LAW_CATALOG.policing.options[1];
  const welOpt =
    LAW_CATALOG.welfare.options.find((o) => o.id === laws.welfare) ||
    LAW_CATALOG.welfare.options[1];

  return {
    authorityBonus:
      (govOpt.authorityBonus || 0) +
      (ecoOpt.authorityBonus || 0) +
      (trdOpt.authorityBonus || 0) +
      (polOpt.authorityBonus || 0),
    allowElections: govOpt.allowElections !== false,
    upperWeight: govOpt.upperWeight ?? 1.0,
    middleWeight: govOpt.middleWeight ?? 1.0,
    lowerWeight: govOpt.lowerWeight ?? 1.0,
    workerShareBonus: (govOpt.workerShareBonus || 0) + (ecoOpt.workerShareBonus || 0),
    corpGrowthMult: ecoOpt.corpGrowthMult ?? 1.0,
    agGdpMult: ecoOpt.agGdpMult ?? 1.0,
    divEffBonus: ecoOpt.divEffBonus || 0,
    taxEffMult: ecoOpt.taxEffMult ?? 1.0,
    tariffMult: trdOpt.tariffMult ?? 1.0,
    vgpMult: trdOpt.vgpMult ?? 1.0,
    salesTaxMult: taxOpt.salesTaxMult ?? 1.0,
    incomeTaxMult: taxOpt.incomeTaxMult ?? 1.0,
    corpTaxMult: taxOpt.corpTaxMult ?? 1.0,
    lowerSolMod: (taxOpt.lowerSolMod || 0) + (welOpt.lowerSolMod || 0) + (ecoOpt.solBonus || 0),
    middleSolMod: (welOpt.middleSolMod || 0) + (ecoOpt.solBonus || 0) * 0.5,
    upperSolMod: welOpt.upperSolMod || 0,
  };
}

export function evaluateVictoriaMechanics(state) {
  ensureVictoriaState(state);
  const curDate = state.timeManager?.crisisDate || state.timeManager?.crisisStartDate || "2025-01-01";
  const partyNames = (state.politicalParties || []).map((p) => p.name);

  // 1. Evaluate each nation's Strata, SoL (1-50 scale), Radicals/Loyalists, Interest Groups, Legitimacy, and Election Polls
  for (const nation of state.nations || []) {
    const c = nation.computed || {};
    const lawMods = getNationLawModifiers(nation);
    const pops = Math.max(1000, c.effectiveWorkingPops || nation.workingPops || 10000000);

    // Pop Strata Breakdown (Lower 62%, Middle 28%, Upper 10%)
    const lowerPops = Math.round(pops * 0.62);
    const middlePops = Math.round(pops * 0.28);
    const upperPops = Math.max(100, pops - lowerPops - middlePops);

    // Map spreadsheet `c.sol` (~8 to 20) into Victoria 3's 1–50 Standard of Living scale
    const baseV3Sol = Math.min(42, Math.max(4, (Number(c.sol) || 10) * 1.35));
    const unempPenalty = Math.max(0, (c.unemploymentRate || 0) * 18);
    const taxDrag = ((c.incomeTax || 0.2) + (c.salesTax || 0.15)) * 8;

    const lowerSol = Number(
      Math.min(
        45,
        Math.max(
          2,
          baseV3Sol * 0.82 -
            unempPenalty -
            taxDrag +
            (c.workerShareOfGdp || 0.38) * 12 +
            lawMods.lowerSolMod
        )
      ).toFixed(1)
    );
    const middleSol = Number(
      Math.min(
        48,
        Math.max(
          5,
          baseV3Sol * 1.08 +
            (c.literacyRate || 0.7) * 6 -
            unempPenalty * 0.5 +
            lawMods.middleSolMod
        )
      ).toFixed(1)
    );
    const upperSol = Number(
      Math.min(
        50,
        Math.max(
          12,
          baseV3Sol * 1.45 +
            (1 - (c.corporateTax || 0.2)) * 10 +
            lawMods.upperSolMod
        )
      ).toFixed(1)
    );

    const avgV3Sol = Number(
      ((lowerSol * 0.62 + middleSol * 0.28 + upperSol * 0.1)).toFixed(1)
    );
    const solTier = getSolTierLabel(avgV3Sol);

    nation.strata = {
      averageSol: avgV3Sol,
      solTier: solTier.label,
      lower: {
        name: "Lower Strata (Laborers, Machinists & Farmers)",
        pops: lowerPops,
        share: 0.62,
        sol: lowerSol,
        tier: getSolTierLabel(lowerSol).label,
      },
      middle: {
        name: "Middle Strata (Clerks, Academics & Bureaucrats)",
        pops: middlePops,
        share: 0.28,
        sol: middleSol,
        tier: getSolTierLabel(middleSol).label,
      },
      upper: {
        name: "Upper Strata (Capitalists, Executives & Gentry)",
        pops: upperPops,
        share: 0.1,
        sol: upperSol,
        tier: getSolTierLabel(upperSol).label,
      },
    };

    // Compute Interest Group Clout (%) & Approval (-20 to +20)
    const totGdp = Math.max(1, c.aggregateGdp || 1);
    const indShare = (c.industryGdp || 0) / totGdp;
    const agShare = (c.agriculturalGdp || 0) / totGdp;
    const offShare = (c.officeGdp || 0) / totGdp;
    const hospShare = (c.hospitalityGdp || 0) / totGdp;

    const rawWeights = {
      industrialists:
        (12 + indShare * 35 + upperSol * 0.6) * lawMods.upperWeight,
      trade_unions:
        (14 + indShare * 28 + (c.urbanisationIndex || 0.6) * 18) *
        lawMods.lowerWeight,
      intelligentsia:
        (10 + (c.literacyRate || 0.7) * 28 + offShare * 20) *
        lawMods.middleWeight,
      petite_bourgeoisie:
        (10 + hospShare * 25 + offShare * 18) * lawMods.middleWeight,
      armed_forces:
        8 + (c.stateBudgetPercent || 0.15) * 35 + (nation.laws?.policing === "Militarized Police" ? 12 : 0),
      landowners:
        (7 + agShare * 35 + (1 - (c.urbanisationIndex || 0.6)) * 20) *
        lawMods.upperWeight,
      rural_folk:
        (9 + agShare * 38 + (1 - (c.urbanisationIndex || 0.6)) * 24) *
        lawMods.lowerWeight,
      devout:
        7 + (1 - (c.literacyRate || 0.7)) * 18 + (c.fertilityRate || 0.01) * 120,
    };

    const totalRawWeight =
      Object.values(rawWeights).reduce((acc, v) => acc + Math.max(1, v), 0) || 100;

    // Evaluate law stances for each IG
    const activeLawValues = Object.entries(nation.laws || {});
    for (const ig of nation.interestGroups || []) {
      const w = Math.max(1, rawWeights[ig.id] || 10);
      ig.clout = Number(((w / totalRawWeight) * 100).toFixed(1));

      // Compute law approval contribution
      let lawScore = 0;
      for (const [catKey, chosenLawId] of activeLawValues) {
        const cat = LAW_CATALOG[catKey];
        if (!cat) continue;
        const opt = cat.options.find((o) => o.id === chosenLawId);
        if (!opt) continue;
        if (opt.supportedBy?.some((s) => ig.name.toLowerCase().includes(s.toLowerCase()))) {
          lawScore += 3;
        }
        if (opt.opposedBy?.some((s) => ig.name.toLowerCase().includes(s.toLowerCase()))) {
          lawScore -= 3;
        }
      }

      const strataSol =
        ig.strataAffinity === "upper"
          ? upperSol
          : ig.strataAffinity === "middle"
          ? middleSol
          : lowerSol;
      const solApproval = Math.round((strataSol - 16) / 3.5);
      const govBonus = ig.inGovernment ? 2 : -1;
      const manualMod = Number(ig.manualApprovalMod) || 0;

      ig.approval = Math.max(-20, Math.min(20, lawScore + solApproval + govBonus + manualMod));
    }

    // Compute Government Legitimacy (0-100)
    const inGovIgs = (nation.interestGroups || []).filter((ig) => ig.inGovernment);
    const govCloutSum = inGovIgs.reduce((acc, ig) => acc + ig.clout, 0);
    const cohesionPenalty = Math.max(0, (inGovIgs.length - 3) * 8);
    const solLegitBonus = Math.max(-10, Math.min(15, (avgV3Sol - 15) * 0.8));
    const legitimacy = Math.round(
      Math.max(10, Math.min(100, govCloutSum * 1.15 + 22 - cohesionPenalty + solLegitBonus))
    );

    let legitimacyTier = "Contested Government";
    if (legitimacy >= 90) legitimacyTier = "Righteous Government";
    else if (legitimacy >= 75) legitimacyTier = "Legitimate Government";
    else if (legitimacy >= 50) legitimacyTier = "Contested Government";
    else if (legitimacy >= 25) legitimacyTier = "Unacceptable Government";
    else legitimacyTier = "Illegitimate Regime";

    // Compute Loyalists & Radicals
    const angryClout = (nation.interestGroups || [])
      .filter((ig) => ig.approval <= -4)
      .reduce((acc, ig) => acc + ig.clout, 0);
    const happyClout = (nation.interestGroups || [])
      .filter((ig) => ig.approval >= 4)
      .reduce((acc, ig) => acc + ig.clout, 0);

    const radicalShare = Math.min(
      0.55,
      Math.max(
        0.02,
        (Math.max(0, c.unemploymentRate || 0) * 0.65) +
          (Math.max(0, 20 - lowerSol) * 0.012) +
          (angryClout / 100) * 0.25 +
          (legitimacy < 50 ? (50 - legitimacy) * 0.004 : 0)
      )
    );
    const loyalistShare = Math.min(
      0.65,
      Math.max(
        0.05,
        Math.max(0, avgV3Sol - 12) * 0.014 +
          (happyClout / 100) * 0.28 +
          (legitimacy > 65 ? (legitimacy - 65) * 0.004 : 0)
      )
    );

    const radicalsCount = Math.round(pops * radicalShare);
    const loyalistsCount = Math.round(pops * loyalistShare);
    const turmoil = Number((radicalShare * 100).toFixed(1));

    nation.radicals = {
      count: radicalsCount,
      share: Number((radicalShare * 100).toFixed(1)),
      loyalistsCount,
      loyalistShare: Number((loyalistShare * 100).toFixed(1)),
      turmoil,
      legitimacy,
      legitimacyTier,
    };

    // National Sovereign Capacities (Construction & Sovereign Prestige)
    const territories = nation.territoryCount || 1;
    const constructionCapacity = Math.round(
      25 + ((c.industryGdp || 0) / 1e11) * 18 + (c.infrastructureEfficiency || 0.75) * 35
    );
    const prestige = Math.round(
      ((c.aggregateGdp || 0) / 1e11) * 45 +
        ((c.totalValuation || 0) / 1e12) * 20 +
        territories * 15 +
        (c.literacyRate || 0.7) * 120
    );

    nation.capacities = {
      constructionCapacity,
      prestige,
      rankTitle: "Minor Power",
      globalRank: 1,
    };

    // Dynamic Election Projections & Countdown
    const es = nation.electionState;
    es.daysUntilElection = Math.max(0, diffDaysIso(es.nextElectionDate, curDate));
    es.campaignActive = lawMods.allowElections && es.daysUntilElection <= 180;
    es.allowElections = lawMods.allowElections;

    // Calculate live party vote share projections
    const partyScores = {};
    for (const pName of partyNames) {
      partyScores[pName] = 5 + (Number(es.partyMomentum?.[pName]) || 5);
    }

    for (const ig of nation.interestGroups || []) {
      const pName = partyNames.includes(ig.party) ? ig.party : partyNames[0];
      partyScores[pName] = (partyScores[pName] || 5) + ig.clout * 1.25;
    }

    // Incumbent performance modifier
    const ruling = nation.rulingParty || partyNames[0];
    if (partyScores[ruling] !== undefined) {
      const econBonus =
        avgV3Sol >= 18 && (c.unemploymentRate || 0) < 0.08
          ? 14
          : (c.unemploymentRate || 0) > 0.15 || avgV3Sol < 12
          ? -14
          : 4;
      partyScores[ruling] = Math.max(4, partyScores[ruling] + econBonus);
    }

    const totalPartyScore =
      Object.values(partyScores).reduce((acc, v) => acc + Math.max(1, v), 0) || 100;

    es.polls = partyNames
      .map((pName) => {
        const share = Number((((partyScores[pName] || 5) / totalPartyScore) * 100).toFixed(1));
        const seats = Math.round((share / 100) * 500);
        return {
          partyName: pName,
          projectedVoteShare: share,
          projectedSeats: seats,
          momentum: Number(es.partyMomentum?.[pName] || 5),
          isRuling: pName === nation.rulingParty,
          inCoalition: (es.coalitionParties || [nation.rulingParty]).includes(pName),
        };
      })
      .sort((a, b) => b.projectedVoteShare - a.projectedVoteShare);
  }

  // 2. Assign Global Power Ranks by Prestige
  const sortedByPrestige = [...(state.nations || [])].sort(
    (a, b) => (b.capacities?.prestige || 0) - (a.capacities?.prestige || 0)
  );
  sortedByPrestige.forEach((n, index) => {
    const rank = index + 1;
    n.capacities.globalRank = rank;
    if (rank <= 3) n.capacities.rankTitle = "Great Power";
    else if (rank <= 7) n.capacities.rankTitle = "Major Power";
    else n.capacities.rankTitle = "Regional Power";
  });
}

export function executeGeneralElection(state, nation, dateStr) {
  evaluateVictoriaMechanics(state);
  const es = nation.electionState;
  const polls = es.polls || [];
  if (polls.length === 0) return null;

  // Apply slight election-day turnout swing (+/- 3.5%)
  let totalVotes = 0;
  const rawResults = polls.map((p) => {
    const swing = (Math.random() - 0.48) * 5;
    const raw = Math.max(2, p.projectedVoteShare + swing);
    totalVotes += raw;
    return { ...p, raw };
  });

  const finalResults = rawResults
    .map((r) => {
      const voteShare = Number(((r.raw / totalVotes) * 100).toFixed(1));
      const seats = Math.round((voteShare / 100) * 500);
      return {
        partyName: r.partyName,
        voteShare,
        seats,
      };
    })
    .sort((a, b) => b.voteShare - a.voteShare);

  const winner = finalResults[0];
  const prevRuling = nation.rulingParty;
  nation.rulingParty = winner.partyName;

  // Form coalition (Winner + runner-up if winner < 50%)
  const coalition = [winner.partyName];
  if (winner.voteShare < 50 && finalResults[1]) {
    coalition.push(finalResults[1].partyName);
  }
  es.coalitionParties = coalition;
  es.lastResults = finalResults;
  es.lastElectionDate = dateStr;
  es.nextElectionDate = addDaysToIso(dateStr, es.electionIntervalDays || 360);
  es.totalElectionsHeld = (es.totalElectionsHeld || 0) + 1;

  // Update Interest Group inGovernment flags based on winning coalition
  for (const ig of nation.interestGroups || []) {
    ig.inGovernment = coalition.includes(ig.party);
  }

  // Publish Election Special News Article
  const powerShift =
    prevRuling !== winner.partyName
      ? `ousting the incumbent ${prevRuling} administration`
      : `securing a renewed mandate for the ${winner.partyName} government`;

  const runnerUpText = finalResults[1]
    ? `, while ${finalResults[1].partyName} captured ${finalResults[1].voteShare}% (${finalResults[1].seats} seats)`
    : "";

  const article = {
    id: `news_elec_${nation.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    date: dateStr,
    quarter: state.timeManager?.quarterNumber || 1,
    category: "ELECTION SPECIAL",
    headline: `${nation.name} General Election: ${winner.partyName} Claims Victory with ${winner.voteShare}%!`,
    summary: `Voters across ${nation.name} went to the polls under ${nation.laws?.governance || "Universal Suffrage"} rules, ${powerShift}. ${winner.partyName} won ${winner.seats} parliamentary seats${runnerUpText}.`,
    nationName: nation.name,
    impact: `Ruling Party: ${winner.partyName} (${winner.seats}/500 Seats)`,
  };
  state.newsFeed.unshift(article);
  state.newsFeed = state.newsFeed.slice(0, 80);

  return { winner, finalResults, article };
}

export function processTimeTickVictoria(state, daysAdded, prevDateStr, newDateStr, quartersCrossed) {
  ensureVictoriaState(state);

  for (const nation of state.nations || []) {
    // 1. Advance Construction Queue
    if (nation.constructionQueue && nation.constructionQueue.length > 0) {
      const activeItem = nation.constructionQueue[0];
      const speedMult = Math.max(0.5, (nation.capacities?.constructionCapacity || 50) / 50);
      activeItem.daysRemaining = Math.max(
        0,
        Number((activeItem.daysRemaining - daysAdded * speedMult).toFixed(1))
      );

      if (activeItem.daysRemaining <= 0) {
        const completed = nation.constructionQueue.shift();
        if (completed.infraBonus) {
          nation.infrastructureEfficiency = Math.min(
            1,
            Number(((Number(nation.infrastructureEfficiency) || 0.75) + completed.infraBonus).toFixed(3))
          );
        }
        if (completed.literacyBonus) {
          nation.literacyRate = Math.min(
            1,
            Number(((Number(nation.literacyRate) || 0.75) + completed.literacyBonus).toFixed(3))
          );
        }
        if (completed.good && completed.sector && completed.sector !== "Infrastructure" && completed.sector !== "Education") {
          // Direct macroeconomic boost: jobs, consumer sentiment & sector output
          nation.workingPops = (Number(nation.workingPops) || 10000000) + (completed.jobsCreated || 150000);
          nation.consumerSentiment = Math.min(100, (Number(nation.consumerSentiment) || 50) + 2);
          if (completed.cloutBoost) {
            for (const ig of nation.interestGroups || []) {
              if (ig.id === completed.cloutBoost) {
                ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) + 3;
              }
            }
          }
        }
        state.newsFeed.unshift({
          id: `news_bldg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
          date: newDateStr,
          quarter: state.timeManager?.quarterNumber || 1,
          category: "CONSTRUCTION",
          headline: `${nation.name} Inaugurates New ${completed.name}`,
          summary: `State construction sectors in ${nation.name} have completed the ${completed.name}, creating ${(completed.jobsCreated || 100000).toLocaleString()} new jobs and expanding domestic productive capacity.`,
          nationName: nation.name,
          impact: `+${(completed.jobsCreated || 100000).toLocaleString()} Jobs (${completed.good})`,
        });
      }
    }

    // 2. Advance Active Law Enactment (Victoria 3 3-Phase Siege System)
    if (nation.activeLawEnactment) {
      const enact = nation.activeLawEnactment;
      enact.daysProgress = (enact.daysProgress || 0) + daysAdded;
      if (enact.daysProgress >= enact.checkpointIntervalDays) {
        enact.daysProgress = 0;
        const roll = Math.random() * 100;
        if (roll <= enact.successChance) {
          enact.phase = (enact.phase || 1) + 1;
          if (enact.phase > 3) {
            // Law Passed!
            const catKey = enact.category;
            const newLawId = enact.lawId;
            nation.laws[catKey] = newLawId;
            if (catKey === "policing") nation.crimePolicy = newLawId;
            if (catKey === "welfare") nation.healthcarePolicy = newLawId;
            nation.activeLawEnactment = null;

            state.newsFeed.unshift({
              id: `news_law_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
              date: newDateStr,
              quarter: state.timeManager?.quarterNumber || 1,
              category: "LAW & PARLIAMENT",
              headline: `Historic Reform: ${nation.name} Enacts ${newLawId}!`,
              summary: `Following three legislative phases of parliamentary debate and committee votes, ${nation.name} has officially enacted ${newLawId} under its ${LAW_CATALOG[catKey]?.label || catKey} constitution.`,
              nationName: nation.name,
              impact: `New Law Enacted: ${newLawId}`,
            });
          } else {
            const phaseNames = ["", "Debate", "Committee Vote", "Final Assent"];
            enact.lastOutcome = `Advanced to Phase ${enact.phase}: ${phaseNames[enact.phase]}`;
          }
        } else if (roll <= enact.successChance + 35) {
          enact.successChance = Math.min(85, enact.successChance + 8);
          enact.lastOutcome = "spirited parliamentary debate (+8% Enactment Chance)";
        } else {
          enact.stallCount = (enact.stallCount || 0) + 1;
          enact.successChance = Math.max(15, enact.successChance - 5);
          enact.lastOutcome = "Opposition filibuster stalled progress (-5% Chance)";
        }
      }
    }

    // 3. Check Scheduled Dynamic Elections
    const es = nation.electionState;
    const lawMods = getNationLawModifiers(nation);
    if (es && lawMods.allowElections && newDateStr >= es.nextElectionDate) {
      executeGeneralElection(state, nation, newDateStr);
    } else if (es && quartersCrossed > 0) {
      // Shift campaign momentum slightly each quarter based on economic performance
      for (const p of state.politicalParties || []) {
        const curMom = Number(es.partyMomentum?.[p.name]) || 5;
        const delta = Math.floor((Math.random() - 0.45) * 4);
        es.partyMomentum[p.name] = Math.max(2, Math.min(45, curMom + delta));
      }
    }
  }

  // 4. Generate Regular Quarterly World News & Periodic Dilemma when quarters cross
  if (quartersCrossed > 0 && state.nations && state.nations.length > 0) {
    evaluateVictoriaMechanics(state);
    const qNum = state.timeManager?.quarterNumber || 1;
    const topGdpNation = [...state.nations].sort(
      (a, b) => (b.computed?.aggregateGdp || 0) - (a.computed?.aggregateGdp || 0)
    )[0];
    const topSolNation = [...state.nations].sort(
      (a, b) => (b.strata?.averageSol || 0) - (a.strata?.averageSol || 0)
    )[0];
    const highTurmoilNation = [...state.nations].sort(
      (a, b) => (b.radicals?.turmoil || 0) - (a.radicals?.turmoil || 0)
    )[0];

    if (topGdpNation) {
      const gdpVal = ((topGdpNation.computed?.aggregateGdp || 0) / 1e12).toFixed(2);
      const solVal = topSolNation?.strata?.averageSol || 16;
      state.newsFeed.unshift({
        id: `news_q_${qNum}_${Date.now().toString(36)}`,
        date: newDateStr,
        quarter: qNum,
        category: "QUARTERLY GAZETTE",
        headline: `Q${qNum} World Economic Bulletin: ${topGdpNation.name} Leads Output ($${gdpVal}T) While ${topSolNation.name} Tops Living Standards`,
        summary: `Quarterly treasury settlements and corporate dividends have cleared across all bourses. ${topSolNation.name} achieved an average Standard of Living of ${solVal} (${topSolNation.strata?.solTier}), while ${highTurmoilNation.name} faces ${highTurmoilNation.radicals?.turmoil}% radical turmoil.`,
        nationName: topGdpNation.name,
        impact: `Q${qNum} Budgets & Dividends Settled`,
      });
    }

    // Spawn a fresh Interactive Dilemma if fewer than 3 are active
    if ((state.activeDilemmas || []).length < 3) {
      const targetNation = state.nations[qNum % state.nations.length];
      const templates = [
        {
          title: `General Strike Threatened in ${targetNation.name}'s Industrial Belt`,
          description: `Trade Union organizers representing machinists and factory workers in ${targetNation.name} are demanding immediate wage concessions and lower consumption taxes as cost-of-living pressures mount.`,
          options: [
            {
              label: "Grant Mandatory Wage Concessions (+Trade Unions, +Lower Strata SoL)",
              effectSummary: "+5 Trade Unions Approval, +4% Worker Share, -2 Industrialists",
              type: "FAVOR_UNIONS",
            },
            {
              label: "Deploy Security Forces to Keep Factories Open (+Industrialists, +Authority)",
              effectSummary: "+4 Industrialists Approval, +3 Armed Forces, -4 Trade Unions",
              type: "FAVOR_INDUSTRIALISTS",
            },
          ],
        },
        {
          title: `Pre-Election Coalition Showdown in ${targetNation.name}`,
          description: `With parliamentary elections approaching on ${targetNation.electionState?.nextElectionDate}, reformist intellectuals and business syndicates are vying for state endorsement.`,
          options: [
            {
              label: "Endorse Reformist & Labor Coalition (+Momentum for Reformers)",
              effectSummary: "+10 Campaign Momentum to Opposition/Reform Parties, +3 Intelligentsia",
              type: "BOOST_CHALLENGER_MOMENTUM",
            },
            {
              label: "Rally Behind Incumbent Ruling Administration (+Incumbent Momentum)",
              effectSummary: "+12 Campaign Momentum to Ruling Party, +5 Consumer Sentiment",
              type: "BOOST_INCUMBENT_MOMENTUM",
            },
          ],
        },
        {
          title: `Sovereign Bourse Boom in ${targetNation.name}`,
          description: `Speculative capital is pouring into ${targetNation.stockExchangeName || targetNation.name + " Bourse"}, driving up share valuations across flagship technology and manufacturing corporations.`,
          options: [
            {
              label: "Reinvest Windfall into National Infrastructure (+Infrastructure, +Treasury)",
              effectSummary: "+3% Infrastructure Efficiency, +$8B Treasury Balance",
              type: "INFRA_BOOM",
            },
            {
              label: "Unleash Market Speculation (+Corporate Hype & Valuation)",
              effectSummary: "+6 Consumer Sentiment, +4 Industrialists & Petite Bourgeoisie Approval",
              type: "MARKET_BOOM",
            },
          ],
        },
      ];
      const chosen = templates[qNum % templates.length];
      state.activeDilemmas.unshift({
        id: `dilemma_q${qNum}_${Date.now().toString(36)}`,
        date: newDateStr,
        nationId: targetNation.id,
        nationName: targetNation.name,
        title: chosen.title,
        description: chosen.description,
        options: chosen.options,
      });
    }
  }

  state.newsFeed = (state.newsFeed || []).slice(0, 80);
}

export function setCustomStartDate(
  state,
  { startDate, resetCurrentDate = true, electionIntervalDays }
) {
  ensureVictoriaState(state);
  const cleanDate = (startDate || "2025-01-01").split("T")[0];
  const tm = state.timeManager;
  tm.crisisStartDate = cleanDate;
  if (resetCurrentDate) {
    tm.crisisDate = cleanDate;
    tm.nextPaymentDate = addDaysToIso(cleanDate, 90);
    tm.quarterNumber = 1;
    tm.daysElapsed = 0;
  }

  const curDate = tm.crisisDate || cleanDate;
  for (const nation of state.nations || []) {
    if (nation.electionState) {
      if (electionIntervalDays && Number(electionIntervalDays) >= 30) {
        nation.electionState.electionIntervalDays = Number(electionIntervalDays);
      }
      nation.electionState.lastElectionDate = curDate;
      nation.electionState.nextElectionDate = addDaysToIso(
        curDate,
        nation.electionState.electionIntervalDays || 360
      );
    }
  }

  state.newsFeed.unshift({
    id: `news_epoch_${Date.now().toString(36)}`,
    date: curDate,
    quarter: tm.quarterNumber || 1,
    category: "CHRONICLE EPOCH",
    headline: `Timeline Anchored to ${cleanDate}: New Historical Epoch Initialized`,
    summary: `The World Director has set the simulation start date to ${cleanDate}. Quarterly treasury settlements are scheduled for ${tm.nextPaymentDate}, with dynamic national election calendars recalibrated.`,
    nationName: "Global",
    impact: `Start Date: ${cleanDate}`,
  });

  evaluateVictoriaMechanics(state);
  return {
    action: `Set Campaign Start Date to ${cleanDate}`,
    toastMessage: `World Start Date set to ${cleanDate}! Next quarterly settlement: ${tm.nextPaymentDate}`,
  };
}

export function triggerElectionAction(
  state,
  { nationId, actionType, partyName, coalitionParties, electionIntervalDays }
) {
  ensureVictoriaState(state);
  const nation = (state.nations || []).find((n) => n.id === nationId);
  if (!nation) return { action: "Nation not found" };
  const curDate = state.timeManager?.crisisDate || "2025-01-01";
  const es = nation.electionState;

  if (actionType === "CALL_SNAP_ELECTION") {
    const result = executeGeneralElection(state, nation, curDate);
    evaluateVictoriaMechanics(state);
    return {
      action: `${nation.name} held a Snap General Election — ${result?.winner?.partyName} won ${result?.winner?.voteShare}% (${result?.winner?.seats} seats)!`,
      toastMessage: `Election Winner in ${nation.name}: ${result?.winner?.partyName} (${result?.winner?.voteShare}% vote, ${result?.winner?.seats} seats)!`,
    };
  }

  if (actionType === "RALLY_PARTY" && partyName) {
    es.partyMomentum[partyName] = Math.min(60, (Number(es.partyMomentum[partyName]) || 5) + 12);
    state.newsFeed.unshift({
      id: `news_rally_${Date.now().toString(36)}`,
      date: curDate,
      quarter: state.timeManager?.quarterNumber || 1,
      category: "CAMPAIGN TRAIL",
      headline: `Mass Campaign Rally in ${nation.name} Surges Momentum for ${partyName}`,
      summary: `Tens of thousands of supporters gathered in ${nation.name}'s capital as ${partyName} leaders pledged sweeping economic and social reforms ahead of the ${es.nextElectionDate} election.`,
      nationName: nation.name,
      impact: `${partyName} Momentum +12`,
    });
    evaluateVictoriaMechanics(state);
    return {
      action: `Held Mass Rally for ${partyName} in ${nation.name} (+12 Momentum)`,
      toastMessage: `${partyName} campaign momentum surged in ${nation.name}!`,
    };
  }

  if (actionType === "FUND_PARTY" && partyName) {
    const cost = 2000000000;
    nation.treasuryBalance = (Number(nation.treasuryBalance) || 0) - cost;
    es.partyMomentum[partyName] = Math.min(75, (Number(es.partyMomentum[partyName]) || 5) + 18);
    evaluateVictoriaMechanics(state);
    return {
      action: `Channeled $2.0B Campaign Funding to ${partyName} in ${nation.name} (+18 Momentum)`,
      toastMessage: `Funded ${partyName} campaign (+18 Momentum)!`,
    };
  }

  if (actionType === "REFORM_GOVERNMENT") {
    if (Array.isArray(coalitionParties) && coalitionParties.length > 0) {
      es.coalitionParties = coalitionParties;
      nation.rulingParty = coalitionParties[0];
      for (const ig of nation.interestGroups || []) {
        ig.inGovernment = coalitionParties.includes(ig.party);
      }
      state.newsFeed.unshift({
        id: `news_coalition_${Date.now().toString(36)}`,
        date: curDate,
        quarter: state.timeManager?.quarterNumber || 1,
        category: "CABINET REFORM",
        headline: `${nation.name} Forms New Ruling Coalition Led by ${coalitionParties.join(" & ")}`,
        summary: `A cabinet reshuffle in ${nation.name} has brought ${coalitionParties.join(", ")} into government, realigning parliamentary legitimacy and fiscal priorities.`,
        nationName: nation.name,
        impact: `Ruling Coalition: ${coalitionParties.join(" + ")}`,
      });
    }
    if (electionIntervalDays && Number(electionIntervalDays) >= 30) {
      es.electionIntervalDays = Number(electionIntervalDays);
      es.nextElectionDate = addDaysToIso(curDate, Number(electionIntervalDays));
    }
    evaluateVictoriaMechanics(state);
    return {
      action: `Reformed Government Coalition in ${nation.name} (${nation.rulingParty})`,
      toastMessage: `New Government formed in ${nation.name} (Legitimacy: ${nation.radicals?.legitimacy})!`,
    };
  }

  if (actionType === "TOGGLE_IG_GOVERNMENT") {
    const ig = (nation.interestGroups || []).find((g) => g.id === partyName);
    if (ig) {
      ig.inGovernment = !ig.inGovernment;
      evaluateVictoriaMechanics(state);
      return {
        action: `${ig.name} moved ${ig.inGovernment ? "into Government" : "to Opposition"} in ${nation.name}`,
        toastMessage: `${ig.name} is now ${ig.inGovernment ? "In Government" : "In Opposition"} (Legitimacy: ${nation.radicals?.legitimacy})`,
      };
    }
  }

  evaluateVictoriaMechanics(state);
  return { action: `Updated election settings in ${nation.name}` };
}

export function triggerLawAction(state, { nationId, category, lawId, actionType }) {
  ensureVictoriaState(state);
  const nation = (state.nations || []).find((n) => n.id === nationId);
  if (!nation) return { action: "Nation not found" };
  const curDate = state.timeManager?.crisisDate || "2025-01-01";

  const catObj = LAW_CATALOG[category];
  const lawOpt = catObj?.options?.find((o) => o.id === lawId);

  if (actionType === "CANCEL_ENACTMENT") {
    nation.activeLawEnactment = null;
    evaluateVictoriaMechanics(state);
    return {
      action: `Cancelled law enactment in ${nation.name}`,
      toastMessage: "Legislative enactment cancelled.",
    };
  }

  if (actionType === "INSTANT_DECREE" && lawOpt) {
    nation.laws[category] = lawOpt.id;
    if (category === "policing") nation.crimePolicy = lawOpt.id;
    if (category === "welfare") nation.healthcarePolicy = lawOpt.id;
    nation.activeLawEnactment = null;
    state.newsFeed.unshift({
      id: `news_decree_${Date.now().toString(36)}`,
      date: curDate,
      quarter: state.timeManager?.quarterNumber || 1,
      category: "SOVEREIGN DECREE",
      headline: `${nation.name} Enacts ${lawOpt.name} by Executive Decree`,
      summary: `${nation.name}'s leadership invoked sovereign authority to immediately promulgate ${lawOpt.name} (${catObj.label}). ${lawOpt.desc}`,
      nationName: nation.name,
      impact: `Law Active: ${lawOpt.name}`,
    });
    evaluateVictoriaMechanics(state);
    return {
      action: `${nation.name} enacted ${lawOpt.name} (${catObj.label})`,
      toastMessage: `Enacted ${lawOpt.name} in ${nation.name}!`,
    };
  }

  if (actionType === "ADVANCE_PHASE" && nation.activeLawEnactment) {
    const enact = nation.activeLawEnactment;
    enact.phase = (enact.phase || 1) + 1;
    if (enact.phase > 3) {
      nation.laws[enact.category] = enact.lawId;
      if (enact.category === "policing") nation.crimePolicy = enact.lawId;
      if (enact.category === "welfare") nation.healthcarePolicy = enact.lawId;
      const passedName = enact.lawName;
      nation.activeLawEnactment = null;
      state.newsFeed.unshift({
        id: `news_lawpass_${Date.now().toString(36)}`,
        date: curDate,
        quarter: state.timeManager?.quarterNumber || 1,
        category: "LAW & PARLIAMENT",
        headline: `Parliament Passes ${passedName} in ${nation.name}!`,
        summary: `Following final parliamentary assent, ${passedName} is now the law of the land in ${nation.name}.`,
        nationName: nation.name,
        impact: `Law Enacted: ${passedName}`,
      });
      evaluateVictoriaMechanics(state);
      return {
        action: `${nation.name} completed enactment of ${passedName}!`,
        toastMessage: `Law Passed: ${passedName}!`,
      };
    }
    evaluateVictoriaMechanics(state);
    return {
      action: `Advanced ${enact.lawName} to Phase ${enact.phase}/3 in ${nation.name}`,
      toastMessage: `${enact.lawName} advanced to Phase ${enact.phase}/3!`,
    };
  }

  // Default: START_ENACTMENT (3-phase Victoria 3 legislative process)
  if (lawOpt) {
    // Compute support chance from IGs
    let supportClout = 18;
    let opposeClout = 0;
    for (const ig of nation.interestGroups || []) {
      if (lawOpt.supportedBy?.some((s) => ig.name.toLowerCase().includes(s.toLowerCase()))) {
        supportClout += ig.clout * (ig.inGovernment ? 1.4 : 0.8);
      }
      if (lawOpt.opposedBy?.some((s) => ig.name.toLowerCase().includes(s.toLowerCase()))) {
        opposeClout += ig.clout;
      }
    }
    const successChance = Math.round(
      Math.max(20, Math.min(85, 35 + supportClout - opposeClout * 0.5))
    );

    nation.activeLawEnactment = {
      category,
      categoryLabel: catObj.label,
      lawId: lawOpt.id,
      lawName: lawOpt.name,
      desc: lawOpt.desc,
      phase: 1, // 1: Debate, 2: Committee Vote, 3: Final Assent
      daysProgress: 0,
      checkpointIntervalDays: 30,
      successChance,
      stallChance: Math.round(Math.max(5, Math.min(45, opposeClout * 0.7))),
      lastOutcome: "Bill introduced to Parliament Floor (Phase 1: Debate)",
    };

    state.newsFeed.unshift({
      id: `news_bill_${Date.now().toString(36)}`,
      date: curDate,
      quarter: state.timeManager?.quarterNumber || 1,
      category: "LAW & PARLIAMENT",
      headline: `${nation.name} Introduces Bill to Enact ${lawOpt.name}`,
      summary: `Legislators in ${nation.name} have opened Phase 1 Debate on ${lawOpt.name} (${catObj.label}) with an initial ${successChance}% passage probability per checkpoint.`,
      nationName: nation.name,
      impact: `Enacting ${lawOpt.name} (${successChance}% Chance)`,
    });

    evaluateVictoriaMechanics(state);
    return {
      action: `Started enacting ${lawOpt.name} in ${nation.name} (${successChance}% success chance)`,
      toastMessage: `Started enacting ${lawOpt.name} (Phase 1/3 Debate)!`,
    };
  }

  return { action: "Law option not found" };
}

export function queueConstruction(state, { nationId, buildingId, targetState }) {
  ensureVictoriaState(state);
  const nation = (state.nations || []).find((n) => n.id === nationId);
  if (!nation) return { action: "Nation not found" };
  const bldg = CONSTRUCTION_BUILDINGS.find((b) => b.id === buildingId);
  if (!bldg) return { action: "Building template not found" };

  const currentTreasury = Number(nation.treasuryBalance) || 0;
  if (currentTreasury <= 0) {
    return {
      action: `Cannot build in ${nation.name}: Sovereign treasury is negative or depleted ($${(currentTreasury / 1e9).toFixed(2)}B). Deficit construction is prohibited.`,
      toastMessage: `Cannot build: Sovereign Treasury is negative or empty!`,
      error: true,
    };
  }

  if (currentTreasury < bldg.cost) {
    return {
      action: `Cannot build ${bldg.name}: Project cost ($${(bldg.cost / 1e9).toFixed(1)}B) exceeds available sovereign treasury ($${(currentTreasury / 1e9).toFixed(2)}B).`,
      toastMessage: `Insufficient funds in sovereign treasury!`,
      error: true,
    };
  }

  nation.treasuryBalance = currentTreasury - bldg.cost;
  nation.constructionQueue = nation.constructionQueue || [];
  nation.constructionQueue.push({
    queueId: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    ...bldg,
    targetState: targetState || "Nationwide Infrastructure",
    daysRemaining: bldg.daysRequired,
  });

  evaluateVictoriaMechanics(state);
  return {
    action: `Queued ${bldg.name} in ${targetState ? `${targetState} (${nation.name})` : nation.name} ($${(bldg.cost / 1e9).toFixed(1)}B)`,
    toastMessage: `Construction started in ${targetState || nation.name}: ${bldg.name}!`,
  };
}

export function resolveNewsDilemma(state, { dilemmaId, optionIndex }) {
  ensureVictoriaState(state);
  const idx = (state.activeDilemmas || []).findIndex((d) => d.id === dilemmaId);
  if (idx === -1) return { action: "Dispatch already resolved" };

  const dilemma = state.activeDilemmas[idx];
  const option = dilemma.options?.[optionIndex] || dilemma.options?.[0];
  state.activeDilemmas.splice(idx, 1);

  const nation = (state.nations || []).find((n) => n.id === dilemma.nationId) || state.nations?.[0];
  const curDate = state.timeManager?.crisisDate || "2025-01-01";

  if (nation && option) {
    if (option.type === "FAVOR_INDUSTRIALISTS") {
      nation.consumerSentiment = Math.min(100, (Number(nation.consumerSentiment) || 50) + 3);
      for (const ig of nation.interestGroups || []) {
        if (ig.id === "industrialists" || ig.id === "armed_forces") {
          ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) + 4;
        }
        if (ig.id === "trade_unions") {
          ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) - 2;
        }
      }
    } else if (option.type === "FAVOR_UNIONS") {
      const curShare = Number(nation.workerShareOverride ?? nation.computed?.workerShareOfGdp ?? 0.38);
      nation.workerShareOverride = Math.min(0.75, Number((curShare + 0.03).toFixed(2)));
      for (const ig of nation.interestGroups || []) {
        if (ig.id === "trade_unions" || ig.id === "rural_folk") {
          ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) + 4;
        }
        if (ig.id === "industrialists") {
          ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) - 2;
        }
      }
    } else if (option.type === "FAVOR_INTELLIGENTSIA") {
      nation.literacyRate = Math.min(1, Number(((Number(nation.literacyRate) || 0.75) + 0.02).toFixed(3)));
      for (const ig of nation.interestGroups || []) {
        if (ig.id === "intelligentsia") {
          ig.manualApprovalMod = (Number(ig.manualApprovalMod) || 0) + 4;
        }
      }
    } else if (option.type === "BOOST_CHALLENGER_MOMENTUM") {
      for (const p of state.politicalParties || []) {
        if (p.name !== nation.rulingParty) {
          nation.electionState.partyMomentum[p.name] =
            (Number(nation.electionState.partyMomentum[p.name]) || 5) + 10;
        }
      }
    } else if (option.type === "BOOST_INCUMBENT_MOMENTUM") {
      const r = nation.rulingParty;
      if (r) {
        nation.electionState.partyMomentum[r] =
          (Number(nation.electionState.partyMomentum[r]) || 5) + 12;
      }
      nation.consumerSentiment = Math.min(100, (Number(nation.consumerSentiment) || 50) + 5);
    } else if (option.type === "INFRA_BOOM") {
      nation.infrastructureEfficiency = Math.min(
        1,
        Number(((Number(nation.infrastructureEfficiency) || 0.75) + 0.03).toFixed(3))
      );
      nation.treasuryBalance = (Number(nation.treasuryBalance) || 0) + 8000000000;
    } else if (option.type === "MARKET_BOOM") {
      nation.consumerSentiment = Math.min(100, (Number(nation.consumerSentiment) || 50) + 6);
    }

    state.newsFeed.unshift({
      id: `news_res_${Date.now().toString(36)}`,
      date: curDate,
      quarter: state.timeManager?.quarterNumber || 1,
      category: "POLICY DECISION",
      headline: `${nation.name} Responds to "${dilemma.title}"`,
      summary: `State leadership enacted decision: "${option.label}" (${option.effectSummary}).`,
      nationName: nation.name,
      impact: option.effectSummary,
    });
  }

  evaluateVictoriaMechanics(state);
  return {
    action: `Resolved Policy Dispatch: ${dilemma.title}`,
    toastMessage: `Policy Decision Enacted: ${option?.effectSummary || "Complete"}!`,
  };
}

export function publishCustomNews(state, { headline, summary, category = "SPECIAL EDITION", nationName = "Global" }) {
  ensureVictoriaState(state);
  const curDate = state.timeManager?.crisisDate || "2025-01-01";
  const article = {
    id: `news_custom_${Date.now().toString(36)}`,
    date: curDate,
    quarter: state.timeManager?.quarterNumber || 1,
    category,
    headline,
    summary,
    nationName,
    impact: "Press Dispatch Published",
  };
  state.newsFeed.unshift(article);
  return {
    action: `Published Gazette Headline: "${headline}"`,
    toastMessage: `Published to The Imperial Gazette: "${headline}"`,
  };
}
