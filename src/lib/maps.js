// ─────────────────────────────────────────────
// LÄYRD – OpenRouteService Distance Matrix
// ─────────────────────────────────────────────

// Pickup origin (Pineridge NE, Calgary) – exact address stored in admin settings
const DEFAULT_ORIGIN = process.env.PICKUP_ORIGIN_ADDRESS || "336 Pinewind Close NE, Calgary, AB";

/**
 * Helper to geocode an address into coordinates
 */
async function geocodeAddress(address) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");
  
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`;
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
 * Calculate driving distance (km) from pickup to customer address
 * @param {string} destination – customer's full address
 * @param {string} [origin] – override pickup address (from admin settings)
 * @returns {Promise<{ distanceKm: number, durationMin: number, isWithinCalgary: boolean, isMock: boolean }>}
 */
export async function getDeliveryDistance(destination, origin = DEFAULT_ORIGIN) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

    // 1. Geocode both addresses
    const originData = await geocodeAddress(origin);
    const destData = await geocodeAddress(destination);

    // 2. Format coordinates for directions API: start=lon,lat&end=lon,lat
    const startCoords = `${originData.coords[0]},${originData.coords[1]}`;
    const endCoords = `${destData.coords[0]},${destData.coords[1]}`;

    // 3. Call Directions API
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

    // 4. Verify if destination is within Calgary
    const isWithinCalgary = JSON.stringify(destData.properties).toLowerCase().includes("calgary");

    console.log(`[MAPS API] Distance to "${destination}": ${distanceKm.toFixed(1)} km`);

    return {
      distanceKm: parseFloat(distanceKm.toFixed(1)),
      durationMin: Math.ceil(durationMin),
      isWithinCalgary,
      isMock: false
    };

  } catch (error) {
    console.error("[MAPS API ERROR]", error);
    // Fallback to mock behavior if API fails so checkout isn't completely blocked
    const mockDistanceKm = Math.floor(Math.random() * 30) + 1;
    const mockDurationMin = Math.floor(mockDistanceKm * 2.5);
    const isWithinCalgary = destination.toLowerCase().includes("calgary");
    
    console.log(`[MAPS API STUB] Distance to "${destination}": ${mockDistanceKm} km (Fallback)`);

    return {
      distanceKm: mockDistanceKm,
      durationMin: mockDurationMin,
      isWithinCalgary,
      isMock: true
    };
  }
}

/**
 * Check if an address is within Calgary
 * @param {string} address
 */
export async function isWithinCalgary(address) {
  try {
    const data = await geocodeAddress(address);
    return JSON.stringify(data.properties).toLowerCase().includes("calgary");
  } catch (error) {
    console.error("[MAPS GEOCODE ERROR]", error);
    return address.toLowerCase().includes("calgary"); // naive fallback
  }
}
