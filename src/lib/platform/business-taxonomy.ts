/**
 * Worldwide business classification for company registration. Built on the UN's ISIC Rev. 4 (the standard every
 * national scheme — NAICS, NACE, NIC, ANZSIC … — maps onto), regrouped into friendly categories and taken down to
 * ISIC "group" level, plus the modern industries ISIC predates (SaaS, AI, cybersecurity, fintech, e-commerce, renewable
 * energy, streaming, esports …). A company picks up to 5 categories and up to 25 sub-categories — and may type its own
 * (custom entries count toward the 5), so nothing a business does can be left out.
 *
 * Codes are stable slugs (never shown to people): `<category>` and `<category>:<sub-category>`.
 * Pure data — client-safe, no data access.
 */

export interface BusinessSub {
  code: string;
  name: string;
}

export interface BusinessCategory {
  code: string;
  name: string;
  subs: BusinessSub[];
}

const slug = (t: string) => t.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
export const MAX_BUSINESS_CATEGORIES = 5;
export const MAX_BUSINESS_SUBCATEGORIES = 25;
export const CUSTOM_PREFIX = "custom:";

/** Further sub-categories appended to categories above (kept apart so the base lists stay readable). */
const EXTRA: Record<string, string[]> = {
  "Information Technology & Software": [
    "Product engineering and R&D centres", "Offshore development centres", "Enterprise software and system integration", "SAP, Oracle and Microsoft partners", "CMS, WordPress and Shopify development",
    "API and microservices development", "Legacy application modernisation", "Database administration and data engineering", "Network engineering and infrastructure services", "IT hardware sales and AMC",
    "DevSecOps and site reliability", "Chatbots and conversational AI", "Voice assistants and speech technology", "Computer vision and image recognition", "CAD, CAM and engineering software",
    "GIS and geospatial software", "Open-source software and communities", "Firmware and operating-system development", "IT helpdesk and technical support", "Technical documentation and developer relations",
    "Cloud migration and FinOps", "Business intelligence and dashboards", "Digital product design and prototyping", "Bootcamps and developer training",
  ],
  "Healthcare & Life Sciences": [
    "Cardiology", "Oncology and cancer care", "Orthopaedics and sports medicine", "Paediatrics and neonatology", "Gynaecology and obstetrics", "Dermatology and cosmetic medicine", "Ophthalmology and eye care",
    "ENT (ear, nose and throat)", "Neurology and neurosurgery", "Nephrology and dialysis", "Gastroenterology", "Urology", "Psychiatry", "Radiology and imaging centres", "Pathology and blood tests",
    "Cosmetic and plastic surgery", "Nutrition and dietetics", "Optometry and opticians", "Medical tourism", "Medical coding, billing and transcription", "Health insurance TPAs and claims",
    "Clinical trials and research sites", "Hospital management and healthcare software", "Medical equipment rental and servicing", "Palliative and hospice care", "Veterinary and animal health",
    "Yoga therapy and naturopathy", "Acupuncture and alternative therapies", "Dental labs and orthodontics", "Pharmacy chains and chemists",
  ],
  "Education & Training": [
    "Montessori and early learning", "CBSE, ICSE, IB and state-board schools", "International schools", "Special education", "Engineering and medical entrance coaching", "Civil-service and competitive-exam coaching",
    "Management and MBA institutes", "Law and professional colleges", "Nursing and paramedical institutes", "Polytechnics and ITIs", "Coding bootcamps", "STEM and robotics education", "Abroad education and test prep (IELTS, GRE, GMAT)",
    "Distance and open universities", "Online tutoring marketplaces", "Hobby classes and workshops", "Cooking and culinary schools", "Aviation and pilot training", "Fashion and design institutes", "Early-childhood teacher training",
    "Libraries and learning centres", "Education content publishing", "School management software", "Scholarships and education finance",
  ],
  "Retail Trade": [
    "Kirana and neighbourhood stores", "Wholesale clubs and cash-and-carry", "Duty-free and travel retail", "Pawn shops and gold loans", "Thrift and charity shops", "Mobile phone and accessory stores",
    "Optical and eyewear stores", "Bridal and festive wear stores", "Fabric and textile shops", "Gift and novelty shops", "Pet and aquarium shops", "Garden and plant nurseries", "Paint and sanitaryware dealers",
    "Tile, marble and building-material retail", "Tyre and battery retail", "Kitchenware and utensils", "Baby and maternity stores", "Liquor and wine shops", "Organic and health-food stores", "Subscription boxes and clubs",
    "Dropshipping", "Print-on-demand", "Social commerce and live-stream selling", "Classifieds and local listings",
  ],
  "Hospitality, Travel & Food Service": [
    "Street food and food stalls", "Sweet shops and mithai", "Ice-cream and dessert parlours", "Juice bars and smoothie shops", "Tea and coffee shops", "Meal subscriptions and tiffin services", "Resort and villa operators",
    "Boutique and heritage hotels", "Bed and breakfasts and homestays", "Eco-tourism and adventure travel", "Wildlife and nature tourism", "Corporate travel management", "Visa and immigration consultancy",
    "Tour guides and travel bloggers", "Luxury and honeymoon travel", "Pilgrim and group tours", "Airline catering", "Hotel management and hospitality education", "Food courts and canteens", "Franchise restaurant chains",
  ],
  "Legal, Accounting & Consulting": [
    "Chartered accountants", "Company secretaries", "GST and indirect-tax consultants", "Immigration and visa lawyers", "Intellectual-property and trademark attorneys", "Litigation and arbitration", "Corporate and M&A law",
    "Startup and venture advisory", "Business registration and licensing", "Legaltech", "Forensic accounting and investigation", "Customs and trade-law advisory", "Insolvency and restructuring", "Financial and wealth planning advisors",
    "Career and executive coaching", "Business coaching and mentoring", "Training and facilitation consultancies",
  ],
  "Agriculture, Forestry & Fishing": [
    "Agritech platforms and marketplaces", "Farm equipment dealers and rental", "Fertilizer and pesticide retail", "Cold storage for produce", "Farmer producer companies", "Mushroom cultivation", "Sericulture and silk",
    "Floriculture and cut flowers", "Nursery and sapling supply", "Organic certification and inputs", "Agro-processing units", "Dairy farm equipment and services", "Fish feed and hatcheries", "Drone spraying and farm services",
  ],
  "Construction & Infrastructure": [
    "Cement and concrete products", "Steel, TMT and rebar supply", "Tiles, marble and granite", "Sanitaryware and bath fittings", "Doors, windows and glass", "Modular kitchens and wardrobes", "False ceiling and drywall",
    "Waterproofing and insulation", "Solar installation contractors", "Lift and escalator installation", "Fire-safety systems installation", "Structural consultants and PMC", "Quantity surveyors and estimators", "Crane and heavy-equipment rental",
  ],
  "Transport & Logistics": [
    "Auto-rickshaw and cab operators", "School and staff transport", "Tempo, mini-truck and tanker operators", "Packers and movers", "Courier franchise partners", "Driver and chauffeur services", "Ambulance and mobile clinics",
    "Bike taxis and rentals", "Inland container depots", "Freight marketplaces and brokers", "Charter flights and private aviation", "Flying schools and aerial services", "Railway services and contractors", "Cross-border and trade logistics",
  ],
  "Personal & Household Services": [
    "Astrology, numerology and tarot", "Life and relationship coaching", "Makeup artists and bridal services", "Mehendi and henna artists", "DJs and sound services", "Florists and decorators", "Personal shoppers and stylists",
    "Elder and child companions", "Tutors and home instructors", "Personal trainers and nutrition coaches", "Driving and car-care services", "Laundry and dry-cleaning chains", "Cobblers and shoe repair", "Key-makers and locksmiths", "Tailors and alteration shops",
  ],
  "Banking & Financial Services": [
    "Neo-banks and challenger banks", "Buy-now-pay-later (BNPL)", "Peer-to-peer lending", "Crowdfunding platforms", "Wealthtech and robo-advisors", "Regtech and compliance technology", "Gold loans and pawn finance",
    "Housing finance", "Vehicle and equipment finance", "Mutual-fund distribution", "Stock-broking and trading platforms", "Bill payments and utilities platforms", "Chit funds and savings schemes", "Trade finance and factoring",
  ],
};

