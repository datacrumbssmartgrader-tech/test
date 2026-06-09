require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items'`;
    console.log(res.map(r => r.column_name));
  } catch(e) {
    console.error(e);
  }
}
run();
