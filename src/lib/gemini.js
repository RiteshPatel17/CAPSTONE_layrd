// ─────────────────────────────────────────────
// LÄYRD – Gemini AI label generation
// Uses Google Gemini API (text generation) to create
// 3 personalised label suggestions per event request.
// TODO: npm install @google/genai
// ─────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

/**
 * Generate 3 AI label suggestions for an event using Gemini
 * @param {{ tone: string, eventType: string, customerName: string, eventDate: string, notes: string }} params
 * @returns {Promise<string[]>} Array of 3 label text suggestions
 */
export async function generateLabelSuggestions({ tone, eventType, customerName, eventDate, notes }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // ── Real Gemini call ──────────────────────────────────────────────
      const ai = new GoogleGenAI({ apiKey });

      const prompt = buildPrompt({ tone, eventType, customerName, eventDate, notes });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      // Parse the 3 suggestions out of the response text
      const raw = response.text?.trim() ?? "";
      const lines = raw
        .split("\n")
        .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter(Boolean);

      if (lines.length >= 3) {
        return lines.slice(0, 3);
      }
    } catch (err) {
      console.error("[GEMINI] Error generating labels:", err);
      // Fall through to mock suggestions
    }
  } else {
    console.log("[GEMINI] GEMINI_API_KEY not set — using mock suggestions");
  }

  // ── Mock fallback (used when API key is absent or call fails) ──────
  return getMockSuggestions({ tone, eventType, customerName, eventDate });
}

// ─────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────
function buildPrompt({ tone, eventType, customerName, eventDate, notes }) {
  const lines = [
    `You are writing custom label text for LÄYRD, a boutique Calgary dessert brand that sells handcrafted cheesecakes and tiramisus in 250ml cans.`,
    ``,
    `Write exactly 3 short, memorable label text options for a ${eventType || "special event"} occasion.`,
    `Tone: ${tone}`,
    customerName ? `Include the name: ${customerName}` : "",
    eventDate   ? `Event date: ${eventDate}` : "",
    notes       ? `Additional notes: ${notes}` : "",
    ``,
    `Rules:`,
    `- Each label must be under 80 characters`,
    `- Keep them poetic, personal, and fitting for a luxury dessert can`,
    `- Output exactly 3 lines, numbered 1. 2. 3. — no extra explanation`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return lines;
}

// ─────────────────────────────────────────────
// Mock suggestions (used when API key is not set)
// ─────────────────────────────────────────────
function getMockSuggestions({ tone, eventType, customerName, eventDate }) {
  const mock = {
    Elegant: [
      `With grace and love, crafted for ${customerName || "you"}`,
      `A moment of pure indulgence – ${eventType || "your special day"}`,
      `Handcrafted with care. A LÄYRD creation.`,
    ],
    Romantic: [
      `Sweet moments, sweeter memories`,
      `Made with love for ${customerName || "someone special"}`,
      `Because love deserves the finest layer`,
    ],
    Playful: [
      `Let's get LÄYRD! 🎉 ${eventType || "Party time"}`,
      `Life is short – eat the cheesecake first!`,
      `Happy ${eventType || "celebrations"} from LÄYRD 🎂`,
    ],
    Luxury: [
      `Excellence. Crafted. LÄYRD.`,
      `For those who appreciate the extraordinary`,
      `A boutique creation, exclusively for ${customerName || "you"}`,
    ],
    Minimal: [
      customerName || "LÄYRD",
      `${eventDate || "2026"} · Calgary`,
      `Handcrafted desserts`,
    ],
    Birthday: [
      `Happy Birthday, ${customerName || "Legend"}! 🎂`,
      `Another year of being absolutely fabulous! 🎉`,
      `Birthday calories don't count – especially LÄYRD ones!`,
    ],
    Wedding: [
      `${customerName || "Together forever"} – A sweet beginning 💍`,
      `As you begin forever together… indulge in the layers`,
      `Celebrating love, one can at a time`,
    ],
    Corporate: [
      `With compliments from ${customerName || "our team"}`,
      `Celebrating excellence – ${eventType || "your team"}`,
      `Thank you. A LÄYRD experience.`,
    ],
  };

  return mock[tone] ?? mock["Elegant"];
}