function cat(name: string, baseSubs: string[]): BusinessCategory {
  const subs = [...baseSubs, ...(EXTRA[name] ?? [])];
  const code = slug(name);
  const seen = new Set<string>();
  const list: BusinessSub[] = [];
  for (const n of subs) {
    let c = `${code}:${slug(n)}`;
    for (let i = 2; seen.has(c); i++) c = `${code}:${slug(n)}-${i}`;
    seen.add(c);
    list.push({ code: c, name: n });
  }
  return { code, name, subs: list };
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  cat("Agriculture, Forestry & Fishing", [
    "Cereals, rice and oilseed farming", "Vegetable and fruit growing", "Plantation crops (tea, coffee, rubber, spices)", "Flowers, nurseries and horticulture",
    "Dairy and cattle farming", "Poultry and egg farming", "Sheep, goat and pig farming", "Beekeeping and sericulture", "Mixed farming",
    "Seeds, farm inputs and crop support services", "Post-harvest and primary processing services", "Hunting and trapping", "Forestry and logging",
    "Gathering of forest products", "Marine fishing", "Freshwater fishing", "Aquaculture and fish farming", "Organic and precision farming (agritech)", "Hydroponics and vertical farming",
  ]),
  cat("Mining & Quarrying", [
    "Coal and lignite mining", "Crude petroleum extraction", "Natural gas extraction", "Iron ore mining", "Non-ferrous metal ores (gold, copper, bauxite, others)",
    "Stone, sand and clay quarrying", "Salt extraction", "Chemical and fertilizer minerals", "Gemstones and diamonds", "Oil and gas drilling support", "Other mining support services",
  ]),
  cat("Food, Beverage & Tobacco Manufacturing", [
    "Meat and poultry processing", "Fish and seafood processing", "Fruit and vegetable processing", "Edible oils and fats", "Dairy products", "Grain milling and starch products",
    "Bakery products", "Sugar and confectionery", "Pasta, noodles and snacks", "Ready meals and packaged foods", "Spices, sauces and condiments", "Animal feed", "Distilled spirits",
    "Wine and fermented beverages", "Beer and malt", "Soft drinks and bottled water", "Tea and coffee processing", "Tobacco products",
  ]),
  cat("Textiles, Apparel & Leather", [
    "Spinning and weaving", "Knitting and crocheting", "Textile finishing and dyeing", "Carpets, rugs and home textiles", "Technical and industrial textiles", "Ready-made garments",
    "Uniforms and workwear", "Fur and leather apparel", "Footwear", "Leather goods and luggage", "Fashion design and accessories",
  ]),
  cat("Wood, Paper & Printing", [
    "Sawmilling and wood processing", "Wood panels and veneer", "Builders' carpentry and joinery", "Wooden containers and pallets", "Pulp and paper", "Corrugated paper and cartons",
    "Household and stationery paper products", "Commercial printing", "Pre-press and bookbinding", "Reproduction of recorded media",
  ]),
  cat("Chemicals, Pharmaceuticals & Plastics", [
    "Basic and industrial chemicals", "Fertilizers and agrochemicals", "Paints, coatings and inks", "Soaps, detergents and cleaning products", "Cosmetics and personal care products",
    "Specialty chemicals", "Industrial gases", "Man-made fibres", "Pharmaceutical formulations", "Active pharmaceutical ingredients", "Biotechnology products and vaccines",
    "Rubber products and tyres", "Plastic products", "Petroleum refining", "Coke and fuel products",
  ]),
  cat("Metals, Machinery & Equipment", [
    "Iron and steel", "Non-ferrous metals", "Foundries and casting", "Structural metal products", "Tanks, boilers and pressure vessels", "Forging, stamping and machining",
    "Cutlery, tools and hardware", "General-purpose machinery", "Agricultural and forestry machinery", "Machine tools", "Mining and construction machinery",
    "Food and beverage processing machinery", "Textile and printing machinery", "Pumps, compressors and valves", "Electric motors, generators and transformers",
    "Batteries and accumulators", "Wires, cables and wiring devices", "Lighting equipment", "Domestic appliances", "Industrial automation and robotics",
    "Repair and maintenance of machinery", "Installation of industrial equipment",
  ]),
  cat("Electronics, Computers & Optical", [
    "Electronic components and semiconductors", "Printed circuit boards", "Computers and peripherals", "Communication equipment", "Consumer electronics",
    "Measuring, testing and navigation instruments", "Medical and electro-medical equipment", "Optical instruments and photographic equipment", "Watches and clocks",
    "Magnetic and optical media", "IoT devices and wearables", "Security and surveillance equipment",
  ]),
  cat("Automotive & Transport Equipment", [
    "Passenger cars and commercial vehicles", "Auto parts and accessories", "Vehicle bodies, trailers and caravans", "Motorcycles and scooters", "Bicycles and e-bikes",
    "Electric vehicles and charging equipment", "Shipbuilding and boat making", "Railway locomotives and rolling stock", "Tractors and off-highway vehicles",
  ]),
  cat("Aerospace & Defence", [
    "Aircraft and helicopter manufacturing", "Spacecraft and launch vehicles", "Satellites and space systems", "Aircraft maintenance, repair and overhaul",
    "Military vehicles and weapons", "Defence electronics and systems", "Drones and unmanned systems",
  ]),
  cat("Furniture & Other Manufacturing", [
    "Furniture (home and office)", "Mattresses", "Jewellery and precious metals", "Imitation jewellery", "Musical instruments", "Sports goods", "Games and toys",
    "Medical and dental supplies", "Office and school supplies", "Packaging products", "3D printing and additive manufacturing", "Signs, brushes and miscellaneous goods",
  ]),
  cat("Energy & Utilities", [
    "Thermal power generation", "Hydroelectric power", "Nuclear power", "Solar energy", "Wind energy", "Biomass, biogas and biofuels", "Geothermal and tidal energy",
    "Electricity transmission and distribution", "Gas distribution", "Steam and air-conditioning supply", "Energy trading and retail", "Energy storage",
    "Green hydrogen and fuel cells", "Energy services and efficiency",
  ]),
  cat("Water, Waste & Environment", [
    "Water collection, treatment and supply", "Sewerage and wastewater treatment", "Non-hazardous waste collection", "Hazardous waste management", "Waste treatment and disposal",
    "Recycling and materials recovery", "E-waste and scrap processing", "Site remediation and clean-up", "Environmental consulting and testing", "Pollution control services",
  ]),
  cat("Construction & Infrastructure", [
    "Residential building construction", "Commercial and industrial building construction", "Roads, highways and railways", "Bridges and tunnels", "Water, sewer and utility projects",
    "Power and telecom line construction", "Demolition and site preparation", "Electrical installation", "Plumbing, heating and air-conditioning installation",
    "Plastering, painting and flooring", "Roofing and structural steel erection", "Interior fit-out", "Prefabricated buildings", "Dredging and marine construction",
    "Architectural-grade glazing and facades", "Engineering, procurement and construction (EPC)",
  ]),
  cat("Wholesale Trade", [
    "Agricultural raw materials and live animals", "Food, beverages and tobacco", "Household goods and consumer products", "Textiles, clothing and footwear", "Pharmaceuticals and medical goods",
    "Machinery and industrial equipment", "Computers, electronics and telecom equipment", "Fuels, chemicals and industrial products", "Metals and minerals", "Construction materials and hardware",
    "Waste and scrap", "Commission and brokerage trade", "Import and export trading", "Distribution and supply-chain trading",
  ]),
  cat("Retail Trade", [
    "Supermarkets and grocery stores", "Specialised food and beverage stores", "Department stores", "Clothing and footwear stores", "Pharmacies and chemists", "Electronics and appliance stores",
    "Hardware and DIY stores", "Furniture and home furnishing stores", "Books, stationery and gifts", "Sports and toy stores", "Jewellery, watches and luxury goods", "Cosmetics and perfumery stores",
    "Automotive parts and accessories retail", "Fuel stations", "Online retail and e-commerce stores", "Marketplaces and aggregators", "Direct selling and multi-level marketing",
    "Street vendors and markets", "Second-hand goods and antiques", "Vending and convenience retail",
  ]),
  cat("Motor Vehicle Sales & Services", [
    "New and used car sales", "Vehicle maintenance and repair", "Spare parts and accessories", "Motorcycle sales and service", "Car wash and detailing", "Roadside assistance",
    "Car rental and leasing", "Electric vehicle charging services",
  ]),
  cat("Transport & Logistics", [
    "Passenger rail", "Freight rail", "Urban public transit and buses", "Taxi and ride-hailing", "Road freight and trucking", "Pipeline transport", "Sea and coastal passenger transport",
    "Sea freight and shipping", "Inland waterways", "Passenger air transport", "Air cargo", "Space transport", "Warehousing and storage", "Cold chain logistics", "Ports, terminals and harbours",
    "Airport and airline ground services", "Freight forwarding and customs brokerage", "Courier, postal and express delivery", "Last-mile delivery", "Fleet management and logistics technology",
  ]),
  cat("Hospitality, Travel & Food Service", [
    "Hotels and resorts", "Hostels and guesthouses", "Short-term rentals and serviced apartments", "Camping and holiday parks", "Restaurants", "Fast food and quick-service restaurants",
    "Cafes, bakeries and tea houses", "Catering and banquets", "Bars, pubs and nightclubs", "Cloud kitchens and food delivery", "Travel agencies", "Tour operators and sightseeing",
    "Reservation and booking platforms", "Event and conference organisers", "Theme-park and attraction operators",
  ]),
  cat("Information Technology & Software", [
    "Custom software development", "Software products and SaaS", "Mobile app development", "Web development and design", "IT consulting and strategy", "Managed IT services and support",
    "Cloud computing and DevOps", "Cybersecurity", "Artificial intelligence and machine learning", "Data analytics and business intelligence", "Blockchain and Web3", "IoT and embedded systems",
    "ERP and CRM implementation", "Software testing and QA", "Game development", "AR/VR and metaverse", "Robotic process automation", "Data centres and web hosting", "Web portals and search engines",
    "Data processing and digital services", "IT staffing and resourcing", "Digital transformation services", "Fintech software", "Healthtech software", "Edtech platforms", "E-commerce platforms and tools",
    "Low-code / no-code platforms", "API and integration platforms", "UI/UX design services",
  ]),
  cat("Media, Publishing & Entertainment", [
    "Book publishing", "Newspaper and magazine publishing", "Directories and online publishing", "Film and video production", "Television programme production", "Post-production, animation and VFX",
    "Film distribution and cinemas", "Music recording and publishing", "Radio broadcasting", "Television broadcasting", "OTT and video streaming", "Podcasts and audio platforms",
    "News agencies", "Content creation and influencers", "Social media platforms", "Gaming and esports media",
  ]),
  cat("Telecommunications", [
    "Wired telecommunications", "Wireless and mobile operators", "Satellite telecommunications", "Internet service providers", "Mobile virtual network operators", "Telecom towers and infrastructure",
    "VoIP and communications platforms (CPaaS)", "Network equipment services", "Telecom resellers and retail",
  ]),
  cat("Banking & Financial Services", [
    "Central banking", "Commercial and retail banking", "Cooperative banks and credit unions", "Microfinance", "Non-bank lending (NBFC)", "Credit cards and payments", "Payment gateways and processors",
    "Leasing and hire purchase", "Trusts, funds and similar vehicles", "Asset and wealth management", "Securities brokerage", "Investment banking", "Venture capital and private equity",
    "Stock and commodity exchanges", "Financial advisory and planning", "Credit rating and bureaus", "Fintech and digital banking", "Crypto and digital assets", "Foreign exchange and remittance", "Holding companies",
  ]),
  cat("Insurance & Pensions", [
    "Life insurance", "General (non-life) insurance", "Health insurance", "Reinsurance", "Pension funds", "Insurance brokers and agents", "Claims and loss adjusting", "Insurtech",
  ]),
  cat("Real Estate", [
    "Real estate development", "Residential leasing and rentals", "Commercial and office leasing", "Real estate agencies and brokerage", "Property management", "Land development and plotting",
    "Co-working and co-living", "Real estate investment trusts", "Valuation and surveying", "Proptech",
  ]),
  cat("Legal, Accounting & Consulting", [
    "Legal services", "Notary and patent services", "Accounting and audit", "Tax advisory", "Bookkeeping and payroll services", "Management consulting", "Strategy and business advisory",
    "HR and talent consulting", "Public relations and communications", "Corporate head offices", "Compliance and risk advisory",
  ]),
  cat("Architecture, Engineering & Design", [
    "Architecture", "Urban and town planning", "Civil and structural engineering", "Mechanical and electrical engineering", "Surveying and mapping (GIS)", "Technical testing and inspection",
    "Industrial and product design", "Interior design", "Graphic and communication design", "Fashion and textile design", "Landscape architecture",
  ]),
  cat("Research & Development", [
    "Natural sciences and engineering research", "Biotechnology research", "Clinical research and contract research organisations", "Social sciences and humanities research",
    "Think tanks and policy research", "Space and aerospace research", "Materials and nanotechnology research",
  ]),
  cat("Advertising, Marketing & Market Research", [
    "Advertising agencies", "Media buying and representation", "Digital marketing and SEO", "Social media marketing", "Influencer and affiliate marketing", "Branding and creative studios",
    "Market research and polling", "Event and experiential marketing", "Direct and email marketing", "Outdoor and display advertising",
  ]),
  cat("Other Professional & Technical Services", [
    "Photography and videography", "Translation and interpretation", "Veterinary services", "Business brokerage", "Meteorological and weather services", "Specialised consultancy (agri, energy, mining)",
    "Quantity surveying and cost consulting", "Freelance and independent professionals",
  ]),
  cat("Staffing & Business Support", [
    "Recruitment and executive search", "Temporary and contract staffing", "HR outsourcing and employer-of-record", "Call centres and customer support", "Business process outsourcing (BPO)",
    "Back-office and data-entry services", "Document preparation and secretarial services", "Credit collection services", "Equipment rental and leasing", "Packaging and labelling services",
    "Trade-show and exhibition services", "Office administration services",
  ]),
  cat("Security & Facility Services", [
    "Private security and guarding", "Security systems and monitoring", "Investigation services", "Building cleaning and janitorial", "Pest control", "Landscaping and gardening",
    "Integrated facility management", "Industrial cleaning",
  ]),
  cat("Government & Public Administration", [
    "General public administration", "Defence", "Police and public order", "Fire and rescue", "Justice and courts", "Social security administration", "Tax and customs authorities",
    "Regulatory bodies", "Municipal and local government", "Public sector undertakings", "e-Governance services",
  ]),
  cat("Education & Training", [
    "Pre-school and kindergarten", "Primary and secondary schools", "Colleges and universities", "Technical and vocational training", "IT and software training", "Coaching and test preparation",
    "Language training", "Arts, music and dance schools", "Sports and fitness instruction", "Driving schools", "Corporate and professional training", "E-learning and online courses",
    "Tutoring and home tuition", "Educational support services", "Skill development and internships", "Study-abroad and admissions consulting", "Edtech",
  ]),
  cat("Healthcare & Life Sciences", [
    "Hospitals", "General medical practice and clinics", "Specialist medical practice", "Dental practice", "Diagnostic laboratories and imaging", "Ambulance and emergency services",
    "Nursing and home healthcare", "Physiotherapy and rehabilitation", "Ayurveda, homeopathy and traditional medicine", "Mental health and counselling", "Telemedicine and digital health",
    "Blood banks and medical logistics", "Medical devices distribution", "Fertility and maternal care", "Wellness and preventive health", "Healthcare staffing",
  ]),
  cat("Social Care, NGOs & Associations", [
    "Elder care and residential care", "Child care and day nurseries", "Disability and special-needs support", "Community and social work", "Charities and NGOs", "Religious organisations",
    "Political organisations", "Trade unions and employer associations", "Professional and membership associations", "Foundations and trusts",
  ]),
  cat("Arts, Sports & Recreation", [
    "Performing arts and theatre", "Artists, writers and creators", "Museums and heritage sites", "Libraries and archives", "Zoos and botanical gardens", "Casinos, lotteries and betting",
    "Sports clubs and leagues", "Fitness centres and gyms", "Sports facilities and stadiums", "Amusement and water parks", "Esports and gaming venues", "Concerts and live-event venues",
  ]),
  cat("Personal & Household Services", [
    "Hairdressing and beauty salons", "Spa, massage and wellness centres", "Laundry and dry cleaning", "Funeral and related services", "Tailoring and boutiques", "Tattoo and body art",
    "Repair of electronics and appliances", "Repair of computers and phones", "Repair of household goods and footwear", "Pet care, grooming and boarding", "Domestic help and home services",
    "Photo studios and printing", "Wedding and event planning", "Matchmaking and dating services",
  ]),
  cat("International & Extraterritorial Organisations", [
    "United Nations and agencies", "Embassies and consulates", "Multilateral development organisations", "International NGOs", "Households as employers of domestic staff", "Own-use production by households",
  ]),
  cat("Consumer Goods & FMCG", [
    "Packaged food brands", "Beverage brands", "Personal care brands", "Household and cleaning products", "Baby and child products", "Health supplements and nutraceuticals",
    "Private-label manufacturing", "Consumer durables", "Stationery and school supply brands", "Direct-to-consumer (D2C) brands",
  ]),
  cat("Fashion, Luxury & Lifestyle", [
    "Fashion and apparel brands", "Luxury goods", "Eyewear", "Watch and jewellery brands", "Handbags and accessories", "Sustainable and ethical fashion", "Home décor and lifestyle products", "Perfumes and fragrances",
  ]),
  cat("Beauty, Cosmetics & Wellness", [
    "Skincare", "Makeup and colour cosmetics", "Hair care", "Salon and barbershop chains", "Spa and day-spa operators", "Wellness retreats", "Ayurvedic and herbal products", "Fitness nutrition and supplements",
  ]),
  cat("Sports & Fitness", [
    "Sports goods manufacturing and retail", "Gyms and fitness chains", "Yoga and wellness studios", "Sports academies and coaching", "Sports management and events", "Fitness apps and wearables", "Outdoor and adventure sports",
  ]),
  cat("Gaming & Esports", [
    "Game studios and developers", "Mobile gaming", "PC and console gaming", "Game publishing", "Esports teams and organisations", "Gaming hardware and peripherals", "Fantasy sports and real-money gaming", "Game streaming and communities",
  ]),
  cat("Events, Exhibitions & Weddings", [
    "Event management", "Exhibition and trade-show organisers", "Wedding planners", "Venue and banquet operators", "Audio-visual and staging services", "Ticketing platforms", "Conference and summit organisers",
  ]),
  cat("Pets & Animal Care", [
    "Pet food and supplies", "Pet retail", "Veterinary clinics and hospitals", "Pet grooming and boarding", "Animal breeding", "Pet technology", "Animal shelters and welfare",
  ]),
  cat("Marine & Maritime", [
    "Shipping lines", "Port and terminal operations", "Shipyards and ship repair", "Offshore oil and gas services", "Marine equipment", "Seafood export", "Cruise and ferry operations", "Maritime training and crewing", "Yacht and boat services",
  ]),
  cat("Biotechnology & Life Sciences", [
    "Biopharmaceuticals", "Genomics and bioinformatics", "Agricultural biotechnology", "Diagnostics and test kits", "Laboratory equipment and supplies", "Contract development and manufacturing (CDMO)", "Medical biotechnology", "Synthetic biology",
  ]),
  cat("Environment & Sustainability", [
    "Carbon credits and offsets", "ESG and sustainability consulting", "Renewable project development", "Green building and certification", "Water conservation", "Sustainable packaging", "Circular economy and reuse", "Climate technology",
  ]),
  cat("Home & Property Services", [
    "Plumbing and electrical services", "Home renovation and remodelling", "Interior contractors", "Packers, movers and relocation", "Home security and smart-home installation", "Appliance servicing", "Gardening and lawn care", "On-demand home services platforms",
  ]),
  cat("Packaging, Labelling & Printing Services", [
    "Flexible packaging", "Rigid and plastic packaging", "Glass and metal packaging", "Labels and stickers", "Packaging machinery", "Digital and wide-format printing", "Promotional products and merchandise",
  ]),
  cat("Crafts, Handicrafts & Artisans", [
    "Handloom and handicrafts", "Pottery and ceramics", "Woodcraft and carving", "Metalcraft and artefacts", "Souvenirs and gifts", "Artisan cooperatives", "Art galleries and dealers",
  ]),
  cat("Cooperatives & Community Enterprises", [
    "Agricultural cooperatives", "Dairy cooperatives", "Credit and thrift societies", "Self-help groups", "Farmer producer organisations", "Housing societies", "Community-owned enterprises",
  ]),
  cat("Religious & Spiritual Services", [
    "Temples, churches, mosques and trusts", "Pilgrimage and religious tourism", "Spiritual retreats and ashrams", "Religious education", "Religious goods and publications",
  ]),
  cat("Mobility & Smart Transport", [
    "Micro-mobility (scooters, bikes)", "Car sharing and pooling", "Autonomous vehicles", "Public-transit technology", "Parking management", "EV fleets and battery swapping", "Aviation technology and air mobility",
  ]),
  cat("Emerging & Specialty Industries", [
    "Quantum computing", "Nanotechnology", "Smart cities", "Space technology and satellites", "Longevity and anti-ageing", "Hemp and specialty crops (where legal)", "Robotics and autonomous systems", "Digital identity and trust services",
  ]),
  cat("Digital Creators & Creator Economy", [
    "YouTubers and video creators", "Short-video and reels creators", "Live streamers", "Podcasters and audio creators", "Bloggers and website publishers", "Newsletter and Substack writers",
    "Social-media influencers (lifestyle)", "Fashion and beauty influencers", "Tech and gadget reviewers", "Travel and food vloggers", "Fitness and wellness creators", "Gaming and esports creators", "Educational and course creators",
    "UGC (user-generated content) creators", "Memes and community page owners", "Digital artists and illustrators", "NFT and digital collectibles creators", "Voice-over and dubbing artists", "Affiliate marketers", "Brand ambassadors and endorsers",
    "Creator management agencies and MCNs", "Stock photo, video and music contributors", "Social-media managers and community managers", "Livestream sellers and shopping hosts",
  ]),
  cat("Freelancers, Gig Work & Independent Professionals", [
    "Freelance software developers", "Freelance designers and illustrators", "Freelance writers, editors and translators", "Freelance marketers and SEO specialists", "Freelance video editors and animators",
    "Virtual assistants and remote support", "Independent consultants", "Online tutors and coaches", "Gig and on-demand workers", "Remote talent marketplaces", "Micro-task and data-labelling platforms", "Solopreneurs and one-person businesses",
    "Part-time and side-hustle businesses", "Coworking-based independents",
  ]),
  cat("Internet Platforms & Marketplaces", [
    "Social networks and community platforms", "Online marketplaces (B2C)", "B2B marketplaces and trade portals", "Classified and listing portals", "Dating and matrimony platforms", "Ride-hailing and delivery apps", "Super apps",
    "Review, rating and comparison sites", "Job portals and career platforms", "Travel and booking portals", "Real-estate portals", "Crowdsourcing and Q&A communities", "Streaming and subscription platforms", "Peer-to-peer rental and sharing platforms",
  ]),
  cat("Digital Media & Content Services", [
    "Copywriting and content writing", "Video editing and post-production services", "Motion graphics and explainer videos", "Subtitling, dubbing and localisation", "Audiobook and voice production", "Stock content libraries",
    "Social-media content agencies", "Photography and photo editing studios", "Podcast production studios", "Digital publishing and e-books", "News and magazine websites", "Content licensing and syndication",
  ]),
  cat("Music, Performing Arts & Talent", [
    "Singers and vocalists", "Bands and musicians", "Music producers and composers", "DJs and electronic artists", "Instrument teachers and music schools", "Dancers and choreographers", "Actors and theatre artists",
    "Stand-up comedians", "Models and fashion talent", "Anchors, emcees and presenters", "Magicians and live entertainers", "Talent agencies and artist management", "Record labels and music distributors", "Casting and production crews",
  ]),
  cat("Writers, Authors & Publishing Professionals", [
    "Authors and novelists", "Journalists and reporters", "Editors and proofreaders", "Ghostwriters and speechwriters", "Self-publishing and book services", "Literary agents", "Screenwriters and scriptwriters",
    "Technical and academic writers", "Poets and spoken-word artists", "Cartoonists and comic creators",
  ]),
  cat("Fine Arts, Design & Visual Culture", [
    "Painters and visual artists", "Sculptors and installation artists", "Illustrators and concept artists", "Art galleries and auction houses", "Art restoration and conservation", "Photographers and visual storytellers",
    "Tattoo and body-art studios", "Calligraphy and lettering artists", "Fashion illustrators and textile designers", "Public art and murals",
  ]),
  cat("AI, Machine Learning & Data", [
    "Generative AI products and apps", "Large-language-model applications and agents", "AI consulting and strategy", "Computer vision solutions", "Natural-language processing", "Data labelling and annotation", "MLOps and AI infrastructure",
    "AI chips and accelerators", "Predictive analytics and forecasting", "Recommendation and personalisation engines", "Synthetic data and simulation", "AI for healthcare", "AI for finance and risk", "Robotics and autonomous systems", "Speech and voice AI", "AI governance and safety",
  ]),
  cat("Cybersecurity & Trust", [
    "Penetration testing and red teaming", "Managed detection and response (MSSP/SOC)", "Identity and access management", "Governance, risk and compliance (GRC)", "Application and cloud security", "Network and endpoint security",
    "Digital forensics and incident response", "Security awareness training", "Fraud detection and prevention", "Privacy and data-protection consulting", "Encryption and key management", "Threat intelligence",
  ]),
  cat("Cloud, Data Centres & Infrastructure", [
    "Public-cloud services and resellers", "Private and hybrid cloud", "Colocation and data centres", "Content-delivery networks", "Managed hosting and domains", "Edge computing", "Storage and backup services",
    "Disaster recovery services", "Network and SD-WAN services", "Observability and monitoring tools",
  ]),
  cat("Blockchain, Crypto & Web3", [
    "Crypto exchanges and brokers", "Wallets and custody", "Decentralised finance (DeFi)", "NFT marketplaces and platforms", "Blockchain development and consulting", "Crypto mining", "Tokenisation of assets",
    "Web3 gaming and metaverse", "DAO tooling and communities", "Crypto payments and stablecoins", "Smart-contract auditing",
  ]),
  cat("Industry Technology (Vertical Tech)", [
    "HR tech and payroll software", "Legal tech", "Proptech", "Agritech", "Logistics and supply-chain tech", "Retail and POS technology", "Martech and adtech", "Sales and CRM technology", "Govtech and civic tech",
    "Foodtech and restaurant tech", "Travel and hospitality tech", "Medtech", "Cleantech", "Construction tech", "Manufacturing tech (Industry 4.0)", "Sports tech", "Event tech", "Energy tech", "Mobility tech", "Insurtech and regtech",
  ]),
  cat("Jewellery, Gems & Precious Metals", [
    "Gold jewellery manufacturing", "Diamond cutting and polishing", "Silver and artificial jewellery", "Gemstone dealers", "Bullion and precious-metals trading", "Hallmarking and assaying", "Jewellery design studios", "Jewellery retail chains", "Watch and luxury accessory dealers",
  ]),
  cat("Toys, Baby & Kids Products", [
    "Toy manufacturing and retail", "Baby gear and nursery products", "Children's clothing", "Educational toys and learning kits", "Kids' books and activity products", "School bags and accessories", "Play centres and kids' entertainment",
  ]),
  cat("Alcohol, Cannabis & Specialty Beverages", [
    "Breweries and craft beer", "Wineries and vineyards", "Distilleries and spirits brands", "Bars and liquor distribution", "Non-alcoholic and functional beverages", "Kombucha and fermented drinks", "Cannabis and hemp products (where legal)", "Tea and coffee estates and roasters",
  ]),
  cat("Import, Export & Trade Facilitation", [
    "Export houses and merchant exporters", "Import trading and sourcing agents", "Customs clearing agents", "Trade-fair and buyer-seller meets", "Cross-border e-commerce", "Free-trade and special-economic-zone units", "Letters of credit and trade documentation", "International franchising and distribution",
  ]),
  cat("Franchising & Business Opportunities", [
    "Franchise brand owners (franchisors)", "Franchise consultants and brokers", "Master franchise and area development", "Business-opportunity and licensing programmes", "Retail and food franchise operators", "Service franchise operators",
  ]),
  cat("Industrial Services & Maintenance", [
    "Industrial maintenance and shutdown services", "Calibration and metrology labs", "Scaffolding and formwork", "Industrial cleaning and painting", "Non-destructive testing (NDT)", "Plant commissioning and turnkey projects", "Spare parts and MRO supply",
    "Industrial automation integrators", "Elevator and HVAC servicing", "Environmental, health and safety (EHS) services",
  ]),
  cat("Tourism, Culture & Heritage", [
    "Heritage and museum operators", "Cultural festivals and fairs", "Tour guides and local experiences", "Adventure and eco-lodges", "Tourism boards and promotion", "Religious and spiritual tourism", "Rural and farm-stay tourism", "Cruise and houseboat operators",
  ]),
  cat("Nonprofit, Social Impact & Community", [
    "Education and literacy NGOs", "Health and nutrition NGOs", "Environmental and wildlife NGOs", "Women and child welfare", "Disaster relief and humanitarian aid", "Microfinance and livelihood programmes", "Human-rights and advocacy groups",
    "Community clubs and associations", "Alumni and professional networks", "Volunteer and crowdfunding platforms", "Impact investing and social enterprises",
  ]),
  cat("General Stores, Grocery & Daily Needs", [
    "General & Kirana store", "Provision store", "Grocery store", "Supermarket", "Mini-mart and convenience store", "Wholesale grocery", "Vegetable shop", "Fruit shop", "Milk and dairy booth", "Egg shop",
    "Chicken and mutton shop", "Fish and seafood shop", "Dry-fruits and nuts shop", "Spices and masala shop", "Flour mill (atta chakki)", "Rice mill", "Oil mill (ghani)", "Bakery", "Sweet shop", "Namkeen and snacks shop",
    "Paan, cigarette and tobacco shop", "Tea stall and tea shop", "Ration and fair-price shop", "Organic store", "Imported foods and gourmet store", "Frozen foods and ice-cream distributor", "Pickles, papad and homemade foods",
    "Packaged drinking water supplier", "RO water can supplier", "Gas cylinder (LPG) agency", "Newspaper and magazine agency", "Stationery and photocopy shop", "Gift and general merchandise store", "Variety and dollar store",
    "Cosmetics and general store", "Pooja items and samagri shop", "Bangles and fancy store", "Hardware and general store", "Ice factory and cold drinks agency", "Farm-fresh and direct-from-farm store",
  ]),
  cat("Restaurants, Cafes & Eateries", [
    "Restaurant (multi-cuisine)", "Fine-dining restaurant", "Family restaurant", "Vegetarian restaurant", "Non-vegetarian restaurant", "Dhaba and highway restaurant", "Fast-food outlet", "Pizzeria", "Burger joint", "Biryani house",
    "South Indian restaurant", "North Indian restaurant", "Chinese restaurant", "Italian restaurant", "Continental restaurant", "Mexican restaurant", "Thai restaurant", "Japanese and sushi restaurant", "Korean restaurant",
    "Middle-Eastern and Arabic restaurant", "Mughlai restaurant", "Seafood restaurant", "Barbecue and grill", "Thali and home-style restaurant", "Cafe", "Coffee shop", "Bakery cafe", "Tea room", "Ice-cream parlour",
    "Juice and shake bar", "Dessert parlour", "Cake and pastry shop", "Chocolate shop", "Waffle, pancake and crepe shop", "Bubble-tea shop", "Food truck", "Cloud kitchen", "Tiffin and meal service", "Canteen and mess",
    "Chaat, pani-puri and street-food stall", "Momos and rolls outlet", "Sandwich and sub shop", "Vada-pav and snack outlet", "Dosa and idli outlet", "Bar and restaurant", "Pub and brewery pub", "Lounge and hookah bar", "Rooftop restaurant",
    "Food court", "Vegan and health-food restaurant", "Salad bar", "Home chef and home-kitchen", "Franchise food outlet", "Banquet and party kitchen",
  ]),
  cat("Medical Stores, Clinics & Local Healthcare", [
    "Medical store and pharmacy", "Generic medicine store", "General physician clinic", "Dental clinic", "Eye clinic and optician", "Skin and hair clinic", "Physiotherapy centre", "Diagnostic laboratory and pathology lab",
    "X-ray, ultrasound and scan centre", "Maternity home and nursing home", "Ayurvedic clinic", "Homeopathy clinic", "Unani and Siddha clinic", "Naturopathy and yoga clinic", "Chiropractic and acupuncture", "Dietitian and nutrition clinic",
    "Veterinary clinic", "Pet pharmacy", "Blood collection centre", "Ambulance service", "Hearing-aid centre", "Orthopaedic and surgical goods store", "Medical equipment rental", "Counselling and therapy centre", "De-addiction and rehabilitation centre",
    "Child-development and speech therapy", "Elder-care and home-nursing services", "Health-check and wellness camp organisers",
  ]),
  cat("Beauty Parlours, Salons & Personal Care", [
    "Beauty parlour", "Ladies' salon", "Gents' salon and barber shop", "Unisex salon", "Bridal makeup studio", "Nail studio", "Spa and massage centre", "Tattoo and piercing studio", "Mehendi artist", "Threading and waxing studio",
    "Hair-transplant and trichology clinic", "Slimming and weight-loss centre", "Perfume and fragrance shop", "Cosmetics and beauty-supply shop", "Wig and hair-extension shop", "Skin-care and aesthetic clinic", "Grooming academy and beautician courses",
  ]),
  cat("Clothing, Footwear & Fashion Shops", [
    "Ladies' wear shop", "Gents' wear shop", "Kids' wear shop", "Saree shop", "Ethnic and wedding wear", "Boutique and designer wear", "Tailoring shop", "Uniform shop", "Readymade garment shop", "Cloth and fabric merchant",
    "Lingerie and innerwear shop", "Footwear shop", "Bag and luggage shop", "Sherwani and groom wear", "Handloom and khadi shop", "Woollen and winter wear", "Jeans and casual wear", "T-shirt printing and custom apparel", "Garment wholesalers",
    "Embroidery and alteration shop", "Maternity and plus-size wear", "Thrift and second-hand clothing", "Sportswear store", "Scarves, stoles and accessories", "Costume and fancy-dress rental",
  ]),
  cat("Electronics, Mobile & Computer Shops", [
    "Mobile phone shop", "Mobile accessories shop", "Mobile repair shop", "Computer and laptop store", "Computer and laptop repair", "Printer, toner and cartridge shop", "CCTV and security-camera dealer", "Home-appliance store", "AC dealer and installer",
    "TV and audio dealer", "Electrical and lighting shop", "Inverter, battery and UPS dealer", "Solar panel dealer", "Camera and photography equipment shop", "Gaming console and accessories shop", "Second-hand electronics and exchange store",
    "Cyber cafe and browsing centre", "Photocopy, printing and lamination", "SIM card, recharge and DTH dealer", "Cable TV and local ISP operator", "Computer hardware assembler", "Drone and gadget store", "Smart-home and gadget retailer",
  ]),
  cat("Hardware, Building Materials & Home Furnishing Shops", [
    "Hardware and tools store", "Plywood and laminates dealer", "Paint shop", "Sanitary and bath-fittings shop", "Tiles and marble dealer", "Cement dealer", "Steel and iron dealer", "Bricks, sand and aggregate supplier", "Electrical goods shop",
    "Plumbing materials shop", "Glass and aluminium fabricator", "Furniture shop", "Mattress and bedding shop", "Modular kitchen showroom", "Curtains and furnishing store", "Carpet and flooring shop", "Lighting and lamp showroom", "Timber depot and sawmill",
    "Pipes and fittings dealer", "Fasteners and fittings dealer", "Safety equipment and PPE shop", "Locks and security-hardware shop", "Doors and windows dealer", "Roofing sheets and PEB dealer", "Scrap and junk dealer", "Used and second-hand furniture shop",
    "Home décor and artefacts shop", "Wallpaper and wall-panel dealer",
  ]),
  cat("Repair, Installation & Home Services", [
    "Plumber", "Electrician", "Carpenter", "Painter and polisher", "AC repair and service", "Refrigerator and washing-machine repair", "TV and appliance repair", "Watch and clock repair", "Shoe and bag repair", "Bicycle repair shop",
    "Two-wheeler garage and service", "Car garage and service centre", "Puncture and tyre shop", "Denting and painting workshop", "Car accessories and audio shop", "Car and bike wash", "Auto spare-parts dealer", "Truck and heavy-vehicle repair",
    "Welding and fabrication workshop", "Lathe and machining workshop", "Pest-control service", "RO and water-purifier service", "Water-tank and sump cleaning", "Sofa and carpet cleaning", "House and office cleaning", "Packers and movers",
    "Gardener and landscaping service", "Generator and genset service", "CCTV and alarm installation", "Solar rooftop installation", "Interior contractor", "Renovation and civil contractor", "Flooring and tiling contractor", "Waterproofing contractor",
    "Borewell and pump contractor", "Septic-tank and drain cleaning", "Chimney and kitchen-appliance service", "Locksmith and key duplication", "Upholstery and curtain stitching", "Electrical wiring contractor", "Home-appliance rental",
  ]),
  cat("Tuition, Coaching & Local Education", [
    "Tuition centre", "Coaching institute", "Playschool and pre-school", "Day-care and creche", "Computer training institute", "Spoken-English and personality development", "Foreign-language classes", "Dance classes", "Music classes",
    "Drawing and art classes", "Abacus and vedic-maths classes", "Yoga and meditation classes", "Karate and martial-arts classes", "Swimming coaching", "Skating and roller-sports coaching", "Cricket coaching academy", "Football academy",
    "Badminton and tennis academy", "Chess academy", "Driving school", "Typing and shorthand institute", "Tailoring and fashion-design classes", "Beautician and salon courses", "Bank, SSC and railway exam coaching", "UPSC and state-service coaching",
    "NEET, JEE and CET coaching", "Library and self-study room", "Hostel and PG for students", "Education and admission consultancy", "Home tutors and tutor networks",
  ]),
  cat("Hotels, Lodging, Weddings & Event Services", [
    "Hotel", "Budget hotel and lodge", "Guest house", "Dharamshala and pilgrim lodge", "Resort", "Homestay", "Farm stay", "Hostel and backpackers", "PG accommodation", "Serviced apartments",
    "Banquet hall", "Marriage hall and lawn", "Tent house and shamiana", "Event decoration", "Wedding photographer and videographer", "Wedding planner", "DJ and sound system", "Band and baraat services", "Catering service",
    "Florist and flower decoration", "Event transport and bridal car", "Invitation cards and printing", "Return gifts and hampers", "Event lighting and staging",
  ]),
  cat("Taxis, Vehicles & Local Transport Businesses", [
    "Taxi and cab service", "Auto-rickshaw", "Travel agency and ticketing", "Bus operator", "Tempo and mini-truck", "Truck and lorry owner", "Water tanker supplier", "JCB, crane and excavator rental", "Ambulance and hearse service",
    "Driver-on-call service", "Self-drive car rental", "Bike rental", "New-car dealership", "Used-car dealer", "Two-wheeler showroom", "Electric-vehicle showroom", "Petrol and diesel pump", "CNG and LPG station", "Parking and valet",
    "Towing and recovery", "Vehicle insurance and RTO agent", "Transport and cargo company", "Courier and parcel agency", "School-bus operator", "Tour and travel operator",
  ]),
  cat("Finance, Insurance & Agents (Local)", [
    "Insurance agent", "LIC and life-insurance advisor", "Mutual-fund distributor", "Loan and DSA agent", "Chit fund and savings scheme", "Money transfer and forex dealer", "Pawn broker and gold buyer", "Tax consultant", "GST and ITR filing practitioner",
    "Notary and stamp vendor", "Property dealer", "Real-estate broker", "Plot and land developer", "Rental and tenant agent", "Cooperative society and credit society", "Microfinance agent", "Banking correspondent and payment-bank point", "Bill-payment and recharge centre",
    "Stock-broking sub-broker", "Document writer and registration agent", "ATM and cash-management services",
  ]),
  cat("Farming, Dairy & Rural Businesses", [
    "Crop farm", "Dairy farm", "Poultry farm", "Goat and sheep farm", "Fish and pond farm", "Plant nursery", "Fertilizer shop", "Seed shop", "Pesticide and agro-chemical shop", "Tractor and farm-machinery dealer",
    "Farm tools and implements", "Cold storage and warehouse", "Sugarcane and jaggery unit", "Tea and coffee estate", "Spice farm and trading", "Flower farm", "Mushroom farm", "Honey and apiary", "Organic and natural farming",
    "Vermicompost and bio-fertilizer unit", "Silk and cocoon rearing", "Cattle-feed and fodder supplier", "Agricultural commission agent (mandi)", "Grain and pulse trader", "Tractor and harvester rental", "Irrigation and drip-system dealer",
    "Beekeeping and wax products", "Farm-to-home produce delivery", "Rural tourism and agri-tourism",
  ]),
  cat("Small Manufacturing, Workshops & MSME Units", [
    "Job-work and contract manufacturing", "Packaging unit", "Plastic moulding unit", "Garment manufacturing unit", "Pickle, papad and snack unit", "Bakery and biscuit unit", "Ice-cream and dairy unit", "Soap and detergent unit", "Candle and incense (agarbatti) unit",
    "Pottery and terracotta", "Handicraft unit", "Furniture workshop", "Metal fabrication and powder coating", "Machine shop and tool room", "Foundry and casting unit", "Press-shop and sheet metal", "Rubber products unit", "Paper products and paper-cup unit",
    "Printing press", "Flex and banner printing", "Screen and offset printing", "Leather workshop", "Jewellery workshop", "Brick kiln", "Stone crusher and quarry unit", "Cement-products unit (blocks, pipes)", "Paint and chemical unit", "Cosmetic and herbal unit",
    "Electrical assembly and panel unit", "Transformer and motor repair", "LED and lighting manufacturer", "Plastic recycling unit", "Bag and sack manufacturing", "Mattress and foam unit", "Handloom and powerloom", "Dyeing and processing unit", "Spinning mill",
    "Food-processing and masala unit", "Packaged water and beverage plant", "Wooden toys and crafts unit",
  ]),
  cat("Wholesale, Distribution & Dealers", [
    "FMCG distributor and super stockist", "General wholesaler", "Commission agent", "Authorised dealer", "Importer", "Exporter", "Pharma stockist", "Grain and pulses trader", "Spices and oils trader", "Scrap and metal trader",
    "Textile and fabric trader", "Electronics distributor", "Mobile phone distributor", "Stationery distributor", "Cosmetics distributor", "Hardware and tools distributor", "Dry-fruit trader", "Tea and coffee trader", "Machinery dealer",
    "Chemical trader", "Plastic raw-material trader", "Paper and board trader", "Garment wholesaler", "Footwear wholesaler", "Vegetable and fruit wholesaler (mandi)", "Bulk and industrial supplier",
  ]),
  cat("Online Sellers, Home-Based & Micro Businesses", [
    "Home bakery", "Home chef and tiffin", "Online boutique", "Instagram and WhatsApp seller", "Reseller", "Dropshipper", "Handmade crafts seller", "Resin-art and candle maker", "Handmade jewellery maker", "Crochet and knitting",
    "Home tailor and designer", "Home tuition", "Home salon and makeup artist", "Cake artist", "Gift-hamper maker", "Amazon seller", "Flipkart seller", "Meesho and marketplace reseller", "Etsy and global handmade seller",
    "Print-on-demand store", "Digital-product seller", "Online course seller", "Subscription-box business", "Thrift and pre-loved reseller", "Plant and terrarium seller", "Spice and homemade-food seller",
  ]),
  cat("Gyms, Sports Clubs & Recreation (Local)", [
    "Gym and fitness centre", "Yoga studio", "Zumba and aerobics studio", "CrossFit box", "Swimming pool", "Sports club", "Cricket academy and nets", "Football turf", "Badminton court", "Tennis court", "Snooker and pool parlour",
    "Bowling alley", "Gaming zone and arcade", "Cinema and multiplex", "Theatre and auditorium", "Amusement and kids' play zone", "Trampoline park", "Go-karting", "Paintball and laser tag", "Horse riding", "Adventure and trekking club", "Skating rink", "Golf course and driving range",
    "Escape rooms", "Martial-arts dojo", "Boxing and wrestling gym", "Cycling and running clubs",
  ]),
  cat("Professional Practices & Local Offices", [
    "Advocate and law office", "CA and audit firm", "Company-secretary practice", "Architect firm", "Civil and structural engineer", "Interior designer", "Surveyor and valuer", "Consultancy firm", "Recruitment and placement agency",
    "Immigration and visa agency", "Typing and document services", "Translation bureau", "Photography studio", "Digital-marketing agency", "Web-design studio", "Software and app company", "Astrologer and vastu consultant", "Detective and investigation agency",
    "Security-guard agency", "Event-management firm", "Courier and logistics office", "Printing and publishing house", "Advertising and hoarding agency", "Call centre and BPO", "Medical-transcription and coding office", "Language and test-prep consultancy",
  ]),
  cat("Specialty & Hobby Shops", [
    "Book store", "Toy shop", "Gift shop", "Sports-goods shop", "Pet shop and aquarium", "Florist and flower shop", "Optical shop", "Jewellery shop", "Watch shop", "Perfume shop", "Musical-instrument store", "Art and craft supplies",
    "Party-supplies store", "Antique and collectibles shop", "Auction house", "Liquor and wine shop", "Vape and e-cigarette store", "Health-supplement store", "Herbal and Ayurvedic products shop", "Garden and plant shop",
    "Bicycle shop", "Boat and marine dealer", "Fireworks and crackers shop", "Religious goods and idols shop", "Photo-frame and gift-printing shop", "Trophy and awards shop", "School-supplies and uniform shop", "Baby and maternity shop",
    "Bridal and wedding store", "Surplus and outlet store", "Hobby and model shop", "Coins, stamps and collectibles", "Telescope and science kits", "Aquarium and fish-food shop", "Bird and exotic-pet shop",
  ]),
  cat("Community, Public & Faith Places", [
    "Temple", "Mosque", "Church", "Gurdwara", "Monastery and Buddhist centre", "Religious trust", "Ashram", "Community hall", "Social club", "Library", "Charitable trust", "Old-age home", "Orphanage and children's home",
    "Blood bank", "Voluntary organisation", "Residents' welfare association", "Self-help group", "Youth club", "Public toilets and amenities operator", "Cemetery and crematorium services",
  ]),
  cat("Government Service Points & Utilities", [
    "Common Service Centre (CSC)", "Post-office franchise", "Passport service centre", "Aadhaar and ID service centre", "E-governance kiosk", "Bank mitra and payment point", "Electricity distribution", "Water supply board", "Municipal services",
    "Public transport authority", "Police and law-enforcement offices", "Courts and legal-aid centres", "Panchayat and local bodies", "Tax and registration offices", "Public health centre", "Government school and college", "Defence canteen and ex-servicemen services",
  ]),
  cat("Other / Not Listed", ["Diversified conglomerate", "Start-up (industry not decided yet)", "Holding or investment vehicle", "Franchise operations", "Social enterprise", "Not applicable"]),
];

