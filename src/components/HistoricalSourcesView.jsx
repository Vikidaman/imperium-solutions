import React, { useState, useMemo } from "react";
import {
  BookOpen,
  ScrollText,
  Database,
  Search,
  ExternalLink,
  FileText,
  CheckCircle2,
  Copy,
  Sparkles,
  Globe,
  Building2,
  Wheat,
  Fuel,
  Pickaxe,
  Landmark,
  Layers,
  Award,
  BarChart3,
  Anchor,
  Cpu,
  GraduationCap,
  Calendar,
  Compass,
} from "lucide-react";
import { COMMODITY_PRICE_BENCHMARKS } from "../../server/empiricalPriceCatalog.js";
import { HISTORICAL_SOURCES } from "../data/historicalSourcesData.js";

const ICON_MAP = {
  Calendar,
  Layers,
  Pickaxe,
  Fuel,
  Wheat,
  Landmark,
  Building2,
  Anchor,
  BarChart3,
  Globe,
  GraduationCap,
  BookOpen,
};

export default function HistoricalSourcesView({ onJumpToTab }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCitation, setCopiedCitation] = useState(null);

  const categories = [
    { id: "all", label: "All Citations & Datasets" },
    { id: "Historical Eras & Macroeconomics", label: "Historical Eras (Maddison)" },
    { id: "Input-Output & Production Architecture", label: "Leontief Input-Output" },
    { id: "Geological & Critical Mineral Resources", label: "USGS Minerals" },
    { id: "Energy & Hydrocarbons", label: "EIA Energy" },
    { id: "Agriculture & Agro-Industrial Production", label: "USDA Agriculture" },
    { id: "Services & Regional Economics", label: "BEA & Agglomeration" },
    { id: "Logistics, Ports & Freight Transit", label: "USACE Ports & Freight" },
    { id: "Commodity Benchmarks & Markets", label: "World Bank Prices" },
    { id: "Cartography & Administrative Boundaries", label: "Natural Earth Cartography" },
  ];

  const filteredSources = useMemo(() => {
    return HISTORICAL_SOURCES.filter((s) => {
      const matchCat =
        selectedCategory === "all" || s.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.citation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const commodityList = useMemo(() => {
    return Object.entries(COMMODITY_PRICE_BENCHMARKS).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, []);

  const [commoditySearch, setCommoditySearch] = useState("");
  const filteredCommodities = useMemo(() => {
    if (!commoditySearch) return commodityList;
    const q = commoditySearch.toLowerCase();
    return commodityList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.source && c.source.toLowerCase().includes(q)) ||
        (c.sector && c.sector.toLowerCase().includes(q)) ||
        (c.benchmark_commodity && c.benchmark_commodity.toLowerCase().includes(q))
    );
  }, [commodityList, commoditySearch]);

  const handleCopyCitation = (text, id) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCitation(id);
      setTimeout(() => setCopiedCitation(null), 2500);
    }
  };

  const bibtexCitation = `@software{imperium_world_simulator_2026,
  title = {Imperium World Simulator: Empirical Macroeconomic, Leontief Input-Output, and ADM1 Cartographic Model},
  author = {Imperium Solutions Research Group},
  year = {2026},
  url = {https://imperium-solutions-simulator.pages.dev},
  note = {Data grounded in Angus Maddison Project (GGDC), Wassily Leontief I-O Accounts (BEA), USGS Mineral Summaries, EIA SEDS, USDA NASS, and World Bank Commodity Pink Sheets}
}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Authoritative Historical & Empirical Foundation</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
            Historical Sources, Empirical Datasets & Methodological Credits
          </h1>

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-3xl">
            The Imperium World Simulator combines peer-reviewed macroeconomic datasets,
            long-run historical archives (from 500 BC Classical Antiquity through the
            modern era), Nobel laureate Wassily Leontief's inter-industry input-output
            matrices, and authoritative government surveys from the{" "}
            <strong className="text-cyan-300">USGS</strong>,{" "}
            <strong className="text-amber-300">EIA</strong>,{" "}
            <strong className="text-emerald-300">USDA</strong>,{" "}
            <strong className="text-blue-300">BEA</strong>, and the{" "}
            <strong className="text-teal-300">World Bank</strong>.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById("commodity-catalog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-cyan-500/20"
            >
              <Database className="w-3.5 h-3.5" />
              Explore 60-Commodity Price Catalog
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("academic-citation-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Academic BibTeX & APA Citation
            </button>
            {onJumpToTab && (
              <button
                onClick={() => onJumpToTab("map")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Return to Interactive World Map
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets, institutions, authors, or citations..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono-num self-center">
            Showing {filteredSources.length} of {HISTORICAL_SOURCES.length} Primary Datasets
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Primary Data Source Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSources.map((source) => {
          const Icon = ICON_MAP[source.iconName] || BookOpen;
          const isCopied = copiedCitation === source.id;
          return (
            <div
              key={source.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition flex flex-col justify-between shadow-xl space-y-4"
            >
              <div className="space-y-3">
                {/* Header Badge & Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        backgroundColor: `${source.color}15`,
                        border: `1px solid ${source.color}35`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: source.color }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {source.category}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {source.title}
                      </h3>
                    </div>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700 transition shrink-0"
                    title="Open official primary source website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Institution & Authors */}
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>
                    <strong className="text-slate-400 font-semibold">Institution: </strong>
                    <span className="text-cyan-200">{source.institution}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 font-semibold">Principal Authors / Investigators: </strong>
                    <span className="text-slate-200">{source.authors}</span>
                  </div>
                </div>

                {/* Summary Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  {source.summary}
                </p>

                {/* Applications inside Simulator */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Role & Calibration in Simulator Engine:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {source.usedFor.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <span className="text-cyan-400 shrink-0 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bibliographic Citation Box */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[10.5px]">
                <div className="font-mono text-slate-400 italic truncate" title={source.citation}>
                  {source.citation}
                </div>
                <button
                  onClick={() => handleCopyCitation(source.citation, source.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 shrink-0 font-semibold cursor-pointer transition"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy Citation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Live 60-Commodity Price Catalog Explorer */}
      <div
        id="commodity-catalog-section"
        className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-5 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Grounded Empirical Pricing</span>
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              60-Commodity Empirical Price Catalog & Source Attribution
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Every tradable resource, manufacturing input, and service good in the
              simulator is anchored to real-world price data from the World Bank Pink Sheet,
              USGS Minerals, EIA SEDS, and BLS Producer Price Indexes.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={commoditySearch}
              onChange={(e) => setCommoditySearch(e.target.value)}
              placeholder="Search commodity or source..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Commodity Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-3.5">Commodity / Catalog Good</th>
                <th className="py-3 px-3">Benchmark Specification</th>
                <th className="py-3 px-3 font-mono-num">Real-World Price</th>
                <th className="py-3 px-3 font-mono-num">Simulator Anchor</th>
                <th className="py-3 px-3">Primary Source Agency</th>
                <th className="py-3 px-3">Consuming Sector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCommodities.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/40 transition group"
                >
                  <td className="py-2.5 px-3.5 font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono-num text-[11px]">
                    {item.benchmark_commodity || "Standard Commercial Grade"}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-emerald-300 text-[11.5px]">
                    ${typeof item.real_world_price === "number" ? item.real_world_price.toLocaleString() : item.real_world_price}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-cyan-300 text-[11.5px]">
                    {item.input_output_anchor ? `$${item.input_output_anchor.toLocaleString()}` : "Dynamic"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 text-[10px] font-mono border border-slate-700">
                      {item.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {item.sector ? item.sector.replace(" GDP", "") : "General"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Academic Citation & Attribution Exporter */}
      <div
        id="academic-citation-section"
        className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Academic Integrity & Citation</span>
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              Citing the Imperium World Simulator in Academic Research
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              If you utilize the Imperium World Simulator, its input-output calibration,
              or empirical endowments in papers, policy briefings, or educational material,
              please credit the underlying sources and format your citation as follows:
            </p>
          </div>

          <button
            onClick={() => handleCopyCitation(bibtexCitation, "bibtex")}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-500/20"
          >
            {copiedCitation === "bibtex" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                <span>BibTeX Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy BibTeX Entry</span>
              </>
            )}
          </button>
        </div>

        {/* BibTeX Code Block */}
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
          {bibtexCitation}
        </pre>

        {/* APA Formatted Citation */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            APA 7th Edition Format:
          </span>
          <p className="text-xs text-slate-200 font-serif leading-relaxed">
            Imperium Solutions Research Group. (2026). <em>Imperium World Simulator: Empirical Macroeconomic, Leontief Input-Output, and ADM1 Cartographic Model</em> [Computer software]. Retrieved from https://imperium-solutions-simulator.pages.dev
          </p>
        </div>
      </div>
    </div>
  );
}
