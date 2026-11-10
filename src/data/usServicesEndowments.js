/**
 * Imperium Solutions — Authoritative United States Services & Knowledge Endowments
 * Grounded in empirical data from:
 * - BEA (U.S. Bureau of Economic Analysis) Real GDP by Industry & State
 * - BLS (U.S. Bureau of Labor Statistics) Occupational Employment and Wage Statistics (OEWS)
 * - NSF (National Science Foundation) Science & Engineering Indicators & University R&D
 * - FDIC (Federal Deposit Insurance Corporation) State Commercial Banking Asset Reports
 *
 * Models the services economy through 5 non-extractive dimensions:
 * 1. humanCapitalIndex: Advanced education, STEM and medical research talent
 * 2. urbanAgglomerationIndex: Metropolitan density, commercial real estate, urban scaling
 * 3. financialDepthIndex: Commercial banking assets, venture capital, and asset management
 * 4. digitalConnectivityIndex: Cloud data center capacity, fiber broadband, and internet infrastructure
 * 5. consumerAmenityIndex: Tourism, hospitality, entertainment, and culinary attractions
 */

export const US_SERVICES_ENDOWMENTS = {
  "Alabama": {
    "name": "Alabama",
    "code": "AL",
    "region": "Deep South & Gulf Littoral",
    "humanCapitalIndex": 62,
    "urbanAgglomerationIndex": 55,
    "financialDepthIndex": 58,
    "digitalConnectivityIndex": 64,
    "consumerAmenityIndex": 65,
    "primaryClusters": [
      {
        "name": "Huntsville Aerospace & Defense R&D",
        "type": "research",
        "coords": [
          -86.58,
          34.73
        ],
        "desc": "NASA Marshall Space Flight Center, Redstone Arsenal, and Cummings Research Park (nation's 2nd largest research park)"
      },
      {
        "name": "Birmingham Regional Banking Core",
        "type": "finance",
        "coords": [
          -86.8,
          33.51
        ],
        "desc": "Headquarters of Regions Financial and leading commercial banking & medical clinic center (UAB Health System)"
      },
      {
        "name": "Gulf Shores Resort Economy",
        "type": "hospitality",
        "coords": [
          -87.69,
          30.25
        ],
        "desc": "Major Gulf Coast tourism, hospitality, and deep-sea convention infrastructure"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Cummings Research Park defense software, missile telemetry systems, and federal aerospace contracts",
      "banking": "Regions Financial HQ ($155B+ assets), commercial credit, and insurance administration",
      "healthcare": "UAB Medical Center, biomedical clinical trials, and southeastern regional referral hospitals",
      "hospitality": "Gulf Coast beach tourism, Civil Rights heritage tourism, and collegiate sports entertainment"
    },
    "modeledServicesOutput": "$195B (71% of AL GDP)",
    "sourceAttribution": "BEA GDP by Industry AL / NSF R&D / FDIC"
  },
  "Alaska": {
    "name": "Alaska",
    "code": "AK",
    "region": "Pacific Arctic Shelf",
    "humanCapitalIndex": 58,
    "urbanAgglomerationIndex": 42,
    "financialDepthIndex": 45,
    "digitalConnectivityIndex": 55,
    "consumerAmenityIndex": 85,
    "primaryClusters": [
      {
        "name": "Ted Stevens Anchorage Air Cargo Hub",
        "type": "tech",
        "coords": [
          -149.99,
          61.17
        ],
        "desc": "Top 5 global air cargo hub connecting North America with East Asian transpacific logistics networks"
      },
      {
        "name": "Southeast Marine Eco-Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -134.42,
          58.3
        ],
        "desc": "Glacier Bay, Inside Passage cruise lines, and wilderness ecotourism operations"
      },
      {
        "name": "Alaska Native Corporation Corporate Centers",
        "type": "finance",
        "coords": [
          -149.9,
          61.21
        ],
        "desc": "Multi-billion dollar ANCSA corporations managing global government contracting and investment portfolios"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Transpacific air freight logistics, satellite telemetry, and Arctic cold-weather defense testing",
      "banking": "Alaska Permanent Fund Corporation ($80B sovereign wealth fund) and ANCSA enterprise asset management",
      "healthcare": "Alaska Native Tribal Health Consortium and remote telehealth delivery networks",
      "hospitality": "Cruise ship passenger tourism, world-class sportfishing lodges, and aurora borealis excursions"
    },
    "modeledServicesOutput": "$46B (71% of AK GDP)",
    "sourceAttribution": "BEA GDP by Industry AK / Alaska Permanent Fund Corp / DOT"
  },
  "Arizona": {
    "name": "Arizona",
    "code": "AZ",
    "region": "Southwest Sunbelt Corridor",
    "humanCapitalIndex": 78,
    "urbanAgglomerationIndex": 84,
    "financialDepthIndex": 76,
    "digitalConnectivityIndex": 86,
    "consumerAmenityIndex": 88,
    "primaryClusters": [
      {
        "name": "Silicon Desert Semi & Software Corridor",
        "type": "tech",
        "coords": [
          -111.93,
          33.3
        ],
        "desc": "TSMC mega-fabs, Intel Ocotillo campus, onsemi HQ, and major Phoenix enterprise SaaS clusters"
      },
      {
        "name": "Scottsdale & Camelback Financial Corridor",
        "type": "finance",
        "coords": [
          -111.92,
          33.49
        ],
        "desc": "Wealth management, insurance headquarters, and back-office financial processing operations"
      },
      {
        "name": "Sonoran Desert Luxury Resort Hub",
        "type": "hospitality",
        "coords": [
          -111.9,
          33.52
        ],
        "desc": "PGA Tour events, Cactus League spring training, and world-renowned desert wellness spas"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Semiconductor microarchitecture design, autonomous vehicle testing grounds, and cloud server hosting",
      "banking": "Wealth management, fintech operational centers, and commercial real estate syndication",
      "healthcare": "Mayo Clinic Arizona, Banner Health, and specialized longevity & geriatric medical services",
      "hospitality": "Grand Canyon international tourism, winter sunshine second-home economy, and golf resort hospitality"
    },
    "modeledServicesOutput": "$375B (76% of AZ GDP)",
    "sourceAttribution": "BEA GDP by Industry AZ / Arizona Commerce Authority / FDIC"
  },
  "Arkansas": {
    "name": "Arkansas",
    "code": "AR",
    "region": "Ozark & Mid-South Corridor",
    "humanCapitalIndex": 60,
    "urbanAgglomerationIndex": 52,
    "financialDepthIndex": 64,
    "digitalConnectivityIndex": 66,
    "consumerAmenityIndex": 68,
    "primaryClusters": [
      {
        "name": "Northwest Arkansas Retail & Supply Chain Corridor",
        "type": "tech",
        "coords": [
          -94.22,
          36.37
        ],
        "desc": "Global retail management capital anchored by Walmart Home Office and hundreds of vendor tech offices"
      },
      {
        "name": "Little Rock Financial & Banking District",
        "type": "finance",
        "coords": [
          -92.28,
          34.74
        ],
        "desc": "Stephens Inc. investment banking, Bank OZK HQ ($35B assets), and Simmons Bank corporate center"
      },
      {
        "name": "Hot Springs National Park & Spa Economy",
        "type": "hospitality",
        "coords": [
          -93.05,
          34.5
        ],
        "desc": "Thermal springs wellness tourism, Oaklawn racing resort, and Ouachita outdoor recreation"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Enterprise retail supply-chain analytics, automated inventory routing software, and logistics fintech",
      "banking": "Stephens Inc. (major private investment bank), nationwide construction lending, and municipal finance",
      "healthcare": "UAMS Medical Center, Arkansas Children's Hospital, and rural medicine networks",
      "hospitality": "Ozark mountain ecotourism, Crystal Bridges Museum of American Art, and thermal spring resorts"
    },
    "modeledServicesOutput": "$118B (72% of AR GDP)",
    "sourceAttribution": "BEA GDP by Industry AR / Arkansas EDC / FDIC"
  },
  "California": {
    "name": "California",
    "code": "CA",
    "region": "Pacific Innovation & Maritime Edge",
    "humanCapitalIndex": 98,
    "urbanAgglomerationIndex": 96,
    "financialDepthIndex": 99,
    "digitalConnectivityIndex": 99,
    "consumerAmenityIndex": 97,
    "primaryClusters": [
      {
        "name": "Silicon Valley & San Francisco Tech Capital",
        "type": "tech",
        "coords": [
          -122.08,
          37.38
        ],
        "desc": "Global epicenter of AI, cloud computing, venture capital, and semiconductor IP (Apple, Google, Nvidia, Meta)"
      },
      {
        "name": "Sand Hill Road Venture Capital Core",
        "type": "finance",
        "coords": [
          -122.2,
          37.42
        ],
        "desc": "Unmatched global concentration of early-stage and growth venture capital funding and tech IPO underwriting"
      },
      {
        "name": "Los Angeles Entertainment & Creative Media Hub",
        "type": "creative",
        "coords": [
          -118.32,
          34.1
        ],
        "desc": "Hollywood cinema, international streaming networks, music production, and interactive gaming studios"
      },
      {
        "name": "San Diego Torrey Pines Biotech Cluster",
        "type": "research",
        "coords": [
          -117.24,
          32.89
        ],
        "desc": "Illumina, Scripps Research, Salk Institute, and premier genomics & life sciences venture community"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Artificial general intelligence research, cloud hyperscale infrastructure, and mobile operating platforms",
      "banking": "Silicon Valley venture capital ($80B+ annual deployed), global tech advisory, and wealth management",
      "healthcare": "Stanford Health Care, UCSF Medical Center, Cedars-Sinai, and breakthrough genomics/cell therapies",
      "hospitality": "Disneyland Resort, Yosemite National Park, Napa Valley wine tourism, and Pacific coast beaches"
    },
    "modeledServicesOutput": "$2,950B (75% of CA GDP)",
    "sourceAttribution": "BEA GDP by Industry CA / NVCA Venture Monitor / NSF Higher Ed"
  },
  "Colorado": {
    "name": "Colorado",
    "code": "CO",
    "region": "Front Range Tech & Mountain Shelf",
    "humanCapitalIndex": 92,
    "urbanAgglomerationIndex": 86,
    "financialDepthIndex": 84,
    "digitalConnectivityIndex": 90,
    "consumerAmenityIndex": 95,
    "primaryClusters": [
      {
        "name": "Boulder & Denver Tech & Quantum Corridor",
        "type": "tech",
        "coords": [
          -105.27,
          40.01
        ],
        "desc": "National Quantum Information Hub, aerospace software, telecommunications, and high-growth venture tech"
      },
      {
        "name": "Denver Lower Downtown (LoDo) Financial Core",
        "type": "finance",
        "coords": [
          -104.99,
          39.75
        ],
        "desc": "Mutual fund management (Janus Henderson), energy finance, and Mountain West investment banking"
      },
      {
        "name": "Rocky Mountain Ski & Alpine Resort Empire",
        "type": "hospitality",
        "coords": [
          -106.37,
          39.64
        ],
        "desc": "Vail, Aspen, Breckenridge, and Telluride\u2014premier global winter sports and luxury alpine hospitality"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Commercial aerospace telemetry, quantum computing hardware, and telecommunications routing",
      "banking": "Asset management, renewable energy project finance, and venture capital syndicates",
      "healthcare": "UCHealth University of Colorado Anschutz Medical Campus and sports orthopedic excellence",
      "hospitality": "Rocky Mountain ski resorts ($4.5B+ annual winter tourism), national parks, and summer adventure lodges"
    },
    "modeledServicesOutput": "$410B (77% of CO GDP)",
    "sourceAttribution": "BEA GDP by Industry CO / NSF R&D / Colorado Tourism Office"
  },
  "Connecticut": {
    "name": "Connecticut",
    "code": "CT",
    "region": "New England Financial & Biotech Corridor",
    "humanCapitalIndex": 92,
    "urbanAgglomerationIndex": 88,
    "financialDepthIndex": 96,
    "digitalConnectivityIndex": 88,
    "consumerAmenityIndex": 76,
    "primaryClusters": [
      {
        "name": "Fairfield County & Greenwich Hedge Fund Capital",
        "type": "finance",
        "coords": [
          -73.62,
          41.03
        ],
        "desc": "World's highest concentration of alternative asset managers, macro hedge funds, and private wealth offices"
      },
      {
        "name": "Hartford Insurance City Core",
        "type": "finance",
        "coords": [
          -72.67,
          41.76
        ],
        "desc": "Historical and operational epicenter of US life, property, casualty, and health insurance giants (Travelers, Aetna)"
      },
      {
        "name": "New Haven Yale Biotech & Higher Ed Hub",
        "type": "research",
        "coords": [
          -72.92,
          41.31
        ],
        "desc": "Yale University biomedical research spinouts, oncology therapeutics, and patent law centers"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Defense software engineering (Submarine sonar & avionics), algorithmic trading systems, and bio-informatics",
      "banking": "Bridgewater Associates, Point72, and leading global quantitative hedge funds managing $500B+ AUM",
      "healthcare": "Yale New Haven Health System, pharmaceutical drug trials, and specialized neuro-oncology",
      "hospitality": "Long Island Sound coastal yachting, Foxwoods & Mohegan Sun gaming resorts, and historic colonial tourism"
    },
    "modeledServicesOutput": "$275B (81% of CT GDP)",
    "sourceAttribution": "BEA GDP by Industry CT / Connecticut Hedge Fund Association / Yale R&D"
  },
  "Delaware": {
    "name": "Delaware",
    "code": "DE",
    "region": "Mid-Atlantic Corporate Haven",
    "humanCapitalIndex": 82,
    "urbanAgglomerationIndex": 76,
    "financialDepthIndex": 95,
    "digitalConnectivityIndex": 84,
    "consumerAmenityIndex": 72,
    "primaryClusters": [
      {
        "name": "Wilmington Corporate Law & Court of Chancery",
        "type": "finance",
        "coords": [
          -75.54,
          39.74
        ],
        "desc": "The legal and judicial capital for US corporate governance; Court of Chancery decides Fortune 500 mergers"
      },
      {
        "name": "Delaware Credit Card & Consumer Banking Core",
        "type": "finance",
        "coords": [
          -75.55,
          39.75
        ],
        "desc": "Major operational credit card banks (JPMorgan Chase, Barclays, Discover) leveraged by favorable banking statutes"
      },
      {
        "name": "Rehoboth Beach & Atlantic Coastal Tourism",
        "type": "hospitality",
        "coords": [
          -75.08,
          38.71
        ],
        "desc": "Premier Mid-Atlantic beach destination, convention hotels, and summer vacation tourism"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Fintech payment gateway processing, automated fraud detection, and regulatory compliance software",
      "banking": "Corporate entity incorporation services, trust administration, and national credit card lending",
      "healthcare": "ChristianaCare health system and specialized medical research",
      "hospitality": "Atlantic shore tourism, tax-free retail outlet shopping, and coastal conferences"
    },
    "modeledServicesOutput": "$78B (83% of DE GDP)",
    "sourceAttribution": "BEA GDP by Industry DE / Delaware Division of Corporations / FDIC"
  },
  "Florida": {
    "name": "Florida",
    "code": "FL",
    "region": "Southeastern Coastal & Gateway Shelf",
    "humanCapitalIndex": 80,
    "urbanAgglomerationIndex": 90,
    "financialDepthIndex": 88,
    "digitalConnectivityIndex": 90,
    "consumerAmenityIndex": 100,
    "primaryClusters": [
      {
        "name": "Miami Brickell International Financial District",
        "type": "finance",
        "coords": [
          -80.19,
          25.76
        ],
        "desc": "Wall Street South: international private wealth, Latin American trade finance, and burgeoning venture tech"
      },
      {
        "name": "Orlando Theme Park & Entertainment Empire",
        "type": "hospitality",
        "coords": [
          -81.37,
          28.53
        ],
        "desc": "World's #1 tourist destination (Walt Disney World, Universal Orlando) hosting 75M+ annual visitors"
      },
      {
        "name": "Tampa Bay FinTech & Defense Command Corridor",
        "type": "tech",
        "coords": [
          -82.45,
          27.95
        ],
        "desc": "Raymond James Financial HQ, cybersecurity tech, and US Central Command (CENTCOM) IT contracts"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Enterprise cloud relocation, commercial space tourism support (Cape Canaveral), and simulation tech",
      "banking": "Brickell private banking, wealth management inflows from northeast US, and real estate financing",
      "healthcare": "Cleveland Clinic Florida, Mayo Clinic Jacksonville, and specialized senior healthcare systems",
      "hospitality": "Global resort destinations, cruise line headquarters (Royal Caribbean, Carnival), and year-round beach resorts"
    },
    "modeledServicesOutput": "$1,180B (77% of FL GDP)",
    "sourceAttribution": "BEA GDP by Industry FL / Visit Florida / Enterprise Florida"
  },
  "Georgia": {
    "name": "Georgia",
    "code": "GA",
    "region": "Southeastern Commercial & Logistics Core",
    "humanCapitalIndex": 85,
    "urbanAgglomerationIndex": 88,
    "financialDepthIndex": 86,
    "digitalConnectivityIndex": 92,
    "consumerAmenityIndex": 85,
    "primaryClusters": [
      {
        "name": "Atlanta Midtown Tech & Fintech Transaction Alley",
        "type": "tech",
        "coords": [
          -84.38,
          33.78
        ],
        "desc": "70% of all US credit/debit transactions processed through Georgia Transaction Alley; Georgia Tech AI hub"
      },
      {
        "name": "Buckhead Corporate & Private Capital Core",
        "type": "finance",
        "coords": [
          -84.36,
          33.84
        ],
        "desc": "Fortune 500 headquarters (Home Depot, Coca-Cola, Delta, UPS), corporate law, and private equity"
      },
      {
        "name": "Georgia Film & Television Production Studios",
        "type": "creative",
        "coords": [
          -84.45,
          33.68
        ],
        "desc": "Trilith Studios, Tyler Perry Studios\u2014major global hub for Hollywood blockbuster cinematography"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Payment processing infrastructure, supply-chain routing software, and aerospace avionics",
      "banking": "Intercontinental Exchange (ICE - parent company of the New York Stock Exchange), Truist Financial HQ",
      "healthcare": "Emory Healthcare, CDC global epidemiology headquarters, and pediatric specialty medicine",
      "hospitality": "Hartsfield-Jackson Atlanta International Airport (busiest airport in the world), Georgia Aquarium, and convention hospitality"
    },
    "modeledServicesOutput": "$610B (76% of GA GDP)",
    "sourceAttribution": "BEA GDP by Industry GA / Georgia Department of Economic Development"
  },
  "Hawaii": {
    "name": "Hawaii",
    "code": "HI",
    "region": "Mid-Pacific Island Chain",
    "humanCapitalIndex": 72,
    "urbanAgglomerationIndex": 65,
    "financialDepthIndex": 55,
    "digitalConnectivityIndex": 70,
    "consumerAmenityIndex": 100,
    "primaryClusters": [
      {
        "name": "Waikiki & Maui Luxury Resort Corridor",
        "type": "hospitality",
        "coords": [
          -157.82,
          21.27
        ],
        "desc": "World-famous tropical beach hospitality, international transpacific tourism, and resort conventions"
      },
      {
        "name": "US Indo-Pacific Command Defense IT Core",
        "type": "research",
        "coords": [
          -157.9,
          21.36
        ],
        "desc": "Camp Smith and Pearl Harbor military command, Pacific defense cybersecurity, and satellite tracking"
      },
      {
        "name": "Mauna Kea Astronomy & Deep Space Observation",
        "type": "research",
        "coords": [
          -155.46,
          19.82
        ],
        "desc": "World's premier ground-based astronomical observatory complex (Keck, Subaru, Gemini Telescopes)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Indo-Pacific maritime defense systems, renewable ocean thermal research, and astronomical software",
      "banking": "First Hawaiian Bank and Bank of Hawaii financing Pacific regional commerce and real estate",
      "healthcare": "Queens Health Systems and specialized Pacific regional medical evacuation networks",
      "hospitality": "Premier global resort tourism ($18B+ annual spend), Polynesian cultural centers, and luxury eco-lodges"
    },
    "modeledServicesOutput": "$82B (82% of HI GDP)",
    "sourceAttribution": "BEA GDP by Industry HI / Hawaii Tourism Authority"
  },
  "Idaho": {
    "name": "Idaho",
    "code": "ID",
    "region": "Intermountain Northwest Shelf",
    "humanCapitalIndex": 74,
    "urbanAgglomerationIndex": 62,
    "financialDepthIndex": 60,
    "digitalConnectivityIndex": 76,
    "consumerAmenityIndex": 84,
    "primaryClusters": [
      {
        "name": "Boise Silicon Valley North Tech Hub",
        "type": "tech",
        "coords": [
          -116.2,
          43.61
        ],
        "desc": "Micron Technology global R&D headquarters, semiconductor memory engineering, and enterprise software"
      },
      {
        "name": "Idaho National Laboratory (INL) Nuclear Research",
        "type": "research",
        "coords": [
          -112.55,
          43.53
        ],
        "desc": "Nation's premier nuclear energy laboratory; pioneering small modular reactors (SMRs) and advanced fuels"
      },
      {
        "name": "Sun Valley Luxury Alpine & Ecotourism Resort",
        "type": "hospitality",
        "coords": [
          -114.35,
          43.69
        ],
        "desc": "Historic ski resort, Allen & Company Sun Valley tech/media conference, and wilderness recreation"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "DRAM and 3D NAND semiconductor design, nuclear reactor modeling, and agribusiness enterprise software",
      "banking": "Regional commercial banking, agricultural equipment credit, and tech venture investments",
      "healthcare": "St. Luke's Health System and rural specialty healthcare networks",
      "hospitality": "Ski resorts (Sun Valley, Schweitzer), mountain river whitewater rafting, and national forest tourism"
    },
    "modeledServicesOutput": "$78B (68% of ID GDP)",
    "sourceAttribution": "BEA GDP by Industry ID / Idaho Commerce / Micron Tech"
  },
  "Illinois": {
    "name": "Illinois",
    "code": "IL",
    "region": "Great Lakes Financial & Transport Hub",
    "humanCapitalIndex": 90,
    "urbanAgglomerationIndex": 94,
    "financialDepthIndex": 96,
    "digitalConnectivityIndex": 94,
    "consumerAmenityIndex": 88,
    "primaryClusters": [
      {
        "name": "Chicago Loop & West Loop Financial District",
        "type": "finance",
        "coords": [
          -87.63,
          41.88
        ],
        "desc": "CME Group (world's largest derivatives and commodities exchange), Chicago Board Options Exchange (CBOE)"
      },
      {
        "name": "Fulton Market & River North Tech Innovation Hub",
        "type": "tech",
        "coords": [
          -87.65,
          41.88
        ],
        "desc": "Google Midwest HQ, Salesforce Tower Chicago, high-frequency trading firms, and enterprise B2B SaaS"
      },
      {
        "name": "Urbana-Champaign & Evanston Supercomputing & AI",
        "type": "research",
        "coords": [
          -88.22,
          40.11
        ],
        "desc": "NCSA (National Center for Supercomputing Applications) and Northwestern University materials engineering"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "High-frequency algorithmic trading algorithms, quantum internet research, and cloud supply-chain platforms",
      "banking": "Derivatives clearing (CME Group), Northern Trust wealth asset management, and Fortune 100 corporate banking",
      "healthcare": "Northwestern Memorial Hospital, Rush University Medical Center, and major medical device clinical trials",
      "hospitality": "Magnificent Mile retail, world-class architecture tours, Michelin-starred culinary dining, and McCormick Place conventions"
    },
    "modeledServicesOutput": "$830B (79% of IL GDP)",
    "sourceAttribution": "BEA GDP by Industry IL / World Business Chicago / CME Group"
  },
  "Indiana": {
    "name": "Indiana",
    "code": "IN",
    "region": "Midwest Industrial & Life Sciences Shelf",
    "humanCapitalIndex": 75,
    "urbanAgglomerationIndex": 72,
    "financialDepthIndex": 70,
    "digitalConnectivityIndex": 80,
    "consumerAmenityIndex": 76,
    "primaryClusters": [
      {
        "name": "Indianapolis Bio-Pharma & Corporate Corridor",
        "type": "research",
        "coords": [
          -86.15,
          39.76
        ],
        "desc": "Eli Lilly and Company global headquarters, global oncology/diabetes R&D, and health insurance (Elevance Health)"
      },
      {
        "name": "Purdue Research Park & Aerospace Engineering",
        "type": "research",
        "coords": [
          -86.92,
          40.45
        ],
        "desc": "Hypersonics research, defense aeronautics, and agricultural robotics engineering"
      },
      {
        "name": "Indianapolis Motor Speedway & Sports Entertainment",
        "type": "hospitality",
        "coords": [
          -86.23,
          39.79
        ],
        "desc": "Indy 500 (largest single-day sporting event on Earth), NCAA national headquarters, and convention centers"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Pharmaceutical bioinformatics, advanced medical device firmware, and defense electronic warfare",
      "banking": "Regional banking networks, healthcare corporate finance, and commercial industrial credit",
      "healthcare": "IU Health Academic Health Center, clinical oncology trials, and pediatric surgery",
      "hospitality": "Motorsports tourism, youth athletic tournaments, and downtown Indianapolis convention hub"
    },
    "modeledServicesOutput": "$330B (69% of IN GDP)",
    "sourceAttribution": "BEA GDP by Industry IN / Indiana EDC / Eli Lilly"
  },
  "Iowa": {
    "name": "Iowa",
    "code": "IA",
    "region": "Corn Belt Financial & Insurance Core",
    "humanCapitalIndex": 75,
    "urbanAgglomerationIndex": 64,
    "financialDepthIndex": 82,
    "digitalConnectivityIndex": 85,
    "consumerAmenityIndex": 68,
    "primaryClusters": [
      {
        "name": "Des Moines Insurance & Financial Capital",
        "type": "finance",
        "coords": [
          -93.62,
          41.58
        ],
        "desc": "Hartford of the Corn Belt: Principal Financial Group HQ, over 80 major insurance companies and retirement asset funds"
      },
      {
        "name": "Iowa State & Ames Bio-Informatics Tech Corridor",
        "type": "research",
        "coords": [
          -93.64,
          42.02
        ],
        "desc": "World leader in agricultural genomics, bio-fuels engineering, and animal disease diagnostics"
      },
      {
        "name": "Council Bluffs Hyperscale Data Center Cluster",
        "type": "tech",
        "coords": [
          -95.85,
          41.26
        ],
        "desc": "Multi-gigawatt Google, Meta, and Microsoft cloud data center campuses powered by abundant wind energy"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Hyperscale cloud computing hosting, agricultural machine learning, and seed genetic database software",
      "banking": "Principal Financial ($650B+ AUM), life insurance underwriting, annuities, and agricultural commodity credit",
      "healthcare": "University of Iowa Hospitals & Clinics and specialized rural healthcare telemedicine",
      "hospitality": "Iowa State Fair, Field of Dreams international baseball tourism, and college sports entertainment"
    },
    "modeledServicesOutput": "$160B (68% of IA GDP)",
    "sourceAttribution": "BEA GDP by Industry IA / Greater Des Moines Partnership / FDIC"
  },
  "Kansas": {
    "name": "Kansas",
    "code": "KS",
    "region": "Great Plains & Breadbasket Shelf",
    "humanCapitalIndex": 76,
    "urbanAgglomerationIndex": 68,
    "financialDepthIndex": 66,
    "digitalConnectivityIndex": 80,
    "consumerAmenityIndex": 68,
    "primaryClusters": [
      {
        "name": "Overland Park & Kansas City Tech & Telecom Corridor",
        "type": "tech",
        "coords": [
          -94.67,
          38.98
        ],
        "desc": "Sprint historical campus, T-Mobile operational hub, engineering design firms (Black & Veatch), and enterprise software"
      },
      {
        "name": "Wichita Aviation Engineering & Specialized Testing",
        "type": "research",
        "coords": [
          -97.33,
          37.68
        ],
        "desc": "Air Capital of the World: NIAR (National Institute for Aviation Research), Textron Aviation, and Spirit AeroSystems engineering"
      },
      {
        "name": "Kansas City SubTropolis & Intermodal Logistics Services",
        "type": "tech",
        "coords": [
          -94.5,
          39.15
        ],
        "desc": "Underground commercial trade complex and transcontinental rail logistics coordination"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Aviation structural testing, telecommunications network management, and civil engineering consulting (Black & Veatch)",
      "banking": "Agricultural commodity financing, rural commercial banks, and Overland Park corporate credit offices",
      "healthcare": "University of Kansas Medical Center (NCI-designated Cancer Center) and regional clinical networks",
      "hospitality": "Kansas Speedway NASCAR racing, historic Dodge City frontier tourism, and Tallgrass Prairie National Preserve"
    },
    "modeledServicesOutput": "$144B (64% of KS GDP)",
    "sourceAttribution": "BEA GDP by Industry KS / Kansas Dept of Commerce / NIAR"
  },
  "Kentucky": {
    "name": "Kentucky",
    "code": "KY",
    "region": "Appalachia & Ohio River Valley",
    "humanCapitalIndex": 68,
    "urbanAgglomerationIndex": 65,
    "financialDepthIndex": 64,
    "digitalConnectivityIndex": 75,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "Louisville UPS Worldport Air Logistics Capital",
        "type": "tech",
        "coords": [
          -85.74,
          38.17
        ],
        "desc": "Largest fully automated package handling facility on Earth; handles 416,000 packages per hour with global sorting AI"
      },
      {
        "name": "Bluegrass Equine & Thoroughbred Financial Syndicate",
        "type": "finance",
        "coords": [
          -84.5,
          38.04
        ],
        "desc": "Lexington horse breeding capital of the world; multi-million dollar thoroughbred auctions and bloodstock syndicates"
      },
      {
        "name": "Kentucky Bourbon Trail Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -85.46,
          37.81
        ],
        "desc": "World-famous heritage tourism across 40+ historic distilleries, Churchill Downs Kentucky Derby, and Mammoth Cave"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Global express air logistics optimization, automated warehouse robotics, and automotive engineering",
      "banking": "Humana healthcare insurance operations ($100B revenue), regional commercial banking, and equine finance",
      "healthcare": "UofL Health, UK HealthCare, and specialized cardiovascular and stroke rehabilitation centers",
      "hospitality": "Kentucky Derby international luxury hospitality, Bourbon Trail distillery tourism, and cavern exploration"
    },
    "modeledServicesOutput": "$180B (69% of KY GDP)",
    "sourceAttribution": "BEA GDP by Industry KY / Kentucky Cabinet for Economic Development"
  },
  "Louisiana": {
    "name": "Louisiana",
    "code": "LA",
    "region": "Mississippi Delta & Gulf Crossroads",
    "humanCapitalIndex": 64,
    "urbanAgglomerationIndex": 68,
    "financialDepthIndex": 62,
    "digitalConnectivityIndex": 72,
    "consumerAmenityIndex": 92,
    "primaryClusters": [
      {
        "name": "New Orleans French Quarter & Cultural Tourism Empire",
        "type": "hospitality",
        "coords": [
          -90.06,
          29.96
        ],
        "desc": "Mardi Gras, New Orleans Jazz & Heritage Festival, world-renowned Creole culinary hospitality, and Ernest N. Morial Convention Center"
      },
      {
        "name": "Baton Rouge & River Parish Energy Engineering Corridor",
        "type": "tech",
        "coords": [
          -91.18,
          30.45
        ],
        "desc": "Petrochemical process engineering, coastal wetland environmental restoration, and offshore drilling tech"
      },
      {
        "name": "Lower Mississippi Maritime & Freight Brokerage Core",
        "type": "finance",
        "coords": [
          -90.07,
          29.95
        ],
        "desc": "Global maritime shipping insurance, customs brokerage, and Mississippi River barge bulk trading"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Coastal erosion computational modeling, maritime tracking telemetry, and petrochemical engineering software",
      "banking": "Commercial marine finance, port development bonds, and regional banking centers",
      "healthcare": "Ochsner Health System (nationally ranked cardiology and liver transplant programs)",
      "hospitality": "World-famous music, culinary, and carnival tourism ($10B+ annual tourism receipts), convention centers"
    },
    "modeledServicesOutput": "$205B (68% of LA GDP)",
    "sourceAttribution": "BEA GDP by Industry LA / New Orleans Tourism / Ochsner Health"
  },
  "Maine": {
    "name": "Maine",
    "code": "ME",
    "region": "Northern Atlantic Maritime & Pine Shelf",
    "humanCapitalIndex": 76,
    "urbanAgglomerationIndex": 55,
    "financialDepthIndex": 60,
    "digitalConnectivityIndex": 74,
    "consumerAmenityIndex": 90,
    "primaryClusters": [
      {
        "name": "Portland Old Port & Casco Bay Culinary Hub",
        "type": "hospitality",
        "coords": [
          -70.25,
          43.66
        ],
        "desc": "Nationally acclaimed culinary and craft brewing destination, boutique maritime tourism, and coastal conferences"
      },
      {
        "name": "Bar Harbor & Acadia National Park Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -68.2,
          44.38
        ],
        "desc": "4M+ annual visitors to Acadia National Park, cruise line visits, and coastal maritime recreation"
      },
      {
        "name": "Southern Maine Veterinary & Marine Biotech Cluster",
        "type": "research",
        "coords": [
          -70.36,
          43.63
        ],
        "desc": "IDEXX Laboratories global headquarters (veterinary diagnostics) and Bigelow Laboratory for Ocean Sciences"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Veterinary clinical software, oceanographic satellite mapping, and naval engineering (Bath Iron Works design)",
      "banking": "Regional savings institutions, maritime commercial credit, and forestry investment funds",
      "healthcare": "MaineHealth and specialized coastal trauma & telemedicine networks",
      "hospitality": "Summer coastal tourism, lobster culinary hospitality, fall foliage excursions, and national park lodges"
    },
    "modeledServicesOutput": "$68B (75% of ME GDP)",
    "sourceAttribution": "BEA GDP by Industry ME / Maine Office of Tourism / IDEXX"
  },
  "Maryland": {
    "name": "Maryland",
    "code": "MD",
    "region": "Chesapeake Cyber & Bio-Health Capital",
    "humanCapitalIndex": 96,
    "urbanAgglomerationIndex": 92,
    "financialDepthIndex": 88,
    "digitalConnectivityIndex": 96,
    "consumerAmenityIndex": 84,
    "primaryClusters": [
      {
        "name": "Fort Meade National Cyber Command & NSA Corridor",
        "type": "tech",
        "coords": [
          -76.74,
          39.11
        ],
        "desc": "Global epicenter of cyber warfare, cryptographic intelligence, and federal defense IT contracting"
      },
      {
        "name": "Bethesda & I-270 Technology Corridor (DNA Alley)",
        "type": "research",
        "coords": [
          -77.1,
          39.0
        ],
        "desc": "NIH (National Institutes of Health), FDA headquarters, and 300+ biotechnology & genomics firms"
      },
      {
        "name": "Johns Hopkins Medical & Academic Enterprise",
        "type": "research",
        "coords": [
          -76.59,
          39.29
        ],
        "desc": "Johns Hopkins Medicine & Applied Physics Lab (#1 university R&D recipient in America for 40+ consecutive years)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "National cybersecurity systems, defense AI, satellite communications (NASA Goddard), and cryptographic software",
      "banking": "T. Rowe Price global asset management ($1.5T+ AUM), defense contract financing, and municipal bonding",
      "healthcare": "Johns Hopkins Hospital, National Institutes of Health Clinical Center, and global vaccine development",
      "hospitality": "Ocean City resort tourism, Baltimore Inner Harbor, Chesapeake Bay sailing, and historic Annapolis"
    },
    "modeledServicesOutput": "$420B (82% of MD GDP)",
    "sourceAttribution": "BEA GDP by Industry MD / Maryland Dept of Commerce / Johns Hopkins"
  },
  "Massachusetts": {
    "name": "Massachusetts",
    "code": "MA",
    "region": "New England Knowledge & Biotech Capital",
    "humanCapitalIndex": 100,
    "urbanAgglomerationIndex": 94,
    "financialDepthIndex": 96,
    "digitalConnectivityIndex": 96,
    "consumerAmenityIndex": 90,
    "primaryClusters": [
      {
        "name": "Kendall Square & Cambridge Global Biotech Capital",
        "type": "research",
        "coords": [
          -71.08,
          42.36
        ],
        "desc": "The most innovative square mile on Earth; unmatched density of biotech giants, MIT & Harvard labs, and venture life sciences"
      },
      {
        "name": "Boston Financial District & Asset Management Core",
        "type": "finance",
        "coords": [
          -71.05,
          42.35
        ],
        "desc": "Fidelity Investments HQ ($4.5T+ AUM), State Street ($4T+ custodian assets), and premier venture capital firms"
      },
      {
        "name": "Route 128 Robotics & Artificial Intelligence Belt",
        "type": "tech",
        "coords": [
          -71.26,
          42.37
        ],
        "desc": "Boston Dynamics, defense microelectronics (Raytheon, Lincoln Lab), and autonomous robotic systems"
      },
      {
        "name": "Cape Cod, Martha's Vineyard & Nantucket Luxury Island Corridor",
        "type": "hospitality",
        "coords": [
          -70.3,
          41.7
        ],
        "desc": "Historic Atlantic maritime resorts, international summer luxury hospitality, and whale watching"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Biotech gene therapies, quantum networking, autonomous robotics, and enterprise software",
      "banking": "Fidelity, State Street, Wellington Management, and top-tier healthcare & tech venture funding",
      "healthcare": "Massachusetts General Hospital, Brigham and Women's, Boston Children's, and Dana-Farber Cancer Institute",
      "hospitality": "Historical colonial heritage tourism (Freedom Trail), Cape Cod maritime resorts, and elite university conferences"
    },
    "modeledServicesOutput": "$610B (84% of MA economy)",
    "sourceAttribution": "BEA GDP by Industry MA / MassBio / MIT & Harvard R&D"
  },
  "Michigan": {
    "name": "Michigan",
    "code": "MI",
    "region": "Great Lakes Automotive & Tech Basin",
    "humanCapitalIndex": 82,
    "urbanAgglomerationIndex": 84,
    "financialDepthIndex": 78,
    "digitalConnectivityIndex": 84,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "Detroit & Ann Arbor Mobility & Autonomous Vehicle Tech",
        "type": "tech",
        "coords": [
          -83.74,
          42.28
        ],
        "desc": "Automotive software engineering, University of Michigan Mcity autonomous testing, and GM/Ford technical centers"
      },
      {
        "name": "Downtown Detroit Fintech & Real Estate Core",
        "type": "finance",
        "coords": [
          -83.04,
          42.33
        ],
        "desc": "Rocket Companies (Rocket Mortgage HQ), Ally Financial headquarters, and urban commercial revitalization"
      },
      {
        "name": "Grand Rapids Healthcare & Furniture Design Cluster",
        "type": "research",
        "coords": [
          -85.67,
          42.96
        ],
        "desc": "Medical Mile biomedical corridor (Van Andel Institute) and global office architecture design (Steelcase, Herman Miller)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Autonomous vehicle perception algorithms, battery management software, and robotics manufacturing engineering",
      "banking": "Mortgage origination fintech, automotive commercial floorplan credit, and venture seed funds",
      "healthcare": "University of Michigan Health, Corewell Health, and specialized pediatric and orthopedics centers",
      "hospitality": "Mackinac Island historic Victorian resort, Great Lakes freshwater beach tourism, and Traverse City wine tours"
    },
    "modeledServicesOutput": "$465B (72% of MI GDP)",
    "sourceAttribution": "BEA GDP by Industry MI / Business Leaders for Michigan / UMich R&D"
  },
  "Minnesota": {
    "name": "Minnesota",
    "code": "MN",
    "region": "Upper Midwest Healthcare & Corporate Hub",
    "humanCapitalIndex": 90,
    "urbanAgglomerationIndex": 86,
    "financialDepthIndex": 88,
    "digitalConnectivityIndex": 88,
    "consumerAmenityIndex": 80,
    "primaryClusters": [
      {
        "name": "Rochester Mayo Clinic Global Medical Mecca",
        "type": "research",
        "coords": [
          -92.46,
          44.02
        ],
        "desc": "#1 ranked hospital in the world; Destination Medical Center drawing international royalty, heads of state, and clinical trials"
      },
      {
        "name": "Minneapolis-St. Paul Medical Alley & Health Tech Corridor",
        "type": "tech",
        "coords": [
          -93.26,
          44.97
        ],
        "desc": "World leader in cardiovascular and neuro-modulation medical devices (Medtronic, Boston Scientific, 3M Healthcare)"
      },
      {
        "name": "Twin Cities Fortune 500 Financial & Retail Core",
        "type": "finance",
        "coords": [
          -93.27,
          44.98
        ],
        "desc": "Target Corp, UnitedHealth Group ($370B revenue\u2014largest healthcare company in the world), US Bancorp, and Ameriprise"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Cardiovascular medical device firmware, healthcare insurance big-data analytics, and food-science computing",
      "banking": "US Bancorp (#5 US commercial bank), Ameriprise Financial asset management, and healthcare venture capital",
      "healthcare": "Mayo Clinic global campus, University of Minnesota M Health Fairview, and Medical Alley innovations",
      "hospitality": "Mall of America (most visited mall in the Western Hemisphere), Boundary Waters wilderness ecotourism, and lake resorts"
    },
    "modeledServicesOutput": "$370B (79% of MN GDP)",
    "sourceAttribution": "BEA GDP by Industry MN / Mayo Clinic / Medical Alley Association"
  },
  "Mississippi": {
    "name": "Mississippi",
    "code": "MS",
    "region": "Lower Mississippi River Valley",
    "humanCapitalIndex": 58,
    "urbanAgglomerationIndex": 50,
    "financialDepthIndex": 52,
    "digitalConnectivityIndex": 62,
    "consumerAmenityIndex": 72,
    "primaryClusters": [
      {
        "name": "Gulf Coast Casino & Marine Resort Corridor",
        "type": "hospitality",
        "coords": [
          -88.89,
          30.39
        ],
        "desc": "Biloxi and Gulfport gaming resorts, convention centers, and Gulf deep-sea charter fishing tourism"
      },
      {
        "name": "Jackson Medical & State Administration Corridor",
        "type": "research",
        "coords": [
          -90.18,
          32.29
        ],
        "desc": "University of Mississippi Medical Center (UMMC), historical telehealth pioneer, and state government operations"
      },
      {
        "name": "Stennis Space Center Federal Testing Enterprise",
        "type": "tech",
        "coords": [
          -89.6,
          30.36
        ],
        "desc": "NASA rocket propulsion testing, Naval Meteorology and Oceanography Command, and NOAA data centers"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Rocket engine test simulation, oceanographic satellite data processing, and defense shipbuilding CAD design",
      "banking": "Hancock Whitney Bank and regional commercial institutions financing timber, poultry, and Gulf commerce",
      "healthcare": "UMMC specialized trauma and rural health clinic telehealth distribution",
      "hospitality": "Biloxi casino resorts ($2.5B+ annual gaming revenue), Mississippi Blues Trail cultural tourism, and Natchez historic homes"
    },
    "modeledServicesOutput": "$98B (68% of MS GDP)",
    "sourceAttribution": "BEA GDP by Industry MS / Mississippi Development Authority"
  },
  "Missouri": {
    "name": "Missouri",
    "code": "MO",
    "region": "Midwest River Confluence Core",
    "humanCapitalIndex": 80,
    "urbanAgglomerationIndex": 82,
    "financialDepthIndex": 80,
    "digitalConnectivityIndex": 82,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "St. Louis Danforth Plant Science & Geospatial Intelligence",
        "type": "research",
        "coords": [
          -90.19,
          38.62
        ],
        "desc": "NGA (National Geospatial-Intelligence Agency) Western HQ, world's largest independent plant science research institute"
      },
      {
        "name": "Kansas City Engineering & Federal Logistics Corridor",
        "type": "tech",
        "coords": [
          -94.57,
          39.09
        ],
        "desc": "Burns & McDonnell, Black & Veatch, Cerner (Oracle Health), and major national rail transport logistics coordination"
      },
      {
        "name": "Branson Live Entertainment & Ozark Lakes Resort",
        "type": "hospitality",
        "coords": [
          -93.21,
          36.64
        ],
        "desc": "50+ live performance music theaters, Silver Dollar City theme park, and Table Rock Lake resort hospitality"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Geospatial mapping software, precision agriculture genetics computing, and electronic medical records systems",
      "banking": "Stifel Financial investment banking, Federal Reserve Bank of St. Louis, and Edward Jones wealth networks",
      "healthcare": "Barnes-Jewish Hospital & Washington University School of Medicine (top tier academic medical center)",
      "hospitality": "Gateway Arch National Park, Branson live music family tourism, Lake of the Ozarks boating, and Busch Stadium sports"
    },
    "modeledServicesOutput": "$310B (74% of MO GDP)",
    "sourceAttribution": "BEA GDP by Industry MO / Missouri Partnership / WashU R&D"
  },
  "Montana": {
    "name": "Montana",
    "code": "MT",
    "region": "Northern Rockies & Big Sky Basin",
    "humanCapitalIndex": 74,
    "urbanAgglomerationIndex": 48,
    "financialDepthIndex": 55,
    "digitalConnectivityIndex": 68,
    "consumerAmenityIndex": 96,
    "primaryClusters": [
      {
        "name": "Bozeman & Gallatin Valley Optics & SaaS Tech Hub",
        "type": "tech",
        "coords": [
          -111.04,
          45.67
        ],
        "desc": "Bozeman Photonics & Laser Cluster, Snowflake cloud executive operations, and outdoor industry headquarters"
      },
      {
        "name": "Yellowstone & Glacier National Park Ecotourism Corridor",
        "type": "hospitality",
        "coords": [
          -110.58,
          44.97
        ],
        "desc": "Premier American wilderness tourism destinations; millions of international visitors for grizzly and geyser ecotourism"
      },
      {
        "name": "Missoula Biomedical & Forestry Ecology Research",
        "type": "research",
        "coords": [
          -113.99,
          46.87
        ],
        "desc": "University of Montana wilderness genomics, forest fire computational modeling, and biotech startups"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Precision industrial laser optics, cloud database architecture, and wildland firefighting tracking software",
      "banking": "First Interstate Bank ($30B+ assets) and high-net-worth family office wealth management in Big Sky",
      "healthcare": "Billings Clinic and Providence St. Patrick Hospital providing regional trauma & cardiac care",
      "hospitality": "Big Sky luxury ski resorts (largest skiable terrain in North America), national parks ($3B+ economic impact), and fly-fishing lodges"
    },
    "modeledServicesOutput": "$50B (71% of MT GDP)",
    "sourceAttribution": "BEA GDP by Industry MT / Montana Dept of Commerce / Bozeman Tech"
  },
  "Nebraska": {
    "name": "Nebraska",
    "code": "NE",
    "region": "Great Plains & Ogallala Breadbasket",
    "humanCapitalIndex": 78,
    "urbanAgglomerationIndex": 70,
    "financialDepthIndex": 88,
    "digitalConnectivityIndex": 82,
    "consumerAmenityIndex": 70,
    "primaryClusters": [
      {
        "name": "Omaha Berkshire Hathaway Financial Capital",
        "type": "finance",
        "coords": [
          -95.93,
          41.25
        ],
        "desc": "Warren Buffett's global conglomerate headquarters ($1T+ market cap), Mutual of Omaha, and massive insurance reinsurance reserves"
      },
      {
        "name": "Union Pacific Transcontinental Logistics Command",
        "type": "tech",
        "coords": [
          -95.94,
          41.26
        ],
        "desc": "Harriman Dispatching Center\u2014central nervous system coordinating freight rail movement across 23 western states"
      },
      {
        "name": "Lincoln University Research & Ag-Fintech Hub",
        "type": "research",
        "coords": [
          -96.7,
          40.81
        ],
        "desc": "University of Nebraska Innovation Campus, precision agricultural sensor software, and crop insurance actuarial models"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Automated rail dispatch telemetry, ag-fintech risk analysis, and telecommunications operations",
      "banking": "Berkshire Hathaway investment empire, TD Ameritrade operations, Mutual of Omaha, and farm credit banks",
      "healthcare": "Nebraska Medicine & UNMC (global leader in biocontainment and infectious disease management)",
      "hospitality": "NCAA Men's College World Series (Omaha), Henry Doorly Zoo & Aquarium (nationally top ranked), and Sandhills ecotourism"
    },
    "modeledServicesOutput": "$135B (73% of NE GDP)",
    "sourceAttribution": "BEA GDP by Industry NE / Berkshire Hathaway / UNMC"
  },
  "Nevada": {
    "name": "Nevada",
    "code": "NV",
    "region": "Mojave Basin & High Desert Shelf",
    "humanCapitalIndex": 68,
    "urbanAgglomerationIndex": 88,
    "financialDepthIndex": 75,
    "digitalConnectivityIndex": 88,
    "consumerAmenityIndex": 100,
    "primaryClusters": [
      {
        "name": "Las Vegas Strip Global Entertainment & Gaming Empire",
        "type": "hospitality",
        "coords": [
          -115.17,
          36.11
        ],
        "desc": "Entertainment Capital of the World: 150,000+ luxury hotel rooms, world-class conventions (CES), and international megaresorts"
      },
      {
        "name": "Reno-Tahoe Cloud & Clean Energy Logistics Hub",
        "type": "tech",
        "coords": [
          -119.81,
          39.52
        ],
        "desc": "Switch SUPERNAP cloud data center mega-campus, Tesla Gigafactory engineering, and no-corporate-income-tax enterprise operations"
      },
      {
        "name": "Lake Tahoe Alpine Resort & Summer Luxury Corridor",
        "type": "hospitality",
        "coords": [
          -119.97,
          39.09
        ],
        "desc": "Crystal clear alpine lake recreation, luxury mountain retreats, and ski resorts (Heavenly, Palisades)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Hyperscale Tier 5 mission-critical data centers (Switch), casino slot and gaming algorithm software",
      "banking": "Asset protection trusts (Nevada has nation's premier dynasty trust laws), gaming finance, and private family offices",
      "healthcare": "UMC Trauma Center and expanding healthcare medical campuses in southern Nevada",
      "hospitality": "Global gaming, hospitality, nightlife, dining, and convention infrastructure ($20B+ direct tourism impact)"
    },
    "modeledServicesOutput": "$185B (80% of NV GDP)",
    "sourceAttribution": "BEA GDP by Industry NV / LVCVA / Nevada Governor's Office of ED"
  },
  "New Hampshire": {
    "name": "New Hampshire",
    "code": "NH",
    "region": "Northern New England Granite Shelf",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 72,
    "financialDepthIndex": 78,
    "digitalConnectivityIndex": 84,
    "consumerAmenityIndex": 86,
    "primaryClusters": [
      {
        "name": "Manchester & Nashua Defense Tech & Mill Corridor",
        "type": "tech",
        "coords": [
          -71.46,
          42.99
        ],
        "desc": "BAE Systems electronic systems, DEKA Research (Dean Kamen), and enterprise software startups in repurposed historic mill buildings"
      },
      {
        "name": "Dartmouth College & Hanover Biotech & High-Ed Hub",
        "type": "research",
        "coords": [
          -72.28,
          43.7
        ],
        "desc": "Ivy League biomedical research, Dartmouth-Hitchcock Medical Center, and high-tech engineering spinouts"
      },
      {
        "name": "White Mountains & Lakes Region Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -71.58,
          44.15
        ],
        "desc": "Mount Washington, scenic fall foliage, alpine skiing (Bretton Woods, Loon), and Lake Winnipesaukee summer retreats"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Defense electronic warfare, medical regenerative organ engineering, and precision robotics firmware",
      "banking": "Fidelity Investments operational campuses, private trust administration, and low-tax business lending",
      "healthcare": "Dartmouth Health academic medical center and specialized rural health systems",
      "hospitality": "Tax-free shopping retail tourism, White Mountains winter sports, and autumn leaf-peeping hospitality"
    },
    "modeledServicesOutput": "$88B (78% of NH GDP)",
    "sourceAttribution": "BEA GDP by Industry NH / NH Dept of Business and Economic Affairs"
  },
  "New Jersey": {
    "name": "New Jersey",
    "code": "NJ",
    "region": "Mid-Atlantic Biotech & Transport Core",
    "humanCapitalIndex": 94,
    "urbanAgglomerationIndex": 98,
    "financialDepthIndex": 92,
    "digitalConnectivityIndex": 96,
    "consumerAmenityIndex": 85,
    "primaryClusters": [
      {
        "name": "Princeton & Route 1 Pharma Research Belt",
        "type": "research",
        "coords": [
          -74.65,
          40.35
        ],
        "desc": "Medicine Chest of the World: Johnson & Johnson, Bristol Myers Squibb, Merck, and Princeton University labs"
      },
      {
        "name": "Jersey City & Hoboken Wall Street West",
        "type": "finance",
        "coords": [
          -74.03,
          40.71
        ],
        "desc": "Goldman Sachs Tower, Depository Trust & Clearing Corporation (DTCC), exchange trading floors, and fintech back offices"
      },
      {
        "name": "Jersey Shore Atlantic Coastal Resort Corridor",
        "type": "hospitality",
        "coords": [
          -74.42,
          39.36
        ],
        "desc": "Atlantic City boardwalk casino resorts, historic Cape May Victorian inns, and 130 miles of Atlantic beach hospitality"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Pharmaceutical bioinformatics, high-speed telecom routing (fiber optic hubs along the Northeast Corridor), and enterprise IT",
      "banking": "Clearing and settlement of US equities (DTCC), global broker-dealer operational headquarters, and corporate insurance",
      "healthcare": "Hackensack Meridian Health, RWJBarnabas Health, and world-leading oncology clinical trials",
      "hospitality": "Atlantic City gaming resorts, Meadowlands sports & entertainment complex, and coastal beach tourism"
    },
    "modeledServicesOutput": "$615B (80% of NJ GDP)",
    "sourceAttribution": "BEA GDP by Industry NJ / BioNJ / Choose New Jersey"
  },
  "New Mexico": {
    "name": "New Mexico",
    "code": "NM",
    "region": "Southwest Nuclear & Space Corridor",
    "humanCapitalIndex": 76,
    "urbanAgglomerationIndex": 60,
    "financialDepthIndex": 54,
    "digitalConnectivityIndex": 72,
    "consumerAmenityIndex": 88,
    "primaryClusters": [
      {
        "name": "Los Alamos & Sandia National Laboratories",
        "type": "research",
        "coords": [
          -106.3,
          35.88
        ],
        "desc": "World's premier nuclear weapons science, high-performance supercomputing, and national security research enterprise"
      },
      {
        "name": "Albuquerque Aerospace & Commercial Spaceport Corridor",
        "type": "tech",
        "coords": [
          -106.65,
          35.08
        ],
        "desc": "Kirtland AFB Directed Energy Directorate, Spaceport America (Virgin Galactic commercial launch), and optics tech"
      },
      {
        "name": "Santa Fe Cultural Arts & Heritage Capital",
        "type": "creative",
        "coords": [
          -105.93,
          35.68
        ],
        "desc": "Nation's 3rd largest art market; world-renowned Native American and Southwestern art galleries, Georgia O'Keeffe museum"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "National defense supercomputing, directed energy weapons software, quantum modeling, and commercial spaceflight",
      "banking": "Regional commercial banking, sovereign energy trust funds, and research commercialization seed grants",
      "healthcare": "University of New Mexico Hospital and specialized high-altitude and nuclear medicine facilities",
      "hospitality": "Santa Fe historic cultural tourism, Taos ski valley, Albuquerque International Balloon Fiesta, and Carlsbad Caverns"
    },
    "modeledServicesOutput": "$95B (70% of NM GDP)",
    "sourceAttribution": "BEA GDP by Industry NM / Los Alamos National Lab / Sandia"
  },
  "New York": {
    "name": "New York",
    "code": "NY",
    "region": "Atlantic Financial & Cultural Metropolis",
    "humanCapitalIndex": 96,
    "urbanAgglomerationIndex": 100,
    "financialDepthIndex": 100,
    "digitalConnectivityIndex": 98,
    "consumerAmenityIndex": 98,
    "primaryClusters": [
      {
        "name": "Wall Street & Midtown Manhattan Global Financial Capital",
        "type": "finance",
        "coords": [
          -74.0,
          40.71
        ],
        "desc": "Financial Capital of the World: NYSE, Nasdaq, JPMorgan Chase, Morgan Stanley, Goldman Sachs, BlackRock ($10T+ AUM)"
      },
      {
        "name": "Silicon Alley Tech & Digital Advertising Hub",
        "type": "tech",
        "coords": [
          -73.99,
          40.74
        ],
        "desc": "Google NYC, Meta Hudson Yards, major enterprise SaaS, cybersecurity, and global programmatic ad-tech networks"
      },
      {
        "name": "Madison Avenue Advertising & Global Media Empire",
        "type": "creative",
        "coords": [
          -73.97,
          40.75
        ],
        "desc": "Global advertising conglomerates (Omnicom), international news networks, publishing houses, and Broadway theatre"
      },
      {
        "name": "Long Island & Manhattan Life Sciences & Research",
        "type": "research",
        "coords": [
          -73.46,
          40.86
        ],
        "desc": "Cold Spring Harbor Laboratory, Memorial Sloan Kettering Cancer Center, Rockefeller University, and Columbia Medical"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Global financial exchange matching engines, programmatic media advertising tech, and enterprise AI tools",
      "banking": "Unmatched global investment banking, corporate debt syndication, global currency clearing, and private equity",
      "healthcare": "Memorial Sloan Kettering, NewYork-Presbyterian, Mount Sinai, and NYU Langone Health",
      "hospitality": "Broadway theatre ($1.5B annual box office), Times Square, 65M+ annual tourist visits, and luxury culinary dining"
    },
    "modeledServicesOutput": "$1,780B (82% of NY GDP)",
    "sourceAttribution": "BEA GDP by Industry NY / Partnership for New York City / SIFMA"
  },
  "North Carolina": {
    "name": "North Carolina",
    "code": "NC",
    "region": "Mid-Atlantic Banking & Research Triangle",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 84,
    "financialDepthIndex": 96,
    "digitalConnectivityIndex": 90,
    "consumerAmenityIndex": 86,
    "primaryClusters": [
      {
        "name": "Charlotte Uptown Financial Center",
        "type": "finance",
        "coords": [
          -80.84,
          35.22
        ],
        "desc": "#2 banking capital in America: Bank of America global headquarters, major East Coast hub for Wells Fargo and Truist"
      },
      {
        "name": "Research Triangle Park (RTP) Innovation Hub",
        "type": "research",
        "coords": [
          -78.86,
          35.91
        ],
        "desc": "Largest dedicated research park in the US: Duke University, UNC Chapel Hill, NC State, and 300+ bio/tech multinationals"
      },
      {
        "name": "Asheville & Blue Ridge Mountain Hospitality Corridor",
        "type": "hospitality",
        "coords": [
          -82.55,
          35.59
        ],
        "desc": "Biltmore Estate (America's largest home), Blue Ridge Parkway tourism, and vibrant arts/craft culinary community"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Epic Games (Unreal Engine HQ), clinical trial data computing, and enterprise cloud software",
      "banking": "Bank of America ($3T+ assets), wholesale syndicated lending, consumer card networks, and investment banking",
      "healthcare": "Duke University Health System, UNC Health, and contract research organizations (IQVIA, PPD)",
      "hospitality": "Outer Banks barrier island vacation tourism, Blue Ridge mountain ecotourism, and Pinehurst golf championships"
    },
    "modeledServicesOutput": "$510B (72% of NC GDP)",
    "sourceAttribution": "BEA GDP by Industry NC / Charlotte Regional Business Alliance / RTP"
  },
  "North Dakota": {
    "name": "North Dakota",
    "code": "ND",
    "region": "Northern Plains Energy Basin",
    "humanCapitalIndex": 68,
    "urbanAgglomerationIndex": 45,
    "financialDepthIndex": 55,
    "digitalConnectivityIndex": 72,
    "consumerAmenityIndex": 62,
    "primaryClusters": [
      {
        "name": "Fargo Technology & Financial Services Corridor",
        "type": "tech",
        "coords": [
          -96.78,
          46.87
        ],
        "desc": "Microsoft Fargo Campus (major corporate software development hub), agricultural fintech, and regional back-office banking"
      },
      {
        "name": "Grand Forks Drone & Autonomous Aviation Hub",
        "type": "tech",
        "coords": [
          -97.03,
          47.92
        ],
        "desc": "Grand Sky commercial drone park, University of North Dakota Aerospace (nation's premier aviation flight academy)"
      },
      {
        "name": "Bank of North Dakota State Banking System",
        "type": "finance",
        "coords": [
          -100.78,
          46.8
        ],
        "desc": "The only state-owned public bank in the United States; holds all state deposits and partners with local lenders"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Unmanned aerial systems (UAS) flight telemetry, enterprise ERP software (Microsoft Dynamics), and agricultural algorithms",
      "banking": "Bank of North Dakota (unique public sovereign banking model), farm equipment financing, and oil royalty management",
      "healthcare": "Sanford Health and Essentia Health regional clinical systems",
      "hospitality": "Theodore Roosevelt National Park, Badlands wilderness tourism, and outdoor hunting/fishing recreation"
    },
    "modeledServicesOutput": "$48B (64% of ND GDP)",
    "sourceAttribution": "BEA GDP by Industry ND / Bank of North Dakota / UND Aerospace"
  },
  "Ohio": {
    "name": "Ohio",
    "code": "OH",
    "region": "Midwest Industrial & Financial Heartland",
    "humanCapitalIndex": 82,
    "urbanAgglomerationIndex": 86,
    "financialDepthIndex": 84,
    "digitalConnectivityIndex": 88,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "Cleveland Clinic Global Healthcare & Biotech Enterprise",
        "type": "research",
        "coords": [
          -81.62,
          41.5
        ],
        "desc": "World leader in cardiovascular surgery, organ transplantation, and biomedical research innovation"
      },
      {
        "name": "Columbus Financial, Insurance & Retail Tech Core",
        "type": "finance",
        "coords": [
          -83.0,
          39.96
        ],
        "desc": "Nationwide Insurance HQ, Huntington Bancshares, Ohio State University R&D, and major Intel Silicon Heartland software"
      },
      {
        "name": "Cincinnati Consumer Brands & Creative Marketing Hub",
        "type": "creative",
        "coords": [
          -84.51,
          39.1
        ],
        "desc": "Procter & Gamble global headquarters, market research analytics (Kroger 84.51), and corporate design"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Wright-Patterson Air Force Base defense aerospace computing, medical imaging algorithms, and retail supply-chain IT",
      "banking": "Nationwide Insurance, Huntington Bank ($180B+ assets), KeyCorp, and Fifth Third Bancorp",
      "healthcare": "Cleveland Clinic (#2 global hospital), University Hospitals, and Nationwide Children's Hospital",
      "hospitality": "Rock & Roll Hall of Fame (Cleveland), Cedar Point amusement park, and Pro Football Hall of Fame (Canton)"
    },
    "modeledServicesOutput": "$620B (74% of OH GDP)",
    "sourceAttribution": "BEA GDP by Industry OH / Cleveland Clinic / JobsOhio"
  },
  "Oklahoma": {
    "name": "Oklahoma",
    "code": "OK",
    "region": "Southern Plains & Energy Corridor",
    "humanCapitalIndex": 66,
    "urbanAgglomerationIndex": 68,
    "financialDepthIndex": 65,
    "digitalConnectivityIndex": 75,
    "consumerAmenityIndex": 72,
    "primaryClusters": [
      {
        "name": "Oklahoma City Aviation & Defense Maintenance Hub",
        "type": "tech",
        "coords": [
          -97.51,
          35.46
        ],
        "desc": "Tinker Air Force Base (largest air logistics complex in DOD), FAA Mike Monroney Aeronautical Center"
      },
      {
        "name": "Tulsa Cyber & Energy Finance District",
        "type": "finance",
        "coords": [
          -95.99,
          36.15
        ],
        "desc": "BOK Financial headquarters, petroleum accounting software, and George Kaiser Family Foundation philanthropic investments"
      },
      {
        "name": "Norman Weather & Atmospheric Radar Capital",
        "type": "research",
        "coords": [
          -97.43,
          35.18
        ],
        "desc": "National Weather Center (NOAA Storm Prediction Center, National Severe Storms Laboratory, and OU Meteorology)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Military aircraft avionics retrofitting, Doppler radar software algorithms, and oil/gas reservoir simulation",
      "banking": "BOK Financial ($50B+ assets), energy asset mezzanine financing, and tribal gaming compact revenues",
      "healthcare": "OU Health academic medical center and specialized pediatric cardiology",
      "hospitality": "First Americans Museum, National Cowboy & Western Heritage Museum, and Route 66 heritage tourism"
    },
    "modeledServicesOutput": "$160B (67% of OK GDP)",
    "sourceAttribution": "BEA GDP by Industry OK / Oklahoma Dept of Commerce / NOAA"
  },
  "Oregon": {
    "name": "Oregon",
    "code": "OR",
    "region": "Pacific Northwest Silicon Forest",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 82,
    "financialDepthIndex": 78,
    "digitalConnectivityIndex": 92,
    "consumerAmenityIndex": 92,
    "primaryClusters": [
      {
        "name": "Silicon Forest Semiconductor & Open Source Hub",
        "type": "tech",
        "coords": [
          -122.99,
          45.52
        ],
        "desc": "Hillsboro Intel mega-campus (world's primary advanced silicon R&D foundry), open-source software, and electronic design automation"
      },
      {
        "name": "Beaverton & Portland Athletic Apparel & Design Capital",
        "type": "creative",
        "coords": [
          -122.82,
          45.49
        ],
        "desc": "Nike World Headquarters, Columbia Sportswear, and global footwear industrial design studios"
      },
      {
        "name": "Oregon Coast & Columbia River Gorge Scenic Recreation",
        "type": "hospitality",
        "coords": [
          -123.93,
          45.89
        ],
        "desc": "Cannon Beach, Crater Lake National Park, Willamette Valley pinot noir wine tourism, and windsurfing hospitality"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Sub-2nm semiconductor micro-architecture, Linux kernel engineering, and high-efficiency data center designs",
      "banking": "Regional commercial banks, clean technology venture funds, and timber real estate investment trusts",
      "healthcare": "OHSU (Oregon Health & Science University) Knight Cancer Institute and gene editing therapy pioneer",
      "hospitality": "Willamette Valley wine tourism, Pacific coastal recreation, Mount Hood skiing, and craft culinary culture"
    },
    "modeledServicesOutput": "$235B (76% of OR GDP)",
    "sourceAttribution": "BEA GDP by Industry OR / Technology Association of Oregon / OHSU"
  },
  "Pennsylvania": {
    "name": "Pennsylvania",
    "code": "PA",
    "region": "Keystone Industrial & Life Sciences Shelf",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 90,
    "financialDepthIndex": 88,
    "digitalConnectivityIndex": 88,
    "consumerAmenityIndex": 85,
    "primaryClusters": [
      {
        "name": "Philadelphia University City & Cell Therapy Hub",
        "type": "research",
        "coords": [
          -75.19,
          39.95
        ],
        "desc": "Birthplace of cell & gene therapy (CAR-T): University of Pennsylvania, Children's Hospital of Philadelphia, Spark Therapeutics"
      },
      {
        "name": "Center City Financial & Investment Management Core",
        "type": "finance",
        "coords": [
          -75.16,
          39.95
        ],
        "desc": "Vanguard Group headquarters (world's largest mutual fund provider with $8T+ AUM) and corporate legal practices"
      },
      {
        "name": "Pittsburgh Autonomous Robotics & AI Corridor",
        "type": "tech",
        "coords": [
          -79.95,
          40.44
        ],
        "desc": "Carnegie Mellon University Robotics Institute, autonomous driving testing, and medical robotics startups"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Robotics automation software, natural language processing, and defense electronic manufacturing IT",
      "banking": "Vanguard Group index fund powerhouse, PNC Financial Services HQ ($550B+ assets), and health plan administration",
      "healthcare": "UPMC (University of Pittsburgh Medical Center\u2014$28B enterprise) and Penn Medicine",
      "hospitality": "Independence Hall historic tourism, Gettysburg National Military Park, Pocono Mountains resorts, and Hershey entertainment"
    },
    "modeledServicesOutput": "$730B (77% of PA GDP)",
    "sourceAttribution": "BEA GDP by Industry PA / Vanguard / CMU Robotics Institute"
  },
  "Rhode Island": {
    "name": "Rhode Island",
    "code": "RI",
    "region": "Narragansett Ocean State Shelf",
    "humanCapitalIndex": 86,
    "urbanAgglomerationIndex": 85,
    "financialDepthIndex": 80,
    "digitalConnectivityIndex": 84,
    "consumerAmenityIndex": 90,
    "primaryClusters": [
      {
        "name": "Providence Higher Ed & Design Innovation Core",
        "type": "creative",
        "coords": [
          -71.41,
          41.82
        ],
        "desc": "Brown University biomedical labs, RISD (Rhode Island School of Design\u2014world premier industrial and graphic design academy)"
      },
      {
        "name": "Newport Yachting & Gilded Age Tourism Empire",
        "type": "hospitality",
        "coords": [
          -71.31,
          41.48
        ],
        "desc": "America's sailing capital, Newport Folk/Jazz Festivals, and Gilded Age oceanfront mansions (The Breakers, Marble House)"
      },
      {
        "name": "Quonset Naval Submarine Engineering & Undersea Tech",
        "type": "tech",
        "coords": [
          -71.42,
          41.59
        ],
        "desc": "General Dynamics Electric Boat engineering design and Naval Undersea Warfare Center (NUWC) acoustics"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Naval undersea acoustic software, autonomous sub-surface drone navigation, and consumer toy/game engineering (Hasbro)",
      "banking": "Citizens Financial Group global headquarters ($220B+ assets) and coastal maritime insurance",
      "healthcare": "Lifespan Health System and Brown University Warren Alpert Medical School",
      "hospitality": "Newport mansion heritage tours, international sailing regattas, and Block Island summer tourism"
    },
    "modeledServicesOutput": "$62B (82% of RI GDP)",
    "sourceAttribution": "BEA GDP by Industry RI / Rhode Island Commerce / Citizens Bank"
  },
  "South Carolina": {
    "name": "South Carolina",
    "code": "SC",
    "region": "Atlantic Coastal & Piedmont Corridor",
    "humanCapitalIndex": 72,
    "urbanAgglomerationIndex": 70,
    "financialDepthIndex": 68,
    "digitalConnectivityIndex": 78,
    "consumerAmenityIndex": 92,
    "primaryClusters": [
      {
        "name": "Charleston Historic Maritime & Digital Tech Hub",
        "type": "hospitality",
        "coords": [
          -79.93,
          32.78
        ],
        "desc": "Voted #1 US city by Travel+Leisure for 10+ years; historic preservation tourism and growing Silicon Harbor tech startups"
      },
      {
        "name": "Greenville Automotive Engineering & Clemson R&D",
        "type": "tech",
        "coords": [
          -82.4,
          34.85
        ],
        "desc": "Clemson University International Center for Automotive Research (CU-ICAR) and BMW North American technical operations"
      },
      {
        "name": "Myrtle Beach Grand Strand Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -78.88,
          33.69
        ],
        "desc": "60 miles of uninterrupted Atlantic beaches, 90+ championship golf courses, and 20M+ annual tourists"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Aerospace structural design (Boeing South Carolina engineering), cloud software (Blackbaud), and defense cybersecurity",
      "banking": "Regional mortgage servicing, wealth management for retirees, and port development bonds",
      "healthcare": "Medical University of South Carolina (MUSC) and Prisma Health",
      "hospitality": "Charleston historic culinary hospitality, Myrtle Beach family vacations, and Hilton Head Island golf resorts"
    },
    "modeledServicesOutput": "$235B (73% of SC GDP)",
    "sourceAttribution": "BEA GDP by Industry SC / South Carolina Dept of Commerce / MUSC"
  },
  "South Dakota": {
    "name": "South Dakota",
    "code": "SD",
    "region": "Northern Plains Financial Haven",
    "humanCapitalIndex": 72,
    "urbanAgglomerationIndex": 55,
    "financialDepthIndex": 98,
    "digitalConnectivityIndex": 78,
    "consumerAmenityIndex": 84,
    "primaryClusters": [
      {
        "name": "Sioux Falls Credit Card & Trust Banking Capital",
        "type": "finance",
        "coords": [
          -96.73,
          43.54
        ],
        "desc": "#1 state in bank assets per capita ($3.5T+ in bank deposits); Citibank South Dakota, premier dynasty trust statutes, and zero corporate income tax"
      },
      {
        "name": "Black Hills & Mount Rushmore Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -103.45,
          43.88
        ],
        "desc": "Mount Rushmore National Memorial, Crazy Horse Memorial, Badlands, and Sturgis Motorcycle Rally (500k+ visitors)"
      },
      {
        "name": "Sanford Underground Research Facility (SURF)",
        "type": "research",
        "coords": [
          -103.75,
          44.35
        ],
        "desc": "Homestake gold mine transformed into premier underground physics laboratory; Deep Underground Neutrino Experiment (DUNE)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "High-volume financial transaction routing, underground neutrino detector data pipelines, and satellite imaging (USGS EROS)",
      "banking": "Massive consumer credit card processing banks (Citigroup), perpetual dynasty asset protection trusts, and wealth preservation",
      "healthcare": "Sanford Health (nation's largest rural health system) and Avera Health",
      "hospitality": "Mount Rushmore patriotic tourism, Sturgis motorcycle rally, and Black Hills outdoor recreation"
    },
    "modeledServicesOutput": "$54B (75% of SD GDP)",
    "sourceAttribution": "BEA GDP by Industry SD / South Dakota Banking Commission / SURF"
  },
  "Tennessee": {
    "name": "Tennessee",
    "code": "TN",
    "region": "Appalachian & Cumberland Plateau Core",
    "humanCapitalIndex": 80,
    "urbanAgglomerationIndex": 82,
    "financialDepthIndex": 80,
    "digitalConnectivityIndex": 86,
    "consumerAmenityIndex": 95,
    "primaryClusters": [
      {
        "name": "Nashville Music City & Healthcare Capital",
        "type": "creative",
        "coords": [
          -86.78,
          36.16
        ],
        "desc": "Capital of the American music industry (country, gospel, rock) and investor-owned healthcare capital (HCA Healthcare HQ)"
      },
      {
        "name": "Oak Ridge National Laboratory & Quantum Science",
        "type": "research",
        "coords": [
          -84.27,
          35.93
        ],
        "desc": "Frontier supercomputer (world's fastest exascale supercomputer), isotope production, and nuclear fusion research"
      },
      {
        "name": "Memphis FedEx Global Freight Hub Logistics Intelligence",
        "type": "tech",
        "coords": [
          -89.97,
          35.04
        ],
        "desc": "FedEx World Hub\u2014busiest air cargo airport in North America, coordinating automated sorting across 200+ countries"
      },
      {
        "name": "Great Smoky Mountains & Dollywood Tourism Corridor",
        "type": "hospitality",
        "coords": [
          -83.51,
          35.71
        ],
        "desc": "Gatlinburg, Pigeon Forge, Dollywood, and Great Smoky Mountains National Park (most visited national park in America)"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Exascale supercomputing simulations (Oak Ridge), automated package logistics AI, and health-tech platforms",
      "banking": "Healthcare hospital management debt syndication, music royalties management, and regional commercial lending",
      "healthcare": "Vanderbilt University Medical Center, HCA Healthcare, and St. Jude Children's Research Hospital (Memphis)",
      "hospitality": "Grand Ole Opry, Broadway honky-tonk entertainment, Great Smoky Mountains tourism, and Elvis Presley's Graceland"
    },
    "modeledServicesOutput": "$390B (75% of TN GDP)",
    "sourceAttribution": "BEA GDP by Industry TN / Tennessee Dept of Economic Development / ORNL"
  },
  "Texas": {
    "name": "Texas",
    "code": "TX",
    "region": "Texas Energy, Tech & Gateway Empire",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 92,
    "financialDepthIndex": 92,
    "digitalConnectivityIndex": 94,
    "consumerAmenityIndex": 90,
    "primaryClusters": [
      {
        "name": "Silicon Hills & Austin Tech Megacenter",
        "type": "tech",
        "coords": [
          -97.74,
          30.27
        ],
        "desc": "Tesla Global HQ, Dell, Oracle, AMD, Apple Americas Campus, and booming venture software and semiconductor design"
      },
      {
        "name": "Texas Medical Center (Houston)",
        "type": "research",
        "coords": [
          -95.4,
          29.71
        ],
        "desc": "World's largest medical complex; 54 institutions (MD Anderson Cancer Center, Baylor College of Medicine) with 10M+ patient visits"
      },
      {
        "name": "Dallas-Fort Worth Corporate & Financial Hub",
        "type": "finance",
        "coords": [
          -96.8,
          32.78
        ],
        "desc": "Second-highest concentration of Fortune 500 headquarters in the US (AT&T, ExxonMobil, Southwest, Charles Schwab)"
      },
      {
        "name": "Houston Energy Trading & Space Exploration Corridor",
        "type": "tech",
        "coords": [
          -95.36,
          29.76
        ],
        "desc": "Global energy trading desks, offshore drilling engineering, and NASA Johnson Space Center mission control"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Autonomous driving software, aerospace spacecraft telemetry (SpaceX Starbase, NASA), and semiconductor architecture",
      "banking": "Charles Schwab headquarters, energy project finance, Texas sovereign wealth funds, and private equity",
      "healthcare": "MD Anderson (world's top oncology hospital), Texas Children's Hospital, and massive clinical trials",
      "hospitality": "San Antonio River Walk, Austin South by Southwest (SXSW), Dallas sports entertainment, and Gulf Coast tourism"
    },
    "modeledServicesOutput": "$1,720B (66% of TX GDP)",
    "sourceAttribution": "BEA GDP by Industry TX / Texas Economic Development / TMC"
  },
  "Utah": {
    "name": "Utah",
    "code": "UT",
    "region": "Silicon Slopes & Wasatch Front",
    "humanCapitalIndex": 88,
    "urbanAgglomerationIndex": 84,
    "financialDepthIndex": 85,
    "digitalConnectivityIndex": 90,
    "consumerAmenityIndex": 94,
    "primaryClusters": [
      {
        "name": "Silicon Slopes Tech & Cloud SaaS Corridor",
        "type": "tech",
        "coords": [
          -111.89,
          40.42
        ],
        "desc": "Lehi & Salt Lake City SaaS boom (Qualtrics, Domo, Adobe campus), cloud data centers, and venture investment"
      },
      {
        "name": "Salt Lake Industrial Banking & Wealth Management Core",
        "type": "finance",
        "coords": [
          -111.89,
          40.76
        ],
        "desc": "Nation's premier industrial loan company (ILC) charter hub; holds billions in specialty non-bank financial assets"
      },
      {
        "name": "Mighty 5 National Parks & Park City Ski Empire",
        "type": "hospitality",
        "coords": [
          -111.5,
          40.65
        ],
        "desc": "Sundance Film Festival, Park City Mountain Resort (Deer Valley), Zion, and Bryce Canyon national parks"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Cloud software, enterprise customer experience computing, cybersecurity (NSA Utah Data Center), and aerospace defense",
      "banking": "Industrial loan corporations (ILCs), fintech lending platforms, and conservative commercial credit",
      "healthcare": "Intermountain Healthcare (world-renowned benchmark for clinical healthcare cost-efficiency)",
      "hospitality": "Sundance Film Festival, ski resorts with 'The Greatest Snow on Earth', and world-famous red rock canyons"
    },
    "modeledServicesOutput": "$205B (76% of UT GDP)",
    "sourceAttribution": "BEA GDP by Industry UT / Silicon Slopes / Intermountain Healthcare"
  },
  "Vermont": {
    "name": "Vermont",
    "code": "VT",
    "region": "Green Mountain Artisan & Ecotourism Shelf",
    "humanCapitalIndex": 84,
    "urbanAgglomerationIndex": 50,
    "financialDepthIndex": 60,
    "digitalConnectivityIndex": 72,
    "consumerAmenityIndex": 92,
    "primaryClusters": [
      {
        "name": "Burlington & Lake Champlain Artisan & Tech Core",
        "type": "tech",
        "coords": [
          -73.21,
          44.48
        ],
        "desc": "University of Vermont Medical Center, GlobalFoundries semiconductor engineering, and specialty outdoor gear tech"
      },
      {
        "name": "Green Mountain Ski & Ecotourism Corridor",
        "type": "hospitality",
        "coords": [
          -72.82,
          43.62
        ],
        "desc": "Killington, Stowe Mountain Resort, handcrafted maple syrup/cheese agritourism, and scenic autumn foliage"
      },
      {
        "name": "Montpelier Captive Insurance & Legal Haven",
        "type": "finance",
        "coords": [
          -72.58,
          44.26
        ],
        "desc": "#1 captive insurance domicile in the United States and 3rd in the world; over 1,200 licensed captive insurance companies"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Semiconductor foundry design, environmental sustainability computing, and clean tech software",
      "banking": "Global captive insurance capital ($30B+ in gross written premiums) and socially responsible investment funds",
      "healthcare": "University of Vermont Health Network providing academic medical care across northern New England",
      "hospitality": "Stowe and Killington skiing, Ben & Jerry's factory tourism, and farm-to-table culinary experiences"
    },
    "modeledServicesOutput": "$32B (74% of VT GDP)",
    "sourceAttribution": "BEA GDP by Industry VT / State of Vermont DFR Captive Insurance"
  },
  "Virginia": {
    "name": "Virginia",
    "code": "VA",
    "region": "Capital Region Cyber & Defense Gateway",
    "humanCapitalIndex": 94,
    "urbanAgglomerationIndex": 90,
    "financialDepthIndex": 90,
    "digitalConnectivityIndex": 100,
    "consumerAmenityIndex": 88,
    "primaryClusters": [
      {
        "name": "Northern Virginia Data Center Alley (Loudoun & Fairfax)",
        "type": "tech",
        "coords": [
          -77.48,
          39.04
        ],
        "desc": "Internet Capital of the World: 70% of global internet traffic routes through Loudoun County; 3,000+ megawatts of data centers"
      },
      {
        "name": "Pentagon & Rosslyn Defense & Intelligence Corridor",
        "type": "tech",
        "coords": [
          -77.07,
          38.89
        ],
        "desc": "The Pentagon, CIA headquarters (Langley), and unmatched concentration of major defense contracting giants (General Dynamics, Northrop Grumman)"
      },
      {
        "name": "Richmond Corporate & Federal Reserve District",
        "type": "finance",
        "coords": [
          -77.43,
          37.54
        ],
        "desc": "Federal Reserve Bank of Richmond, Capital One Financial global HQ, and major corporate legal practices"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Hyperscale internet routing infrastructure, federal cloud security, defense systems integration, and cyber operations",
      "banking": "Capital One Financial ($470B assets), national defense loan syndication, and private wealth management",
      "healthcare": "Inova Health System and UVA Health academic medical center",
      "hospitality": "Colonial Williamsburg historic heritage tourism, Shenandoah National Park, and Virginia Beach oceanfront resorts"
    },
    "modeledServicesOutput": "$540B (77% of VA GDP)",
    "sourceAttribution": "BEA GDP by Industry VA / Loudoun Economic Development / Capital One"
  },
  "Washington": {
    "name": "Washington",
    "code": "WA",
    "region": "Pacific Northwest Cloud & Aerospace Capital",
    "humanCapitalIndex": 96,
    "urbanAgglomerationIndex": 92,
    "financialDepthIndex": 92,
    "digitalConnectivityIndex": 98,
    "consumerAmenityIndex": 94,
    "primaryClusters": [
      {
        "name": "Seattle & Bellevue Cloud & Software Megacenter",
        "type": "tech",
        "coords": [
          -122.33,
          47.61
        ],
        "desc": "Amazon Global HQ, Microsoft Redmond Campus\u2014the two dominant cloud platforms on Earth (AWS & Azure); University of Washington AI"
      },
      {
        "name": "Puget Sound Aerospace Engineering & Boeing Design",
        "type": "tech",
        "coords": [
          -122.21,
          47.97
        ],
        "desc": "Commercial aircraft engineering, avionics design, satellite constellation manufacturing (Starlink), and maritime logistics"
      },
      {
        "name": "Olympic & Cascade Mountains Ecotourism & Cruise Terminal",
        "type": "hospitality",
        "coords": [
          -122.34,
          47.61
        ],
        "desc": "Port of Seattle Alaska cruise terminal, Mount Rainier National Park, and world-class Pacific seafood culinary culture"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Hyperscale cloud computing (AWS & Azure), artificial intelligence foundation models, and commercial aviation avionics",
      "banking": "Venture capital (Madrona), commercial software enterprise finance, and Pacific rim export finance",
      "healthcare": "UW Medicine, Fred Hutchinson Cancer Center (pioneer in bone marrow transplantation), and Seattle Children's",
      "hospitality": "Space Needle, Pike Place Market, Alaska cruise ship departures ($1B+ impact), and Olympic National Park"
    },
    "modeledServicesOutput": "$650B (80% of WA GDP)",
    "sourceAttribution": "BEA GDP by Industry WA / Washington Technology Industry Association / UW"
  },
  "West Virginia": {
    "name": "West Virginia",
    "code": "WV",
    "region": "Appalachian Mountain Shelf",
    "humanCapitalIndex": 60,
    "urbanAgglomerationIndex": 48,
    "financialDepthIndex": 50,
    "digitalConnectivityIndex": 62,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "Clarksburg & Fairmont Federal Biometrics & Cyber Hub",
        "type": "tech",
        "coords": [
          -80.34,
          39.28
        ],
        "desc": "FBI Criminal Justice Information Services (CJIS\u2014largest FBI division), NASA Independent Verification and Validation"
      },
      {
        "name": "Morgantown West Virginia University Healthcare & Energy Research",
        "type": "research",
        "coords": [
          -79.95,
          39.63
        ],
        "desc": "WVU Medicine Rockefeller Neuroscience Institute, fossil energy computational modeling, and rural health clinics"
      },
      {
        "name": "New River Gorge National Park & Ecotourism Corridor",
        "type": "hospitality",
        "coords": [
          -81.08,
          38.07
        ],
        "desc": "America's newest national park; world-class whitewater rafting, New River Gorge Bridge Day, and rock climbing"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Federal biometric identification processing, NASA software code verification, and cybersecurity infrastructure",
      "banking": "Regional community banks, coal and natural gas mineral royalty management, and public municipal bonding",
      "healthcare": "WVU Medicine (rapidly expanding multi-hospital system across central Appalachia)",
      "hospitality": "New River Gorge outdoor adventure tourism, historic Greenbrier luxury resort, and Snowshoe Mountain skiing"
    },
    "modeledServicesOutput": "$62B (65% of WV GDP)",
    "sourceAttribution": "BEA GDP by Industry WV / WVU Medicine / FBI CJIS"
  },
  "Wisconsin": {
    "name": "Wisconsin",
    "code": "WI",
    "region": "Great Lakes Bio-Health & Dairy Basin",
    "humanCapitalIndex": 82,
    "urbanAgglomerationIndex": 78,
    "financialDepthIndex": 78,
    "digitalConnectivityIndex": 84,
    "consumerAmenityIndex": 82,
    "primaryClusters": [
      {
        "name": "Madison Epic Systems & Bio-Health Corridor",
        "type": "tech",
        "coords": [
          -89.57,
          42.99
        ],
        "desc": "Epic Systems global campus in Verona (electronic health records for 300M+ global patients); UW-Madison #8 in US research spend"
      },
      {
        "name": "Milwaukee Financial, Water Tech & Industrial Automation",
        "type": "finance",
        "coords": [
          -87.9,
          43.03
        ],
        "desc": "Northwestern Mutual global headquarters ($350B+ assets), Rockwell Automation, and Global Water Center"
      },
      {
        "name": "Door County & Wisconsin Dells Tourism Empires",
        "type": "hospitality",
        "coords": [
          -89.77,
          43.62
        ],
        "desc": "Waterpark Capital of the World (Wisconsin Dells), Door County coastal cherry orchards, and Green Bay Lambeau Field"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Global electronic health record (EHR) software platforms, stem cell biological research (UW-Madison), and industrial IoT",
      "banking": "Northwestern Mutual life insurance & wealth management, Baird financial advisory, and commercial manufacturing credit",
      "healthcare": "UW Health University Hospital, American Family Children's Hospital, and specialty regenerative biology",
      "hospitality": "Wisconsin Dells family indoor waterpark resorts, Green Bay Packers football tourism, and Door County coastal retreats"
    },
    "modeledServicesOutput": "$310B (74% of WI GDP)",
    "sourceAttribution": "BEA GDP by Industry WI / Epic Systems / UW-Madison R&D"
  },
  "Wyoming": {
    "name": "Wyoming",
    "code": "WY",
    "region": "High Plains & Continental Divide Basin",
    "humanCapitalIndex": 68,
    "urbanAgglomerationIndex": 42,
    "financialDepthIndex": 82,
    "digitalConnectivityIndex": 68,
    "consumerAmenityIndex": 98,
    "primaryClusters": [
      {
        "name": "Jackson Hole & Grand Teton Global Wealth & Luxury Haven",
        "type": "finance",
        "coords": [
          -110.76,
          43.47
        ],
        "desc": "Highest per-capita income county in America; Federal Reserve Jackson Hole Economic Symposium and private family offices"
      },
      {
        "name": "Yellowstone National Park Geothermal Ecotourism Hub",
        "type": "hospitality",
        "coords": [
          -110.58,
          44.42
        ],
        "desc": "World's first national park; 4M+ global visitors for geysers, wildlife safaris, and wilderness exploration"
      },
      {
        "name": "Cheyenne Enterprise Data Center & Crypto-Banking Corridor",
        "type": "tech",
        "coords": [
          -104.82,
          41.13
        ],
        "desc": "Microsoft West Coast data centers, NCAR Wyoming Supercomputing Center, and pioneering Special Purpose Depository Institution (SPDI) digital banking"
      }
    ],
    "servicesProfile": {
      "techAndDefense": "Atmospheric climate supercomputing (NCAR-Wyoming), blockchain digital asset custody, and geological telemetry",
      "banking": "Wyoming private wealth trust laws (zero personal/corporate income tax), digital asset SPDI banking, and family wealth preservation",
      "healthcare": "St. John's Health (Jackson) and Cheyenne Regional Medical Center",
      "hospitality": "Jackson Hole Mountain Resort (world-class skiing), Yellowstone & Grand Teton national parks ($1.5B+ tourism revenue)"
    },
    "modeledServicesOutput": "$34B (67% of WY GDP)",
    "sourceAttribution": "BEA GDP by Industry WY / Wyoming Division of Banking / NCAR"
  }
};

/**
 * Retrieves the services endowments for a given US state.
 * Returns grounded 5-dimensional services rating with zero fictional baselines.
 * Supports dynamic custom overrides (e.g. from Groq AI crisis & disaster simulations).
 */
export function getUsStateServicesEndowment(stateName, customOverrides = null) {
  if (!stateName) return null;
  let endow = US_SERVICES_ENDOWMENTS[stateName];

  if (!endow) {
    const clean = stateName.toLowerCase().trim();
    for (const [name, e] of Object.entries(US_SERVICES_ENDOWMENTS)) {
      if (name.toLowerCase() === clean || e.code.toLowerCase() === clean) {
        endow = e;
        break;
      }
    }
  }

  // Fallback for non-state territories (e.g. Puerto Rico, Guam)
  if (!endow) {
    endow = {
      name: stateName,
      code: stateName.slice(0, 2).toUpperCase(),
      region: "Dependent Territory",
      humanCapitalIndex: 50,
      urbanAgglomerationIndex: 50,
      financialDepthIndex: 45,
      digitalConnectivityIndex: 55,
      consumerAmenityIndex: 75,
      primaryClusters: [],
      servicesProfile: {
        techAndDefense: "Local IT and telecommunications services",
        banking: "Community banking and retail commerce",
        healthcare: "Regional municipal clinics and hospitals",
        hospitality: "Island tourism and local dining services"
      },
      modeledServicesOutput: "$8B (Local Services)",
      sourceAttribution: "BEA Regional Economic Accounts"
    };
  }

  if (customOverrides && customOverrides[stateName]) {
    const ov = customOverrides[stateName];
    const newH = Math.max(0, Math.min(100, (endow.humanCapitalIndex ?? 50) + (ov.humanCapitalIndexDelta ?? 0)));
    const newA = Math.max(0, Math.min(100, (endow.urbanAgglomerationIndex ?? 50) + (ov.urbanAgglomerationIndexDelta ?? 0)));
    const newF = Math.max(0, Math.min(100, (endow.financialDepthIndex ?? 50) + (ov.financialDepthIndexDelta ?? 0)));
    const newD = Math.max(0, Math.min(100, (endow.digitalConnectivityIndex ?? 50) + (ov.digitalConnectivityIndexDelta ?? 0)));
    const newC = Math.max(0, Math.min(100, (endow.consumerAmenityIndex ?? 50) + (ov.consumerAmenityIndexDelta ?? 0)));

    return {
      ...endow,
      ...ov,
      humanCapitalIndex: newH,
      urbanAgglomerationIndex: newA,
      financialDepthIndex: newF,
      digitalConnectivityIndex: newD,
      consumerAmenityIndex: newC,
      isDisrupted: Boolean(ov.isDisrupted || ov.consumerAmenityIndexDelta || ov.urbanAgglomerationIndexDelta),
      disruptionReason: ov.reason || "Disaster disruption",
    };
  }

  return endow;
}

/**
 * Returns all prominent metropolitan service clusters across the United States.
 */
export const ALL_US_SERVICE_CLUSTERS = Object.values(US_SERVICES_ENDOWMENTS).flatMap(
  (s) => (s.primaryClusters || []).map((c) => ({ ...c, state: s.name, stateCode: s.code }))
);
