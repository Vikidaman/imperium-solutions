/**
 * Canonical Geographic to Simulator Subdivision Mapping
 * Maps real-world first-level administrative divisions (ADM1) to simulator economic zones.
 * Ensures administrative geography remains distinct from simulated economic indicators.
 */

export const ADM1_ZONE_MAPPING = {
  // Democratic Republic of the Congo (26 real provinces mapped to simulation functional roles)
  COD: {
    "Kinshasa": { zoneName: "Kinshasa Capital District", role: "Metropolitan Administration & Financial Gateway" },
    "Haut-Katanga": { zoneName: "Katanga Copperbelt Industrial Basin", role: "Heavy Mining, Smelting & Cobalt Reserves" },
    "Lualaba": { zoneName: "Katanga Copperbelt Industrial Basin", role: "Strategic Mineral Extraction & Battery Metals" },
    "Haut-Lomami": { zoneName: "Katanga Copperbelt Industrial Basin", role: "Mining Logistics & Heavy Transport" },
    "Tanganyika": { zoneName: "Katanga Copperbelt Industrial Basin", role: "Great Lakes Waterway & Minerals" },
    "Kongo Central": { zoneName: "Atlantic Maritime Gateway", role: "Atlantic Ocean Seaport Logistics & Inga Hydroelectric" },
    "Mai-Ndombe": { zoneName: "Agro-Forestry & Riverine Basin", role: "Congo River Freight & Primary Agriculture" },
    "Kwilu": { zoneName: "Agro-Forestry & Riverine Basin", role: "Food Security & Palm Oil Production" },
    "Kwango": { zoneName: "Agro-Forestry & Riverine Basin", role: "Border Commerce & Agrarian Communities" },
    "Kasaï": { zoneName: "Kasaï Diamond & Mineral Corridor", role: "Gemstone Reserves & Secondary Processing" },
    "Kasaï-Central": { zoneName: "Kasaï Diamond & Mineral Corridor", role: "Central Transportation Hub" },
    "Kasaï-Oriental": { zoneName: "Kasaï Diamond & Mineral Corridor", role: "Industrial Diamond Mining (Bakwanga)" },
    "Lomami": { zoneName: "Kasaï Diamond & Mineral Corridor", role: "Agricultural Hinterland" },
    "Sankuru": { zoneName: "Kasaï Diamond & Mineral Corridor", role: "Primary Crop Harvest & Forest Land" },
    "North Kivu": { zoneName: "Eastern Great Lakes Logistics Core", role: "Cross-Border Trade & Volcanic Agriculture" },
    "South Kivu": { zoneName: "Eastern Great Lakes Logistics Core", role: "Lake Kivu Methane & Hydro Power" },
    "Ituri": { zoneName: "Northeastern Resource Frontier", role: "Gold Reserves & Agricultural Trade" },
    "Tshopo": { zoneName: "Northeastern Resource Frontier", role: "Kisangani River Port & Forestry" },
    "Haut-Uélé": { zoneName: "Northeastern Resource Frontier", role: "Kibali Mineral Basin" },
    "Bas-Uélé": { zoneName: "Northeastern Resource Frontier", role: "Savanna Agropastoral Zone" },
    "Équateur": { zoneName: "Congo Basin Equatorial Core", role: "Mbandaka River Basin & Rubber Production" },
    "Mongala": { zoneName: "Congo Basin Equatorial Core", role: "Inland Waterways & Agriculture" },
    "Nord-Ubangi": { zoneName: "Northern Frontier", role: "Border Commerce" },
    "Sud-Ubangi": { zoneName: "Northern Frontier", role: "Commercial Plantations" },
    "Tshuapa": { zoneName: "Congo Basin Equatorial Core", role: "Equatorial Rainforest Wilderness" },
    "Maniema": { zoneName: "Eastern Mineral Frontier", role: "Tin, Tantalum & Wolframite (3T)" },
  },

  // United States (50 constituent states + DC)
  USA: {
    "District of Columbia": { zoneName: "Federal District", role: "National Government & Sovereign Institutions" },
    "California": { zoneName: "Pacific Coast Economic Corridor", role: "Global Technology, Entertainment & Agriculture" },
    "Texas": { zoneName: "Gulf Energy & Industrial Basin", role: "Hydrocarbons, Aerospace, Petrochemicals & Heavy Manufacturing" },
    "New York": { zoneName: "Northeastern Financial Core", role: "Global Capital Markets, Banking & Corporate Headquarters" },
    "Florida": { zoneName: "Southeastern Logistics Gateway", role: "Maritime Trade, Aerospace & Tourist Services" },
    "Illinois": { zoneName: "Midwestern Freight Crossroads", role: "Commodities Exchange, Rail Freight & Heavy Machinery" },
  },
};

/**
 * Retrieves the linked simulator zone and role for a real ADM1 geographic unit.
 */
export function getLinkedSubdivision(iso3, adm1Name) {
  if (!iso3 || !adm1Name) return null;
  const countryMap = ADM1_ZONE_MAPPING[iso3.toUpperCase()];
  if (!countryMap) return null;

  // Direct match
  if (countryMap[adm1Name]) {
    return countryMap[adm1Name];
  }

  // Case-insensitive / partial match
  const lower = adm1Name.toLowerCase();
  for (const [key, val] of Object.entries(countryMap)) {
    if (key.toLowerCase() === lower || lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  return null;
}

