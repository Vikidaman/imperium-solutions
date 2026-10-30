/**
 * Imperium Solutions - Global Administrative Boundaries Service
 * Lazy-loads, caches, and indexes first-level administrative divisions (ADM1)
 * from geoBoundaries gbOpen datasets for interactive country cartography.
 */

// Memory cache of GeoJSON FeatureCollections per ISO-3
const boundaryCache = new Map();
let manifestCache = null;

/**
 * Authoritative ISO-3 mapping for all 176 sovereign Earth nations in the simulator.
 */
export const NATION_TO_ISO3 = {
  "usa": "USA",
  "united states": "USA",
  "united states of america": "USA",
  "us": "USA",
  "canada": "CAN",
  "can": "CAN",
  "mexico": "MEX",
  "mex": "MEX",
  "brazil": "BRA",
  "bra": "BRA",
  "brasil": "BRA",
  "argentina": "ARG",
  "arg": "ARG",
  "chile": "CHL",
  "chl": "CHL",
  "colombia": "COL",
  "col": "COL",
  "peru": "PER",
  "per": "PER",
  "venezuela": "VEN",
  "ven": "VEN",
  "bolivia": "BOL",
  "bol": "BOL",
  "ecuador": "ECU",
  "ecu": "ECU",
  "paraguay": "PRY",
  "pry": "PRY",
  "uruguay": "URY",
  "ury": "URY",
  "guyana": "GUY",
  "guy": "GUY",
  "suriname": "SUR",
  "sur": "SUR",
  "panama": "PAN",
  "pan": "PAN",
  "costa_rica": "CRI",
  "costa rica": "CRI",
  "cri": "CRI",
  "nicaragua": "NIC",
  "nic": "NIC",
  "honduras": "HND",
  "hnd": "HND",
  "el_salvador": "SLV",
  "el salvador": "SLV",
  "slv": "SLV",
  "guatemala": "GTM",
  "gtm": "GTM",
  "belize": "BLZ",
  "blz": "BLZ",
  "cuba": "CUB",
  "cub": "CUB",
  "haiti": "HTI",
  "hti": "HTI",
  "dominican_rep": "DOM",
  "dominican republic": "DOM",
  "dom": "DOM",
  "dominican rep.": "DOM",
  "jamaica": "JAM",
  "jam": "JAM",
  "bahamas": "BHS",
  "bhs": "BHS",
  "trinidad_and_tobago": "TTO",
  "trinidad and tobago": "TTO",
  "tto": "TTO",
  "puerto_rico": "PRI",
  "puerto rico": "PRI",
  "pri": "PRI",
  "falkland_is": "FLK",
  "falkland islands": "FLK",
  "falkland is.": "FLK",
  "flk": "FLK",
  "greenland": "GRL",
  "grl": "GRL",
  "united_kingdom": "GBR",
  "united kingdom": "GBR",
  "uk": "GBR",
  "gbr": "GBR",
  "great britain": "GBR",
  "germany": "DEU",
  "deu": "DEU",
  "deutschland": "DEU",
  "france": "FRA",
  "fra": "FRA",
  "italy": "ITA",
  "ita": "ITA",
  "italia": "ITA",
  "spain": "ESP",
  "esp": "ESP",
  "espana": "ESP",
  "portugal": "PRT",
  "prt": "PRT",
  "netherlands": "NLD",
  "nld": "NLD",
  "holland": "NLD",
  "belgium": "BEL",
  "bel": "BEL",
  "switzerland": "CHE",
  "che": "CHE",
  "austria": "AUT",
  "aut": "AUT",
  "sweden": "SWE",
  "swe": "SWE",
  "norway": "NOR",
  "nor": "NOR",
  "denmark": "DNK",
  "dnk": "DNK",
  "finland": "FIN",
  "fin": "FIN",
  "iceland": "ISL",
  "isl": "ISL",
  "ireland": "IRL",
  "irl": "IRL",
  "greece": "GRC",
  "grc": "GRC",
  "poland": "POL",
  "pol": "POL",
  "czechia": "CZE",
  "czech republic": "CZE",
  "cze": "CZE",
  "slovakia": "SVK",
  "svk": "SVK",
  "hungary": "HUN",
  "hun": "HUN",
  "romania": "ROU",
  "rou": "ROU",
  "bulgaria": "BGR",
  "bgr": "BGR",
  "ukraine": "UKR",
  "ukr": "UKR",
  "belarus": "BLR",
  "blr": "BLR",
  "croatia": "HRV",
  "hrv": "HRV",
  "serbia": "SRB",
  "srb": "SRB",
  "slovenia": "SVN",
  "svn": "SVN",
  "bosnia_and_herz": "BIH",
  "bosnia and herzegovina": "BIH",
  "bosnia and herz.": "BIH",
  "bih": "BIH",
  "macedonia": "MKD",
  "north macedonia": "MKD",
  "mkd": "MKD",
  "albania": "ALB",
  "alb": "ALB",
  "montenegro": "MNE",
  "mne": "MNE",
  "kosovo": "XKX",
  "xkx": "XKX",
  "lithuania": "LTU",
  "ltu": "LTU",
  "latvia": "LVA",
  "lva": "LVA",
  "estonia": "EST",
  "est": "EST",
  "moldova": "MDA",
  "mda": "MDA",
  "luxembourg": "LUX",
  "lux": "LUX",
  "cyprus": "CYP",
  "cyp": "CYP",
  "n_cyprus": "CYP",
  "n. cyprus": "CYP",
  "china": "CHN",
  "chn": "CHN",
  "japan": "JPN",
  "jpn": "JPN",
  "nippon": "JPN",
  "india": "IND",
  "ind": "IND",
  "bharat": "IND",
  "russia": "RUS",
  "rus": "RUS",
  "russian federation": "RUS",
  "south_korea": "KOR",
  "korea": "KOR",
  "kor": "KOR",
  "south korea": "KOR",
  "north_korea": "PRK",
  "north korea": "PRK",
  "prk": "PRK",
  "taiwan": "TWN",
  "twn": "TWN",
  "indonesia": "IDN",
  "idn": "IDN",
  "philippines": "PHL",
  "phl": "PHL",
  "vietnam": "VNM",
  "vnm": "VNM",
  "thailand": "THA",
  "tha": "THA",
  "malaysia": "MYS",
  "mys": "MYS",
  "singapore": "SGP",
  "sgp": "SGP",
  "myanmar": "MMR",
  "mmr": "MMR",
  "burma": "MMR",
  "cambodia": "KHM",
  "khm": "KHM",
  "laos": "LAO",
  "lao": "LAO",
  "brunei": "BRN",
  "brn": "BRN",
  "timor_leste": "TLS",
  "timor-leste": "TLS",
  "east timor": "TLS",
  "tls": "TLS",
  "pakistan": "PAK",
  "pak": "PAK",
  "bangladesh": "BGD",
  "bgd": "BGD",
  "sri_lanka": "LKA",
  "sri lanka": "LKA",
  "lka": "LKA",
  "nepal": "NPL",
  "nep": "NPL",
  "npl": "NPL",
  "bhutan": "BTN",
  "btn": "BTN",
  "afghanistan": "AFG",
  "afg": "AFG",
  "kazakhstan": "KAZ",
  "kaz": "KAZ",
  "uzbekistan": "UZB",
  "uzb": "UZB",
  "turkmenistan": "TKM",
  "tkm": "TKM",
  "kyrgyzstan": "KGZ",
  "kgz": "KGZ",
  "tajikistan": "TJK",
  "tjk": "TJK",
  "mongolia": "MNG",
  "mng": "MNG",
  "turkey": "TUR",
  "turkiye": "TUR",
  "tur": "TUR",
  "iran": "IRN",
  "irn": "IRN",
  "iraq": "IRQ",
  "irq": "IRQ",
  "saudi_arabia": "SAU",
  "saudi arabia": "SAU",
  "sau": "SAU",
  "united_arab_emirates": "ARE",
  "united arab emirates": "ARE",
  "uae": "ARE",
  "are": "ARE",
  "israel": "ISR",
  "isr": "ISR",
  "palestine": "PSE",
  "pse": "PSE",
  "jordan": "JOR",
  "jor": "JOR",
  "lebanon": "LBN",
  "lbn": "LBN",
  "syria": "SYR",
  "syr": "SYR",
  "yemen": "YEM",
  "yem": "YEM",
  "oman": "OMN",
  "omn": "OMN",
  "kuwait": "KWT",
  "kwt": "KWT",
  "qatar": "QAT",
  "qat": "QAT",
  "azerbaijan": "AZE",
  "aze": "AZE",
  "armenia": "ARM",
  "arm": "ARM",
  "georgia_tbilisi": "GEO",
  "georgia": "GEO",
  "geo": "GEO",
  "australia": "AUS",
  "aus": "AUS",
  "new_zealand": "NZL",
  "new zealand": "NZL",
  "nzl": "NZL",
  "papua_new_guinea": "PNG",
  "papua new guinea": "PNG",
  "png": "PNG",
  "fiji": "FJI",
  "fji": "FJI",
  "solomon_is": "SLB",
  "solomon islands": "SLB",
  "solomon is.": "SLB",
  "slb": "SLB",
  "vanuatu": "VUT",
  "vut": "VUT",
  "new_caledonia": "NCL",
  "new caledonia": "NCL",
  "ncl": "NCL",
  "dem_rep_congo": "COD",
  "congo": "COD",
  "cod": "COD",
  "democratic_republic_of_the_congo": "COD",
  "democratic republic of the congo": "COD",
  "drc": "COD",
  "dem. rep. congo": "COD",
  "congo-kinshasa": "COD",
  "republic of the congo": "COG",
  "congo-brazzaville": "COG",
  "congo_brazzaville": "COG",
  "cog": "COG",
  "egypt": "EGY",
  "egy": "EGY",
  "south_africa": "ZAF",
  "south africa": "ZAF",
  "zaf": "ZAF",
  "nigeria": "NGA",
  "nga": "NGA",
  "kenya": "KEN",
  "ken": "KEN",
  "ethiopia": "ETH",
  "eth": "ETH",
  "ghana": "GHA",
  "gha": "GHA",
  "algeria": "DZA",
  "dza": "DZA",
  "morocco": "MAR",
  "mar": "MAR",
  "sudan": "SDN",
  "sdn": "SDN",
  "s_sudan": "SSD",
  "south sudan": "SSD",
  "s. sudan": "SSD",
  "ssd": "SSD",
  "angola": "AGO",
  "ago": "AGO",
  "tanzania": "TZA",
  "tza": "TZA",
  "mozambique": "MOZ",
  "moz": "MOZ",
  "madagascar": "MDG",
  "mdg": "MDG",
  "uganda": "UGA",
  "uga": "UGA",
  "zambia": "ZMB",
  "zmb": "ZMB",
  "zimbabwe": "ZWE",
  "zwe": "ZWE",
  "cameroon": "CMR",
  "cmr": "CMR",
  "ivory_coast": "CIV",
  "c_te_d_ivoire": "CIV",
  "cote d'ivoire": "CIV",
  "c\u00f4te d'ivoire": "CIV",
  "civ": "CIV",
  "senegal": "SEN",
  "sen": "SEN",
  "chad": "TCD",
  "tcd": "TCD",
  "somalia": "SOM",
  "som": "SOM",
  "somaliland": "SOM",
  "guinea": "GIN",
  "gin": "GIN",
  "rwanda": "RWA",
  "rwa": "RWA",
  "benin": "BEN",
  "ben": "BEN",
  "burundi": "BDI",
  "bdi": "BDI",
  "tunisia": "TUN",
  "tun": "TUN",
  "libya": "LBY",
  "lby": "LBY",
  "togo": "TGO",
  "tgo": "TGO",
  "sierra_leone": "SLE",
  "sierra leone": "SLE",
  "sle": "SLE",
  "liberia": "LBR",
  "lbr": "LBR",
  "central_african_rep": "CAF",
  "central african republic": "CAF",
  "central african rep.": "CAF",
  "caf": "CAF",
  "mauritania": "MRT",
  "mrt": "MRT",
  "namibia": "NAM",
  "nam": "NAM",
  "botswana": "BWA",
  "bwa": "BWA",
  "gabon": "GAB",
  "gab": "GAB",
  "lesotho": "LSO",
  "lso": "LSO",
  "guinea_bissau": "GNB",
  "guinea-bissau": "GNB",
  "gnb": "GNB",
  "eq_guinea": "GNQ",
  "equatorial guinea": "GNQ",
  "eq. guinea": "GNQ",
  "gnq": "GNQ",
  "djibouti": "DJI",
  "dji": "DJI",
  "eswatini": "SWZ",
  "swaziland": "SWZ",
  "swz": "SWZ",
  "mali": "MLI",
  "mli": "MLI",
  "burkina_faso": "BFA",
  "burkina faso": "BFA",
  "bfa": "BFA",
  "malawi": "MWI",
  "mwi": "MWI",
  "eritrea": "ERI",
  "eri": "ERI",
  "gambia": "GMB",
  "the gambia": "GMB",
  "gmb": "GMB",
  "niger": "NER",
  "ner": "NER",
  "w_sahara": "ESH",
  "western sahara": "ESH",
  "w. sahara": "ESH",
  "esh": "ESH",
  "fr_s_antarctic_lands": "ATF",
  "fr. s. antarctic lands": "ATF"
};

