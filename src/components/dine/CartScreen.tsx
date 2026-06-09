"use client";

import { useState } from "react";

export interface CartItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  qty: number;
  note: string;
  img: string;
  cat: string;
  prepTime: number;
}

interface CartScreenProps {
  cart: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onBrowseMenu: () => void;
  onPlaceOrder: () => void;
}

export default function CartScreen({ cart, onUpdateQty, onBrowseMenu, onPlaceOrder }: CartScreenProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirmOrder = () => {
    setConfirmOpen(false);
    onPlaceOrder();
  };

  return (
    <>
      <div className="cart-scroll">
        <h2 className="section-title">Your Cart</h2>
        
        {cart.length === 0 ? (
          <div className="cart-screen-empty">
            <i className="ri-shopping-bag-3-line"></i>
            <p>Your cart is empty</p>
            <button className="btn-primary" onClick={onBrowseMenu}>Browse Menu</button>
          </div>
        ) : (
          <div>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cart-item-img" src={item.img} alt={item.name} />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    {item.note && <div className="cart-item-note">{item.note}</div>}
                    <div className="cart-item-controls">
                      <button className="cart-qty-btn cart-minus" onClick={() => onUpdateQty(item.id, -1)}>
                        <i className="ri-subtract-line"></i>
                      </button>
                      <span className="cart-qty-val">{item.qty}</span>
                      <button className="cart-qty-btn cart-plus" onClick={() => onUpdateQty(item.id, 1)}>
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                  </div>
                  <span className="cart-item-price">PKR {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="cart-divider"></div>
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <p className="cart-note"><i className="ri-information-line"></i> Payment collected by staff at your table.</p>
            <button className="btn-primary btn-full" onClick={handlePlaceOrderClick}>
              <i className="ri-check-double-line"></i> Place Order
            </button>
          </div>
        )}
      </div>

      {/* Confirm Order Sheet */}
      <div className={`sheet-backdrop ${confirmOpen ? "open" : ""}`} onClick={() => setConfirmOpen(false)}></div>
      <div className={`bottom-sheet confirm-sheet ${confirmOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Confirm order">
        <div className="sheet-handle"></div>
        <div className="confirm-body">
          <div className="confirm-icon"><i className="ri-shield-check-line"></i></div>
          <h3 className="confirm-title">Confirm Your Order?</h3>
          <p className="confirm-sub">Once confirmed, your order goes straight to the kitchen and cannot be changed.</p>
          <div className="confirm-summary">
            {cart.map(item => (
              <div key={item.id} className="confirm-row">
                <span>{item.qty}&times; {item.name}</span>
                <span>PKR {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div className="confirm-row" style={{ fontWeight: 700, borderTop: "1px solid var(--clr-border)", paddingTop: "0.4rem", marginTop: "0.2rem" }}>
              <span>Total</span><span>PKR {subtotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="confirm-actions">
            <button className="btn-ghost btn-full" onClick={() => setConfirmOpen(false)}>Go Back</button>
            <button className="btn-primary btn-full" onClick={handleConfirmOrder}>
              <i className="ri-check-line"></i> Yes, Place Order
            </button>
          </div>
        </div>
        <div style={{ height: "10dvh", flexShrink: 0 }}></div>
      </div>
    </>
  );
}
