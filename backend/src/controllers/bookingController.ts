import { NextRequest } from "next/server";
import { bookingService } from "../services";
import { successResponse, errorResponse, getPaginationParams } from "../utils";

// POST /api/bookings
export async function createBookingController(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, roomId, checkIn, checkOut, totalAmount } = body;

    if (!studentId || !roomId || !checkIn || !totalAmount) {
      return errorResponse("studentId, roomId, checkIn and totalAmount are required", 400);
    }

    const booking = await bookingService.createBooking({ studentId, roomId, checkIn, checkOut, totalAmount });
    return successResponse(booking, "Booking created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// GET /api/bookings?page=1&limit=10
export async function getBookingsController(request: NextRequest) {
  try {
    const { page, limit } = getPaginationParams(request);
    const result = await bookingService.getAllBookings(page, limit);
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
