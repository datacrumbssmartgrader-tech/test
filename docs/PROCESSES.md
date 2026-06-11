# AI-Restaurant — Process Documentation

Detailed step-by-step breakdown of every major flow in the system.

---

## Process 1: Customer Dine Flow

### 1.1 QR Scan & Page Load

```
Customer scans table QR code
  → URL: /dine?table=T01&token=<uuid>
  → dine/page.tsx mounts, runs init()

Early table check (before anything else):
  → GET /api/tables/{qr_token}
  → If table.status === 'disabled' → show "Table Not Available" screen (stop)
  → If non-200 → show session-error screen (invalid QR) (stop)

Session validation (if riwayat_session_id in sessionStorage):
  → GET /api/sessions/{session_id}/orders
  → 404 → clear sessionStorage, show session-error (stop)
  → closed_at non-null → remove session_id + table_id from storage,
                          show "Session Cleared" screen (stop)
  → 200 + orders → restoreOrders() — populates OrderTracker without re-ordering

  → Fetch menu concurrently
  → If no riwayat_user → show UserDetailsScreen
  → Else show WelcomeScreen (or menu if ?screen=menu)
```

### 1.2 First-Time Customer (No Stored Session)

```
No riwayat_user in sessionStorage
  → Show UserDetailsScreen
  → Customer enters: name (required), phone (required), email (optional)
  → Submit → POST /api/sessions { qr_token, customer_name, customer_phone, customer_email }
  
Backend:
  1. Validate QR token → find table in restaurant_tables
  2. Check if table.status === 'disabled' → 403
  3. Check for existing open session on this table (closed_at IS NULL)
     → If found: return { session_id, customer_id, table_id, opened_at } of existing session (no duplicate)
  4. Find customer by phone → update total_sessions + last_visit
     → If not found: insert new customer with total_sessions=1
  5. INSERT session (table_id, customer_id)
  6. UPDATE restaurant_tables SET status='active', active_session_id=session.id
  7. Return: { session_id, customer_id, table_id, opened_at }

Frontend:
  → Store session_id in sessionStorage (riwayat_session_id)
  → Store table_id in sessionStorage (riwayat_table_id)
  → Store user details in sessionStorage (riwayat_user)
  → Connect SSE: GET /api/dine/stream/{session_id}
  → Navigate to WelcomeScreen
```

### 1.3 Returning Customer (Session in Storage)

```
riwayat_user found in sessionStorage
  → Session validated and orders restored (see 1.1 above)
  → Has QR token in URL? → POST /api/sessions (returns existing session or creates new)
  → No QR token? → Use stored session_id directly (orders already restored from DB)
  → Navigate to WelcomeScreen (or "menu" if ?screen=menu)
  → useBilling restores paidRounds from GET /api/sessions/{id}/payments on mount
```

### 1.4 Browsing Menu

```
Customer clicks "Menu"
  → MenuGrid renders with menuData from fetchMenu()
  → Category tabs filter by item.category
  → Search input filters by item.name (live, client-side)
  → Scroll compresses DineHeader from 50vh → 64px
  
Quick-add (+ button on card):
  → useCart.quickAdd(item) → adds qty:1 to cart[], deduplicates by menuId + note
  → Toast: "{item.name} added"
  
Detail sheet (tap on card):
  → ItemDetailSheet opens with item
  → Customer selects qty, notes, extras
  → "Add to Cart" → useCart.addToCart(item, qty, note, extras)
```

### 1.5 Placing an Order

```
CartScreen "Place Order" button
  → handlePlaceOrder() in dine/page.tsx
  → useOrders.placeOrder(sessionId, cart, currentBillingRound)

  POST /api/orders {
    session_id,
    items: [{ menu_item_id, quantity, note? }]
  }
  
Backend:
  1. Validate session exists and is open
  2. INSERT order (session_id, table_id, billing_round, status='received')
  3. For each item: INSERT order_item (order_id, menu_item_id, qty, note, price)
  4. UPDATE order.total = sum of (qty * price)
  5. Emit 'order:created' to /api/admin/stream with order details + table_number + items

Frontend (on success):
  → Add OrderBatch to orders[] state
  → Clear cart
  → Navigate to OrderTracker screen
  → Toast: "Order placed! Kitchen is on it."
  
Admin dashboard (via SSE):
  → order:created event received
  → New order card added to LiveOrders (no page reload)
  → Toast: "New order received"
```

