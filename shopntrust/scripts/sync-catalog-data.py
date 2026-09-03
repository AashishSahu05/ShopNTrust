import json

CATALOG_PATH = 'src/lib/catalog-data.json'

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    products = json.load(f)

prod_map = {p['product_id']: p for p in products}

updates_and_new = [
    {
        "product_id": "P148",
        "name": "Micronised Creatine Powder",
        "brand": "Optimum Nutrition (ON)",
        "category": "nutrition",
        "categoryDisplay": "Sports Nutrition",
        "subCategory": "Creatine",
        "productType": "Creatine Monohydrate Powder",
        "description": "100% pure micronised creatine monohydrate to support explosive strength, power, and muscle recovery without fillers.",
        "price": 1499,
        "mrp": 1999,
        "currency": "INR",
        "image": "/images/products/P148.jpg",
        "images": ["/images/products/P148.jpg"],
        "rating": 4.5,
        "reviewCount": 546,
        "stockStatus": "in_stock",
        "stockQuantity": 16,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹99",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Optimum Nutrition (ON)",
            "Form": "Micronised Powder",
            "Net Weight": "250g",
            "Servings": "83"
        },
        "rawSpecs": "100% Pure Creatine Monohydrate, Unflavoured",
        "featuresList": [
            "100% pure micronised creatine monohydrate",
            "Enhances ATP muscle energy replenishment",
            "Zero fillers, zero added sugars, mixes easily"
        ],
        "benefits": [
            "Accelerates strength gains and power output",
            "Faster recovery between high-intensity sets"
        ],
        "useCases": [
            "Post-workout recovery",
            "Strength training & powerlifting",
            "CrossFit & athletic conditioning"
        ],
        "targetCustomer": ["Gym-goers", "Strength athletes", "Fitness enthusiasts"],
        "occasion": ["Daily post-workout nutrition", "Pre-workout energy stack"],
        "crossSellIds": ["P149", "P150"],
        "upsellIds": ["P151"],
        "featured": False,
        "trending": True,
        "tags": ["nutrition", "creatine", "optimum nutrition", "supplements"]
    },
    {
        "product_id": "P149",
        "name": "Glutamine Powder",
        "brand": "Optimum Nutrition (ON)",
        "category": "nutrition",
        "categoryDisplay": "Sports Nutrition",
        "subCategory": "Amino Acids",
        "productType": "L-Glutamine Powder",
        "description": "Pure unflavored L-Glutamine powder for accelerated muscle repair, immune support, and gut health.",
        "price": 1899,
        "mrp": 2399,
        "currency": "INR",
        "image": "/images/products/P149.jpg",
        "images": ["/images/products/P149.jpg"],
        "rating": 4.2,
        "reviewCount": 812,
        "stockStatus": "in_stock",
        "stockQuantity": 18,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Optimum Nutrition (ON)",
            "Form": "Pure Powder",
            "Net Weight": "300g",
            "Servings": "60 Servings"
        },
        "rawSpecs": "Free-form L-Glutamine 5g per serving",
        "featuresList": [
            "5g pure free-form L-Glutamine per serving",
            "Unflavored for easy stacking with protein",
            "Supports intestinal and immune health"
        ],
        "benefits": [
            "Reduces muscle soreness after heavy lifting",
            "Restores plasma glutamine levels depleted by exercise"
        ],
        "useCases": ["Post-workout recovery", "Intense training cycles"],
        "targetCustomer": ["Bodybuilders", "Endurance athletes"],
        "occasion": ["Post-workout, bedtime"],
        "crossSellIds": ["P148", "P150"],
        "upsellIds": ["P151"],
        "featured": False,
        "trending": False,
        "tags": ["nutrition", "glutamine", "optimum nutrition", "supplements"]
    },
    {
        "product_id": "P150",
        "name": "BCAA 5000 Powder",
        "brand": "Optimum Nutrition (ON)",
        "category": "nutrition",
        "categoryDisplay": "Sports Nutrition",
        "subCategory": "Intra-Workout",
        "productType": "Branched Chain Amino Acids",
        "description": "5g of pure BCAAs in a proven 2:1:1 ratio to preserve muscle tissue and boost endurance during grueling workouts.",
        "price": 2199,
        "mrp": 2699,
        "currency": "INR",
        "image": "/images/products/P150.jpg",
        "images": ["/images/products/P150.jpg"],
        "rating": 4.6,
        "reviewCount": 560,
        "stockStatus": "in_stock",
        "stockQuantity": 25,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Optimum Nutrition (ON)",
            "Ratio": "2:1:1 Leucine, Isoleucine, Valine",
            "Net Weight": "380g"
        },
        "rawSpecs": "5g BCAAs per scoop, Instantized Formula",
        "featuresList": [
            "5g blended BCAAs per scoop",
            "Zero sugar and zero calories",
            "Instantized for smooth dissolution"
        ],
        "benefits": [
            "Prevents muscle catabolism during fasted training",
            "Boosts muscular endurance and delays fatigue"
        ],
        "useCases": ["Intra-workout hydration", "Pre-workout endurance"],
        "targetCustomer": ["Athletes", "Fasted cardio practitioners"],
        "occasion": ["During workouts, between meals"],
        "crossSellIds": ["P148", "P149"],
        "upsellIds": ["P151"],
        "featured": False,
        "trending": True,
        "tags": ["nutrition", "bcaa", "amino acids", "optimum nutrition"]
    },
    {
        "product_id": "P151",
        "name": "Gold Standard 100% Whey Protein Powder | 5 lbs (2.27 kg)",
        "brand": "Optimum Nutrition (ON)",
        "category": "nutrition",
        "categoryDisplay": "Sports Nutrition",
        "subCategory": "Whey Protein",
        "productType": "Protein Powder 5 lbs",
        "description": "High-value 5 lb tub delivering 73 servings of pure whey isolate blend, 24g protein per scoop, and 5.5g naturally occurring BCAAs.",
        "price": 8499,
        "mrp": 9999,
        "currency": "INR",
        "image": "/images/products/P151.jpg",
        "images": ["/images/products/P151.jpg"],
        "rating": 4.2,
        "reviewCount": 551,
        "stockStatus": "in_stock",
        "stockQuantity": 22,
        "deliveryEstimate": "6 days",
        "deliveryDays": 6,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Optimum Nutrition (ON)",
            "Size": "5 lbs (2.27 kg)",
            "Servings": "73",
            "Protein per Serving": "24g",
            "Flavour": "Double Rich Chocolate"
        },
        "rawSpecs": "Whey Protein Isolate Primary Source, 5.5g BCAAs, 4g Glutamine",
        "featuresList": [
            "Primary source Whey Protein Isolate (WPI)",
            "Over 5.5g BCAAs and 4g Glutamine",
            "Banned substance tested, Informed-Choice certified"
        ],
        "benefits": [
            "Maximum value 5-pound bulk supply",
            "Fast-digesting post-workout protein delivery"
        ],
        "useCases": ["Post-workout recovery shake", "Morning protein smoothie"],
        "targetCustomer": ["Regular gym members", "Bodybuilders", "High-protein meal planners"],
        "occasion": ["Daily recovery, breakfast shake"],
        "crossSellIds": ["P148", "P149", "P150"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["nutrition", "whey protein", "5 lbs", "optimum nutrition", "protein powder"]
    },
    {
        "product_id": "P152",
        "name": "ASUS Vivobook 15",
        "brand": "ASUS",
        "category": "laptops",
        "categoryDisplay": "Laptops & Computers",
        "subCategory": "Thin & Light Laptops",
        "productType": "Everyday Laptop",
        "description": "15.6-inch FHD anti-glare display, Intel Core i5 processor, 16GB RAM, 512GB SSD, with fingerprint sensor and military-grade durability.",
        "price": 49990,
        "mrp": 59990,
        "currency": "INR",
        "image": "/images/products/P152.jpg",
        "images": ["/images/products/P152.jpg"],
        "rating": 4.1,
        "reviewCount": 861,
        "stockStatus": "in_stock",
        "stockQuantity": 18,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "ASUS",
            "Processor": "Intel Core i5-1335U",
            "RAM": "16GB DDR4",
            "Storage": "512GB NVMe SSD",
            "Display": "15.6-inch FHD (1920x1080) 60Hz"
        },
        "rawSpecs": "Intel Core i5, 16GB RAM, 512GB SSD, 15.6\" FHD Display",
        "featuresList": [
            "NanoEdge slim bezel display",
            "180-degree lay-flat hinge",
            "ASUS Antimicrobial Guard Plus protection"
        ],
        "benefits": [
            "Reliable everyday performance for multitasking and office work",
            "Crisp anti-glare screen for long study sessions"
        ],
        "useCases": ["College coursework", "Remote office work", "Web browsing & streaming"],
        "targetCustomer": ["Students", "Office professionals", "Budget laptop seekers"],
        "occasion": ["Daily study, home workstation, commuting"],
        "crossSellIds": ["P119", "P161"],
        "upsellIds": ["P153", "P154"],
        "featured": False,
        "trending": False,
        "tags": ["laptops", "asus", "vivobook", "intel i5", "computers"]
    },
    {
        "product_id": "P153",
        "name": "ASUS TUF Gaming A15 / F15",
        "brand": "ASUS",
        "category": "laptops",
        "categoryDisplay": "Gaming & Laptops",
        "subCategory": "Gaming Laptops",
        "productType": "High-Performance Gaming Laptop",
        "description": "High-framerate 144Hz IPS display, AMD Ryzen 7 / Intel Core i7, NVIDIA GeForce RTX graphics, and dual-fan anti-dust thermal system.",
        "price": 74990,
        "mrp": 89990,
        "currency": "INR",
        "image": "/images/products/P153.jpg",
        "images": ["/images/products/P153.jpg"],
        "rating": 4.7,
        "reviewCount": 666,
        "stockStatus": "in_stock",
        "stockQuantity": 18,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹99",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "ASUS",
            "GPU": "NVIDIA GeForce RTX 4050 6GB",
            "Display": "15.6-inch FHD 144Hz IPS",
            "RAM": "16GB DDR5",
            "Storage": "512GB PCIe 4.0 SSD"
        },
        "rawSpecs": "NVIDIA RTX 4050, 144Hz Display, Dual-Fan Cooling",
        "featuresList": [
            "Military-grade MIL-STD-810H durability",
            "MUX Switch with NVIDIA Advanced Optimus",
            "Arc Flow Fans with 84 curved blades"
        ],
        "benefits": [
            "Smooth competitive 144Hz AAA gaming",
            "Handles heavy 3D rendering and video editing effortlessly"
        ],
        "useCases": ["Competitive esports", "AAA PC gaming", "Video rendering and 3D modeling"],
        "targetCustomer": ["Gamers", "Creators", "Engineering students"],
        "occasion": ["Weekend gaming, competitive play, creator sessions"],
        "crossSellIds": ["P164", "P165", "P161"],
        "upsellIds": ["P154"],
        "featured": True,
        "trending": True,
        "tags": ["laptops", "gaming", "asus tuf", "rtx 4050", "gaming laptop"]
    },
    {
        "product_id": "P154",
        "name": "ASUS Zenbook S 14 / 16",
        "brand": "ASUS",
        "category": "laptops",
        "categoryDisplay": "Laptops & Computers",
        "subCategory": "Premium OLED Ultrabooks",
        "productType": "Intel Core Ultra AI Laptop",
        "description": "Ultra-slim Ceraluminum chassis, 3K 120Hz Lumina OLED display, Intel Core Ultra 7 processor with built-in NPU for on-device AI.",
        "price": 104990,
        "mrp": 124990,
        "currency": "INR",
        "image": "/images/products/P154.jpg",
        "images": ["/images/products/P154.jpg"],
        "rating": 4.2,
        "reviewCount": 891,
        "stockStatus": "in_stock",
        "stockQuantity": 19,
        "deliveryEstimate": "3 days",
        "deliveryDays": 3,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "ASUS",
            "Processor": "Intel Core Ultra 7 258V (47 NPU TOPS)",
            "Display": "14-inch 3K (2880x1800) 120Hz Lumina OLED",
            "RAM": "32GB LPDDR5X",
            "Storage": "1TB PCIe 4.0 SSD"
        },
        "rawSpecs": "Intel Core Ultra 7, 3K 120Hz OLED, Ceraluminum Chassis",
        "featuresList": [
            "Pioneering Ceraluminum ceramic material body",
            "72Wh battery with up to 27 hours runtime",
            "4-speaker Harman Kardon Dolby Atmos audio"
        ],
        "benefits": [
            "Featherweight 1.2kg premium portability",
            "Blazing on-device AI acceleration and stunning 3K OLED visuals"
        ],
        "useCases": ["Executive travel", "AI development & data analysis", "Creative photo & 4K video editing"],
        "targetCustomer": ["Tech executives", "Software architects", "Creative directors"],
        "occasion": ["Business travel, boardroom presentations, creative work"],
        "crossSellIds": ["P161", "P162", "P119"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["laptops", "asus zenbook", "oled", "intel core ultra", "ai pc"]
    },
    {
        "product_id": "P155",
        "sku": "UH-R-01",
        "name": "Ultrahuman Ring Air",
        "brand": "Ultrahuman",
        "category": "wearables",
        "categoryDisplay": "Smart Rings & Wearables",
        "subCategory": "Smart Rings",
        "productType": "Health Tracker",
        "description": "Ultra-lightweight titanium smart ring for advanced sleep, recovery, and fitness tracking.",
        "shortDescription": "Smart fitness ring",
        "price": 24999,
        "mrp": 27999,
        "discountPercentage": 10,
        "currency": "INR",
        "image": "/images/products/P155.jpg",
        "images": [
            "/images/products/P155.jpg",
            "/images/products/P155_2.jpg",
            "/images/products/P155_3.jpg"
        ],
        "rating": 4.6,
        "reviewCount": 1204,
        "stockStatus": "in_stock",
        "stockQuantity": 45,
        "deliveryEstimate": "3 days",
        "deliveryDays": 3,
        "shippingCharge": "₹99",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Ultrahuman",
            "Weight": "2.4g",
            "Material": "Fighter jet titanium",
            "Battery Life": "6-day battery",
            "Connectivity": "Bluetooth 5.0"
        },
        "rawSpecs": "2.4g weight, Fighter jet titanium, 6-day battery, Bluetooth 5.0",
        "featuresList": [
            "Heart rate, HRV, temperature sensor, sleep staging",
            "2.4g featherweight titanium construction",
            "6-day uninterrupted battery life"
        ],
        "benefits": [
            "Frictionless 24/7 health tracking without a bulky screen",
            "Precise circadian rhythm and sleep phase optimization"
        ],
        "useCases": [
            "Sleep tracking, daily workout logging, and recovery monitoring"
        ],
        "targetCustomer": ["Biohackers", "Fitness enthusiasts", "Athletes"],
        "occasion": ["Daily wear, gym sessions, sleep tracking"],
        "crossSellIds": ["P156"],
        "upsellIds": ["P157"],
        "featured": True,
        "trending": True,
        "tags": ["wearables", "smart rings", "ultrahuman", "fitness tracker", "health"]
    },
    {
        "product_id": "P156",
        "sku": "UH-C-02",
        "name": "Ring Protector Case",
        "brand": "Ultrahuman",
        "category": "accessories",
        "categoryDisplay": "Wearable Accessories",
        "subCategory": "Wearable Cases",
        "productType": "Protective Cover",
        "description": "Durable silicone outer shell designed specifically for Ultrahuman Ring Air to prevent scratches during heavy lifting.",
        "shortDescription": "Silicone ring protector",
        "price": 999,
        "mrp": 1199,
        "discountPercentage": 15,
        "currency": "INR",
        "image": "/images/products/P156.jpg",
        "images": [
            "/images/products/P156.jpg",
            "/images/products/P156_2.jpg"
        ],
        "rating": 4.3,
        "reviewCount": 850,
        "stockStatus": "in_stock",
        "stockQuantity": 120,
        "deliveryEstimate": "3 days",
        "deliveryDays": 3,
        "shippingCharge": "₹49",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Ultrahuman",
            "Material": "Medical-grade silicone",
            "Thickness": "0.5mm",
            "Compatibility": "Ultrahuman Ring Air"
        },
        "rawSpecs": "0.5mm thickness, medical-grade silicone",
        "featuresList": [
            "0.5mm ultra-thin silicone shell",
            "Anti-slip textured exterior",
            "Scratch and impact resistance"
        ],
        "benefits": [
            "Protects premium titanium finish from barbell knurling",
            "Maintains full sensor accuracy while shielding exterior"
        ],
        "useCases": [
            "Weight training and rugged outdoor activities"
        ],
        "targetCustomer": ["Gym-goers", "Weightlifters", "Crossfitters"],
        "occasion": ["High-intensity workouts, outdoor climbing"],
        "crossSellIds": [],
        "upsellIds": [],
        "featured": False,
        "trending": False,
        "tags": ["accessories", "cases", "ultrahuman", "protector"]
    },
    {
        "product_id": "P157",
        "sku": "UH-T-03",
        "name": "Ultrahuman Ring Pro",
        "brand": "Ultrahuman",
        "category": "wearables",
        "categoryDisplay": "Smart Rings & Wearables",
        "subCategory": "Smart Rings",
        "productType": "Health Tracker",
        "description": "Enhanced pro version with deeper metrics, live stress tracking, and extended 8-day battery life.",
        "shortDescription": "Premium smart fitness ring",
        "price": 34999,
        "mrp": 36999,
        "discountPercentage": 5,
        "currency": "INR",
        "image": "/images/products/P157.jpg",
        "images": [
            "/images/products/P157.jpg",
            "/images/products/P157_2.jpg"
        ],
        "rating": 4.8,
        "reviewCount": 420,
        "stockStatus": "in_stock",
        "stockQuantity": 15,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Ultrahuman",
            "Material": "Grade 5 Titanium",
            "Battery Life": "8-day battery",
            "Sensors": "Advanced PPG + Skin Temperature + Stress"
        },
        "rawSpecs": "Grade 5 Titanium, 8-day battery, Advanced sensors",
        "featuresList": [
            "Live stress score monitoring",
            "Advanced blood oxygen (SpO2) analytics",
            "Grade 5 Titanium with diamond-like coating"
        ],
        "benefits": [
            "Comprehensive elite health insights in a sleek form",
            "Industry-leading 8-day continuous battery performance"
        ],
        "useCases": [
            "Professional athletic training and deep health analytics"
        ],
        "targetCustomer": ["Professional athletes", "Corporate executives", "Health purists"],
        "occasion": ["24/7 continuous wear, high-stress boardroom work"],
        "crossSellIds": ["P156"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["wearables", "smart rings", "ultrahuman", "pro", "health tracker"]
    },
    {
        "product_id": "P158",
        "sku": "ARD-O-01",
        "name": "Arduino Oplà IoT Kit",
        "brand": "Arduino",
        "category": "accessories",
        "categoryDisplay": "Microcontrollers & IoT",
        "subCategory": "Microcontrollers",
        "productType": "IoT Dev Kit",
        "description": "Complete kit for building smart devices. Includes MKR WiFi 1010, OLED display, and environmental sensors.",
        "shortDescription": "IoT starter development kit",
        "price": 9999,
        "mrp": 11499,
        "discountPercentage": 12,
        "currency": "INR",
        "image": "/images/products/P158.jpg",
        "images": ["/images/products/P158.jpg"],
        "rating": 4.7,
        "reviewCount": 935,
        "stockStatus": "in_stock",
        "stockQuantity": 30,
        "deliveryEstimate": "2 days",
        "deliveryDays": 2,
        "shippingCharge": "₹99",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Arduino",
            "Board": "MKR WiFi 1010",
            "Display": "Circular OLED",
            "Controls": "Capacitive Touch Buttons",
            "Relays": "24V Relays"
        },
        "rawSpecs": "MKR WiFi 1010, circular OLED, touch buttons, 24V relays",
        "featuresList": [
            "MKR WiFi 1010 IoT board included",
            "Integrated circular OLED screen and capacitive touch",
            "Native Arduino Cloud integration and app dashboards"
        ],
        "benefits": [
            "Fast prototyping for connected IoT devices",
            "Complete out-of-the-box system without soldering"
        ],
        "useCases": [
            "Building automated pipelines, basic electronics setups, and smart home hubs"
        ],
        "targetCustomer": ["Engineering students", "Tech innovators", "Hardware hackers"],
        "occasion": ["Hackathons, college projects, competitive coding events"],
        "crossSellIds": ["P159"],
        "upsellIds": ["P160"],
        "featured": True,
        "trending": False,
        "tags": ["electronics", "arduino", "iot", "microcontrollers", "development kit"]
    },
    {
        "product_id": "P159",
        "sku": "ARD-S-02",
        "name": "DHT11 & Servo Motor Pack",
        "brand": "Arduino",
        "category": "accessories",
        "categoryDisplay": "Electronics Components",
        "subCategory": "Components",
        "productType": "Sensor & Motor Kit",
        "description": "Essential add-on pack featuring DHT11 temperature/humidity sensors and precision servo motors.",
        "shortDescription": "Sensor and motor expansion",
        "price": 899,
        "mrp": 1149,
        "discountPercentage": 20,
        "currency": "INR",
        "image": "/images/products/P159.jpg",
        "images": ["/images/products/P159.jpg"],
        "rating": 4.5,
        "reviewCount": 1450,
        "stockStatus": "in_stock",
        "stockQuantity": 85,
        "deliveryEstimate": "2 days",
        "deliveryDays": 2,
        "shippingCharge": "₹49",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Arduino",
            "Motor": "5V DC Micro Servo (SG90)",
            "Sensor": "DHT11 Digital Humidity & Temp",
            "Compatibility": "Arduino, Raspberry Pi, ESP32"
        },
        "rawSpecs": "5V DC servo, DHT11 digital output",
        "featuresList": [
            "5V DC high-precision micro servo motor",
            "DHT11 calibrated digital temperature & humidity sensor",
            "Breadboard-friendly header cables included"
        ],
        "benefits": [
            "Expands base kit capabilities instantly for automation",
            "Plug-and-play with simple Arduino libraries"
        ],
        "useCases": [
            "Circuit building, environmental sensing, and physical automation"
        ],
        "targetCustomer": ["Hobbyists", "B.Tech CSE students", "Makers"],
        "occasion": ["Robotics competitions, weekend DIY electronics"],
        "crossSellIds": [],
        "upsellIds": [],
        "featured": False,
        "trending": False,
        "tags": ["electronics", "sensors", "servo", "arduino", "diy"]
    },
    {
        "product_id": "P160",
        "sku": "ARD-P-03",
        "name": "Arduino Portenta H7",
        "brand": "Arduino",
        "category": "accessories",
        "categoryDisplay": "Pro Microcontrollers",
        "subCategory": "Microcontrollers",
        "productType": "Pro Dev Board",
        "description": "High-performance dual-core board capable of running machine learning models and heavy AI workflows.",
        "shortDescription": "Pro-grade AI microcontroller",
        "price": 12499,
        "mrp": 13599,
        "discountPercentage": 8,
        "currency": "INR",
        "image": "/images/products/P160.jpg",
        "images": ["/images/products/P160.jpg"],
        "rating": 4.9,
        "reviewCount": 215,
        "stockStatus": "in_stock",
        "stockQuantity": 12,
        "deliveryEstimate": "5 days",
        "deliveryDays": 5,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Arduino",
            "Processor": "STM32H747XI dual Cortex-M7 (480 MHz) + M4 (240 MHz)",
            "Memory": "8MB SDRAM + 16MB NOR Flash",
            "Wireless": "Murata 1DX Wi-Fi/Bluetooth module"
        },
        "rawSpecs": "STM32H747XI dual Cortex-M7+M4",
        "featuresList": [
            "Simultaneous dual-core processing (M7 + M4)",
            "MicroPython and TensorFlow Lite AI deployment ready",
            "Hardware secure element for cryptographic operations"
        ],
        "benefits": [
            "Enterprise-grade AI inference in a micro form factor",
            "Industrial temperature rating (-40°C to +85°C)"
        ],
        "useCases": [
            "Edge computing, autonomous agents, and industrial IoT"
        ],
        "targetCustomer": ["Advanced developers", "ML engineers", "Robotics labs"],
        "occasion": ["Industrial prototyping, advanced AI research"],
        "crossSellIds": ["P159"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["electronics", "arduino", "portenta", "ai", "edge computing"]
    },
    {
        "product_id": "P161",
        "sku": "LOG-M-01",
        "name": "Logitech MX Master 3S",
        "brand": "Logitech",
        "category": "accessories",
        "categoryDisplay": "Computer Peripherals",
        "subCategory": "Mice",
        "productType": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with 8K DPI tracking, MagSpeed scrolling, and quiet clicks.",
        "shortDescription": "Premium productivity mouse",
        "price": 8999,
        "mrp": 9999,
        "discountPercentage": 10,
        "currency": "INR",
        "image": "/images/products/P161.jpg",
        "images": ["/images/products/P161.jpg"],
        "rating": 4.8,
        "reviewCount": 3102,
        "stockStatus": "in_stock",
        "stockQuantity": 60,
        "deliveryEstimate": "2 days",
        "deliveryDays": 2,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Logitech",
            "Sensor": "Darkfield 8000 DPI track-on-glass",
            "Scrolling": "MagSpeed Electromagnetic wheel",
            "Battery Life": "Up to 70 days on full charge",
            "Connectivity": "Bluetooth Low Energy + Logi Bolt"
        },
        "rawSpecs": "8000 DPI, USB-C fast charging, Bluetooth/Logi Bolt",
        "featuresList": [
            "Quiet Click technology with 90% less click noise",
            "MagSpeed electromagnetic scroll wheel (1,000 lines/sec)",
            "Cross-computer Flow control across macOS and Windows"
        ],
        "benefits": [
            "Reduces wrist strain during long coding and design sessions",
            "Tracks seamlessly on any surface, including clear glass"
        ],
        "useCases": [
            "Writing Python/C code, designing UI in Figma, and heavy multitasking"
        ],
        "targetCustomer": ["Developers", "Designers", "Power users"],
        "occasion": ["Daily workstation setup, productivity workflows"],
        "crossSellIds": ["P162"],
        "upsellIds": ["P163"],
        "featured": True,
        "trending": True,
        "tags": ["accessories", "logitech", "mx master 3s", "mouse", "productivity"]
    },
    {
        "product_id": "P162",
        "sku": "LOG-D-02",
        "name": "Logitech Desk Mat",
        "brand": "Logitech",
        "category": "accessories",
        "categoryDisplay": "Computer Peripherals",
        "subCategory": "Mousepads",
        "productType": "Desk Accessory",
        "description": "Anti-slip, spill-resistant desk mat that provides a smooth glide for high-end mice.",
        "shortDescription": "Premium desk mat",
        "price": 1499,
        "mrp": 1999,
        "discountPercentage": 25,
        "currency": "INR",
        "image": "/images/products/P162.jpg",
        "images": ["/images/products/P162.jpg"],
        "rating": 4.4,
        "reviewCount": 1890,
        "stockStatus": "in_stock",
        "stockQuantity": 150,
        "deliveryEstimate": "2 days",
        "deliveryDays": 2,
        "shippingCharge": "₹49",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Logitech",
            "Dimensions": "30 cm x 70 cm",
            "Material": "Spill-resistant recycled polyester",
            "Base": "Anti-slip natural rubber"
        },
        "rawSpecs": "30cm x 70cm, spill-resistant coating",
        "featuresList": [
            "Spill-resistant coating for easy wipe-downs",
            "Anti-fraying flat-stitched perimeter edges",
            "Non-slip rubber base keeps mat anchored"
        ],
        "benefits": [
            "Enhances workstation aesthetics and tracking consistency",
            "Protects premium wood and glass desks from scratches"
        ],
        "useCases": [
            "Desk organization and smoother mouse tracking"
        ],
        "targetCustomer": ["Professionals", "Remote workers", "Desk setup enthusiasts"],
        "occasion": ["Workspace upgrade, home office setup"],
        "crossSellIds": [],
        "upsellIds": [],
        "featured": False,
        "trending": False,
        "tags": ["accessories", "desk mat", "logitech", "mousepad", "office"]
    },
    {
        "product_id": "P163",
        "sku": "LOG-K-03",
        "name": "MX Keys Wireless Combo",
        "brand": "Logitech",
        "category": "accessories",
        "categoryDisplay": "Computer Peripherals",
        "subCategory": "Keyboards",
        "productType": "Keyboard & Mouse",
        "description": "The ultimate productivity bundle featuring the MX Keys advanced illuminated keyboard and MX Master 3S.",
        "shortDescription": "Premium wireless combo",
        "price": 18990,
        "mrp": 22490,
        "discountPercentage": 15,
        "currency": "INR",
        "image": "/images/products/P163.jpg",
        "images": ["/images/products/P163.jpg"],
        "rating": 4.7,
        "reviewCount": 1125,
        "stockStatus": "in_stock",
        "stockQuantity": 25,
        "deliveryEstimate": "3 days",
        "deliveryDays": 3,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Logitech",
            "Keys": "Spherically dished Perfect Stroke keys",
            "Illumination": "Smart hand-proximity backlighting",
            "Pairing": "Multi-OS, up to 3 devices simultaneously"
        },
        "rawSpecs": "Perfect Stroke keys, Smart illumination, Multi-device",
        "featuresList": [
            "Perfect Stroke keys shaped for fingertips",
            "Smart backlighting turns on as hands approach",
            "Easy-Switch between 3 computers with Logitech Flow"
        ],
        "benefits": [
            "Ultimate setup for typing speed, accuracy, and comfort",
            "Single unifying receiver or Bluetooth connection"
        ],
        "useCases": [
            "Cross-computer control, rapid typing, and seamless workflow management"
        ],
        "targetCustomer": ["Software engineers", "Content creators", "Tech leads"],
        "occasion": ["Full desk overhaul, high-productivity coding sessions"],
        "crossSellIds": ["P162"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["accessories", "keyboards", "logitech", "mx keys", "combo"]
    },
    {
        "product_id": "P164",
        "sku": "SNY-P-01",
        "name": "PlayStation 5 Slim",
        "brand": "Sony",
        "category": "gaming",
        "categoryDisplay": "Gaming Consoles",
        "subCategory": "Consoles",
        "productType": "Gaming Console",
        "description": "The new, slimmer PS5 offering lightning-fast loading with an ultra-high-speed SSD and 4K gaming.",
        "shortDescription": "Next-gen 4K gaming console",
        "price": 44990,
        "mrp": 49990,
        "discountPercentage": 10,
        "currency": "INR",
        "image": "/images/products/P164.jpg",
        "images": ["/images/products/P164.jpg"],
        "rating": 4.9,
        "reviewCount": 15240,
        "stockStatus": "in_stock",
        "stockQuantity": 40,
        "deliveryEstimate": "4 days",
        "deliveryDays": 4,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Sony",
            "Storage": "1TB Custom NVMe SSD",
            "Output": "4K 120Hz, HDR, Tempest 3D AudioTech",
            "Optical Drive": "Ultra HD Blu-ray (or Digital Edition modular)"
        },
        "rawSpecs": "1TB SSD, Ray Tracing, 120Hz output",
        "featuresList": [
            "Custom 1TB ultra-high-speed NVMe SSD",
            "Ray tracing hardware acceleration for lifelike shadows",
            "Tempest 3D AudioTech spatial sound engine"
        ],
        "benefits": [
            "Near-instant loading screens across next-gen titles",
            "30% smaller volume and 18% lighter form factor"
        ],
        "useCases": [
            "Immersive AAA gaming and competitive e-sports"
        ],
        "targetCustomer": ["Gamers", "Competitive players", "Living room entertainment seekers"],
        "occasion": ["Weekend gaming, e-sports tournaments, multiplayer gaming"],
        "crossSellIds": ["P165"],
        "upsellIds": ["P166"],
        "featured": True,
        "trending": True,
        "tags": ["gaming", "playstation", "ps5", "sony", "console"]
    },
    {
        "product_id": "P165",
        "sku": "SNY-C-02",
        "name": "DualSense Controller",
        "brand": "Sony",
        "category": "gaming",
        "categoryDisplay": "Gaming Accessories",
        "subCategory": "Accessories",
        "productType": "Wireless Controller",
        "description": "Extra DualSense wireless controller featuring immersive haptic feedback and dynamic adaptive triggers.",
        "shortDescription": "PS5 wireless controller",
        "price": 5499,
        "mrp": 6490,
        "discountPercentage": 15,
        "currency": "INR",
        "image": "/images/products/P165.jpg",
        "images": ["/images/products/P165.jpg"],
        "rating": 4.8,
        "reviewCount": 8450,
        "stockStatus": "in_stock",
        "stockQuantity": 95,
        "deliveryEstimate": "3 days",
        "deliveryDays": 3,
        "shippingCharge": "₹99",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Sony",
            "Feedback": "Dual actuators haptic feedback",
            "Triggers": "Dynamic adaptive resistance triggers",
            "Audio": "Built-in microphone and 3.5mm jack",
            "Charging": "USB Type-C"
        },
        "rawSpecs": "Bluetooth 5.1, USB-C, built-in mic",
        "featuresList": [
            "Haptic feedback replaces traditional rumble motors",
            "Adaptive triggers simulate tension of bows and vehicle pedals",
            "Create button to capture and broadcast gameplay"
        ],
        "benefits": [
            "Physical sensations that simulate in-game actions realistically",
            "Essential companion for local 2-player multiplayer sessions"
        ],
        "useCases": [
            "Multiplayer gaming, local co-op, replacement controller"
        ],
        "targetCustomer": ["Console owners", "Multiplayer enthusiasts"],
        "occasion": ["Multiplayer sessions, FIFA/Madden tournaments, couch co-op"],
        "crossSellIds": [],
        "upsellIds": [],
        "featured": False,
        "trending": True,
        "tags": ["gaming", "controller", "dualsense", "ps5", "sony"]
    },
    {
        "product_id": "P166",
        "sku": "SNY-P-03",
        "name": "PlayStation 5 Pro",
        "brand": "Sony",
        "category": "gaming",
        "categoryDisplay": "Gaming Consoles",
        "subCategory": "Consoles",
        "productType": "Premium Console",
        "description": "Upgraded PS5 Pro with advanced GPU for unmatched graphical fidelity and higher frame rates.",
        "shortDescription": "Ultra-premium 4K console",
        "price": 59990,
        "mrp": 59990,
        "discountPercentage": 0,
        "currency": "INR",
        "image": "/images/products/P166.jpg",
        "images": ["/images/products/P166.jpg"],
        "rating": 4.9,
        "reviewCount": 3110,
        "stockStatus": "in_stock",
        "stockQuantity": 10,
        "deliveryEstimate": "5 days",
        "deliveryDays": 5,
        "shippingCharge": "₹0",
        "returnable": True,
        "returnWindowDays": 7,
        "specifications": {
            "Brand": "Sony",
            "GPU": "Upgraded GPU with 67% more Compute Units and 28% faster memory",
            "Storage": "2TB Custom NVMe SSD",
            "AI Upscaling": "PlayStation Spectral Super Resolution (PSSR)",
            "Ray Tracing": "Advanced 2x-3x faster ray tracing reflections"
        },
        "rawSpecs": "2TB SSD, Advanced Ray Tracing, PSSR AI Upscaling",
        "featuresList": [
            "PlayStation Spectral Super Resolution (PSSR) AI upscaling",
            "Massive 2TB custom high-speed NVMe internal storage",
            "Advanced Ray Tracing with dynamic reflections and refractions"
        ],
        "benefits": [
            "Eliminates fidelity vs performance mode dilemma (Play at 4K 60fps)",
            "The absolute pinnacle of home console graphics and performance"
        ],
        "useCases": [
            "Maximum performance gaming at 4K 120fps+ with ray tracing"
        ],
        "targetCustomer": ["Hardcore gamers", "Tech enthusiasts", "OLED TV owners"],
        "occasion": ["Pro gaming setups, premiere AAA title launches"],
        "crossSellIds": ["P165"],
        "upsellIds": [],
        "featured": True,
        "trending": True,
        "tags": ["gaming", "ps5 pro", "playstation", "sony", "premium console"]
    }
]