/**
 * Canonical continental/metropolitan bounding boxes for countries with distant overseas territories.
 * Prevents camera from zooming out into the Pacific/Atlantic ocean and keeps map framed
 * tightly around the sovereign mainland / capital region where the core population resides.
 * Format: [[minLat, minLng], [maxLat, maxLng]]
 */
export const CONTINENTAL_BOUNDS = {
  // United States: Lower 48 States + DC (frames mainland heartland)
  USA: [
    [24.3963, -125.0],
    [49.3844, -66.9346],
  ],
  // France: Metropolitan France (excludes French Guiana, Réunion, Guadeloupe)
  FRA: [
    [41.3, -5.5],
    [51.2, 9.6],
  ],
  // United Kingdom: Great Britain & Northern Ireland (excludes Falklands, Gibraltar)
  GBR: [
    [49.8, -8.6],
    [60.9, 1.8],
  ],
  // Spain: Iberian mainland (excludes Canary Islands from initial framing)
  ESP: [
    [35.9, -9.4],
    [43.8, 3.4],
  ],
  // Portugal: Continental Portugal (excludes Azores and Madeira)
  PRT: [
    [36.9, -9.6],
    [42.2, -6.1],
  ],
  // Netherlands: European Netherlands (excludes Caribbean islands)
  NLD: [
    [50.7, 3.3],
    [53.6, 7.3],
  ],
  // Denmark: European Denmark (excludes Greenland and Faroe Islands)
  DNK: [
    [54.5, 8.0],
    [57.8, 15.2],
  ],
  // Norway: Scandinavian Norway (excludes Svalbard & Jan Mayen)
  NOR: [
    [57.9, 4.5],
    [71.2, 31.1],
  ],
};

