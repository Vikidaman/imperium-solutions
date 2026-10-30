/**
 * Imperium Solutions — Authoritative United States Geographic Resource Endowments
 * Grounded in empirical data from:
 * - USGS (U.S. Geological Survey) Mineral Commodity Summaries & MRDS
 * - EIA (U.S. Energy Information Administration) State Energy Data System (SEDS)
 * - USDA (U.S. Department of Agriculture) NASS & ERS Agricultural Census
 * - NOAA / US Army Corps of Engineers (USACE) Navigable Waterways & Deepwater Ports
 *
 * All 50 sovereign constituent states mapped with non-arbitrary baseline zero endowments
 * where resources are not naturally occurring.
 */

export const US_GEOGRAPHIC_ENDOWMENTS = {
  "Alabama": {
    name: "Alabama",
    code: "AL",
    region: "Deep South & Gulf Littoral",
    hydrocarbonIndex: 40,
    mineralIndex: 65,
    arableLandIndex: 75,
    logisticsWaterwayIndex: 85,
    primaryBasins: [
      { name: "Port of Mobile", type: "port", coords: [-88.04, 30.69], desc: "Major Gulf Coast bulk cargo & container port connecting to Tennessee-Tombigbee Waterway" },
      { name: "Warrior Coal Basin", type: "oil_gas", coords: [-87.2, 33.5], desc: "Coking & metallurgical coal plus coalbed methane extraction" },
      { name: "Central Pine Belt & Broiler Zone", type: "agri", coords: [-86.3, 32.3], desc: "U.S. top tier poultry, commercial timber, cotton, and peanuts" }
    ],
    resources: {
      hydrocarbons: "Warrior Basin coalbed methane, Black Warrior bituminous coal, and Mobile Bay offshore natural gas",
      criticalMinerals: "Industrial limestone, marble (Sylacauga white marble), bauxite, and structural clay",
      agriculture: "U.S. #2 in Broiler Chickens, extensive southern yellow pine timberlands, cotton, and peanuts",
      logistics: "Port of Mobile (deepwater 50ft harbor) and inland navigation via the Mobile-Tombigbee river system"
    },
    modeledIndustrialOutput: "$42B (Aerospace, Automotive Assembly, Heavy Steel, Chemicals)",
    modeledAgriculturalOutput: "$10.5B (Poultry, Timber, Cotton, Cattle)",
    sourceAttribution: "USGS Minerals / EIA SEDS / USDA NASS"
  },

  "Alaska": {
    name: "Alaska",
    code: "AK",
    region: "Pacific Northwest & Arctic Frontier",
    hydrocarbonIndex: 90,
    mineralIndex: 92,
    arableLandIndex: 0,
    logisticsWaterwayIndex: 85,
    primaryBasins: [
      { name: "Prudhoe Bay & North Slope", type: "oil_gas", coords: [-148.4, 70.2], desc: "Historic super-giant oil province feeding Trans-Alaska Pipeline System (TAPS)" },
      { name: "Red Dog Mine", type: "mineral", coords: [-162.8, 68.1], desc: "World's largest zinc and major lead mine in the DeLong Mountains" },
      { name: "Cook Inlet Basin", type: "oil_gas", coords: [-151.8, 60.3], desc: "Historic oil and natural gas production supplying Southcentral Alaska" },
      { name: "Bering Sea Marine Fisheries", type: "agri", coords: [-166.5, 53.9], desc: "Dutch Harbor / Aleutians — #1 commercial seafood port in US by volume for over 25 consecutive years" }
    ],
    resources: {
      hydrocarbons: "North Slope crude oil (~430,000 bbl/d), National Petroleum Reserve-Alaska, Cook Inlet gas fields",
      criticalMinerals: "Red Dog (Zinc #1 US, Lead), Greens Creek (Silver #1 US), Fort Knox (Gold), Pogo (Gold), graphite, tin",
      agriculture: "Zero conventional row crops; world's premier marine fishery (wild salmon, pollock, king crab, Pacific cod)",
      logistics: "Marine Highway System, Port of Anchorage, Dutch Harbor, deepwater ice-free maritime corridors"
    },
    modeledIndustrialOutput: "$34B (Oil Extraction & Pipeline Operations, Zinc Smelting Logistics, Arctic Defense, Aviation Cargo)",
    modeledAgriculturalOutput: "$4.8B (Commercial Marine Fishery & Seafood Processing)",
    sourceAttribution: "USGS Minerals / EIA Alaska / Alaska Department of Fish and Game"
  },

  "Arizona": {
    name: "Arizona",
    code: "AZ",
    region: "Southwest & Intermountain Shelf",
    hydrocarbonIndex: 0,
    mineralIndex: 96,
    arableLandIndex: 45,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Morenci Copper Mine", type: "mineral", coords: [-109.3, 33.1], desc: "Largest copper mine in North America; produces >400,000 metric tons of copper annually" },
      { name: "Resolution Copper Project", type: "mineral", coords: [-111.1, 33.3], desc: "One of the world's largest undeveloped copper-molybdenum deposits" },
      { name: "Yuma Winter Agricultural Hub", type: "agri", coords: [-114.6, 32.7], desc: "Winter lettuce capital of North America; produces ~90% of US winter leafy greens" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial crude oil or natural gas extraction; solar generation leader)",
      criticalMinerals: "U.S. #1 in Copper (>65% of US total), molybdenum, rhenium, uranium (Arizona Strip breccia pipes), tellurium",
      agriculture: "Yuma Valley winter vegetables (lettuce, spinach, broccoli), irrigated cotton, durum wheat, and alfalfa",
      logistics: "Landlocked; major transcontinental rail (BNSF/UP Southern Transcon) and I-10 / I-40 logistics arteries"
    },
    modeledIndustrialOutput: "$52B (Semiconductor Foundries, Copper Mining & Smelting, Aerospace/Defense, Solar Tech)",
    modeledAgriculturalOutput: "$5.2B (Winter Leafy Greens, Dairy, Irrigated Cotton, Alfalfa)",
    sourceAttribution: "USGS Copper Statistics / USDA NASS"
  },

  "Arkansas": {
    name: "Arkansas",
    code: "AR",
    region: "Mississippi Delta & Ozarks",
    hydrocarbonIndex: 65,
    mineralIndex: 72,
    arableLandIndex: 84,
    logisticsWaterwayIndex: 65,
    primaryBasins: [
      { name: "Fayetteville Shale Basin", type: "oil_gas", coords: [-92.4, 35.3], desc: "Major unconventional dry natural gas reservoir in northern Arkansas" },
      { name: "Smackover Bromine & Lithium Belt", type: "mineral", coords: [-92.7, 33.4], desc: "World-class brine aquifer; supplies ~40% of global bromine and emerging Direct Lithium Extraction (DLE)" },
      { name: "Arkansas Grand Prairie & Delta", type: "agri", coords: [-91.5, 34.5], desc: "U.S. #1 rice producing region and major soybean & poultry heartland" }
    ],
    resources: {
      hydrocarbons: "Fayetteville Shale natural gas (Arkoma Basin) and southern Arkansas oil fields",
      criticalMinerals: "Smackover brine Bromine and Lithium reserves (Albemarle, Lanxess, ExxonMobil), industrial quartz crystal, silica sand",
      agriculture: "U.S. #1 in Rice (~50% of US crop), #2 in Broiler Chickens, major soybeans, cotton, and grain sorghum",
      logistics: "McClellan-Kerr Arkansas River Navigation System (MKARNS) connecting to the Mississippi River"
    },
    modeledIndustrialOutput: "$36B (Aviation, Bromine Chemical Refining, Steel Mills, Food Processing)",
    modeledAgriculturalOutput: "$12.8B (Rice, Poultry, Soybeans, Timber)",
    sourceAttribution: "USGS Minerals / EIA Arkansas / USDA ERS"
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
    sourceAttribution: "USGS Minerals / USDA NASS / Port of LA"
  },

  "Colorado": {
    name: "Colorado",
    code: "CO",
    region: "Rocky Mountain & Front Range",
    hydrocarbonIndex: 68,
    mineralIndex: 75,
    arableLandIndex: 62,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Denver-Julesburg (DJ) Basin", type: "oil_gas", coords: [-104.5, 40.2], desc: "Niobrara & Codell shale formations; major tight oil and rich natural gas play" },
      { name: "Piceance Basin", type: "oil_gas", coords: [-108.0, 39.5], desc: "Vast tight natural gas reserves and massive Green River oil shale deposits" },
      { name: "Climax & Henderson Molybdenum Mines", type: "mineral", coords: [-106.2, 39.4], desc: "Top global primary molybdenum deposits vital for high-strength steel alloys" },
      { name: "San Luis Valley & High Plains", type: "agri", coords: [-105.9, 37.5], desc: "High-altitude specialty potatoes, cattle ranching, wheat, and barley" }
    ],
    resources: {
      hydrocarbons: "Crude oil: ~160M bbl/yr (#4 US); Natural Gas: ~1.8T cu ft/yr (#6 US); coalbed methane in San Juan/Raton basins",
      criticalMinerals: "Molybdenum (Climax and Henderson mines supply ~30% of US total), gold (Cripple Creek & Victor mine), uranium, beryllium",
      agriculture: "Cattle and calves (top 10 US), San Luis Valley Russet potatoes, winter wheat, sorghum, and craft barley",
      logistics: "Landlocked; premier central intermountain air hub (Denver International Airport) and transcontinental rail"
    },
    modeledIndustrialOutput: "$68B (Aerospace & Satellites, Bioscience, Precision Instruments, Oil/Gas Refining)",
    modeledAgriculturalOutput: "$8.5B (Beef Cattle, Dairy, Potatoes, Wheat, Hay)",
    sourceAttribution: "USGS Minerals / EIA Colorado / Colorado Dept of Agriculture"
  },

  "Connecticut": {
    name: "Connecticut",
    code: "CT",
    region: "Northeast Megalopolis",
    hydrocarbonIndex: 0,
    mineralIndex: 15,
    arableLandIndex: 35,
    logisticsWaterwayIndex: 75,
    primaryBasins: [
      { name: "Long Island Sound Deepwater Channels", type: "port", coords: [-72.9, 41.3], desc: "Deepwater access via New Haven, New London, and Bridgeport harbors" },
      { name: "Connecticut River Valley Shade Tobacco", type: "agri", coords: [-72.6, 41.8], desc: "World-renowned premium shade-grown wrapper leaf tobacco and greenhouse nurseries" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of fossil fuels; relies on natural gas pipeline imports)",
      criticalMinerals: "Construction aggregates, crushed traprock (basalt), industrial sand, and historical mica deposits",
      agriculture: "Greenhouse and nursery horticulture ($250M), Connecticut shade tobacco, dairy, and Long Island Sound oysters",
      logistics: "Deepwater maritime access along Long Island Sound (naval submarine base New London, commercial ports)"
    },
    modeledIndustrialOutput: "$48B (Nuclear Submarines, Jet Engines & Turbines, Defense Electronics, Medical Devices)",
    modeledAgriculturalOutput: "$0.85B (Greenhouse Horticulture, Dairy, Specialty Tobacco, Shellfish)",
    sourceAttribution: "USGS Mineral Industry / USDA NASS"
  },

  "Delaware": {
    name: "Delaware",
    code: "DE",
    region: "Mid-Atlantic Coast",
    hydrocarbonIndex: 0,
    mineralIndex: 15,
    arableLandIndex: 55,
    logisticsWaterwayIndex: 80,
    primaryBasins: [
      { name: "Port of Wilmington", type: "port", coords: [-75.5, 39.7], desc: "North America's leading cold-storage import terminal for fresh fruit, bananas, and juice concentrates" },
      { name: "Delmarva Poultry & Soybean Shelf", type: "agri", coords: [-75.4, 38.9], desc: "Intensive poultry production and high-yield grain/soybean cultivation" }
    ],
    resources: {
      hydrocarbons: "None (zero crude oil or natural gas extraction; energy consumer with Delaware City refinery)",
      criticalMinerals: "Construction sand and gravel, industrial aggregates, and greensand marl",
      agriculture: "Broiler chickens (dominant sector: >70% of farm receipts), soybeans, corn, and lima beans",
      logistics: "Delaware River navigation channel, Port of Wilmington deepwater berths, and Mid-Atlantic rail corridor"
    },
    modeledIndustrialOutput: "$22B (Specialty Chemicals, Pharmaceutical Manufacturing, Food Processing)",
    modeledAgriculturalOutput: "$1.6B (Broiler Poultry, Soybeans, Corn)",
    sourceAttribution: "USGS Minerals / USDA ERS"
  },

  "Florida": {
    name: "Florida",
    code: "FL",
    region: "Southeast Atlantic & Gulf",
    hydrocarbonIndex: 5,
    mineralIndex: 85,
    arableLandIndex: 80,
    logisticsWaterwayIndex: 94,
    primaryBasins: [
      { name: "Bone Valley Phosphate Formation", type: "mineral", coords: [-81.9, 27.8], desc: "Central Florida phosphate rock belt; produces >65% of all US agricultural phosphate fertilizer" },
      { name: "Port Tampa Bay & Port Everglades", type: "port", coords: [-82.4, 27.9], desc: "Busiest cargo ports in Florida; major gateways for bulk fertilizer exports and refined fuels" },
      { name: "Lake Okeechobee Agricultural Area", type: "agri", coords: [-80.7, 26.7], desc: "Rich organic muck soils producing sugarcane (#1 US), winter vegetables, and sweet corn" }
    ],
    resources: {
      hydrocarbons: "Marginal onshore production from Jay Field (Escambia County) and Sunniland Trend (~1.5M bbl/yr)",
      criticalMinerals: "U.S. #1 in Phosphate Rock (Mosaic operations), heavy mineral sands (ilmenite, rutile, zircon), and peat",
      agriculture: "U.S. #1 in Sugarcane, Oranges/Grapefruit, Winter Fresh Tomatoes, Bell Peppers, and Watermelons ($8.2B cash receipts)",
      logistics: "Fourteen deepwater seaports (Port of Miami, Port Everglades, Port Tampa Bay, JAXPORT) handling Latin American trade"
    },
    modeledIndustrialOutput: "$85B (Phosphate Chemical Fertilizers, Aerospace & Launch Hardware, Defense Optics, Medical Tech)",
    modeledAgriculturalOutput: "$8.4B (Citrus, Sugarcane, Winter Vegetables, Nursery)",
    sourceAttribution: "USGS Phosphate Statistics / Florida Dept of Agriculture"
  },

  "Georgia": {
    name: "Georgia",
    code: "GA",
    region: "Deep South & Atlantic Seaboard",
    hydrocarbonIndex: 0,
    mineralIndex: 80,
    arableLandIndex: 85,
    logisticsWaterwayIndex: 92,
    primaryBasins: [
      { name: "Port of Savannah (Garden City Terminal)", type: "port", coords: [-81.1, 32.1], desc: "Fourth busiest and fastest growing container port in the United States; major export gateway" },
      { name: "Central Georgia Kaolin Belt", type: "mineral", coords: [-83.3, 32.8], desc: "World's most extensive high-purity kaolin clay deposits spanning the Fall Line" },
      { name: "South Georgia Peanut & Timber Belt", type: "agri", coords: [-84.1, 31.6], desc: "U.S. peanut capital (producing >50% of US total), major broiler poultry and southern pine timber" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial crude oil or natural gas extraction; energy consumer)",
      criticalMinerals: "U.S. #1 in Kaolin Clay (white paper coating & industrial ceramics), fuller's earth, barite, and dimension granite (Elberton)",
      agriculture: "U.S. #1 in Peanuts (>52% of US crop), #1 in Broiler Chickens, #1 in Pecans, major cotton, blueberries, and timber",
      logistics: "Port of Savannah (deepwater maritime terminal), Port of Brunswick (top US auto port), and Hartsfield-Jackson air cargo hub"
    },
    modeledIndustrialOutput: "$92B (Aerospace, Automotive, Paper/Pulp Mills, Kaolin Refineries, Industrial Machinery)",
    modeledAgriculturalOutput: "$13.6B (Broilers, Peanuts, Cotton, Timber, Pecans)",
    sourceAttribution: "USGS Industrial Minerals / Georgia Port Authority / USDA"
  },

  "Hawaii": {
    name: "Hawaii",
    code: "HI",
    region: "Pacific Oceanic Island Shelf",
    hydrocarbonIndex: 0,
    mineralIndex: 15,
    arableLandIndex: 52,
    logisticsWaterwayIndex: 90,
    primaryBasins: [
      { name: "Port of Honolulu", type: "port", coords: [-157.86, 21.3], desc: "Vital trans-Pacific maritime lifeline handling >80% of all goods imported into the Hawaiian Islands" },
      { name: "Big Island & Maui Agro-Reserves", type: "agri", coords: [-155.6, 19.8], desc: "World-famous Kona coffee, macadamia nuts, tropical fruit orchards, and seed crop nurseries" }
    ],
    resources: {
      hydrocarbons: "None (zero fossil fuel extraction; leading pioneer in geothermal and utility-scale solar/wind)",
      criticalMinerals: "Volcanic basalt aggregates, crushed coral limestone, and volcanic pozzolan",
      agriculture: "Macadamia nuts, Kona coffee, papayas, pineapples, commercial seed corn research, and aquaculture",
      logistics: "Deepwater island ports (Honolulu, Barbers Point, Kahului, Hilo) serving mid-Pacific maritime supply lines"
    },
    modeledIndustrialOutput: "$16B (Defense Ship Repair, Food Processing, Clean Tech Hardware)",
    modeledAgriculturalOutput: "$0.95B (Specialty Seed Crops, Macadamia Nuts, Coffee, Aquaculture)",
    sourceAttribution: "USGS Minerals / Hawaii DOA / USACE"
  },

  "Idaho": {
    name: "Idaho",
    code: "ID",
    region: "Pacific Northwest & Northern Rockies",
    hydrocarbonIndex: 0,
    mineralIndex: 85,
    arableLandIndex: 84,
    logisticsWaterwayIndex: 25,
    primaryBasins: [
      { name: "Southeast Idaho Phosphate Belt", type: "mineral", coords: [-111.4, 42.7], desc: "Major phosphate rock mines and refining complexes (Simplot, Bayer) supplying national fertilizer and elemental phosphorus" },
      { name: "Silver Valley (Coeur d'Alene District)", type: "mineral", coords: [-116.0, 47.5], desc: "Historic premier silver-lead-zinc mining district; produced over 1.2 billion ounces of silver" },
      { name: "Snake River Plain Agricultural Basin", type: "agri", coords: [-113.8, 42.9], desc: "America's potato heartland powered by volcanic soils and extensive irrigation aquifers" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial petroleum production; localized exploration in western Idaho)",
      criticalMinerals: "Phosphate Rock (#2 US), silver (Lucky Friday mine), antimony (Stibnite Gold Project), cobalt (Idaho Cobalt Belt), zinc, lead",
      agriculture: "U.S. #1 in Potatoes (~33% of US crop), #2 in Barley, #3 in Milk/Dairy, #1 in Food Trout, sugarbeets, and hops",
      logistics: "Inland seaport at Port of Lewiston (furthest inland port on the Pacific Coast via Snake/Columbia river navigation)"
    },
    modeledIndustrialOutput: "$38B (Semiconductor Fabrication [Micron], Food Processing, Chemical Fertilizers, Forest Products)",
    modeledAgriculturalOutput: "$11.2B (Potatoes, Dairy, Barley, Sugarbeets, Cattle)",
    sourceAttribution: "USGS Mineral Industry / Idaho Dept of Commerce / USDA NASS"
  },

  "Illinois": {
    name: "Illinois",
    code: "IL",
    region: "Midwest Corn Belt & Great Lakes",
    hydrocarbonIndex: 45,
    mineralIndex: 65,
    arableLandIndex: 95,
    logisticsWaterwayIndex: 94,
    primaryBasins: [
      { name: "Illinois Basin Coal & Oil Field", type: "oil_gas", coords: [-88.9, 38.3], desc: "Prolific bituminous coal seams and southern Illinois light sweet crude formations" },
      { name: "Port of Chicago & Calumet Harbor", type: "port", coords: [-87.5, 41.7], desc: "Links Great Lakes Seaway to Mississippi River waterway system; premier inland freight hub" },
      { name: "Central Illinois Black Soil Prairie", type: "agri", coords: [-89.1, 40.5], desc: "Among the richest agricultural soils on earth; nation's top producer of soybeans and corn" }
    ],
    resources: {
      hydrocarbons: "Illinois Basin bituminous coal (32M tons/yr), crude oil (~8M bbl/yr), and major pipeline refining hubs (Wood River, Joliet)",
      criticalMinerals: "Industrial silica sand (hydraulic fracturing sand #2 US), fluorite (historical), limestone, and aggregates",
      agriculture: "U.S. #1 in Soybeans (680M bushels), #2 in Corn (2.2B bushels), major hog production, and grain processing",
      logistics: "Port of Chicago, Illinois Waterway (connecting Lake Michigan to Mississippi River), nation's #1 railroad switching hub"
    },
    modeledIndustrialOutput: "$125B (Heavy Agricultural/Mining Machinery [Caterpillar], Chemical Refining, Food Processing)",
    modeledAgriculturalOutput: "$26.5B (Soybeans, Corn, Swine, Ethanol)",
    sourceAttribution: "USGS Minerals / EIA Illinois / USDA ERS"
  },

  "Indiana": {
    name: "Indiana",
    code: "IN",
    region: "Midwest Industrial Belt & Ohio Valley",
    hydrocarbonIndex: 25,
    mineralIndex: 65,
    arableLandIndex: 88,
    logisticsWaterwayIndex: 75,
    primaryBasins: [
      { name: "Burns Harbor & Lake Michigan Steel Shore", type: "port", coords: [-87.1, 41.6], desc: "Home to America's most productive blast furnaces and deepwater Great Lakes shipping" },
      { name: "Bedford Limestone Belt", type: "mineral", coords: [-86.5, 38.9], desc: "Nation's premier dimensional limestone quarry; provided stone for Empire State Building and Pentagon" },
      { name: "Central & Northern Tillage Plains", type: "agri", coords: [-86.1, 40.4], desc: "High-density corn and soybean crop rotation supporting livestock and biofuel refineries" }
    ],
    resources: {
      hydrocarbons: "Illinois Basin bituminous coal (~28M tons/yr) and small-scale crude oil wells in southwestern Indiana",
      criticalMinerals: "Indiana Limestone (Salem Formation #1 dimension limestone in US), gypsum, industrial sand, and gravel",
      agriculture: "U.S. #5 in Corn and Soybeans, #2 in Popcorn, #3 in Egg Production, #5 in Hogs",
      logistics: "Ports of Indiana (Burns Harbor on Lake Michigan, Mount Vernon and Jeffersonville on Ohio River)"
    },
    modeledIndustrialOutput: "$110B (Automotive Manufacturing, Primary Steel Forges, Medical Devices, Engine Tech)",
    modeledAgriculturalOutput: "$18.2B (Corn, Soybeans, Hogs, Poultry, Dairy)",
    sourceAttribution: "USGS Limestone Reports / USDA NASS"
  },

  "Iowa": {
    name: "Iowa",
    code: "IA",
    region: "Corn Belt & Upper Mississippi Basin",
    hydrocarbonIndex: 0,
    mineralIndex: 35,
    arableLandIndex: 98,
    logisticsWaterwayIndex: 70,
    primaryBasins: [
      { name: "Des Moines Lobe Black Prairie Soil", type: "agri", coords: [-93.6, 42.0], desc: "Epicenter of American corn and swine production; exceptionally deep glaciated topsoil" },
      { name: "Fort Dodge Gypsum Beds", type: "mineral", coords: [-94.2, 42.5], desc: "Major high-purity gypsum deposit supplying drywall and construction plaster manufacturing" },
      { name: "Mississippi & Missouri River Barge Terminals", type: "port", coords: [-90.4, 41.5], desc: "Barge loading elevators moving bulk grain and biofuels directly down to the Gulf of Mexico" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial fossil fuel extraction; world leader in wind power and fuel ethanol)",
      criticalMinerals: "Gypsum (Fort Dodge formation), industrial limestone, construction aggregates, and silica sand",
      agriculture: "U.S. #1 in Corn (2.5B bushels), #1 in Pork/Hogs (24M head), #1 in Eggs, #2 in Soybeans, and nation's #1 ethanol producer",
      logistics: "Flanked by the Mississippi River on the east and Missouri River on the west for low-cost agricultural barge transport"
    },
    modeledIndustrialOutput: "$62B (Biofuel Refining & Ethanol, Agricultural Implements [John Deere], Food Processing)",
    modeledAgriculturalOutput: "$41B (Corn, Pork, Soybeans, Poultry/Eggs, Biofuels)",
    sourceAttribution: "USDA ERS / USGS Industrial Minerals / Iowa Dept of Agriculture"
  },

  "Kansas": {
    name: "Kansas",
    code: "KS",
    region: "Great Plains & Breadbasket Shelf",
    hydrocarbonIndex: 58,
    mineralIndex: 45,
    arableLandIndex: 94,
    logisticsWaterwayIndex: 15,
    primaryBasins: [
      { name: "Hugoton Natural Gas Field", type: "oil_gas", coords: [-101.2, 37.2], desc: "Historically one of the largest dry natural gas fields in North America and a premier helium reserve" },
      { name: "Central Kansas Uplift Oil Play", type: "oil_gas", coords: [-99.3, 38.8], desc: "Prolific shallow crude oil production active across multiple central counties" },
      { name: "Western Kansas Winter Wheat Belt", type: "agri", coords: [-100.0, 38.0], desc: "Heart of the hard red winter wheat belt and immense commercial beef cattle feedlots" },
      { name: "Hutchinson Salt Formations", type: "mineral", coords: [-97.9, 38.1], desc: "Massive bedded rock salt deposits mined for industrial chemical salt and winter deicing" }
    ],
    resources: {
      hydrocarbons: "Natural Gas: Hugoton Basin; Crude Oil: ~30M bbl/yr; major crude helium extraction & refining",
      criticalMinerals: "Helium (National Helium Reserve infrastructure), rock salt (Wellington Formation), gypsum, industrial clays",
      agriculture: "U.S. #1 in Wheat (hard red winter wheat: ~350M bu), #3 in Cattle & Calves (6.5M head), #1 in Grain Sorghum",
      logistics: "Landlocked; major transcontinental rail routes (BNSF Southern Transcon) and Missouri River barge access in northeast"
    },
    modeledIndustrialOutput: "$48B (Aviation Manufacturing [Wichita], Beef Packing, Oil Refining, Helium Purification)",
    modeledAgriculturalOutput: "$24.5B (Wheat, Beef Cattle, Corn, Sorghum, Soybeans)",
    sourceAttribution: "USGS Minerals / EIA Kansas / USDA NASS"
  },

  "Kentucky": {
    name: "Kentucky",
    code: "KY",
    region: "Appalachia & Ohio River Valley",
    hydrocarbonIndex: 45,
    mineralIndex: 60,
    arableLandIndex: 75,
    logisticsWaterwayIndex: 80,
    primaryBasins: [
      { name: "Eastern Kentucky Coal Basin", type: "oil_gas", coords: [-83.2, 37.5], desc: "Central Appalachian bituminous coal seams and natural gas fields" },
      { name: "Western Kentucky Coal Basin", type: "oil_gas", coords: [-87.4, 37.3], desc: "Illinois Basin coal seams and shallow crude oil extraction" },
      { name: "Bluegrass Thoroughbred & Livestock Region", type: "agri", coords: [-84.5, 38.0], desc: "Famous limestone-enriched pasturelands producing world-class thoroughbred horses and cattle" }
    ],
    resources: {
      hydrocarbons: "Bituminous coal (~24M tons/yr), Appalachian natural gas, and small-volume crude oil wells",
      criticalMinerals: "Limestone, ball clay, fluorite (historic Western Kentucky district), and industrial aggregates",
      agriculture: "U.S. #1 in Thoroughbred Equine Horses, major broiler poultry, beef cattle, corn, and soybeans",
      logistics: "Over 1,900 miles of commercially navigable inland waterways along the Ohio, Mississippi, Tennessee, and Cumberland rivers"
    },
    modeledIndustrialOutput: "$68B (Automotive Assembly, Bourbon Distilling, Aerospace Components, Aluminum Smelting)",
    modeledAgriculturalOutput: "$8.2B (Horses, Poultry, Cattle, Corn, Soybeans)",
    sourceAttribution: "EIA Coal Data / USGS / Kentucky Dept of Agriculture"
  },

  "Louisiana": {
    name: "Louisiana",
    code: "LA",
    region: "Gulf Coast & Lower Mississippi Delta",
    hydrocarbonIndex: 92,
    mineralIndex: 50,
    arableLandIndex: 75,
    logisticsWaterwayIndex: 98,
    primaryBasins: [
      { name: "Haynesville Shale Gas Basin", type: "oil_gas", coords: [-93.7, 32.3], desc: "Overpressured dry gas formation; produces ~13 Bcf/d feeding Gulf Coast LNG export facilities" },
      { name: "Henry Hub Energy Exchange", type: "oil_gas", coords: [-92.0, 29.9], desc: "Official delivery pricing benchmark point for NYMEX natural gas futures contracts" },
      { name: "Port of South Louisiana & Lower Mississippi", type: "port", coords: [-90.5, 30.0], desc: "Largest tonnage port in the Western Hemisphere; gateway for >60% of US grain exports" }
    ],
    resources: {
      hydrocarbons: "Haynesville Shale natural gas, Gulf of Mexico shallow/deepwater crude oil, and massive petrochemical refining corridor",
      criticalMinerals: "Rock salt (Avery Island and Weeks Island salt domes), sulfur (Frasch process historical), industrial sands",
      agriculture: "U.S. #2 in Sugarcane, #3 in Rice, commercial aquaculture (crawfish #1 US), and southern timber",
      logistics: "Port of South Louisiana, Port of New Orleans, Henry Hub pipeline intersection, and Mississippi River deep-draft channel"
    },
    modeledIndustrialOutput: "$135B (LNG Liquefaction & Export, Petrochemicals, Crude Refining, Ship Construction)",
    modeledAgriculturalOutput: "$4.5B (Sugarcane, Rice, Forestry, Crawfish Aquaculture)",
    sourceAttribution: "EIA SEDS / Port of South Louisiana / USDA NASS"
  },

  "Maine": {
    name: "Maine",
    code: "ME",
    region: "Northern New England & Atlantic Littoral",
    hydrocarbonIndex: 0,
    mineralIndex: 35,
    arableLandIndex: 55,
    logisticsWaterwayIndex: 75,
    primaryBasins: [
      { name: "Gulf of Maine Marine Lobster Grounds", type: "agri", coords: [-69.2, 44.0], desc: "World-renowned coldwater marine fishery; supplies >80% of all American lobster" },
      { name: "Aroostook County Potato Belt", type: "agri", coords: [-68.0, 46.8], desc: "Northern agricultural fertile valley producing seed and table potatoes" },
      { name: "Portland Deepwater Harbor", type: "port", coords: [-70.2, 43.6], desc: "Northern New England's largest commercial port with transatlantic container and petroleum berths" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of fossil fuels; energy consumer with major forest biomass)",
      criticalMinerals: "Tourmaline (state gemstone), high-purity dimension granite, slate, and prospective lithium pegmatites (Newry deposit)",
      agriculture: "U.S. #1 in American Lobster ($750M landed value), #1 in Wild Blueberries, Aroostook potatoes, and commercial timber",
      logistics: "Deepwater natural harbors at Portland, Searsport, and Eastport (deepest natural harbor on US Atlantic seaboard)"
    },
    modeledIndustrialOutput: "$18B (Paper and Pulp, Defense Naval Shipbuilding [Bath Iron Works], Biofuels)",
    modeledAgriculturalOutput: "$1.85B (Lobster & Marine Fishery, Blueberries, Potatoes, Forestry)",
    sourceAttribution: "USGS Minerals / Maine DMR / USDA NASS"
  },

  "Maryland": {
    name: "Maryland",
    code: "MD",
    region: "Mid-Atlantic & Chesapeake Bay",
    hydrocarbonIndex: 0,
    mineralIndex: 40,
    arableLandIndex: 58,
    logisticsWaterwayIndex: 92,
    primaryBasins: [
      { name: "Port of Baltimore (Helen Delich Bentley)", type: "port", coords: [-76.6, 39.2], desc: "Leading US port for automobile and roll-on/roll-off machinery imports, plus major metallurgical coal export terminal" },
      { name: "Delmarva Poultry & Grain Corridor", type: "agri", coords: [-75.8, 38.6], desc: "Intensive Eastern Shore broiler production supported by corn and soybean rotations" },
      { name: "Chesapeake Bay Maritime Fishery", type: "agri", coords: [-76.3, 38.5], desc: "Nation's premier source of blue crabs and native eastern oysters" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial crude oil or natural gas extraction; major coal transshipment terminal)",
      criticalMinerals: "Construction stone, crushed limestone, sand and gravel, and specialty clay",
      agriculture: "Broiler chickens (leading sector: >$1B), corn for grain, soybeans, and Chesapeake Bay blue crabs",
      logistics: "Port of Baltimore (50-ft shipping channel connecting to Chesapeake Bay and C&D Canal)"
    },
    modeledIndustrialOutput: "$46B (Bio-Health & Pharmaceuticals, Aerospace/Defense, Specialty Metallurgy, Auto Logistics)",
    modeledAgriculturalOutput: "$2.6B (Broilers, Soybeans, Corn, Blue Crabs)",
    sourceAttribution: "USGS Minerals / Maryland Port Administration / USDA"
  },

  "Massachusetts": {
    name: "Massachusetts",
    code: "MA",
    region: "New England & Atlantic Shelf",
    hydrocarbonIndex: 0,
    mineralIndex: 20,
    arableLandIndex: 40,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Port of Boston", type: "port", coords: [-71.0, 42.3], desc: "Oldest continuously operating industrial seaport in North America with modern container and LNG terminals" },
      { name: "Port of New Bedford", type: "agri", coords: [-70.9, 41.6], desc: "Highest-value commercial fishing port in the United States for over two decades (sea scallops and groundfish)" },
      { name: "Southeastern Cranberry Bogs", type: "agri", coords: [-70.7, 41.8], desc: "Heritage bogs producing ~30% of the entire United States cranberry harvest" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial petroleum or gas extraction; offshore wind energy hub)",
      criticalMinerals: "Dimension granite (Chelmsford/Quincy historic), construction sand, and gravel",
      agriculture: "U.S. #2 in Cranberries, nation's #1 highest-value commercial fishing port (New Bedford scallops), and greenhouse nurseries",
      logistics: "Port of Boston (Conley Container Terminal), Boston Logan international air hub, and Cape Cod Canal shipping lane"
    },
    modeledIndustrialOutput: "$85B (Biopharmaceuticals & Genomics, Precision Robotics, Defense Optronics, Marine Tech)",
    modeledAgriculturalOutput: "$1.45B (Commercial Fishery, Cranberries, Nursery)",
    sourceAttribution: "NOAA Fisheries / USDA NASS / Massport"
  },

  "Michigan": {
    name: "Michigan",
    code: "MI",
    region: "Great Lakes & Rust Belt Core",
    hydrocarbonIndex: 25,
    mineralIndex: 70,
    arableLandIndex: 78,
    logisticsWaterwayIndex: 90,
    primaryBasins: [
      { name: "Marquette Iron Range", type: "mineral", coords: [-87.6, 46.5], desc: "Upper Peninsula iron mining district (Tilden Mine) producing taconite pellets for Great Lakes steel mills" },
      { name: "Detroit River & St. Clair Marine Corridor", type: "port", coords: [-83.1, 42.3], desc: "Critical international waterway connecting Lake Huron and Lake Erie for industrial bulk freighters" },
      { name: "Fruit Ridge & Western Agro-Belt", type: "agri", coords: [-85.7, 43.1], desc: "Lake Michigan microclimate fruit belt; nation's top producer of tart cherries, apples, and blueberries" }
    ],
    resources: {
      hydrocarbons: "Michigan Basin natural gas and crude oil (~5M bbl/yr crude, ~80 Bcf gas), major underground gas storage caverns",
      criticalMinerals: "Tilden iron ore mine (taconite), potash (Hersey solution mining), rock salt (Detroit salt mine), and copper reserves (Keweenaw)",
      agriculture: "U.S. #1 in Tart Cherries, #1 in Dry Black Beans, #3 in Apples, major dairy ($1.9B), and sugarbeets",
      logistics: "Bordered by four Great Lakes, Soo Locks (world's busiest shipping locks handling Lake Superior iron ore), Port of Detroit"
    },
    modeledIndustrialOutput: "$145B (Automotive Manufacturing, Advanced Batteries & EVs, Defense Vehicles, Tool & Die)",
    modeledAgriculturalOutput: "$10.8B (Dairy, Cherries, Apples, Soybeans, Corn)",
    sourceAttribution: "USGS Iron Ore / EIA Michigan / Michigan Dept of Ag"
  },

  "Minnesota": {
    name: "Minnesota",
    code: "MN",
    region: "Upper Midwest & Great Lakes",
    hydrocarbonIndex: 0,
    mineralIndex: 94,
    arableLandIndex: 86,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Mesabi Iron Range", type: "mineral", coords: [-92.8, 47.4], desc: "Crown jewel of North American iron mining; produces >80% of all United States raw iron ore & taconite pellets" },
      { name: "Duluth-Superior Twin Ports", type: "port", coords: [-92.1, 46.8], desc: "Busiest freshwater port in North America; ships 35M tons of iron ore and grain across the Great Lakes" },
      { name: "Red River Valley & Southern Prairies", type: "agri", coords: [-96.4, 47.9], desc: "Prime fertile black soil producing world-leading sugarbeets, soybeans, corn, and spring wheat" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial crude oil or gas extraction; major crude pipeline transmission terminal via Enbridge)",
      criticalMinerals: "Mesabi Range taconite/iron ore (35M metric tons/yr), Duluth Complex copper-nickel-platinum-cobalt reserves",
      agriculture: "U.S. #1 in Sugarbeets, #3 in Soybeans, #4 in Corn for Grain, #2 in Hogs & Turkeys ($21B agricultural cash receipts)",
      logistics: "Great Lakes iron ore bulk freighters (1,000-ft lakers), headwaters of the Mississippi River navigation channel"
    },
    modeledIndustrialOutput: "$75B (Iron Ore Mining & Pelletizing, Heavy Machinery, Medical Devices, Food Processing)",
    modeledAgriculturalOutput: "$21B (Soybeans, Corn, Sugarbeets, Swine, Poultry)",
    sourceAttribution: "USGS Iron Ore Statistics / USDA ERS / Port of Duluth"
  },

  "Mississippi": {
    name: "Mississippi",
    code: "MS",
    region: "Gulf Coast & Delta Basin",
    hydrocarbonIndex: 50,
    mineralIndex: 30,
    arableLandIndex: 80,
    logisticsWaterwayIndex: 82,
    primaryBasins: [
      { name: "Port of Pascagoula", type: "port", coords: [-88.5, 30.3], desc: "Major deepwater Gulf port; site of Chevron Pascagoula Refinery (330,000 bbl/d) and naval shipbuilding" },
      { name: "Mississippi Delta Alluvial Plain", type: "agri", coords: [-90.5, 33.5], desc: "Flat, ultra-fertile cotton and soybean soils, plus national hub of commercial catfish aquaculture" }
    ],
    resources: {
      hydrocarbons: "Onshore Mississippi oil and gas fields (~18M bbl/yr crude, ~30 Bcf gas), major salt dome natural gas storage (Petal)",
      criticalMinerals: "Bentonite, fuller's earth, specialty industrial clays, sand and gravel",
      agriculture: "U.S. #1 in Farm-Raised Catfish (>55% of US total), major cotton, soybeans, broilers, and southern yellow pine",
      logistics: "Gulf of Mexico deepwater ports (Pascagoula, Gulfport) and Mississippi River barge ports (Natchez, Vicksburg, Greenville)"
    },
    modeledIndustrialOutput: "$32B (Naval Shipbuilding [Ingalls], Petroleum Refining, Chemical Manufacturing)",
    modeledAgriculturalOutput: "$8.8B (Poultry, Soybeans, Forestry, Catfish, Cotton)",
    sourceAttribution: "EIA Mississippi / USGS Minerals / USDA NASS"
  },

  "Missouri": {
    name: "Missouri",
    code: "MO",
    region: "Midwest Confluence & Ozarks",
    hydrocarbonIndex: 0,
    mineralIndex: 85,
    arableLandIndex: 82,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Viburnum Trend (Lead Belt)", type: "mineral", coords: [-91.1, 37.7], desc: "World-class Southeast Missouri Lead District; produces >90% of all primary refined lead in the United States" },
      { name: "Port of Metropolitan St. Louis", type: "port", coords: [-90.2, 38.6], desc: "Northernmost ice-free, lock-free port on the Mississippi River; leading inland agricultural barge gateway" },
      { name: "Northern Till Plains Crop Belt", type: "agri", coords: [-93.5, 39.8], desc: "Rich agricultural lands producing abundant soybeans, corn, and beef cattle" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial petroleum or natural gas extraction; energy consumer)",
      criticalMinerals: "U.S. #1 in Lead (>92% of US production from Doe Run mines), zinc, copper, cobalt, and industrial limestone",
      agriculture: "U.S. top tier in Soybeans, Beef Cattle (#3 in cows), Corn, Hogs, and Rice in the Bootheel",
      logistics: "Confluence of the Mississippi and Missouri rivers; major inland barge hub (St. Louis Ag Coast) and transcontinental rail"
    },
    modeledIndustrialOutput: "$68B (Lead Smelting & Battery Recycling, Aerospace/Defense [Boeing St. Louis], Automotive Assembly)",
    modeledAgriculturalOutput: "$13.5B (Soybeans, Corn, Cattle, Swine, Poultry)",
    sourceAttribution: "USGS Lead Statistics / Missouri Dept of Agriculture"
  },

  "Montana": {
    name: "Montana",
    code: "MT",
    region: "Northern Rockies & Great Plains",
    hydrocarbonIndex: 35,
    mineralIndex: 82,
    arableLandIndex: 85,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Golden Triangle Grain & Cattle Belt", type: "agri", coords: [-111.5, 48.0], desc: "Vast agricultural triangle (Great Falls, Havre, Conrad); produces world-class durum wheat, spring wheat, barley, and cattle" },
      { name: "Stillwater Complex Platinum/Palladium Mine", type: "mineral", coords: [-109.8, 45.4], desc: "Only active primary producer of platinum and palladium (PGMs) in the entire United States" },
      { name: "Continental Pit (Butte Copper & Moly)", type: "mineral", coords: [-112.5, 46.0], desc: "Major active open-pit copper and molybdenum mine operating on the historic Richest Hill on Earth" },
      { name: "Elm Coulee Bakken Oil Field", type: "oil_gas", coords: [-104.3, 47.8], desc: "Richland County; pioneer horizontal drilling play of the Williston Basin Bakken formation" }
    ],
    resources: {
      hydrocarbons: "Bakken formation Elm Coulee field, Bell Creek (Powder River Basin), three oil refineries in Billings/Laurel (~180,000 bbl/d)",
      criticalMinerals: "Stillwater Complex (Platinum & Palladium #1 US), Butte Continental Pit (Copper, Molybdenum), talc (Madison County #1 US), bentonite",
      agriculture: "U.S. #2 in Durum Wheat, #2 in Barley, #1 in Lentils & Chickpeas, #1 in Dry Edible Peas, 2.2M beef cattle across 58M agricultural acres",
      logistics: "Landlocked; vital east-west transcontinental freight rail via BNSF Northern Transcon and I-90 / I-15 highway corridors"
    },
    modeledIndustrialOutput: "$14.5B (Stillwater Strategic Platinum/Palladium, Butte Copper, Petroleum Refining, Wood Products)",
    modeledAgriculturalOutput: "$4.9B (Durum Wheat, Barley, Beef Cattle, Pulse Crops, Hay)",
    sourceAttribution: "USGS Minerals / Montana Dept of Agriculture / EIA SEDS"
  },

  "Nebraska": {
    name: "Nebraska",
    code: "NE",
    region: "Great Plains & Ogallala Breadbasket",
    hydrocarbonIndex: 10,
    mineralIndex: 25,
    arableLandIndex: 96,
    logisticsWaterwayIndex: 15,
    primaryBasins: [
      { name: "Central Platte Valley Irrigated Corn", type: "agri", coords: [-99.1, 40.7], desc: "Unmatched irrigated corn and soybean acreage tapping the High Plains (Ogallala) Aquifer" },
      { name: "Sandhills Cattle Ranching Ecosystem", type: "agri", coords: [-101.0, 42.0], desc: "One of the most productive natural grass ecosystems in the world; grazing millions of beef cattle" }
    ],
    resources: {
      hydrocarbons: "Marginal crude oil production in southwestern corner (Denver-Julesburg Basin extension; ~2M bbl/yr)",
      criticalMinerals: "Construction sand and gravel, limestone, and specialty silica",
      agriculture: "U.S. #1 in Commercial Red Meat Slaughter, #2 in Cattle & Calves (6.8M head), #3 in Corn (1.7B bushels), #3 in Soybeans",
      logistics: "Union Pacific Railroad headquarters (Bailey Yard in North Platte — world's largest rail classification yard)"
    },
    modeledIndustrialOutput: "$42B (Meat Processing & Packing, Grain Milling, Ag Machinery Manufacturing)",
    modeledAgriculturalOutput: "$27.5B (Beef Cattle, Corn, Soybeans, Ethanol)",
    sourceAttribution: "USDA ERS / Nebraska Dept of Agriculture / USGS"
  },

  "Nevada": {
    name: "Nevada",
    code: "NV",
    region: "Great Basin & Desert Shelf",
    hydrocarbonIndex: 0,
    mineralIndex: 98,
    arableLandIndex: 25,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Carlin Trend Gold Province", type: "mineral", coords: [-116.3, 40.9], desc: "One of the world's richest gold belts; produces >70% of all gold mined in the United States" },
      { name: "Silver Peak Lithium Brine Basin", type: "mineral", coords: [-117.5, 37.7], desc: "Clayton Valley — sole active commercial lithium brine extraction facility in North America" },
      { name: "Thacker Pass Lithium Deposit", type: "mineral", coords: [-118.1, 41.7], desc: "Largest known lithium claystone deposit in the Western Hemisphere" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial coal or natural gas, trace conventional crude in Railroad Valley)",
      criticalMinerals: "U.S. #1 in Gold (~74% of US total), #1 in Lithium (Silver Peak / Thacker Pass), barite, magnesium, molybdenum, and copper",
      agriculture: "High-desert alfalfa hay (high-protein export grade for dairy), beef cattle grazing, and onions",
      logistics: "Landlocked; strategic intermountain logistics nexus connecting California ports to the interior via I-80"
    },
    modeledIndustrialOutput: "$45B (Gold & Precious Metal Refineries, Lithium Processing, Gigafactory Batteries, Defense)",
    modeledAgriculturalOutput: "$1.2B (Alfalfa Hay, Beef Cattle, Dairy)",
    sourceAttribution: "USGS Gold/Lithium Statistics / Nevada Division of Minerals"
  },

  "New Hampshire": {
    name: "New Hampshire",
    code: "NH",
    region: "Northern New England",
    hydrocarbonIndex: 0,
    mineralIndex: 40,
    arableLandIndex: 30,
    logisticsWaterwayIndex: 45,
    primaryBasins: [
      { name: "Port of Portsmouth & Piscataqua River", type: "port", coords: [-70.7, 43.1], desc: "Deepwater tidal river port serving commercial fuel barges, salt imports, and naval shipyard" },
      { name: "White Mountains Granite & Timber Belt", type: "mineral", coords: [-71.5, 44.0], desc: "Famous Granite State stone quarries and hardwood timber forests" }
    ],
    resources: {
      hydrocarbons: "None (zero fossil fuel extraction; major nuclear and biomass generation)",
      criticalMinerals: "Dimension granite, high-purity quartz crystal, crushed stone, and construction sand",
      agriculture: "Dairy, apples, greenhouse horticulture, maple syrup, and commercial forest products",
      logistics: "Deepwater access via the Piscataqua River to Portsmouth and Atlantic coastal freight routes"
    },
    modeledIndustrialOutput: "$19B (Industrial Machinery, Electronic Components, Firearms & Defense, Precision Plastics)",
    modeledAgriculturalOutput: "$0.32B (Dairy, Apples, Maple Syrup, Forestry)",
    sourceAttribution: "USGS Minerals / NH Dept of Agriculture"
  },

  "New Jersey": {
    name: "New Jersey",
    code: "NJ",
    region: "Mid-Atlantic Urban Corridor",
    hydrocarbonIndex: 0,
    mineralIndex: 35,
    arableLandIndex: 50,
    logisticsWaterwayIndex: 96,
    primaryBasins: [
      { name: "Port Newark-Elizabeth Marine Terminal", type: "port", coords: [-74.1, 40.7], desc: "Largest maritime container facility on the US East Coast; premier transatlantic gateway" },
      { name: "Pine Barrens Cranberry & Blueberry Belt", type: "agri", coords: [-74.5, 39.8], desc: "Acidic sandy soils producing top tier cranberries and highbush blueberries" }
    ],
    resources: {
      hydrocarbons: "None (zero crude oil or gas extraction; extensive petroleum refining [Bayway] and pipeline infrastructure)",
      criticalMinerals: "Industrial silica sands, greensand glauconite, traprock, and construction aggregate",
      agriculture: "U.S. #3 in Cranberries, #5 in Blueberries, bell peppers, tomatoes, and nursery horticulture",
      logistics: "Port Newark/Elizabeth, Kill Van Kull deepwater channel, Newark Liberty air cargo mega-hub"
    },
    modeledIndustrialOutput: "$98B (Pharmaceuticals, Biotechnology, Petrochemical Refining, Flavors & Fragrances)",
    modeledAgriculturalOutput: "$1.5B (Blueberries, Cranberries, Nursery/Greenhouse, Produce)",
    sourceAttribution: "PANYNJ Cargo Reports / USDA NASS / USGS"
  },

  "New Mexico": {
    name: "New Mexico",
    code: "NM",
    region: "Southwest & Permian Basin",
    hydrocarbonIndex: 96,
    mineralIndex: 78,
    arableLandIndex: 45,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Delaware Basin (Permian Basin Extension)", type: "oil_gas", coords: [-103.8, 32.3], desc: "Nation's fastest growing oil province; propelled New Mexico to the #2 oil producer in the US (>1.8M bbl/d)" },
      { name: "San Juan Basin Gas Field", type: "oil_gas", coords: [-107.8, 36.6], desc: "Massive natural gas and coalbed methane basin in northwestern New Mexico" },
      { name: "Carlsbad Potash Mining District", type: "mineral", coords: [-104.2, 32.4], desc: "Produces ~75% of all agricultural potassium/potash salts in the United States" }
    ],
    resources: {
      hydrocarbons: "Crude Oil: 650M bbl/yr (#2 US); Natural Gas: 2.9T cu ft/yr (#3 US); major Lea and Eddy county tight oil",
      criticalMinerals: "Potash (Carlsbad Basin #1 US), copper (Chino & Tyrone open-pit mines), uranium reserves (Grants Mineral Belt)",
      agriculture: "U.S. #1 in Pecans, famous Hatch green chile, dairy (#9 US), and beef cattle",
      logistics: "Landlocked; BNSF Southern Transcon main line across Belen and I-40 / I-25 logistics junction"
    },
    modeledIndustrialOutput: "$65B (Oil and Gas Extraction, National Labs [Los Alamos, Sandia], Defense Aerospace)",
    modeledAgriculturalOutput: "$4.1B (Dairy, Pecans, Green Chiles, Beef Cattle)",
    sourceAttribution: "EIA SEDS / USGS Potash Statistics / NM Dept of Agriculture"
  },

  "New York": {
    name: "New York",
    code: "NY",
    region: "Mid-Atlantic & Great Lakes Seaway",
    hydrocarbonIndex: 5,
    mineralIndex: 60,
    arableLandIndex: 65,
    logisticsWaterwayIndex: 96,
    primaryBasins: [
      { name: "Port of New York & New Jersey", type: "port", coords: [-74.0, 40.7], desc: "Premier maritime harbor and financial nexus of North American commerce" },
      { name: "Adirondack Industrial Minerals Belt", type: "mineral", coords: [-74.1, 44.1], desc: "Home to the world's largest industrial garnet mine and sole US wollastonite deposits" },
      { name: "Finger Lakes & Western Dairy Shelf", type: "agri", coords: [-77.0, 42.8], desc: "High-yield dairy milk sheds, viticulture (Finger Lakes wines), and apple orchards" }
    ],
    resources: {
      hydrocarbons: "Marginal legacy natural gas wells in Western NY (~10 Bcf/yr); fracking banned by state statute",
      criticalMinerals: "Wollastonite (sole US producer), industrial garnet (Barton Mines #1 US), rock salt (Retsof/Cayuga salt mines), zinc",
      agriculture: "U.S. #5 in Dairy Milk, #2 in Apples, #2 in Cabbage, #3 in Grapes/Wine, maple syrup, and sweet corn",
      logistics: "Port of New York, Saint Lawrence Seaway, Hudson River deep-draft channel to Albany, and Erie Canal system"
    },
    modeledIndustrialOutput: "$175B (Aerospace, Semiconductors [Albany NanoTech], Precision Machinery, Food Processing)",
    modeledAgriculturalOutput: "$7.2B (Dairy, Apples, Grapes/Wine, Field Crops)",
    sourceAttribution: "USGS Minerals / USDA NASS / Port of NYNJ"
  },

  "North Carolina": {
    name: "North Carolina",
    code: "NC",
    region: "Mid-Atlantic & Piedmont Shelf",
    hydrocarbonIndex: 0,
    mineralIndex: 82,
    arableLandIndex: 82,
    logisticsWaterwayIndex: 80,
    primaryBasins: [
      { name: "Kings Mountain Lithium Belt", type: "mineral", coords: [-81.3, 35.2], desc: "Carolina Tin-Spodumene Belt; world-class domestic hard-rock lithium pegmatite reserve" },
      { name: "Aurora Phosphate Mine", type: "mineral", coords: [-76.8, 35.3], desc: "One of the world's largest integrated phosphate mining and fertilizer production complexes" },
      { name: "Coastal Plain Swine & Poultry Basin", type: "agri", coords: [-78.1, 35.0], desc: "High-density swine, turkey, and sweet potato production centers" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial petroleum or natural gas extraction)",
      criticalMinerals: "Lithium pegmatites (Kings Mountain / Piedmont Lithium), Phosphate Rock (Nutrien Aurora), feldspar #1 in US, mica, pyrophyllite",
      agriculture: "U.S. #1 in Sweet Potatoes (~60% of US total), #2 in Turkeys, #3 in Hogs, #1 in Tobacco, major broiler chickens and blueberries",
      logistics: "Port of Wilmington deepwater channel, Port of Morehead City, and Research Triangle logistics network"
    },
    modeledIndustrialOutput: "$115B (Biomanufacturing, Pharmaceuticals, Automotive, Advanced Textiles, Chemicals)",
    modeledAgriculturalOutput: "$18.5B (Hogs, Poultry/Eggs, Sweet Potatoes, Tobacco, Soybeans)",
    sourceAttribution: "USGS Lithium & Phosphate / NC Dept of Agriculture"
  },

  "North Dakota": {
    name: "North Dakota",
    code: "ND",
    region: "Northern Great Plains & Williston Basin",
    hydrocarbonIndex: 94,
    mineralIndex: 40,
    arableLandIndex: 90,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Bakken & Three Forks Shale Play", type: "oil_gas", coords: [-103.2, 48.1], desc: "Epicenter of American tight oil revolution; produces >1.2M bbl/d crude oil and 3.2 Bcf/d natural gas" },
      { name: "Red River Valley Black Soil Belt", type: "agri", coords: [-97.1, 47.9], desc: "Exceptionally flat, fertile valley leading the nation in spring wheat, durum, and sunflowers" }
    ],
    resources: {
      hydrocarbons: "Bakken and Three Forks shale oil (440M bbl/yr #3 US behind TX and NM); lignite coal (26M tons/yr)",
      criticalMinerals: "Bentonite clay, volcanic scoria, leonardite, and rare earth potential in lignite ash",
      agriculture: "U.S. #1 in Spring Wheat, #1 in Durum Wheat, #1 in Sunflowers, #1 in Canola, #1 in Dry Edible Beans, and #1 in Honey",
      logistics: "Landlocked; extensive crude oil rail loading terminals and BNSF transcontinental mainline"
    },
    modeledIndustrialOutput: "$52B (Crude Oil Extraction, Petroleum Refining, Coal Gasification [Great Plains Synfuels])",
    modeledAgriculturalOutput: "$12.4B (Wheat, Canola, Soybeans, Sunflowers, Corn)",
    sourceAttribution: "ND Dept of Mineral Resources / EIA / USDA NASS"
  },

  "Ohio": {
    name: "Ohio",
    code: "OH",
    region: "Midwest Industrial Core & Lake Erie",
    hydrocarbonIndex: 82,
    mineralIndex: 60,
    arableLandIndex: 82,
    logisticsWaterwayIndex: 85,
    primaryBasins: [
      { name: "Utica Shale Gas & Liquids Basin", type: "oil_gas", coords: [-81.1, 40.0], desc: "Major Appalachian Basin shale play producing ~2.2T cu ft/yr of natural gas and wet liquids" },
      { name: "Port of Cleveland & Lake Erie Harbors", type: "port", coords: [-81.7, 41.5], desc: "Bulk maritime handling of iron ore, salt, steel, and machinery across the St. Lawrence Seaway" },
      { name: "Western Ohio Till Plains", type: "agri", coords: [-83.8, 40.2], desc: "Intensive agricultural belt delivering top tier corn, soybeans, swine, and dairy" }
    ],
    resources: {
      hydrocarbons: "Utica and Marcellus Shale natural gas (#5 US), natural gas liquids (ethane/propane), crude oil, and coal",
      criticalMinerals: "Rock salt (mined deep under Lake Erie at Cleveland and Fairport Harbor), limestone, dolomite, clay",
      agriculture: "U.S. #6 in Soybeans, #7 in Corn, #2 in Swiss Cheese, #2 in Egg Production, and major dairy",
      logistics: "Eight Great Lakes commercial ports (Cleveland, Toledo) and Ohio River barge riverports (Cincinnati)"
    },
    modeledIndustrialOutput: "$130B (Automotive Assembly, Aerospace Engines [GE Aviation], Primary Steel, Polymers/Rubber)",
    modeledAgriculturalOutput: "$11.5B (Soybeans, Corn, Dairy, Eggs, Hogs)",
    sourceAttribution: "USGS Minerals / Ohio DNR / EIA SEDS"
  },

  "Oklahoma": {
    name: "Oklahoma",
    code: "OK",
    region: "Southern Plains & Energy Crossroads",
    hydrocarbonIndex: 92,
    mineralIndex: 55,
    arableLandIndex: 78,
    logisticsWaterwayIndex: 35,
    primaryBasins: [
      { name: "Cushing World Oil Hub", type: "oil_gas", coords: [-96.77, 35.98], desc: "Pipeline crossroads of the world; official delivery point for NYMEX West Texas Intermediate (WTI) crude futures" },
      { name: "Anadarko Basin (SCOOP & STACK)", type: "oil_gas", coords: [-98.2, 35.5], desc: "Deep stacked shale reservoirs delivering high-grade light crude and natural gas liquids" },
      { name: "Port of Catoosa (Tulsa)", type: "port", coords: [-95.7, 36.2], desc: "Head of navigation for the McClellan-Kerr Arkansas River system; nation's furthest inland ice-free riverport" },
      { name: "Western Oklahoma Winter Wheat Belt", type: "agri", coords: [-98.8, 36.2], desc: "Extensive winter wheat plains and native rangeland supporting major beef herds" }
    ],
    resources: {
      hydrocarbons: "Crude Oil: 160M bbl/yr (#5 US); Natural Gas: 2.8T cu ft/yr (#4 US); Cushing storage capacity >90M bbls",
      criticalMinerals: "U.S. #1 in Iodine (sole commercial domestic producer from deep subsurface brines), gypsum, silica sand",
      agriculture: "U.S. #2 in Beef Cows, #4 in Winter Wheat, major grain sorghum, cotton, and swine",
      logistics: "Port of Catoosa on MKARNS waterway, central pipeline hub of North America, interstate crossroads (I-35/I-40)"
    },
    modeledIndustrialOutput: "$68B (Oil/Gas Extraction & Refining, Aerospace Maintenance [Tinker AFB], Pipeline Machinery)",
    modeledAgriculturalOutput: "$9.2B (Cattle, Winter Wheat, Hogs, Poultry)",
    sourceAttribution: "EIA SEDS / Oklahoma Geological Survey / USDA NASS"
  },

  "Oregon": {
    name: "Oregon",
    code: "OR",
    region: "Pacific Northwest & Columbia Basin",
    hydrocarbonIndex: 0,
    mineralIndex: 45,
    arableLandIndex: 78,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Columbia River Deep-Draft Channel (Port of Portland)", type: "port", coords: [-122.7, 45.6], desc: "Major maritime deepwater gateway; nation's #1 wheat export gateway and major auto import hub" },
      { name: "Willamette Valley Agriculture Basin", type: "agri", coords: [-123.0, 44.9], desc: "Grass seed capital of the world; leading producer of hazelnuts, berries, wine grapes, and nurseries" },
      { name: "Cascade Softwood Timber Belt", type: "agri", coords: [-122.5, 43.8], desc: "Most productive softwood timber forest in North America (Douglas fir, Western hemlock)" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial crude oil or gas extraction; major hydroelectric generation on Columbia River)",
      criticalMinerals: "Pumice and volcanic cinder (#1 US), perlite, diatomite, and nickel reserves (Riddle deposit)",
      agriculture: "U.S. #1 in Softwood Lumber & Timber, #1 in Grass Seed (>60% of world supply), #1 in Hazelnuts (99% of US), #2 in Hops, pears",
      logistics: "Port of Portland, Columbia-Snake River navigation system (barge transport extending 465 miles inland to Lewiston, ID)"
    },
    modeledIndustrialOutput: "$68B (Semiconductor Manufacturing [Silicon Forest/Intel], Forest Products, Clean Tech)",
    modeledAgriculturalOutput: "$6.2B (Timber, Grass Seed, Hazelnuts, Nurseries, Wine)",
    sourceAttribution: "USFS Timber Reports / USDA NASS / Port of Portland"
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
      criticalMinerals: "Anthracite coal (sole US producer), high-calcium limestone, structural cement, and rare refractory clay",
      agriculture: "U.S. #1 in Agaricus Mushrooms (>65% of US total), #7 in Dairy Milk, major poultry, apples, and sweet corn",
      logistics: "Port of Philadelphia, Port of Pittsburgh (2nd busiest inland port in US), and Port of Erie (Great Lakes)"
    },
    modeledIndustrialOutput: "$138B (Petrochemicals, Specialty Steel, Heavy Machinery, Pharmaceuticals, Nuclear Energy Tech)",
    modeledAgriculturalOutput: "$9.4B (Dairy, Mushrooms, Poultry, Field Crops)",
    sourceAttribution: "EIA SEDS / USGS Minerals / USDA NASS"
  },

  "Rhode Island": {
    name: "Rhode Island",
    code: "RI",
    region: "New England & Narragansett Littoral",
    hydrocarbonIndex: 0,
    mineralIndex: 10,
    arableLandIndex: 20,
    logisticsWaterwayIndex: 78,
    primaryBasins: [
      { name: "Port of Providence & Quonset Point", type: "port", coords: [-71.4, 41.6], desc: "Major deepwater auto import terminal and offshore wind turbine fabrication staging base" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of fossil fuels; offshore wind pioneer)",
      criticalMinerals: "Construction aggregates, crushed stone, sand, and historic cumberlandite",
      agriculture: "Turfgrass sod, nursery stock, and commercial Narragansett Bay quahog (hard clam) shellfish aquaculture",
      logistics: "Deepwater berths in Narragansett Bay (Providence, Davisville/Quonset) handling auto roll-on/roll-off cargo"
    },
    modeledIndustrialOutput: "$12B (Submarine Module Fabrication [Electric Boat Quonset], Marine Trades, Biomedical)",
    modeledAgriculturalOutput: "$0.18B (Turfgrass, Shellfish Aquaculture, Greenhouse)",
    sourceAttribution: "USGS Minerals / Rhode Island Commerce"
  },

  "South Carolina": {
    name: "South Carolina",
    code: "SC",
    region: "Atlantic Seaboard & Lowcountry",
    hydrocarbonIndex: 0,
    mineralIndex: 50,
    arableLandIndex: 68,
    logisticsWaterwayIndex: 88,
    primaryBasins: [
      { name: "Port of Charleston (Wando Welch & Leatherman)", type: "port", coords: [-79.9, 32.8], desc: "Deepest container port on the East Coast (52 feet); premier transatlantic and transpacific hub" },
      { name: "Piedmont Granite & Kaolin Formations", type: "mineral", coords: [-81.0, 34.2], desc: "Major dimensional granite quarries, sericite mica, and industrial vermiculite" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of oil or gas; extensive nuclear and solar power)",
      criticalMinerals: "Vermiculite (#2 in US), sericite mica, industrial kaolin, and structural dimension granite",
      agriculture: "U.S. #2 in Fresh Peaches (behind California, ahead of Georgia), broiler poultry, turkeys, timber, and cotton",
      logistics: "Port of Charleston (52-ft deepwater harbor), inland rail port at Greer serving BMW and inland industrial base"
    },
    modeledIndustrialOutput: "$75B (Automotive [BMW Spartanburg], Commercial Aviation [Boeing 787], Tires, Chemicals)",
    modeledAgriculturalOutput: "$5.2B (Broilers, Turkeys, Peaches, Timber, Cotton)",
    sourceAttribution: "SC Ports Authority / USGS / USDA NASS"
  },

  "South Dakota": {
    name: "South Dakota",
    code: "SD",
    region: "Northern Plains & Black Hills",
    hydrocarbonIndex: 15,
    mineralIndex: 55,
    arableLandIndex: 90,
    logisticsWaterwayIndex: 15,
    primaryBasins: [
      { name: "Black Hills Mineral Belt", type: "mineral", coords: [-103.8, 44.4], desc: "Historic home of the Homestake Gold Mine and active bentonite, pegmatite, and dimension stone quarries" },
      { name: "East River Corn & Soybean Plains", type: "agri", coords: [-97.5, 44.3], desc: "Vast fertile glaciated plains producing top tier corn, soybeans, and beef cattle" }
    ],
    resources: {
      hydrocarbons: "Modest crude oil production in Harding County (Williston Basin southwest extension; ~1.5M bbl/yr)",
      criticalMinerals: "Bentonite clay, dimension granite (Milbank mahogany granite #1 in world), sand/gravel, and historic gold",
      agriculture: "U.S. top tier in Corn, Soybeans, Beef Cattle (#6 US), Sunflowers (#2 US), Spring Wheat, and Oats",
      logistics: "Landlocked; served by BNSF rail corridors and I-90 / I-29 freight intersections"
    },
    modeledIndustrialOutput: "$22B (Meat Packing, Biofuels, Agricultural Machinery, Firearms)",
    modeledAgriculturalOutput: "$13.8B (Corn, Soybeans, Beef Cattle, Sunflowers, Wheat)",
    sourceAttribution: "USGS Minerals / USDA NASS / SD Dept of Ag"
  },

  "Tennessee": {
    name: "Tennessee",
    code: "TN",
    region: "Upland South & Mississippi Corridor",
    hydrocarbonIndex: 0,
    mineralIndex: 70,
    arableLandIndex: 72,
    logisticsWaterwayIndex: 86,
    primaryBasins: [
      { name: "Port of Memphis", type: "port", coords: [-90.1, 35.1], desc: "Second largest inland port on the shallow-draft Mississippi River and world's premier air cargo hub (FedEx World Hub)" },
      { name: "East Tennessee Zinc District", type: "mineral", coords: [-83.6, 36.1], desc: "Major active underground zinc mines (Nyrstar) supplying refined zinc and germanium byproducts" },
      { name: "Middle Tennessee Agricultural Rolling Basin", type: "agri", coords: [-86.8, 35.7], desc: "Diversified agricultural soils producing soybeans, cattle, broiler chickens, and hardwood timber" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial oil and negligible natural gas; major nuclear power generation via TVA)",
      criticalMinerals: "U.S. #2 in Zinc (Middle & East Tennessee mines), ball clay (leading US source), dimension sandstone, and limestone",
      agriculture: "Soybeans, broiler chickens, beef cattle, cotton, corn, and Appalachian hardwood lumber",
      logistics: "Port of Memphis, extensive navigable waterways along Tennessee and Cumberland rivers, and Memphis international air hub"
    },
    modeledIndustrialOutput: "$88B (Automotive Assembly [Nissan, GM, VW], Chemicals [Eastman], Medical Instruments, Oak Ridge Energy Tech)",
    modeledAgriculturalOutput: "$5.8B (Soybeans, Cattle, Broilers, Cotton, Corn)",
    sourceAttribution: "USGS Zinc Statistics / TVA River Operations / USDA NASS"
  },

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
    sourceAttribution: "USGS / EIA SEDS / USDA ERS"
  },

  "Utah": {
    name: "Utah",
    code: "UT",
    region: "Great Basin & Colorado Plateau",
    hydrocarbonIndex: 60,
    mineralIndex: 95,
    arableLandIndex: 35,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Bingham Canyon Mine (Kennecott)", type: "mineral", coords: [-112.15, 40.52], desc: "World's deepest open-pit excavation; has produced >20M metric tons of copper, plus gold, silver, and molybdenum" },
      { name: "Great Salt Lake Minerals Complex", type: "mineral", coords: [-112.8, 41.2], desc: "Produces 100% of US primary magnesium metal, sulfate of potash, and emerging lithium brines" },
      { name: "Uinta Basin Waxy Crude Play", type: "oil_gas", coords: [-109.8, 40.2], desc: "Unique high-paraffin yellow and black waxy crude oil play and tight natural gas" }
    ],
    resources: {
      hydrocarbons: "Uinta Basin waxy crude (~55M bbl/yr) and natural gas, coalbed methane, and coal in Carbon/Emery counties",
      criticalMinerals: "Kennecott Copper (#2 US), Magnesium metal (#1 US), Beryllium (Spor Mountain #1 in world), Potash, Tellurium",
      agriculture: "Alfalfa hay (leading export crop), beef cattle grazing, dairy, hogs, and tart cherries",
      logistics: "Landlocked; premier intermountain crossroads (Salt Lake City hub for UP rail, I-15 and I-80)"
    },
    modeledIndustrialOutput: "$48B (Copper Smelting, Aerospace & Composites, Defense Missiles [Hill AFB], Magnesium Refining)",
    modeledAgriculturalOutput: "$2.5B (Hay, Beef Cattle, Dairy, Hogs)",
    sourceAttribution: "USGS Copper/Magnesium / Utah Geological Survey / EIA"
  },

  "Vermont": {
    name: "Vermont",
    code: "VT",
    region: "Northern New England",
    hydrocarbonIndex: 0,
    mineralIndex: 55,
    arableLandIndex: 50,
    logisticsWaterwayIndex: 20,
    primaryBasins: [
      { name: "Barre & Danby Stone Belts", type: "mineral", coords: [-72.5, 44.2], desc: "World-famous Barre granite quarry and Danby underground white marble quarry" },
      { name: "Champlain Valley Dairy & Sugarbush Belt", type: "agri", coords: [-73.2, 44.5], desc: "Vermont's agricultural heartland producing artisan cheeses and ~50% of all US maple syrup" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of fossil fuels; high renewable generation)",
      criticalMinerals: "Dimension granite (Barre gray granite #1 US monumental stone), Danby white marble, Vermont slate belt, talc",
      agriculture: "U.S. #1 in Maple Syrup (>50% of US production), artisan dairy and cheddar cheese, apples, and specialty beers",
      logistics: "Inland water transport via Lake Champlain and commercial rail links to Montreal and Boston"
    },
    modeledIndustrialOutput: "$11B (Specialty Metallurgy, Semiconductor Foundries [GlobalFoundries], Food Processing)",
    modeledAgriculturalOutput: "$1.1B (Maple Syrup, Dairy/Cheese, Apples)",
    sourceAttribution: "USGS Dimension Stone / Vermont Dept of Agriculture"
  },

  "Virginia": {
    name: "Virginia",
    code: "VA",
    region: "Mid-Atlantic & Chesapeake Basin",
    hydrocarbonIndex: 25,
    mineralIndex: 65,
    arableLandIndex: 68,
    logisticsWaterwayIndex: 95,
    primaryBasins: [
      { name: "Port of Virginia (Hampton Roads)", type: "port", coords: [-76.3, 36.9], desc: "Deepest 55-ft natural harbor on the East Coast; major transatlantic container hub and coal export terminal" },
      { name: "Central Appalachian Coal & Gas Shelf", type: "oil_gas", coords: [-82.1, 37.1], desc: "High-grade metallurgical coal and coalbed methane in Buchanan, Dickenson, and Wise counties" },
      { name: "Shenandoah Valley Poultry & Orchard Basin", type: "agri", coords: [-78.9, 38.4], desc: "Dense agricultural valley producing broilers, turkeys, apples, and cattle" }
    ],
    resources: {
      hydrocarbons: "Appalachian metallurgical coking coal and coalbed methane (~100 Bcf/yr)",
      criticalMinerals: "Kyanite (Willis Mountain mine #1 in world), titanium/zirconium mineral sands, crushed stone, and vermiculite",
      agriculture: "Broiler poultry and turkeys, cattle/calves, tobacco, apples, soybeans, and Chesapeake oysters",
      logistics: "Port of Virginia (Norfolk/Newport News deepwater berths, Norfolk Southern / CSX rail terminals)"
    },
    modeledIndustrialOutput: "$88B (Naval Shipbuilding [Newport News], Data Centers [Ashburn #1 in world], Defense)",
    modeledAgriculturalOutput: "$5.1B (Poultry, Cattle, Apples, Soybeans, Tobacco)",
    sourceAttribution: "USGS Minerals / Virginia Port Authority / USDA NASS"
  },

  "Washington": {
    name: "Washington",
    code: "WA",
    region: "Pacific Northwest & Puget Sound",
    hydrocarbonIndex: 0,
    mineralIndex: 65,
    arableLandIndex: 85,
    logisticsWaterwayIndex: 96,
    primaryBasins: [
      { name: "Northwest Seaport Alliance (Seattle & Tacoma)", type: "port", coords: [-122.4, 47.3], desc: "Fourth largest container gateway in North America; closest US container ports to major Asian markets" },
      { name: "Yakima Valley & Columbia Basin Irrigation Project", type: "agri", coords: [-120.5, 46.6], desc: "Nation's premier fruit orchard and hop garden; produces >70% of US apples and >75% of US hops" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial petroleum or gas extraction; extensive refining capacity [Anacortes, Cherry Point] and hydroelectricity)",
      criticalMinerals: "Magnesium (historical), olivine, diatomite, construction sand, and industrial limestone",
      agriculture: "U.S. #1 in Apples (~65% of US total), #1 in Hops (73% of US), #1 in Sweet Cherries, #1 in Pears, major potatoes and wheat",
      logistics: "Puget Sound deepwater natural harbors (Seattle, Tacoma) and Columbia River deep-draft channel to Vancouver"
    },
    modeledIndustrialOutput: "$130B (Aerospace Manufacturing [Boeing], Tech Hardware, Maritime Vessel Fabrication)",
    modeledAgriculturalOutput: "$12.8B (Apples, Hops, Wheat, Potatoes, Dairy, Cherries)",
    sourceAttribution: "NW Seaport Alliance / Washington State Dept of Ag / USGS"
  },

  "West Virginia": {
    name: "West Virginia",
    code: "WV",
    region: "Central Appalachian Coal & Shale",
    hydrocarbonIndex: 92,
    mineralIndex: 55,
    arableLandIndex: 35,
    logisticsWaterwayIndex: 65,
    primaryBasins: [
      { name: "Northern Marcellus & Utica Gas Play", type: "oil_gas", coords: [-80.5, 39.5], desc: "Prolific wet and dry natural gas producing >2.7T cu ft/yr and rich natural gas liquids (NGLs)" },
      { name: "Southern Appalachian Metallurgical Coal", type: "oil_gas", coords: [-81.8, 37.8], desc: "World-class low-volatile coking coal for international blast furnace steelmaking" },
      { name: "Kanawha & Ohio River Chemical Corridor", type: "port", coords: [-81.6, 38.3], desc: "Historic Chemical Valley supported by salt brines, natural gas, and low-cost barge transportation" }
    ],
    resources: {
      hydrocarbons: "Natural Gas: 2.8T cu ft/yr (#4 US); Coal: ~85M tons/yr (#2 US); natural gas liquids (ethane, propane, butane)",
      criticalMinerals: "Coal-derived rare earth elements (high concentrations in acid mine drainage), high-purity metallurgical limestone",
      agriculture: "Broiler poultry and turkeys in eastern panhandle, beef cattle, apples, and hardwood timber",
      logistics: "Over 400 miles of navigable waterways (Ohio, Kanawha, Monongahela rivers) moving bulk coal and chemicals"
    },
    modeledIndustrialOutput: "$42B (Natural Gas Processing, Specialty Chemical Refining, Metallurgical Coal Prep)",
    modeledAgriculturalOutput: "$1.1B (Poultry, Cattle, Hardwood Forestry)",
    sourceAttribution: "EIA Coal & Gas Data / West Virginia Geological Survey"
  },

  "Wisconsin": {
    name: "Wisconsin",
    code: "WI",
    region: "Upper Midwest & Great Lakes Dairy",
    hydrocarbonIndex: 0,
    mineralIndex: 70,
    arableLandIndex: 90,
    logisticsWaterwayIndex: 80,
    primaryBasins: [
      { name: "Western Wisconsin Frac Sand Formations", type: "mineral", coords: [-91.5, 44.5], desc: "Jordan and Wonewoc sandstone formations; nation's top producer of spherical industrial silica frac sand" },
      { name: "Fox River Valley & Central Dairy Plain", type: "agri", coords: [-88.5, 44.2], desc: "America's Dairyland; produces over 3.5 billion pounds of cheese annually" },
      { name: "Port of Green Bay & Lake Michigan", type: "port", coords: [-88.0, 44.5], desc: "Major Great Lakes commercial port handling coal, limestone, salt, and forest products" }
    ],
    resources: {
      hydrocarbons: "None (zero commercial extraction of oil or natural gas; energy consumer)",
      criticalMinerals: "Industrial Frac Sand (#1 in US), crushed stone, dimension sandstone, and copper-zinc potential (Bend deposit)",
      agriculture: "U.S. #1 in Cheese (producing >26% of US total), #2 in Milk, #1 in Cranberries (60% of US crop), #1 in Snap Beans",
      logistics: "Great Lakes shipping access via Lake Michigan (Milwaukee, Green Bay) and Lake Superior (Superior), plus Mississippi River"
    },
    modeledIndustrialOutput: "$85B (Papermaking & Pulp, Heavy Industrial Machinery, Dairy Equipment, Marine Vessels)",
    modeledAgriculturalOutput: "$13.5B (Dairy Milk & Cheese, Cranberries, Potatoes, Swine)",
    sourceAttribution: "USGS Frac Sand Reports / Wisconsin Dept of Agriculture"
  },

  "Wyoming": {
    name: "Wyoming",
    code: "WY",
    region: "Powder River Basin & Rockies",
    hydrocarbonIndex: 92,
    mineralIndex: 95,
    arableLandIndex: 55,
    logisticsWaterwayIndex: 0,
    primaryBasins: [
      { name: "Powder River Basin", type: "oil_gas", coords: [-105.5, 44.2], desc: "Largest coal producing basin in North America (North Antelope Rochelle mine); also major tight oil play" },
      { name: "Green River Trona (Soda Ash) Basin", type: "mineral", coords: [-109.8, 41.5], desc: "World's largest natural deposit of trona; produces >90% of all US soda ash for glass and chemicals" },
      { name: "Jonah Field & Pinedale Anticline", type: "oil_gas", coords: [-109.7, 42.6], desc: "Giant tight gas fields in southwestern Wyoming producing high volumes of clean natural gas" },
      { name: "Gas Hills & Powder River Uranium Belt", type: "mineral", coords: [-107.5, 42.8], desc: "Premier domestic in-situ recovery (ISR) uranium extraction operations (Cameco, Energy Fuels)" }
    ],
    resources: {
      hydrocarbons: "U.S. #1 in Coal (~200M tons/yr; 41% of US supply); Natural Gas: 1.3T cu ft/yr (#8 US); Crude Oil: ~95M bbl/yr (#8 US)",
      criticalMinerals: "U.S. #1 in Trona / Soda Ash (90% of US supply), #1 in Uranium reserves and in-situ extraction, rare earth deposits (Bear Lodge)",
      agriculture: "Extensive livestock rangelands: beef cattle (1.3M head), sheep/wool (#4 US), and irrigated alfalfa hay",
      logistics: "Landlocked; nation's heaviest freight rail artery (BNSF and UP coal corridors out of Gillette)"
    },
    modeledIndustrialOutput: "$36B (Coal Mining & Rail Logistics, Trona Refining, Oil/Gas Extraction, Uranium Processing)",
    modeledAgriculturalOutput: "$2.1B (Beef Cattle, Sheep/Wool, Alfalfa Hay)",
    sourceAttribution: "EIA Coal SEDS / USGS Minerals / Wyoming State Geological Survey"
  }
};