### 1.6 Real-Time Order Tracking

```
Admin clicks status button (placed → kitchen → ready → served)
  → PATCH /api/admin/orders/{id}/status { status: 'kitchen' }
  
Backend:
  → UPDATE orders SET status='kitchen'
  → Emit 'order:status_changed' to both admin stream AND dine stream for that session_id

Dine client (via SSE):
  → useDineStream receives order:status_changed
  → applySSEStatusChange(orderId, 'kitchen')
  → useOrders maps to UI status: kitchen → 'kitchen'
  → OrderTracker card badge updates instantly (no reload)

  If admin resets the table mid-session:
  → useDineStream receives session:closed
  → sessionStorage cleared (session_id, table_id, user)
  → Customer shown session-error screen: "Please re-scan the QR code"
  
  If customer refreshes/reopens tab after reset (tab was closed during reset):
  → init() calls GET /api/sessions/{id}/orders → closed_at is set
  → session_id + table_id removed from sessionStorage (riwayat_user preserved)
  → Customer shown "Session Cleared" screen instead of confusing session-error
```

### 1.7 Calling Waiter / Filing Complaint

```
Customer opens WaiterSheet (bell icon in header or WelcomeScreen button)
  → "Call Waiter" tab → POST /api/admin/alerts { table_id, session_id, type:'waiter', message }
  → "Complaint" tab + message → POST /api/admin/alerts { type:'complaint', message }
  → Toast: "Waiter called" / "Message submitted"

Backend:
  → INSERT waiter_alerts
  → Emit 'alert:created' to admin stream

Admin dashboard:
  → alert:created SSE received
  → alertCount badge increments in sidebar
  → AlertsPanel re-fetches automatically (refreshTrigger prop tied to alertCount)
```

### 1.8 Requesting the Bill

```
Customer navigates to Bill screen
  → "Request Bill" button → POST /api/admin/alerts { type:'bill', message:'Bill requested by customer' }
  → hasRequestedBill=true (button shows confirmation state)
  → Toast: "Bill request sent"
```

### 1.9 Payment

```
Customer on Bill screen → "Pay Now" → PaymentSheet opens
  → Customer selects card/cash, enters amount
  → POST /api/sessions/{id}/payment { amount, payment_method }
  
Backend:
  1. Get session (billing_round, table_id) — capture billing_round BEFORE update
  2. Get order_ids WHERE session_id AND billing_round = current round (scoped, not all session orders)
  3. INSERT payments (session_id, table_id, billing_round, order_ids[], amount, method)
  4. UPDATE sessions SET total_paid += amount, billing_round += 1
  5. Emit 'payment:received' to admin stream
  6. Emit 'payment:received' to dine stream → { billing_round, order_ids, amount, method, paid_at }

Frontend (dine):
  → useDineStream receives payment:received
  → useBilling.applyPaymentReceived(billing_round) — marks round as paid instantly
  → Bill screen updates without reload

Frontend (manual Pay Now flow):
  → useBilling.onPaymentSuccess() — same effect via local state

Admin dashboard:
  → payment:received SSE received
  → Toast: "New payment received"
  → PaymentsTab + TablesGrid re-fetch automatically
  → View Bill modal: orders show "Paid" badge; "Mark as Paid" shows unpaid balance only
```

---

## Process 2: Admin Authentication

```
Staff opens /admin
  → AdminPage renders AuthProvider
  → useAuth() on mount: GET /api/auth/me
    → 200: restore session (user object from JWT cookie)
    → 401: show LoginScreen

LoginScreen:
  → Staff enters 4-digit PIN
  → Submit → useAuth.login(pin) → POST /api/auth/login { pin }
  
Backend:
  → Find staff with matching role (looks up all active staff)
  → bcrypt.compare(pin, staff.pin_hash)
  → On match: sign JWT { staff_id, name, role }, set HTTP-only cookie rw_session (24h)
  → Return: { staff_id, name, role }

Frontend:
  → Cookie set automatically (credentials: 'include')
  → GET /api/auth/me to get user object
  → isAuthenticated = true, user = { id, name, role }
  → AdminDashboard renders

Logout:
  → POST /api/auth/logout → clears rw_session cookie
  → useAuth sets isAuthenticated = false → LoginScreen shown
```

