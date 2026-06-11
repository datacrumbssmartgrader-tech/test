"use client";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Table, SessionPayment } from "@/lib/api";
import type { LiveOrder } from "./LiveOrders";

function formatTimeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

function sessionDuration(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

interface TablesGridProps {
  orders?: LiveOrder[];
  refreshTick?: number;
}

export default function TablesGrid({ orders = [], refreshTick = 0 }: TablesGridProps) {
  const [tables, setTables]           = useState<Table[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [billTable, setBillTable]     = useState<Table | null>(null);
  const [qrTable,   setQrTable]       = useState<Table | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [qrLoading, setQrLoading]     = useState(false);
  const [qrBust, setQrBust]           = useState(0);
  const [billPayments, setBillPayments] = useState<SessionPayment[]>([]);

  useEffect(() => {
    if (!billTable?.active_session_id) { setBillPayments([]); return; }
    api.getSessionPayments(billTable.active_session_id).then((res) => {
      setBillPayments(res.status === 200 && res.data ? res.data : []);
    });
  }, [billTable?.active_session_id]);

  useEffect(() => {
    api.fetchAdminTables().then((res) => {
      const data = res.data as any;
      const list: Table[] = Array.isArray(data) ? data : (data?.tables ?? data?.items ?? []);
      setTables(list);
    }).finally(() => setIsLoading(false));
  }, [refreshTick]);

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      const res = await api.updateAdminTableStatus(id, status);
      if (res.status === 200) {
        setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReset = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await api.resetAdminTable(id);
      if (res.status === 200) {
        setTables((prev) => prev.map((t) => t.id === id ? { ...t, status: "empty", active_session_id: undefined } : t));
        setBillTable(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRegenerateQR = async (tableId: string) => {
    if (!window.confirm("Regenerating the QR code will invalidate the current one. Customers with the old QR won't be able to scan in. Continue?")) return;
    setQrLoading(true);
    try {
      const res = await api.regenerateAdminTableQR(tableId);
      if (res.status === 200) {
        // Update qr_token in local state
        const newToken = (res.data as any).qr_token;
        setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, qr_token: newToken } : t));
        // Also update qrTable so modal reflects new token
        setQrTable((prev) => prev?.id === tableId ? { ...prev, qr_token: newToken } : prev);
        // Force <img> reload by bumping bust key
        setQrBust((n) => n + 1);
      }
    } finally {
      setQrLoading(false);
    }
  };

  const tableOrders = (tableId: string) =>
    orders.filter((o) => o.table_number === tableId && o.status !== "cancelled");

  const tableTotal = (tableId: string) =>
    tableOrders(tableId).reduce((sum, o) => sum + o.total, 0);

  const firstOrderTime = (tableId: string) => {
    const os = tableOrders(tableId);
    if (!os.length) return null;
    return os.reduce((earliest, o) =>
      new Date(o.created_at) < new Date(earliest.created_at) ? o : earliest
    ).created_at;
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h1 className="section-title">Tables</h1>
          <p className="section-sub" id="tables-sub">
            {tables.length} tables — manage status and view running bills
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--clr-muted)", padding: "2rem", textAlign: "center" }}>
          Loading tables…
        </div>
      ) : (
        <div className="tables-grid" id="tables-grid">
          {tables.length === 0 ? (
            <div style={{ color: "var(--clr-muted)", padding: "2rem" }}>No tables found</div>
          ) : tables.map((t) => {
            const isActive   = t.status === "active";
            const isDisabled = t.status === "disabled";
            const orderCount = tableOrders(t.label).length;
            const total      = tableTotal(t.label);
            const startTime  = firstOrderTime(t.label);
            const isPaid     = isActive && total > 0 && (t.session_total_paid || 0) >= total;

            return (
              <div
                key={t.id}
                className={`table-card ${isActive ? "active-table" : ""} ${isDisabled ? "disabled-table" : ""}`}
              >
                {t.alert_active && <div className="table-alert-dot"></div>}
                {/* ── Header row: table ID + QR button ───────── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
                  <div className="table-id">{t.id}</div>
                  <button
                    title="View QR Code"
                    onClick={() => { setQrTable(t); setQrBust((n) => n + 1); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: "6px",
                      color: "var(--clr-muted)",
                      fontSize: "1rem",
                      lineHeight: 1,
                      transition: "color var(--trans)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--clr-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--clr-muted)")}
                  >
                    <i className="ri-qr-code-line"></i>
                  </button>
                </div>

                <div className="table-status-row">
                  <span className={`badge badge-table-${t.status}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                  {isPaid && <span className="badge badge-paid">Paid</span>}
                </div>

                <div className="table-meta">
                  {isActive && startTime ? (
                    <>
                      <div className="table-meta-row">
                        <i className="ri-time-line"></i>
                        {sessionDuration(startTime)}
                      </div>
                      <div className="table-meta-row">
                        <i className="ri-receipt-line"></i>
                        {orderCount} order{orderCount !== 1 ? "s" : ""} · PKR {total.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <div className="table-meta-row">—</div>
                  )}
                </div>

                <div className="table-card-actions">
                  {isActive && (
                    <button
                      data-action="view-bill"
                      onClick={() => setBillTable(t)}
                      disabled={processingId === t.id}
                    >
                      View Bill
                    </button>
                  )}
                  {isActive && (
                    <button
                      data-action="reset-table"
                      className="danger"
                      onClick={() => handleReset(t.id)}
                      disabled={processingId === t.id}
                    >
                      Reset
                    </button>
                  )}
                  {!isDisabled && !isActive && (
                    <button
                      data-action="disable-table"
                      className="danger"
                      onClick={() => updateStatus(t.id, "disabled")}
                      disabled={processingId === t.id}
                    >
                      Disable
                    </button>
                  )}
                  {isDisabled && (
                    <button
                      data-action="enable-table"
                      onClick={() => updateStatus(t.id, "empty")}
                      disabled={processingId === t.id}
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ QR Code Modal ═══════════════════════════════════════════ */}
      {qrTable && (
        <div
          className="modal-backdrop"
          style={{ display: "flex" }}
          onClick={() => setQrTable(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: "360px", width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                <i className="ri-qr-code-line" style={{ marginRight: "8px" }}></i>
                {qrTable.id} — QR Code
              </h2>
              <button className="modal-close" onClick={() => setQrTable(null)}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: "center" }}>
              <p style={{ fontSize: ".82rem", color: "var(--clr-muted)", marginBottom: "1.2rem" }}>
                Customers scan this code to start a session at this table.
              </p>

              {/* QR image — fetched as PNG from API */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                border: "2px solid var(--clr-border-l)",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "1rem",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={qrBust}
                  src={`${api.getTableQRImageUrl(qrTable.id)}?v=${qrBust}`}
                  alt={`QR code for ${qrTable.id}`}
                  width={240}
                  height={240}
                  style={{ display: "block", borderRadius: "4px" }}
                />
              </div>

              <p style={{ fontSize: ".75rem", color: "var(--clr-muted)", fontFamily: "monospace", marginBottom: "0" }}>
                Token: {qrTable.qr_token?.slice(0, 16)}…
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <button
                className="btn-danger"
                onClick={() => handleRegenerateQR(qrTable.id)}
                disabled={qrLoading}
                title="Invalidates old QR — active sessions are unaffected"
              >
                {qrLoading
                  ? <><i className="ri-loader-4-line"></i> Regenerating…</>
                  : <><i className="ri-refresh-line"></i> Regenerate QR</>}
              </button>
              <button className="btn-ghost" onClick={() => setQrTable(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Running Bill Modal ═══════════════════════════════════════ */}
      {billTable && (
        <div
          id="modal-table-bill"
          className="modal-backdrop"
          style={{ display: "flex" }}
          onClick={() => setBillTable(null)}
        >
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="table-bill-title">{billTable.id} — Running Bill</h2>
              <button className="modal-close" onClick={() => setBillTable(null)}>
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="modal-body" id="table-bill-body">
              {(() => {
                const billOrders = tableOrders(billTable.label);
                const paidOrderIds = new Set(billPayments.flatMap((p) => p.order_ids));
                const grandTotal = tableTotal(billTable.label);
                const unpaid = grandTotal - (billTable.session_total_paid || 0);

                if (billOrders.length === 0) return (
                  <div style={{ color: "var(--clr-muted)", textAlign: "center", padding: "2rem" }}>
                    No active orders for this table
                  </div>
                );

                return (
                  <>
                    {billOrders.map((o, idx) => (
                      <div key={o.id} className="bill-batch">
                        <div className="bill-batch-head">
                          <span>Order #{idx + 1} · {formatTimeAgo(o.created_at)}</span>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {paidOrderIds.has(o.id) && <span className="badge badge-paid">Paid</span>}
                            <span className={`badge badge-${o.status}`}>{o.status}</span>
                          </div>
                        </div>
                        {o.items.map((it, i) => (
                          <div key={i} className="bill-item-row">
                            <span>{it.quantity}× {it.name}</span>
                            <span>PKR {(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="bill-grand-total">
                      <span>Grand Total</span>
                      <span>PKR {grandTotal.toLocaleString()}</span>
                    </div>
                    {(billTable.session_total_paid || 0) > 0 && unpaid > 0 && (
                      <div className="bill-grand-total" style={{ opacity: 0.7 }}>
                        <span>Paid so far</span>
                        <span>PKR {(billTable.session_total_paid || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="modal-footer">
              {(() => {
                const grandTotal = tableTotal(billTable.label);
                const unpaid = grandTotal - (billTable.session_total_paid || 0);
                return (
                  <>
                    <button className="btn-ghost" onClick={() => setBillTable(null)}>Close</button>
                    {unpaid <= 0 && grandTotal > 0 ? (
                      <>
                        <button className="btn-primary btn-paid-done" disabled>
                          <i className="ri-check-line"></i> Paid
                        </button>
                        <button id="btn-reset-table" className="btn-danger" onClick={() => handleReset(billTable.id)}>
                          Reset Table
                        </button>
                      </>
                    ) : unpaid > 0 ? (
                      <button
                        id="btn-mark-paid"
                        className="btn-primary"
                        onClick={async () => {
                          if (!billTable.active_session_id) return;
                          try {
                            await api.recordPayment(billTable.active_session_id, unpaid, 'cash');
                            const newPaid = (billTable.session_total_paid || 0) + unpaid;
                            setTables((prev) => prev.map((tb) => tb.id === billTable.id ? { ...tb, session_total_paid: newPaid } : tb));
                            setBillTable((prev) => prev ? { ...prev, session_total_paid: newPaid } : null);
                          } catch {
                            // payment failed — leave state unchanged so admin can retry
                          }
                        }}
                      >
                        <i className="ri-secure-payment-line"></i> Mark as Paid
                        {(billTable.session_total_paid || 0) > 0 && ` (PKR ${unpaid.toLocaleString()})`}
                      </button>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
