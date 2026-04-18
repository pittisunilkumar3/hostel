import { NextRequest } from "next/server";
import { userService } from "../services";
import { successResponse, errorResponse } from "../utils";

// POST /api/auth/register
export async function registerController(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone, address, hostel_name, hostel_address, id_proof } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email and password are required", 400);
    }

    const result = await userService.registerUser({ name, email, password, role, phone, address, hostel_name, hostel_address, id_proof });

    return successResponse(result, "User registered successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// POST /api/auth/login/user
export async function userLoginController(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    const result = await userService.loginUser(email, password, "CUSTOMER");
    return successResponse(result, "User login successful");
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}

// POST /api/auth/login/admin
export async function adminLoginController(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    const result = await userService.loginUser(email, password, "SUPER_ADMIN");
    return successResponse(result, "Admin login successful");
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}

// POST /api/auth/login/owner
export async function ownerLoginController(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    const result = await userService.loginUser(email, password, "OWNER");
    return successResponse(result, "Owner login successful");
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}
