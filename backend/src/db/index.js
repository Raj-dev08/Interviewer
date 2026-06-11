import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

if (!process.env.NEON_DB) {
  throw new Error("NEON_DB is not set in environment variables");
}

// global singleton (prevents re-creation on hot reload / multiple imports)
const globalForPg = globalThis;

if (!globalForPg.pool) {
  globalForPg.pool = new Pool({
    connectionString: process.env.NEON_DB,
    max: 10,
  });

  globalForPg.pool.on("connect", () => {
    console.log("Database connected successfully ✅");
  });

  globalForPg.pool.on("error", (err) => {
    console.error("💥 Database connection error:", err);
  });
}

export const pool = globalForPg.pool;

export const db = drizzle({ client: pool, schema });