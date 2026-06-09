"use client";

import { useState } from "react";
import Image from "next/image";

export default function MenuPreview() {
  const [activeTab, setActiveTab] = useState("starters");

  const tabs = [
    { id: "starters", label: "Starters" },
    { id: "grills", label: "Grills" },
    { id: "karahi", label: "Karahi" },
    { id: "biryani", label: "Biryani" },
    { id: "breads", label: "Breads" },
    { id: "desserts", label: "Desserts" },
    { id: "beverages", label: "Beverages" },
  ];

  // We only include a simplified preview data here.
  // In a full implementation, this could be fetched or imported from a central data source.
  const menuData: Record<string, any[]> = {
    starters: [
      { name: "Seekh Kebab", price: "PKR 1,200", desc: "Minced lamb skewers with green herbs, spices and charcoal finish. Served with mint chutney.", tags: [{ type: "spicy", label: "🌶 Spicy" }], image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=120&q=80" },
      { name: "Chicken Malai Boti", price: "PKR 1,100", desc: "Tender chicken in cream, cardamom and cheese marinade. Delicate and mildly spiced.", tags: [{ type: "mild", label: "Mild" }], image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=120&q=80" },
      { name: "Nihari Shorba", price: "PKR 850", desc: "Rich slow-cooked bone broth with fresh ginger julienne and fried onions. A warming classic.", tags: [{ type: "", label: "Traditional" }], image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=120&q=80" },
      { name: "Fish Tikka", price: "PKR 1,350", desc: "Fresh river fish marinated in lime, carom seeds and spices. Cooked in the clay tandoor.", tags: [{ type: "", label: "Grilled" }], image: "https://images.unsplash.com/photo-1626844571159-f5729c66d6ef?w=120&q=80" },
    ],
    grills: [
      { name: "Barra Lamb Chops", price: "PKR 2,800", desc: "Baby lamb chops marinated 24 hours in raw papaya, yoghurt and aromatic spices. Char-grilled in clay tandoor.", tags: [{ type: "signature", label: "✦ Signature" }, { type: "spicy", label: "🌶 Spicy" }], image: null },
      { name: "Chapli Kebab", price: "PKR 1,400", desc: "Peshawar-style minced beef patties with pomegranate seeds, whole coriander and green chillies.", tags: [{ type: "spicy", label: "🌶 Spicy" }, { type: "", label: "NWFP Style" }], image: null },
    ],
    karahi: [
      { name: "Chicken Karahi", price: "PKR 1,600", desc: "Bone-in chicken cooked in fresh tomatoes, ginger-garlic paste and whole spices in a traditional iron wok.", tags: [{ type: "spicy", label: "🌶 Spicy" }, { type: "", label: "Classic" }], image: null },
      { name: "Mutton Karahi", price: "PKR 2,200", desc: "Slow-cooked mutton shoulder in karahi masala, fresh tomatoes and green chillies. A timeless favourite.", tags: [{ type: "signature", label: "✦ Signature" }, { type: "spicy", label: "🌶 Spicy" }], image: null },
    ],
    biryani: [
      { name: "Sindhi Mutton Biryani", price: "PKR 1,800", desc: "Traditional Sindhi-style layered biryani with marinated mutton, plums and whole spices. Rich and aromatic.", tags: [{ type: "signature", label: "✦ Chef's Pick" }, { type: "spicy", label: "🌶 Spicy" }], image: null },
      { name: "Chicken Biryani", price: "PKR 1,400", desc: "Fragrant basmati with whole spices, caramelised onions and tender chicken. Served with raita.", tags: [{ type: "mild", label: "🌶 Medium" }], image: null },
    ],
    breads: [
      { name: "Tandoori Roti", price: "PKR 120", desc: "Whole wheat flatbread baked fresh in our clay tandoor. Served with butter on request.", tags: [{ type: "veg", label: "🌿 Veg" }], image: null },
      { name: "Garlic Naan", price: "PKR 180", desc: "Soft leavened bread brushed with garlic butter and fresh coriander. Cooked in the tandoor.", tags: [{ type: "veg", label: "🌿 Veg" }], image: null },
    ],
    desserts: [
      { name: "Gulab Jamun", price: "PKR 650", desc: "Soft khoya milk solids soaked in rose-cardamom sugar syrup. Served warm with vanilla kulfi.", tags: [{ type: "veg", label: "🌿 Veg" }, { type: "", label: "Traditional" }], image: null },
      { name: "Shahi Tukra", price: "PKR 750", desc: "Royal bread pudding soaked in saffron milk, topped with thickened rabri and pistachio shavings.", tags: [{ type: "signature", label: "✦ Royal" }, { type: "veg", label: "🌿 Veg" }], image: null },
    ],
    beverages: [
      { name: "Kashmiri Chai", price: "PKR 400", desc: "The iconic pink tea — green tea brewed with milk, cardamom and salt. Topped with crushed pistachios.", tags: [{ type: "signature", label: "✦ House Special" }, { type: "veg", label: "🌿 Veg" }], image: null },
      { name: "Mango Lassi", price: "PKR 450", desc: "Fresh Chaunsa mango blended with yoghurt, a hint of cardamom and a rose water finish.", tags: [{ type: "veg", label: "🌿 Veg" }, { type: "mild", label: "Mild" }], image: null },
    ],
  };

  return (
    <section id="menu" className="section menu-section">
      <div className="container">
        <div className="section-header centered">
          <span className="section-tag">Our Culinary Journey</span>
          <h2 className="section-title">The Menu</h2>
          <div className="gold-rule center"></div>
        </div>

        <div className="menu-tabs-wrapper">
          <div className="menu-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                role="tab"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-panels">
          <div className="menu-panel active">
            <div className="menu-grid">
              {(menuData[activeTab] || []).map((item, idx) => (
                <div key={idx} className={`menu-item ${!item.image ? "no-img" : ""}`}>
                  {item.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt={item.name} loading="lazy" />
                  )}
                  <div className="menu-item-body">
                    <div className="menu-item-head">
                      <h4>{item.name}</h4>
                      <span className="price">{item.price}</span>
                    </div>
                    <p>{item.desc}</p>
                    <div className="tags">
                      {item.tags.map((tag: any, tIdx: number) => (
                        <span key={tIdx} className={`tag ${tag.type}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
