/**
 * Imperium Solutions - Global Administrative Boundaries Service
 * Lazy-loads, caches, and indexes first-level administrative divisions (ADM1)
 * from geoBoundaries gbOpen datasets for interactive country cartography.
 */

// Memory cache of GeoJSON FeatureCollections per ISO-3
const boundaryCache = new Map();
let manifestCache = null;

// Normalization lookup mapping simulator nation IDs, names, and variations to ISO-3
export const NATION_TO_ISO3 = {
  // Democratic Republic of the Congo
  cod: "COD",
  drc: "COD",
  congo: "COD",
  democratic_republic_of_the_congo: "COD",
  "democratic republic of the congo": "COD",

  // United States
  usa: "USA",
  us: "USA",
  united_states: "USA",
  "united states": "USA",
  "united states of america": "USA",

  // United Kingdom
  gbr: "GBR",
  uk: "GBR",
  united_kingdom: "GBR",
  "united kingdom": "GBR",
  great_britain: "GBR",

  // Germany
  deu: "DEU",
  germany: "DEU",
  deutschland: "DEU",

  // France
  fra: "FRA",
  france: "FRA",

  // Japan
  jpn: "JPN",
  japan: "JPN",
  nippon: "JPN",

  // China
  chn: "CHN",
  china: "CHN",

  // India
  ind: "IND",
  india: "IND",
  bharat: "IND",

  // Brazil
  bra: "BRA",
  brazil: "BRA",
  brasil: "BRA",

  // Canada
  can: "CAN",
  canada: "CAN",

  // Australia
  aus: "AUS",
  australia: "AUS",

  // Russia
  rus: "RUS",
  russia: "RUS",
  russian_federation: "RUS",

  // South Africa
  zaf: "ZAF",
  south_africa: "ZAF",
  "south africa": "ZAF",

  // Indonesia
  idn: "IDN",
  indonesia: "IDN",

  // Singapore
  sgp: "SGP",
  singapore: "SGP",

  // Italy
  ita: "ITA",
  italy: "ITA",
  italia: "ITA",

  // Spain
  esp: "ESP",
  spain: "ESP",
  espana: "ESP",

  // Mexico
  mex: "MEX",
  mexico: "MEX",

  // South Korea
  kor: "KOR",
  korea: "KOR",
  south_korea: "KOR",
  "south korea": "KOR",

  // Saudi Arabia
  sau: "SAU",
  saudi_arabia: "SAU",
  "saudi arabia": "SAU",

  // Turkey
  tur: "TUR",
  turkey: "TUR",
  turkiye: "TUR",

  // Nigeria
  nga: "NGA",
  nigeria: "NGA",

  // Argentina
  arg: "ARG",
  argentina: "ARG",

  // Egypt
  egy: "EGY",
  egypt: "EGY",

  // Kenya
  ken: "KEN",
  kenya: "KEN",

  // Netherlands
  nld: "NLD",
  netherlands: "NLD",

  // Sweden
  swe: "SWE",
  sweden: "SWE",

  // Switzerland
  che: "CHE",
  switzerland: "CHE",

  // Poland
  pol: "POL",
  poland: "POL",
};

/**
 * Resolves any country identifier, code, or name to a normalized ISO-3 string.
 */
export function resolveIso3(countryIdentifier) {
  if (!countryIdentifier) return null;
  const str = String(countryIdentifier).trim().toLowerCase();
  if (NATION_TO_ISO3[str]) return NATION_TO_ISO3[str];
  const cleaned = str.replace(/[^a-z0-9]/g, "");
  if (NATION_TO_ISO3[cleaned]) return NATION_TO_ISO3[cleaned];
  // Direct 3-letter check
  if (str.length === 3) return str.toUpperCase();
  return null;
}

/**
 * Loads the boundary manifest indexing all available country datasets.
 */
export async function getBoundaryManifest() {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch("/data/boundaries/manifest.json");
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    manifestCache = await res.json();
    return manifestCache;
  } catch (err) {
    console.warn("[BoundaryService] Failed to load manifest, using fallback catalog:", err);
    return {
      version: "1.0.0",
      countries: {},
    };
  }
}

/**
 * Checks whether an ADM1 dataset is available for the given country.
 */
export function isAdm1Available(countryIdentifier) {
  const iso3 = resolveIso3(countryIdentifier);
  if (!iso3) return false;
  return Boolean(NATION_TO_ISO3[iso3.toLowerCase()]);
}

/**
 * Lazy-loads the GeoJSON ADM1 boundary dataset for a specific country.
 * Returns { success: true, iso3, geojson } or { success: false, reason }
 */
export async function loadCountryAdm1(countryIdentifier) {
  const iso3 = resolveIso3(countryIdentifier);
  if (!iso3) {
    return {
      success: false,
      reason: `Could not resolve ISO-3 code for country '${countryIdentifier}'`,
    };
  }

  // 1. Check in-memory cache
  if (boundaryCache.has(iso3)) {
    return {
      success: true,
      iso3,
      geojson: boundaryCache.get(iso3),
      fromCache: true,
    };
  }

  // 2. Fetch from static asset directory
  try {
    const url = `/data/boundaries/adm1/${iso3}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        success: false,
        iso3,
        reason: `Dataset not available for ${iso3} (HTTP ${res.status})`,
      };
    }

    const geojson = await res.json();
    if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
      return {
        success: false,
        iso3,
        reason: `Malformed GeoJSON payload for ${iso3}`,
      };
    }

    // Cache in memory for instantaneous subsequent lookups
    boundaryCache.set(iso3, geojson);
    return {
      success: true,
      iso3,
      geojson,
      fromCache: false,
    };
  } catch (err) {
    return {
      success: false,
      iso3,
      reason: err.message || "Network error loading boundary dataset",
    };
  }
}

/**
 * Clears the in-memory boundary cache (useful during development / testing).
 */
export function clearBoundaryCache() {
  boundaryCache.clear();
  manifestCache = null;
}

