import db, { RowDataPacket } from "../config/database";
import { InitPaymentResult, getGatewayConfig, createTransaction, getTransactionByTxnId, updateTransactionStatus } from "./paymentService";

const BASE_URL = process.env.PUBLIC_URL || "http://localhost:3001";

// ==========================================
// 1. RAZORPAY
// ==========================================
export const initRazorpay = async (user_id: number, amount: number, booking_id?: number, currency = "INR"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("razorpay");
  if (!gw) throw new Error("Razorpay not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "razorpay", gateway_mode: gw.mode as any, amount, currency });

  // Return data for frontend Razorpay checkout
  return {
    transaction_id: txn.transaction_id,
    checkout_data: {
      key: gw.config.api_key,
      amount: Math.round(amount * 100), // paise
      currency,
      name: "Hostel Booking",
      description: `Booking Payment - ${txn.transaction_id}`,
      order_id: undefined, // We'd need to create an order via Razorpay API for production
      prefill: { name: "", email: "", contact: "" },
      notes: { transaction_id: txn.transaction_id, booking_id: booking_id || "" },
      theme: { color: "#3399cc" },
    },
  };
};

// Verify Razorpay payment
export const verifyRazorpay = async (transaction_id: string, payment_id: string, signature: string): Promise<boolean> => {
  const crypto = await import("crypto");
  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn) throw new Error("Transaction not found");
  const gw = await getGatewayConfig("razorpay");
  if (!gw) throw new Error("Gateway not found");

  // Verify signature
  const body = txn.transaction_id + "|" + payment_id;
  const expectedSig = crypto.createHmac("sha256", gw.config.api_secret).update(body).digest("hex");

  if (expectedSig === signature) {
    await updateTransactionStatus(txn.id, "success", { gateway_reference: payment_id, callback_data: { payment_id, signature } });
    return true;
  }
  await updateTransactionStatus(txn.id, "failed", { callback_data: { payment_id, signature, error: "Invalid signature" } });
  return false;
};

// ==========================================
// 2. STRIPE
// ==========================================
export const initStripe = async (user_id: number, amount: number, booking_id?: number, currency = "INR"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("stripe");
  if (!gw) throw new Error("Stripe not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "stripe", gateway_mode: gw.mode as any, amount, currency });

  // Create a Stripe Checkout Session using fetch
  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${gw.config.api_key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": "Hostel Booking Payment",
      "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "success_url": `${BASE_URL}/api/payment/callback/stripe?transaction_id=${txn.transaction_id}&status=success`,
      "cancel_url": `${BASE_URL}/api/payment/callback/stripe?transaction_id=${txn.transaction_id}&status=cancel`,
      "metadata[transaction_id]": txn.transaction_id || "",
      "metadata[booking_id]": String(booking_id || ""),
    }),
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) throw new Error(session.error?.message || "Stripe session creation failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: session.id });

  return { transaction_id: txn.transaction_id, checkout_url: session.url };
};

export const handleStripeCallback = async (transaction_id: string, status: string): Promise<void> => {
  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn) throw new Error("Transaction not found");
  if (status === "success") {
    await updateTransactionStatus(txn.id, "success", { callback_data: { stripe_status: status } });
  } else {
    await updateTransactionStatus(txn.id, "cancelled", { callback_data: { stripe_status: status } });
  }
};

// ==========================================
// 3. PAYPAL
// ==========================================
export const initPaypal = async (user_id: number, amount: number, booking_id?: number, currency = "USD"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("paypal");
  if (!gw) throw new Error("PayPal not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "paypal", gateway_mode: gw.mode as any, amount, currency });

  const baseUrl = gw.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  // Get access token
  const auth = Buffer.from(`${gw.config.client_id}:${gw.config.client_secret}`).toString("base64");
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // Create order
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description: `Hostel Booking - ${txn.transaction_id}`,
      }],
      application_context: {
        return_url: `${BASE_URL}/api/payment/callback/paypal?transaction_id=${txn.transaction_id}&status=success`,
        cancel_url: `${BASE_URL}/api/payment/callback/paypal?transaction_id=${txn.transaction_id}&status=cancel`,
      },
    }),
  });
  const order = await orderRes.json();
  if (!orderRes.ok) throw new Error(order.message || "PayPal order creation failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: order.id });
  const approveLink = order.links?.find((l: any) => l.rel === "approve")?.href;

  return { transaction_id: txn.transaction_id, checkout_url: approveLink };
};

