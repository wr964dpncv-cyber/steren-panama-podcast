import { sql } from "@vercel/postgres";
import { DEFAULT_TERMS } from "./terms";

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      booking_date DATE NOT NULL,
      start_hour INTEGER NOT NULL,
      end_hour INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (booking_date)`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS terms_version INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ`;

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO app_settings (key, value, version)
    VALUES ('terms', ${DEFAULT_TERMS}, 1)
    ON CONFLICT (key) DO NOTHING
  `;

  initialized = true;
}

export async function getTerms(): Promise<{ content: string; version: number; updatedAt: string }> {
  await ensureSchema();
  const { rows } = await sql<{ value: string; version: number; updated_at: string }>`
    SELECT value, version, updated_at FROM app_settings WHERE key = 'terms'
  `;
  const row = rows[0];
  return {
    content: row?.value ?? DEFAULT_TERMS,
    version: row?.version ?? 1,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export async function updateTerms(content: string): Promise<{ version: number; updatedAt: string }> {
  await ensureSchema();
  const { rows } = await sql<{ version: number; updated_at: string }>`
    UPDATE app_settings
    SET value = ${content},
        version = version + 1,
        updated_at = NOW()
    WHERE key = 'terms'
    RETURNING version, updated_at
  `;
  const row = rows[0];
  return { version: row.version, updatedAt: row.updated_at };
}

export { sql };
