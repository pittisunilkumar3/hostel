import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { hashPassword, comparePassword, generateToken } from "../helpers";
import { RegisterInput } from "../validators";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  avatar: string;
  created_at: Date;
  updated_at: Date;
}

export const registerUser = async (data: RegisterInput) => {
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ?",
    [data.email]
  );

  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);
  const role = data.role || "CUSTOMER";

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
    [data.name, data.email, hashedPassword, role, data.phone || null]
  );

  const token = generateToken(result.insertId, role);

  return {
    user: { id: result.insertId, name: data.name, email: data.email, role },
    token,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  expectedRole: string
) => {
  const [rows] = await db.execute<UserRow[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = rows[0];

  if (user.role !== expectedRole) {
    const roleName =
      expectedRole === "SUPER_ADMIN"
        ? "Super Admin"
        : expectedRole === "OWNER"
        ? "Hostel Owner"
        : "Customer";
    throw new Error(`Access denied. This login is for ${roleName} only.`);
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user.id, user.role);

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getAllUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [users] = await db.execute<RowDataPacket[]>(
    "SELECT id, name, email, role, phone, avatar, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [limit, skip]
  );

  const [countRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM users"
  );

  const total = (countRows[0] as any).total;

  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (id: number) => {
  const [rows] = await db.execute<UserRow[]>(
    "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  return rows[0];
};

export const updateUser = async (id: number, data: any) => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name) { fields.push("name = ?"); values.push(data.name); }
  if (data.email) { fields.push("email = ?"); values.push(data.email); }
  if (data.phone) { fields.push("phone = ?"); values.push(data.phone); }
  if (data.role) { fields.push("role = ?"); values.push(data.role); }
  if (data.password) {
    const hashed = await hashPassword(data.password);
    fields.push("password = ?");
    values.push(hashed);
  }

  if (fields.length === 0) throw new Error("No fields to update");

  values.push(id);
  await db.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

  return getUserById(id);
};

export const deleteUser = async (id: number) => {
  await db.execute("DELETE FROM users WHERE id = ?", [id]);
  return { message: "User deleted" };
};
