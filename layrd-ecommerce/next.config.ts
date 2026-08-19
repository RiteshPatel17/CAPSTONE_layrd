import type { NextConfig } from "next";

// Derives the Supabase Storage hostname directly from the Supabase URL
// already set in .env.local, instead of hardcoding it as a literal string.
//
// WHY THIS MATTERS FOR THE TEAM:
// If this project's Supabase project ever changes (new project, migrated
// database, different environment for staging/production), the hostname
// below updates automatically for everyone — no one needs to remember to
// come back and edit this file by hand. Each teammate's own .env.local
// already points at the correct Supabase project, so this just reads that
// same value rather than duplicating it as a second hardcoded source of
// truth that could drift out of sync.
//
// If you ever see a "next/image" error like:
//   "Invalid src prop ... hostname is not configured under images"
// that means an image is loading from a domain not in remotePatterns below.
// If it's a NEW external image source (not Supabase Storage — e.g. a CDN,
// a different bucket, an image-hosting service), add a new entry to the
// remotePatterns array; don't just widen or remove this one.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

const nextConfig: NextConfig = {
  // Produces a self-contained build (server.js + only the node_modules
  // files actually needed at runtime) instead of requiring the full
  // node_modules tree inside the Docker image — the standard, officially
  // recommended way to containerize a Next.js app.
  output: "standalone",
  experimental: {
    // Server Actions default to a 1MB body limit — too small for real
    // product/site image uploads (phone photos are often 3-10MB).
    // If uploads start failing again with a "Body exceeded 1 MB limit"
    // error, this is the first place to check — raise the number below.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;