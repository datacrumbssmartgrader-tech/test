#!/usr/bin/env node
require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
  console.log("Adding is_visible column to restaurant_tables...");

  await sql`
    ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true
  `;
  console.log("Column added (or already existed).");

  // Mark existing T01-T12 as visible (should already be default true)
  await sql`
    UPDATE restaurant_tables SET is_visible = true
    WHERE id ~ '^T0[0-9]$' OR id = 'T10' OR id = 'T11' OR id = 'T12'
  `;

  // Insert T13-T24 reserve pool (skip if already exist)
  for (let i = 13; i <= 24; i++) {
    const tableId = `T${String(i).padStart(2, "0")}`;
    const label = `Table ${i}`;
    await sql`
      INSERT INTO restaurant_tables (id, label, status, is_visible)
      VALUES (${tableId}, ${label}, 'disabled', false)
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log("Reserve tables T13-T24 seeded.");
  console.log("Migration complete.");
}

run().catch((err) => { console.error(err); process.exit(1); });
