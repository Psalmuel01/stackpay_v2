import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

let poolPromise;

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.STACKPAY_DATABASE_URL ?? "";
}

async function createPool() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const { Pool } = await import("pg");
  return new Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.STACKPAY_DATABASE_SSL === "require"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export async function getPool() {
  if (!poolPromise) {
    poolPromise = createPool();
  }
  return poolPromise;
}

export async function query(text, params = []) {
  const pool = await getPool();
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function applyMigrations() {
  const migrationsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../db/migrations"
  );
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const alreadyApplied = await query(
      "select 1 from schema_migrations where version = $1 limit 1",
      [file]
    );
    if (alreadyApplied.rowCount) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        "insert into schema_migrations (version) values ($1)",
        [file]
      );
    });
  }
}