for item in updates_and_new:
    prod_map[item['product_id']] = item

# Ensure cross-sell and upsell updates from pages 4-5 of the sheet
# P101
if 'P101' in prod_map:
    prod_map['P101']['crossSellIds'] = ["P102", "P103", "P104", "P105"]
# P105
if 'P105' in prod_map:
    prod_map['P105']['crossSellIds'] = ["P102", "P103", "P104"]
    prod_map['P105']['upsellIds'] = ["P101"]
# P106
if 'P106' in prod_map:
    prod_map['P106']['crossSellIds'] = ["P108", "P109", "P110"]
# P107
if 'P107' in prod_map:
    prod_map['P107']['crossSellIds'] = ["P111", "P112", "P113"]
    prod_map['P107']['upsellIds'] = ["P106"]
# P113
if 'P113' in prod_map:
    prod_map['P113']['upsellIds'] = ["P110"]
# P112
if 'P112' in prod_map:
    prod_map['P112']['upsellIds'] = ["P109"]
# P111
if 'P111' in prod_map:
    prod_map['P111']['upsellIds'] = ["P108"]
# P115
if 'P115' in prod_map:
    prod_map['P115']['crossSellIds'] = ["P116", "P117", "P118", "P119", "P120"]
    prod_map['P115']['upsellIds'] = ["P114"]
