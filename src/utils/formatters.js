export function formatCurrency(val, decimals = 2) {
  const num = Number(val);
  if (!Number.isFinite(num)) return "$0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e12) {
    return `${sign}$${(abs / 1e12).toFixed(decimals)}T`;
  }
  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(decimals)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(decimals)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}$${(abs / 1e3).toFixed(decimals)}K`;
  }
  return `${sign}$${abs.toFixed(decimals)}`;
}

export function formatExactCurrency(val, decimals = 2) {
  const num = Number(val);
  if (!Number.isFinite(num)) return "$0.00";
  return (
    (num < 0 ? "-$" : "$") +
    Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatCompactNumber(val, decimals = 2) {
  const num = Number(val);
  if (!Number.isFinite(num)) return "0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function formatPercent(val, decimals = 2, showPlus = false) {
  const num = Number(val);
  if (!Number.isFinite(num)) return "0.00%";
  const pct = (num * 100).toFixed(decimals);
  if (showPlus && num > 0) return `+${pct}%`;
  return `${pct}%`;
}

export function getSectorBadgeClass(sector) {
  if (!sector) return "bg-slate-800 text-slate-300 border-slate-700";
  if (sector.includes("Agricultural")) {
    return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
  }
  if (sector.includes("Industry")) {
    return "bg-amber-950/80 text-amber-300 border-amber-700/60";
  }
  if (sector.includes("Hospitality")) {
    return "bg-purple-950/80 text-purple-300 border-purple-700/60";
  }
  if (sector.includes("Office")) {
    return "bg-cyan-950/80 text-cyan-300 border-cyan-700/60";
  }
  return "bg-slate-800 text-slate-300 border-slate-700";
}

export function getShortSectorName(sector) {
  if (!sector) return "General";
  if (sector.includes("Agricultural")) return "Agriculture";
  if (sector.includes("Industry")) return "Industry & Mfg";
  if (sector.includes("Hospitality")) return "Hospitality & Tourism";
  if (sector.includes("Office")) return "Office & Corporate";
  return sector;
}

