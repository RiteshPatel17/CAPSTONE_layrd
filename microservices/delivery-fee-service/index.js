// ─────────────────────────────────────────────
// LÄYRD – delivery-fee-service (Express, port 3001)
//
// WHAT THIS DOES: given a customer's delivery address (or lat/lon from
// autocomplete), calculates the driving distance from the pickup origin
// via OpenRouteService and maps it to a flat delivery fee tier. Also
// serves live address-autocomplete suggestions as the customer types at
// checkout, bounded to the Calgary metro area.
//
// WHY A SEPARATE SERVICE (not just code inside the Next.js app): this was
// deliberately extracted out (see microservices/EXTRACTION-PLAN.md) so the
// OpenRouteService API key and all the geocoding logic live in one place,
// callable by the main app the same way any other backend dependency
// would be. The main app's own /api/delivery-fee and
// /api/address-autocomplete routes are thin proxies to this service —
// they exist so the browser never sees this service's URL or its
// x-internal-key secret directly.
//
// SECURITY: every request must include a header `x-internal-key` that
// matches this service's INTERNAL_SERVICE_KEY env var (see the middleware
// below). That key is shared by all 4 microservices — it proves "this
// call came from a trusted backend", not who the end customer is.
//
// FALLBACK: if this service is unreachable, the main app's proxy route
// falls back to an identical copy of this logic in src/lib/maps.js, so a
// deployment hiccup here doesn't fully block checkout.
// ─────────────────────────────────────────────
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
// No cors() here on purpose: this service is only ever called
// server-to-server by the main Next.js app (which proxies every
// client-facing request), never directly from a browser — a browser
// has no way to supply the x-internal-key header anyway. Leaving CORS
// off means a cross-origin browser request fails at the preflight
// stage instead of ever reaching the internal-key check.
app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid internal service key' });
  }
  next();
});

// ─────────────────────────────────────────────
// Rate limiting — in-memory (fine for a single instance). NOTE: the
// x-forwarded-for seen here is normally the main Next.js app's own
// address, not the end customer's — the main app already rate-limits
// /api/delivery-fee and /api/address-autocomplete per real customer IP
// before proxying here. This is a backstop against a runaway bug/loop
// or someone hitting this service directly with a leaked internal key,
// not the primary per-customer defense.
// ─────────────────────────────────────────────
const rateLimitStore = new Map();
function isRateLimited(key, { limit = 100, windowMs = 60 * 1000 } = {}) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    rateLimitStore.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return false;
}
setInterval(() => {
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  for (const [k, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter((t) => now - t < oneHourMs);
    if (fresh.length === 0) rateLimitStore.delete(k);
    else rateLimitStore.set(k, fresh);
  }
}, 10 * 60 * 1000);

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(`ip:${ip}`)) {
    return res.status(429).json({ error: 'Too many requests, please slow down.' });
  }
  next();
});

const DEFAULT_ORIGIN = process.env.PICKUP_ORIGIN_ADDRESS || "336 Pinewind Close NE, Calgary, AB";

// Calgary's approximate centre — used to bias autocomplete results toward local addresses
const CALGARY_FOCUS = { lon: -114.0719, lat: 51.0447 };

// A generous bounding box around Calgary (covers the whole metro area plus a
// buffer). Unlike focus.point, this HARD-restricts autocomplete results —
// without it, ORS happily suggests similarly-named streets anywhere in
// Canada (e.g. "Marine Drive" in Burnaby, BC).
const CALGARY_BOUNDS = { minLon: -114.35, minLat: 50.80, maxLon: -113.80, maxLat: 51.25 };

const DELIVERY_TIERS = [
  { maxKm: 5,   fee: 5  },
  { maxKm: 10,  fee: 10 },
  { maxKm: 15,  fee: 15 },
  { maxKm: 20,  fee: 20 },
  { maxKm: 25,  fee: 25 },
  { maxKm: Infinity, fee: 30 },
];

function getDeliveryFee(distanceKm) {
  const tier = DELIVERY_TIERS.find((t) => distanceKm <= t.maxKm);
  return tier ? tier.fee : 30;
}

