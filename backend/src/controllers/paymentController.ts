import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// POST /api/payment/init — initialize a payment
export async function initPaymentController(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateway_slug, user_id, amount, booking_id, currency, email, phone } = body;
    if (!gateway_slug || !user_id || !amount) return errorResponse("gateway_slug, user_id, amount required", 400);

    const processors = await import("../services/paymentGatewayProcessor");
    let result;

    switch (gateway_slug) {
      case "razorpay": result = await processors.initRazorpay(user_id, amount, booking_id, currency); break;
      case "stripe": result = await processors.initStripe(user_id, amount, booking_id, currency); break;
      case "paypal": result = await processors.initPaypal(user_id, amount, booking_id, currency || "USD"); break;
      case "paytm": result = await processors.initPaytm(user_id, amount, booking_id, currency); break;
      case "paystack": result = await processors.initPaystack(user_id, amount, email, booking_id, currency || "NGN"); break;
      case "flutterwave": result = await processors.initFlutterwave(user_id, amount, email, booking_id, currency || "NGN"); break;
      case "sslcommerz": result = await processors.initSslcommerz(user_id, amount, email, phone, booking_id, currency || "BDT"); break;
      case "bkash": result = await processors.initBkash(user_id, amount, booking_id, currency || "BDT"); break;
      default: result = await processors.initGenericGateway(gateway_slug, user_id, amount, booking_id, currency); break;
    }
    return successResponse(result, "Payment initialized");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/payment/callback/:gateway — handle gateway callbacks
export async function paymentCallbackController(request: NextRequest, gateway: string) {
  try {
    const url = new URL(request.url);
    const processors = await import("../services/paymentGatewayProcessor");

    switch (gateway) {
      case "stripe": {
        const txn_id = url.searchParams.get("transaction_id") || "";
        const status = url.searchParams.get("status") || "cancel";
        await processors.handleStripeCallback(txn_id, status);
        return Response.redirect(new URL(`/payment/${status}?txn=${txn_id}`, url.origin));
      }
      case "paypal": {
        const txn_id = url.searchParams.get("transaction_id") || "";
        const status = url.searchParams.get("status") || "cancel";
        await processors.handlePaypalCallback(txn_id, status);
        return Response.redirect(new URL(`/payment/${status}?txn=${txn_id}`, url.origin));
      }
      case "paystack": {
        const reference = url.searchParams.get("reference") || "";
        await processors.verifyPaystack(reference);
        const txn_id = url.searchParams.get("transaction_id") || reference;
        return Response.redirect(new URL(`/payment/success?txn=${txn_id}`, url.origin));
      }
      case "flutterwave": {
        const txn_id = url.searchParams.get("transaction_id") || "";
        await processors.verifyFlutterwave(txn_id);
        const status = url.searchParams.get("status") === "cancelled" ? "cancel" : "success";
        return Response.redirect(new URL(`/payment/${status}?txn=${txn_id}`, url.origin));
      }
      case "sslcommerz": {
        const txn_id = url.searchParams.get("transaction_id") || "";
        const status = url.searchParams.get("status") || "fail";
        await processors.handleSslcommerzCallback(txn_id, status);
        const redirect = status === "success" ? "success" : "cancel";
        return Response.redirect(new URL(`/payment/${redirect}?txn=${txn_id}`, url.origin));
      }
      case "bkash": {
        const txn_id = url.searchParams.get("transaction_id") || "";
        const paymentID = url.searchParams.get("paymentID") || "";
        const status = url.searchParams.get("status") || "cancel";
        if (status === "success") await processors.handleBkashCallback(txn_id, paymentID, status);
        return Response.redirect(new URL(`/payment/${status === "success" ? "success" : "cancel"}?txn=${txn_id}`, url.origin));
      }
      default:
        return errorResponse("Unknown gateway", 400);
    }
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// POST /api/payment/callback/paytm — PayTM posts data
export async function paytmCallbackController(request: NextRequest) {
  try {
    const text = await request.text();
    const params = Object.fromEntries(new URLSearchParams(text));
    const processors = await import("../services/paymentGatewayProcessor");
    await processors.handlePaytmCallback(params);
    const orderId = params.ORDERID || "";
    return Response.redirect(new URL(`/payment/${params.STATUS === "TXN_SUCCESS" ? "success" : "cancel"}?ref=${orderId}`, new URL(request.url).origin));
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// POST /api/payment/verify — verify a payment (for Razorpay etc)
export async function verifyPaymentController(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateway_slug, transaction_id, payment_id, signature } = body;
    const processors = await import("../services/paymentGatewayProcessor");

    switch (gateway_slug) {
      case "razorpay": {
        const ok = await processors.verifyRazorpay(transaction_id, payment_id, signature);
        return ok ? successResponse({ verified: true }, "Payment verified") : errorResponse("Verification failed", 400);
      }
      default: return errorResponse("Manual verify not supported for this gateway", 400);
    }
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/payment/status/:transaction_id
export async function paymentStatusController(transaction_id: string) {
  try {
    const { getTransactionByTxnId } = await import("../services/paymentService");
    const txn = await getTransactionByTxnId(transaction_id);
    if (!txn) return errorResponse("Transaction not found", 404);
    return successResponse(txn, "Status fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/payment/gateways — get active gateways for frontend
export async function getActiveGatewaysController() {
  try {
    const { getActiveGatewaysForFrontend } = await import("../services/paymentService");
    return successResponse(await getActiveGatewaysForFrontend(), "Active gateways fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// GET /api/payment/transactions — get user transactions
export async function getUserTransactionsController(user_id: number) {
  try {
    const { getTransactionsByUser } = await import("../services/paymentService");
    return successResponse(await getTransactionsByUser(user_id), "Transactions fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}