export const handlePaypalCallback = async (transaction_id: string, status: string): Promise<void> => {
  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn) throw new Error("Transaction not found");
  if (status === "success" && txn.gateway_reference) {
    // Capture the PayPal order
    const gw = await getGatewayConfig("paypal");
    if (!gw) throw new Error("PayPal not configured");
    const baseUrl = gw.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const auth = Buffer.from(`${gw.config.client_id}:${gw.config.client_secret}`).toString("base64");
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const { access_token } = await tokenRes.json();
    await fetch(`${baseUrl}/v2/checkout/orders/${txn.gateway_reference}/capture`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
    });
    await updateTransactionStatus(txn.id, "success", { callback_data: { paypal_order_id: txn.gateway_reference } });
  } else {
    await updateTransactionStatus(txn.id, "cancelled", { callback_data: { paypal_status: status } });
  }
};

// ==========================================
// 4. PAYTM
// ==========================================
export const initPaytm = async (user_id: number, amount: number, booking_id?: number, currency = "INR"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("paytm");
  if (!gw) throw new Error("PayTM not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "paytm", gateway_mode: gw.mode as any, amount, currency });
  const orderId = `PAYTM_${txn.id}_${Date.now()}`;

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: orderId });

  return {
    transaction_id: txn.transaction_id,
    checkout_data: {
      MID: gw.config.merchant_id,
      WEBSITE: gw.config.merchant_website_link || "WEBSTAGING",
      INDUSTRY_TYPE_ID: "Retail",
      CHANNEL_ID: "WEB",
      ORDER_ID: orderId,
      CUST_ID: `CUST_${user_id}`,
      TXN_AMOUNT: amount.toFixed(2),
      CALLBACK_URL: `${BASE_URL}/api/payment/callback/paytm`,
    },
  };
};

export const handlePaytmCallback = async (postData: Record<string, string>): Promise<void> => {
  const orderId = postData.ORDERID;
  const status = postData.STATUS;
  const txnId = postData.TXNID;

  // Find transaction by gateway_reference
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE gateway_reference = ?", [orderId]);
  if (rows.length === 0) throw new Error("Transaction not found");
  const txn = rows[0] as any;

  if (status === "TXN_SUCCESS") {
    await updateTransactionStatus(txn.id, "success", { gateway_reference: orderId, callback_data: { paytm_txn_id: txnId, ...postData } });
  } else {
    await updateTransactionStatus(txn.id, "failed", { callback_data: postData });
  }
};