# P114
if 'P114' in prod_map:
    prod_map['P114']['crossSellIds'] = ["P116", "P117", "P118", "P119", "P120"]
# P134
if 'P134' in prod_map:
    prod_map['P134']['crossSellIds'] = ["P135", "P136", "P137", "P138"]
    prod_map['P134']['upsellIds'] = ["P133"]
# P133
if 'P133' in prod_map:
    prod_map['P133']['crossSellIds'] = ["P135", "P136", "P137", "P138"]
# P124
if 'P124' in prod_map:
    prod_map['P124']['crossSellIds'] = ["P125", "P126"]
# P121
if 'P121' in prod_map:
    prod_map['P121']['crossSellIds'] = ["P122", "P123"]
# P127
if 'P127' in prod_map:
    prod_map['P127']['crossSellIds'] = ["P128", "P129"]
# P130
if 'P130' in prod_map:
    prod_map['P130']['upsellIds'] = ["P121"]
# P131
if 'P131' in prod_map:
    prod_map['P131']['upsellIds'] = ["P124"]
# P132
if 'P132' in prod_map:
    prod_map['P132']['upsellIds'] = ["P127"]
# P136
if 'P136' in prod_map:
    prod_map['P136']['crossSellIds'] = ["P137"]
# P139
if 'P139' in prod_map:
    prod_map['P139']['crossSellIds'] = ["P140", "P141", "P142"]
# P143
if 'P143' in prod_map:
    prod_map['P143']['crossSellIds'] = ["P144", "P145", "P146"]
# P147
if 'P147' in prod_map:
    prod_map['P147']['crossSellIds'] = ["P148", "P149", "P150"]
    prod_map['P147']['upsellIds'] = ["P151"]

sorted_products = sorted(prod_map.values(), key=lambda x: int(x['product_id'].replace('P', '')))

with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
    json.dump(sorted_products, f, indent=2, ensure_ascii=False)

print(f'Successfully updated catalog: {len(sorted_products)} products saved.')
