import "dotenv/config";
import mysql, { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const pool: Pool = mysql.createPool({
  uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
export type { RowDataPacket, ResultSetHeader };
