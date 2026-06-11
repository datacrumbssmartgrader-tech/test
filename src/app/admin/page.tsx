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
import LoginScreen from "@/components/admin/LoginScreen";

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

  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [tablesRefreshTick, setTablesRefreshTick] = useState(0);
  const [menuRefreshTick, setMenuRefreshTick] = useState(0);
  const [paymentsRefreshTick, setPaymentsRefreshTick] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Initial data fetch once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch live orders
    api.fetchAdminOrders().then((res) => {
      if (res.status === 200 && res.data) setOrders(res.data);
    });

    // Initialize alert badge from backend
    api.fetchAdminAlerts().then((res) => {
      if (res.status === 200 && res.data) {
        const undismissed = res.data.filter((a: any) => !a.dismissed).length;
        setAlertCount(undismissed);
      }
    });
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
        const raw = event.data as any;
        const orderId = raw.order_id || raw.id;
        const status = raw.status;
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      } else if (event.type === "alert:created") {
        setAlertCount((prev) => prev + 1);
        showToast("New waiter alert received", "info");
      } else if (event.type === "payment:received") {
        setPaymentsRefreshTick((prev) => prev + 1);
        showToast("New payment received", "success");
      } else if (event.type === "table:update") {
        setTablesRefreshTick((prev) => prev + 1);
      } else if (
        event.type === "menu:item_added" ||
        event.type === "menu:item_updated" ||
        event.type === "menu:item_deleted"
      ) {
        setMenuRefreshTick((prev) => prev + 1);
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
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const activeOrderCount = orders.filter((o) => ["placed", "kitchen", "ready"].includes(o.status)).length;

  return (
    <div id="dashboard" className="dashboard">
      <div
        id="sidebar-overlay"
        className={sidebarOpen ? "open visible" : ""}
        onClick={() => setSidebarOpen(false)}
        style={sidebarOpen ? { pointerEvents: "auto" } : { pointerEvents: "none" }}
      />

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
        <AdminTopbar title={SECTION_TITLES[activeSection]} onMenuOpen={() => setSidebarOpen(true)} user={user} />

        <section className={`section${activeSection === "orders" ? " active" : ""}`}>
          <LiveOrders orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
        </section>

        <section className={`section${activeSection === "tables" ? " active" : ""}`}>
          <TablesGrid orders={orders} refreshTick={tablesRefreshTick} />
        </section>

        <section className={`section${activeSection === "menu" ? " active" : ""}`}>
          <MenuManager refreshTick={menuRefreshTick} />
        </section>

        <section className={`section${activeSection === "alerts" ? " active" : ""}`}>
          <AlertsPanel onBadgeChange={setAlertCount} refreshTrigger={alertCount} />
        </section>

        <section className={`section${activeSection === "history" ? " active" : ""}`}>
          <OrderHistory orders={orders} />
        </section>

        <section className={`section${activeSection === "payments" ? " active" : ""}`}>
          <PaymentsTab orders={orders} refreshTick={paymentsRefreshTick} />
        </section>
      </div>

      {toast && (
        <div id="toastStack" className="toast-stack">
          <div className="toast-card toast-in">
            <i className={
              toast.type === "success" ? "ri-checkbox-circle-fill toast-icon toast-success" :
              toast.type === "error" ? "ri-error-warning-fill toast-icon toast-error" :
              "ri-information-fill toast-icon toast-info"
            } />
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
