import { authenticateRequest } from "./auth-helper";
import { runAIPathogenDiagnostics } from "../api/crop-doctor.server";
import { GoogleGenAI } from "@google/genai";
import { getDb } from "../db.server";

const AI_SYSTEM_PROMPT = `You are Mqulima AI, the dedicated chief farm advisor for Mqulima (Africa's 360° agriculture ecosystem based in Kenya).
Provide practical, scientifically accurate, concise agricultural advice on crops (Maize, Potatoes, Beans, Tomatoes, Avocados, Cabbages, Coffee, Tea), livestock (Dairy, Beef, Poultry, Goats), soil health, pests (Fall Armyworm, Tuta Absoluta, Blight, Aphids), fertilizer management (DAP, CAN, NPK, Foliar), irrigation, and post-harvest storage.
Contextualize for Kenyan agro-ecological conditions (use KSh currency, local varieties, Kenyan counties, and long/short rain seasons).
Keep advice concise, direct, and actionable (max 200 words).
When relevant, recommend verified farm inputs from AgroShop or Mqulima field services (soil testing, agronomist consultation, veterinary visits).
Never invent chemical dosages without instructing farmers to check product labels.`;

export async function handleAiChat(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);

  try {
    const body = await request.json();
    const { message, session_id = "anon" } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback message if key not configured
      const fallback = `Hello${user ? ` ${user.name.split(" ")[0]}` : ""}! Mqulima AI is currently operating in offline mode. For immediate farm assistance, soil testing, or certified seed delivery, please reach out via our Services tab or call our agronomy desk at 0700 000 000.`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta: fallback })}\n\n`));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nFarmer: ${message.trim()}` }] },
      ],
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
            }
          }
        } catch (err: any) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: "Connection interrupted. Please try again." })}\n\n`)
          );
        } finally {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function handleCropDoctor(request: Request): Promise<Response> {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication required to use AI Crop Doctor." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { crop, symptoms = {}, imageBase64, county, subCounty, farmerQuestion } = body;

    if (!crop) {
      return new Response(
        JSON.stringify({ success: false, error: "Crop name is required (e.g. Maize, Potato, Tomato, Avocado)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call runAIPathogenDiagnostics with Gemini 2.5 Flash Vision AI
    const diagnosis = await runAIPathogenDiagnostics({
      data: {
        crop,
        symptoms: typeof symptoms === "object" ? symptoms : { "visible damage": true },
        imageBase64,
        county: county || user.county,
        subCounty,
        farmerQuestion,
      },
    } as any);

    return new Response(JSON.stringify({ success: true, diagnosis }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[API/V1/CROP-DOCTOR ERROR]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Crop diagnosis failed." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
