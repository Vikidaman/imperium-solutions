/**
 * Imperium Solutions — Authoritative United States Geographic Resource Endowments
 * Grounded in empirical data from:
 * - USGS (U.S. Geological Survey) Mineral Commodity Summaries & MRDS
 * - EIA (U.S. Energy Information Administration) State Energy Data System (SEDS)
 * - USDA (U.S. Department of Agriculture) NASS & ERS Agricultural Census
 * - NOAA / US Army Corps of Engineers (USACE) Navigable Waterways & Deepwater Ports
 */

export const US_GEOGRAPHIC_ENDOWMENTS = {
  "Texas": {
    name: "Texas",
    code: "TX",
    region: "Gulf Coast & Great Plains",
    hydrocarbonIndex: 98,
    mineralIndex: 65,
    arableLandIndex: 82,
    logisticsWaterwayIndex: 94,
    primaryBasins: [
      { name: "Permian Basin", type: "oil_gas", coords: [-102.5, 31.8], desc: "World-class super-basin; produces >5.5M bbl/d crude oil and 22 Bcf/d natural gas" },
      { name: "Eagle Ford Shale", type: "oil_gas", coords: [-98.6, 28.8], desc: "Major condensate, light crude and natural gas liquids play in South Texas" },
      { name: "Port of Houston & Corpus Christi", type: "port", coords: [-95.3, 29.7], desc: "Largest crude oil and refined petrochemical export gateway in the Western Hemisphere" },
      { name: "Round Top Deposit", type: "mineral", coords: [-105.4, 31.3], desc: "Large heavy rare earth elements (REE), lithium, gallium and beryllium mineral deposit" },
      { name: "Texas High Plains & Cotton Belt", type: "agri", coords: [-101.9, 33.6], desc: "Produces ~40% of all US cotton, major beef cattle feedlots and sorghum" }
    ],
    resources: {
      hydrocarbons: "Crude Oil: 2.0B bbl/yr (42% US total); Natural Gas: 11.2T cu ft/yr (28% US total); Massive Gulf Coast refining capacity (6.0M bbl/d)",
      criticalMinerals: "Round Top heavy rare earths (gallium, dysprosium, terbium), industrial silica/frac sand, sulfur, helium",
      agriculture: "U.S. #1 in Cattle & Calves (12.5M head), #1 in Cotton (6.2M bales), major winter wheat, grain sorghum, and timber in East Texas",
      logistics: "Port of Houston (#1 US waterborne foreign tonnage), Port of Corpus Christi (#1 US crude exporter), intracoastal waterways"
    },
    modeledIndustrialOutput: "$410B (Petrochemicals, Oil/Gas Extraction, Heavy Refining, Defense Electronics)",
    modeledAgriculturalOutput: "$32B (Livestock, Cotton, Grain, Feed Crops)",
    sourceAttribution: "USGS / EIA SEDS 2024 / USDA ERS"
  },

  "California": {
    name: "California",
    code: "CA",
    region: "Pacific Coast & Central Valley",
    hydrocarbonIndex: 42,
    mineralIndex: 88,
    arableLandIndex: 96,
    logisticsWaterwayIndex: 95,
    primaryBasins: [
      { name: "Mountain Pass Mine", type: "mineral", coords: [-115.5, 35.5], desc: "Sole active US rare earth mine (bastnäsite); produces ~42,000 metric tons REO/yr (~15% of global supply)" },
      { name: "San Joaquin Valley & Central Valley", type: "agri", coords: [-119.8, 36.7], desc: "World's most productive agricultural valley; produces >33% of US vegetables and >66% of US fruits/nuts" },
      { name: "Salton Sea Geothermal Lithium", type: "mineral", coords: [-115.8, 33.3], desc: "Massive geothermal brine reservoir estimated with 3.4M metric tons of recoverable lithium" },
      { name: "Ports of Los Angeles & Long Beach", type: "port", coords: [-118.2, 33.7], desc: "Premier trans-Pacific maritime container gateway handling >30% of all US container imports" }
    ],
    resources: {
      hydrocarbons: "San Joaquin Valley heavy crude oil, Kern River oil field, offshore Pacific oil platforms (~120M bbl/yr)",
      criticalMinerals: "Mountain Pass (Neodymium, Praseodymium, Lanthanum, Cerium), Salton Sea (Lithium), boron (Boron mine #1 in world), rare aggregates",
      agriculture: "U.S. #1 agricultural producer ($59B/yr): almonds, pistachios, grapes/wine, citrus, strawberries, dairy ($7.5B milk #1 US)",
      logistics: "Ports of Los Angeles & Long Beach (twin ports complex), Port of Oakland, San Francisco Bay deepwater channels"
    },
    modeledIndustrialOutput: "$360B (High-Tech Semiconductors, Aerospace, Medical Tech, Clean Energy Hardware)",
    modeledAgriculturalOutput: "$59B (Fruits, Tree Nuts, Vegetables, Dairy, Wine)",
    sourceAttribution: "USGS Minerals / USDA NASS 2024 / Port of LA"
  },

  "Minnesota": {
    name: "Minnesota",
    code: "MN",
    region: "Upper Midwest & Great Lakes",
    hydrocarbonIndex: 5,
    mineralIndex: 94,
    arableLandIndex: 86,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Mesabi Iron Range", type: "mineral", coords: [-92.8, 47.4], desc: "Crown jewel of North American iron mining; produces >80% of all United States raw iron ore & taconite pellets" },
      { name: "Duluth-Superior Twin Ports", type: "port", coords: [-92.1, 46.8], desc: "Busiest freshwater port in North America; ships 35M tons of iron ore and grain across the Great Lakes" },
      { name: "Red River Valley & Southern Prairies", type: "agri", coords: [-96.4, 47.9], desc: "Prime fertile black soil producing world-leading sugarbeets, soybeans, corn, and spring wheat" }
    ],
    resources: {
      hydrocarbons: "Non-producing (energy consumer, major oil pipeline corridor from Alberta/Bakken via Enbridge)",
      criticalMinerals: "Mesabi Range taconite/iron ore (35M metric tons/yr), Duluth Complex copper-nickel-platinum-cobalt reserves",
      agriculture: "U.S. #1 in Sugarbeets, #3 in Soybeans, #4 in Corn for Grain, #2 in Hogs & Turkeys ($21B agricultural cash receipts)",
      logistics: "Great Lakes iron ore bulk freighters (1,000-ft lakers), headwaters of the Mississippi River navigation channel"
    },
    modeledIndustrialOutput: "$75B (Iron Ore Mining & Pelletizing, Heavy Machinery, Medical Devices, Food Processing)",
    modeledAgriculturalOutput: "$21B (Soybeans, Corn, Sugarbeets, Swine, Poultry)",
    sourceAttribution: "USGS Iron Ore Statistics / USDA ERS / Port of Duluth"
  },

  "Pennsylvania": {
    name: "Pennsylvania",
    code: "PA",
    region: "Appalachian & Mid-Atlantic",
    hydrocarbonIndex: 90,
    mineralIndex: 72,
    arableLandIndex: 65,
    logisticsWaterwayIndex: 85,
    primaryBasins: [
      { name: "Marcellus Shale Basin", type: "oil_gas", coords: [-77.2, 41.2], desc: "Largest natural gas producing formation in North America; delivers 20 Bcf/d of dry gas (~20% of US production)" },
      { name: "Appalachian Metallurgical Coal Belt", type: "oil_gas", coords: [-79.9, 40.1], desc: "High-grade coking and metallurgical coal vital for integrated steel forges and blast furnaces" },
      { name: "Port of Philadelphia & Delaware River", type: "port", coords: [-75.1, 39.9], desc: "Major Atlantic deepwater gateway for energy, chemicals, and containerized transatlantic cargo" }
    ],
    resources: {
      hydrocarbons: "Natural Gas: 7.5T cu ft/yr (#2 US behind Texas); Appalachian bituminous and anthracite coal (38M tons/yr)",
      criticalMinerals: "Limestone, dolomite, specialty silica, rare metallurgical clays, legacy iron deposits",
      agriculture: "U.S. #1 in Mushrooms (>60% US total), top-5 in Dairy (#4 in milk quality), apples, poultry, hardwoods",
      logistics: "Three Rivers junction in Pittsburgh (Ohio River barge navigation to Gulf), Port of Philadelphia, Port of Erie"
    },
    modeledIndustrialOutput: "$130B (Natural Gas Processing, Steel Alloys, Heavy Machinery, Chemicals, Bio-Pharma)",
    modeledAgriculturalOutput: "$10B (Dairy, Specialty Mushrooms, Poultry, Fruit)",
    sourceAttribution: "EIA SEDS 2024 / USGS / USDA"
  },

  "Wyoming": {
    name: "Wyoming",
    code: "WY",
    region: "Mountain West & Powder River Basin",
    hydrocarbonIndex: 92,
    mineralIndex: 95,
    arableLandIndex: 38,
    logisticsWaterwayIndex: 40,
    primaryBasins: [
      { name: "Powder River Basin", type: "oil_gas", coords: [-105.5, 44.3], desc: "Largest coal-producing basin in the US; mines ~240M tons of clean low-sulfur sub-bituminous coal/yr (~41% of US total)" },
      { name: "Green River Trona Basin", type: "mineral", coords: [-109.5, 41.5], desc: "World's largest deposit of trona (natural soda ash); supplies >90% of US soda ash for glass and chemicals" },
      { name: "Bear Lodge & Halleck Creek REE", type: "mineral", coords: [-104.4, 44.5], desc: "Vast unconventional rare earth deposits rich in magnet metals (neodymium, praseodymium)" },
      { name: "Powder River & Shirley Basin Uranium", type: "mineral", coords: [-106.0, 42.5], desc: "Leading US uranium in-situ recovery (ISR) reserve and processing infrastructure" }
    ],
    resources: {
      hydrocarbons: "Coal: 240M tons/yr (#1 US); Crude Oil: 90M bbl/yr; Natural Gas: 1.3T cu ft/yr; Helium reserves",
      criticalMinerals: "Trona / Soda Ash (#1 world deposit), Uranium (#1 US reserves), Rare Earths (Halleck Creek ~2.3B ton deposit)",
      agriculture: "Extensive livestock ranching (1.3M cattle), hay and forage crops, wool",
      logistics: "BNSF and Union Pacific heavy unit coal and mineral trains (rail freight corridors)"
    },
    modeledIndustrialOutput: "$38B (Coal Extraction, Trona Refining, Uranium Mining, Oil & Gas Processing)",
    modeledAgriculturalOutput: "$2.2B (Beef Cattle Ranching, Hay, Wool)",
    sourceAttribution: "USGS Minerals / EIA Coal Report / Wyoming State Geological Survey"
  },

  "Nevada": {
    name: "Nevada",
    code: "NV",
    region: "Great Basin & Basin-and-Range",
    hydrocarbonIndex: 12,
    mineralIndex: 99,
    arableLandIndex: 25,
    logisticsWaterwayIndex: 45,
    primaryBasins: [
      { name: "Carlin Trend & Cortez Gold Belt", type: "mineral", coords: [-116.3, 40.7], desc: "Top gold mining region in the Western Hemisphere; produces ~3.5M troy oz gold/yr (~73% of US production)" },
      { name: "Thacker Pass Lithium Deposit", type: "mineral", coords: [-118.0, 41.7], desc: "Largest known lithium claystone deposit in North America (~17.9M metric tons lithium carbonate equivalent)" },
      { name: "Silver Peak Clayton Valley Brine", type: "mineral", coords: [-117.5, 37.7], desc: "Longest-running operating lithium brine extraction facility in North America" }
    ],
    resources: {
      hydrocarbons: "Minimal oil production in Railroad Valley; immense geothermal energy potential (#1 US geothermal per capita)",
      criticalMinerals: "Lithium (#1 US reserves & production), Gold (#1 US ~73%), Silver (#2 US), Copper, Barite, Molybdenum, Diatomite",
      agriculture: "High-desert alfalfa hay, beef cattle, sheep, onion cultivation",
      logistics: "Interstate 80 rail and highway freight corridor connecting Northern California ports to Midwest"
    },
    modeledIndustrialOutput: "$42B (Precious Metals Mining, Lithium Battery Chemical Refining, Gigafactories, Geothermal Power)",
    modeledAgriculturalOutput: "$1.1B (Alfalfa Hay, Beef Cattle)",
    sourceAttribution: "USGS Mineral Commodity Summaries / Nevada Division of Minerals"
  },

  "Arizona": {
    name: "Arizona",
    code: "AZ",
    region: "Desert Southwest & Copper Corridor",
    hydrocarbonIndex: 8,
    mineralIndex: 96,
    arableLandIndex: 45,
    logisticsWaterwayIndex: 50,
    primaryBasins: [
      { name: "Morenci Copper Mine", type: "mineral", coords: [-109.3, 33.0], desc: "Largest copper mining complex in North America; produces ~400,000 metric tons of cathode copper annually" },
      { name: "Resolution Copper & Superior Basin", type: "mineral", coords: [-111.1, 33.3], desc: "One of the world's deepest and richest undeveloped copper-molybdenum porphyry ore bodies" },
      { name: "Yuma Agricultural Irrigation Basin", type: "agri", coords: [-114.6, 32.7], desc: "Winter lettuce & vegetable capital of North America fed by Colorado River irrigation" }
    ],
    resources: {
      hydrocarbons: "Negligible fossil fuels; high solar photovoltaic irradiance potential (top-3 US)",
      criticalMinerals: "Copper: 850,000 metric tons/yr (~71% of total US copper production); Molybdenum, Rhenium, Silver, Sand & Gravel",
      agriculture: "Winter leafy greens & lettuce (90% of US winter supply), cotton, alfalfa, durum wheat, citrus",
      logistics: "Southern Pacific / Union Pacific transcontinental rail mainline; CANAMEX corridor to Mexico"
    },
    modeledIndustrialOutput: "$55B (Copper Smelting & Refining, Semiconductor Wafer Fabs, Aerospace Defense)",
    modeledAgriculturalOutput: "$5.8B (Winter Vegetables, Alfalfa, Cotton, Citrus)",
    sourceAttribution: "USGS Copper Report / Arizona Geological Survey / USDA"
  },

  "Iowa": {
    name: "Iowa",
    code: "IA",
    region: "Heartland Corn Belt",
    hydrocarbonIndex: 15,
    mineralIndex: 30,
    arableLandIndex: 99,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Heartland Corn & Soy Belt", type: "agri", coords: [-93.5, 42.0], desc: "World-class Mollisol arable soils; produces >2.5B bushels of corn (#1 US) and 550M bushels of soybeans (#2 US)" },
      { name: "Mississippi & Missouri River Barges", type: "port", coords: [-90.2, 41.5], desc: "Vital river lock systems floating hundreds of grain barges downriver directly to Gulf export elevators" },
      { name: "Ethanol & Biofuel Refining Core", type: "agri", coords: [-94.2, 42.5], desc: "Largest renewable fuel producing state, converting 1.4B bushels of corn into 4.5B gallons of ethanol" }
    ],
    resources: {
      hydrocarbons: "U.S. leader in Wind Energy (>60% of in-state electricity generation) and Ethanol Biofuel (#1 US)",
      criticalMinerals: "Limestone, gypsum, construction aggregates, clay",
      agriculture: "U.S. #1 in Corn, #1 in Pork (24M hogs ~33% of US), #1 in Eggs (15B eggs/yr), #2 in Soybeans ($38B total output)",
      logistics: "Eastern border formed by Mississippi River navigable channel; Western border formed by Missouri River"
    },
    modeledIndustrialOutput: "$45B (Biofuel Refineries, Ag Machinery Manufacturing - John Deere, Food Processing)",
    modeledAgriculturalOutput: "$38B (Corn, Soybeans, Hogs, Poultry, Dairy)",
    sourceAttribution: "USDA NASS 2024 / EIA SEDS / Iowa Department of Agriculture"
  },

  "North Dakota": {
    name: "North Dakota",
    code: "ND",
    region: "Northern Great Plains & Williston Basin",
    hydrocarbonIndex: 94,
    mineralIndex: 45,
    arableLandIndex: 85,
    logisticsWaterwayIndex: 48,
    primaryBasins: [
      { name: "Bakken Shale Formation", type: "oil_gas", coords: [-103.0, 48.0], desc: "Prolific tight oil formation; produces ~1.2M bbl/d crude oil and 3.2 Bcf/d natural gas" },
      { name: "Red River Valley Spring Wheat", type: "agri", coords: [-97.1, 47.9], desc: "Premier hard red spring wheat, durum wheat, and sunflower seed belt" }
    ],
    resources: {
      hydrocarbons: "Crude Oil: 430M bbl/yr (#3 US); Natural Gas: 1.1T cu ft/yr; Lignite coal for mine-mouth power",
      criticalMinerals: "Lignite coal, rare clay elements, Leonardite (organic soil conditioner), silica aggregates",
      agriculture: "U.S. #1 in Hard Red Spring Wheat, #1 in Durum Wheat (pasta), #1 in Sunflowers, #1 in Canola, #1 in Flaxseed",
      logistics: "BNSF transcontinental high-capacity grain and crude oil rail networks; pipeline arteries to Illinois"
    },
    modeledIndustrialOutput: "$52B (Crude Oil Extraction, Natural Gas Processing, Agricultural Equipment)",
    modeledAgriculturalOutput: "$13.5B (Spring Wheat, Durum, Soybeans, Corn, Canola)",
    sourceAttribution: "EIA SEDS 2024 / North Dakota Department of Mineral Resources / USDA"
  },

  "Louisiana": {
    name: "Louisiana",
    code: "LA",
    region: "Mississippi Delta & Gulf Coast",
    hydrocarbonIndex: 92,
    mineralIndex: 48,
    arableLandIndex: 68,
    logisticsWaterwayIndex: 100,
    primaryBasins: [
      { name: "Port of South Louisiana & New Orleans", type: "port", coords: [-90.5, 30.0], desc: "Largest tonnage port district in the Western Hemisphere; handles >60% of all Midwest grain exports" },
      { name: "Henry Hub Natural Gas Junction", type: "oil_gas", coords: [-92.0, 29.9], desc: "Benchmark pricing location for North American natural gas NYMEX futures" },
      { name: "Haynesville Shale Gas Basin", type: "oil_gas", coords: [-93.8, 32.3], desc: "High-pressure, prolific deep shale gas formation feeding major LNG export terminals" }
    ],
    resources: {
      hydrocarbons: "Natural Gas: 3.8T cu ft/yr (#3 US); Crude Oil: 35M bbl in-state + offshore Gulf deepwater shelf; Sabine Pass & Cameron LNG terminals",
      criticalMinerals: "Rock salt (#1 US salt domes), sulfur, construction sand, clays",
      agriculture: "Sugarcane (#1 US), rice (#3 US), aquaculture (crawfish & Gulf shrimp), Southern yellow pine timber",
      logistics: "Terminus of the 12,000-mile Mississippi River inland waterway system; 5 deepwater seaports"
    },
    modeledIndustrialOutput: "$92B (Petrochemical Refining, LNG Liquefaction & Export, Shipbuilding, Plastics)",
    modeledAgriculturalOutput: "$4.5B (Sugarcane, Rice, Forestry, Seafood)",
    sourceAttribution: "EIA SEDS / US Army Corps of Engineers / USGS"
  },

  "Washington": {
    name: "Washington",
    code: "WA",
    region: "Pacific Northwest & Columbia River",
    hydrocarbonIndex: 20,
    mineralIndex: 55,
    arableLandIndex: 78,
    logisticsWaterwayIndex: 94,
    primaryBasins: [
      { name: "Columbia River Hydropower Spine", type: "port", coords: [-119.5, 46.5], desc: "Grand Coulee & Columbia dams generate the largest hydroelectric power output in North America" },
      { name: "Puget Sound Maritime Gateway", type: "port", coords: [-122.4, 47.6], desc: "Deep natural fjords hosting Port of Seattle, Tacoma, and Naval Base Kitsap" },
      { name: "Yakima & Wenatchee Apple Valleys", type: "agri", coords: [-120.5, 46.6], desc: "Produces ~70% of all apples in the United States, along with premier sweet cherries, hops and pears" }
    ],
    resources: {
      hydrocarbons: "U.S. #1 in Hydroelectric Generation (>70% of state electric supply); extensive clean grid attracting cloud datacenters",
      criticalMinerals: "Magnesium, olivine, gold, industrial silica, diatomite, dimensional stone",
      agriculture: "U.S. #1 in Apples (130M boxes/yr), #1 in Hops (75% US total for brewing), #1 in Sweet Cherries, #2 in Wine Grapes",
      logistics: "Northwest Seaport Alliance (Seattle/Tacoma), Columbia-Snake navigable barge system inland to Idaho"
    },
    modeledIndustrialOutput: "$145B (Commercial Aircraft Assembly - Boeing, Cloud Computing, Clean Tech, Software)",
    modeledAgriculturalOutput: "$12.8B (Apples, Hops, Wheat, Cherries, Potatoes, Dairy)",
    sourceAttribution: "USGS / EIA / USDA NASS 2024 / NW Seaport Alliance"
  },

  "Michigan": {
    name: "Michigan",
    code: "MI",
    region: "Great Lakes Basin",
    hydrocarbonIndex: 25,
    mineralIndex: 86,
    arableLandIndex: 74,
    logisticsWaterwayIndex: 92,
    primaryBasins: [
      { name: "Marquette Iron Range", type: "mineral", coords: [-87.6, 46.5], desc: "Active taconite iron ore open pits (Tilden Mine) producing premium fluxed pellets for Great Lakes blast furnaces" },
      { name: "Detroit Automotive Manufacturing Axis", type: "port", coords: [-83.0, 42.3], desc: "Historic manufacturing core linking Lake Huron/Erie with advanced robotics and auto assembly" }
    ],
    resources: {
      hydrocarbons: "Modest natural gas in Antrim Shale; extensive underground gas storage fields (#1 working gas capacity in US)",
      criticalMinerals: "Iron ore (Tilden mine ~8M tons/yr), rock salt (beneath Detroit), copper deposits in Keweenaw Peninsula, gypsum",
      agriculture: "Tart cherries (#1 US), blueberries, dry beans, apples, sugarbeets, dairy ($10.5B receipts)",
      logistics: "Soo Locks (critical chokepoint passing 100% of Lake Superior iron ore to Lower Lakes steel mills)"
    },
    modeledIndustrialOutput: "$115B (Automotive Engineering, Advanced Robotics, Iron Metallurgy, Machine Tooling)",
    modeledAgriculturalOutput: "$10.5B (Dairy, Cherries, Dry Beans, Apples, Corn)",
    sourceAttribution: "USGS Iron Ore / EIA / US Army Corps of Engineers"
  },

  "West Virginia": {
    name: "West Virginia",
    code: "WV",
    region: "Central Appalachian Mountains",
    hydrocarbonIndex: 92,
    mineralIndex: 68,
    arableLandIndex: 28,
    logisticsWaterwayIndex: 65,
    primaryBasins: [
      { name: "Central Appalachian Coal Belt", type: "oil_gas", coords: [-81.6, 38.3], desc: "Premier source of high-volatile and low-volatile metallurgical coking coal exported globally for steelmaking" },
      { name: "Utica & Marcellus Gas Corridor", type: "oil_gas", coords: [-80.5, 39.5], desc: "High-volume natural gas and ethane extraction feeding Ohio River petrochemical crackers" }
    ],
    resources: {
      hydrocarbons: "Coal: 83M tons/yr (#2 US, #1 metallurgical coking coal); Natural Gas: 2.8T cu ft/yr (#4 US); Natural Gas Liquids",
      criticalMinerals: "Rare earth elements extracted from acid mine drainage and coal fly ash, high-purity limestone",
      agriculture: "Hardwood timber (oak, cherry, maple), poultry, cattle in river valleys",
      logistics: "Kanawha and Ohio River coal and chemical barge networks; CSX/Norfolk Southern heavy coal rail"
    },
    modeledIndustrialOutput: "$36B (Metallurgical Coal Mining, Chemical Manufacturing, Natural Gas Extraction)",
    modeledAgriculturalOutput: "$1.2B (Hardwood Timber, Poultry, Cattle)",
    sourceAttribution: "EIA SEDS / USGS / West Virginia Geological & Economic Survey"
  },

  "Illinois": {
    name: "Illinois",
    code: "IL",
    region: "Midwestern Prairies & Great Lakes",
    hydrocarbonIndex: 45,
    mineralIndex: 50,
    arableLandIndex: 98,
    logisticsWaterwayIndex: 98,
    primaryBasins: [
      { name: "Central Illinois Corn & Soy Prairies", type: "agri", coords: [-89.5, 40.5], desc: "Unmatched deep black soil producing 2.2B bushels of corn (#2 US) and 670M bushels of soybeans (#1 US)" },
      { name: "Port of Chicago & Illinois Waterway", type: "port", coords: [-87.6, 41.8], desc: "Only navigable connection linking the Great Lakes St. Lawrence system to the Mississippi River and Gulf of Mexico" }
    ],
    resources: {
      hydrocarbons: "Illinois Basin bituminous coal (32M tons/yr); nuclear power (#1 in US nuclear electricity generation with 6 stations)",
      criticalMinerals: "High-purity silica sand (Ottawa sand used nationwide for glass and foundry casting), limestone, fluorite",
      agriculture: "U.S. #1 in Soybeans ($11B), #2 in Corn ($12B), major pork, cattle, food manufacturing (#1 food processing state)",
      logistics: "Chicago Intermodal Hub (largest rail junction in North America; 25% of all US rail freight moves through Chicago)"
    },
    modeledIndustrialOutput: "$160B (Food Processing, Machinery - Caterpillar, Chemical Refining, Agricultural Bio-tech)",
    modeledAgriculturalOutput: "$26B (Soybeans, Corn, Swine, Cattle)",
    sourceAttribution: "USDA ERS / EIA Nuclear / US Army Corps of Engineers"
  },

  "Alaska": {
    name: "Alaska",
    code: "AK",
    region: "Arctic & Pacific Rim",
    hydrocarbonIndex: 90,
    mineralIndex: 95,
    arableLandIndex: 10,
    logisticsWaterwayIndex: 75,
    primaryBasins: [
      { name: "Prudhoe Bay & North Slope", type: "oil_gas", coords: [-148.5, 70.3], desc: "Largest conventional oil field in North America; connects to the 800-mile Trans-Alaska Pipeline System (TAPS)" },
      { name: "Red Dog Zinc & Lead Mine", type: "mineral", coords: [-162.8, 68.1], desc: "One of the largest zinc reserves in the world; accounts for ~70% of total US mined zinc production" },
      { name: "Bering Sea & Bristol Bay Fishery", type: "agri", coords: [-160.0, 57.0], desc: "Produces >50% of all commercial wild seafood harvested in the United States (wild salmon, pollock, king crab)" }
    ],
    resources: {
      hydrocarbons: "Crude Oil: 160M bbl/yr via TAPS to Valdez seaport; immense untapped North Slope natural gas reserves",
      criticalMinerals: "Red Dog Mine (Zinc #1 US, Lead #1 US), Greens Creek (Silver #1 US), Fort Knox (Gold), Pogo (Gold), Rare Earths (Bokan Mountain)",
      agriculture: "Seafood & Fisheries: #1 in US wild catch ($4.8B annual landed seafood value; wild sockeye salmon, Pacific cod, halibut)",
      logistics: "Port of Valdez (ice-free deepwater oil tanker terminal), Port of Anchorage, Ted Stevens Anchorage Int'l Airport (#4 world cargo hub)"
    },
    modeledIndustrialOutput: "$34B (Oil Extraction & Pipeline Operations, Zinc Smelting Logistics, Arctic Defense, Aviation Cargo)",
    modeledAgriculturalOutput: "$4.8B (Commercial Marine Fishery & Seafood Processing)",
    sourceAttribution: "USGS Minerals / EIA Alaska / Alaska Department of Fish and Game"
  }
};

