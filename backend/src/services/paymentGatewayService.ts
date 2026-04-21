import db, { RowDataPacket, ResultSetHeader } from "../config/database";

export interface PaymentGateway {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: number;
  mode: "test" | "live";
  gateway_title: string;
  logo: string;
  config: Record<string, string>;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export const getAllPaymentGateways = async (): Promise<PaymentGateway[]> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM payment_gateways ORDER BY sort_order ASC, id ASC"
  );
  return (rows as any[]).map(r => ({ ...r, config: typeof r.config === "string" ? JSON.parse(r.config || "{}") : (r.config || {}) }));
};

export const getPaymentGatewayById = async (id: number): Promise<PaymentGateway | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM payment_gateways WHERE id = ?", [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as any;
  return { ...r, config: typeof r.config === "string" ? JSON.parse(r.config || "{}") : (r.config || {}) };
};

export const getPaymentGatewayBySlug = async (slug: string): Promise<PaymentGateway | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM payment_gateways WHERE slug = ?", [slug]
  );
  if (rows.length === 0) return null;
  const r = rows[0] as any;
  return { ...r, config: typeof r.config === "string" ? JSON.parse(r.config || "{}") : (r.config || {}) };
};

export const updatePaymentGateway = async (id: number, data: {
  config?: Record<string, string>;
  mode?: "test" | "live";
  gateway_title?: string;
  logo?: string;
}): Promise<PaymentGateway | null> => {
  const existing = await getPaymentGatewayById(id);
  if (!existing) return null;
  const updates: string[] = [];
  const values: any[] = [];
  if (data.config !== undefined) { updates.push("config = ?"); values.push(JSON.stringify(data.config)); }
  if (data.mode !== undefined) { updates.push("mode = ?"); values.push(data.mode); }
  if (data.gateway_title !== undefined) { updates.push("gateway_title = ?"); values.push(data.gateway_title); }
  if (data.logo !== undefined) { updates.push("logo = ?"); values.push(data.logo); }
  if (updates.length === 0) return existing;
  values.push(id);
  await db.execute(`UPDATE payment_gateways SET ${updates.join(", ")} WHERE id = ?`, values);
  return getPaymentGatewayById(id);
};

export const togglePaymentGateway = async (id: number, isActive: boolean): Promise<PaymentGateway | null> => {
  await db.execute("UPDATE payment_gateways SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, id]);
  return getPaymentGatewayById(id);
};

export const getActivePaymentGateways = async (): Promise<PaymentGateway[]> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM payment_gateways WHERE is_active = 1 ORDER BY sort_order ASC"
  );
  return (rows as any[]).map(r => ({ ...r, config: typeof r.config === "string" ? JSON.parse(r.config || "{}") : (r.config || {}) }));
};
