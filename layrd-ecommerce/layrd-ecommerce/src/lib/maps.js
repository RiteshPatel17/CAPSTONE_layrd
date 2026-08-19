
const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY;


const PICKUP_ORIGIN_ADDRESS = process.env.PICKUP_ORIGIN_ADDRESS;


const CALGARY_RADIUS_KM = 40;


const MOCK_FALLBACK = {
  distanceKm: 8,
  durationMin: 15,
  isWithinCalgary: true,
  isMock: true, // lets the UI show "(estimated)" next to the fee if we want
};


async function geocodeAddress(address) {
  const url = `https://api.heigit.org/pelias/v1/search` +
    `?api_key=${ORS_API_KEY}` +
    `&text=${encodeURIComponent(address)}` +
    `&size=1` +
    `&boundary.country=CA` +
    `&focus.point.lat=51.08` +
    `&focus.point.lon=-114.08`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding request failed with status ${res.status}`);
  }

  const data = await res.json();

  
  const feature = data.features?.[0];
  if (!feature) {
    // No results = address couldn't be found/understood by the geocoder
    throw new Error(`No geocoding results found for address: ${address}`);
  }

  const [lon, lat] = feature.geometry.coordinates;
  return { lat, lon };
}

/**
 * Calculates real driving distance between the fixed pickup origin and a
 * customer's delivery address.
 *
 * @param {string} destinationAddress - Customer's typed delivery address
 * @returns {Promise<{distanceKm: number, durationMin: number, isWithinCalgary: boolean, isMock?: boolean}>}
 */
export async function getDeliveryDistance(destinationAddress) {
  
  if (!ORS_API_KEY || !PICKUP_ORIGIN_ADDRESS) {
    console.error(
      "maps.js: Missing OPENROUTESERVICE_API_KEY or PICKUP_ORIGIN_ADDRESS env var — falling back to mock distance."
    );
    return MOCK_FALLBACK;
  }

  try {
    // Step 1: geocode both addresses into coordinate pairs
    const origin = await geocodeAddress(PICKUP_ORIGIN_ADDRESS);
    const destination = await geocodeAddress(destinationAddress);


    // Step 2: call the ORS Matrix API for real driving distance/duration.
    // WHY Matrix API (not Directions API): Matrix is built for exactly this
    // "distance between two points" use case and returns simpler output.
    // Even though we only have ONE origin and ONE destination (not a true
    // matrix of many-to-many), the API still works fine for a 1x1 case.
    const matrixUrl = "https://api.heigit.org/openrouteservice/v2/matrix/driving-car";

    const matrixRes = await fetch(matrixUrl, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ORS also expects [lon, lat] order for locations, matching geocoding output
        locations: [
          [origin.lon, origin.lat],
          [destination.lon, destination.lat],
        ],
        // Explicitly tell ORS which indexes are sources/destinations —
        // index 0 = pickup origin, index 1 = customer address
        sources: [0],
        destinations: [1],
        metrics: ["distance", "duration"],
        units: "km",
      }),
    });
    
    if (!matrixRes.ok) {
      throw new Error(`Matrix API request failed with status ${matrixRes.status}`);
    }
    const matrixData = await matrixRes.json();

    // distances/durations come back as a 2D array: [sources][destinations]
    // Since we only asked for 1 source and 1 destination, this is [0][0]
    const distanceKm = matrixData.distances?.[0]?.[0];
    const durationSeconds = matrixData.durations?.[0]?.[0];

    if (distanceKm === undefined || distanceKm === null) {
      throw new Error("Matrix API returned no distance data");
    }

    return {
      distanceKm: Math.round(distanceKm * 10) / 10, // round to 1 decimal place
      durationMin: Math.round(durationSeconds / 60),
      isWithinCalgary: distanceKm <= CALGARY_RADIUS_KM,
    };
  } catch (err) {
    console.error("maps.js: getDeliveryDistance failed, falling back to mock:", err.message);
    return MOCK_FALLBACK;
  }
}