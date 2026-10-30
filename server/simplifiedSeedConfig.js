import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SIMPLIFIED_60_GOODS = [
  // 1-8 Mining & Metals
  { id: 1, name: "Rare Earth Metals", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 2400, inputs: ["Machine Tools & Machinery", "Chemicals & Explosives"] },
  { id: 2, name: "Iron Ore", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 450, inputs: ["Machine Tools & Machinery"] },
  { id: 3, name: "Copper", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 780, inputs: ["Machine Tools & Machinery"] },
  { id: 4, name: "Aluminium", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 920, inputs: ["Machine Tools & Machinery", "Electricity & Grid"] },
  { id: 5, name: "Gold & Precious Metals", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 3800, inputs: ["Machine Tools & Machinery"] },
  { id: 6, name: "Lead & Heavy Metals", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 520, inputs: ["Machine Tools & Machinery"] },
  { id: 7, name: "Lithium & Batteries", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1950, inputs: ["Rare Earth Metals", "Chemicals & Explosives"] },
  { id: 8, name: "Silicon & Quartz", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 850, inputs: ["Machine Tools & Machinery", "Electricity & Grid"] },

  // 9-15 Energy & Fuels
  { id: 9, name: "Coal & Carbon", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 380, inputs: ["Machine Tools & Machinery"] },
  { id: 10, name: "Stone & Minerals", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 280, inputs: ["Machine Tools & Machinery"] },
  { id: 11, name: "Crude Oil", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 950, inputs: ["Machine Tools & Machinery"] },
  { id: 12, name: "Refined Petroleum & Fuels", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1350, inputs: ["Crude Oil", "Chemicals & Explosives"] },
  { id: 13, name: "Natural Gas", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 720, inputs: ["Machine Tools & Machinery"] },
  { id: 14, name: "Uranium & Nuclear", sector: "Industry & Manufacturing GDP", era: "Atomic", basePrice: 4200, inputs: ["Machine Tools & Machinery", "Chemicals & Explosives"] },
  { id: 15, name: "Electricity & Grid", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 650, inputs: ["Coal & Carbon", "Refined Petroleum & Fuels", "Heavy Engines & Turbines"] },

  // 16-27 Agriculture, Food & Livestock
  { id: 16, name: "Water", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 150, inputs: [] },
  { id: 17, name: "Grain", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 320, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 18, name: "Fresh Produce", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 360, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 19, name: "Fruit & Cash Crops", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 480, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 20, name: "Sugar & Confectionery", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 410, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 21, name: "Coffee & Tea", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 560, inputs: ["Water"] },
  { id: 22, name: "Tobacco & Spirits", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 680, inputs: ["Water", "Sugar & Confectionery"] },
  { id: 23, name: "Cotton & Natural Fibres", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 440, inputs: ["Water", "Fertilizer & Agrochem"] },
  { id: 24, name: "Rubber & Polymers", sector: "Agricultural Sector GDP", era: "Tools", basePrice: 890, inputs: ["Refined Petroleum & Fuels"] },
  { id: 25, name: "Meat & Livestock", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 750, inputs: ["Grain", "Water"] },
  { id: 26, name: "Fisheries & Seafood", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 620, inputs: ["Ships & Marine Vessels"] },
  { id: 27, name: "Dairy Products", sector: "Agricultural Sector GDP", era: "Wooden Tools", basePrice: 490, inputs: ["Meat & Livestock"] },

  // 28-36 Heavy Industry, Materials & Metallurgy
  { id: 28, name: "Wood & Timber", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 310, inputs: ["Machine Tools & Machinery"] },
  { id: 29, name: "Paper & Publishing", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 540, inputs: ["Wood & Timber", "Chemicals & Explosives"] },
  { id: 30, name: "Steel & Iron", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1100, inputs: ["Iron Ore", "Coal & Carbon"] },
  { id: 31, name: "Construction Materials", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 680, inputs: ["Stone & Minerals", "Steel & Iron", "Wood & Timber"] },
  { id: 32, name: "Glass & Ceramics", sector: "Industry & Manufacturing GDP", era: "Stone Tools", basePrice: 510, inputs: ["Silicon & Quartz", "Coal & Carbon"] },
  { id: 33, name: "Industrial Hardware & Pipes", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 840, inputs: ["Steel & Iron", "Copper"] },
  { id: 34, name: "Plastics & Synthetics", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 970, inputs: ["Refined Petroleum & Fuels", "Chemicals & Explosives"] },
  { id: 35, name: "Machine Tools & Machinery", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1650, inputs: ["Steel & Iron", "Industrial Hardware & Pipes"] },
  { id: 36, name: "Heavy Engines & Turbines", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2200, inputs: ["Steel & Iron", "Copper", "Machine Tools & Machinery"] },

  // 37-46 High-Tech, Electronics & Transport
  { id: 37, name: "Semiconductors & Chips", sector: "Industry & Manufacturing GDP", era: "Semi-conductors", basePrice: 2800, inputs: ["Silicon & Quartz", "Rare Earth Metals", "Gold & Precious Metals"] },
  { id: 38, name: "Computers & Electronics", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 2600, inputs: ["Semiconductors & Chips", "Lithium & Batteries", "Plastics & Synthetics"] },
  { id: 39, name: "Telecommunications & Optics", sector: "Office & Corporate Services GDP", era: "Internet", basePrice: 1850, inputs: ["Computers & Electronics", "Glass & Ceramics"] },
  { id: 40, name: "Electrical Consumer Appliances", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 1200, inputs: ["Steel & Iron", "Copper", "Plastics & Synthetics"] },
  { id: 41, name: "Apparel & Footwear", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 580, inputs: ["Cotton & Natural Fibres", "Rubber & Polymers"] },
  { id: 42, name: "Automobiles & Transport Equipment", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2400, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Rubber & Polymers", "Glass & Ceramics"] },
  { id: 43, name: "Railways & Rolling Stock", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 2900, inputs: ["Steel & Iron", "Heavy Engines & Turbines"] },
  { id: 44, name: "Ships & Marine Vessels", sector: "Industry & Manufacturing GDP", era: "Wooden Tools", basePrice: 3200, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Wood & Timber"] },
  { id: 45, name: "Aerospace & Aviation", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 4100, inputs: ["Aluminium", "Heavy Engines & Turbines", "Computers & Electronics"] },
  { id: 46, name: "Spacecraft & Propulsion", sector: "Industry & Manufacturing GDP", era: "Space Age", basePrice: 6500, inputs: ["Aluminium", "Rare Earth Metals", "Computers & Electronics", "Uranium & Nuclear"] },

  // 47-48 Defense & Armaments
  { id: 47, name: "Small Arms & Munitions", sector: "Industry & Manufacturing GDP", era: "Iron Tools", basePrice: 1100, inputs: ["Steel & Iron", "Chemicals & Explosives"] },
  { id: 48, name: "Heavy Armaments & Artillery", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 3800, inputs: ["Steel & Iron", "Heavy Engines & Turbines", "Chemicals & Explosives", "Computers & Electronics"] },

  // 49-60 Health, Consumer & Public Services
  { id: 49, name: "Chemicals & Explosives", sector: "Industry & Manufacturing GDP", era: "Tools", basePrice: 920, inputs: ["Refined Petroleum & Fuels", "Stone & Minerals"] },
  { id: 50, name: "Fertilizer & Agrochem", sector: "Agricultural Sector GDP", era: "Tools", basePrice: 670, inputs: ["Chemicals & Explosives", "Natural Gas"] },
  { id: 51, name: "Solar & Clean Energy", sector: "Industry & Manufacturing GDP", era: "Internet", basePrice: 1750, inputs: ["Silicon & Quartz", "Aluminium", "Lithium & Batteries"] },
  { id: 52, name: "Pharmaceuticals & Medicine", sector: "Office & Corporate Services GDP", era: "Tools", basePrice: 2100, inputs: ["Chemicals & Explosives", "Water"] },
  { id: 53, name: "Medical Technology & Services", sector: "Hospitality & Tourist Services GDP", era: "Internet", basePrice: 2500, inputs: ["Pharmaceuticals & Medicine", "Computers & Electronics"] },
  { id: 54, name: "Processed Foods & Hospitality", sector: "Hospitality & Tourist Services GDP", era: "Wooden Tools", basePrice: 850, inputs: ["Grain", "Meat & Livestock", "Sugar & Confectionery"] },
  { id: 55, name: "Retail, Trade & Logistics", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 1100, inputs: ["Automobiles & Transport Equipment", "Paper & Publishing"] },
  { id: 56, name: "Housing & Real Estate", sector: "Hospitality & Tourist Services GDP", era: "Stone Tools", basePrice: 1800, inputs: ["Construction Materials", "Glass & Ceramics", "Electricity & Grid"] },
  { id: 57, name: "Media, Internet & Software", sector: "Office & Corporate Services GDP", era: "Internet", basePrice: 2300, inputs: ["Computers & Electronics", "Telecommunications & Optics"] },
  { id: 58, name: "Banking & Financial Services", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 2900, inputs: ["Media, Internet & Software", "Gold & Precious Metals"] },
  { id: 59, name: "Public Administration & Governance", sector: "Office & Corporate Services GDP", era: "Wooden Tools", basePrice: 1400, inputs: ["Paper & Publishing", "Banking & Financial Services"] },
  { id: 60, name: "Controlled & Illicit Goods", sector: "Hospitality & Tourist Services GDP", era: "Wooden Tools", basePrice: 3200, inputs: ["Chemicals & Explosives", "Water"] }
];

export const OLD_TO_SIMPLIFIED_MAP = {
  // Rare Earths
  "Barium": "Rare Earth Metals", "Magnesium": "Rare Earth Metals", "Neodymium": "Rare Earth Metals",
  "Neodymium Magnets": "Rare Earth Metals", "Cobalt": "Rare Earth Metals", "Cobalt Ore": "Rare Earth Metals",
  "Lithium": "Lithium & Batteries", "Lithium Ore": "Lithium & Batteries", "Li-ion Batteries": "Lithium & Batteries",
  
  // Basic Minerals
  "Iron Ore": "Iron Ore", "Copper Ore": "Copper", "Copper": "Copper",
  "Lead Ore": "Lead & Heavy Metals", "Lead": "Lead & Heavy Metals", "Tin Ore": "Lead & Heavy Metals", "Tin": "Lead & Heavy Metals",
  "Aluminimum Ore": "Aluminium", "Aluminium": "Aluminium", "Gold": "Gold & Precious Metals",
  "Silicon": "Silicon & Quartz", "Sand": "Silicon & Quartz",
  "Coal": "Coal & Carbon", "Graphite": "Coal & Carbon",
  "Stone": "Stone & Minerals", "Limestone": "Stone & Minerals", "Clay": "Stone & Minerals",
  
  // Chemicals & Fuels
  "Niter": "Chemicals & Explosives", "Sulphur": "Chemicals & Explosives", "Gunpowder": "Chemicals & Explosives",
  "Explosives": "Chemicals & Explosives", "Synthetic Organic Chemicals": "Chemicals & Explosives", "Brine": "Chemicals & Explosives", "Salt": "Chemicals & Explosives",
  "Pesticide": "Fertilizer & Agrochem", "Fertilizer": "Fertilizer & Agrochem", "Phosphate": "Fertilizer & Agrochem",
  "Crude Oil": "Crude Oil", "Petroleum": "Refined Petroleum & Fuels", "Diesel": "Refined Petroleum & Fuels",
  "Bitumen": "Refined Petroleum & Fuels", "Asphalt": "Refined Petroleum & Fuels", "Natural Gas": "Natural Gas",
  "Electricity": "Electricity & Grid", "Hydroelectricity": "Electricity & Grid",
  "Uranium Ore": "Uranium & Nuclear", "Uranium": "Uranium & Nuclear", "Atomic": "Uranium & Nuclear",
  "Turbine": "Heavy Engines & Turbines", "Solar Panels": "Solar & Clean Energy",

  // Agriculture & Livestock
  "Water": "Water", "Wheat": "Grain", "Rice": "Grain", "Corn": "Grain", "Canned Corn": "Grain",
  "Potatoes": "Fresh Produce", "Preserved Vegetables": "Fresh Produce", "Onions": "Fresh Produce", "Tomatoes": "Fresh Produce",
  "Mangoes": "Fruit & Cash Crops", "Juices": "Fruit & Cash Crops",
  "Sugarcane": "Sugar & Confectionery", "Sugar": "Sugar & Confectionery",
  "Coffee": "Coffee & Tea", "Tea": "Coffee & Tea",
  "Tobacco": "Tobacco & Spirits", "Cigarettes": "Tobacco & Spirits", "Alcohol": "Tobacco & Spirits",
  "Cotton": "Cotton & Natural Fibres", "Indigofera": "Cotton & Natural Fibres", "Dye": "Cotton & Natural Fibres",
  "Silk": "Cotton & Natural Fibres", "Raw Rubber": "Rubber & Polymers", "Rubber": "Rubber & Polymers",
  "Beef": "Meat & Livestock", "Corned Beef": "Meat & Livestock", "Pork": "Meat & Livestock", "Chicken": "Meat & Livestock",
  "Fish": "Fisheries & Seafood", "Milk": "Dairy Products", "Soybeans": "Fresh Produce",

  // Heavy Industry
  "Wood": "Wood & Timber", "Paper": "Paper & Publishing", "Cardboard": "Paper & Publishing", "Ink": "Paper & Publishing",
  "Books": "Paper & Publishing", "Pencil": "Paper & Publishing", "Pen": "Paper & Publishing", "Newspaper": "Paper & Publishing", "Printing Press": "Paper & Publishing",
  "Iron": "Steel & Iron", "Iron (Smelted Goods)": "Steel & Iron", "Steel": "Steel & Iron", "Steel (Industry 1.0)": "Steel & Iron",
  "Construction": "Construction Materials", "Bricks": "Construction Materials", "Concrete": "Construction Materials",
  "Glass": "Glass & Ceramics", "Porcelain": "Glass & Ceramics", "Pipes": "Industrial Hardware & Pipes",
  "Plastic": "Plastics & Synthetics", "Tools": "Machine Tools & Machinery",
  "Steam Engine": "Heavy Engines & Turbines", "Diesel Engine": "Heavy Engines & Turbines", "Petroleum Engine": "Heavy Engines & Turbines", "Electric Engines": "Heavy Engines & Turbines",

  // Tech, Electronics & Vehicles
  "Semi-Conductor": "Semiconductors & Chips", "Motherboard": "Computers & Electronics", "Computer": "Computers & Electronics", "Screens": "Computers & Electronics",
  "Radio": "Telecommunications & Optics", "Telephone": "Telecommunications & Optics", "Telephone (Electronics)": "Telecommunications & Optics",
  "Radar": "Telecommunications & Optics", "GPS": "Telecommunications & Optics", "Camera": "Telecommunications & Optics",
  "Lightbulb": "Electrical Consumer Appliances", "Speaker": "Electrical Consumer Appliances", "Television": "Electrical Consumer Appliances",
  "Refridgerator": "Electrical Consumer Appliances", "Air-Conditioning": "Electrical Consumer Appliances", "Electric Oven": "Electrical Consumer Appliances",
  "Toys": "Apparel & Footwear", "Clothes": "Apparel & Footwear", "Fabric": "Apparel & Footwear", "Leather": "Apparel & Footwear",
  "Vehicular Chassis": "Automobiles & Transport Equipment", "Tyre": "Automobiles & Transport Equipment", "Early Car": "Automobiles & Transport Equipment",
  "Passenger Car": "Automobiles & Transport Equipment", "Bicycle": "Automobiles & Transport Equipment", "Truck": "Automobiles & Transport Equipment", "ZIL-130 Truck": "Automobiles & Transport Equipment", "Tractor": "Automobiles & Transport Equipment",
  "Rail Tracks": "Railways & Rolling Stock", "Steam Train": "Railways & Rolling Stock", "Diesel Train": "Railways & Rolling Stock", "Railway Transport": "Railways & Rolling Stock",
  "Boats": "Ships & Marine Vessels", "River Transport": "Ships & Marine Vessels",
  "Airplane": "Aerospace & Aviation", "Aircraft Maintenance": "Aerospace & Aviation",
  "Rocket": "Spacecraft & Propulsion", "Rocket Engine": "Spacecraft & Propulsion", "Ion-Drive Engine": "Spacecraft & Propulsion", "Space Age": "Spacecraft & Propulsion",

  // Defense
  "Sword": "Small Arms & Munitions", "Bow & Arrow": "Small Arms & Munitions", "AK-47": "Small Arms & Munitions", "Ammunition": "Small Arms & Munitions", "Combat Rations": "Small Arms & Munitions",
  "82mm Mortars": "Heavy Armaments & Artillery", "122mm Field Gun": "Heavy Armaments & Artillery", "PT-76 Light Tank": "Heavy Armaments & Artillery",
  "T-54 Tank": "Heavy Armaments & Artillery", "Surface-Air Missile Systems": "Heavy Armaments & Artillery", "I1-28 Bomber": "Heavy Armaments & Artillery", "MiG-17": "Heavy Armaments & Artillery", "Nuclear Submarines": "Heavy Armaments & Artillery",

  // Health, Consumer & Public Services
  "Penicillin": "Pharmaceuticals & Medicine", "Quinine": "Pharmaceuticals & Medicine", "Micro-Organisms": "Pharmaceuticals & Medicine", "Bandages": "Pharmaceuticals & Medicine",
  "MRI": "Medical Technology & Services", "Medical Services": "Medical Technology & Services",
  "Bread": "Processed Foods & Hospitality", "Bread (Smelted Goods)": "Processed Foods & Hospitality", "Carbonated Drinks": "Processed Foods & Hospitality",
  "Fast Food": "Processed Foods & Hospitality", "Hamburger": "Processed Foods & Hospitality", "Hotelling Services": "Processed Foods & Hospitality", "Luxury Resorts": "Processed Foods & Hospitality",
  "Hiking": "Processed Foods & Hospitality", "Skiing": "Processed Foods & Hospitality",
  "Groceries": "Retail, Trade & Logistics", "Domestic Trade": "Retail, Trade & Logistics", "International Trade": "Retail, Trade & Logistics",
  "Roads": "Retail, Trade & Logistics", "Road Transport": "Retail, Trade & Logistics", "Taxi Service": "Retail, Trade & Logistics",
  "Housing": "Housing & Real Estate",
  "Internet": "Media, Internet & Software", "AI": "Media, Internet & Software", "Computer Software": "Media, Internet & Software", "Data Analytics": "Media, Internet & Software", "Movies": "Media, Internet & Software", "Streaming Services": "Media, Internet & Software",
  "University Degrees": "Banking & Financial Services", "Research": "Banking & Financial Services", "Financial Services": "Banking & Financial Services", "Credit Cards": "Banking & Financial Services",
  "Headhunting Services": "Banking & Financial Services", "Legal Services": "Banking & Financial Services",
  "State Offices": "Public Administration & Governance", "State Dept": "Public Administration & Governance", "Treasury Dept": "Public Administration & Governance", "Interior Dept": "Public Administration & Governance", "Agriculture Dept": "Public Administration & Governance", "Justice Dept": "Public Administration & Governance", "Waste Management": "Public Administration & Governance",
  "Opium": "Controlled & Illicit Goods", "Marijuana": "Controlled & Illicit Goods", "Fentanyl": "Controlled & Illicit Goods", "Mafia": "Controlled & Illicit Goods", "Prostitution": "Controlled & Illicit Goods"
};

export function buildSimplifiedSeed(originalSeed) {
  const seed = JSON.parse(JSON.stringify(originalSeed));
  seed.goodsCatalog = SIMPLIFIED_60_GOODS.map(g => ({
    id: g.id,
    name: g.name,
    sector: g.sector,
    goodType: g.name,
    era: g.era,
    inputs: g.inputs,
    basePrice: g.basePrice
  }));

  for (const nation of seed.nations || []) {
    // Purge companies completely
    nation.companies = [];

    // Map old market configs to simplified goods
    const existingMarketByGood = new Map((nation.market || []).map(m => [m.goodName, m]));
    const newMarket = SIMPLIFIED_60_GOODS.map(g => {
      // Find an existing entry if exact name matched, or inherit average values
      const existing = existingMarketByGood.get(g.name);
      return {
        goodName: g.name,
        hype: existing ? existing.hype : 50,
        ddMultiplier: existing ? existing.ddMultiplier : 1.0,
        exportTariffRate: existing ? existing.exportTariffRate : 0.0,
        importTariffRate: existing ? existing.importTariffRate : 0.1,
        illegal: g.name === "Controlled & Illicit Goods" ? true : Boolean(existing?.illegal)
      };
    });
    nation.market = newMarket;
  }

  // Power Blocs removed — states in Europe and globally are represented as sovereign nations
  seed.powerBlocs = [];

  if (!seed.planetsConfig) {
    seed.planetsConfig = [
      {
        id: "Earth",
        name: "Earth",
        description: "Birthplace of humanity, planetary cradle and primary center of agriculture and heavy industry.",
        freightTariffRate: 0.05,
        transitDays: 0,
        habitability: 1.0,
        independenceDesire: 0
      },
      {
        id: "Mars",
        name: "Mars",
        description: "Red Planet industrial and colonial frontier, specialized in rare metals and orbital propulsion.",
        freightTariffRate: 0.15,
        transitDays: 90,
        habitability: 0.65,
        independenceDesire: 42
      },
      {
        id: "Luna",
        name: "Luna (The Moon)",
        description: "Earth orbital satellite, mass driver hub and vacuum solar foundry network.",
        freightTariffRate: 0.08,
        transitDays: 7,
        habitability: 0.35,
        independenceDesire: 20
      }
    ];
  }

  return seed;
}

