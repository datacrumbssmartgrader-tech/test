"use client";

import { useState, useEffect } from "react";
import { MenuItem, Extra } from "@/lib/menuData";

interface ItemDetailSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, qty: number, note: string, selectedExtras: Extra[]) => void;
}

export default function ItemDetailSheet({ item, isOpen, onClose, onAddToCart }: ItemDetailSheetProps) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  useEffect(() => {
    if (isOpen && item) {
      setQty(1);
      setNote("");
      setSelectedExtras([]);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, item]);

  if (!item) return null;

  const handleExtraClick = (extra: Extra) => {
    const idx = selectedExtras.findIndex(e => e.label === extra.label);
    if (idx >= 0) {
      setSelectedExtras(prev => prev.filter(e => e.label !== extra.label));
    } else {
      setSelectedExtras(prev => [...prev, extra]);
    }
  };

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
  const total = (item.price + extrasTotal) * qty;

  return (
    <>
      <div 
        className={`sheet-backdrop ${isOpen ? "open" : ""}`} 
        onClick={onClose}
      ></div>
      <div 
        className={`bottom-sheet ${isOpen ? "open" : ""}`} 
        role="dialog" 
        aria-modal="true" 
        aria-label="Item detail"
      >
        <div className="sheet-handle"></div>
        <div className="item-sheet-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.img} alt={item.name} className="item-sheet-img" />
          <button className="sheet-close" aria-label="Close" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="item-sheet-body">
          <div className="item-sheet-tags">
            {item.prepTime && (
              <span className="item-sheet-tag prep-time">
                <i className="ri-timer-line"></i> {item.prepTime} mins
              </span>
            )}
            {item.tags?.map((t, idx) => (
              <span key={idx} className="item-sheet-tag">{t}</span>
            ))}
          </div>
          <h2 className="item-sheet-name">{item.name}</h2>
          <p className="item-sheet-desc">{item.desc}</p>
          <div className="item-sheet-price-row">
            <span className="item-sheet-price">PKR {item.price.toLocaleString()}</span>
          </div>

          {item.extras && item.extras.length > 0 && (
            <div className="item-sheet-section">
              <h4 className="item-sheet-section-title">Add-ons</h4>
              <div className="extras-list">
                {item.extras.map((ex, idx) => {
                  const isSelected = selectedExtras.some(e => e.label === ex.label);
                  return (
                    <div 
                      key={idx} 
                      className={`extra-option ${isSelected ? "selected" : ""}`}
                      onClick={() => handleExtraClick(ex)}
                    >
                      <span className="extra-option-label">{ex.label}</span>
                      <span className="extra-option-price">+PKR {ex.price.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="item-sheet-section">
            <h4 className="item-sheet-section-title">Special Request <span className="optional">(optional)</span></h4>
            <textarea 
              className="note-input" 
              placeholder="E.g. extra spicy, no onions…" 
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          <div className="item-sheet-footer">
            <div className="qty-ctrl">
              <button 
                className="qty-btn" 
                onClick={() => setQty(prev => Math.max(1, prev - 1))}
              >
                <i className="ri-subtract-line"></i>
              </button>
              <span className="qty-val">{qty}</span>
              <button 
                className="qty-btn" 
                onClick={() => setQty(prev => prev + 1)}
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
            <button 
              className="btn-primary btn-add-cart" 
              onClick={() => onAddToCart(item, qty, note, selectedExtras)}
            >
              Add to Cart — <span>PKR {total.toLocaleString()}</span>
            </button>
          </div>
        </div>
        <div style={{ height: "10dvh", flexShrink: 0 }}></div>
      </div>
    </>
  );
}
