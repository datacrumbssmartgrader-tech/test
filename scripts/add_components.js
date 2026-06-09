require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS components TEXT[] DEFAULT '{}'`;
    console.log("Column 'components' added.");
  } catch(e) {
    console.error(e);
  }
}
run();
