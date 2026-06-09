import { sql } from './src/lib/db.js';

async function run() {
  try {
    await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS components TEXT[] DEFAULT '{}'`;
    console.log("components column added successfully");
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
