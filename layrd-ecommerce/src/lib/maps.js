// ─────────────────────────────────────────────
// LÄYRD – OpenRouteService Distance Matrix
// (Local fallback — only used if delivery-fee-service is unreachable)
// ─────────────────────────────────────────────

// Pickup origin (Pineridge NE, Calgary) – exact address stored in admin settings
const DEFAULT_ORIGIN = process.env.PICKUP_ORIGIN_ADDRESS || "336 Pinewind Close NE, Calgary, AB";

// Same Calgary bounding box used by delivery-fee-service's autocomplete —
// without it, a plain street name with no city/province in the text (e.g.
// "17 Ave") can resolve to a same-named street in a different city entirely.
const CALGARY_BOUNDS = { minLon: -114.35, minLat: 50.80, maxLon: -113.80, maxLat: 51.25 };
const CALGARY_FOCUS = { lon: -114.0719, lat: 51.0447 };

// The pickup origin never changes at runtime, so geocode it once and reuse
// the result — cuts one external API round-trip off every request.
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

/**
 * Helper to geocode an address into coordinates, restricted to Calgary
 */
async function geocodeAddress(address) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

  const url = `https://api.heigit.org/pelias/v1/search?api_key=${apiKey}&text=${encodeURIComponent(address)}` +
    `&boundary.rect.min_lon=${CALGARY_BOUNDS.minLon}&boundary.rect.min_lat=${CALGARY_BOUNDS.minLat}` +
    `&boundary.rect.max_lon=${CALGARY_BOUNDS.maxLon}&boundary.rect.max_lat=${CALGARY_BOUNDS.maxLat}` +
    `&focus.point.lon=${CALGARY_FOCUS.lon}&focus.point.lat=${CALGARY_FOCUS.lat}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`);

  const data = await res.json();
  if (!data.features || data.features.length === 0) {
    throw new Error(`Address not found: ${address}`);
  }

  // Return the first match's coordinates and properties
  return {
    coords: data.features[0].geometry.coordinates, // [lon, lat]
    properties: data.features[0].properties
  };
}

/**
 * Calculate driving distance (km) from pickup to customer address.
 * geocodeAddress() is bounded to the Calgary rectangle, so a successful
 * match is guaranteed to be inside Calgary, and a failure genuinely means
 * the address isn't there (rather than a reason to guess a random distance).
 * @param {string} destination – customer's full address
 * @param {string} [origin] – override pickup address (from admin settings)
 * @returns {Promise<{ distanceKm: number, durationMin: number, isWithinCalgary: boolean, isMock: boolean, message?: string }>}
 */
export async function getDeliveryDistance(destination, origin = DEFAULT_ORIGIN) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

    // 1. Geocode both addresses (both bounded to Calgary)
    const originData = await getOriginData(origin);
    const destData = await geocodeAddress(destination);

    // 2. Format coordinates for directions API: start=lon,lat&end=lon,lat
    const startCoords = `${originData.coords[0]},${originData.coords[1]}`;
    const endCoords = `${destData.coords[0]},${destData.coords[1]}`;

    // 3. Call Directions API
    // NOTE: api.openrouteservice.org was deprecated (started returning 403)
    // and migrated to api.heigit.org — verified live 2026-08-19 (both this
    // endpoint and the geocode one above return real, correctly-shaped
    // responses with the current OPENROUTESERVICE_API_KEY).
    const dirUrl = `https://api.heigit.org/openrouteservice/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;
    const res = await fetch(dirUrl);
    if (!res.ok) throw new Error(`Directions API failed: ${res.status} ${res.statusText}`);

    const dirData = await res.json();
    if (!dirData.features || dirData.features.length === 0) {
      throw new Error(`No route found between ${origin} and ${destination}`);
    }

    const summary = dirData.features[0].properties.summary;
    const distanceKm = summary.distance / 1000;
    const durationMin = summary.duration / 60;

    console.log(`[MAPS API] Distance to "${destination}": ${distanceKm.toFixed(1)} km`);

    return {
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      durationMin: Math.ceil(durationMin),
      isWithinCalgary: true, // guaranteed by the bounding box on geocoding above
      isMock: false
    };

  } catch (error) {
    console.error("[MAPS API ERROR]", error);

    // A bounded geocode failure genuinely means "not in Calgary" (or a typo)
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

/**
 * Check if an address is within Calgary (bounded geocode succeeds or not)
 * @param {string} address
 */
export async function isWithinCalgary(address) {
  try {
    await geocodeAddress(address);
    return true; // geocodeAddress() only returns matches inside Calgary
  } catch (error) {
    console.error("[MAPS GEOCODE ERROR]", error);
    return false;
  }
}