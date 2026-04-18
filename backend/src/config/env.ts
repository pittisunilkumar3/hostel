export const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  jwtSecret: process.env.JWT_SECRET || "your-super-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