// ==========================================
// 5. PAYSTACK
// ==========================================
export const initPaystack = async (user_id: number, amount: number, email: string, booking_id?: number, currency = "NGN"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("paystack");
  if (!gw) throw new Error("Paystack not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "paystack", gateway_mode: gw.mode as any, amount, currency });
  const ref = txn.transaction_id;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { "Authorization": `Bearer ${gw.config.secret_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email || gw.config.merchant_email || "customer@example.com",
      amount: Math.round(amount * 100),
      reference: ref,
      callback_url: `${BASE_URL}/api/payment/callback/paystack?transaction_id=${txn.transaction_id}`,
      currency,
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack initialization failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: ref });

  return { transaction_id: txn.transaction_id, checkout_url: data.data.authorization_url };
};

export const verifyPaystack = async (reference: string): Promise<boolean> => {
  const gw = await getGatewayConfig("paystack");
  if (!gw) throw new Error("Paystack not configured");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { "Authorization": `Bearer ${gw.config.secret_key}` },
  });
  const data = await res.json();

  if (data.data?.status === "success") {
    const txn = await getTransactionByTxnId(reference);
    if (txn) await updateTransactionStatus(txn.id, "success", { gateway_reference: reference, callback_data: data.data });
    return true;
  }
  return false;
};

// ==========================================
// 6. FLUTTERWAVE
// ==========================================
export const initFlutterwave = async (user_id: number, amount: number, email: string, booking_id?: number, currency = "NGN"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("flutterwave");
  if (!gw) throw new Error("Flutterwave not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "flutterwave", gateway_mode: gw.mode as any, amount, currency });
  const txref = txn.transaction_id;

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { "Authorization": `Bearer ${gw.config.secret_key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: txref,
      amount,
      currency,
      redirect_url: `${BASE_URL}/api/payment/callback/flutterwave?transaction_id=${txn.transaction_id}`,
      customer: { email: email || "customer@example.com" },
      customizations: { title: "Hostel Booking", description: `Payment ${txref}` },
    }),
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Flutterwave init failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: txref });

  return { transaction_id: txn.transaction_id, checkout_url: data.data.link };
};

export const verifyFlutterwave = async (transaction_id: string): Promise<boolean> => {
  const gw = await getGatewayConfig("flutterwave");
  if (!gw) throw new Error("Flutterwave not configured");

  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn || !txn.gateway_reference) throw new Error("Transaction not found");

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txn.gateway_reference}/verify`, {
    headers: { "Authorization": `Bearer ${gw.config.secret_key}` },
  });
  const data = await res.json();

  if (data.data?.status === "successful") {
    await updateTransactionStatus(txn.id, "success", { callback_data: data.data });
    return true;
  }
  await updateTransactionStatus(txn.id, "failed", { callback_data: data });
  return false;
};

// ==========================================
// 7. SSLCOMMERZ
// ==========================================
export const initSslcommerz = async (user_id: number, amount: number, email: string, phone: string, booking_id?: number, currency = "BDT"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("sslcommerz");
  if (!gw) throw new Error("SSLCommerz not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "sslcommerz", gateway_mode: gw.mode as any, amount, currency });
  const tranId = txn.transaction_id;

  const baseUrl = gw.mode === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
  const params = new URLSearchParams({
    store_id: gw.config.store_id,
    store_passwd: gw.config.store_password,
    total_amount: amount.toFixed(2),
    currency,
    tran_id: tranId,
    success_url: `${BASE_URL}/api/payment/callback/sslcommerz?transaction_id=${tranId}&status=success`,
    fail_url: `${BASE_URL}/api/payment/callback/sslcommerz?transaction_id=${tranId}&status=fail`,
    cancel_url: `${BASE_URL}/api/payment/callback/sslcommerz?transaction_id=${tranId}&status=cancel`,
    cus_name: "Customer",
    cus_email: email || "customer@example.com",
    cus_phone: phone || "0000000000",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: "Hostel Booking",
    product_category: "service",
    product_profile: "general",
  });

  const res = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();

  if (data.status === "FAILED") throw new Error(data.failedreason || "SSLCommerz init failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: tranId });

  return { transaction_id: txn.transaction_id, checkout_url: data.GatewayPageURL };
};

export const handleSslcommerzCallback = async (transaction_id: string, status: string, postData?: Record<string, string>): Promise<void> => {
  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn) throw new Error("Transaction not found");
  if (status === "success") {
    await updateTransactionStatus(txn.id, "success", { callback_data: { status, ...postData } });
  } else {
    await updateTransactionStatus(txn.id, status === "fail" ? "failed" : "cancelled", { callback_data: { status, ...postData } });
  }
};

// ==========================================
// 8. BKASH
// ==========================================
export const initBkash = async (user_id: number, amount: number, booking_id?: number, currency = "BDT"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig("bkash");
  if (!gw) throw new Error("bKash not configured or inactive");

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: "bkash", gateway_mode: gw.mode as any, amount, currency });

  // bKash token
  const baseUrl = gw.mode === "live" ? "https://tokenized.pay.bka.sh/v1.2.0-beta" : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
  const tokenRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "accept": "application/json", username: gw.config.username, password: gw.config.password },
    body: JSON.stringify({ app_key: gw.config.app_key, app_secret: gw.config.app_secret }),
  });
  const { id_token } = await tokenRes.json();

  // Create payment
  const payRes = await fetch(`${baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": id_token, "X-App-Key": gw.config.app_key },
    body: JSON.stringify({
      mode: "0011",
      payerReference: `CUST_${user_id}`,
      callbackURL: `${BASE_URL}/api/payment/callback/bkash?transaction_id=${txn.transaction_id}`,
      amount: amount.toFixed(2),
      currency,
      intent: "sale",
      merchantInvoiceNumber: txn.transaction_id,
    }),
  });
  const payData = await payRes.json();
  if (payData.statusCode !== "0000") throw new Error(payData.statusMessage || "bKash init failed");

  await updateTransactionStatus(txn.id, "processing", { gateway_reference: payData.paymentID });

  return { transaction_id: txn.transaction_id, checkout_url: payData.bkashURL };
};

