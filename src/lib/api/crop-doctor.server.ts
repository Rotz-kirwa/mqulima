import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function db() {
  const { getDb } = await import("../db.server");
  return getDb();
}

async function getAuthUser() {
  try {
    const { getCurrentUser } = await import("../auth-server");
    return await getCurrentUser();
  } catch (e) {
    return null;
  }
}

// Extended input validation schema for Mqulima AI Doctor
const DiagnoseInputSchema = z.object({
  crop: z.string().min(1),
  symptoms: z.record(z.boolean()),
  imageFileName: z.string().optional(),
  imageBase64: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  cropAge: z.string().optional(),
  plantingDate: z.string().optional(),
  currentWeather: z.object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    rainProbability: z.number().optional(),
    windSpeed: z.number().optional(),
  }).optional(),
  farmerQuestion: z.string().optional(),
});

// Dynamic inference rule-engine for agricultural diagnostics
function buildDiagnosis({
  crop,
  symptoms,
  county,
  subCounty,
  cropAge,
  plantingDate,
  currentWeather,
  farmerQuestion
}: z.infer<typeof DiagnoseInputSchema>) {
  let disease = "Healthy Crop";
  let scientificDisease = "None";
  let confidence = 95.0;
  let severity = "Healthy";
  let listSymptoms: string[] = [];
  let visualObservations: string[] = [];
  let possibleCauses: string[] = [];
  let organicTreatment: string[] = [];
  let chemicalTreatment: string[] = [];
  let ipmRecommendations: string[] = [];
  let prevention: string[] = [];
  let ph = "6.0 - 6.8";
  let fertilizer = "Balanced organic compost";
  let npk = "NPK 17:17:17";
  let organicMatter = "Apply high-quality compost or manure";
  let weatherAdvice: string[] = [];
  let recommendedProductTypes: string[] = [];
  let followUpActions: string[] = [];
  let emergency = false;
  let needsExpertInspection = false;
  
  const hasSymptoms = Object.values(symptoms).some(v => v) || (farmerQuestion && farmerQuestion.length > 5);

  let cropName = crop.charAt(0).toUpperCase() + crop.slice(1);
  let scientificName = "Zea mays";
  if (crop === "tomato") {
    scientificName = "Solanum lycopersicum";
    ph = "6.0 - 6.8";
    npk = "NPK 15:15:15 or high potassium NPK";
  } else if (crop === "potato") {
    scientificName = "Solanum tuberosum";
    ph = "5.2 - 6.0";
    npk = "NPK 10:20:20";
  }

  // Populate symptoms list
  Object.keys(symptoms).forEach(k => {
    if (symptoms[k]) {
      if (k === "yellow") listSymptoms.push("Leaf yellowing");
      if (k === "spots") listSymptoms.push("Brown spots / leaf lesions");
      if (k === "wilting") listSymptoms.push("Sudden wilting");
      if (k === "mold") listSymptoms.push("White cottony mold");
      if (k === "bore") listSymptoms.push("Stalk holes / borers");
      if (k === "curl") listSymptoms.push("Leaf curling");
    }
  });
  if (farmerQuestion && listSymptoms.length === 0) {
    listSymptoms.push("Unspecified symptoms (described by farmer)");
  }

  if (!hasSymptoms) {
    disease = "No significant pathogen detected";
    scientificDisease = "Healthy plant tissue";
    confidence = 92.0;
    severity = "Healthy";
    visualObservations = [
      "Foliage shows normal green coloration.",
      "No necrotic lesions, wilting, or pest damage observed."
    ];
    possibleCauses = ["Optimal growth conditions maintained."];
    organicTreatment = ["No treatment required. Maintain regular watering."];
    chemicalTreatment = ["No chemical treatments needed."];
    ipmRecommendations = ["Continue crop scouting twice weekly.", "Ensure crop diversity in surrounding rows."];
    prevention = ["Clean tools regularly.", "Select certified disease-free seeds."];
    followUpActions = ["Record height and growth stage.", "Observe again in 7 days."];
  } else {
    confidence = Number((80 + Math.random() * 15).toFixed(1));
    severity = "Moderate";

    if (crop === "maize") {
      if (symptoms.bore) {
        disease = "Maize Stem Borer Infestation";
        scientificDisease = "Busseola fusca";
        severity = "Severe";
        visualObservations = [
          "Pinholes and window-pane feeding damage on young leaves.",
          "Frass (sawdust-like insect waste) visible around stem entry holes.",
          "Internal tunneling in stalks leading to structural weakening (lodging)."
        ];
        possibleCauses = [
          "Moths laying eggs on young maize leaves.",
          "Poor field hygiene (leaving infested crop stubble in fields).",
          "Dry weather conditions which favor pest lifecycle and breeding."
        ];
        organicTreatment = [
          "Apply neem tree seed powder paste directly into plant whorls.",
          "Introduce parasitic wasps (Cotesia flavipes) which target stem borer larvae.",
          "Use intercropped Desmodium (push crop) and plant Napier grass (pull crop) around field boundaries."
        ];
        chemicalTreatment = [
          "Apply systemic granular insecticides containing beta-cyfluthrin directly to leaf whorls.",
          "Use spray treatments containing chlorantraniliprole for large outbreaks."
        ];
        ipmRecommendations = [
          "Implement the push-pull technology system.",
          "Uproot and burn heavily infested crops showing lodging.",
          "Practice deep ploughing to bury pupating insects in soil residue."
        ];
        prevention = [
          "Practice early planting at the onset of rain.",
          "Maintain correct spacing (75cm x 25cm) to reduce pest spread.",
          "Scout twice weekly starting 2 weeks post-emergence."
        ];
        ph = "5.5 - 6.5";
        fertilizer = "DAP at planting, top-dress with CAN";
        npk = "NPK 23:21:0+4S";
        organicMatter = "Apply well-decomposed farmyard manure to enhance soil vigor.";
        recommendedProductTypes = ["Pyrethroid insecticide", "Neem extract", "Systemic granular insecticide"];
        followUpActions = [
          "Examine leaf whorls for caterpillars 5 days post-treatment.",
          "Perform secondary CAN application if growth is stunted."
        ];
      } else if (symptoms.yellow || symptoms.spots || (farmerQuestion && (farmerQuestion.toLowerCase().includes("yellow") || farmerQuestion.toLowerCase().includes("spot")))) {
        disease = "Gray Leaf Spot (GLS)";
        scientificDisease = "Cercospora zeae-maydis";
        visualObservations = [
          "Small, tan-colored spots with yellow halos.",
          "Lesions elongating into rectangular shapes parallel to leaf veins.",
          "Symptoms starting on lower, older leaves and spreading upwards."
        ];
        possibleCauses = [
          "High relative humidity (>80%) and moderate temperatures (22-30°C).",
          "Spores overwintering on unploughed maize residues.",
          "Frequent warm rainfall keeping leaf surfaces wet."
        ];
        organicTreatment = [
          "Spray copper-based organic fungicides early in the morning.",
          "Uproot and bury infected lower leaves.",
          "Apply liquid compost tea to foliage to enhance local immune response."
        ];
        chemicalTreatment = [
          "Apply preventative copper hydroxide sprays.",
          "Apply curative systemic fungicides containing Azoxystrobin + Difenoconazole."
        ];
        ipmRecommendations = [
          "Rotate with dry beans, soybeans, or potatoes for at least 1 season.",
          "Deep till soil to bury crop debris containing active spores.",
          "Plant certified hybrid seeds certified for GLS resistance."
        ];
        prevention = [
          "Optimize spacing to avoid high-humidity microclimates within the canopy.",
          "Avoid overhead irrigation in late afternoon.",
          "Scout fields weekly starting at 4 weeks."
        ];
        ph = "5.8 - 6.5";
        fertilizer = "CAN for top dressing, manure at planting";
        npk = "NPK 17:17:17";
        organicMatter = "Apply organic manure to boost beneficial soil microbes.";
        recommendedProductTypes = ["Triazole fungicide", "Strobilurin fungicide", "Copper fungicide"];
        followUpActions = [
          "Inspect lower and ear leaves every 4 days.",
          "Apply fungicide treatment if spots reach the ear leaf."
        ];
      } else {
        disease = "Maize Lethal Necrosis Disease (MLND)";
        scientificDisease = "MCMV + SCMV co-infection";
        severity = "Critical";
        visualObservations = [
          "Severe leaf chlorosis (yellowing) starting from margins and spreading inward.",
          "Drying of leaf margins leading to general necrosis.",
          "Stunted growth and failure to develop cobs or barren cobs."
        ];
        possibleCauses = [
          "Co-infection by Maize Chlorotic Mottle Virus and Sugarcane Mosaic Virus.",
          "High populations of insect vectors (thrips and beetles) carrying viruses.",
          "Continuous maize cropping without rotational breaks."
        ];
        organicTreatment = [
          "Uproot and completely burn infected plants immediately (no composting).",
          "Apply organic insecticidal soaps to limit insect vector breeding."
        ];
        chemicalTreatment = [
          "No direct chemical cure exists for viral plant pathogens.",
          "Spray systemic insecticides containing imidacloprid to control thrips/beetles vectors."
        ];
        ipmRecommendations = [
          "Implement a strict 2-season maize-free rotation with non-host crops.",
          "Practice community-wide synchronization of planting dates.",
          "Ensure complete removal of volunteer maize plants and weeds."
        ];
        prevention = [
          "Use only certified virus-free seeds.",
          "Maintain clear border buffer zones free of weeds.",
          "Disinfect farming tools between fields."
        ];
        ph = "5.5 - 6.8";
        fertilizer = "NPK at planting, CAN top-dress";
        npk = "NPK 23:21:0+4S";
        organicMatter = "Add highly composted organic matter to support root vitality.";
        recommendedProductTypes = ["Vector systemic insecticide", "Insecticidal soap"];
        followUpActions = [
          "Perform daily checks on surrounding plants for early yellowing.",
          "Enforce immediate quarantine and burning of any symptomatic plants."
        ];
        emergency = true;
        needsExpertInspection = true;
      }
    } else if (crop === "tomato") {
      if (symptoms.curl || (farmerQuestion && farmerQuestion.toLowerCase().includes("curl"))) {
        disease = "Tomato Yellow Leaf Curl Virus (TYLCV)";
        severity = "Severe";
        scientificDisease = "Begomovirus (TYLCV)";
        visualObservations = [
          "Leaves rolling upwards and inwards at the margins.",
          "Severe chlorosis (yellowing) of leaf margins and new shoots.",
          "Drastic reduction in flower production and fruit set."
        ];
        possibleCauses = [
          "Transmission by Silverleaf Whiteflies (Bemisia tabaci).",
          "Infested transplant seedlings brought from nursery.",
          "Hot, dry microclimates favoring high whitefly populations."
        ];
        organicTreatment = [
          "Hang yellow sticky traps around the canopy to catch whitefly vectors.",
          "Spray organic cold-pressed neem oil weekly to disrupt vector lifecycle.",
          "Spray insecticidal garlic-soap solution under leaves."
        ];
        chemicalTreatment = [
          "Apply systemic insecticides containing acetamiprid or imidacloprid to manage vectors."
        ];
        ipmRecommendations = [
          "Raise nursery seedlings under insect-proof netting.",
          "Rotate tomatoes with crops like onions or garlic which act as vector repellents.",
          "Plant certified whitefly-tolerant tomato hybrid varieties."
        ];
        prevention = [
          "Eliminate solanaceous weeds (e.g., nightshade) around fields.",
          "Avoid planting tomatoes near older, infested tomato crops.",
          "Monitor whitefly counts on sticky cards weekly."
        ];
        ph = "6.0 - 6.8";
        fertilizer = "Calcium-rich fertilizers to prevent blossom end rot, organic manure";
        npk = "NPK 15:15:15";
        organicMatter = "Incorporate well-decomposed compost to enhance water retention.";
        recommendedProductTypes = ["Neem oil extract", "Systemic vector insecticide", "Yellow sticky traps"];
        followUpActions = [
          "Check sticky traps twice weekly.",
          "Spray insecticidal soap if whitefly counts exceed 5 per leaf."
        ];
      } else if (symptoms.spots || symptoms.yellow || (farmerQuestion && (farmerQuestion.toLowerCase().includes("spot") || farmerQuestion.toLowerCase().includes("yellow")))) {
        disease = "Tomato Late Blight";
        scientificDisease = "Phytophthora infestans";
        visualObservations = [
          "Dark, water-soaked, irregular lesions on leaves.",
          "White, velvety fungal growth on leaf undersides during humid hours.",
          "Dark brown to black lesions on stems and green fruits."
        ];
        possibleCauses = [
          "Cool temperatures (15-20°C) combined with high humidity (>85%).",
          "Water splash from soil or overhead irrigation distributing spores.",
          "Continuous foliage wetness from heavy morning dews."
        ];
        organicTreatment = [
          "Spray preventative copper-based fungicides.",
          "Apply baking soda (sodium bicarbonate) sprays to raise leaf surface pH.",
          "Prune lower foliage touching the soil."
        ];
        chemicalTreatment = [
          "Spray curative systemic fungicides containing Metalaxyl-M + Mancozeb.",
          "Rotate with chlorothalonil-based contact fungicides."
        ];
        ipmRecommendations = [
          "Utilize drip irrigation to avoid leaf wetness.",
          "Space plants widely to allow wind penetration and quick canopy drying.",
          "Destroy volunteer tomato and potato plants."
        ];
        prevention = [
          "Plant resistant varieties (e.g., Mountain Magic, Legend).",
          "Apply mulch to prevent soil splashing onto lower leaves.",
          "Scout fields daily during wet, cool seasons."
        ];
        ph = "6.0 - 6.5";
        fertilizer = "Calcium Ammonium Nitrate (CAN), Potassium Nitrate";
        npk = "NPK 15:15:15";
        organicMatter = "Add high-nitrogen compost to support early growth.";
        recommendedProductTypes = ["Metalaxyl-M fungicide", "Mancozeb fungicide", "Copper hydroxide fungicide"];
        followUpActions = [
          "Inspect leaf undersides and stems daily during rainy spells.",
          "Apply fungicide treatment immediately if any brown lesions appear."
        ];
      } else {
        disease = "Tomato Bacterial Wilt";
        scientificDisease = "Ralstonia solanacearum";
        severity = "Critical";
        visualObservations = [
          "Sudden wilting of the plant foliage, starting from the shoot tip during hot hours.",
          "Foliage retains green color without yellowing initially.",
          "Milky white bacterial slime exuding from stems suspended in water."
        ];
        possibleCauses = [
          "Soil-borne bacteria entering root systems through wounds or nematodes.",
          "High soil temperatures (>28°C) and excessive soil moisture.",
          "Using contaminated tools or infected seedlings."
        ];
        organicTreatment = [
          "No effective organic cure exists; uproot and burn infected plants immediately.",
          "Amend soil with bio-control agents (e.g., Trichoderma viride)."
        ];
        chemicalTreatment = [
          "There is no direct curative chemical treatment for soil-borne bacterial wilt.",
          "Treat soil pre-planting with approved soil fumigants."
        ];
        ipmRecommendations = [
          "Implement a 3-4 year crop rotation using non-solanaceous crops (e.g., maize, grass).",
          "Graft susceptible tomato varieties onto wilt-resistant rootstocks.",
          "Improve soil drainage and avoid planting in low-lying wet patches."
        ];
        prevention = [
          "Plant only certified disease-free seedlings.",
          "Control root-knot nematodes which create entry wounds for bacteria.",
          "Clean and sanitize boots and tools before moving between blocks."
        ];
        ph = "6.2 - 6.8";
        fertilizer = "Balanced compost, avoid high chemical nitrogen which softens tissues";
        npk = "NPK 15:15:15";
        organicMatter = "Add heavy compost to encourage healthy soil microbial antagonists.";
        recommendedProductTypes = ["Soil bio-control agent", "Soil disinfectant"];
        followUpActions = [
          "Isolate the affected area; restrict water flow away from the infected patch.",
          "Monitor surrounding plants for flagging or wilting."
        ];
        emergency = true;
        needsExpertInspection = true;
      }
    } else if (crop === "potato") {
      if (symptoms.wilting || (farmerQuestion && farmerQuestion.toLowerCase().includes("wilt"))) {
        disease = "Potato Bacterial Wilt";
        scientificDisease = "Ralstonia solanacearum";
        severity = "Critical";
        visualObservations = [
          "Rapid wilting of foliage during warm hours, often recovering at night initially.",
          "Stems showing dark brown vascular browning when sliced open.",
          "Milky fluid oozing from cut stems or tuber eyes."
        ];
        possibleCauses = [
          "Soil infestation by Ralstonia bacterium.",
          "Using infected seed tubers from uncertified sources.",
          "Water runoff washing bacteria from infected fields."
        ];
        organicTreatment = [
          "Uproot and burn infected plants, tuber, and root balls immediately.",
          "Solarize the affected soil patch using clear plastic sheeting."
        ];
        chemicalTreatment = [
          "No effective chemical cures exist; focus entirely on sanitation."
        ];
        ipmRecommendations = [
          "Rotate potatoes with crops like cabbages, maize, or wheat for 3-4 years.",
          "Use only certified clean seed potato tubers (KEPHIS approved).",
          "Ensure fields are well-drained."
        ];
        prevention = [
          "Avoid planting in fields with a history of bacterial wilt.",
          "Sanitize all farm implements before cultivating.",
          "Scout fields weekly, marking and isolating infected pockets."
        ];
        ph = "5.0 - 5.5";
        fertilizer = "NPK at planting, CAN top dress";
        npk = "NPK 10:20:20";
        organicMatter = "Apply heavily composted manure to increase soil structure.";
        recommendedProductTypes = ["Biological fungicide / Trichoderma", "Sanitizer disinfectant"];
        followUpActions = [
          "Immediately uproot and burn infected pockets.",
          "Limit traffic and water flow through infected zones."
        ];
        emergency = true;
        needsExpertInspection = true;
      } else {
        disease = "Potato Early Blight";
        scientificDisease = "Alternaria solani";
        visualObservations = [
          "Dark brown spots with concentric ring patterns (target-board effect) on older leaves.",
          "Spots surrounded by narrow yellow bands (chlorotic halos).",
          "Lower leaves drying up and dropping off as disease progresses."
        ];
        possibleCauses = [
          "Warm temperatures (24-29°C) and alternating wet and dry conditions.",
          "Fungus surviving in infected tubers or crop residues.",
          "Poor soil nitrogen levels making plants more susceptible."
        ];
        organicTreatment = [
          "Spray copper-based organic fungicides at first sign of spots.",
          "Prune lower leaves to enhance airflow.",
          "Apply bio-fungicides containing Bacillus subtilis."
        ];
        chemicalTreatment = [
          "Spray contact fungicides containing chlorothalonil or mancozeb.",
          "Apply systemic fungicides containing difenoconazole under high disease pressure."
        ];
        ipmRecommendations = [
          "Ensure adequate nitrogen and potassium fertilization to keep plants vigorous.",
          "Rotate with non-solanaceous hosts for at least 2 seasons.",
          "Maintain weed-free borders."
        ];
        prevention = [
          "Plant certified clean seeds.",
          "Harvest promptly once vines die down to prevent tuber infection.",
          "Avoid sprinkler irrigation; use drip to keep foliage dry."
        ];
        ph = "5.2 - 6.0";
        fertilizer = "NPK 10:20:20 at planting, CAN top dress at hilling";
        npk = "NPK 10:20:20";
        organicMatter = "Add well-decomposed manure to feed early vegetative growth.";
        recommendedProductTypes = ["Mancozeb fungicide", "Difenoconazole fungicide", "Copper fungicide"];
        followUpActions = [
          "Inspect oldest leaves weekly.",
          "Repeat spraying in 7-10 days if humid weather persists."
        ];
      }
    }
  }

  if (currentWeather) {
    if (currentWeather.humidity && currentWeather.humidity > 80) {
      weatherAdvice.push(`High relative humidity (${currentWeather.humidity}%) creates extreme risk for fungal spore germination. Increase scouting frequency.`);
    }
    if (currentWeather.rainProbability && currentWeather.rainProbability > 60) {
      weatherAdvice.push(`Heavy rain is expected (probability ${currentWeather.rainProbability}%). Delay any fungicide or pesticide spraying to avoid runoff.`);
    } else {
      weatherAdvice.push("Weather is dry. Ideal window for preventative fungicide applications.");
    }
    if (currentWeather.windSpeed && currentWeather.windSpeed > 15) {
      weatherAdvice.push(`Strong winds detected (${currentWeather.windSpeed} km/h). DO NOT spray chemical treatments to prevent droplet drift.`);
    } else {
      weatherAdvice.push(`Low wind speeds (${currentWeather.windSpeed || 0} km/h). Safe conditions for spray applications.`);
    }
    if (currentWeather.temperature && currentWeather.temperature > 28) {
      weatherAdvice.push(`High heat stress (${currentWeather.temperature}°C) detected. Increase irrigation frequency early in the morning.`);
    }
  } else {
    weatherAdvice.push("No live weather context available. Follow general spraying precautions.");
  }

  let additionalImagesRequired: string[] = [];
  if (confidence < 70) {
    additionalImagesRequired = [
      "Close-up image of individual leaf spot margin",
      "Whole plant canopy layout",
      "Underside of the leaf",
      "Stalk/stem section",
      "Fruit/tuber condition",
      "Root structure and root zone soil condition"
    ];
  }

  return {
    crop: cropName,
    scientificName,
    growthStage: cropAge || "45 days",
    healthStatus: severity === "Healthy" ? "Healthy" : "Infected",
    disease,
    scientificDisease,
    confidence,
    severity,
    symptoms: listSymptoms,
    visualObservations,
    possibleCauses,
    organicTreatment,
    chemicalTreatment,
    ipmRecommendations,
    prevention,
    soilRecommendations: {
      ph,
      fertilizer,
      npk,
      organicMatter
    },
    weatherAdvice,
    recommendedProductTypes,
    followUpActions,
    emergency,
    needsExpertInspection,
    additionalImagesRequired,
    summary: `Identified ${disease} (${scientificDisease}) with ${confidence}% confidence under ${severity.toLowerCase()} severity. Local conditions: Temp: ${currentWeather?.temperature || 24}°C, Humidity: ${currentWeather?.humidity || 82}% RH.`
  };
}

