/**
 * Imperium Solutions — Authoritative Commodity Price Benchmarks
 * Grounded in World Bank Pink Sheet, IMF, and US BLS/EIA data.
 * Pure ES Module — zero Node.js fs dependencies for seamless Cloudflare Workers execution.
 */

export const COMMODITY_PRICE_BENCHMARKS = {
  "Rare Earth Metals": {
    "source": "USGS Mineral Commodity / IMF",
    "benchmark_commodity": "Neodymium-Dysprosium Oxide",
    "unit": "$/kg",
    "real_world_price": 125,
    "input_output_anchor": 1250,
    "sector": "Industry & Manufacturing GDP"
  },
  "Iron Ore": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Iron ore, cfr spot",
    "unit": "$/dmtu",
    "real_world_price": 96.3,
    "input_output_anchor": 115,
    "sector": "Industry & Manufacturing GDP"
  },
  "Copper": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Copper",
    "unit": "$/mt",
    "real_world_price": 14326,
    "input_output_anchor": 920,
    "sector": "Industry & Manufacturing GDP"
  },
  "Aluminium": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Aluminum",
    "unit": "$/mt",
    "real_world_price": 3251,
    "input_output_anchor": 450,
    "sector": "Industry & Manufacturing GDP"
  },
  "Gold & Precious Metals": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Gold",
    "unit": "$/troy oz",
    "real_world_price": 4411,
    "input_output_anchor": 2650,
    "sector": "Industry & Manufacturing GDP"
  },
  "Lead & Heavy Metals": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Lead",
    "unit": "$/mt",
    "real_world_price": 1855,
    "input_output_anchor": 320,
    "sector": "Industry & Manufacturing GDP"
  },
  "Lithium & Batteries": {
    "source": "USGS Minerals / Fastmarkets",
    "benchmark_commodity": "Battery-grade Lithium Hydroxide",
    "unit": "$/mt",
    "real_world_price": 14500,
    "input_output_anchor": 1450,
    "sector": "Industry & Manufacturing GDP"
  },
  "Silicon & Quartz": {
    "source": "USGS Industrial Minerals",
    "benchmark_commodity": "Polycrystalline Silicon",
    "unit": "$/kg",
    "real_world_price": 24.5,
    "input_output_anchor": 280,
    "sector": "Industry & Manufacturing GDP"
  },
  "Coal & Carbon": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Coal, Australian",
    "unit": "$/mt",
    "real_world_price": 135.2,
    "input_output_anchor": 135,
    "sector": "Industry & Manufacturing GDP"
  },
  "Stone & Minerals": {
    "source": "USGS Crushed Stone",
    "benchmark_commodity": "Aggregates & Limestone",
    "unit": "$/ton",
    "real_world_price": 18.5,
    "input_output_anchor": 95,
    "sector": "Industry & Manufacturing GDP"
  },
  "Crude Oil": {
    "source": "World Bank Pink Sheet / EIA",
    "benchmark_commodity": "Crude oil, WTI",
    "unit": "$/bbl",
    "real_world_price": 82.7,
    "input_output_anchor": 82.7,
    "sector": "Industry & Manufacturing GDP"
  },
  "Refined Petroleum & Fuels": {
    "source": "EIA Petroleum Marketing",
    "benchmark_commodity": "Ultra-Low Sulfur Diesel / Gasoline",
    "unit": "$/bbl equiv",
    "real_world_price": 128.5,
    "input_output_anchor": 135,
    "sector": "Industry & Manufacturing GDP"
  },
  "Natural Gas": {
    "source": "World Bank Pink Sheet / Henry Hub",
    "benchmark_commodity": "Natural gas, US",
    "unit": "$/mmbtu",
    "real_world_price": 2.77,
    "input_output_anchor": 45,
    "sector": "Industry & Manufacturing GDP"
  },
  "Uranium & Nuclear": {
    "source": "Cameco / UxC Spot",
    "benchmark_commodity": "Triuranium Octoxide (U3O8)",
    "unit": "$/lb",
    "real_world_price": 82,
    "input_output_anchor": 820,
    "sector": "Industry & Manufacturing GDP"
  },
  "Electricity & Grid": {
    "source": "EIA Electric Power Monthly",
    "benchmark_commodity": "Industrial Electricity",
    "unit": "cents/kWh",
    "real_world_price": 13.8,
    "input_output_anchor": 140,
    "sector": "Industry & Manufacturing GDP"
  },
  "Water": {
    "source": "AWWA Water Utility Survey",
    "benchmark_commodity": "Municipal & Industrial Water",
    "unit": "$/1000 gal",
    "real_world_price": 4.5,
    "input_output_anchor": 45,
    "sector": "Agricultural Sector GDP"
  },
  "Grain": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Wheat, US HRW (Kansas)",
    "unit": "$/mt",
    "real_world_price": 330,
    "input_output_anchor": 180,
    "sector": "Agricultural Sector GDP"
  },
  "Fresh Produce": {
    "source": "USDA AMS Specialty Crops",
    "benchmark_commodity": "Fresh Vegetables Index",
    "unit": "$/cwt",
    "real_world_price": 48,
    "input_output_anchor": 160,
    "sector": "Agricultural Sector GDP"
  },
  "Fruit & Cash Crops": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Orange / Citrus",
    "unit": "$/kg",
    "real_world_price": 0.77,
    "input_output_anchor": 175,
    "sector": "Agricultural Sector GDP"
  },
  "Sugar & Confectionery": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Sugar, US",
    "unit": "$/kg",
    "real_world_price": 0.82,
    "input_output_anchor": 120,
    "sector": "Agricultural Sector GDP"
  },
  "Coffee & Tea": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Coffee, Arabica",
    "unit": "$/kg",
    "real_world_price": 7.97,
    "input_output_anchor": 240,
    "sector": "Agricultural Sector GDP"
  },
  "Tobacco & Spirits": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Tobacco, US import",
    "unit": "$/mt",
    "real_world_price": 6723,
    "input_output_anchor": 320,
    "sector": "Agricultural Sector GDP"
  },
  "Cotton & Natural Fibres": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Cotton, A Index",
    "unit": "$/kg",
    "real_world_price": 2.11,
    "input_output_anchor": 150,
    "sector": "Agricultural Sector GDP"
  },
  "Rubber & Polymers": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Rubber, RSS3",
    "unit": "$/kg",
    "real_world_price": 2.73,
    "input_output_anchor": 190,
    "sector": "Industry & Manufacturing GDP"
  },
  "Meat & Livestock": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Beef, wholesale",
    "unit": "$/kg",
    "real_world_price": 7.28,
    "input_output_anchor": 280,
    "sector": "Agricultural Sector GDP"
  },
  "Fisheries & Seafood": {
    "source": "World Bank Pink Sheet / NOAA",
    "benchmark_commodity": "Commercial Pelagic Fish",
    "unit": "$/mt",
    "real_world_price": 2500,
    "input_output_anchor": 260,
    "sector": "Agricultural Sector GDP"
  },
  "Dairy Products": {
    "source": "USDA AMS Dairy Market",
    "benchmark_commodity": "Cheddar & Whole Milk",
    "unit": "$/cwt",
    "real_world_price": 22.4,
    "input_output_anchor": 190,
    "sector": "Agricultural Sector GDP"
  },
  "Wood & Timber": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Sawnwood / Industrial Roundwood",
    "unit": "$/m3",
    "real_world_price": 737.9,
    "input_output_anchor": 210,
    "sector": "Agricultural Sector GDP"
  },
  "Paper & Publishing": {
    "source": "BLS PPI Pulp & Paper",
    "benchmark_commodity": "Industrial Bleached Kraft Pulp",
    "unit": "$/mt",
    "real_world_price": 820,
    "input_output_anchor": 240,
    "sector": "Industry & Manufacturing GDP"
  },
  "Steel & Iron": {
    "source": "MEPS International / World Steel",
    "benchmark_commodity": "Hot-Rolled Steel Coil",
    "unit": "$/mt",
    "real_world_price": 860,
    "input_output_anchor": 420,
    "sector": "Industry & Manufacturing GDP"
  },
  "Construction Materials": {
    "source": "BLS PPI Concrete & Cement",
    "benchmark_commodity": "Ready-Mix Concrete & Structural Cement",
    "unit": "$/cu yd",
    "real_world_price": 158,
    "input_output_anchor": 250,
    "sector": "Industry & Manufacturing GDP"
  },
  "Glass & Ceramics": {
    "source": "BLS PPI Flat Glass",
    "benchmark_commodity": "Float Architectural Glass",
    "unit": "$/sq meter",
    "real_world_price": 42,
    "input_output_anchor": 220,
    "sector": "Industry & Manufacturing GDP"
  },
  "Industrial Hardware & Pipes": {
    "source": "BLS PPI Fabricated Metal",
    "benchmark_commodity": "Seamless Carbon Steel Pipe & Fittings",
    "unit": "$/ft",
    "real_world_price": 38,
    "input_output_anchor": 310,
    "sector": "Industry & Manufacturing GDP"
  },
  "Plastics & Synthetics": {
    "source": "Plastics News Resin Pricing",
    "benchmark_commodity": "Polyethylene & Polypropylene Resins",
    "unit": "$/lb",
    "real_world_price": 0.88,
    "input_output_anchor": 290,
    "sector": "Industry & Manufacturing GDP"
  },
  "Machine Tools & Machinery": {
    "source": "AMT / BLS PPI Industrial Machinery",
    "benchmark_commodity": "Multi-Axis CNC Milling Centers",
    "unit": "$/unit index",
    "real_world_price": 1450,
    "input_output_anchor": 480,
    "sector": "Industry & Manufacturing GDP"
  },
  "Heavy Engines & Turbines": {
    "source": "BLS PPI Turbines & Power Equipment",
    "benchmark_commodity": "Gas Turbines & Industrial Diesel Engines",
    "unit": "$/kW",
    "real_world_price": 680,
    "input_output_anchor": 550,
    "sector": "Industry & Manufacturing GDP"
  },
  "Semiconductors & Chips": {
    "source": "SIA Global Semiconductor / WSTS",
    "benchmark_commodity": "Logic & Memory Integrated Circuits",
    "unit": "$/wafer equivalent",
    "real_world_price": 3400,
    "input_output_anchor": 720,
    "sector": "Industry & Manufacturing GDP"
  },
  "Computers & Electronics": {
    "source": "BLS PPI Electronic Computers",
    "benchmark_commodity": "Enterprise Server & Desktop Systems",
    "unit": "$/unit",
    "real_world_price": 1250,
    "input_output_anchor": 620,
    "sector": "Industry & Manufacturing GDP"
  },
  "Telecommunications & Optics": {
    "source": "BLS PPI Fiber Optic Cable & Routing",
    "benchmark_commodity": "Optical Transceivers & 5G Base Stations",
    "unit": "$/system",
    "real_world_price": 980,
    "input_output_anchor": 510,
    "sector": "Industry & Manufacturing GDP"
  },
  "Electrical Consumer Appliances": {
    "source": "AHAM / BLS CPI Major Appliances",
    "benchmark_commodity": "Refrigeration & Laundry Equipment",
    "unit": "$/unit",
    "real_world_price": 750,
    "input_output_anchor": 380,
    "sector": "Industry & Manufacturing GDP"
  },
  "Apparel & Footwear": {
    "source": "BLS CPI Apparel",
    "benchmark_commodity": "Finished Garments & Technical Footwear",
    "unit": "$/garment",
    "real_world_price": 45,
    "input_output_anchor": 210,
    "sector": "Industry & Manufacturing GDP"
  },
  "Automobiles & Transport Equipment": {
    "source": "Kelley Blue Book / BLS PPI Motor Vehicles",
    "benchmark_commodity": "Light Trucks & Passenger Electric Vehicles",
    "unit": "$/vehicle",
    "real_world_price": 48500,
    "input_output_anchor": 680,
    "sector": "Industry & Manufacturing GDP"
  },
  "Railways & Rolling Stock": {
    "source": "AAR Railway Supply Institute",
    "benchmark_commodity": "Diesel-Electric Locomotives & Boxcars",
    "unit": "$/car equivalent",
    "real_world_price": 135000,
    "input_output_anchor": 590,
    "sector": "Industry & Manufacturing GDP"
  },
  "Ships & Marine Vessels": {
    "source": "Clarkson Research Maritime Index",
    "benchmark_commodity": "Handysize Bulk Carriers & Tankers",
    "unit": "$/DWT",
    "real_world_price": 850,
    "input_output_anchor": 650,
    "sector": "Industry & Manufacturing GDP"
  },
  "Aerospace & Aviation": {
    "source": "AIA Aerospace Facts & Figures",
    "benchmark_commodity": "Commercial Airframes & Avionics",
    "unit": "$/unit index",
    "real_world_price": 125000,
    "input_output_anchor": 850,
    "sector": "Industry & Manufacturing GDP"
  },
  "Spacecraft & Propulsion": {
    "source": "FAA Commercial Space Transportation",
    "benchmark_commodity": "Orbital Launch Stages & Satellites",
    "unit": "$/kg to LEO",
    "real_world_price": 1850,
    "input_output_anchor": 980,
    "sector": "Industry & Manufacturing GDP"
  },
  "Small Arms & Munitions": {
    "source": "DOD Procurement Index",
    "benchmark_commodity": "NATO Standard Munitions & Small Arms",
    "unit": "$/1000 rounds",
    "real_world_price": 650,
    "input_output_anchor": 420,
    "sector": "Industry & Manufacturing GDP"
  },
  "Heavy Armaments & Artillery": {
    "source": "IISS Military Balance",
    "benchmark_commodity": "Main Battle Tanks & Howitzers",
    "unit": "$/vehicle index",
    "real_world_price": 8500000,
    "input_output_anchor": 820,
    "sector": "Industry & Manufacturing GDP"
  },
  "Chemicals & Explosives": {
    "source": "World Bank Pink Sheet / ACC",
    "benchmark_commodity": "Basic Industrial Petrochemicals & Acids",
    "unit": "$/mt",
    "real_world_price": 780,
    "input_output_anchor": 340,
    "sector": "Industry & Manufacturing GDP"
  },
  "Fertilizer & Agrochem": {
    "source": "World Bank Pink Sheet",
    "benchmark_commodity": "Diammonium Phosphate (DAP)",
    "unit": "$/mt",
    "real_world_price": 793.5,
    "input_output_anchor": 310,
    "sector": "Industry & Manufacturing GDP"
  },
  "Solar & Clean Energy": {
    "source": "BloombergNEF / NREL",
    "benchmark_commodity": "Monocrystalline Silicon PV Modules",
    "unit": "$/watt",
    "real_world_price": 0.16,
    "input_output_anchor": 440,
    "sector": "Industry & Manufacturing GDP"
  },
  "Pharmaceuticals & Medicine": {
    "source": "CMS National Health Expenditure",
    "benchmark_commodity": "Formulated Biologics & Small Molecules",
    "unit": "$/treatment course",
    "real_world_price": 850,
    "input_output_anchor": 520,
    "sector": "Office & Corporate Services GDP"
  },
  "Medical Technology & Services": {
    "source": "AHA Hospital Statistics",
    "benchmark_commodity": "Diagnostic Imaging & Surgical Facilities",
    "unit": "$/encounter",
    "real_world_price": 2800,
    "input_output_anchor": 610,
    "sector": "Office & Corporate Services GDP"
  },
  "Processed Foods & Hospitality": {
    "source": "NRA / BLS Food Away From Home",
    "benchmark_commodity": "Food Service & Hospitality Index",
    "unit": "$/cover",
    "real_world_price": 38,
    "input_output_anchor": 270,
    "sector": "Hospitality & Tourist Services GDP"
  },
  "Retail, Trade & Logistics": {
    "source": "NRF / Cass Freight Index",
    "benchmark_commodity": "Intermodal Freight & Wholesale Distribution",
    "unit": "$/mile/ton",
    "real_world_price": 2.45,
    "input_output_anchor": 380,
    "sector": "Office & Corporate Services GDP"
  },
  "Housing & Real Estate": {
    "source": "S&P CoreLogic Case-Shiller / Census",
    "benchmark_commodity": "Residential & Commercial Leases",
    "unit": "$/sq ft/year",
    "real_world_price": 28.5,
    "input_output_anchor": 490,
    "sector": "Office & Corporate Services GDP"
  },
  "Media, Internet & Software": {
    "source": "Gartner Enterprise IT Spending",
    "benchmark_commodity": "Cloud Compute & SaaS Subscriptions",
    "unit": "$/seat/month",
    "real_world_price": 140,
    "input_output_anchor": 580,
    "sector": "Office & Corporate Services GDP"
  },
  "Banking & Financial Services": {
    "source": "FDIC Quarterly Banking Profile",
    "benchmark_commodity": "Commercial Credit & Asset Management",
    "unit": "basis points",
    "real_world_price": 320,
    "input_output_anchor": 750,
    "sector": "Office & Corporate Services GDP"
  },
  "Public Administration & Governance": {
    "source": "BEA Government Accounts",
    "benchmark_commodity": "Civic Administration & Regulatory Operations",
    "unit": "$/capita",
    "real_world_price": 3850,
    "input_output_anchor": 420,
    "sector": "Office & Corporate Services GDP"
  },
  "Controlled & Illicit Goods": {
    "source": "UNODC World Drug Report",
    "benchmark_commodity": "Underground Narcotic & Contraband Index",
    "unit": "$/gram equivalent",
    "real_world_price": 75,
    "input_output_anchor": 650,
    "sector": "Industry & Manufacturing GDP"
  }
};
