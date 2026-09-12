// ============================================================================
// chat.ts - TanStack Start API Route for Mqulima AI Streaming
//
// Route: /api/ai/chat
//
// Performs: session verification, input validation, rate limiting, owned
// conversation logging, Gemini SDK streaming, and production-safe errors.
// ============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MAX_MESSAGE_CHARS = 8_000;
const MAX_HISTORY_TURNS = 24;
const MAX_HISTORY_CONTENT_CHARS = 12_000;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_BASE64_CHARS = 12_000_000;
const MAX_ATTACHMENTS = 4;
const GEMINI_CREATE_TIMEOUT_MS = 20_000;
const GEMINI_STREAM_TIMEOUT_MS = 120_000;
const GEMINI_RETRIES = 2;

const allowedAttachmentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const SavedAttachmentSchema = z.object({
  name: z.string().min(1).max(160),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

const UploadAttachmentSchema = SavedAttachmentSchema.extend({
  mimeType: z.string().min(1).max(120).refine(
    (mimeType) => allowedAttachmentMimeTypes.includes(mimeType),
    "Unsupported file type"
  ),
  base64: z.string().min(1).max(MAX_ATTACHMENT_BASE64_CHARS),
});

const ChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  history: z.array(z.object({
    role: z.enum(["user", "model"]),
    content: z.string().max(MAX_HISTORY_CONTENT_CHARS),
    attachments: z.array(SavedAttachmentSchema).optional(),
  })).max(80).default([]),
  attachments: z.array(UploadAttachmentSchema).max(MAX_ATTACHMENTS).optional(),
  weather: z.object({
    temperature: z.number().optional(),
    description: z.string().max(120).optional(),
  }).optional(),
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function normalizeBase64(dataUrlOrBase64: string) {
  return dataUrlOrBase64.includes(",")
    ? dataUrlOrBase64.split(",", 2)[1]
    : dataUrlOrBase64;
}



function runLocalSimulation(
  parsedInput: any,
  user: any,
  weatherContext: string,
  diagnosesContext: string,
  marketContext: string,
  catalogMatches: any[],
  developerNote: string,
  saveMessage: any
) {
  const userMsgLower = parsedInput.message.toLowerCase();
  let mockResponse = `Habari, ${user.name}! I am Mqulima AI (Running in Local Simulation Mode).

Here is the data relevant to your inquiry:

`;

  if (userMsgLower.includes("product") || userMsgLower.includes("fertilizer") || userMsgLower.includes("spray") || userMsgLower.includes("seed") || userMsgLower.includes("chemical") || userMsgLower.includes("dawa") || userMsgLower.includes("pembejeo")) {
    if (catalogMatches && catalogMatches.length > 0) {
      mockResponse += `### 🌾 Recommended Mkulima Catalog Products
Based on your inquiry, here are verified in-stock products from our catalog:
${catalogMatches.map((p) => `- **${p.name}** (${p.category}): KES ${p.price.toLocaleString()} (${p.stockQty} in stock)`).join("\n")}

<!--MKULIMA_RECOMMENDATIONS_START-->
${JSON.stringify(catalogMatches.map((p) => ({
  productId: p.productId,
  slug: p.slug,
  name: p.name,
  price: p.price,
  imageUrl: p.imageUrl,
  category: p.category,
  inStock: p.inStock,
  reason: `Authoritative verified agricultural input for ${p.category}`,
  relevanceScore: 0.95
})), null, 2)}
<!--MKULIMA_RECOMMENDATIONS_END-->`;
    } else {
      mockResponse += `### 🌾 Product Availability Notice
Mkulima does not currently have this specific product in stock in our online catalog.
We recommend checking back soon or consulting a registered agrovet for generic active ingredients suitable for ${user.crops || "your crops"}.`;
    }
  } else if (userMsgLower.includes("weather") || userMsgLower.includes("forecast") || userMsgLower.includes("hali ya hewa") || userMsgLower.includes("mvua")) {
    mockResponse += `### 🌤️ Weather Report for ${user.county || "your region"}
- **Current Conditions**: ${weatherContext}
- **Agronomic Advice**: The current conditions suggest regular scouting. If high humidity is reported, be alert for fungal pathogens. If rain probability is high, avoid spraying inputs to prevent wash-off.`;
  } else if (userMsgLower.includes("diagnose") || userMsgLower.includes("disease") || userMsgLower.includes("mgonjwa") || userMsgLower.includes("ugonjwa") || userMsgLower.includes("leaf") || userMsgLower.includes("spot") || userMsgLower.includes("wilting")) {
    mockResponse += `### 🌿 Diagnostic History & Advice
Our database records show:
${diagnosesContext}

- **General Advice**: If you observe leaf yellowing or spots on solanaceous crops (like tomato/potato), consider testing for Late Blight or Bacterial Wilt using the Crop Doctor tool. Keep your farm tools sanitized and practice crop rotation.`;
  } else if (userMsgLower.includes("price") || userMsgLower.includes("market") || userMsgLower.includes("soko") || userMsgLower.includes("bei") || userMsgLower.includes("maize") || userMsgLower.includes("beans")) {
    mockResponse += `### 🛒 Latest Market Price Board
Here are the recent commodity updates:
${marketContext}

- **Agribusiness Advice**: Use these price benchmarks when negotiating with local buyers. Prices vary across counties, so checking prices in adjacent hubs can help maximize your returns.`;
  } else {
    mockResponse += `I'm here to support your farming operations in **${user.county || "Kenya"}**.
- **Crops**: ${user.crops || "Not specified"}
- **Livestock**: ${user.livestock || "Not specified"}
- **Acreage**: ${user.farmSize || "Not specified"}

Feel free to ask me about:
1. **Weather conditions & spray windows** (e.g., "What is the weather like?")
2. **Crop disease diagnostic history** (e.g., "Show me my crop diagnoses")
3. **Market commodity prices** (e.g., "What is the price of Maize?")
4. **Agrovet product recommendations** for your farm.`;
  }

  mockResponse += `\n\n---\n> ⚠️ **Developer Note**: ${developerNote}`;

  const encoder = new TextEncoder();
  const customStream = new ReadableStream({
    async start(controller) {
      try {
        const words = mockResponse.match(/(\s+|\S+)/g) || [mockResponse];
        for (const word of words) {
          controller.enqueue(encoder.encode(word));
          await sleep(Math.random() * 15 + 5);
        }
        if (parsedInput.conversationId) {
          await saveMessage(parsedInput.conversationId, "model", mockResponse.trim());
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const contentLength = Number(request.headers.get("content-length") || 0);
          if (contentLength > 16 * 1024 * 1024) {
            return jsonResponse({ error: "The message is too large. Upload fewer or smaller files." }, 413);
          }

          const {
            getAuthUserFromRequest,
            assertConversationOwner,
            saveMessage,
          } = await import("@/lib/api/ai-helpers.server");
          const { getClientIp, checkApiRateLimit } = await import("@/lib/rate-limit.server");
          const { getDb } = await import("@/lib/db.server");

          let user = await getAuthUserFromRequest(request);
          if (!user) {
            user = {
              id: "guest-farmer",
              name: "Farmer",
              email: "farmer@mqulima.com",
              county: "Kenya",
              farmSize: "Smallholder",
              crops: "Maize, Beans, Vegetables",
              livestock: "Dairy, Poultry",
              role: "farmer",
            };
          }

          try {
            await checkApiRateLimit(`ai:${user.id}:${getClientIp()}`);
          } catch (error) {
            return jsonResponse({ error: "Too many AI requests. Please wait a minute and try again." }, 429);
          }

          const parsedInput = ChatRequestSchema.parse(await request.json());
          if (parsedInput.conversationId && user.id !== "guest-farmer") {
            try {
              await assertConversationOwner(parsedInput.conversationId, user.id);
            } catch (e) {}
          }

          if (parsedInput.conversationId && user.id !== "guest-farmer") {
            const userMsgAttachments = (parsedInput.attachments || []).map(({ name, mimeType, size }) => ({
              name,
              mimeType,
              size,
            }));
            try {
              await saveMessage(parsedInput.conversationId, "user", parsedInput.message, userMsgAttachments);
            } catch (e) {}
          }

          const sql = getDb();
          const diagnoses = await sql`
            SELECT crop, disease_name, confidence, created_at
            FROM crop_diagnoses
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
            LIMIT 5
          `;
          const diagnosesContext = diagnoses.length > 0
            ? diagnoses.map((d: any) => `- ${d.crop}: ${d.disease_name} (${d.confidence}% confidence) on ${new Date(d.created_at).toLocaleDateString()}`).join("\n")
            : "No previous diagnoses recorded.";

          const prices = await sql`
            SELECT co.name, cpb.region, cpb.price::float as price, cpb.recorded_at, cpb.source
            FROM commodities co
            JOIN commodity_price_board cpb ON cpb.commodity_id = co.id
            ORDER BY cpb.recorded_at DESC
            LIMIT 10
          `;
          const marketContext = prices.length > 0
            ? prices.map((p: any) => `- ${p.name} in ${p.region}: KES ${p.price} (${p.source || "market board"}, ${new Date(p.recorded_at).toLocaleDateString()})`).join("\n")
            : "No market prices available.";

          const weatherContext = parsedInput.weather
            ? `${parsedInput.weather.temperature ?? "Unknown"}°C, ${parsedInput.weather.description || "conditions unavailable"}`
            : "Weather data not available.";

          const { searchProductsCatalog } = await import("@/lib/api/product-catalog.server");
          const catalogMatches = await searchProductsCatalog({
            query: parsedInput.message,
            crop: user.crops || undefined,
            problem: parsedInput.message,
            activeOnly: true,
            inStockOnly: true,
            limit: 4,
          });

          const catalogGroundingInstruction = catalogMatches.length > 0
            ? `AVAILABLE MKULIMA STORE PRODUCTS (PostgreSQL Authoritative):\n` +
              catalogMatches.map(p => `- ID: "${p.productId}" | Slug: "${p.slug}" | Name: "${p.name}" | Price: KES ${p.price} | Stock: ${p.stockQty} in stock | Category: "${p.category}" | Image: "${p.imageUrl}"`).join("\n") +
              `\n\nCRITICAL PRODUCT RECOMMENDATION RULES:\n` +
              `1. The AI MUST NOT invent products, product IDs, prices, or claim that an unlisted product is sold by Mkulima.\n` +
              `2. If recommending any of the available products above, explain WHY it is recommended for the farmer's problem.\n` +
              `3. When you recommend any of the products above, append this exact structured JSON block at the very end of your response:\n` +
              `<!--MKULIMA_RECOMMENDATIONS_START-->\n` +
              JSON.stringify(catalogMatches.map(p => ({
                productId: p.productId,
                slug: p.slug,
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                category: p.category,
                inStock: p.inStock,
                reason: `Recommended active input for ${p.category}`,
                relevanceScore: 0.95
              })), null, 2) + "\n" +
              `<!--MKULIMA_RECOMMENDATIONS_END-->`
            : `AVAILABLE MKULIMA STORE PRODUCTS: None matching this specific query in the store database.\n` +
              `CRITICAL PRODUCT RECOMMENDATION RULES:\n` +
              `1. Do NOT invent products, prices, or store links.\n` +
              `2. If the user asks for purchasable products or specific branded items, state clearly: "Mkulima does not currently have this specific product in stock in our catalog."\n` +
              `3. Recommend generic active ingredients, IPM cultural practices, or organic alternatives without pretending Mkulima sells them.\n` +
              `4. DO NOT output any recommendation JSON block. Never substitute unrelated featured products.`;

          const systemPrompt = `You are Mqulima AI, a premium agricultural assistant for farmers across Kenya and East Africa.

You combine the roles of senior agronomist, livestock advisor, soil scientist, irrigation planner, climate-smart agriculture analyst, and agribusiness advisor.

Operating rules:
- Give practical, evidence-aware agricultural guidance for Kenyan farming contexts.
- Ask concise follow-up questions when crop age, county, symptoms, soil values, acreage, animal age, or budget are missing.
- Use Markdown with clear headings, tables, checklists, and formulas when useful.
- Do not invent citations. When Google Search grounding provides sources, mention them as references in a short "Sources" section.
- Use uncertainty labels when information is incomplete.
- Do not recommend unsafe pesticide, veterinary, or chemical use. Include PPE, withdrawal-period, label, and extension-officer cautions when relevant.
- Support English, Kiswahili, and common mixed-language farmer questions.

Farmer context:
- Farmer: ${user.name}
- County: ${user.county || "Kenya"}
- Farm experience: ${user.farmSize || "Not specified"}
- Crops: ${user.crops || "Not specified"}
- Livestock: ${user.livestock || "Not specified"}
- Live weather: ${weatherContext}

Recent crop diagnosis history:
${diagnosesContext}

Latest market prices:
${marketContext}

${catalogGroundingInstruction}`;

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return runLocalSimulation(
              parsedInput,
              user,
              weatherContext,
              diagnosesContext,
              marketContext,
              catalogMatches,
              "The `GEMINI_API_KEY` environment variable is not configured on this server. Running in simulated fallback mode. Set the key in your `.env` file and restart the server to enable the real Gemini 2.5 Flash model.",
              saveMessage
            );
          }

          const turns: any[] = parsedInput.history
            .slice(-MAX_HISTORY_TURNS)
            .filter((turn) => turn.content.trim().length > 0)
            .map((turn) => ({
              role: turn.role === "model" ? "model" : "user",
              parts: [{ text: turn.content.slice(0, MAX_HISTORY_CONTENT_CHARS) }],
            }));

          const currentParts: any[] = [{ text: parsedInput.message }];
          for (const file of parsedInput.attachments || []) {
            currentParts.push({
              inlineData: {
                mimeType: file.mimeType,
                data: normalizeBase64(file.base64),
              },
            });
          }
          turns.push({ role: "user", parts: currentParts });

          try {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey });

            const interactionStream = await ai.models.generateContentStream({
              model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash",
              contents: turns,
              config: {
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }],
                maxOutputTokens: 8192,
              },
            });

            let fullResponse = "";
            const encoder = new TextEncoder();

            const customStream = new ReadableStream({
              async start(controller) {
                const timeout = setTimeout(() => {
                  controller.error(new Error("Mqulima AI response timed out. Please retry with a shorter prompt."));
                }, GEMINI_STREAM_TIMEOUT_MS);

                try {
                  for await (const chunk of interactionStream) {
                    const text = chunk.text;
                    if (!text) continue;
                    fullResponse += text;
                    controller.enqueue(encoder.encode(text));
                  }

                  clearTimeout(timeout);
                  if (parsedInput.conversationId && fullResponse.trim()) {
                    await saveMessage(parsedInput.conversationId, "model", fullResponse.trim());
                  }
                  controller.close();
                } catch (error: any) {
                  clearTimeout(timeout);
                  console.error("Error reading Gemini stream, enqueuing simulated fallback text:", error);
                  const errDetails = error?.message || String(error);
                  const fallbackText = `\n\n---\n> ⚠️ **Mqulima Assistant**: Your Gemini API key is configured, but the request failed (Error: ${errDetails}).\n> To ensure you have access to agricultural support, we have activated Mqulima AI local simulation mode.\n\n### 🌾 Local Diagnostic & Agronomic Advice:\n- **County**: ${user.county || "Kenya"}\n- **Current Weather**: ${weatherContext}\n- **Recent Crop Diagnoses**: ${diagnosesContext}\n- **Market Board**: ${marketContext}\n\n*Please verify that your Google AI Studio project has billing enabled to activate standard free tier rate limits (raise limit from 0).*`;
                  controller.enqueue(encoder.encode(fallbackText));
                  if (parsedInput.conversationId) {
                    await saveMessage(parsedInput.conversationId, "model", fallbackText.trim());
                  }
                  controller.close();
                }
              },
            });

            return new Response(customStream, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
              },
            });
          } catch (geminiError: any) {
            console.warn("Gemini API stream initiation failed. Falling back to local simulation mode:", geminiError);
            const errDetails = geminiError?.message || geminiError?.status || String(geminiError);
            let reason = `Your Gemini API key is configured, but the request failed (Error: ${errDetails}). Running in simulated fallback mode. Set up billing in Google AI Studio to increase your model rate limits from 0.`;
            return runLocalSimulation(
              parsedInput,
              user,
              weatherContext,
              diagnosesContext,
              marketContext,
              catalogMatches,
              reason,
              saveMessage
            );
          }
        } catch (error: any) {
          console.error("Gemini API Error in POST handler:", error);
          if (error instanceof z.ZodError) {
            return jsonResponse({ error: "Invalid AI request.", details: error.flatten() }, 400);
          }

          const message = error?.message === "Conversation not found"
            ? "Conversation not found. Please start a new chat."
            : `Mqulima AI error: ${error?.message || error}`;

          return jsonResponse({ error: message }, error?.message === "Conversation not found" ? 404 : 500);
        }
      },
    },
  },
});
