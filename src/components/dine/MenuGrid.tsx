"use client";

import { MENU, MenuItem } from "@/lib/menuData";

interface MenuGridProps {
  activeCategory: string;
  searchQuery: string;
  onItemClick: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  menuData?: any[]; // API menu data
  isLoading?: boolean;
}

export default function MenuGrid({ activeCategory, searchQuery, onItemClick, onQuickAdd, menuData, isLoading }: MenuGridProps) {
  // Use API menu data if provided, otherwise fallback to hardcoded MENU
  const sourceMenu = menuData && menuData.length > 0 ? menuData : MENU;

  // Map API menu items to local MenuItem format
  const mappedItems = sourceMenu.map((item: any) => ({
    id: item.id,
    name: item.name,
    cat: item.category || 'Other',
    price: typeof item.price === 'string' ? parseInt(item.price) : item.price,
    desc: item.description || '',
    img: item.image_url || 'https://via.placeholder.com/300',
    hidden: item.hidden === true,
    prepTime: 15, // Default prep time
  }));

  let items = activeCategory === "all" ? mappedItems : mappedItems.filter(m => m.cat === activeCategory);
  items = items.filter(m => !m.hidden);
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(m => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
  }

  if (isLoading) {
    return (
      <div className="no-results">
        <i className="ri-loader-4-line" style={{animation: 'spin 1s linear infinite'}}></i>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="no-results">
        <i className="ri-search-eye-line"></i>
        <p>No dishes found</p>
      </div>
    );
  }

  return (
    <div className="menu-grid">
      {items.map((item) => (
        <div key={item.id} className="item-card" onClick={() => onItemClick(item)}>
          <div className="item-card-img-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="item-card-img" src={item.img} alt={item.name} loading="lazy" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", position: "absolute", top: "0.5rem", right: "0.5rem", alignItems: "flex-end" }}>
              {(item as any).tags?.[0] && (
                <span className="item-card-tag" style={{ position: "static" }}>{(item as any).tags[0]}</span>
              )}
              {item.prepTime && (
                <span className="item-card-tag" style={{ position: "static", background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <i className="ri-timer-line"></i> {item.prepTime} mins
                </span>
              )}
            </div>
          </div>
          <div className="item-card-body">
            <div className="item-card-name">{item.name}</div>
            <div className="item-card-desc">{item.desc}</div>
            <div className="item-card-footer">
              <span className="item-card-price">PKR {item.price.toLocaleString()}</span>
              <button 
                className="item-add-btn" 
                aria-label={`Add ${item.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(item);
                }}
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
