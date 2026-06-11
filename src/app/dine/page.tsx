"use client";

import { useState, useEffect } from "react";
import DineHeader from "@/components/dine/DineHeader";
import CategoryTabs from "@/components/dine/CategoryTabs";
import MenuGrid from "@/components/dine/MenuGrid";
import ItemDetailSheet from "@/components/dine/ItemDetailSheet";
import CartScreen from "@/components/dine/CartScreen";
import OrderTracker from "@/components/dine/OrderTracker";
import BillScreen from "@/components/dine/BillScreen";
import WaiterSheet from "@/components/dine/WaiterSheet";
import PaymentSheet from "@/components/dine/PaymentSheet";
import WelcomeScreen from "@/components/dine/WelcomeScreen";
import UserDetailsScreen from "@/components/dine/UserDetailsScreen";
import type { MenuItem, Extra } from "@/lib/menuData";
import * as api from "@/lib/api";
import { useDineStream } from "@/lib/useSSE";
import { useCart } from "@/hooks/dine/useCart";
import { useOrders } from "@/hooks/dine/useOrders";
import { useBilling } from "@/hooks/dine/useBilling";

type Screen = "loading" | "user-details" | "welcome" | "menu" | "cart" | "tracker" | "bill" | "session-error" | "table-disabled" | "session-ended";

