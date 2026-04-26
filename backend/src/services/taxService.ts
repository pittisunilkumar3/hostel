import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ─── Types ───
export interface TaxRow extends RowDataPacket {
  id: number;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  is_active: number;
  description: string | null;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaxConfigRow extends RowDataPacket {
  id: number;
  config_key: string;
  config_value: string;
  is_active: number;
}

export interface OrderTaxRow extends RowDataPacket {
  id: number;
  booking_id: number;
  tax_id: number;
  tax_name: string;
  tax_rate: number;
  tax_type: "percentage" | "fixed";
  tax_amount: number;
  created_at: Date;
}

export interface TaxInput {
  name: string;
  rate: number;
  type?: "percentage" | "fixed";
  is_active?: boolean;
  description?: string;
  priority?: number;
}

export interface CalculatedTax {
  tax_id: number;
  tax_name: string;
  tax_rate: number;
  tax_type: "percentage" | "fixed";
  tax_amount: number;
}

export interface TaxCalculationResult {
  sub_total: number;
  tax_amount: number;
  total_amount: number;
  discount_amount: number;
  taxes: CalculatedTax[];
}

// ═══════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════

/** Get all taxes (with optional active filter) */
export const getAllTaxes = async (activeOnly: boolean = false) => {
  const query = activeOnly
    ? "SELECT * FROM taxes WHERE is_active = 1 ORDER BY priority DESC, name ASC"
    : "SELECT * FROM taxes ORDER BY priority DESC, name ASC";
  const [rows] = await db.execute<TaxRow[]>(query);
  return rows;
};

/** Get tax by ID */
export const getTaxById = async (id: number) => {
  const [rows] = await db.execute<TaxRow[]>(
    "SELECT * FROM taxes WHERE id = ?",
    [id]
  );
  if (rows.length === 0) throw new Error("Tax not found");
  return rows[0];
};

/** Create a new tax */
export const createTax = async (data: TaxInput) => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO taxes (name, rate, type, is_active, description, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.rate,
      data.type || "percentage",
      data.is_active !== false ? 1 : 0,
      data.description || null,
      data.priority || 0,
    ]
  );
  return getTaxById(result.insertId);
};

