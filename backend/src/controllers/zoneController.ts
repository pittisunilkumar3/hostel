import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import {
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  toggleZoneStatus,
  setDefaultZone,
  updateZoneSettings,
  getAllZoneCoordinates,
} from "@/src/services/zoneService";

// GET /api/zones — Public endpoint (no auth required)
export async function handleGetPublicZones(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const zones = await getAllZones(search);
    return successResponse(zones, "Zones fetched successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// GET /api/zones — List all zones (with optional ?search=)
export async function handleGetZones(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const zones = await getAllZones(search);
    return successResponse(zones, "Zones fetched successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/zones — Create new zone
export async function handleCreateZone(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, displayName, coordinates } = body;

    if (!name || !name.trim()) {
      return errorResponse("Zone name is required", 400);
    }

    const zone = await createZone({
      name: name.trim(),
      displayName: displayName?.trim() || null,
      coordinates: coordinates || null,
    });

    return successResponse(zone, "Zone created successfully", 201);
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") {
      return errorResponse("A zone with this name already exists", 400);
    }
    return errorResponse(e.message, 500);
  }
}

// GET /api/zones/[id] — Get single zone
export async function handleGetZone(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const zone = await getZoneById(id);
    if (!zone) return errorResponse("Zone not found", 404);
    return successResponse(zone, "Zone fetched successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/zones/[id] — Update zone (name, display_name, coordinates)
export async function handleUpdateZone(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const zone = await updateZone(id, {
      name: body.name?.trim(),
      displayName: body.displayName?.trim() || null,
      coordinates: body.coordinates,
    });
    if (!zone) return errorResponse("Zone not found", 404);
    return successResponse(zone, "Zone updated successfully");
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") {
      return errorResponse("A zone with this name already exists", 400);
    }
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/zones/[id]
export async function handleDeleteZone(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await deleteZone(id);
    return successResponse(null, "Zone deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PATCH /api/zones/[id]/status — Toggle status
export async function handleToggleStatus(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const zone = await toggleZoneStatus(id, !!body.status);
    if (!zone) return errorResponse("Zone not found", 404);
    return successResponse(zone, "Zone status updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PATCH /api/zones/[id]/default — Set as default
export async function handleSetDefault(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const zone = await setDefaultZone(id);
    if (!zone) return errorResponse("Zone not found", 404);
    return successResponse(zone, "Default zone updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/zones/[id]/settings — Update zone settings
export async function handleUpdateSettings(req: NextRequest, id: number) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const zone = await updateZoneSettings(id, {
      minimumServiceCharge: body.minimumServiceCharge ?? null,
      perKmServiceCharge: body.perKmServiceCharge ?? null,
      maximumServiceCharge: body.maximumServiceCharge ?? null,
      increasedServiceFee: body.increasedServiceFee ?? 0,
      increasedServiceFeeStatus: !!body.increasedServiceFeeStatus,
      increaseServiceChargeMessage: body.increaseServiceChargeMessage || null,
    });
    if (!zone) return errorResponse("Zone not found", 404);
    return successResponse(zone, "Zone settings updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// GET /api/zones/coordinates — All zone polygons for map overlay
export async function handleGetCoordinates(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("exclude") ? parseInt(searchParams.get("exclude")!) : undefined;
    const data = await getAllZoneCoordinates(excludeId);
    return successResponse(data, "Zone coordinates fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