export default function DinePage() {
  // ── Session & navigation state ──────────────────────────────────
  const [activeScreen, setActiveScreen] = useState<Screen>("loading");
  const [tableNumber, setTableNumber] = useState("T01");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  // ── Menu state ──────────────────────────────────────────────────
  const [menuData, setMenuData] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  // ── UI overlays ─────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [waiterSheetOpen, setWaiterSheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: string } | null>(null);

  // ── Domain hooks ────────────────────────────────────────────────
  const { cart, quickAdd, addToCart, updateQty, clearCart } = useCart();
  const { orders, isSubmitting, placeOrder, applySSEStatusChange, restoreOrders } = useOrders();
  const { currentBillingRound, paidRounds, hasRequestedBill, setHasRequestedBill, onPaymentSuccess, applyPaymentReceived, amountDue } = useBilling(orders, sessionId);

  // ── Real-time order status updates via SSE ─────────────────────
  useDineStream(sessionId, {
    onEvent: (event) => {
      if (event.type === "order:status_changed") {
        const { id, order_id, status } = event.data;
        applySSEStatusChange(id || order_id, status);
      } else if (event.type === "payment:received") {
        applyPaymentReceived(event.data.billing_round);
      } else if (event.type === "session:closed") {
        sessionStorage.removeItem("riwayat_session_id");
        sessionStorage.removeItem("riwayat_table_id");
        sessionStorage.removeItem("riwayat_user");
        setActiveScreen("session-error");
      }
    },
    onError: () => {},
  });

  // ── Page initialization ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const table = params.get("table");
      const qr = params.get("token");
      const previewScreen = params.get("screen");

      if (table) setTableNumber(table);
      if (qr) setQrToken(qr);

      if (qr) {
        const tableCheck = await api.getTableByQR(qr);
        if (tableCheck.status === 200 && tableCheck.data?.status === 'disabled') {
          setActiveScreen("table-disabled");
          return;
        }
        if (tableCheck.status !== 200) {
          setActiveScreen("session-error");
          return;
        }
      }

      const storedSessionId = sessionStorage.getItem("riwayat_session_id");
      const storedTableId = sessionStorage.getItem("riwayat_table_id");
      const storedUser = sessionStorage.getItem("riwayat_user");

      if (storedSessionId) {
        setSessionId(storedSessionId);

        const sessionRes = await api.getSessionOrders(storedSessionId);

        if (sessionRes.status === 404) {
          sessionStorage.clear();
          setActiveScreen("session-error");
          return;
        }

        if (sessionRes.status === 200 && sessionRes.data?.closed_at) {
          sessionStorage.removeItem("riwayat_session_id");
          sessionStorage.removeItem("riwayat_table_id");
          setActiveScreen("session-ended");
          return;
        }

        if (sessionRes.status === 200 && sessionRes.data?.orders.length) {
          restoreOrders(sessionRes.data.orders);
        }
      }

      if (storedTableId) {
        setTableId(storedTableId);
      } else if (table) {
        setTableId(table);
        sessionStorage.setItem("riwayat_table_id", table);
      }

      setIsLoadingMenu(true);
      try {
        const menuResponse = await api.fetchMenu();
        if (menuResponse.status === 200 && menuResponse.data) {
          setMenuData(Array.isArray(menuResponse.data) ? menuResponse.data : []);
        } else {
          setMenuError("Failed to load menu");
        }
      } catch {
        setMenuError("Failed to load menu");
      } finally {
        setIsLoadingMenu(false);
      }

      if (!storedUser) {
        setActiveScreen("user-details");
      } else {
        if (qr) {
          try {
            const parsed = JSON.parse(storedUser);
            const res = await api.createSession(qr, parsed.name, parsed.phone, parsed.email);
            if ((res.status === 200 || res.status === 201) && res.data?.session_id) {
              setSessionId(res.data.session_id);
              sessionStorage.setItem("riwayat_session_id", res.data.session_id);
              if (res.data.table_id) {
                setTableId(res.data.table_id);
                sessionStorage.setItem("riwayat_table_id", res.data.table_id);
              }
            } else {
              setActiveScreen(res.status === 403 ? "table-disabled" : "session-error");
              return;
            }
          } catch {
            setActiveScreen("session-error");
            return;
          }
        }
        setActiveScreen(previewScreen === "menu" ? "menu" : "welcome");
      }

      setHeaderHeight(window.innerHeight * 0.5);
    };
    init();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────
  const handleUserDetailsSubmit = async (details: { name: string; email: string; phone: string }) => {
    sessionStorage.setItem("riwayat_user", JSON.stringify(details));
    if (qrToken) {
      const res = await api.createSession(qrToken, details.name, details.phone, details.email);
      if ((res.status === 200 || res.status === 201) && res.data?.session_id) {
        setSessionId(res.data.session_id);
        sessionStorage.setItem("riwayat_session_id", res.data.session_id);
        if (res.data.table_id) {
          setTableId(res.data.table_id);
          sessionStorage.setItem("riwayat_table_id", res.data.table_id);
        }
        showToast("Welcome! Session started.", "success");
      } else {
        if (res.status === 403) {
          setActiveScreen("table-disabled");
          return;
        }
        showToast(res.error || "Failed to create session", "error");
      }
    }
    setActiveScreen("welcome");
  };

  const handlePlaceOrder = async () => {
    if (!sessionId) { setActiveScreen("session-error"); return; }
    const result = await placeOrder(sessionId, cart, currentBillingRound);
    if (result.success) {
      clearCart();
      showToast("Order placed! Kitchen is on it.", "success");
      setActiveScreen("tracker");
    } else {
      showToast(result.error || "Failed to place order", "error");
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSheetOpen(false);
    onPaymentSuccess();
    showToast("Payment recorded successfully!", "success");
  };

  const handleMenuScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.5 : 380;
    setHeaderHeight(Math.max(64, maxHeight - scrollTop));
  };

  const showToast = (msg: string, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isMainScreen = ["menu", "cart", "tracker", "bill"].includes(activeScreen);

  return (
    <div id="app">
      {activeScreen === "loading" && (
        <div className="screen" style={{ backgroundColor: "var(--clr-bg)" }} />
      )}

      {activeScreen === "session-error" && (
        <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", background: "var(--clr-bg)", gap: "1rem" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#c0392b", marginBottom: "0.5rem" }}>
            <i className="ri-qr-scan-2-line" />
          </div>
          <h2 style={{ fontFamily: "var(--ff-display, serif)", fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Session Not Found</h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", maxWidth: "280px", lineHeight: 1.6, margin: 0 }}>
            Your session has expired or is invalid. Please re-scan the QR code on your table.
          </p>
          <button className="btn-primary" style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => {
            sessionStorage.removeItem("riwayat_session_id");
            sessionStorage.removeItem("riwayat_table_id");
            sessionStorage.removeItem("riwayat_user");
            window.location.reload();
          }}>
            <i className="ri-refresh-line" /> Re-scan QR Code
          </button>
        </div>
      )}

      {activeScreen === "table-disabled" && (
        <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", background: "var(--clr-bg)", gap: "1rem" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#c0392b", marginBottom: "0.5rem" }}>
            <i className="ri-forbid-2-line" />
          </div>
          <h2 style={{ fontFamily: "var(--ff-display, serif)", fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Table Not Available</h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", maxWidth: "280px", lineHeight: 1.6, margin: 0 }}>
            This table is currently not accepting orders.<br />Please use another table or ask a staff member for assistance.
          </p>
        </div>
      )}

      {activeScreen === "session-ended" && (
        <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", background: "var(--clr-bg)", gap: "1rem" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#c0392b", marginBottom: "0.5rem" }}>
            <i className="ri-door-open-line" />
          </div>
          <h2 style={{ fontFamily: "var(--ff-display, serif)", fontSize: "1.4rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Session Cleared</h2>
          <p style={{ color: "var(--clr-muted)", fontSize: "0.9rem", maxWidth: "280px", lineHeight: 1.6, margin: 0 }}>
            Your table has been cleared by staff. Please scan the QR code again to start a new session.
          </p>
        </div>
      )}

      {activeScreen === "user-details" && <UserDetailsScreen onSubmit={handleUserDetailsSubmit} />}

      {activeScreen === "welcome" && (
        <WelcomeScreen tableNumber={tableNumber} onBrowseMenu={() => setActiveScreen("menu")} onCallWaiter={() => setWaiterSheetOpen(true)} />
      )}

      {isMainScreen && (
        <>
          <div
            id={activeScreen === "menu" ? "screen-menu" : undefined}
            className={`screen ${activeScreen === "menu" && headerHeight && headerHeight < (typeof window !== "undefined" ? window.innerHeight * 0.5 : 380) ? "scrolled" : ""}`}
          >
            {activeScreen === "menu" ? (
              <>
                <div className="menu-header-block">
                  <DineHeader
                    tableNumber={tableNumber}
                    onCallWaiter={() => setWaiterSheetOpen(true)}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearSearch={() => setSearchQuery("")}
                    headerHeight={headerHeight ?? 380}
                  />
                  <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
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
                    onItemClick={(item) => { setSelectedItem(item); setItemSheetOpen(true); }}
                    onQuickAdd={(item) => { quickAdd(item); showToast(`${item.name} added`, "success"); }}
                    menuData={menuData}
                    isLoading={isLoadingMenu}
                  />
                </div>
              </>
            ) : (
              <>
                <header className="app-header">
                  <div className="header-left">
                    <span className="header-logo">AI-RESTAURANT</span>
                    <span className="header-table">{tableNumber}</span>
                  </div>
                  <div className="header-right">
                    <button className="icon-btn btn-call-waiter-header" aria-label="Call Waiter" onClick={() => setWaiterSheetOpen(true)}>
                      <i className="ri-service-line" />
                    </button>
                  </div>
                </header>
                <div className="menu-scroll">
                  {activeScreen === "cart" && (
                    <CartScreen cart={cart} onUpdateQty={updateQty} onBrowseMenu={() => setActiveScreen("menu")} onPlaceOrder={handlePlaceOrder} />
                  )}
                  {activeScreen === "tracker" && (
                    <OrderTracker orders={orders} onBrowseMenu={() => setActiveScreen("menu")} />
                  )}
                  {activeScreen === "bill" && (
                    <BillScreen
                      orders={orders}
                      paidRounds={paidRounds}
                      onRequestBill={async () => {
                        setHasRequestedBill(true);
                        if (tableId && sessionId) {
                          await api.createAlert(tableId, "bill", "Bill requested by customer", sessionId);
                        }
                        showToast("Bill request sent — staff will be with you shortly.", "info");
                      }}
                      onPayNow={() => setPaymentSheetOpen(true)}
                      hasRequestedBill={hasRequestedBill}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <nav className="bottom-nav">
            <div className="nav-buttons">
              {(["menu", "cart", "tracker", "bill"] as Screen[]).map((screen) => {
                const icons: Record<string, string> = { menu: "ri-restaurant-2-line", cart: "ri-shopping-bag-3-line", tracker: "ri-time-line", bill: "ri-receipt-line" };
                const labels: Record<string, string> = { menu: "Menu", cart: "Cart", tracker: "Orders", bill: "Bill" };
                const badge = screen === "cart" ? cart.reduce((s, c) => s + c.qty, 0) : screen === "tracker" ? orders.length : 0;
                return (
                  <button key={screen} className={`nav-item ${activeScreen === screen ? "active" : ""}`} onClick={() => setActiveScreen(screen)}>
                    <i className={icons[screen]} />
                    <span>{labels[screen]}</span>
                    {badge > 0 && <span className="order-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      <ItemDetailSheet item={selectedItem} isOpen={itemSheetOpen} onClose={() => setItemSheetOpen(false)} onAddToCart={(item, qty, note, extras) => { addToCart(item, qty, note, extras); setItemSheetOpen(false); showToast(`${item.name} added to cart`, "success"); }} />
      <WaiterSheet isOpen={waiterSheetOpen} onClose={() => setWaiterSheetOpen(false)} onSubmitAlert={(_msg, isComplaint) => { setWaiterSheetOpen(false); showToast(isComplaint ? "Message submitted" : "Waiter called", "success"); }} sessionId={sessionId} tableId={tableId} />
      <PaymentSheet isOpen={paymentSheetOpen} amountDue={amountDue} sessionId={sessionId} onClose={() => setPaymentSheetOpen(false)} onPaymentSuccess={handlePaymentSuccess} />

      {toastMsg && (
        <div className="toast-stack">
          <div className={`toast toast-${toastMsg.type}`}>
            <i className={toastMsg.type === "success" ? "ri-checkbox-circle-line" : toastMsg.type === "error" ? "ri-error-warning-line" : "ri-information-line"} />
            <span>{toastMsg.msg}</span>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--clr-bg)", padding: "1.5rem 2rem", borderRadius: "12px", fontFamily: "var(--ff-ui)" }}>Placing order…</div>
        </div>
      )}
    </div>
  );
}