---

## Process 3: Admin Order Management

```
On admin load (after auth):
  → GET /api/admin/orders → initial orders[] state
  → GET /api/admin/alerts → initialize alertCount badge (not 0 — real count from DB)
  → useAdminStream() connects to GET /api/admin/stream (SSE, polls DB every 2s)
  
SSE events handled:
  order:created      → new card in LiveOrders
  order:status_changed → update order status in LiveOrders
  alert:created      → increment alertCount, AlertsPanel refreshes
  payment:received   → PaymentsTab refreshes
  table:update       → TablesGrid refreshes
  menu:item_added / menu:item_updated / menu:item_deleted → MenuManager refreshes

Advance order status:
  → Admin clicks status button or changes dropdown in LiveOrders
  → handleUpdateOrderStatus(id, 'kitchen')
  → PATCH /api/orders/{id} { status: 'kitchen' }
  → On success: update orders[] state locally
  → Backend also emits SSE → dine client sees it

Cancel order:
  → Confirm dialog → PATCH /api/orders/{id} { status: 'cancelled' }
  → Order card shows "Cancelled" badge
```

---

## Process 4: Menu Management

```
Admin navigates to Menu section
  → MenuManager mounts → GET /api/admin/menu (all items including hidden)

Add item:
  1. Fill form (name, category, price, description)
  2. Upload image → POST /api/upload/image (multipart)
     → Cloudinary stores it, returns { secureUrl, publicId }
  3. Save → POST /api/admin/menu { name, price, category, image_url, image_public_id, ... }
  4. Grid refreshes with new item

Edit item:
  → PUT /api/admin/menu/{id} with full item data
  → Grid updates

Toggle availability:
  → PATCH /api/admin/menu/{id} { available: false }
  → Item greyed out in grid, hidden from /api/menu (customer menu)

Delete item:
  → DELETE /api/admin/menu/{id}
  → Backend also deletes Cloudinary image (by image_public_id)
  → Item removed from grid
```

---

## Process 5: Table Management

```
Admin navigates to Tables section
  → TablesGrid fetches GET /api/admin/tables
  → Shows all 12 tables with status, session info, running bill

View QR:
  → GET /api/admin/tables/{id}/qr → returns PNG image
  → Display in modal for staff to download/print

Regenerate QR:
  → POST /api/admin/tables/{id}/regenerate-qr
  → Backend generates new UUID for qr_token
  → Old QR codes immediately invalid
  → New QR shown in modal

Reset Table (end of visit):
  → POST /api/admin/tables/{id}/reset
  → Backend: UPDATE sessions SET closed_at=now() WHERE table_id AND closed_at IS NULL
  → UPDATE restaurant_tables SET status='empty', active_session_id=NULL
  → Emit table:update to admin stream → TablesGrid refreshes automatically
  → Emit session:closed to dine stream → customer sees session-error screen
  → Table card shows as empty
```

---

## Process 6: Alerts Management

```
Alert created when customer:
  → Calls waiter (type: 'waiter')
  → Files complaint (type: 'complaint')
  → Requests bill (type: 'bill')

All create:
  → POST /api/admin/alerts { session_id, type, message }
     (table_id is optional — backend derives it from session_id if omitted)
  → INSERT waiter_alerts
  → Emit alert:created to admin stream

Admin side:
  → alertCount badge increments via SSE
  → AlertsPanel (GET /api/admin/alerts) shows undismissed alerts

Resolve single:
  → PATCH /api/admin/alerts/{id} { dismissed: true }
  → Alert removed from list, badge decrements

Dismiss all:
  → POST /api/admin/alerts/dismiss-all
  → All undismissed alerts set dismissed=true
  → Badge → 0
```

---

## Session Lifecycle Summary

```
[Table: empty]
    ↓ customer scans QR
[Table: active] ← Session created
    ↓ customer orders
[Orders: received → kitchen → ready → served]
    ↓ customer pays
[Payment recorded, billing_round incremented]
    ↓ admin resets table
[Session: closed_at set]
[Table: empty] ← back to start
```
