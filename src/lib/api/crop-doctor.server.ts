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

// Input validation schema for Crop Doctor
const DiagnoseInputSchema = z.object({
  crop: z.string().min(1, "Crop name is required"),
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

export type DiagnoseInput = z.infer<typeof DiagnoseInputSchema>;

export const runAIPathogenDiagnostics = createServerFn({ method: "POST" })
  .inputValidator((val: unknown) => DiagnoseInputSchema.parse(val))
  .handler(async ({ data }) => {
    const { crop, symptoms, imageBase64, county, subCounty, cropAge, plantingDate, currentWeather, farmerQuestion } = data;

    // 1. File Type and Size Validation
    let mimeType = "image/jpeg";
    let base64Data = "";
    if (imageBase64) {
      if (!imageBase64.startsWith("data:image/")) {
        throw new Error("Invalid file type. Only image files (JPEG, PNG, WEBP, GIF) are allowed.");
      }
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!mimeMatch) {
        throw new Error("Invalid image format. Expected valid base64 data URI.");
      }
      mimeType = mimeMatch[1].toLowerCase();
      base64Data = mimeMatch[2];

      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimes.includes(mimeType)) {
        throw new Error(`Unsupported image format: ${mimeType}. Allowed formats: JPEG, PNG, WEBP, GIF.`);
      }

      const approximateSizeBytes = base64Data.length * 0.75;
      if (approximateSizeBytes > 10 * 1024 * 1024) {
        throw new Error("File size exceeds the maximum limit of 10MB.");
      }
    }

    // 2. Prepare Multimodal Gemini Request
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI Vision diagnostics unavailable: GEMINI_API_KEY is not configured on the server.");
    }

    const activeSymptoms = Object.entries(symptoms)
      .filter(([_, active]) => Boolean(active))
      .map(([sym]) => sym);

    const systemInstruction = `You are the chief agricultural pathologist and agronomist for Mkulima, an East African farm intelligence platform.
Analyze the provided crop image and agronomic metadata.

CRITICAL DIAGNOSTIC GUIDELINES:
1. Ground your assessment strictly in visible botanical pathology and agronomic symptoms.
2. If an image is attached, inspect leaf blades, veins, stems, lesions, coloration, wilting, and fungal/bacterial signs.
3. If the image is unclear, out of focus, or does not clearly display crop pathology, set possibleCondition to "Inconclusive / Low Image Clarity", confidence below 40, and advise the farmer to upload a clear close-up.
4. Confidence must be an objective numeric percentage (0.0 - 100.0) based on diagnostic certainty. NEVER generate random or fake confidence values.
5. Provide actionable Integrated Pest Management (IPM), highlighting both organic/cultural methods and approved synthetic treatments suitable for East Africa (Kenya).
6. Always state diagnostic limitations clearly: this is an AI visual assessment and does not substitute for accredited laboratory tissue testing or in-person extension services.

Return ONLY valid JSON with this exact schema:
{
  "crop": string,
  "possibleCondition": string,
  "scientificDisease": string,
  "confidence": number,
  "severity": "low" | "medium" | "high" | "critical",
  "symptomsObserved": string[],
  "reasoning": string,
  "visualObservations": string[],
  "recommendedActions": string[],
  "organicTreatment": string[],
  "chemicalTreatment": string[],
  "ipmRecommendations": string[],
  "preventionTips": string[],
  "soilRecommendations": {
    "ph": string,
    "fertilizer": string,
    "npk": string,
    "organicMatter": string
  },
  "recommendedProductTypes": string[],
  "urgency": string,
  "emergency": boolean,
  "needsExpertInspection": boolean,
  "limitations": string
}`;

    const parts: any[] = [];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const contextSummary = [
      `Crop Species: ${crop}`,
      activeSymptoms.length > 0 ? `Farmer Reported Symptoms: ${activeSymptoms.join(", ")}` : "Farmer Reported Symptoms: None specified",
      farmerQuestion ? `Farmer Notes / Query: ${farmerQuestion}` : null,
      cropAge ? `Crop Age: ${cropAge}` : null,
      plantingDate ? `Planting Date: ${plantingDate}` : null,
      county ? `Geographic Region: ${county}${subCounty ? `, ${subCounty}` : ""}, Kenya` : null,
      currentWeather ? `Current Weather Context: Temp ${currentWeather.temperature ?? "N/A"}°C, Humidity ${currentWeather.humidity ?? "N/A"}%, Rain Probability ${currentWeather.rainProbability ?? "N/A"}%` : null,
    ].filter(Boolean).join("\n");

    parts.push({
      text: `Perform an agronomic diagnostic evaluation based on this field report:\n\n${contextSummary}\n\nReturn the diagnostic evaluation as strictly valid JSON according to instructions.`
    });

    let aiResult: any;
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
        },
      });

      const responseText = response.text || "{}";
      aiResult = JSON.parse(responseText);
    } catch (error: any) {
      console.error("Crop Doctor Gemini Vision Error:", error);
      throw new Error(`AI diagnostic analysis failed: ${error.message || "Model communication error"}. Please check your connection or image clarity and try again.`);
    }

    // 3. Normalize Structured Output
    const disease = aiResult.possibleCondition || "Undetermined Crop Condition";
    const scientificDisease = aiResult.scientificDisease || "N/A";
    const confidence = typeof aiResult.confidence === "number" ? Math.round(aiResult.confidence * 10) / 10 : 70.0;
    const severity = aiResult.severity || "medium";
    const symptomsObserved = Array.isArray(aiResult.symptomsObserved) ? aiResult.symptomsObserved : activeSymptoms;
    const visualObservations = Array.isArray(aiResult.visualObservations) ? aiResult.visualObservations : [];
    const recommendedActions = Array.isArray(aiResult.recommendedActions) ? aiResult.recommendedActions : [];
    const organicTreatment = Array.isArray(aiResult.organicTreatment) ? aiResult.organicTreatment : [];
    const chemicalTreatment = Array.isArray(aiResult.chemicalTreatment) ? aiResult.chemicalTreatment : [];
    const ipmRecommendations = Array.isArray(aiResult.ipmRecommendations) ? aiResult.ipmRecommendations : [];
    const preventionTips = Array.isArray(aiResult.preventionTips) ? aiResult.preventionTips : [];
    const recommendedProductTypes = Array.isArray(aiResult.recommendedProductTypes) ? aiResult.recommendedProductTypes : [];
    const limitations = aiResult.limitations || "Preliminary AI visual screening. Not a substitute for accredited laboratory diagnosis or on-site agronomy extension support.";

    // 4. Grounded Product Recommendations from PostgreSQL
    const sql = await db();
    let matchedProducts: any[] = [];
    const searchTerms = [...recommendedProductTypes, crop, disease]
      .filter((t): t is string => typeof t === "string" && t.trim().length > 2)
      .slice(0, 5)
      .map(term => `%${term.trim()}%`);

    if (searchTerms.length > 0) {
      matchedProducts = await sql`
        SELECT id, name, base_price::float as price, slug
        FROM products
        WHERE status = 'active' AND deleted_at IS NULL AND (
          name ILIKE ANY(${searchTerms}) OR brand ILIKE ANY(${searchTerms}) OR subcategory ILIKE ANY(${searchTerms})
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
      price: `KES ${Number(p.price || 0).toLocaleString()}`,
      slug: p.slug,
    }));

    const responsePayload = {
      crop,
      possibleCondition: disease,
      disease,
      scientificDisease,
      confidence,
      severity,
      symptomsObserved,
      symptoms: symptomsObserved,
      reasoning: aiResult.reasoning || "Diagnostic derived from visual pathology inspection and described crop symptoms.",
      visualObservations,
      possibleCauses: [aiResult.reasoning || "Identified through symptomatic pattern matching and optical analysis."],
      recommendedActions,
      organicTreatment,
      chemicalTreatment,
      ipmRecommendations,
      preventionTips,
      prevention: preventionTips,
      soilRecommendations: aiResult.soilRecommendations || {
        ph: "6.0 - 6.8",
        fertilizer: "Balanced organic compost",
        npk: "NPK 17:17:17",
        organicMatter: "Apply farmyard manure or well-rotted compost",
      },
      weatherAdvice: [
        currentWeather?.rainProbability && currentWeather.rainProbability > 50
          ? "High rainfall probability detected: delay foliar spray applications to prevent chemical wash-off."
          : "Favorable weather for standard pest scouting and targeted spray interventions.",
      ],
      recommendedProductTypes,
      followUpActions: [
        "Re-inspect crop rows in 3 to 5 days to evaluate condition progression.",
        "Consult local agricultural extension officer if symptoms worsen.",
      ],
      emergency: Boolean(aiResult.emergency || severity === "critical"),
      needsExpertInspection: Boolean(aiResult.needsExpertInspection || confidence < 60),
      additionalImagesRequired: confidence < 60 ? ["Submit clear, high-resolution leaf underside and stem pictures."] : [],
      urgency: aiResult.urgency || (severity === "critical" ? "Immediate action required (24h)" : "Action within 3-5 days"),
      limitations,
      summary: `Identified ${disease} (${scientificDisease}) with ${confidence}% confidence under ${severity} severity.`,
      recommendedProducts,
    };

    // 5. Persist to History if Authenticated
    const user = await getAuthUser();
    let savedDiagnosisId: string | null = null;
    if (user) {
      const [inserted] = await sql`
        INSERT INTO crop_diagnoses (user_id, crop, symptoms, image_url, disease_name, confidence, result_json)
        VALUES (
          ${user.id},
          ${crop},
          ${symptomsObserved},
          ${data.imageFileName || null},
          ${disease},
          ${confidence},
          ${JSON.stringify(responsePayload)}
        )
        RETURNING id
      `;
      savedDiagnosisId = inserted?.id || null;
    }

    return {
      id: savedDiagnosisId,
      ...responsePayload,
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
      symptoms: row.symptoms || [],
      imageName: row.image_url || "",
      disease: row.disease_name,
      confidence: `${row.confidence}%`,
      createdAt: row.created_at,
      resultJson: row.result_json,
    }));
  });