export function getContinentalBounds(iso3) {
  if (!iso3) return null;
  return CONTINENTAL_BOUNDS[String(iso3).toUpperCase()] || null;
}

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
 * Checks local static cache first, then falls back to live geoBoundaries gbOpen API with CORS.
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
    if (res.ok) {
      const geojson = await res.json();
      if (geojson && geojson.features && Array.isArray(geojson.features)) {
        boundaryCache.set(iso3, geojson);
        return {
          success: true,
          iso3,
          geojson,
          fromCache: false,
        };
      }
    }
  } catch (err) {
    // Continue to live geoBoundaries API fallback
  }

  // 3. Fallback to live geoBoundaries gbOpen API (CORS enabled)
  try {
    const apiUrl = `https://www.geoboundaries.org/api/current/gbOpen/${iso3}/ADM1/`;
    const metaRes = await fetch(apiUrl);
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const gjUrl = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;
      if (gjUrl) {
        const gjRes = await fetch(gjUrl);
        if (gjRes.ok) {
          const raw = await gjRes.json();
          if (raw && raw.features && raw.features.length > 0) {
            const normalized = {
              type: "FeatureCollection",
              features: raw.features.map((f, i) => ({
                type: "Feature",
                id: `${iso3}_${i + 1}`,
                properties: {
                  id: `${iso3}_${i + 1}`,
                  name: f.properties?.shapeName || f.properties?.NAME_1 || f.properties?.shapeISO || `Subdivision ${i + 1}`,
                  iso: f.properties?.shapeISO || `${iso3}-${i + 1}`,
                  type: "ADM1",
                  countryIso3: iso3,
                },
                geometry: f.geometry,
              })),
            };
            boundaryCache.set(iso3, normalized);
            return {
              success: true,
              iso3,
              geojson: normalized,
              fromCache: false,
            };
          }
        }
      }
    }
  } catch (liveErr) {
    console.warn(`[BoundaryService] Online geoBoundaries fallback failed for ${iso3}:`, liveErr);
  }

  return {
    success: false,
    iso3,
    reason: `Geographic boundary dataset currently unavailable for ${iso3}.`,
  };
}

/**
 * Clears the in-memory boundary cache (useful during development / testing).
 */
export function clearBoundaryCache() {
  boundaryCache.clear();
  manifestCache = null;
}