/** Update an existing tax */
export const updateTax = async (id: number, data: Partial<TaxInput>) => {
  await getTaxById(id); // Verify exists

  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.rate !== undefined) { fields.push("rate = ?"); values.push(data.rate); }
  if (data.type !== undefined) { fields.push("type = ?"); values.push(data.type); }
  if (data.is_active !== undefined) { fields.push("is_active = ?"); values.push(data.is_active ? 1 : 0); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.priority !== undefined) { fields.push("priority = ?"); values.push(data.priority); }

  if (fields.length === 0) return getTaxById(id);

  values.push(id);
  await db.execute(
    `UPDATE taxes SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  return getTaxById(id);
};

/** Toggle tax active status */
export const toggleTaxStatus = async (id: number) => {
  const tax = await getTaxById(id);
  const newStatus = tax.is_active ? 0 : 1;
  await db.execute("UPDATE taxes SET is_active = ? WHERE id = ?", [newStatus, id]);
  return getTaxById(id);
};

/** Delete a tax */
export const deleteTax = async (id: number) => {
  // Check if tax is used in any order
  const [usage] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM order_taxes WHERE tax_id = ?",
    [id]
  );
  if ((usage[0] as any).count > 0) {
    throw new Error("Cannot delete tax that has been applied to orders. Deactivate it instead.");
  }

  await db.execute("DELETE FROM taxes WHERE id = ?", [id]);
  return { message: "Tax deleted successfully" };
};

// ═══════════════════════════════════════════════════
// Tax Configuration
// ═══════════════════════════════════════════════════

/** Get all tax configurations */
export const getTaxConfigurations = async () => {
  const [rows] = await db.execute<TaxConfigRow[]>(
    "SELECT * FROM tax_configurations ORDER BY id ASC"
  );
  return rows;
};

/** Get a single config value */
export const getTaxConfig = async (key: string): Promise<string | null> => {
  const [rows] = await db.execute<TaxConfigRow[]>(
    "SELECT config_value FROM tax_configurations WHERE config_key = ?",
    [key]
  );
  return rows.length > 0 ? rows[0].config_value : null;
};

/** Update tax configuration */
export const updateTaxConfig = async (key: string, value: string, isActive: boolean = true) => {
  await db.execute(
    `INSERT INTO tax_configurations (config_key, config_value, is_active)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), is_active = VALUES(is_active)`,
    [key, value, isActive ? 1 : 0]
  );
  return getTaxConfigurations();
};

/** Bulk update tax configurations */
export const updateTaxConfigurations = async (configs: Record<string, { value: string; active: boolean }>) => {
  for (const [key, { value, active }] of Object.entries(configs)) {
    await updateTaxConfig(key, value, active);
  }
  return getTaxConfigurations();
};

// ═══════════════════════════════════════════════════
// Tax Calculation Engine
// ═══════════════════════════════════════════════════

/**
 * Calculate taxes for a given amount.
 * This is the core tax calculation engine for the hostel system.
 *
 * @param amount - The base amount (room price * months, or service amount)
 * @param discount - Discount amount to deduct before tax (optional)
 * @returns Tax calculation result with breakdown
 */
export const calculateTax = async (
  amount: number,
  discount: number = 0
): Promise<TaxCalculationResult> => {
  // Get all active taxes
  const activeTaxes = await getAllTaxes(true);

  // Get config
  const taxInclusive = (await getTaxConfig("tax_inclusive")) === "1";
  const applyOnDiscount = (await getTaxConfig("apply_tax_on_discount")) !== "0";

  // Calculate sub_total (amount after discount)
  const subTotal = applyOnDiscount ? Math.max(amount - discount, 0) : amount;

  // Calculate each tax
  const taxes: CalculatedTax[] = [];
  let totalTaxAmount = 0;

  for (const tax of activeTaxes) {
    let taxAmount = 0;

    if (tax.type === "percentage") {
      if (taxInclusive) {
        // Tax is included in price: extract tax from total
        // Formula: taxAmount = (amount * rate) / (100 + rate)
        taxAmount = (subTotal * tax.rate) / (100 + tax.rate);
      } else {
        // Tax is excluded from price: add tax on top
        // Formula: taxAmount = (amount * rate) / 100
        taxAmount = (subTotal * tax.rate) / 100;
      }
    } else {
      // Fixed amount tax
      taxAmount = tax.rate;
    }

    // Round to 2 decimal places
    taxAmount = Math.round(taxAmount * 100) / 100;

    if (taxAmount > 0) {
      taxes.push({
        tax_id: tax.id,
        tax_name: tax.name,
        tax_rate: tax.rate,
        tax_type: tax.type,
        tax_amount: taxAmount,
      });
      totalTaxAmount += taxAmount;
    }
  }

  totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;

  // Calculate final total
  const totalAmount = taxInclusive
    ? subTotal // Tax already included
    : subTotal + totalTaxAmount; // Add tax on top

  return {
    sub_total: Math.round(subTotal * 100) / 100,
    tax_amount: totalTaxAmount,
    total_amount: Math.round(totalAmount * 100) / 100,
    discount_amount: discount,
    taxes,
  };
};

/**
 * Calculate tax for a specific room booking.
 * Considers room price, number of months, and any discounts.
 */
export const calculateBookingTax = async (
  roomId: number,
  months: number = 1,
  discount: number = 0
): Promise<TaxCalculationResult> => {
  // Get room price
  const [rooms] = await db.execute<RowDataPacket[]>(
    "SELECT price_per_month FROM rooms WHERE id = ?",
    [roomId]
  );
  if (rooms.length === 0) throw new Error("Room not found");

  const baseAmount = (rooms[0] as any).price_per_month * months;
  return calculateTax(baseAmount, discount);
};

// ═══════════════════════════════════════════════════
// Order Tax Storage
// ═══════════════════════════════════════════════════

/** Save taxes applied to a booking */
export const saveOrderTaxes = async (bookingId: number, taxes: CalculatedTax[]) => {
  // Delete existing order taxes for this booking
  await db.execute("DELETE FROM order_taxes WHERE booking_id = ?", [bookingId]);

  // Insert new order taxes
  for (const tax of taxes) {
    await db.execute(
      `INSERT INTO order_taxes (booking_id, tax_id, tax_name, tax_rate, tax_type, tax_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, tax.tax_id, tax.tax_name, tax.tax_rate, tax.tax_type, tax.tax_amount]
    );
  }
};

/** Get taxes applied to a booking */
export const getOrderTaxes = async (bookingId: number) => {
  const [rows] = await db.execute<OrderTaxRow[]>(
    "SELECT * FROM order_taxes WHERE booking_id = ? ORDER BY id ASC",
    [bookingId]
  );
  return rows;
};

