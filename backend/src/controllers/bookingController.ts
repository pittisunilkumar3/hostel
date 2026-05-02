import { NextRequest } from "next/server";
import { bookingService } from "../services";
import { successResponse, errorResponse, getPaginationParams } from "../utils";
import {
  sendPushNotification,
  sendPushNotificationByRole,
  isPushNotificationEnabled,
} from "../services/pushNotificationService";
import { sendTemplatedEmail } from "../services/emailTemplateService";
import { formatAmount } from "../utils/currency";
import db, { RowDataPacket } from "../config/database";

// POST /api/bookings
export async function createBookingController(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, roomId, checkIn, checkOut, totalAmount } = body;

    if (!studentId || !roomId || !checkIn || !totalAmount) {
      return errorResponse("studentId, roomId, checkIn and totalAmount are required", 400);
    }

    const booking = await bookingService.createBooking({ studentId, roomId, checkIn, checkOut, totalAmount });

    // Send push notification to admins about new booking
    try {
      if (await isPushNotificationEnabled("new_booking", "ADMIN")) {
        const [roomRows] = await db.execute<RowDataPacket[]>(
          "SELECT room_number FROM rooms WHERE id = ?", [roomId]
        );
        const [userRows] = await db.execute<RowDataPacket[]>(
          "SELECT name FROM users WHERE id = ?", [studentId]
        );
        const roomNumber = roomRows[0]?.room_number || roomId;
        const userName = userRows[0]?.name || "Customer";

        await sendPushNotificationByRole("SUPER_ADMIN", {
          title: "New Booking",
          body: `${userName} booked Room ${roomNumber}`,
          data: { type: "new_booking", bookingId: String(booking.id) },
        }, "new_booking");
      }

      // Notify owner about new booking
      if (await isPushNotificationEnabled("owner_new_booking", "OWNER")) {
        const [roomRows] = await db.execute<RowDataPacket[]>(
          "SELECT room_number FROM rooms WHERE id = ?", [roomId]
        );
        const [userRows] = await db.execute<RowDataPacket[]>(
          "SELECT name FROM users WHERE id = ?", [studentId]
        );
        const roomNumber = roomRows[0]?.room_number || roomId;
        const userName = userRows[0]?.name || "Customer";

        await sendPushNotificationByRole("OWNER", {
          title: "New Booking",
          body: `${userName} booked Room ${roomNumber}`,
          data: { type: "new_booking", bookingId: String(booking.id) },
        }, "new_booking");
      }
    } catch (notifError: any) {
      console.error("[Push] Booking notification error:", notifError.message);
    }

    // Send booking confirmation email to customer (non-blocking)
    try {
      const [userRows] = await db.execute<RowDataPacket[]>(
        "SELECT name, email FROM users WHERE id = ?", [studentId]
      );
      const [roomRows] = await db.execute<RowDataPacket[]>(
        "SELECT room_number FROM rooms WHERE id = ?", [roomId]
      );
      const user = userRows[0];
      const room = roomRows[0];
      if (user?.email) {
        sendTemplatedEmail(
          user.email,
          "booking_confirmation",
          "user",
          {
            name: user.name || "Customer",
            email: user.email,
            room_name: room?.room_number || String(roomId),
            check_in: checkIn || "",
            check_out: checkOut || "",
            amount: String(totalAmount || ""),
          }
        ).then(r => {
          if (r.success) console.log(`[Email] Booking confirmation sent to ${user.email}`);
          else console.log(`[Email] Booking email failed: ${r.error}`);
        }).catch(e => console.error(`[Email] Error:`, e.message));
      }

      // Notify admin about new booking via email
      const adminEmail = process.env.ADMIN_EMAIL || "";
      if (adminEmail) {
        sendTemplatedEmail(
          adminEmail,
          "new_booking",
          "admin",
          {
            customer_name: user?.name || "Customer",
            room_name: room?.room_number || String(roomId),
            check_in: checkIn || "",
            check_out: checkOut || "",
            amount: String(totalAmount || ""),
          }
        ).catch(() => {});
      }
    } catch (emailErr: any) {
      console.error("[Email] Booking email error:", emailErr.message);
    }

    return successResponse(booking, "Booking created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// GET /api/bookings?page=1&limit=10
export async function getBookingsController(request: NextRequest) {
  try {
    const { page, limit } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const hostelId = searchParams.get("hostel_id") || "";
    const status = searchParams.get("status") || "";
    const result = await bookingService.getAllBookings(page, limit, { hostelId, status });
    return successResponse(result, "Bookings fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/bookings/:id
export async function getBookingController(id: number) {
  try {
    const booking = await bookingService.getBookingById(id);
    return successResponse(booking, "Booking fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

// PATCH /api/bookings/:id/status
export async function updateBookingStatusController(id: number, request: NextRequest) {
  try {
    const { status } = await request.json();
    if (!status) return errorResponse("Status is required", 400);

    const booking = await bookingService.updateBookingStatus(id, status);

    // Send push notifications based on status change
    try {
      const bookingData = await bookingService.getBookingById(id);
      const studentId = (bookingData as any).student_id;
      const roomNumber = (bookingData as any).room_number || id;

      if (status === "CONFIRMED") {
        // Notify customer
        if (await isPushNotificationEnabled("customer_booking_confirmed", "CUSTOMER")) {
          await sendPushNotification(studentId, {
            title: "Booking Confirmed",
            body: `Your booking for Room ${roomNumber} has been confirmed!`,
            data: { type: "booking_confirmed", bookingId: String(id) },
          }, "booking_confirmed");
        }
      } else if (status === "CANCELLED") {
        // Notify admins
        if (await isPushNotificationEnabled("booking_cancelled", "ADMIN")) {
          await sendPushNotificationByRole("SUPER_ADMIN", {
            title: "Booking Cancelled",
            body: `Booking #${id} for Room ${roomNumber} has been cancelled`,
            data: { type: "booking_cancelled", bookingId: String(id) },
          }, "booking_cancelled");
        }

        // Notify owner
        if (await isPushNotificationEnabled("owner_booking_cancelled", "OWNER")) {
          await sendPushNotificationByRole("OWNER", {
            title: "Booking Cancelled",
            body: `Booking #${id} for Room ${roomNumber} has been cancelled`,
            data: { type: "booking_cancelled", bookingId: String(id) },
          }, "booking_cancelled");
        }

        // Notify customer
        if (await isPushNotificationEnabled("customer_booking_cancelled", "CUSTOMER")) {
          await sendPushNotification(studentId, {
            title: "Booking Cancelled",
            body: `Your booking for Room ${roomNumber} has been cancelled`,
            data: { type: "booking_cancelled", bookingId: String(id) },
          }, "booking_cancelled");
        }
      }
    } catch (notifError: any) {
      console.error("[Push] Status notification error:", notifError.message);
    }

    // Send booking status update email to customer (non-blocking)
    try {
      const studentId = (bookingData as any).student_id;
      const [userRows] = await db.execute<RowDataPacket[]>(
        "SELECT name, email FROM users WHERE id = ?", [studentId]
      );
      const user = userRows[0];
      if (user?.email) {
        sendTemplatedEmail(
          user.email,
          "booking_status",
          "user",
          {
            name: user.name || "Customer",
            status: status,
            room_name: String(roomNumber),
          }
        ).then(r => {
          if (r.success) console.log(`[Email] Booking status update sent to ${user.email}`);
          else console.log(`[Email] Status email failed: ${r.error}`);
        }).catch(e => console.error(`[Email] Error:`, e.message));
      }
    } catch (emailErr: any) {
      console.error("[Email] Status email error:", emailErr.message);
    }

    return successResponse(booking, "Booking status updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// PATCH /api/bookings/:id/payment
export async function updatePaymentStatusController(id: number, request: NextRequest) {
  try {
    const { paymentStatus } = await request.json();
    if (!paymentStatus) return errorResponse("Payment status is required", 400);

    const booking = await bookingService.updatePaymentStatus(id, paymentStatus);

    // Send push notifications on payment events
    try {
      const bookingData = await bookingService.getBookingById(id);
      const studentId = (bookingData as any).student_id;
      const roomNumber = (bookingData as any).room_number || id;
      const totalAmount = (bookingData as any).total_amount;

      if (paymentStatus === "PAID") {
        const currencyAmount = await formatAmount(totalAmount);
        // Notify admins
        if (await isPushNotificationEnabled("payment_received", "ADMIN")) {
          await sendPushNotificationByRole("SUPER_ADMIN", {
            title: "Payment Received",
            body: `Payment of ${currencyAmount} received for Room ${roomNumber}`,
            data: { type: "payment_received", bookingId: String(id) },
          }, "payment_received");
        }

        // Notify owner
        if (await isPushNotificationEnabled("owner_payment_received", "OWNER")) {
          await sendPushNotificationByRole("OWNER", {
            title: "Payment Received",
            body: `Payment of ${currencyAmount} received for Room ${roomNumber}`,
            data: { type: "payment_received", bookingId: String(id) },
          }, "payment_received");
        }

        // Notify customer
        if (await isPushNotificationEnabled("customer_payment_success", "CUSTOMER")) {
          await sendPushNotification(studentId, {
            title: "Payment Successful",
            body: `Your payment of ${currencyAmount} for Room ${roomNumber} was successful!`,
            data: { type: "payment_success", bookingId: String(id) },
          }, "payment_success");
        }
      }
    } catch (notifError: any) {
      console.error("[Push] Payment notification error:", notifError.message);
    }

    return successResponse(booking, "Payment status updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// DELETE /api/bookings/:id
export async function deleteBookingController(id: number) {
  try {
    await bookingService.deleteBooking(id);
    return successResponse(null, "Booking deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
