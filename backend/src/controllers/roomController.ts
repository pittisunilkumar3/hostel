import { NextRequest } from "next/server";
import { roomService } from "../services";
import { successResponse, errorResponse, getPaginationParams } from "../utils";

// POST /api/rooms
export async function createRoomController(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomNumber, floor, capacity, type, pricePerMonth, amenities, description } = body;

    if (!roomNumber || !floor || !capacity || !type || !pricePerMonth) {
      return errorResponse("roomNumber, floor, capacity, type and pricePerMonth are required", 400);
    }

    const room = await roomService.createRoom({ roomNumber, floor, capacity, type, pricePerMonth, amenities, description });
    return successResponse(room, "Room created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// GET /api/rooms?page=1&limit=10
export async function getRoomsController(request: NextRequest) {
  try {
    const { page, limit } = getPaginationParams(request);
    const result = await roomService.getAllRooms(page, limit);
    return successResponse(result, "Rooms fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/rooms/available
export async function getAvailableRoomsController() {
  try {
    const rooms = await roomService.getAvailableRooms();
    return successResponse(rooms, "Available rooms fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/rooms/:id
export async function getRoomController(id: number) {
  try {
    const room = await roomService.getRoomById(id);
    return successResponse(room, "Room fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

// PUT /api/rooms/:id
export async function updateRoomController(id: number, request: NextRequest) {
  try {
    const body = await request.json();
    const room = await roomService.updateRoom(id, body);
    return successResponse(room, "Room updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// DELETE /api/rooms/:id
export async function deleteRoomController(id: number) {
  try {
    await roomService.deleteRoom(id);
    return successResponse(null, "Room deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
