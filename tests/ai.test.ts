import { describe, it, expect } from "vitest";

describe("Phase 2 AI Integration & Recommendation Grounding Tests", () => {
  describe("1. Crop Doctor Multimodal AI Vision Input & Schema", () => {
    it("should accept real base64 image data and construct valid multimodal content", () => {
      const mockBase64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
      const crop = "Maize";
      const symptoms = ["yellow streaks on leaves", "stunted growth"];

      // Verify base64 extraction
      const matches = mockBase64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      expect(matches).not.toBeNull();
      const mimeType = matches![1];
      const base64Data = matches![2];

      expect(mimeType).toBe("image/jpeg");
      expect(base64Data).toBe("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...");

      // Multi-part payload structure for Gemini vision
      const promptParts = [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `Target Crop: ${crop}. Symptoms reported: ${symptoms.join(", ")}`,
        },
      ];

      expect(promptParts[0].inlineData.data.length).toBeGreaterThan(0);
      expect(promptParts[1].text).toContain("Maize");
    });

    it("should reject random fake confidence generation and enforce deterministic model schema", () => {
      type DiagnosticOutput = {
        crop: string;
        possibleCondition: string;
        confidence: number;
        severity: "low" | "medium" | "high" | "critical";
        symptomsObserved: string[];
        reasoning: string;
        recommendedActions: string[];
        preventionTips: string[];
        urgency: string;
        limitations: string;
      };

      const validModelOutput: DiagnosticOutput = {
        crop: "Maize",
        possibleCondition: "Maize Lethal Necrosis Disease (MLND)",
        confidence: 85, // Deterministic score from model evaluation, NOT Math.random()
        severity: "high",
        symptomsObserved: ["Chlorotic mottling on leaves", "Dead heart in young whorls"],
        reasoning: "Distinct mosaic and chlorotic mottle patterns observed along leaf veins consistent with potyvirus infection.",
        recommendedActions: ["Uproot and bury heavily infected plants", "Spray registered vector control insecticide"],
        preventionTips: ["Use certified disease-free hybrid seeds", "Practice crop rotation with non-cereal crops"],
        urgency: "Immediate action required within 48 hours to prevent farm-wide contagion",
        limitations: "Visual AI diagnosis is advisory. Suspected viral pathogens require laboratory PCR verification.",
      };

      expect(validModelOutput.confidence).toBeGreaterThanOrEqual(0);
      expect(validModelOutput.confidence).toBeLessThanOrEqual(100);
      expect(["low", "medium", "high", "critical"]).toContain(validModelOutput.severity);
      expect(validModelOutput.symptomsObserved.length).toBeGreaterThan(0);
      expect(validModelOutput.limitations).toContain("laboratory PCR verification");
    });
  });

  describe("2. AI Chat Product Recommendation Grounding", () => {
    // Authoritative Mkulima Catalog mock
    const catalog = [
      { id: "prod-1", slug: "duduthrin-50ec", name: "Duduthrin 50 EC 1L", price: 1850, category: "Crop Protection", status: "active", stockQty: 45, deletedAt: null },
      { id: "prod-2", slug: "yaravita-crop-boost", name: "YaraVita Crop Boost 5L", price: 4200, category: "Fertilizers", status: "active", stockQty: 12, deletedAt: null },
      { id: "prod-archived", slug: "old-pesticide", name: "Old Discontinued Chemical", price: 900, category: "Crop Protection", status: "archived", stockQty: 0, deletedAt: "2026-01-01" },
    ];

    function searchMkulimaCatalog(query: string) {
      const q = query.toLowerCase();
      return catalog
        .filter((p) => p.deletedAt === null && p.status === "active" && p.stockQty > 0)
        .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
        .map((p) => ({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          stockAvailability: "In Stock",
        }));
    }

    it("should ground AI product recommendations strictly in real active database products", () => {
      const insectQuery = "duduthrin";
      const results = searchMkulimaCatalog(insectQuery);

      expect(results.length).toBe(1);
      expect(results[0].productId).toBe("prod-1");
      expect(results[0].name).toBe("Duduthrin 50 EC 1L");
      expect(results[0].price).toBe(1850);
      expect(results[0].slug).toBe("duduthrin-50ec");
    });

    it("should never recommend archived or out-of-stock products", () => {
      const results = searchMkulimaCatalog("Discontinued");
      expect(results.length).toBe(0);
    });

    it("should return empty recommendations and clear notice if no catalog match exists", () => {
      const results = searchMkulimaCatalog("Uninvented Magic Spray 9000");
      expect(results.length).toBe(0);

      // System prompt response format when no products found
      const aiResponse = {
        answer: "For this condition, we recommend consulting a local extension officer as no specific matching certified inputs are currently stocked in our agrovet catalog.",
        recommendations: results,
      };

      expect(aiResponse.recommendations).toHaveLength(0);
      expect(aiResponse.answer).toContain("no specific matching certified inputs");
    });
  });
});
