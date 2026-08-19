import { NextResponse } from "next/server";
import {
  validateApplication,
  findRecentDuplicate,
  createApplication,
} from "../../../lib/wholesale-applications.js";
import { isRateLimited } from "../../../lib/rate-limit.js";
import { notifyAsync } from "../../../lib/notify.js";

const GENERIC_SUCCESS = { ok: true, message: "Your wholesale application has been received." };
const GENERIC_ERROR = { ok: false, message: "We could not submit your application. Please try again." };

export async function POST(request) {
  try {
    const rawText = await request.text();

    // Payload size guard
    if (rawText.length > 20_000) {
      return NextResponse.json(GENERIC_ERROR, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      return NextResponse.json(GENERIC_ERROR, { status: 400 });
    }

    // Honeypot — bots that fill this out get a fake success, no insert
    if (payload.website_confirm) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`wholesale:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
      return NextResponse.json(GENERIC_ERROR, { status: 429 });
    }

    const validation = validateApplication(payload);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    const isDuplicate = await findRecentDuplicate(payload.email, payload.business_name);
    if (isDuplicate) {
      // Don't reveal duplicate status to the client — same success response either way
      return NextResponse.json(GENERIC_SUCCESS);
    }

    await createApplication(payload);

    notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/wholesale-inquiry`, {
      businessName: payload.business_name,
      contactName: payload.contact_name,
      email: payload.email,
      phone: payload.phone,
      businessType: payload.business_type,
      expectedVolume: payload.expected_volume,
      expectedFrequency: payload.expected_frequency,
    }, { label: "Business Applications" });

    return NextResponse.json(GENERIC_SUCCESS);
  } catch (error) {
    console.error("[Business Applications] Unexpected error:", error.message);
    return NextResponse.json(GENERIC_ERROR, { status: 500 });
  }
}