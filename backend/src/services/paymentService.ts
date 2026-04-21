import db, { RowDataPacket, ResultSetHeader } from "../config/database";

export interface PaymentTransaction {
  id: number;
  booking_id: number | null;
  user_id: number;
  gateway_slug: string;
  gateway_mode: "test" | "live";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";
  transaction_id: string;
  gateway_reference: string | null;
  payment_data: Record<string, any> | null;
  callback_data: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface InitPaymentResult {
  transaction_id: string;
  checkout_url?: string;
  checkout_data?: Record<string, any>;
  html?: string;
}

// ==========================================
// Transaction CRUD
// ==========================================

export const createTransaction = async (data: {
  booking_id?: number;
  user_id: number;
  gateway_slug: string;
  gateway_mode: "test" | "live";
  amount: number;
  currency?: string;
  payment_data?: Record<string, any>;
}): Promise<PaymentTransaction> => {
  const transaction_id = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO payment_transactions (booking_id, user_id, gateway_slug, gateway_mode, amount, currency, transaction_id, payment_data, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [data.booking_id || null, data.user_id, data.gateway_slug, data.gateway_mode, data.amount, data.currency || "INR", transaction_id, JSON.stringify(data.payment_data || {})]
  );
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE id = ?", [result.insertId]);
  return { ...rows[0], transaction_id: rows[0].transaction_id || transaction_id } as PaymentTransaction;
};

export const getTransactionById = async (id: number): Promise<PaymentTransaction | null> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE id = ?", [id]);
  return rows.length > 0 ? rows[0] as PaymentTransaction : null;
};

export const getTransactionByTxnId = async (transaction_id: string): Promise<PaymentTransaction | null> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE transaction_id = ?", [transaction_id]);
  return rows.length > 0 ? rows[0] as PaymentTransaction : null;
};

export const updateTransactionStatus = async (id: number, status: PaymentTransaction["status"], data?: { gateway_reference?: string | null; callback_data?: Record<string, any> }): Promise<void> => {
  const updates: string[] = ["status = ?"];
  const values: any[] = [status];
  if (data?.gateway_reference) { updates.push("gateway_reference = ?"); values.push(data.gateway_reference); }
  if (data?.callback_data) { updates.push("callback_data = ?"); values.push(JSON.stringify(data.callback_data)); }
  values.push(id);
  await db.execute(`UPDATE payment_transactions SET ${updates.join(", ")} WHERE id = ?`, values);
};

export const getTransactionsByUser = async (user_id: number): Promise<PaymentTransaction[]> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE user_id = ? ORDER BY created_at DESC", [user_id]);
  return rows as PaymentTransaction[];
};

export const getTransactionsByBooking = async (booking_id: number): Promise<PaymentTransaction[]> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payment_transactions WHERE booking_id = ? ORDER BY created_at DESC", [booking_id]);
  return rows as PaymentTransaction[];
};

// ==========================================
// Gateway Config Helper
// ==========================================

export const getGatewayConfig = async (slug: string): Promise<{ config: Record<string, string>; mode: string; gateway_title: string } | null> => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT config, mode, gateway_title FROM payment_gateways WHERE slug = ? AND is_active = 1", [slug]);
  if (rows.length === 0) return null;
  const r = rows[0] as any;
  return {
    config: typeof r.config === "string" ? JSON.parse(r.config || "{}") : (r.config || {}),
    mode: r.mode,
    gateway_title: r.gateway_title,
  };
};

export const getActiveGatewaysForFrontend = async () => {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT id, name, slug, mode, gateway_title, logo FROM payment_gateways WHERE is_active = 1 ORDER BY sort_order ASC");
  return rows;
};
