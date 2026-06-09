"use client";
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/useAuth";
import { useAdminStream } from "@/lib/useSSE";
import * as api from "@/lib/api";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import LiveOrders from "@/components/admin/LiveOrders";
import type { LiveOrder } from "@/components/admin/LiveOrders";
import MenuManager from "@/components/admin/MenuManager";
import AlertsPanel from "@/components/admin/AlertsPanel";
import PaymentsTab from "@/components/admin/PaymentsTab";
import TablesGrid from "@/components/admin/TablesGrid";
import OrderHistory from "@/components/admin/OrderHistory";

// Minimal inline login screen based on existing CSS
function LoginScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    // Only '1234' works for now based on legacy logic
    if (pin.trim() === "1234") {
      login(pin);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="login-screen" style={{ zIndex: 100, position: "fixed", inset: 0, backgroundColor: "var(--clr-bg)" }}>
      <div className="login-bg"></div>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-en">ROOSTER&apos;S DEN</div>
          <div className="login-logo-ur">روایات</div>
        </div>
        <p className="login-subtitle">Admin Dashboard</p>
        <div style={{ marginTop: "2rem" }}>
          <label className="pin-label">Enter Staff PIN</label>
          <input
            type="password"
            className="pin-field"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••"
            maxLength={4}
            autoFocus
          />
          {error && <div className="login-error" style={{ color: "var(--clr-error)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Incorrect PIN. Please try again.</div>}
          <button className="login-btn btn-primary" onClick={handleLogin} style={{ width: "100%", marginTop: "1.5rem" }}>
            Access Dashboard <i className="ri-arrow-right-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

const SECTION_TITLES: Record<string, string> = {
  orders: "Live Orders",
  tables: "Tables",
  menu: "Menu Management",
  alerts: "Waiter Alerts",
  history: "Order History",
  payments: "Payments",
};

function AdminDashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global state enriched by SSE
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Initial fetch of active orders
  useEffect(() => {
    if (isAuthenticated) {
      api.fetchAdminOrders()
        .then((ordersRes) => {
          if (ordersRes.status === 200 && ordersRes.data) {
            setOrders(ordersRes.data);
          }
        })
        .catch(err => {
          console.error("Failed to fetch initial admin data", err);
        });
    }
  }, [isAuthenticated]);

  useAdminStream({
    onEvent: (event) => {
      if (event.type === "order:created") {
        const raw = event.data as any;
        const newOrder: LiveOrder = {
          id: raw.order_id || raw.id,
          session_id: raw.session_id,
          table_number: raw.table_number || raw.table_id || "—",
          items: raw.items || [],
          total: raw.total,
          status: raw.status,
          created_at: raw.placed_at || raw.created_at,
        };
        setOrders((prev) => [newOrder, ...prev]);
        showToast("New order received", "success");
      } else if (event.type === "order:status_changed") {
        const { id, status } = event.data;
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      } else if (event.type === "alert:created") {
        setAlertCount((prev) => prev + 1);
        showToast("New waiter alert received", "info");
      } else if (event.type === "payment:received") {
        showToast("New payment received", "success");
      }
    },
    onError: () => {},
  });

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateOrderStatus = async (id: string, status: LiveOrder["status"]) => {
    const res = await api.updateOrderStatus(id, status);
    if (res.status === 200) {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      showToast(`Order updated to ${status}`, "success");
    } else {
      showToast("Failed to update order", "error");
    }
  };

  if (isLoading) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const activeOrderCount = orders.filter((o) => ["placed", "kitchen", "ready"].includes(o.status)).length;

  return (
    <div id="dashboard" className="dashboard">
      <div id="sidebar-overlay" className={sidebarOpen ? "open visible" : ""} onClick={() => setSidebarOpen(false)} style={sidebarOpen ? { pointerEvents: "auto" } : { pointerEvents: "none" }} />

      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={(s) => { setActiveSection(s); setSidebarOpen(false); }}
        user={user}
        onLogout={logout}
        orderBadge={activeOrderCount}
        alertBadge={alertCount}
        sidebarOpen={sidebarOpen}
      />

      <div id="main" className="main">
        <AdminTopbar
          title={SECTION_TITLES[activeSection]}
          onMenuOpen={() => setSidebarOpen(true)}
          user={user}
        />

        <section id="section-orders" className={`section ${activeSection === "orders" ? "active" : ""}`} style={{ display: activeSection === "orders" ? "block" : "none" }}>
          {activeSection === "orders" && <LiveOrders orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
        </section>

        <section id="section-tables" className={`section ${activeSection === "tables" ? "active" : ""}`} style={{ display: activeSection === "tables" ? "block" : "none" }}>
          {activeSection === "tables" && <TablesGrid orders={orders} />}
        </section>

        <section id="section-menu" className={`section ${activeSection === "menu" ? "active" : ""}`} style={{ display: activeSection === "menu" ? "block" : "none" }}>
          {activeSection === "menu" && <MenuManager />}
        </section>

        <section id="section-alerts" className={`section ${activeSection === "alerts" ? "active" : ""}`} style={{ display: activeSection === "alerts" ? "block" : "none" }}>
          {activeSection === "alerts" && <AlertsPanel onBadgeChange={setAlertCount} refreshTrigger={alertCount} />}
        </section>

        <section id="section-history" className={`section ${activeSection === "history" ? "active" : ""}`} style={{ display: activeSection === "history" ? "block" : "none" }}>
          {activeSection === "history" && <OrderHistory orders={orders} />}
        </section>

        <section id="section-payments" className={`section ${activeSection === "payments" ? "active" : ""}`} style={{ display: activeSection === "payments" ? "block" : "none" }}>
          {activeSection === "payments" && <PaymentsTab orders={orders} />}
        </section>
      </div>

      {toast && (
        <div id="toastStack" className="toast-stack">
          <div className={`toast-card toast-in`}>
            <i className={toast.type === "success" ? "ri-checkbox-circle-fill toast-icon toast-success" : toast.type === "error" ? "ri-error-warning-fill toast-icon toast-error" : "ri-information-fill toast-icon toast-info"} />
            <div className="toast-content">{toast.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}
