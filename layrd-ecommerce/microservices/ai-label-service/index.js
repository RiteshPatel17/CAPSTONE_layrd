// ─────────────────────────────────────────────
// LÄYRD – ai-label-service (Express, port 3004)
//
// WHAT THIS DOES: powers the AI Label Studio feature for approved event
// orders. Two jobs: (1) suggest short label text via Google Gemini
// (falls back to canned suggestions if Gemini isn't configured/fails),
// and (2) render the chosen text into an actual circular label PNG
// (via @resvg/resvg-js, built from an SVG template) and store it in
// Supabase Storage.
//
// WHY A SEPARATE SERVICE: isolates the Gemini API key and the
// image-rendering dependencies (Resvg, font files, the logo asset) from
// the main Next.js app, and lets this specific feature be worked on/
// redeployed independently.
//
// SECURITY LAYERS on top of the shared internal key (see middleware
// below): the customer-facing routes additionally verify the caller's own
// Supabase session and check they own the event inquiry they're
// submitting a label for (see checkEventEligibility-equivalent checks
// inline). The admin-only /regenerate-image route additionally verifies
// the caller's Supabase session has an "admin" profile role — the shared
// internal key alone only proves "this is a trusted backend call", not
// which specific user is making it, so routes that need to know *who*
// re-check that themselves.
// ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const { Resvg } = require('@resvg/resvg-js');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FONT_PATH = path.resolve(__dirname, 'fonts/CormorantGaramond-Italic.ttf');
const LOGO_ICON_PATH = path.resolve(__dirname, 'assets/logo-icon.png');

let LOGO_ICON_BASE64 = null;
try {
  LOGO_ICON_BASE64 = fs.readFileSync(LOGO_ICON_PATH).toString('base64');
} catch (err) {
  console.error('[AI Label Image] Could not load logo-icon.png — labels will render without the icon:', err.message);
}

app.use((req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid x-internal-key header' });
  }
  next();
});

// ─────────────────────────────────────────────
// Rate limiting — protects the Gemini API budget and image rendering
// from excessive use. Lives in server memory (fine for a single instance).
// ─────────────────────────────────────────────
const rateLimitStore = new Map();

function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    const retryAfterMs = windowMs - (now - timestamps[0]);
    rateLimitStore.set(key, timestamps);
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter((t) => now - t < oneDayMs);
    if (fresh.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, fresh);
  }
}, 60 * 60 * 1000);

const RATE_LIMITS = {
  generateShort: { max: 8, windowMs: 10 * 60 * 1000 },
  generateDaily: { max: 25, windowMs: 24 * 60 * 60 * 1000 },
  generateGlobalDaily: { max: 300, windowMs: 24 * 60 * 60 * 1000 },
  submitDaily: { max: 20, windowMs: 24 * 60 * 60 * 1000 },
  previewShort: { max: 60, windowMs: 60 * 1000 },
};

function buildPrompt({ tone, eventType, customerName, eventDate, notes }) {
  const lines = [
    `You are writing the short headline text for a physical dessert can label for LÄYRD, a boutique Calgary dessert brand.`,
    ``,
    `Write exactly 3 options. Each option must be ONLY 2 to 3 words — this is a strict hard limit, not a suggestion. Think of it like a small badge or wordmark, not a sentence.`,
    `Tone: ${tone}`,
    `Occasion: ${eventType || "special event"}`,
    customerName ? `You may reference the name: ${customerName}` : "",
    eventDate ? `Event date: ${eventDate}` : "",
    notes ? `Additional notes: ${notes}` : "",
    ``,
    `Rules:`,
    `- Each option: 2 to 3 words maximum. No full sentences.`,
    `- No punctuation at the end (no periods).`,
    `- Emojis are not allowed — this text will be printed on a physical label.`,
    `- Output exactly 3 lines, numbered 1. 2. 3. — no extra explanation.`,
  ].filter((l) => l !== undefined && l !== "").join("\n");
  return lines;
}

