"use client";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = [
    { id: "all", label: "All" },
    { id: "starters", label: "Starters" },
    { id: "grills", label: "Grills" },
    { id: "karahi", label: "Karahi" },
    { id: "biryani", label: "Biryani" },
    { id: "breads", label: "Breads" },
    { id: "desserts", label: "Desserts" },
    { id: "beverages", label: "Beverages" },
    { id: "platters", label: "Platters" },
  ];

  return (
    <div className="cat-tabs-wrap">
      <div className="cat-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
