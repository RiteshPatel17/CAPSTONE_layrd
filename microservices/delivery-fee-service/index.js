import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
app.use((req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (!key || key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid internal service key' });
  }
  next();
});

const DEFAULT_ORIGIN = process.env.PICKUP_ORIGIN_ADDRESS || "336 Pinewind Close NE, Calgary, AB";
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
  
  return {
    coords: data.features[0].geometry.coordinates,
    properties: data.features[0].properties
  };
}

async function getDeliveryDistance(destination, origin = DEFAULT_ORIGIN) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) throw new Error("OPENROUTESERVICE_API_KEY is not set.");

    const originData = await geocodeAddress(origin);
    const destData = await geocodeAddress(destination);

    const startCoords = `${originData.coords[0]},${originData.coords[1]}`;
    const endCoords = `${destData.coords[0]},${destData.coords[1]}`;

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

app.get('/api/delivery-fee', async (req, res) => {
  const address = req.query.address;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const distanceData = await getDeliveryDistance(address);

    if (!distanceData.isWithinCalgary) {
      return res.json({
        isWithinCalgary: false,
        distanceKm: distanceData.distanceKm,
        fee: 0,
        message: "Outside Calgary – pickup only",
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
