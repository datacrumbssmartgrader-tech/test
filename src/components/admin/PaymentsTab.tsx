"use client";
import React, { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Payment } from "@/lib/api";
import type { LiveOrder } from "./LiveOrders";

interface PaymentsTabProps {
  orders?: LiveOrder[];
  refreshTick?: number;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function filterByDate(payments: Payment[], from: string, to: string) {
  return payments.filter((p) => {
    const timeVal = p.created_at || (p as any).paid_at || new Date().toISOString();
    const d = timeVal.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function filterOrdersByDate(orders: LiveOrder[], from: string, to: string) {
  return orders.filter((o) => {
    if (o.status === "cancelled") return false;
    const timeVal = o.created_at || new Date().toISOString();
    const d = timeVal.slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

// Simple bar chart logic ported from ref_admin.ts
function PayGraphChart({ orders, dateFrom, dateTo }: { orders: LiveOrder[], dateFrom: string, dateTo: string }) {
  const isOneDay = (!dateFrom && !dateTo) || (dateFrom === dateTo);
  
  let labels: string[] = [];
  let values: number[] = [];

  if (isOneDay) {
    values = Array(24).fill(0);
    orders.forEach(o => { values[new Date(o.created_at).getHours()] += Number(o.total) || 0; });
    labels = Array.from({ length: 24 }, (_, i) =>
      i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
    );
  } else {
    const dayMap = new Map<string, number>();
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dayMap.set(k, (dayMap.get(k) ?? 0) + (Number(o.total) || 0));
    });
    const sortedKeys = [...dayMap.keys()].sort();
    labels = sortedKeys.map(k => { const d = new Date(k + 'T12:00:00'); return `${d.getDate()}/${d.getMonth()+1}`; });
    values = sortedKeys.map(k => dayMap.get(k)!);
  }

  const barCount = values.length || 1;
  const maxVal = Math.max(...values, 1) || 1;
  const W = 800, H = 220, padL = 68, padR = 20, padT = 20, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const gap = chartW / barCount;
  const barW = Math.max(3, gap * 0.65);
  const labelEvery = isOneDay ? 4 : barCount > 14 ? 2 : 1;

  const yLines = [0.25, 0.5, 0.75, 1.0].map(f => {
    const y = padT + chartH * (1 - f);
    const lblVal = maxVal * f;
    const lbl = lblVal >= 1000 ? `${(lblVal / 1000).toFixed(1)}k` : String(Math.round(lblVal));
    return (
      <React.Fragment key={`line-${f}`}>
        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="rgba(107,26,42,.08)" strokeWidth="1"/>
        <text x={padL-8} y={y+4} textAnchor="end" fontFamily="Poppins,sans-serif" fontSize="9" fill="#8A7265">{lbl}</text>
      </React.Fragment>
    );
  });

  return (
    <div className="pay-chart-wrap" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <div className="pay-chart-title" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
        {isOneDay ? 'Revenue by Hour' : 'Revenue by Day'}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'var(--clr-surface)', borderRadius: '12px', padding: '1rem' }}>
        {yLines}
        <line x1={padL} y1={padT+chartH} x2={W-padR} y2={padT+chartH} stroke="rgba(107,26,42,.18)" strokeWidth="1.5"/>
        {values.map((v, i) => {
          const cx = padL + i * gap + gap / 2;
          const bx = cx - barW / 2;
          const barH = v > 0 ? Math.max(2, (v / maxVal) * chartH) : 2;
          const by = padT + chartH - barH;
          const isMax = v === maxVal && v > 0;
          return (
            <React.Fragment key={`bar-${i}`}>
              <rect x={bx} y={by} width={barW} height={barH} rx="2.5" fill={isMax ? '#C9973A' : '#6B1A2A'} opacity={v > 0 ? 1 : 0.1} />
              {v > 0 && barH > 22 && (
                <text x={cx} y={by-5} textAnchor="middle" fontFamily="Poppins,sans-serif" fontSize="8" fill={isMax ? '#a57a2a' : '#6B1A2A'} fontWeight="600">
                  {v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={padT+chartH+16} textAnchor="middle" fontFamily="Poppins,sans-serif" fontSize={barCount > 20 ? 7 : 9} fill="#8A7265">
                  {labels[i]}
                </text>
              )}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

export default function PaymentsTab({ orders = [], refreshTick = 0 }: PaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.fetchAdminPayments().then((res) => {
      const data = res.data as any;
      const list: Payment[] = Array.isArray(data) ? data : (data?.payments ?? data?.items ?? []);
      setPayments(list.map((p: any) => ({
        ...p,
        id: p.id || p.payment_id,
        created_at: p.created_at || p.paid_at || new Date().toISOString(),
        amount: Number(p.amount),
        status: p.status === 'confirmed' ? 'received' : p.status,
      })));
    }).finally(() => setIsLoading(false));
  }, [refreshTick]);

  const displayedPayments = filterByDate(payments, dateFrom, dateTo);
  const received = displayedPayments.filter((p) => p.status === "received");
  const totalRevenue = received.reduce((s, p) => s + p.amount, 0);
  const pendingCount = displayedPayments.filter((p) => p.status === "pending").length;

  const displayedOrders = filterOrdersByDate(orders, dateFrom, dateTo);

  // Items Sold logic
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  displayedOrders.forEach(o => {
    o.items.forEach(it => {
      const e = itemMap.get(it.name);
      if (e) {
        e.qty += it.quantity;
        e.revenue += it.price * it.quantity;
      } else {
        itemMap.set(it.name, { name: it.name, qty: it.quantity, revenue: it.price * it.quantity });
      }
    });
  });
  const topItems = [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 3); // Restrict Items Sold to 3
  
  // Payments Records limit logic
  const newestPayments = [...displayedPayments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3); // Restrict Payments to 3 newest

  const handleStatusChange = async (id: string, status: Payment["status"]) => {
    setUpdatingId(id);
    try {
      const res = await api.updatePaymentStatus(id, status);
      if (res.status === 200) {
        setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = async () => {
    await api.exportPayments();
  };

  return (
    <section id="section-payments">
      <div className="section-header">
        <div>
          <h1 className="section-title">Payments</h1>
          <p className="section-sub" id="payments-sub">Payment overview</p>
        </div>
        {/* Date Range Selector Inline Layout Fix */}
        <div className="section-actions flex flex-row items-center gap-2 flex-nowrap" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
          <input type="date" className="filter-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="filter-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Stats */}
      <div className="payments-stats" id="payments-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Revenue", value: `PKR ${totalRevenue.toLocaleString()}`, icon: "ri-money-dollar-circle-line", color: "var(--clr-gold)" },
          { label: "Payments Received", value: received.length, icon: "ri-checkbox-circle-line", color: "#48bb78" },
          { label: "Pending", value: pendingCount, icon: "ri-time-line", color: "#ed8936" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--clr-surface)", borderRadius: "12px", padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <i className={stat.icon} style={{ fontSize: "1.8rem", color: stat.color }}></i>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)", marginBottom: "0.2rem" }}>{stat.label}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <PayGraphChart orders={displayedOrders} dateFrom={dateFrom} dateTo={dateTo} />

      <div className="section-header" style={{ marginTop: "2rem", padding: "0" }}>
        <div>
          <h1 className="section-title">Items Sold</h1>
          <p className="section-sub">Top 3 sold items this period</p>
        </div>
      </div>

      <div className="menu-table-wrap">
        <table className="menu-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "3rem" }}>#</th>
              <th>Item</th>
              <th className="text-right">Qty Sold</th>
              <th className="text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topItems.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-muted)" }}>No items sold in this period</td></tr>
            ) : topItems.map((item, i) => (
              <tr key={item.name}>
                <td className="text-center"><span className={`sell-rank sell-rank-${i + 1 <= 3 ? i + 1 : 'n'}`}>{i + 1}</span></td>
                <td style={{ fontFamily: "var(--ff-ui)", fontSize: ".85rem" }}>{item.name}</td>
                <td className="text-right" style={{ fontFamily: "var(--ff-ui)", fontWeight: 700 }}>{item.qty}</td>
                <td className="text-right" style={{ fontFamily: "var(--ff-ui)", fontWeight: 700, color: "var(--clr-primary)" }}>PKR {item.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: "2rem", padding: "0" }}>
        <div>
          <h1 className="section-title">Payment Records</h1>
          <p className="section-sub">3 Newest payments received</p>
        </div>
        <div className="section-actions">
          <button className="btn-primary" onClick={handleExport}>
            <i className="ri-file-excel-line"></i> Export
          </button>
        </div>
      </div>

      <div className="menu-table-wrap">
        <table className="menu-table">
          <thead>
            <tr>
              {/* Order column replaced Session */}
              <th>Order</th>
              <th>Date</th>
              <th>Time</th>
              <th className="text-right">Amount (PKR)</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody id="payments-tbody">
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-muted)" }}>Loading…</td></tr>
            ) : newestPayments.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-muted)" }}>No payments found</td></tr>
            ) : newestPayments.map((p) => {
              const { date, time } = formatDateTime(p.created_at);
              const isUpdating = updatingId === p.id;
              return (
                <tr key={p.id}>
                  {/* Order column showing truncated session id to simulate order ref */}
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>#{p.session_id.slice(0, 8)}</td>
                  <td>{date}</td>
                  <td>{time}</td>
                  <td className="text-right">PKR {p.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.status === "received" ? "badge-served" : p.status === "cancelled" ? "badge-cancelled" : "badge-received"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <select
                      className="filter-select"
                      value={p.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(p.id, e.target.value as Payment["status"])}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem" }}
                    >
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
