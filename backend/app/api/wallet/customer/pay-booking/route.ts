import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { processBookingPayment, getCustomerWalletBalance, addLoyaltyPoints, createWalletTransaction } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";

// POST /api/wallet/customer/pay-booking - Pay for booking using wallet
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { booking_id, amount } = await req.json();

    if (!booking_id || !amount || amount <= 0) {
      return errorResponse("Booking ID and valid amount are required", 400);
    }

    // Verify booking exists and belongs to user
    const [booking] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM bookings WHERE id = ? AND student_id = ? AND payment_status = 'PENDING'",
      [booking_id, userId]
    );

    if (booking.length === 0) {
      return errorResponse("Booking not found or already paid", 404);
    }

    // Check wallet balance
    const balance = await getCustomerWalletBalance(userId);
    if (balance < amount) {
      return errorResponse("Insufficient wallet balance", 400);
    }

    // Process payment
    const success = await processBookingPayment(userId, booking_id, amount);
    if (!success) {
      return errorResponse("Payment failed", 500);
    }

    // Update booking payment status
    await db.execute(
      `UPDATE bookings 
       SET payment_status = 'PAID', 
           status = 'CONFIRMED',
           updated_at = NOW()
       WHERE id = ?`,
      [booking_id]
    );

    // Add loyalty points
    const points = await addLoyaltyPoints(userId, amount);

    // Get updated balance
    const newBalance = await getCustomerWalletBalance(userId);

    return successResponse({
      booking_id,
      amount_paid: amount,
      loyalty_points_earned: points,
      new_balance: newBalance,
    }, "Payment successful");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/wallet/customer/pay-booking/partial - Partial payment from wallet
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { booking_id, wallet_amount, payment_method } = await req.json();

    if (!booking_id || !wallet_amount || wallet_amount <= 0) {
      return errorResponse("Booking ID and valid wallet amount are required", 400);
    }

    // Verify booking exists and belongs to user
    const [booking] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM bookings WHERE id = ? AND student_id = ? AND payment_status = 'PENDING'",
      [booking_id, userId]
    );

    if (booking.length === 0) {
      return errorResponse("Booking not found or already paid", 404);
    }

    // Check wallet balance
    const balance = await getCustomerWalletBalance(userId);
    if (balance < wallet_amount) {
      return errorResponse("Insufficient wallet balance", 400);
    }

    // Process partial payment from wallet
    const transaction = await createWalletTransaction(
      userId,
      wallet_amount,
      "booking_payment",
      booking_id.toString(),
      "booking",
      `Partial payment for booking #${booking_id}`
    );

    if (!transaction) {
      return errorResponse("Payment failed", 500);
    }

    // Update booking with partial payment info
    const remainingAmount = booking[0].total_amount - wallet_amount;
    await db.execute(
      `UPDATE bookings 
       SET payment_status = 'PARTIAL',
           total_amount = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [remainingAmount, booking_id]
    );

    // Add loyalty points for wallet portion
    const points = await addLoyaltyPoints(userId, wallet_amount);

    // Get updated balance
    const newBalance = await getCustomerWalletBalance(userId);

    return successResponse({
      booking_id,
      wallet_amount_paid: wallet_amount,
      remaining_amount: remainingAmount,
      loyalty_points_earned: points,
      new_balance: newBalance,
    }, "Partial payment successful");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