// ═══════════════════════════════════════════════════
// Tax Reports
// ═══════════════════════════════════════════════════

/** Get tax summary report */
export const getTaxReport = async (startDate?: string, endDate?: string) => {
  let dateFilter = "";
  const params: any[] = [];

  if (startDate && endDate) {
    dateFilter = "AND b.created_at BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  // Tax collected summary by tax type
  const [taxSummary] = await db.execute<RowDataPacket[]>(
    `SELECT 
      ot.tax_id,
      ot.tax_name,
      ot.tax_rate,
      ot.tax_type,
      COUNT(DISTINCT ot.booking_id) as total_bookings,
      SUM(ot.tax_amount) as total_tax_collected
     FROM order_taxes ot
     JOIN bookings b ON ot.booking_id = b.id
     WHERE b.status IN ('CONFIRMED', 'COMPLETED') ${dateFilter}
     GROUP BY ot.tax_id, ot.tax_name, ot.tax_rate, ot.tax_type
     ORDER BY total_tax_collected DESC`,
    params
  );

  // Total tax collected
  const [totalRow] = await db.execute<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(ot.tax_amount), 0) as total_tax,
      COUNT(DISTINCT ot.booking_id) as total_bookings
     FROM order_taxes ot
     JOIN bookings b ON ot.booking_id = b.id
     WHERE b.status IN ('CONFIRMED', 'COMPLETED') ${dateFilter}`,
    params
  );

  // Monthly breakdown
  const [monthlyBreakdown] = await db.execute<RowDataPacket[]>(
    `SELECT 
      DATE_FORMAT(b.created_at, '%Y-%m') as month,
      COUNT(DISTINCT b.id) as bookings,
      SUM(b.sub_total) as revenue,
      SUM(b.tax_amount) as tax_collected,
      SUM(b.total_amount) as total_with_tax
     FROM bookings b
     WHERE b.status IN ('CONFIRMED', 'COMPLETED') ${dateFilter}
     GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
     ORDER BY month DESC
     LIMIT 12`,
    params
  );

  return {
    tax_summary: taxSummary,
    total_tax: (totalRow[0] as any)?.total_tax || 0,
    total_bookings: (totalRow[0] as any)?.total_bookings || 0,
    monthly_breakdown: monthlyBreakdown,
  };
};

/** Get tax details for a specific booking */
export const getBookingTaxDetails = async (bookingId: number) => {
  const [booking] = await db.execute<RowDataPacket[]>(
    `SELECT b.*, r.room_number, r.type as room_type, u.name as student_name
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     JOIN users u ON b.student_id = u.id
     WHERE b.id = ?`,
    [bookingId]
  );

  if (booking.length === 0) throw new Error("Booking not found");

  const taxes = await getOrderTaxes(bookingId);

  return {
    booking: booking[0],
    taxes,
    tax_total: taxes.reduce((sum, t) => sum + t.tax_amount, 0),
  };
};

// ═══════════════════════════════════════════════════
// Tax Preview (for frontend before booking)
// ═══════════════════════════════════════════════════

/** Preview tax calculation for a room (used by frontend) */
export const previewTax = async (roomId: number, months: number = 1, couponCode?: string) => {
  // Get room details
  const [rooms] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM rooms WHERE id = ?",
    [roomId]
  );
  if (rooms.length === 0) throw new Error("Room not found");

  const room = rooms[0] as any;
  const baseAmount = room.price_per_month * months;

  // Apply coupon if provided
  let discount = 0;
  if (couponCode) {
    const [coupons] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_to IS NULL OR valid_to >= NOW())
       AND (max_uses IS NULL OR current_uses < max_uses)`,
      [couponCode]
    );

    if (coupons.length > 0) {
      const coupon = coupons[0] as any;
      if (coupon.type === "percentage") {
        discount = Math.min((baseAmount * coupon.value) / 100, coupon.max_discount || Infinity);
      } else {
        discount = coupon.value;
      }
      discount = Math.round(discount * 100) / 100;
    }
  }

  const result = await calculateTax(baseAmount, discount);

  return {
    room_number: room.room_number,
    room_type: room.type,
    price_per_month: room.price_per_month,
    months,
    base_amount: baseAmount,
    ...result,
    final_amount: result.total_amount,
  };
};