// The pickup origin never changes at runtime, so geocode it once and reuse
// the result — this cuts one full external API round-trip (and one bite
// out of the ORS rate limit) off every single delivery-fee request.
let cachedOriginData = null;
let cachedOriginPromise = null;

async function getOriginData(origin) {
  if (cachedOriginData) return cachedOriginData;
  if (!cachedOriginPromise) {
    cachedOriginPromise = geocodeAddress(origin)
      .then((data) => {
        cachedOriginData = data;
        return data;
      })
      .catch((err) => {
        cachedOriginPromise = null; // allow a retry on the next request if this failed
        throw err;
      });
  }
  return cachedOriginPromise;
}

async function geocodeAddress(address) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

  // Same Calgary bounding box as autocomplete — without this, a plain street
  // name like "17 Ave" with no city/province in the text can resolve to a
  // same-named street in a completely different city.
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}` +
    `&boundary.rect.min_lon=${CALGARY_BOUNDS.minLon}&boundary.rect.min_lat=${CALGARY_BOUNDS.minLat}` +
    `&boundary.rect.max_lon=${CALGARY_BOUNDS.maxLon}&boundary.rect.max_lat=${CALGARY_BOUNDS.maxLat}` +
    `&focus.point.lon=${CALGARY_FOCUS.lon}&focus.point.lat=${CALGARY_FOCUS.lat}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`);

  const data = await res.json();
  if (!data.features || data.features.length === 0) {
    throw new Error(`Address not found: ${address}`);
  }

  return {
    coords: data.features[0].geometry.coordinates,
    properties: data.features[0].properties
  };
}

/**
 * Live address autocomplete — used as the user types in the checkout delivery
 * address field. Hard-bounded to the Calgary metro area via boundary.rect,
 * plus focus.point so the most central matches rank first within that box.
 */
async function autocompleteAddress(text) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

  // layers=address restricts results to actual street-address records
  // (instead of also matching venues/POIs, which can bury or crowd out
  // house-number-first matches). size=10 pulls more candidates back before
  // we trim to 6, giving numeric-prefix queries more chances to surface.
  const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${apiKey}&text=${encodeURIComponent(text)}` +
    `&layers=address,street` +
    `&size=10` +
    `&boundary.rect.min_lon=${CALGARY_BOUNDS.minLon}&boundary.rect.min_lat=${CALGARY_BOUNDS.minLat}` +
    `&boundary.rect.max_lon=${CALGARY_BOUNDS.maxLon}&boundary.rect.max_lat=${CALGARY_BOUNDS.maxLat}` +
    `&focus.point.lon=${CALGARY_FOCUS.lon}&focus.point.lat=${CALGARY_FOCUS.lat}`;

  const res = await fetch(url);

  if (res.status === 429) {
    // ORS free tier rate limit hit — log clearly so it's visible in the
    // terminal instead of silently returning nothing with no explanation.
    console.warn("[ORS AUTOCOMPLETE] Rate limited (429 Too Many Requests). Slow down typing or upgrade the ORS plan.");
    return [];
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Autocomplete failed: ${res.status} ${res.statusText} ${bodyText}`);
  }

  const data = await res.json();
  if (!data.features) return [];

  return data.features.slice(0, 6).map((f) => ({
    label: f.properties.label,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
}

/**
 * Calculate driving distance/fee from pickup origin to a destination.
 * If destLat/destLon are already known (the user picked an autocomplete
 * suggestion), destination geocoding is skipped entirely — this is what
 * lets the checkout page calculate the fee the instant an address is
 * selected, with no separate "Check" step.
 *
 * Because geocodeAddress() and autocompleteAddress() are both hard-bounded
 * to the Calgary rectangle, any coordinate pair we get from them is, by
 * construction, inside Calgary — there's no need to text-match "calgary"
 * in the result properties, which was fragile and occasionally wrong.
 */
async function getDeliveryDistance({ destination, destLat, destLon, origin = DEFAULT_ORIGIN }) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

    const originData = await getOriginData(origin);
    const startCoords = `${originData.coords[0]},${originData.coords[1]}`;

    let endCoords;

    if (destLat != null && destLon != null) {
      // Coordinates already resolved by the Calgary-bounded autocomplete
      endCoords = `${destLon},${destLat}`;
    } else {
      // geocodeAddress() only ever returns matches inside the Calgary
      // rectangle, or throws if nothing matched there.
      const destData = await geocodeAddress(destination);
      endCoords = `${destData.coords[0]},${destData.coords[1]}`;
    }

    const dirUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;
    const res = await fetch(dirUrl);
    if (!res.ok) throw new Error(`Directions API failed: ${res.status} ${res.statusText}`);

    const dirData = await res.json();
    if (!dirData.features || dirData.features.length === 0) {
      throw new Error(`No route found between ${origin} and ${destination}`);
    }

    const summary = dirData.features[0].properties.summary;
    const distanceKm = summary.distance / 1000;
    const durationMin = summary.duration / 60;

    console.log(`[MAPS API] Distance to "${destination || `${destLat},${destLon}`}": ${distanceKm.toFixed(1)} km`);

    return {
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      durationMin: Math.ceil(durationMin),
      isWithinCalgary: true, // guaranteed by the bounding box on geocoding above
      isMock: false
    };

  } catch (error) {
    console.error("[MAPS API ERROR]", error);

    // geocodeAddress() throws "Address not found" specifically when nothing
    // matched inside the Calgary bounding box — that genuinely does mean
    // "not deliverable here" (or a typo), not a transient API failure.
    if (error.message && error.message.startsWith("Address not found")) {
      return {
        distanceKm: 0,
        durationMin: 0,
        isWithinCalgary: false,
        isMock: false,
        message: "We couldn't find that address in Calgary. Please check it and try again.",
      };
    }

    // Any other failure (network hiccup, directions API down, etc.) — fall
    // back to a fixed mid-tier estimate so checkout isn't fully blocked. A
    // *random* distance here would mean two customers hitting the same
    // outage could be charged wildly different, arbitrary delivery fees;
    // a fixed estimate is at least predictable and fair, and isMock still
    // surfaces to the customer as "(estimated)" either way.
    const mockDistanceKm = 15;
    const mockDurationMin = Math.floor(mockDistanceKm * 2.5);

    console.log(`[MAPS API STUB] Distance to "${destination}": ${mockDistanceKm} km (Fallback)`);

    return {
      distanceKm: mockDistanceKm,
      durationMin: mockDurationMin,
      isWithinCalgary: true,
      isMock: true
    };
  }
}

app.get('/api/address-autocomplete', async (req, res) => {
  const text = req.query.text;

  if (!text || text.trim().length < 3) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await autocompleteAddress(text);
    return res.json({ suggestions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return res.status(500).json({ error: "Failed to fetch address suggestions" });
  }
});

app.get('/api/delivery-fee', async (req, res) => {
  const { address, lat, lon, label } = req.query;

  if (!address && !(lat && lon)) {
    return res.status(400).json({ error: "Address or coordinates are required" });
  }

  try {
    const distanceData = await getDeliveryDistance({
      destination: address || label,
      destLat: lat ? parseFloat(lat) : undefined,
      destLon: lon ? parseFloat(lon) : undefined,
    });

    if (!distanceData.isWithinCalgary) {
      return res.json({
        isWithinCalgary: false,
        distanceKm: distanceData.distanceKm,
        fee: 0,
        message: distanceData.message || "Outside Calgary – pickup only",
      });
    }

    const fee = getDeliveryFee(distanceData.distanceKm);

    return res.json({
      isWithinCalgary: true,
      distanceKm: distanceData.distanceKm,
      durationMin: distanceData.durationMin,
      fee,
      isMock: distanceData.isMock || false,
    });
  } catch (error) {
    console.error("Delivery fee error:", error);
    return res.status(500).json({ error: "Failed to calculate delivery fee" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Delivery Fee Service running on port ${PORT}`);
});