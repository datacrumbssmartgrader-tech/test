"use client";
import React, { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Alert } from "@/lib/api";

interface AlertsPanelProps {
  onBadgeChange: (count: number) => void;
  refreshTrigger?: number;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const TYPE_LABELS: Record<string, string> = {
  waiter_call: "Waiter Call",
  complaint:   "Complaint",
  bill:        "Bill Request",
  waiter:      "Waiter Call",
};

interface LocalAlert extends Alert {
  _resolved?: boolean; // locally marked resolved — stays visible until Dismiss All
}

export default function AlertsPanel({ onBadgeChange, refreshTrigger }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadAlerts = async () => {
    const res = await api.fetchAdminAlerts();
    const data = res.data as any;
    const list: Alert[] = Array.isArray(data) ? data : (data?.alerts ?? data?.items ?? []);
    const normalized = list.map((a: any) => ({ ...a, id: a.id || a.alert_id }));
    const active = normalized.filter((a: any) => a.status !== 'resolved' && !a.resolved);

    setAlerts((prev) => {
      // Preserve locally-resolved cards — they stay visible until "Clear Resolved" is clicked
      const locallyResolved = prev.filter((a) => a._resolved);
      const newActiveIds = new Set(active.map((a: any) => a.id));
      const freshActive = active.map((a: any) => ({ ...a, _resolved: false }));
      const preservedResolved = locallyResolved.filter((a) => !newActiveIds.has(a.id));
      return [...freshActive, ...preservedResolved];
    });

    onBadgeChange(active.length);
  };

  useEffect(() => {
    loadAlerts().finally(() => setIsLoading(false));
  }, [refreshTrigger]);

  // Resolve: mark locally as done, persist to DB, but keep card visible
  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.resolveAlert(id);
      let updatedCount = 0;
      setAlerts((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, _resolved: true } : a));
        updatedCount = next.filter((a) => !a._resolved).length;
        return next;
      });
      
      // Call onBadgeChange outside the state updater to avoid React render warnings
      setTimeout(() => onBadgeChange(updatedCount), 0);
    } finally {
      setResolvingId(null);
    }
  };

  // Clear Resolved: remove only faded (already resolved) cards from view
  const handleDismissAll = () => {
    setAlerts((prev) => prev.filter((a) => !a._resolved));
  };

  const pendingCount = alerts.filter((a) => !a._resolved).length;

  return (
    <section>
      <div className="section-header">
        <div>
          <h1 className="section-title">Waiter Alerts</h1>
          <p className="section-sub" id="alerts-sub">
            {pendingCount > 0
              ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""} from tables`
              : alerts.length > 0
              ? "All alerts resolved — dismiss to clear"
              : "No active alerts"}
          </p>
        </div>
        {alerts.some((a) => a._resolved) && (
          <div className="section-actions">
            <button className="btn-ghost" onClick={handleDismissAll}>
              <i className="ri-delete-bin-line"></i> Clear Resolved
            </button>
          </div>
        )}
      </div>

      <div className="alerts-list" id="alerts-list">
        {isLoading ? (
          <div style={{ color: "var(--clr-muted)", padding: "2rem", textAlign: "center" }}>
            Loading alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ color: "var(--clr-muted)", padding: "3rem", textAlign: "center" }}>
            <i className="ri-check-double-line" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}></i>
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card ${alert._resolved ? "alert-card-resolved" : ""}`}
              style={alert._resolved ? { opacity: 0.45, pointerEvents: "none", transition: "opacity 0.4s ease" } : { transition: "opacity 0.4s ease" }}
            >
              <div className="alert-card-head">
                <span className="alert-table badge badge-received">{(alert as any).table_label || alert.table_id}</span>
                <span className="alert-type badge badge-kitchen">
                  {TYPE_LABELS[alert.type] ?? alert.type}
                </span>
                <span className="alert-time">{timeAgo(alert.created_at)}</span>
                {alert._resolved && (
                  <span className="badge badge-served" style={{ marginLeft: "auto" }}>
                    <i className="ri-check-line"></i> Resolved
                  </span>
                )}
              </div>
              {alert.message && (
                <div
                  className="alert-msg"
                  style={alert._resolved ? { textDecoration: "line-through" } : undefined}
                >
                  {alert.message}
                </div>
              )}
              {!alert._resolved && (
                <div className="alert-actions">
                  <button
                    className="btn-primary"
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolvingId === alert.id}
                  >
                    {resolvingId === alert.id
                      ? "Resolving…"
                      : <><i className="ri-check-line"></i> Resolve</>}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
