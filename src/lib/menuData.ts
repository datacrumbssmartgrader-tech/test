export interface Extra { label: string; price: number; }
export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  cat: string;
  img: string;
  tags?: string[];
  extras?: Extra[];
  hidden?: boolean;
  prepTime?: number;
}

export const MENU: MenuItem[] = [
  // Starters
  { id: 's1', cat: 'starters', name: 'Seekh Kebab', price: 1200, desc: 'Minced lamb with aromatic spices, grilled over charcoal.', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', tags: ['Chef\'s Pick'], prepTime: 12 },
  { id: 's2', cat: 'starters', name: 'Chicken Malai Boti', price: 1100, desc: 'Tender chicken in cream and mild spice marinade.', img: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', prepTime: 10 },
  { id: 's3', cat: 'starters', name: 'Fish Tikka', price: 1350, desc: 'Fresh fish marinated in carom and citrus, char-grilled.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', prepTime: 15 },
  { id: 's4', cat: 'starters', name: 'Nihari Shorba', price: 850, desc: 'Rich slow-cooked broth with slow-braised beef, served with naan.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 20 },
  { id: 's5', cat: 'starters', name: 'Shammi Kebab', price: 950, desc: 'Minced beef and lentil patties, pan-fried crisp.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80', prepTime: 10 },
  { id: 's6', cat: 'starters', name: 'Dahi Bara Chaat', price: 700, desc: 'Lentil dumplings in yoghurt with tamarind and mint chutney.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 8 },
  // Grills
  { id: 'g1', cat: 'grills', name: 'Barra Lamb Chops', price: 2800, desc: 'Raan chops in Kashmiri spice rub, grilled to perfection.', img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80', tags: ['Signature'], prepTime: 18 },
  { id: 'g2', cat: 'grills', name: 'Chapli Kebab', price: 1400, desc: 'Peshawar-style spiced mince patties on the griddle.', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', prepTime: 12 },
  { id: 'g3', cat: 'grills', name: 'Tandoori Prawns', price: 1800, desc: 'Tiger prawns in a turmeric-citrus marinade, clay oven fired.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', prepTime: 16 },
  { id: 'g4', cat: 'grills', name: 'Achari Murgh Tikka', price: 1300, desc: 'Chicken in pickle-spiced yoghurt, smoky and tangy.', img: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', prepTime: 14 },
  { id: 'g5', cat: 'grills', name: 'Reshmi Kebab', price: 1250, desc: 'Silky chicken mince kebabs with rose water and saffron.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 13 },
  { id: 'g6', cat: 'platters', name: 'Mixed Grill Platter', price: 3500, desc: 'Assortment of our signature kebabs — ideal for sharing.', img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&q=80', tags: ['For 2'], extras: [{ label: 'Extra naan (2 pcs)', price: 240 }], prepTime: 22 },
  // Karahi & Curries
  { id: 'k1', cat: 'karahi', name: 'Chicken Karahi', price: 1600, desc: 'Wok-tossed chicken in tomatoes, ginger and green chilli.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', tags: ['Bestseller'], prepTime: 18 },
  { id: 'k2', cat: 'karahi', name: 'Mutton Karahi', price: 2200, desc: 'Slow-cooked tender mutton, rich karahi gravy.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 25 },
  { id: 'k3', cat: 'karahi', name: 'Rogan Josh', price: 2400, desc: 'Kashmiri lamb curry, bloomed spices, scarlet colour.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', prepTime: 24 },
  { id: 'k4', cat: 'karahi', name: 'Saag Gosht', price: 2100, desc: 'Lamb simmered in spiced mustard greens.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80', prepTime: 22 },
  { id: 'k5', cat: 'karahi', name: 'Lahori Dal Makhani', price: 1100, desc: 'Black lentils slow-cooked overnight with butter and cream.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 20 },
  { id: 'k6', cat: 'karahi', name: 'Nihari', price: 2000, desc: 'Braised beef shank in deep, slow-cooked spiced gravy.', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', tags: ['Weekend'], prepTime: 30 },
  // Biryani
  { id: 'b1', cat: 'biryani', name: 'Sindhi Mutton Biryani', price: 1800, desc: 'Dum-cooked mutton with saffron-scented Sindhi spices.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', tags: ['Signature'], prepTime: 28 },
  { id: 'b2', cat: 'biryani', name: 'Chicken Biryani', price: 1400, desc: 'Classic layered biryani with whole spices and fried onions.', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', prepTime: 25 },
  { id: 'b3', cat: 'biryani', name: 'Zafrani Pulao', price: 900, desc: 'Fragrant saffron rice with whole spices and golden raisins.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 20 },
  { id: 'b4', cat: 'biryani', name: 'Prawn Biryani', price: 2000, desc: 'Tiger prawns layered with spiced basmati, slow-steamed.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', prepTime: 24 },
  // Breads
  { id: 'br1', cat: 'breads', name: 'Tandoori Roti', price: 120, desc: 'Wholemeal flatbread, freshly baked in the clay oven.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 5 },
  { id: 'br2', cat: 'breads', name: 'Garlic Naan', price: 180, desc: 'Leavened bread brushed with garlic butter and coriander.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 6 },
  { id: 'br3', cat: 'breads', name: 'Peshwari Naan', price: 250, desc: 'Stuffed with almonds, coconut and sultanas.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 8 },
  { id: 'br4', cat: 'breads', name: 'Laccha Paratha', price: 200, desc: 'Multi-layered flaky flatbread from the griddle.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 7 },
  // Desserts
  { id: 'd1', cat: 'desserts', name: 'Gulab Jamun', price: 650, desc: 'Soft milk dumplings soaked in rose and cardamom syrup.', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80', prepTime: 8 },
  { id: 'd2', cat: 'desserts', name: 'Shahi Tukra', price: 750, desc: 'Royal bread pudding with condensed milk and pistachios.', img: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80', prepTime: 10 },
  { id: 'd3', cat: 'desserts', name: 'Pistachio Kulfi', price: 550, desc: 'Frozen milk ice cream set on a stick, dense and creamy.', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', prepTime: 5 },
  { id: 'd4', cat: 'desserts', name: 'Kheer', price: 600, desc: 'Rice pudding slow-cooked with cardamom and rose water.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 12 },
  // Beverages
  { id: 'bv1', cat: 'beverages', name: 'Kashmiri Chai', price: 400, desc: 'Pink salt tea brewed with pistachios and almonds.', img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', tags: ['Popular'], prepTime: 4 },
  { id: 'bv2', cat: 'beverages', name: 'Mango Lassi', price: 450, desc: 'Chilled yoghurt blended with Sindhri mango pulp.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 3 },
  { id: 'bv3', cat: 'beverages', name: 'Rooh Afza Sharbat', price: 350, desc: 'Classic rose syrup drink with basil seeds and ice.', img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', prepTime: 2 },
  { id: 'bv4', cat: 'beverages', name: 'Fresh Lime Soda', price: 300, desc: 'Freshly squeezed lime with sparkling water and mint.', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', prepTime: 2 },
];
