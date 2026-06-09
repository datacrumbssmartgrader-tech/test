"use client";
import React from "react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: { name: string; id: string } | null;
  onLogout: () => void;
  orderBadge?: number;
  alertBadge?: number;
  sidebarOpen?: boolean;
}

const NAV_ITEMS = [
  { id: "orders",   label: "Live Orders",    icon: "ri-restaurant-line",      badge: "order" },
  { id: "tables",   label: "Tables",         icon: "ri-layout-grid-line",     badge: null    },
  { id: "menu",     label: "Menu",           icon: "ri-book-open-line",       badge: null    },
  { id: "alerts",   label: "Alerts",         icon: "ri-alarm-warning-line",   badge: "alert" },
  { id: "history",  label: "Order History",  icon: "ri-history-line",         badge: null    },
  { id: "payments", label: "Payments",       icon: "ri-secure-payment-line",  badge: null    },
];

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  user,
  onLogout,
  orderBadge = 0,
  alertBadge = 0,
  sidebarOpen = false,
}: AdminSidebarProps) {
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <aside id="sidebar" className={sidebarOpen ? "open" : ""}>
      <div className="sidebar-brand">
        <span className="sb-logo-en">ROOSTER&apos;S DEN</span>
        <span className="sb-logo-ur">روایات</span>
      </div>

      <nav className="sidebar-nav" id="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const badgeCount = item.badge === "order" ? orderBadge : item.badge === "alert" ? alertBadge : 0;
          return (
            <a
              key={item.id}
              className={`nav-item${activeSection === item.id ? " active" : ""}`}
              data-section={item.id}
              onClick={() => onSectionChange(item.id)}
              style={{ cursor: "pointer" }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <span className={`nav-badge${item.badge === "alert" ? " gold" : ""}`} id={`nav-badge-${item.id}`}>
                  {badgeCount}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" id="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" id="sidebar-user-name">{user?.name ?? "Admin"}</span>
            <span className="sidebar-user-role" id="sidebar-user-role">Staff</span>
          </div>
        </div>
        <button id="btn-logout" className="logout-btn" title="Sign out" onClick={onLogout}>
          <i className="ri-logout-box-r-line"></i>
        </button>
      </div>
    </aside>
  );
}
