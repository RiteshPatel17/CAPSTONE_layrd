import { NextResponse } from "next/server";
import { getSiteImages } from "../../../lib/admin-site-images.js";

export async function GET() {
  try {
    const images = await getSiteImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error("[API Site Images] Error:", error);
    return NextResponse.json({}, { status: 500 });
  }
}