"use client";

import { useState, useEffect } from "react";
import DineHeader from "@/components/dine/DineHeader";
import CategoryTabs from "@/components/dine/CategoryTabs";
import MenuGrid from "@/components/dine/MenuGrid";
import ItemDetailSheet from "@/components/dine/ItemDetailSheet";
import CartScreen, { CartItem } from "@/components/dine/CartScreen";
import OrderTracker, { OrderBatch } from "@/components/dine/OrderTracker";
import BillScreen from "@/components/dine/BillScreen";
import WaiterSheet from "@/components/dine/WaiterSheet";
import PaymentSheet from "@/components/dine/PaymentSheet";
import WelcomeScreen from "@/components/dine/WelcomeScreen";
import UserDetailsScreen from "@/components/dine/UserDetailsScreen";
import { MenuItem, Extra } from "@/lib/menuData";
import * as api from "@/lib/api";
import { useDineStream } from "@/lib/useSSE";

// Map backend order status → UI status
const API_STATUS_MAP: Record<string, OrderBatch["status"]> = {
  placed: "received",
  kitchen: "kitchen",
  ready: "on-its-way",
  served: "served",
  cancelled: "served", // treat cancelled gracefully in tracker
};

export default function DinePage() {
  const [tableNumber, setTableNumber] = useState("T01");
  const [activeScreen, setActiveScreen] = useState<
    "loading" | "user-details" | "welcome" | "menu" | "cart" | "tracker" | "bill" | "session-error"
  >("loading");

  // API Integration State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Menu state
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  // Cart & Orders state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderBatch[]>([]);
  const [nextCartId, setNextCartId] = useState(1);
  const [nextOrderId, setNextOrderId] = useState(1);
  const [currentBillingRound, setCurrentBillingRound] = useState(1);
  const [paidRounds, setPaidRounds] = useState<Set<number>>(new Set());

  // Sheets state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [waiterSheetOpen, setWaiterSheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  // Toast state
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: string } | null>(null);
  const [hasRequestedBill, setHasRequestedBill] = useState(false);

  // SSE stream for real-time order status updates
  useDineStream(sessionId, {
    onEvent: (event) => {
      if (event.type === "order:status_changed") {
        const updatedOrder = event.data;
        const orderId = updatedOrder.id || updatedOrder.order_id;
        const newStatus =
          API_STATUS_MAP[updatedOrder.status] ?? (updatedOrder.status as OrderBatch["status"]);

        setOrders((prev) =>
          prev.map((batch) =>
            batch.id === orderId ? { ...batch, status: newStatus } : batch
          )
        );
      }
    },
    onError: () => {
      // SSE errors are non-fatal; auto-reconnect is handled by the hook
    },
  });

  useEffect(() => {
    const initializePage = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const table = params.get("table");
      const qr = params.get("token"); // QR URL uses ?token=<uuid>
      const previewScreen = params.get("screen");

      if (table) setTableNumber(table);
      if (qr) setQrToken(qr);

      // Restore session from sessionStorage
      const storedSessionId = sessionStorage.getItem("riwayat_session_id");
      const storedTableId = sessionStorage.getItem("riwayat_table_id");
      const storedUser = sessionStorage.getItem("riwayat_user");

      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
      // Use stored tableId, or fall back to the ?table= URL param
      if (storedTableId) {
        setTableId(storedTableId);
      } else if (table) {
        setTableId(table);
        sessionStorage.setItem("riwayat_table_id", table);
      }

      // Fetch menu from API
      setIsLoadingMenu(true);
      try {
        const menuResponse = await api.fetchMenu();
        if (menuResponse.status === 200 && menuResponse.data) {
          // fetchMenu() already normalises to an array — no double-unwrap needed
          setMenuData(Array.isArray(menuResponse.data) ? menuResponse.data : []);
        } else {
          setMenuError("Failed to load menu");
        }
      } catch {
        setMenuError("Failed to load menu");
      } finally {
        setIsLoadingMenu(false);
      }

      // Determine initial screen and handle session creation
      if (!storedUser) {
        setActiveScreen("user-details");
      } else {
        // We have user details. If we have a QR token but no session, silently create one
        if (qr) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const sessionResponse = await api.createSession(qr, parsedUser.name, parsedUser.phone, parsedUser.email);
            if ((sessionResponse.status === 200 || sessionResponse.status === 201) && sessionResponse.data?.session_id) {
              setSessionId(sessionResponse.data.session_id);
              sessionStorage.setItem("riwayat_session_id", sessionResponse.data.session_id);
              if (sessionResponse.data.table_id) {
                setTableId(sessionResponse.data.table_id);
                sessionStorage.setItem("riwayat_table_id", sessionResponse.data.table_id);
              }
            } else {
              // If QR is invalid or expired
              setActiveScreen("session-error");
              return;
            }
          } catch (e) {
            setActiveScreen("session-error");
            return;
          }
        }

        if (previewScreen === "menu") {
          setActiveScreen("menu");
        } else {
          setActiveScreen("welcome");
        }
      }

      /* ─── 3. Add this line right here before initializePage closes ─── */
      setHeaderHeight(window.innerHeight * 0.5);
    };

    initializePage();
  }, []);

  const handleUserDetailsSubmit = async (details: {
    name: string;
    email: string;
    phone: string;
  }) => {
    // Store user details locally
    sessionStorage.setItem("riwayat_user", JSON.stringify(details));

    try {
      // Try to create session via API if we have a QR token
      if (qrToken) {
        const sessionResponse = await api.createSession(
          qrToken,
          details.name,
          details.phone,
          details.email
        );

        if ((sessionResponse.status === 200 || sessionResponse.status === 201) && sessionResponse.data?.session_id) {
          const newSessionId = sessionResponse.data.session_id;
          const newTableId = sessionResponse.data.table_id;

          setSessionId(newSessionId);
          sessionStorage.setItem("riwayat_session_id", newSessionId);

          if (newTableId) {
            setTableId(newTableId);
            sessionStorage.setItem("riwayat_table_id", newTableId);
          }
          showToast("Welcome! Session started.", "success");
        } else {
          showToast(sessionResponse.error || "Failed to create session", "error");
        }
      }
    } catch {
      showToast("Error: Could not complete user setup", "error");
    }

    setActiveScreen("welcome");
  };

  // Scroll tracking for menu header compression
  const handleMenuScroll = (e: React.UIEvent<HTMLDivElement>) => {
const scrollTop = e.currentTarget.scrollTop;

// Dynamically fetch half the viewport height, or default to 380px on SSR load
    const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.5 : 380;
    const minHeight = 64; // The size of your compact sticky bar
    
    // Calculates the variable height dynamically matching scroll position
    const dynamicHeight = Math.max(minHeight, maxHeight - scrollTop);
    setHeaderHeight(dynamicHeight);
  };

  const showToast = (msg: string, type: string = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleQuickAdd = (item: MenuItem) => {
    const existing = cart.find((c) => c.menuId === item.id && c.note === "");
    if (existing) {
      setCart(cart.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          id: String(nextCartId),
          menuId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          note: "",
          img: item.img,
          cat: item.cat,
          prepTime: item.prepTime || 15,
        },
      ]);
      setNextCartId((prev) => prev + 1);
    }
    showToast(`${item.name} added`, "success");
  };

  const handleAddToCart = (
    item: MenuItem,
    qty: number,
    note: string,
    selectedExtras: Extra[]
  ) => {
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
    const unitPrice = item.price + extrasTotal;
    const extrasLabel = selectedExtras.map((e) => e.label).join(", ");
    const fullNote = [extrasLabel, note].filter(Boolean).join(" · ");

    const existing = cart.find((c) => c.menuId === item.id && c.note === fullNote);
    if (existing) {
      setCart(cart.map((c) => (c.id === existing.id ? { ...c, qty: c.qty + qty } : c)));
    } else {
      setCart([
        ...cart,
        {
          id: String(nextCartId),
          menuId: item.id,
          name: item.name,
          price: unitPrice,
          qty,
          note: fullNote,
          img: item.img,
          cat: item.cat,
          prepTime: item.prepTime || 15,
        },
      ]);
      setNextCartId((prev) => prev + 1);
    }
    setItemSheetOpen(false);
    showToast(`${item.name} added to cart`, "success");
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return { ...item, qty: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handlePlaceOrder = async () => {
    if (!sessionId) {
      setActiveScreen("session-error");
      return;
    }

    try {
      setIsSubmittingOrder(true);

      const orderItems = cart.map((item) => ({
        menu_id: item.menuId,
        quantity: item.qty,
        notes: item.note || undefined,
      }));

      const response = await api.submitOrder(sessionId, orderItems);

      if (response.status === 200 || response.status === 201) {
        const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
        const batch: OrderBatch = {
          id: response.data?.id || String(nextOrderId),
          items: [...cart],
          total: subtotal,
          status: "received",
          placedAt: Date.now(),
          billingRound: currentBillingRound,
        };
        setOrders([...orders, batch]);
        setNextOrderId((prev) => prev + 1);
        setCart([]);
        showToast("Order placed! Kitchen is on it.", "success");
        setActiveScreen("tracker");
      } else {
        showToast(response.error || "Failed to place order", "error");
      }
    } catch {
      showToast("Error placing order. Please try again.", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleWaiterAlert = (_msg: string, isComplaint: boolean) => {
    setWaiterSheetOpen(false);
    showToast(isComplaint ? "Message submitted" : "Waiter called", "success");
  };

  const handlePaymentSuccess = () => {
    setPaymentSheetOpen(false);
    const newPaidRounds = new Set(paidRounds);
    orders.forEach((b) => newPaidRounds.add(b.billingRound));
    setPaidRounds(newPaidRounds);
    setCurrentBillingRound((prev) => prev + 1);
    showToast("Payment recorded successfully!", "success");
  };

  const unpaidOrders = orders.filter((b) => !paidRounds.has(b.billingRound));
  const amountDue = unpaidOrders.reduce((sum, b) => sum + b.total, 0);

  return (
    <div id="app">
      {activeScreen === "loading" && (
        <div className="screen" style={{ backgroundColor: "var(--clr-bg)" }}></div>
      )}

      {activeScreen === "session-error" && (
        <div className="screen" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          background: "var(--clr-bg)",
          gap: "1rem",
        }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(var(--clr-error-rgb, 192,57,43), 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            color: "#c0392b",
            marginBottom: "0.5rem",
          }}>
            <i className="ri-qr-scan-2-line"></i>
          </div>
          <h2 style={{ fontFamily: "var(--ff-display, serif)", fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>
            Session Not Found
          </h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", maxWidth: "280px", lineHeight: 1.6, margin: 0 }}>
            Your session has expired or is invalid. Please re-scan the QR code on your table to start a new session.
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => {
              // Clear old session and restart
              sessionStorage.removeItem("riwayat_session_id");
              sessionStorage.removeItem("riwayat_table_id");
              sessionStorage.removeItem("riwayat_user");
              window.location.reload();
            }}
          >
            <i className="ri-refresh-line"></i> Re-scan QR Code
          </button>
        </div>
      )}

      {activeScreen === "user-details" && (
        <UserDetailsScreen onSubmit={handleUserDetailsSubmit} />
      )}

      {activeScreen === "welcome" && (
        <WelcomeScreen
          tableNumber={tableNumber}
          onBrowseMenu={() => setActiveScreen("menu")}
          onCallWaiter={() => setWaiterSheetOpen(true)}
        />
      )}

      {(activeScreen === "menu" ||
        activeScreen === "cart" ||
        activeScreen === "tracker" ||
        activeScreen === "bill") && (
        <>
          <div
            id={activeScreen === "menu" ? "screen-menu" : undefined}
            /* ─── 4. Update the layout template condition string below ─── */
            className={`screen ${activeScreen === "menu" && headerHeight && headerHeight < (typeof window !== "undefined" ? window.innerHeight * 0.5 : 380) ? "scrolled" : ""}`}
          >
            {/* ── Menu screen: hero header + category tabs ── */}
            {activeScreen === "menu" ? (
              <>
                <div className="menu-header-block">
                  {/* ─── 5. Update properties fed to DineHeader component ─── */}
                  <DineHeader
                    tableNumber={tableNumber}
                    onCallWaiter={() => setWaiterSheetOpen(true)}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearSearch={() => setSearchQuery("")}
                    headerHeight={headerHeight ?? 380} // 💎 Send down variable tracker size
                  />
                  <CategoryTabs
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                  />
                </div>

                <div className="menu-scroll" onScroll={handleMenuScroll}>
                  {menuError && (
                    <div className="no-results">
                      <i className="ri-wifi-off-line" />
                      <p>{menuError}</p>
                    </div>
                  )}
                  <MenuGrid
                    activeCategory={activeCategory}
                    searchQuery={searchQuery}
                    onItemClick={(item) => {
                      setSelectedItem(item);
                      setItemSheetOpen(true);
                    }}
                    onQuickAdd={handleQuickAdd}
                    menuData={menuData}
                    isLoading={isLoadingMenu}
                  />
                </div>
              </>
            ) : (
              /* ── Cart / Tracker / Bill screens: compact header ── */
              <>
                <header className="app-header">
                  <div className="header-left">
                    <span className="header-logo">ROOSTER&apos;S DEN</span>
                    <span className="header-table">{tableNumber}</span>
                  </div>
                  <div className="header-right">
                    <button
                      className="icon-btn btn-call-waiter-header"
                      aria-label="Call Waiter"
                      onClick={() => setWaiterSheetOpen(true)}
                    >
                      <i className="ri-service-line" />
                    </button>
                  </div>
                </header>

                <div className="menu-scroll">
                  {activeScreen === "cart" && (
                    <CartScreen
                      cart={cart}
                      onUpdateQty={handleUpdateCartQty}
                      onBrowseMenu={() => setActiveScreen("menu")}
                      onPlaceOrder={handlePlaceOrder}
                    />
                  )}

                  {activeScreen === "tracker" && (
                    <OrderTracker
                      orders={orders}
                      onBrowseMenu={() => setActiveScreen("menu")}
                    />
                  )}

                  {activeScreen === "bill" && (
                    <BillScreen
                      orders={orders}
                      paidRounds={paidRounds}
                      onRequestBill={async () => {
                        setHasRequestedBill(true);
                        if (tableId && sessionId) {
                          try {
                            console.log('[BillRequest] Sending bill alert — tableId:', tableId, 'sessionId:', sessionId);
                            const res = await api.createAlert(tableId, "bill", "Bill requested by customer", sessionId);
                            console.log('[BillRequest] response:', res.status, res.data, res.error);
                          } catch (err) {
                            console.error('[BillRequest] threw:', err);
                          }
                        } else {
                          console.warn('[BillRequest] Missing tableId or sessionId — tableId:', tableId, 'sessionId:', sessionId);
                        }
                        showToast(
                          "Bill request sent — staff will be with you shortly.",
                          "info"
                        );
                      }}
                      onPayNow={() => setPaymentSheetOpen(true)}
                      hasRequestedBill={hasRequestedBill}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bottom Navigation */}
          <nav className="bottom-nav">
            <div className="nav-buttons">
              <button
                className={`nav-item ${activeScreen === "menu" ? "active" : ""}`}
                onClick={() => setActiveScreen("menu")}
              >
                <i className="ri-restaurant-2-line"></i>
                <span>Menu</span>
              </button>
              <button
                className={`nav-item ${activeScreen === "cart" ? "active" : ""}`}
                onClick={() => setActiveScreen("cart")}
              >
                <i className="ri-shopping-bag-3-line"></i>
                <span>Cart</span>
                {cart.length > 0 && (
                  <span className="order-badge">{cart.reduce((s, c) => s + c.qty, 0)}</span>
                )}
              </button>
              <button
                className={`nav-item ${activeScreen === "tracker" ? "active" : ""}`}
                onClick={() => setActiveScreen("tracker")}
              >
                <i className="ri-time-line"></i>
                <span>Orders</span>
                {orders.length > 0 && (
                  <span className="order-badge">{orders.length}</span>
                )}
              </button>
              <button
                className={`nav-item ${activeScreen === "bill" ? "active" : ""}`}
                onClick={() => setActiveScreen("bill")}
              >
                <i className="ri-receipt-line"></i>
                <span>Bill</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* ── Overlays & Sheets ── */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={itemSheetOpen}
        onClose={() => setItemSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />
      <WaiterSheet
        isOpen={waiterSheetOpen}
        onClose={() => setWaiterSheetOpen(false)}
        onSubmitAlert={handleWaiterAlert}
        sessionId={sessionId}
        tableId={tableId}
      />
      <PaymentSheet
        isOpen={paymentSheetOpen}
        amountDue={amountDue}
        sessionId={sessionId}
        onClose={() => setPaymentSheetOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Toast Notifications */}
      {toastMsg && (
        <div className="toast-stack">
          <div className={`toast toast-${toastMsg.type}`}>
            <i
              className={
                toastMsg.type === "success"
                  ? "ri-checkbox-circle-line"
                  : toastMsg.type === "error"
                  ? "ri-error-warning-line"
                  : "ri-information-line"
              }
            ></i>
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}