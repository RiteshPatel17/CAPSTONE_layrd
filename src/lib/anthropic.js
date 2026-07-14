// ─────────────────────────────────────────────
// LÄYRD – Anthropic AI label generation stub
// TODO: npm install @anthropic-ai/sdk
// ─────────────────────────────────────────────

/**
 * Generate 3 AI label suggestions for an event
 * @param {{ tone: string, eventType: string, customerName: string, eventDate: string, notes: string }} params
 * @returns {Promise<string[]>} Array of 3 label text suggestions
 */
export async function generateLabelSuggestions({ tone, eventType, customerName, eventDate, notes }) {
  // TODO: Replace with real Anthropic call
  // const Anthropic = require('@anthropic-ai/sdk');
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const message = await client.messages.create({ ... });

  // Mock suggestions
  const mockSuggestions = {
    Elegant: [
      `With grace and love, crafted for ${customerName || "you"}`,
      `A moment of pure indulgence – ${eventType || "your special day"}`,
      `Handcrafted with care. A LÄYRD creation.`,
    ],
    Romantic: [
      `Sweet moments, sweeter memories 🍰`,
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
      `${customerName || "Mr. & Mrs."} – A sweet beginning 💍`,
      `As you begin forever together… indulge in the layers`,
      `Celebrating love, one can at a time`,
    ],
    Corporate: [
      `With compliments from ${customerName || "our team"}`,
      `Celebrating excellence – ${eventType || "your team"}`,
      `Thank you. A LÄYRD experience.`,
    ],
  };

  console.log(`[AI STUB] Generating ${tone} labels for "${eventType}"`);

  return mockSuggestions[tone] || mockSuggestions["Elegant"];
}
