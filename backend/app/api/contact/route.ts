import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import pool from "@/src/config/database";

// POST /api/contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return errorResponse("Name, email, subject, and message are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Please enter a valid email address", 400);
    }

    // Create contact_messages table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'replied') DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Insert contact message
    await pool.execute(
      `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone || null, subject, message]
    );

    return successResponse(null, "Message sent successfully! We'll get back to you within 24 hours.");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