/**
 * Returns geographic resource endowments for a given state name.
 * Strictly assigns 0 to any resource index where empirical deposits do not exist.
 */
export function getUsStateEndowment(stateName) {
  if (US_GEOGRAPHIC_ENDOWMENTS[stateName]) {
    return US_GEOGRAPHIC_ENDOWMENTS[stateName];
  }

  // Strict zero baseline for unlisted territories / foreign entities
  return {
    name: stateName,
    code: stateName ? stateName.slice(0, 2).toUpperCase() : "--",
    region: "Territory / Non-Core Unit",
    hydrocarbonIndex: 0,
    mineralIndex: 0,
    arableLandIndex: 0,
    logisticsWaterwayIndex: 0,
    primaryBasins: [],
    resources: {
      hydrocarbons: "None (zero commercial extraction)",
      criticalMinerals: "None (zero commercial deposits)",
      agriculture: "Non-commercial / localized subsistence",
      logistics: "Local roads / air transport only"
    },
    modeledIndustrialOutput: "$0 (No primary extractive industry)",
    modeledAgriculturalOutput: "$0 (Negligible agricultural cash receipts)",
    sourceAttribution: "USGS / USDA Zero-Baseline Standard"
  };
}

/**
 * All prominent geological basins, agricultural heartlands, and maritime nodes
 * for interactive map marker rendering.
 */
export const ALL_US_RESOURCE_MARKERS = Object.values(US_GEOGRAPHIC_ENDOWMENTS).flatMap(
  (s) => (s.primaryBasins || []).map((b) => ({ ...b, state: s.name, stateCode: s.code }))
);