function getMockSuggestions({ tone, customerName }) {
  const firstName = (customerName || "").split(" ")[0];
  const mock = {
    Elegant: ["Crafted With Grace", "Simply Elegant", firstName ? `For ${firstName}` : "For You"],
    Romantic: ["Sweetly Yours", "Made With Love", "Forever Sweet"],
    Playful: ["Let's Get LÄYRD", "Cheers To This", "Sweet Celebration"],
    Luxury: ["Pure Indulgence", "Crafted Excellence", "Simply Exquisite"],
    Minimal: [firstName || "LÄYRD", "Calgary Made", "Handcrafted Layers"],
    Birthday: [firstName ? `Happy Birthday ${firstName}` : "Happy Birthday", "Another Sweet Year", "Sweet Birthday Wishes"],
    Wedding: ["A Sweet Beginning", "Together Forever", "Love, Layered"],
    Corporate: ["With Compliments", "Celebrating Excellence", "LÄYRD Thank You"],
  };
  return mock[tone] ?? mock["Elegant"];
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildLabelSVG(text) {
  const size = 800;
  const cx = size / 2;
  const cy = size / 2;

  const iconSize = size * 0.22;
  const iconX = cx - iconSize / 2;
  const iconY = size * 0.14;

  const clean = (text || "Your Event").trim();

  let fontSize = size * 0.155;
  if (clean.length > 11) fontSize = size * 0.13;
  if (clean.length > 16) fontSize = size * 0.105;
  if (clean.length > 22) fontSize = size * 0.085;

  const textY = size * 0.585;
  const lineY = size * 0.665;
  const captionY = size * 0.72;

  const iconMarkup = LOGO_ICON_BASE64
    ? `<image x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" href="data:image/png;base64,${LOGO_ICON_BASE64}" />`
    : "";

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="circleClip"><circle cx="${cx}" cy="${cy}" r="${size / 2 - 6}" /></clipPath>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${size / 2 - 6}" fill="#FFFFFF" stroke="#EDEAE2" stroke-width="3" />
  <g clip-path="url(#circleClip)">
    ${iconMarkup}
    <text x="${cx}" y="${textY}" font-family="Cormorant Garamond, Georgia, serif" font-style="normal" font-weight="600" font-size="${fontSize}" fill="#0E0E0E" text-anchor="middle">${escapeXml(clean)}</text>
    <line x1="${cx - size * 0.08}" y1="${lineY}" x2="${cx + size * 0.08}" y2="${lineY}" stroke="#B89B5E" stroke-width="3" />
    <text x="${cx}" y="${captionY}" font-family="Inter, sans-serif" font-size="${size * 0.028}" letter-spacing="${size * 0.005}" fill="#77736B" text-anchor="middle">LÄYRD · CALGARY</text>
  </g>
</svg>`;
}

function generateLabelImage(text) {
  const svg = buildLabelSVG(text);
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [FONT_PATH],
      loadSystemFonts: false,
      defaultFontFamily: "Cormorant Garamond",
    },
    fitTo: { mode: "width", value: 1000 },
  });
  return resvg.render().asPng();
}

async function uploadLabelImage(buffer, eventInquiryId, labelId) {
  const filePath = `${eventInquiryId}/${labelId}.png`;
  const { error } = await supabase.storage
    .from("label-artwork")
    .upload(filePath, buffer, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return filePath;
}

async function getSignedImageUrl(filePath) {
  if (!filePath) return null;
  const { data } = await supabase.storage
    .from("label-artwork")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);
  return data?.signedUrl || null;
}

app.post('/api/ai-labels', async (req, res) => {
  try {
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
      .select("id, customer_id, status, deposit_paid, core_cans, limited_cans")
      .eq("id", eventInquiryId)
      .single();

    if (evtCheckErr || !existingEvent || existingEvent.customer_id !== user.id) {
      return res.status(403).json({ error: "Forbidden: Invalid event inquiry" });
    }

    // Labels unlock once the deposit is paid — this does NOT wait for admin
    // approval, so customers can design while their event is still under
    // review. If admin later rejects the event, submitted labels get
    // cascade-declined (see the Next.js app's events/route.js PATCH).
    if (["Rejected", "Cancelled", "Completed"].includes(existingEvent.status)) {
      return res.status(403).json({ error: "Forbidden: This event is no longer eligible for label design." });
    }

    if (!existingEvent.deposit_paid) {
      return res.status(403).json({ error: "Forbidden: A deposit must be confirmed before designing labels." });
    }

    if (action === "submit") {
      const submitLimit = checkRateLimit(`submit:${user.id}`, RATE_LIMITS.submitDaily.max, RATE_LIMITS.submitDaily.windowMs);
      if (!submitLimit.allowed) {
        return res.status(429).json({
          error: `You've reached today's limit for label submissions. Please try again in a few hours.`,
        });
      }

      // 3-word hard cap — enforced here too, not just as a disabled button
      // client-side, since anything past 3 words won't fit the label's
      // circular frame regardless of how the request was made.
      const wordCount = (editedText || "").trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 3) {
        return res.status(400).json({ error: "Label text must be 3 words or fewer." });
      }

      const defaultQuantity = (existingEvent.core_cans || 0) + (existingEvent.limited_cans || 0) || null;

      const { data: inserted, error } = await supabase
        .from("ai_label_requests")
        .insert([{
          event_inquiry_id: eventInquiryId,
          customer_id: user.id,
          tone: tone,
          event_type: eventType,
          customer_name_on_label: customerName || null,
          generated_text: editedText,
          status: "Pending",
          quantity: defaultQuantity,
        }])
        .select()
        .single();

      if (error) {
        console.error("[API AI Labels] Submit error:", error);
        return res.status(500).json({ error: "Failed to save submission" });
      }

      fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/ai-label-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': process.env.INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({
          eventInquiryId,
          customerEmail: user.email,
          customerName,
          tone,
          eventType,
          quantity: defaultQuantity,
        }),
      }).catch((err) => console.error('[AI Label Submit] Admin email trigger failed:', err.message));

      let labelImagePath = null;
      try {
        const pngBuffer = generateLabelImage(editedText);
        labelImagePath = await uploadLabelImage(pngBuffer, eventInquiryId, inserted.id);
        await supabase
          .from("ai_label_requests")
          .update({ label_image_path: labelImagePath })
          .eq("id", inserted.id);
      } catch (imgErr) {
        console.error("[AI Label Image] Generation/upload failed:", imgErr);
      }

      const labelImageUrl = await getSignedImageUrl(labelImagePath);

      return res.json({
        success: true,
        submission: { ...inserted, label_image_path: labelImagePath, quantity: defaultQuantity },
        labelImageUrl,
      });
    }

    if (!tone) {
      return res.status(400).json({ error: "Bad Request: Tone is required" });
    }

    const shortLimit = checkRateLimit(`gen-short:${user.id}`, RATE_LIMITS.generateShort.max, RATE_LIMITS.generateShort.windowMs);
    if (!shortLimit.allowed) {
      return res.status(429).json({
        error: `You're generating labels a bit fast — please wait about ${Math.ceil(shortLimit.retryAfterSeconds / 60)} minute(s) and try again.`,
      });
    }

    const dailyLimit = checkRateLimit(`gen-daily:${user.id}`, RATE_LIMITS.generateDaily.max, RATE_LIMITS.generateDaily.windowMs);
    if (!dailyLimit.allowed) {
      return res.status(429).json({
        error: `You've reached today's limit for generating label suggestions. Please try again tomorrow.`,
      });
    }

    const globalLimit = checkRateLimit(`gen-global`, RATE_LIMITS.generateGlobalDaily.max, RATE_LIMITS.generateGlobalDaily.windowMs);
    if (!globalLimit.allowed) {
      return res.status(429).json({
        error: `Label generation is temporarily at capacity for today. Please try again tomorrow, or contact us directly.`,
      });
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
          .filter(Boolean)
          .map((l) => l.split(/\s+/).slice(0, 3).join(" "));

        if (lines.length >= 3) {
          return res.json({ suggestions: lines.slice(0, 3) });
        }
      } catch (err) {
        console.error("[GEMINI] Error generating labels:", err);
      }
    } else {
      console.log("[GEMINI] GEMINI_API_KEY not set — using mock suggestions");
    }

    return res.json({ suggestions: getMockSuggestions({ tone, customerName }) });

  } catch (err) {
    console.error("[API AI Labels] Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/ai-labels/regenerate-image', async (req, res) => {
  try {
    // This action is admin-only. The shared x-internal-key middleware above
    // only proves the caller is a trusted internal service, not that the
    // specific caller is an admin — so unlike a customer-facing endpoint,
    // this route additionally requires and verifies the caller's own
    // Supabase session to be an admin, closing the gap where anyone holding
    // the shared key could regenerate/overwrite any customer's label image.
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    const { labelId } = req.body;
    if (!labelId) return res.status(400).json({ error: "labelId is required" });

    const { data: label, error: fetchErr } = await supabase
      .from("ai_label_requests")
      .select("id, event_inquiry_id, generated_text")
      .eq("id", labelId)
      .single();

    if (fetchErr || !label) return res.status(404).json({ error: "Label not found" });

    const pngBuffer = generateLabelImage(label.generated_text);
    const labelImagePath = await uploadLabelImage(pngBuffer, label.event_inquiry_id, label.id);

    const { data: updated, error: updateErr } = await supabase
      .from("ai_label_requests")
      .update({ label_image_path: labelImagePath, updated_at: new Date().toISOString() })
      .eq("id", labelId)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: "Failed to save regenerated image" });

    const labelImageUrl = await getSignedImageUrl(labelImagePath);

    return res.json({ success: true, submission: updated, labelImageUrl });
  } catch (err) {
    console.error("[AI Label Regenerate] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lightweight live-preview endpoint — renders the real label picture on the fly
// as the customer types, but doesn't save anything to the database or storage.
app.post('/api/ai-labels/preview-image', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    const previewLimit = checkRateLimit(`preview:${user.id}`, RATE_LIMITS.previewShort.max, RATE_LIMITS.previewShort.windowMs);
    if (!previewLimit.allowed) {
      return res.status(429).json({ error: "Preview updates are paused for a moment — slow down just a bit." });
    }

    const { text } = req.body;
    const pngBuffer = generateLabelImage(text || "");
    const imageDataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    return res.json({ imageDataUrl });
  } catch (err) {
    console.error("[AI Label Preview] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`ai-label-service running on port ${PORT}`);
});