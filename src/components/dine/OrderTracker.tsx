"use client";

import { useEffect, useState } from "react";
import { CartItem } from "./CartScreen";

export interface OrderBatch {
  id: string;
  items: CartItem[];
  total: number;
  status: 'received' | 'kitchen' | 'on-its-way' | 'served';
  placedAt: number;
  servedAt?: number;
  billingRound: number;
}

interface OrderTrackerProps {
  orders: OrderBatch[];
  onBrowseMenu: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Order Received',
  kitchen: 'In Kitchen',
  'on-its-way': 'On Its Way',
  served: 'Served',
};

const STATUS_CLASS: Record<string, string> = {
  received: 'status-received',
  kitchen: 'status-kitchen',
  'on-its-way': 'status-on-its-way',
  served: 'status-served',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function OrderTracker({ orders, onBrowseMenu }: OrderTrackerProps) {
  const [, setTick] = useState(0);

  // Re-render every 30 seconds to update timers
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();
  const grandTotal = orders.reduce((sum, batch) => sum + batch.total, 0);

  return (
    <div className="tracker-scroll">
      <h2 className="section-title">Your Orders</h2>
      
      {orders.length === 0 ? (
        <div className="tracker-empty">
          <i className="ri-bowl-line"></i>
          <p>No orders placed yet.</p>
          <button className="btn-primary" onClick={onBrowseMenu}>Browse Menu</button>
        </div>
      ) : (
        <div className="tracker-list">
          {orders.map(batch => {
            const groups = {
              Starters: batch.items.filter(i => i.cat === 'starters'),
              'Main Course': batch.items.filter(i => i.cat !== 'starters' && i.cat !== 'desserts'),
              Desserts: batch.items.filter(i => i.cat === 'desserts')
            };

            return (
              <div key={batch.id} className="order-batch">
                <div className="order-batch-header">
                  <span className="order-batch-num">Order #{batch.id} &middot; {formatTime(batch.placedAt)}</span>
                  <span className={`order-status-badge ${STATUS_CLASS[batch.status]}`}>
                    {STATUS_LABELS[batch.status]}
                  </span>
                </div>
                <div className="order-batch-items">
                  {Object.entries(groups).map(([gName, gItems]) => {
                    if (gItems.length === 0) return null;
                    const maxPrep = Math.max(...gItems.map(i => i.prepTime || 15));
                    const finishTime = batch.placedAt + maxPrep * 60000;
                    const remainingMs = Math.max(0, finishTime - now);
                    const remainingMins = Math.ceil(remainingMs / 60000);
                    const timerText = batch.status === 'served' ? 'Served' : (remainingMins > 0 ? `${remainingMins}m remaining` : 'Almost ready');

                    return (
                      <div key={gName} className="order-batch-group" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--clr-border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <strong style={{ color: "var(--clr-gold)", fontSize: "0.85rem" }}>{gName}</strong>
                          <span style={{ color: "var(--clr-gold)", fontSize: "0.85rem", fontWeight: 600 }}>{timerText}</span>
                        </div>
                        {gItems.map((it, idx) => (
                          <div key={idx} className="order-batch-item">
                            <span>{it.qty}&times; {it.name}</span>
                            <span className="order-batch-item-price">PKR {(it.price * it.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ padding: ".2rem 0" }}>
            <div className="order-batch-header" style={{ border: "none", paddingBottom: 0 }}>
              <span className="order-batch-num">Running total: PKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
