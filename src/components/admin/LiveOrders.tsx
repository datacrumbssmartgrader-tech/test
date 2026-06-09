"use client";
import React, { useState } from "react";
import * as api from "@/lib/api";

export interface LiveOrder {
  id: string;
  session_id: string;
  table_number: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  total: number;
  status: "placed" | "kitchen" | "ready" | "served" | "cancelled";
  created_at: string;
}

interface LiveOrdersProps {
  orders: LiveOrder[];
  onUpdateStatus: (id: string, status: LiveOrder["status"]) => Promise<void>;
}

const STATUS_FLOW: LiveOrder["status"][] = ["placed", "kitchen", "ready", "served"];

const STATUS_LABEL: Record<LiveOrder["status"], string> = {
  placed: "Received",
  kitchen: "In Kitchen",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<LiveOrder["status"], string> = {
  placed: "badge-received",
  kitchen: "badge-kitchen",
  ready: "badge-ready",
  served: "badge-served",
  cancelled: "badge-cancelled",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextStatus(s: LiveOrder["status"]): LiveOrder["status"] | null {
  const idx = STATUS_FLOW.indexOf(s);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

export default function LiveOrders({ orders, onUpdateStatus }: LiveOrdersProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeCount = orders.filter(
    (o) => o.status === "placed" || o.status === "kitchen" || o.status === "ready"
  ).length;

  const handleAdvance = async (id: string, status: LiveOrder["status"]) => {
    const next = nextStatus(status);
    if (!next) return;
    setLoadingId(id);
    try {
      await onUpdateStatus(id, next);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this order?")) return;
    setLoadingId(id);
    try {
      await onUpdateStatus(id, "cancelled");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h1 className="section-title">Live Orders</h1>
          <p className="section-sub" id="orders-sub">
            {activeCount > 0
              ? `${activeCount} active order${activeCount !== 1 ? "s" : ""} across tables`
              : "No active orders right now"}
          </p>
        </div>
      </div>

      <div className="orders-grid mt-4">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <i className="ri-restaurant-line"></i>
            <p>No live orders — waiting for stream</p>
          </div>
        ) : (
          orders.map((order) => {
            const next = nextStatus(order.status);
            const isLoading = loadingId === order.id;
            const canAct = order.status !== "served" && order.status !== "cancelled";

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-head">
                  <div className="order-table-badge">{order.table_number || "—"}</div>
                  <div className="order-id">#{String(order.id || "").slice(0, 8)} · {order.created_at ? formatTime(order.created_at) : ""}</div>
                  <div className={`badge ${STATUS_BADGE[order.status] || "badge-received"}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="order-item-qty">{it.quantity}×</div>
                        <div className="order-item-name">
                          {it.name}
                          {it.notes && (
                            <span style={{ color: "var(--clr-muted)", fontSize: "0.75rem", marginLeft: "0.3rem" }}>
                              ({it.notes})
                            </span>
                          )}
                        </div>
                        <div className="order-item-price">PKR {(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <div className="order-total-label">Total</div>
                    <div className="order-total-amount">PKR {order.total.toLocaleString()}</div>
                  </div>
                </div>

                {canAct && (
                  <div className="order-card-foot">
                    <select
                      className="order-status-select filter-select"
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as LiveOrder["status"])}
                      disabled={isLoading}
                      style={{ width: "100%", padding: "8px", fontSize: "0.85rem", marginTop: "12px", border: "1px solid var(--clr-border)", borderRadius: "var(--radius-sm)", backgroundColor: "var(--clr-surface)" }}
                    >
                      <option value="placed">Received</option>
                      <option value="kitchen">In Kitchen</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