/**
 * Returns geographic resource endowments for a given state name.
 */
export function getUsStateEndowment(stateName) {
  if (US_GEOGRAPHIC_ENDOWMENTS[stateName]) {
    return US_GEOGRAPHIC_ENDOWMENTS[stateName];
  }

  // Sensible default for remaining states based on standard USGS/USDA aggregates
  return {
    name: stateName,
    code: stateName.slice(0, 2).toUpperCase(),
    region: "Continental United States",
    hydrocarbonIndex: 20,
    mineralIndex: 35,
    arableLandIndex: 55,
    logisticsWaterwayIndex: 50,
    primaryBasins: [],
    resources: {
      hydrocarbons: "Regional electricity grid and distributed fuel networks",
      criticalMinerals: "Construction aggregates, sand, gravel, and stone",
      agriculture: "Regional diversified agriculture, dairy, and livestock",
      logistics: "Interstate highway and regional freight railway connectivity"
    },
    modeledIndustrialOutput: "$20B (Diverse Manufacturing & Assembly)",
    modeledAgriculturalOutput: "$3.5B (Diversified Crops & Livestock)",
    sourceAttribution: "USGS / USDA Regional Baseline"
  };
}

/**
 * All prominent geological basins and maritime nodes for SVG map marker rendering.
 */
export const ALL_US_RESOURCE_MARKERS = Object.values(US_GEOGRAPHIC_ENDOWMENTS).flatMap(
  (s) => (s.primaryBasins || []).map((b) => ({ ...b, state: s.name, stateCode: s.code }))
);
