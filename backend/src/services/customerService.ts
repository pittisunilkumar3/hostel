import db, { RowDataPacket, ResultSetHeader } from "../config/database";

interface CustomerRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  status: number;
  created_at: Date;
  orders_count?: number;
  total_spent?: number;
  last_order_date?: Date | null;
}

interface GetCustomersParams {
  search?: string;
  status?: string;
  sort?: string;
  limit?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
}

// ── Get all customers with filters ──
export const getCustomers = async (params: GetCustomersParams) => {
  const { search, status, sort, limit: showLimit, from_date, to_date, page = 1 } = params;
  const limit = showLimit ? parseInt(showLimit) : 20;
  const offset = (page - 1) * limit;

  let where = "WHERE u.role = 'CUSTOMER'";
  const values: any[] = [];

  if (search) {
    where += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status === "active") {
    where += " AND u.status = 1";
  } else if (status === "inactive") {
    where += " AND u.status = 0";
  }

  if (from_date) {
    where += " AND u.created_at >= ?";
    values.push(from_date);
  }

  if (to_date) {
    where += " AND u.created_at <= ?";
    values.push(to_date + " 23:59:59");
  }

  // Count
  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users u ${where}`,
    values
  );
  const total = countRows[0].total;

  // Sort
  let orderBy = "ORDER BY u.created_at DESC";
  if (sort === "top") orderBy = "ORDER BY orders_count DESC";
  else if (sort === "order_amount") orderBy = "ORDER BY total_spent DESC";
  else if (sort === "oldest") orderBy = "ORDER BY u.created_at ASC";

  const [rows] = await db.execute<CustomerRow[]>(
    `SELECT u.id, u.name, u.email, u.phone, u.image, u.status, u.created_at,
      COALESCE(o.orders_count, 0) as orders_count,
      COALESCE(o.total_spent, 0) as total_spent,
      o.last_order_date
     FROM users u
     LEFT JOIN (
       SELECT user_id,
              COUNT(*) as orders_count,
              SUM(total_amount) as total_spent,
              MAX(created_at) as last_order_date
       FROM orders
       GROUP BY user_id
     ) o ON u.id = o.user_id
     ${where}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    data: rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ── Get customer stats ──
export const getCustomerStats = async () => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
     FROM users
     WHERE role = 'CUSTOMER'`
  );
  return rows[0];
};

// ── Get single customer with details ──
export const getCustomerById = async (id: number) => {
  const [rows] = await db.execute<CustomerRow[]>(
    `SELECT id, name, email, phone, image, status, created_at
     FROM users
     WHERE id = ? AND role = 'CUSTOMER'`,
    [id]
  );

  if (rows.length === 0) return null;

  const customer = rows[0];

  // Get orders
  const [orders] = await db.execute<RowDataPacket[]>(
    `SELECT id, order_id, hostel_name, check_in, check_out, total_amount as amount, status, created_at
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [id]
  );

  // Get totals
  const [totals] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent
     FROM orders
     WHERE user_id = ?`,
    [id]
  );

  return {
    ...customer,
    orders,
    total_orders: totals[0]?.total_orders || 0,
    total_spent: totals[0]?.total_spent || 0,
    wallet_balance: 0,
    loyalty_points: 0,
  };
};

// ── Toggle customer status ──
export const toggleCustomerStatus = async (id: number, status: boolean) => {
  await db.execute(
    `UPDATE users SET status = ? WHERE id = ? AND role = 'CUSTOMER'`,
    [status ? 1 : 0, id]
  );
  return { success: true };
};
