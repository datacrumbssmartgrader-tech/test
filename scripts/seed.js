#!/usr/bin/env node
require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const DEFAULT_ADMIN_PIN = "1234";

async function runMigration() {
  console.log("🌱 Running database schema migration...");

  const statements = [
    // Drop tables
    "DROP TABLE IF EXISTS waiter_alerts CASCADE",
    "DROP TABLE IF EXISTS payments CASCADE",
    "DROP TABLE IF EXISTS order_items CASCADE",
    "DROP TABLE IF EXISTS orders CASCADE",
    "DROP TABLE IF EXISTS sessions CASCADE",
    "DROP TABLE IF EXISTS menu_extras CASCADE",
    "DROP TABLE IF EXISTS menu_items CASCADE",
    "DROP TABLE IF EXISTS customers CASCADE",
    "DROP TABLE IF EXISTS restaurant_tables CASCADE",
    "DROP TABLE IF EXISTS staff CASCADE",
    "DROP TYPE IF EXISTS staff_role CASCADE",
    "DROP TYPE IF EXISTS table_status CASCADE",
    "DROP TYPE IF EXISTS order_status CASCADE",
    "DROP TYPE IF EXISTS alert_type CASCADE",
    "DROP TYPE IF EXISTS payment_method CASCADE",
    "DROP TYPE IF EXISTS menu_item_type CASCADE",
    "DROP TYPE IF EXISTS discount_type CASCADE",

    // Create enum types
    "CREATE TYPE staff_role AS ENUM ('admin', 'user')",
    "CREATE TYPE table_status AS ENUM ('empty', 'active', 'disabled')",
    "CREATE TYPE order_status AS ENUM ('received', 'kitchen', 'ready', 'served', 'cancelled')",
    "CREATE TYPE alert_type AS ENUM ('waiter', 'bill', 'complaint')",
    "CREATE TYPE payment_method AS ENUM ('card', 'cash')",
    "CREATE TYPE menu_item_type AS ENUM ('single', 'platter')",
    "CREATE TYPE discount_type AS ENUM ('none', 'percent', 'flat')",

    // Create staff table
    `CREATE TABLE staff (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      role staff_role NOT NULL,
      pin_hash TEXT NOT NULL,
      avatar_initials TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create customers table
    `CREATE TABLE customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT UNIQUE,
      total_sessions INTEGER DEFAULT 0,
      total_spent NUMERIC(12,2) DEFAULT 0,
      first_visit TIMESTAMPTZ DEFAULT now(),
      last_visit TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create restaurant_tables
    `CREATE TABLE restaurant_tables (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      status table_status DEFAULT 'empty',
      active_session_id UUID,
      alert_active BOOLEAN DEFAULT false,
      qr_token UUID UNIQUE DEFAULT gen_random_uuid(),
      qr_regenerated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create sessions
    `CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
      customer_id UUID REFERENCES customers(id),
      billing_round INTEGER DEFAULT 1,
      opened_at TIMESTAMPTZ DEFAULT now(),
      closed_at TIMESTAMPTZ,
      total_paid NUMERIC(12,2) DEFAULT 0
    )`,

    // Create menu_items
    `CREATE TABLE menu_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      prep_time INTEGER,
      image_url TEXT,
      image_public_id TEXT,
      type menu_item_type DEFAULT 'single',
      available BOOLEAN DEFAULT true,
      hidden BOOLEAN DEFAULT false,
      discount_type discount_type DEFAULT 'none',
      discount_value NUMERIC(6,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create menu_extras
    `CREATE TABLE menu_extras (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create orders
    `CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES sessions(id),
      table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
      billing_round INTEGER NOT NULL,
      status order_status DEFAULT 'received',
      cancel_reason TEXT,
      total NUMERIC(10,2) DEFAULT 0,
      placed_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create order_items
    `CREATE TABLE order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id UUID NOT NULL REFERENCES menu_items(id),
      name TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create payments
    `CREATE TABLE payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES sessions(id),
      table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
      billing_round INTEGER NOT NULL,
      order_ids UUID[] NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      method payment_method NOT NULL,
      paid_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create waiter_alerts
    `CREATE TABLE waiter_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
      session_id UUID NOT NULL REFERENCES sessions(id),
      type alert_type NOT NULL,
      message TEXT,
      dismissed BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )`,

    // Create indexes
    "CREATE INDEX idx_sessions_table_id ON sessions(table_id)",
    "CREATE INDEX idx_sessions_customer_id ON sessions(customer_id)",
    "CREATE INDEX idx_sessions_closed_at ON sessions(closed_at)",
    "CREATE INDEX idx_orders_session_id ON orders(session_id)",
    "CREATE INDEX idx_orders_table_id ON orders(table_id)",
    "CREATE INDEX idx_orders_status ON orders(status)",
    "CREATE INDEX idx_orders_placed_at ON orders(placed_at)",
    "CREATE INDEX idx_order_items_order_id ON order_items(order_id)",
    "CREATE INDEX idx_payments_session_id ON payments(session_id)",
    "CREATE INDEX idx_payments_paid_at ON payments(paid_at)",
    "CREATE INDEX idx_waiter_alerts_table_id ON waiter_alerts(table_id)",
    "CREATE INDEX idx_waiter_alerts_dismissed ON waiter_alerts(dismissed)",
    "CREATE INDEX idx_customers_phone ON customers(phone)",
    "CREATE INDEX idx_customers_last_visit ON customers(last_visit)",
    "CREATE INDEX idx_menu_items_category ON menu_items(category)",
    "CREATE INDEX idx_menu_items_available ON menu_items(available)",

    // Add constraint
    "ALTER TABLE restaurant_tables ADD CONSTRAINT fk_active_session_id FOREIGN KEY (active_session_id) REFERENCES sessions(id) ON DELETE SET NULL",
  ];

  try {
    for (const statement of statements) {
      // Execute raw SQL - for migrations we need to handle this carefully
      try {
        // Using eval is not ideal but necessary for dynamic DDL in migrations
        await sql(statement);
      } catch (error) {
        // Some statements might fail (e.g., DROP IF EXISTS on non-existent objects)
        // This is expected and we can safely continue
        if (!error.message.includes('does not exist')) {
          throw error;
        }
      }
    }
    console.log("✅ Schema migration completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    await runMigration();

    // 1. Hash the admin PIN
    const pinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);

    // 2. Create admin staff record
    console.log("📝 Creating admin staff record...");
    await sql`
      INSERT INTO staff (name, role, pin_hash, avatar_initials, active)
      VALUES ('Admin', 'admin', ${pinHash}, 'RD', true)
      ON CONFLICT DO NOTHING;
    `;
    console.log("✅ Admin created (PIN: 1234)");

    // 3. Create 12 restaurant tables
    console.log("🪑 Creating restaurant tables...");
    for (let i = 1; i <= 12; i++) {
      const tableId = `T${String(i).padStart(2, "0")}`;
      const label = `Table ${i}`;
      await sql`
        INSERT INTO restaurant_tables (id, label, status)
        VALUES (${tableId}, ${label}, 'empty')
        ON CONFLICT DO NOTHING;
      `;
    }
    console.log("✅ Created 12 tables (T01-T12)");

    // 4. Seed menu items
    console.log("🍽️ Seeding menu items...");
    const menuData = [
      {
        name: "Seekh Kebab",
        cat: "starters",
        price: 1200,
        desc: "Minced lamb with aromatic spices, grilled over charcoal.",
        img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
        prepTime: 12,
      },
      {
        name: "Chicken Malai Boti",
        cat: "starters",
        price: 1100,
        desc: "Tender chicken in cream and mild spice marinade.",
        img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80",
        prepTime: 10,
      },
      {
        name: "Fish Tikka",
        cat: "starters",
        price: 1350,
        desc: "Fresh fish marinated in carom and citrus, char-grilled.",
        img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        prepTime: 15,
      },
      {
        name: "Nihari Shorba",
        cat: "starters",
        price: 850,
        desc: "Rich slow-cooked broth with slow-braised beef, served with naan.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 20,
      },
      {
        name: "Shammi Kebab",
        cat: "starters",
        price: 950,
        desc: "Minced beef and lentil patties, pan-fried crisp.",
        img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80",
        prepTime: 10,
      },
      {
        name: "Dahi Bara Chaat",
        cat: "starters",
        price: 700,
        desc: "Lentil dumplings in yoghurt with tamarind and mint chutney.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 8,
      },
      {
        name: "Barra Lamb Chops",
        cat: "grills",
        price: 2800,
        desc: "Raan chops in Kashmiri spice rub, grilled to perfection.",
        img: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80",
        prepTime: 18,
      },
      {
        name: "Chapli Kebab",
        cat: "grills",
        price: 1400,
        desc: "Peshawar-style spiced mince patties on the griddle.",
        img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
        prepTime: 12,
      },
      {
        name: "Tandoori Prawns",
        cat: "grills",
        price: 1800,
        desc: "Tiger prawns in a turmeric-citrus marinade, clay oven fired.",
        img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        prepTime: 16,
      },
      {
        name: "Achari Murgh Tikka",
        cat: "grills",
        price: 1300,
        desc: "Chicken in pickle-spiced yoghurt, smoky and tangy.",
        img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80",
        prepTime: 14,
      },
      {
        name: "Reshmi Kebab",
        cat: "grills",
        price: 1250,
        desc: "Silky chicken mince kebabs with rose water and saffron.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 13,
      },
      {
        name: "Mixed Grill Platter",
        cat: "grills",
        price: 3500,
        desc: "Assortment of our signature kebabs — ideal for sharing.",
        img: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80",
        prepTime: 22,
        type: "platter",
      },
      {
        name: "Chicken Karahi",
        cat: "karahi",
        price: 1600,
        desc: "Wok-tossed chicken in tomatoes, ginger and green chilli.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 18,
      },
      {
        name: "Mutton Karahi",
        cat: "karahi",
        price: 2200,
        desc: "Slow-cooked tender mutton, rich karahi gravy.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 25,
      },
      {
        name: "Rogan Josh",
        cat: "karahi",
        price: 2400,
        desc: "Kashmiri lamb curry, bloomed spices, scarlet colour.",
        img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        prepTime: 24,
      },
      {
        name: "Saag Gosht",
        cat: "karahi",
        price: 2100,
        desc: "Lamb simmered in spiced mustard greens.",
        img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80",
        prepTime: 22,
      },
      {
        name: "Lahori Dal Makhani",
        cat: "karahi",
        price: 1100,
        desc: "Black lentils slow-cooked overnight with butter and cream.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 20,
      },
      {
        name: "Nihari",
        cat: "karahi",
        price: 2000,
        desc: "Braised beef shank in deep, slow-cooked spiced gravy.",
        img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
        prepTime: 30,
      },
      {
        name: "Sindhi Mutton Biryani",
        cat: "biryani",
        price: 1800,
        desc: "Dum-cooked mutton with saffron-scented Sindhi spices.",
        img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
        prepTime: 28,
      },
      {
        name: "Chicken Biryani",
        cat: "biryani",
        price: 1400,
        desc: "Classic layered biryani with whole spices and fried onions.",
        img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
        prepTime: 25,
      },
      {
        name: "Zafrani Pulao",
        cat: "biryani",
        price: 900,
        desc: "Fragrant saffron rice with whole spices and golden raisins.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 20,
      },
      {
        name: "Prawn Biryani",
        cat: "biryani",
        price: 2000,
        desc: "Tiger prawns layered with spiced basmati, slow-steamed.",
        img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        prepTime: 24,
      },
      {
        name: "Tandoori Roti",
        cat: "breads",
        price: 120,
        desc: "Wholemeal flatbread, freshly baked in the clay oven.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 5,
      },
      {
        name: "Garlic Naan",
        cat: "breads",
        price: 180,
        desc: "Leavened bread brushed with garlic butter and coriander.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 6,
      },
      {
        name: "Peshwari Naan",
        cat: "breads",
        price: 250,
        desc: "Stuffed with almonds, coconut and sultanas.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 8,
      },
      {
        name: "Laccha Paratha",
        cat: "breads",
        price: 200,
        desc: "Multi-layered flaky flatbread from the griddle.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 7,
      },
      {
        name: "Gulab Jamun",
        cat: "desserts",
        price: 650,
        desc: "Soft milk dumplings soaked in rose and cardamom syrup.",
        img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80",
        prepTime: 8,
      },
      {
        name: "Shahi Tukra",
        cat: "desserts",
        price: 750,
        desc: "Royal bread pudding with condensed milk and pistachios.",
        img: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
        prepTime: 10,
      },
      {
        name: "Pistachio Kulfi",
        cat: "desserts",
        price: 550,
        desc: "Frozen milk ice cream set on a stick, dense and creamy.",
        img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80",
        prepTime: 5,
      },
      {
        name: "Kheer",
        cat: "desserts",
        price: 600,
        desc: "Rice pudding slow-cooked with cardamom and rose water.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 12,
      },
      {
        name: "Kashmiri Chai",
        cat: "beverages",
        price: 400,
        desc: "Pink salt tea brewed with pistachios and almonds.",
        img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80",
        prepTime: 4,
      },
      {
        name: "Mango Lassi",
        cat: "beverages",
        price: 450,
        desc: "Chilled yoghurt blended with Sindhri mango pulp.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 3,
      },
      {
        name: "Rooh Afza Sharbat",
        cat: "beverages",
        price: 350,
        desc: "Classic rose syrup drink with basil seeds and ice.",
        img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80",
        prepTime: 2,
      },
      {
        name: "Fresh Lime Soda",
        cat: "beverages",
        price: 300,
        desc: "Freshly squeezed lime with sparkling water and mint.",
        img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
        prepTime: 2,
      },
    ];

    for (const item of menuData) {
      await sql`
        INSERT INTO menu_items (name, category, description, price, prep_time, image_url, type, available, hidden)
        VALUES (
          ${item.name},
          ${item.cat},
          ${item.desc},
          ${item.price},
          ${item.prepTime},
          ${item.img},
          ${item.type || "single"},
          true,
          false
        )
        ON CONFLICT DO NOTHING;
      `;
    }
    console.log(`✅ Seeded ${menuData.length} menu items`);

    console.log("\n✨ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
