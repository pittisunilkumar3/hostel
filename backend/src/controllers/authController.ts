import { NextRequest } from "next/server";
import { userService } from "../services";
import { successResponse, errorResponse } from "../utils";
import { sendTemplatedEmail } from "../services/emailTemplateService";

// POST /api/auth/register
export async function registerController(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, phone, address, hostel_name, hostel_address, id_proof } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email and password are required", 400);
    }

    const result = await userService.registerUser({ name, email, password, role, phone, address, hostel_name, hostel_address, id_proof });

    // Send welcome email (non-blocking, don't fail registration if email fails)
    const emailType = role === "OWNER" ? "owner_registration" : "registration";
    sendTemplatedEmail(
      email,
      emailType,
      "user",
      { name, email }
    ).then(r => {
      if (r.success) console.log(`[Email] Welcome email sent to ${email}`);
      else console.log(`[Email] Welcome email failed: ${r.error}`);
    }).catch(e => console.error(`[Email] Error:`, e.message));

    // Also notify admin about new registration (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || "";
    if (adminEmail) {
      sendTemplatedEmail(
        adminEmail,
        "registration",
        "admin",
        { name, email, phone: phone || "" }
      ).catch(() => {});
    }

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
