import { NextResponse } from "next/server";
import { verifyAdminRequest } from "../../../../lib/admin-server-auth.js";
import { getContactMessages, markAsRead } from "../../../../lib/contact-messages.js";

export async function GET(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await getContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[Admin Contact] GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isRead } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing message id" }, { status: 400 });
    }
    await markAsRead(id, isRead);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Contact] PATCH error:", error.message);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}