export const handleBkashCallback = async (transaction_id: string, paymentID: string, status: string): Promise<void> => {
  const txn = await getTransactionByTxnId(transaction_id);
  if (!txn) throw new Error("Transaction not found");

  if (status === "success" && paymentID) {
    // Execute payment
    const gw = await getGatewayConfig("bkash");
    if (!gw) throw new Error("bKash not configured");
    const baseUrl = gw.mode === "live" ? "https://tokenized.pay.bka.sh/v1.2.0-beta" : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
    const tokenRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", username: gw.config.username, password: gw.config.password },
      body: JSON.stringify({ app_key: gw.config.app_key, app_secret: gw.config.app_secret }),
    });
    const { id_token } = await tokenRes.json();

    const execRes = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": id_token, "X-App-Key": gw.config.app_key },
      body: JSON.stringify({ paymentID }),
    });
    const execData = await execRes.json();
    if (execData.statusCode === "0000") {
      await updateTransactionStatus(txn.id, "success", { gateway_reference: paymentID, callback_data: execData });
    } else {
      await updateTransactionStatus(txn.id, "failed", { callback_data: execData });
    }
  } else {
    await updateTransactionStatus(txn.id, "cancelled", { callback_data: { status, paymentID } });
  }
};

// ==========================================
// 9-13. GENERIC INIT for remaining gateways
// (MercadoPago, LiqPay, PayTabs, SenangPay, Paymob)
// ==========================================
export const initGenericGateway = async (slug: string, user_id: number, amount: number, booking_id?: number, currency = "INR"): Promise<InitPaymentResult> => {
  const gw = await getGatewayConfig(slug);
  if (!gw) throw new Error(`${slug} not configured or inactive`);

  const txn = await createTransaction({ booking_id, user_id, gateway_slug: slug, gateway_mode: gw.mode as any, amount, currency });
  await updateTransactionStatus(txn.id, "processing", { gateway_reference: txn.transaction_id });

  // Return checkout_data for frontend to render appropriate UI
  return {
    transaction_id: txn.transaction_id,
    checkout_data: {
      gateway: slug,
      config: {
        // Only expose public keys, never secrets
        public_key: gw.config.public_key || gw.config.published_key || gw.config.client_id || gw.config.merchant_id || gw.config.profile_id || "",
        amount,
        currency,
        callback_url: `${BASE_URL}/api/payment/callback/${slug}?transaction_id=${txn.transaction_id}`,
      },
    },
  };
};