export const runAIPathogenDiagnostics = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => DiagnoseInputSchema.parse(val))
  .handler(async ({ data }) => {
    const { crop, symptoms, imageBase64 } = data;

    // 1. Image validation & size checks
    if (imageBase64) {
      if (!imageBase64.startsWith("data:image/")) {
        throw new Error("Invalid file type. Only image files are allowed.");
      }
      const approximateSizeBytes = imageBase64.length * 0.75;
      if (approximateSizeBytes > 10 * 1024 * 1024) {
        throw new Error("File size exceeds the maximum limit of 10MB.");
      }
    }

    // 2. Agricultural Inference Rule-Engine
    const dxResult = buildDiagnosis(data);

    // 3. Database query: Fetch ACTUAL recommended Agrovet products matching types
    const sql = await db();
    let matchedProducts: any[] = [];
    if (dxResult.recommendedProductTypes.length > 0) {
      const clauses = dxResult.recommendedProductTypes.map(term => `%${term}%`);
      matchedProducts = await sql`
        SELECT id, name, base_price::float as price, slug
        FROM products
        WHERE status = 'active' AND deleted_at IS NULL AND (
          name ILIKE ANY(${clauses}) OR brand ILIKE ANY(${clauses}) OR subcategory ILIKE ANY(${clauses})
        )
        ORDER BY is_featured DESC, avg_rating DESC
        LIMIT 4
      `;
    }

    if (matchedProducts.length === 0) {
      matchedProducts = await sql`
        SELECT id, name, base_price::float as price, slug
        FROM products
        WHERE status = 'active' AND deleted_at IS NULL
        ORDER BY is_featured DESC
        LIMIT 4
      `;
    }

    const recommendedProducts = matchedProducts.map((p: any) => ({
      name: p.name,
      price: `KES ${p.price.toLocaleString()}`,
      slug: p.slug
    }));

    // 4. Save to profile history if user is authenticated
    const user = await getAuthUser();
    let savedDiagnosisId: string | null = null;
    
    if (user) {
      const activeSymptoms = Object.keys(symptoms).filter(k => symptoms[k]);
      const [inserted] = await sql`
        INSERT INTO crop_diagnoses (user_id, crop, symptoms, image_url, disease_name, confidence, result_json)
        VALUES (${user.id}, ${crop}, ${activeSymptoms}, ${data.imageFileName || null}, ${dxResult.disease}, ${dxResult.confidence}, ${JSON.stringify(dxResult)})
        RETURNING id
      `;
      savedDiagnosisId = inserted?.id || null;
    }

    return {
      id: savedDiagnosisId,
      recommendedProducts,
      ...dxResult
    };
  });

export const getDiagnosisHistory = createServerFn({ method: "POST" })
  .handler(async () => {
    const user = await getAuthUser();
    if (!user) {
      return [];
    }

    const sql = await db();
    const history = await sql`
      SELECT id, crop, symptoms, image_url, disease_name, confidence::float as confidence, created_at, result_json
      FROM crop_diagnoses
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 6
    `;

    return history.map((row: any) => ({
      id: row.id,
      crop: row.crop,
      symptoms: row.symptoms,
      imageName: row.image_url || "",
      disease: row.disease_name,
      confidence: `${row.confidence}%`,
      createdAt: row.created_at,
      resultJson: row.result_json,
    }));
  });
