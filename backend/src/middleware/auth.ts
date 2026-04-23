import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends NextRequest {
  userId?: number;
  userRole?: string;
}

export const authMiddleware = (request: NextRequest) => {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Access denied. No token provided." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: number;
      role: string;
    };

    return decoded;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid token." },
      { status: 401 }
    );
  }
};

export const adminMiddleware = (request: NextRequest) => {
  const decoded = authMiddleware(request);
  if (decoded instanceof NextResponse) return decoded;

  if (decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "Access denied. Super Admin only." },
      { status: 403 }
    );
  }

  return decoded;
};

export const ownerMiddleware = (request: NextRequest) => {
  const decoded = authMiddleware(request);
  if (decoded instanceof NextResponse) return decoded;

  if (decoded.role !== "OWNER" && decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { success: false, message: "Access denied. Owner or Super Admin only." },
      { status: 403 }
    );
  }

  return decoded;
};

/**
 * Get authenticated user from JWT token in request header.
 * Returns decoded token or null if not authenticated.
 */
export const getAuthenticatedUser = (request: NextRequest): { userId: number; role: string } | null => {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number; role: string };
    return decoded;
  } catch {
    return null;
  }
};
