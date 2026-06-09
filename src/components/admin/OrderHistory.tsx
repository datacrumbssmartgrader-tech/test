"use client";
import React, { useState } from "react";
import * as api from "@/lib/api";
import type { LiveOrder } from "./LiveOrders";

interface OrderHistoryProps {
  orders: LiveOrder[];
}

const STATUS_BADGE: Record<string, string> = {
  placed: "badge-received",
  kitchen: "badge-kitchen",
  ready: "badge-ready",
  served: "badge-served",
  cancelled: "badge-cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  placed: "Received",
  kitchen: "In Kitchen",
  ready: "Ready",
  served: "Served",
  cancelled: "Cancelled",
};

export default function OrderHistory({ orders }: OrderHistoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");

  const uniqueTables = Array.from(new Set(orders.map((o) => o.table_number))).sort();

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (tableFilter && o.table_number !== tableFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchId && !matchItem) return false;
    }
    return true;
  });

  const handleExport = () => api.exportOrders();

  return (
    <section className="section active">
      
      {/* 1. Header Title Block (Kept perfectly intact) */}
      <div className="pb-4 border-b border-[var(--clr-border-l)] mb-6">
        <h1 className="font-cinzel text-[1.4rem] font-semibold text-primary tracking-[.04em]">
          Order History
        </h1>
        <p className="text-[0.82rem] text-muted mt-[3px]" id="history-sub">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} shown
        </p>
      </div>

      {/* 2. Unified Controls Layout Container — Forces Horizontal Row alignment */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        alignItems: 'flex-end', 
        gap: '12px', 
        width: '100%',
        marginBottom: '24px'
      }}>
        
        {/* Search Bar Input */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '240px' }}>
          <input
            id="history-search"
            type="text"
            className="filter-input"
            style={{ height: '40px', width: '100%' }}
            placeholder="Search order or item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '150px' }}>
          <select
            id="history-table-filter"
            className="filter-select"
            style={{ height: '40px', width: '100%' }}
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="">All Tables</option>
            {uniqueTables.map((t) => (
              <option key={t} value={t}>Table {t}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '160px' }}>
          <select
            id="history-status-filter"
            className="filter-select"
            style={{ height: '40px', width: '100%' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="placed">Received</option>
            <option value="kitchen">In Kitchen</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Start Date Picker (Styled like your image) */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '150px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            Start Date
          </span>
          <input 
            type="date" 
            className="filter-input" 
            style={{ height: '40px', width: '100%' }}
            /* add state binders if you hook this to filter logic */
          />
        </div>

        {/* End Date Picker (Styled like your image) */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '150px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
            End Date
          </span>
          <input 
            type="date" 
            className="filter-input" 
            style={{ height: '40px', width: '100%' }}
            /* add state binders if you hook this to filter logic */
          />
        </div>

        {/* Excel Export Button aligned nicely at the end */}
        <button 
          className="btn-primary" 
          onClick={handleExport} 
          style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0 16px' }}
        >
          <i className="ri-file-excel-line"></i> Export
        </button>

      </div>

      <div className="menu-table-wrap">
        <table className="menu-table" id="history-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Table</th>
              <th>Time</th>
              <th>Items</th>
              <th className="text-right">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="history-tbody">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-muted)" }}>
                  No orders match your filters
                </td>
              </tr>
            ) : filtered.map((o) => (
              <tr key={o.id}>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>#{o.id.slice(0, 8)}</td>
                <td>{o.table_number || "—"}</td>
                <td>{new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </td>
                <td className="text-right">PKR {o.total.toLocaleString()}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[o.status] ?? "badge-received"}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
