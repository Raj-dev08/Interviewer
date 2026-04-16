import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";


if (!process.env.NEON_DB) {
  throw new Error("NEON_DB is not set in environment variables");
}

const pool = new Pool({ connectionString: process.env.NEON_DB });


pool.on("connect", () => {
  console.log("Database connected successfully ✅");
});

pool.on("error", (err) => {
  console.error("💥 Database connection error:", err);
});

export const db = drizzle({ client: pool, schema });
