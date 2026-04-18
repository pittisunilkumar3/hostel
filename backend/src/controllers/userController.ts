import { NextRequest } from "next/server";
import { userService } from "../services";
import { successResponse, errorResponse, getPaginationParams } from "../utils";

// GET /api/users?page=1&limit=10
export async function getUsersController(request: NextRequest) {
  try {
    const { page, limit } = getPaginationParams(request);
    const result = await userService.getAllUsers(page, limit);
    return successResponse(result, "Users fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/users/:id
export async function getUserController(id: number) {
  try {
    const user = await userService.getUserById(id);
    return successResponse(user, "User fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

// PUT /api/users/:id
export async function updateUserController(id: number, request: NextRequest) {
  try {
    const body = await request.json();
    const user = await userService.updateUser(id, body);
    return successResponse(user, "User updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// DELETE /api/users/:id
export async function deleteUserController(id: number) {
  try {
    await userService.deleteUser(id);
    return successResponse(null, "User deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
