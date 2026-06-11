"use client";

import { useState } from "react";
import type { CartItem } from "@/components/dine/CartScreen";
import type { MenuItem, Extra } from "@/lib/menuData";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [nextCartId, setNextCartId] = useState(1);

  const quickAdd = (item: MenuItem) => {
    const existing = cart.find((c) => c.menuId === item.id && c.note === "");
    if (existing) {
      setCart((prev) => prev.map((c) => c.id === existing.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart((prev) => [...prev, {
        id: String(nextCartId),
        menuId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        note: "",
        img: item.img,
        cat: item.cat,
        prepTime: item.prepTime || 15,
      }]);
      setNextCartId((prev) => prev + 1);
    }
  };

  const addToCart = (item: MenuItem, qty: number, note: string, selectedExtras: Extra[]) => {
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
    const unitPrice = item.price + extrasTotal;
    const extrasLabel = selectedExtras.map((e) => e.label).join(", ");
    const fullNote = [extrasLabel, note].filter(Boolean).join(" · ");

    const existing = cart.find((c) => c.menuId === item.id && c.note === fullNote);
    if (existing) {
      setCart((prev) => prev.map((c) => c.id === existing.id ? { ...c, qty: c.qty + qty } : c));
    } else {
      setCart((prev) => [...prev, {
        id: String(nextCartId),
        menuId: item.id,
        name: item.name,
        price: unitPrice,
        qty,
        note: fullNote,
        img: item.img,
        cat: item.cat,
        prepTime: item.prepTime || 15,
      }]);
      setNextCartId((prev) => prev + 1);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return { ...item, qty: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  return { cart, quickAdd, addToCart, updateQty, clearCart };
}
