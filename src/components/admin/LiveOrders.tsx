"use client";
import React, { useState } from "react";
import * as api from "@/lib/api";

export interface LiveOrder {
  id: string;
  session_id: string;
  table_number: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string; prep_time?: number }>;
  total: number;
  status: "received" | "kitchen" | "ready" | "served" | "cancelled";
  created_at: string;
  billing_round: number;
}

interface LiveOrdersProps {
  orders: LiveOrder[];
  onUpdateStatus: (id: string, status: LiveOrder["status"]) => Promise<void>;
}

const STATUS_FLOW: LiveOrder["status"][] = ["received", "kitchen", "ready", "served"];

const STATUS_LABEL: Record<LiveOrder["status"], string> = {
  received:  "Received",
  kitchen:   "In Kitchen",
  ready:     "Ready",
  served:    "Served",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<LiveOrder["status"], string> = {
  received:  "badge-received",
  kitchen:   "badge-kitchen",
  ready:     "badge-ready",
  served:    "badge-served",
  cancelled: "badge-cancelled",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function elapsed(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function nextStatus(s: LiveOrder["status"]): LiveOrder["status"] | null {
  const idx = STATUS_FLOW.indexOf(s);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

const ADVANCE_LABEL: Partial<Record<LiveOrder["status"], string>> = {
  received: "→ Kitchen",
  kitchen:  "→ Ready",
  ready:    "→ Served",
};

export default function LiveOrders({ orders, onUpdateStatus }: LiveOrdersProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"live" | "all">("live");

  const activeCount = orders.filter(
    (o) => o.status === "received" || o.status === "kitchen" || o.status === "ready"
  ).length;

  const displayed = filter === "live"
    ? orders.filter((o) => o.status !== "served" && o.status !== "cancelled")
    : orders;

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
        <div className="section-actions">
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "live" | "all")}
          >
            <option value="live">Live Orders</option>
            <option value="all">All Orders</option>
          </select>
        </div>
      </div>

      <div className="orders-grid mt-4">
        {displayed.length === 0 ? (
          <div className="orders-empty">
            <i className="ri-restaurant-line"></i>
            <p>{filter === "live" ? "No active orders right now" : "No orders yet"}</p>
          </div>
        ) : (
          displayed.map((order, idx) => {
            const next = nextStatus(order.status);
            const isLoading = loadingId === order.id;
            const canAct = order.status !== "served" && order.status !== "cancelled";

            const orderId = `#ORD-${String(idx + 1).padStart(3, "0")}`;
            const isActive = order.status === "received" || order.status === "kitchen" || order.status === "ready";
            const maxPrep = order.items.length > 0
              ? Math.max(...order.items.map((i) => i.prep_time || 15))
              : 15;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-head">
                  <div className="order-table-badge">{order.table_number || "—"}</div>
                  <div className="order-id flex-1">
                    {orderId}
                  </div>
                  <div className="order-time">
                    {order.created_at
                      ? order.status === "cancelled"
                        ? timeAgo(order.created_at)
                        : `${timeAgo(order.created_at)} · ⏱ ${maxPrep}m`
                      : ""}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items">
                    {order.items.map((it, i) => (
                      <React.Fragment key={i}>
                        <div className="order-item-row">
                          <div className="order-item-qty">{it.quantity}×</div>
                          <div className="order-item-name">{it.name}</div>
                          <div className="order-item-price">PKR {(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()}</div>
                        </div>
                        {it.notes && (
                          <div className="order-item-extras">+{it.notes}</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="order-total">
                    <div className="order-total-label">Total</div>
                    <div className="order-total-amount">PKR {order.total.toLocaleString()}</div>
                  </div>
                </div>

                <div className="order-card-foot">
                  <span className={`badge ${STATUS_BADGE[order.status] || "badge-received"}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                  {canAct && (
                    <div className="order-status-btns">
                      {next && (
                        <button
                          className="btn-status btn-status-next"
                          onClick={() => handleAdvance(order.id, order.status)}
                          disabled={isLoading}
                        >
                          {isLoading ? "…" : ADVANCE_LABEL[order.status]}
                        </button>
                      )}
                      <button
                        className="btn-status btn-status-cancel"
                        onClick={() => handleCancel(order.id)}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
