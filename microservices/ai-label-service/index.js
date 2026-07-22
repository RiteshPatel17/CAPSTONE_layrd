const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Initialize Supabase Admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware: Verify Internal Service Key
app.use((req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid x-internal-key header' });
  }
  next();
});

// Helper: Build Gemini Prompt
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
  ].filter((l) => l !== undefined).join("\n");
  return lines;
}

// Helper: Mock Suggestions
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

// Main Endpoint: POST /api/ai-labels
app.post('/api/ai-labels', async (req, res) => {
  try {
    // 1. Verify JWT
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const { action, eventInquiryId, tone, eventType, editedText, customerName, notes, eventDate } = req.body;

    if (!eventInquiryId) {
      return res.status(400).json({ error: "Bad Request: eventInquiryId is required" });
    }

    const { data: existingEvent, error: evtCheckErr } = await supabase
      .from("event_inquiries")
      .select("id, customer_id, status")
      .eq("id", eventInquiryId)
      .single();

    if (evtCheckErr || !existingEvent || existingEvent.customer_id !== user.id) {
      return res.status(403).json({ error: "Forbidden: Invalid event inquiry" });
    }

    if (existingEvent.status !== "Approved") {
      return res.status(403).json({ error: "Forbidden: Labels can only be generated or submitted for approved event inquiries." });
    }

    // 3. Handle 'submit' action
    if (action === "submit") {
      const { data, error } = await supabase
        .from("ai_label_requests")
        .insert([{
          event_inquiry_id: eventInquiryId,
          customer_id: user.id,
          tone: tone,
          event_type: eventType,
          customer_name_on_label: customerName || null,
          generated_text: editedText,
          status: "Pending"
        }])
        .select()
        .single();

      if (error) {
        console.error("[API AI Labels] Submit error:", error);
        return res.status(500).json({ error: "Failed to save submission" });
      }
      
      return res.json({ success: true, submission: data });
    }

    // 4. Handle 'generate' action (or default)
    if (!tone) {
      return res.status(400).json({ error: "Bad Request: Tone is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = buildPrompt({ tone, eventType, customerName, eventDate, notes });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const raw = response.text?.trim() ?? "";
        const lines = raw
          .split("\n")
          .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean);

        if (lines.length >= 3) {
          return res.json({ suggestions: lines.slice(0, 3) });
        }
      } catch (err) {
        console.error("[GEMINI] Error generating labels:", err);
        // Fall through to mock suggestions
      }
    } else {
      console.log("[GEMINI] GEMINI_API_KEY not set — using mock suggestions");
    }

    return res.json({ suggestions: getMockSuggestions({ tone, eventType, customerName, eventDate }) });

  } catch (err) {
    console.error("[API AI Labels] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`ai-label-service running on port ${PORT}`);
});
