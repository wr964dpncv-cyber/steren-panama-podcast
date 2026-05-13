import { sql } from "@vercel/postgres";
import { DEFAULT_TERMS } from "./terms";
import { hashPassword } from "./passwords";

let initialized = false;

export type User = {
  id: number;
  email: string;
  name: string;
  is_super_admin: boolean;
  created_at: string;
};

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
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS bookings_group_idx ON bookings (group_id)`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS social_youtube TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS social_instagram TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS social_tiktok TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS social_other TEXT`;

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

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS blocked_dates (
      blocked_date DATE PRIMARY KEY,
      reason TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE blocked_dates ADD COLUMN IF NOT EXISTS recurring_annual BOOLEAN NOT NULL DEFAULT FALSE`;

  // Bootstrap super admin (Mily) if no users exist yet.
  const { rows: countRows } = await sql<{ c: string }>`SELECT COUNT(*)::text AS c FROM users`;
  const hasUsers = Number(countRows[0]?.c || 0) > 0;
  if (!hasUsers) {
    const email = (process.env.SUPERADMIN_EMAIL || "mily@newton.lat").toLowerCase();
    const name = process.env.SUPERADMIN_NAME || "Mily";
    const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || "ChangeMe123!";
    const hash = await hashPassword(initialPassword);
    await sql`
      INSERT INTO users (email, name, password_hash, is_super_admin)
      VALUES (${email}, ${name}, ${hash}, TRUE)
      ON CONFLICT (email) DO NOTHING
    `;
  }

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
    SET value = ${content}, version = version + 1, updated_at = NOW()
    WHERE key = 'terms'
    RETURNING version, updated_at
  `;
  const row = rows[0];
  return { version: row.version, updatedAt: row.updated_at };
}

export async function getUserById(id: number): Promise<User | null> {
  await ensureSchema();
  const { rows } = await sql<User>`
    SELECT id, email, name, is_super_admin, created_at::text AS created_at
    FROM users WHERE id = ${id}
  `;
  return rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  await ensureSchema();
  const { rows } = await sql<User & { password_hash: string }>`
    SELECT id, email, name, is_super_admin, password_hash, created_at::text AS created_at
    FROM users WHERE email = ${email.toLowerCase()}
  `;
  return rows[0] || null;
}

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  const { rows } = await sql<User>`
    SELECT id, email, name, is_super_admin, created_at::text AS created_at
    FROM users ORDER BY is_super_admin DESC, created_at ASC
  `;
  return rows;
}

export type BlockedRow = {
  date: string;
  reason: string;
  recurring_annual: boolean;
  month_day: string; // 'MM-DD'
};

export async function listAllBlockedRows(): Promise<BlockedRow[]> {
  await ensureSchema();
  const { rows } = await sql<BlockedRow>`
    SELECT TO_CHAR(blocked_date, 'YYYY-MM-DD') AS date,
           reason,
           recurring_annual,
           TO_CHAR(blocked_date, 'MM-DD') AS month_day
    FROM blocked_dates
    ORDER BY recurring_annual DESC, blocked_date
  `;
  return rows;
}

export async function listBlockedDates(
  from?: string,
  to?: string
): Promise<{ dates: string[]; annual: string[] }> {
  await ensureSchema();
  // recurring rules — return as 'MM-DD' patterns
  const { rows: recurring } = await sql<{ month_day: string }>`
    SELECT TO_CHAR(blocked_date, 'MM-DD') AS month_day
    FROM blocked_dates
    WHERE recurring_annual = TRUE
  `;
  const annual = recurring.map((r) => r.month_day);

  // one-off concrete dates in the requested range (or upcoming year by default)
  let oneOff: { date: string }[];
  if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    ({ rows: oneOff } = await sql<{ date: string }>`
      SELECT TO_CHAR(blocked_date, 'YYYY-MM-DD') AS date
      FROM blocked_dates
      WHERE recurring_annual = FALSE
        AND blocked_date BETWEEN ${from} AND ${to}
      ORDER BY blocked_date
    `);
  } else {
    ({ rows: oneOff } = await sql<{ date: string }>`
      SELECT TO_CHAR(blocked_date, 'YYYY-MM-DD') AS date
      FROM blocked_dates
      WHERE recurring_annual = FALSE AND blocked_date >= CURRENT_DATE
      ORDER BY blocked_date
      LIMIT 365
    `);
  }
  return { dates: oneOff.map((r) => r.date), annual };
}

export async function isDateBlocked(date: string): Promise<{ blocked: boolean; reason: string }> {
  await ensureSchema();
  const mmdd = date.slice(5); // 'MM-DD'
  const { rows } = await sql<{ reason: string }>`
    SELECT reason FROM blocked_dates
    WHERE blocked_date = ${date}
       OR (recurring_annual = TRUE AND TO_CHAR(blocked_date, 'MM-DD') = ${mmdd})
    LIMIT 1
  `;
  if (rows.length === 0) return { blocked: false, reason: "" };
  return { blocked: true, reason: rows[0].reason };
}

export { sql };
