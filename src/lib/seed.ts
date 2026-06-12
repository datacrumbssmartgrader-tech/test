import bcrypt from "bcryptjs";
import { sql } from "./db";

const DEFAULT_ADMIN_PIN = "1234"; // Change after first run

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Hash the admin PIN
    const pinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);

    // 2. Create admin staff record
    console.log("📝 Creating admin staff record...");
    const admin = await sql`
      INSERT INTO staff (name, role, pin_hash, avatar_initials, active)
      VALUES ('Admin', 'admin', ${pinHash}, 'RD', true)
      ON CONFLICT DO NOTHING
      RETURNING id, name, role;
    `;
    console.log("✅ Admin created:", admin);

    // 3. Create 12 visible restaurant tables + 12 hidden reserve tables
    console.log("🪑 Creating restaurant tables...");
    for (let i = 1; i <= 12; i++) {
      const tableId = `T${String(i).padStart(2, "0")}`;
      const label = `Table ${i}`;
      await sql`
        INSERT INTO restaurant_tables (id, label, status, is_visible)
        VALUES (${tableId}, ${label}, 'empty', true)
        ON CONFLICT DO NOTHING;
      `;
    }
    for (let i = 13; i <= 24; i++) {
      const tableId = `T${String(i).padStart(2, "0")}`;
      const label = `Table ${i}`;
      await sql`
        INSERT INTO restaurant_tables (id, label, status, is_visible)
        VALUES (${tableId}, ${label}, 'disabled', false)
        ON CONFLICT DO NOTHING;
      `;
    }
    console.log("✅ Created 12 visible tables (T01-T12) + 12 hidden reserve tables (T13-T24)");

    // 4. Seed menu items
    console.log("🍽️ Seeding menu items...");
    const menuData = [
      // Starters
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
      // Grills
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
      // Karahi & Curries
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
      // Biryani
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
      // Breads
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
      // Desserts
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
      // Beverages
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
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