/** Selection stored on the company: up to 5 categories and 25 sub-categories, any of which may be typed by the company ("custom"). */
export interface BusinessSelection {
  standard: "ISIC Rev.4 (extended)";
  categories: { code: string; name: string; custom?: true }[];
  subCategories: { code: string; name: string; categoryCode?: string; custom?: true }[];
}

export type BusinessErrors = { businessCategories?: string; businessSubCategories?: string };
export type BusinessResult = { ok: true; value: BusinessSelection } | { ok: false; errors: BusinessErrors };

const byCode = new Map(BUSINESS_CATEGORIES.map((c) => [c.code, c]));

export const isCustomCode = (code: string) => code.startsWith(CUSTOM_PREFIX);
/** A typed entry, cleaned: letters/numbers and basic punctuation only, 2–60 characters. */
export function cleanCustomName(text: string): string {
  return text.replace(/[^\p{L}\p{N} &,.'()/+-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);
}
export const customCode = (text: string) => `${CUSTOM_PREFIX}${cleanCustomName(text)}`;

/** Checks a submission against the taxonomy (never trust the form) and builds what gets stored. */
export function resolveBusiness(categoryCodes: string[], subCodes: string[]): BusinessResult {
  const cats: BusinessSelection["categories"] = [];
  const seenCat = new Set<string>();
  for (const code of categoryCodes) {
    if (isCustomCode(code)) {
      const name = cleanCustomName(code.slice(CUSTOM_PREFIX.length));
      if (name.length >= 2 && !seenCat.has(`c:${name.toLowerCase()}`)) {
        seenCat.add(`c:${name.toLowerCase()}`);
        cats.push({ code: `${CUSTOM_PREFIX}${name}`, name, custom: true });
      }
    } else if (byCode.has(code) && !seenCat.has(code)) {
      seenCat.add(code);
      cats.push({ code, name: byCode.get(code)!.name });
    }
  }
  if (cats.length === 0) return { ok: false, errors: { businessCategories: "Choose at least one business category." } };
  if (cats.length > MAX_BUSINESS_CATEGORIES) return { ok: false, errors: { businessCategories: `Choose at most ${MAX_BUSINESS_CATEGORIES} categories.` } };

  const chosen = new Set(cats.filter((c) => !c.custom).map((c) => c.code));
  const subs: BusinessSelection["subCategories"] = [];
  const seenSub = new Set<string>();
  for (const code of subCodes) {
    if (isCustomCode(code)) {
      const name = cleanCustomName(code.slice(CUSTOM_PREFIX.length));
      if (name.length >= 2 && !seenSub.has(`c:${name.toLowerCase()}`)) {
        seenSub.add(`c:${name.toLowerCase()}`);
        subs.push({ code: `${CUSTOM_PREFIX}${name}`, name, custom: true });
      }
      continue;
    }
    const owner = code.split(":")[0];
    const sub = chosen.has(owner) ? byCode.get(owner)?.subs.find((x) => x.code === code) : undefined;
    if (sub && !seenSub.has(sub.code)) {
      seenSub.add(sub.code);
      subs.push({ code: sub.code, name: sub.name, categoryCode: owner });
    }
  }
  if (subs.length === 0) return { ok: false, errors: { businessSubCategories: "Choose at least one sub-category." } };
  if (subs.length > MAX_BUSINESS_SUBCATEGORIES) return { ok: false, errors: { businessSubCategories: `Choose at most ${MAX_BUSINESS_SUBCATEGORIES} sub-categories.` } };
  return { ok: true, value: { standard: "ISIC Rev.4 (extended)", categories: cats, subCategories: subs } };
}

/** A valid sample submission (an IT category and its first sub-category) — for tests and seeders. */
export function sampleBusinessInput(): { categories: string[]; subCategories: string[] } {
  const c = BUSINESS_CATEGORIES.find((x) => x.code.startsWith("information-technology")) ?? BUSINESS_CATEGORIES[0];
  return { categories: [c.code], subCategories: [c.subs[0].code] };
}
