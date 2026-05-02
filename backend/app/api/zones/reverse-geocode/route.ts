import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/zones/reverse-geocode?lat=17.3&lng=78.4 — Reverse geocode coordinates to address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "";
    const lng = searchParams.get("lng") || "";

    if (!lat || !lng) {
      return successResponse({ address: "" }, "No coordinates");
    }

    // Use Google Maps Geocoding API from settings
    const mapRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/settings/map`);
    const mapData = await mapRes.json();
    const apiKey = mapData?.data?.mapApiKeyClient;

    if (!apiKey) {
      return successResponse({ address: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` }, "No API key");
    }

    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const geoData = await geoRes.json();

    if (geoData.status === "OK" && geoData.results?.length > 0) {
      return successResponse({ address: geoData.results[0].formatted_address }, "Address found");
    }

    return successResponse({ address: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` }, "Geocode fallback");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
