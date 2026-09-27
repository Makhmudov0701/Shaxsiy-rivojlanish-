import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getDatabaseUrl } from "./connection";
import * as schema from "./schema";

const { Pool } = pg;

export const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle(pool, { schema });

export * from "./schema";
