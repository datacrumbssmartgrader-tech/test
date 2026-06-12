# AI-Restaurant — Bug Fixes & UI Improvements (Round 2)

> **Context for fresh sessions:** This project is a Next.js 16 full-stack QR ordering app. Admin dashboard at `/admin`, customer dine page at `/dine`. Real-time via SSE. All previous refactoring is complete (74/74 tests pass). This document covers issues found during manual testing plus per-order payment tracking work.

## Progress

| # | Issue | Status |
|---|-------|--------|
| 17 | Table card shows previous session's orders after reset + new session | ✅ Done |
| 16 | QR token UUID exposed in dine page URL (`?token=UUID`) | ✅ Done |
| 1a | `useOrders.ts` reads `id` instead of `order_id` from POST response | ✅ Done |
| 1b | `LiveOrders` card reconstructed: advance button, `#ORD-003` IDs, `⏱ prep_time`, status enum fix (`placed`→`received`) | ✅ Done |
| 1c | `LiveOrders` — `⏱ prep_time` hidden for served orders; should stay visible (only hide for cancelled) | ✅ Done |
| 2 | Admin section spacing — inline `style` display, `.section` class never applied | ✅ Done |
| 3 | Tables tick not incremented on `order:created` / `payment:received` | ✅ Done |
| 4 | `OrderHistory` shows UUID slugs (`#e3bb1779`) | ✅ Done |
| 5 | Alerts: no fade transition on resolve; dismiss-all clears active alerts | ✅ Done |
| 6 | `sessions/route.ts` never emitted `table:update` SSE | ✅ Done |
| 7 | Disabled table shows wrong error; no early status check | ✅ Done |
| 8 | `payment/route.ts` — order_ids not scoped to billing round; no `emitToDine` | ✅ Done |
| 9 | `GET /api/sessions/[id]/payments` route missing (plural — list all payment records) | ✅ Done |
| 10 | `api.ts` — `SessionPayment` type + `getSessionPayments()` missing | ✅ Done |
| 11 | `LiveOrder` interface + admin orders SQL missing `billing_round` field | ✅ Done |
| 12 | `useBilling.ts` — no `sessionId` param, no DB restore on mount, no `applyPaymentReceived` | ✅ Done |
| 13 | `dine/page.tsx` — `useBilling` ignores `sessionId`; no `payment:received` SSE handler | ✅ Done |
| 14 | `TablesGrid.tsx` — no per-order paid display; "Mark as Paid" sends full total instead of unpaid balance | ✅ Done |
| 15 | Dine page refresh wipes all orders from customer UI — no session order restore on init | ✅ Done |

---

## Issue 1 — Order Status Update Does NOT Reflect on Dine (Customer) Screen

### Symptom
Admin advances an order from "Received" → "In Kitchen" in LiveOrders. The dine/customer page tracker badge never updates — it stays showing the old status indefinitely without page reload.

### Root Cause (Two-Part)

**Part A — ID mismatch breaks SSE matching**

`src/hooks/dine/useOrders.ts:40`:
```typescript
id: response.data?.id || String(nextOrderId),
```
The `POST /api/orders` response returns `order_id` (not `id`). So `response.data?.id` is always `undefined`, and the batch gets a sequential fallback ID like `"1"`, `"2"`.

When the SSE event arrives at the dine client:
```typescript
// SSE event payload from PATCH /api/orders/[id]
{ order_id: "550e8400-e29b-...", status: "kitchen" }
```
`applySSEStatusChange("550e8400-e29b-...", "kitchen")` then does:
```typescript
prev.map((batch) => (batch.id === orderId ? ... : batch))
// batch.id = "1" vs orderId = "550e8400..." → never matches → no update
```

**Part B — Frontend status enum vs backend enum mismatch**

`LiveOrders.tsx` uses frontend status values (`"placed"`, `"kitchen"`, `"ready"`, `"served"`, `"cancelled"`), but the backend `PATCH /api/orders/[id]` only accepts `['received', 'kitchen', 'ready', 'served', 'cancelled']`. The value `"placed"` is not in the valid list → returns HTTP 400. This means if admin ever tries to use the dropdown to select "Received", the call silently fails. The dropdown should be replaced with a button anyway (see below).

### Also Requested: Replace Dropdown with "Advance" Button

The current `<select>` dropdown in LiveOrders lets admin jump to any status. The user wants a single **action button** that advances the order to the *next* status in the chain. The button label should reflect what action it performs (e.g. "Send to Kitchen", "Mark Ready", "Mark Served"). A cancel button remains separately.

`nextStatus()` and `handleAdvance()` already exist in `LiveOrders.tsx` — the button UI just needs to replace the `<select>`.

### Fix

**File 1: `src/hooks/dine/useOrders.ts` line 40**
```typescript
// Before:
id: response.data?.id || String(nextOrderId),
// After:
id: response.data?.order_id || response.data?.id || String(nextOrderId),
```

**File 2: `src/components/admin/LiveOrders.tsx`**
- Remove the `<select>` in `order-card-foot`
- Replace with a button using the already-defined `handleAdvance(order.id, order.status)` logic
- Button label should show the next action, e.g.:
  - `placed → kitchen` → "Send to Kitchen"
  - `kitchen → ready` → "Mark Ready"
  - `ready → served` → "Mark Served"
  - Already served/cancelled → no button shown
- Keep Cancel as a separate `btn-danger` button

### Changes Made ✅

**`src/hooks/dine/useOrders.ts:40`**
```typescript
// Before:
id: response.data?.id || String(nextOrderId),
// After:
id: response.data?.order_id || response.data?.id || String(nextOrderId),
```

**`src/components/admin/LiveOrders.tsx`** — `<select>` replaced with advance button (`→ Kitchen`, `→ Ready`, `→ Served`) + separate Cancel button. `⏱ prep_time` display added to order-card header (issue 1c: kept visible for served orders, hidden only for cancelled).

---

## Issue 2 — Admin Content Area Has No Spacing from Sidebar/Edges

### Symptom
All content panels (Live Orders, Menu Manager, Alerts, etc.) render flush against the sidebar edge, top border, and screen edges. There is no breathing room around content. Order History appears fine because it has its own internal table padding.

### Root Cause

`shell.css` defines `.section { @apply ... p-[1.75rem_2rem] }` which would add the correct padding. However, `src/app/admin/page.tsx` renders sections using **raw HTML `<section>` tags with inline display styles** — the `.section` CSS class is never applied:

```tsx
// Current — no CSS class, no padding applied:
<section style={{ display: activeSection === "orders" ? "block" : "none" }}>
  {activeSection === "orders" && <LiveOrders ... />}
</section>
```

The inline `style={{ display: "block/none" }}` overrides nothing — but because `.section` class is absent, the `p-[1.75rem_2rem]` padding from CSS never fires. The inner components (`LiveOrders`, `TablesGrid`, etc.) each render their own bare `<section>` with no padding, leaving content edge-to-edge.

Additionally, the current pattern of `{activeSection === "xxx" && <Component />}` causes components to **unmount and remount** every time you switch tabs — losing their local state and re-fetching from the API unnecessarily.

### Fix

**File: `src/app/admin/page.tsx`**

Change each section from inline-style display to CSS class, and always mount the component (CSS controls visibility):

```tsx
// Before:
<section style={{ display: activeSection === "orders" ? "block" : "none" }}>
  {activeSection === "orders" && <LiveOrders orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
</section>

// After:
<section className={`section ${activeSection === "orders" ? "active" : ""}`}>
  <LiveOrders orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
</section>
```

Do this for all 6 sections (orders, tables, menu, alerts, history, payments). Removing the conditional `{activeSection === "xxx" && <Component />}` means components mount once and stay mounted — better performance and no state loss on tab switch. CSS `.section` / `.section.active` already handles show/hide via `display: none` / `display: flex`.

### Changes Made ✅

**`src/app/admin/page.tsx`** — all 6 `<section>` tags changed from `style={{ display: ... }}` + conditional component render to `className={\`section${active ? " active" : ""}\`}` with components always mounted.

---

## Issue 3 — Table Cards Don't Update After Customer Orders or Pays

### Symptom
Admin opens the Tables section. A customer scans QR, places an order, and pays. The table card still shows as "Empty" or shows stale order count / running bill even though Live Orders and Payments both updated correctly.

### Root Cause

`TablesGrid` re-fetches its data when `refreshTick` prop increments. In `admin/page.tsx`, `tablesRefreshTick` only increments on `table:update` SSE events:

```typescript
} else if (event.type === "table:update") {
  setTablesRefreshTick((prev) => prev + 1);
}
```

But `table:update` is only emitted when admin explicitly resets a table (`POST /api/admin/tables/:id/reset`). It is **never emitted** when:
- A customer places an order (`order:created` SSE fires to admin stream but no `table:update`)
- A customer pays (`payment:received` SSE fires but no `table:update`)

So the table card's running bill, order count, and session_total_paid fields never update from SSE — only from a page reload or manual table reset.

### Fix

**File: `src/app/admin/page.tsx`** — in the SSE `onEvent` handler, also increment `tablesRefreshTick` on `order:created` and `payment:received`:

```typescript
} else if (event.type === "order:created") {
  // ... existing: add new order card to LiveOrders ...
  setTablesRefreshTick((prev) => prev + 1);  // ADD THIS
} else if (event.type === "payment:received") {
  setPaymentsRefreshTick((prev) => prev + 1);
  setTablesRefreshTick((prev) => prev + 1);  // ADD THIS
  showToast("New payment received", "success");
}
```

### Changes Made ✅

**`src/app/admin/page.tsx`**
- Added `setTablesRefreshTick((prev) => prev + 1)` inside the `order:created` SSE branch (after `setOrders`).
- Added `setTablesRefreshTick((prev) => prev + 1)` inside the `payment:received` SSE branch (alongside existing `setPaymentsRefreshTick`).

---

## Issue 4 — OrderHistory Still Shows UUID Slugs (#e3bb1779)

### Symptom
Order History table shows order identifiers like `#e3bb1779` (first 8 chars of UUID). This was fixed in LiveOrders and OrderTracker earlier but was missed in OrderHistory.

### Root Cause

`src/components/admin/OrderHistory.tsx:176`:
```tsx
filtered.map((o) => (
  <tr key={o.id}>
    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>#{o.id.slice(0, 8)}</td>
```

The `.map()` doesn't expose an index, and `.slice(0, 8)` on the UUID produces the hash-like ID.

### Fix

**File: `src/components/admin/OrderHistory.tsx`**

Add `idx` to the map and change the display:
```tsx
filtered.map((o, idx) => (
  <tr key={o.id}>
    <td>Order #{idx + 1}</td>
```

Remove the `fontFamily: monospace` and `fontSize: 0.8rem` inline style on that cell since it was only there to make the UUID readable.

### Changes Made ✅

**`src/components/admin/OrderHistory.tsx`** — `.map((o) =>` changed to `.map((o, idx) =>`. Display cell changed from `#{o.id.slice(0, 8)}` to `Order #{idx + 1}`. Inline monospace/font-size styles removed from that cell.

---

## Issue 5 — Alerts: Resolve Should Fade Out (Not Disappear), Dismiss All Clears Only Faded Ones

### Symptom
Currently, clicking Resolve does keep the card visible at reduced opacity (the `_resolved` flag + `opacity: 0.5` inline style), but the opacity change is **instant with no transition**. The card feels like it just breaks rather than gracefully fading. "Dismiss All" removes ALL alerts from view — including ones that weren't individually resolved yet — by resolving them in the DB in a loop and then wiping the list.

### What the User Wants
- **Resolve** → card smoothly fades out, becomes non-interactive (pointer-events: none). The "Resolved" badge already appears, which is good.
- **Dismiss All** → removes only the already-faded (resolved) cards from view. Active/pending alerts stay visible.

### Root Cause

**Fade transition missing**: The opacity is applied as an inline style (`style={alert._resolved ? { opacity: 0.5 } : undefined}`). Without a CSS `transition` rule, the opacity snaps instantly.

**Dismiss All behavior**: Current code:
```typescript
const handleDismissAll = async () => {
  const pending = alerts.filter((a) => !a._resolved);
  for (const alert of pending) {
    await api.resolveAlert(alert.id); // resolves active ones in DB
  }
  setAlerts([]);  // clears EVERYTHING including active ones
  onBadgeChange(0);
};
```
This wipes everything. Should instead only remove resolved ones and leave active ones:
```typescript
const handleDismissAll = async () => {
  // Only resolve unresolved alerts that are still pending in DB
  const pending = alerts.filter((a) => !a._resolved);
  for (const alert of pending) {
    await api.resolveAlert(alert.id);
  }
  // Remove only the resolved (faded) cards; keep active ones
  setAlerts((prev) => prev.filter((a) => !a._resolved));
  const remaining = alerts.filter((a) => !a._resolved).length;
  onBadgeChange(remaining); // should be 0 since we just resolved them all above
};
```

Wait — re-reading: "Dismiss All removes all the faded out alerts". So Dismiss All only removes faded ones. Which means if you resolve all individually, then Dismiss All clears them. If there are still active alerts, they stay. That means Dismiss All should NOT call `resolveAlert` on pending ones — it should only `filter` out `_resolved` ones from state. Active ones stay.

### Fix

**File: `src/components/admin/AlertsPanel.tsx`**

1. Add CSS transition to the resolved card inline style (or better, move it to a CSS class):
```tsx
// In the alert card div:
style={alert._resolved ? { opacity: 0.45, pointerEvents: "none", transition: "opacity 0.4s ease" } : { transition: "opacity 0.4s ease" }}
```

2. Change `handleDismissAll` to only remove resolved cards, never touch active ones:
```typescript
const handleDismissAll = async () => {
  // Remove only faded-out (already resolved) cards from view
  setAlerts((prev) => prev.filter((a) => !a._resolved));
  // Badge count stays the same (pending alerts remain)
};
```

3. Hide the "Dismiss All" button until there are resolved cards to dismiss:
```tsx
// Only show Dismiss All if there are resolved cards to clear
{alerts.some((a) => a._resolved) && (
  <button className="btn-ghost" onClick={handleDismissAll}>
    <i className="ri-delete-bin-line"></i> Clear Resolved
  </button>
)}
```
(Rename to "Clear Resolved" to match new behavior more clearly.)

### Changes Made ✅

**`src/components/admin/AlertsPanel.tsx`**
- Alert card `style` prop changed to include `transition: "opacity 0.4s ease"` on both resolved and unresolved states, and `pointerEvents: "none"` added when resolved.
- `handleDismissAll` simplified to `setAlerts((prev) => prev.filter((a) => !a._resolved))` — no longer calls `resolveAlert` on active alerts, no longer clears everything.
- "Dismiss All" button renamed to "Clear Resolved" and conditionally rendered only when `alerts.some((a) => a._resolved)`.

---

## Issue 6 — Table Card Stays "Empty" After Customer Scans QR and Orders

### Symptom
Admin opens Tables section. Customer scans QR, enters details, session is created, order is placed. The table card still shows status "Empty" with no session info. Refreshing the admin page shows it correctly — the data is in the DB, it's just not reflected in real time.

### Root Cause

`POST /api/sessions` updates the DB correctly:
```sql
UPDATE restaurant_tables SET status='active', active_session_id=<session.id> WHERE id=<tableId>
```
But it **never emits a `table:update` SSE event** — and `eventManager` is not even imported in `src/app/api/sessions/route.ts`. So `tablesRefreshTick` never increments and TablesGrid never re-fetches.

Additionally, when the **duplicate session check** fires (existing open session found), the route returns early and does NOT run the `UPDATE restaurant_tables` SQL at all. If a table was somehow reset to "empty" in the DB while still having an open session (race condition or partial reset), the table stays visually empty even though a session exists.

### Fix

**File: `src/app/api/sessions/route.ts`**

1. Import eventManager at the top:
```typescript
import { eventManager } from '@/lib/events';
```

2. After new session creation (after the `UPDATE restaurant_tables` SQL), emit SSE:
```typescript
eventManager.emitToAdmin('table:update', {
  table_id: tableId,
  status: 'active',
  active_session_id: session.id,
});
```

3. In the duplicate session resume path, also emit SSE (to ensure table shows as active if admin missed earlier event) AND ensure the table DB record is actually active:
```typescript
// Ensure table is still marked active (defensive fix)
await sql`
  UPDATE restaurant_tables
  SET status = 'active', active_session_id = ${s.id}
  WHERE id = ${tableId} AND (status != 'active' OR active_session_id IS NULL)
`;
eventManager.emitToAdmin('table:update', {
  table_id: tableId,
  status: 'active',
  active_session_id: s.id,
});
```

### Changes Made ✅

**`src/app/api/sessions/route.ts`**
- Added `import { eventManager } from '@/lib/events'` at the top.
- After new session creation + `UPDATE restaurant_tables`, added `eventManager.emitToAdmin('table:update', { table_id, status: 'active', active_session_id: session.id })`.
- In the duplicate-session resume path, added a defensive `UPDATE restaurant_tables SET status='active' ... WHERE status != 'active' OR active_session_id IS NULL` followed by the same `emitToAdmin` call.

---

## Issue 7 — Disabled Table QR Shows Wrong Error / No Early Check

### Symptom
Customer scans a QR for a table that is "disabled" in the admin panel. On the dine page they either:
- See the UserDetailsScreen, fill in their name/phone, hit submit, then get the generic "Session Not Found. Please re-scan the QR code" error — confusing because re-scanning won't help.
- Or (returning user) immediately see the session-error screen with the same misleading message.

### Root Cause

**No early status check on page load.** The dine page `init()` does NOT call `GET /api/tables/:qr_token` to pre-check the table status before rendering. The first time a disabled table is detected is when `POST /api/sessions` returns `403 "Table is disabled"`.

Both the first-time and returning-user code paths handle all non-200 responses the same way:
```typescript
setActiveScreen("session-error"); // same for 403, 404, 500
```
The session-error screen says "Your session has expired or is invalid. Please re-scan the QR code" — completely wrong message for a disabled table.

**`GET /api/tables/:qr_token`** already returns `{ status: "disabled", ... }` and is a public endpoint — it's just not being used early enough.

### Fix

**File: `src/app/dine/page.tsx`** — in the `init()` useEffect:

1. Add a new screen state: `"table-disabled"` (add to the `Screen` type union)

2. Early in `init()`, before checking sessionStorage, call `GET /api/tables/:qr_token` to validate the table:
```typescript
if (qr) {
  const tableCheck = await api.getTableByQR(qr);
  if (tableCheck.status === 200 && tableCheck.data?.status === 'disabled') {
    setActiveScreen("table-disabled");
    return;
  }
  if (tableCheck.status !== 200) {
    setActiveScreen("session-error"); // invalid/expired QR
    return;
  }
}
```

3. Add a `table-disabled` screen render (similar to session-error but with correct copy):
```tsx
{activeScreen === "table-disabled" && (
  <div className="screen" style={{ /* centered layout */ }}>
    <div style={{ /* warning icon circle */ }}>
      <i className="ri-forbid-2-line" />
    </div>
    <h2>Table Not Available</h2>
    <p>This table is currently not accepting orders.<br/>Please use another table or ask a staff member for assistance.</p>
    {/* No re-scan button — re-scanning won't help */}
  </div>
)}
```

4. In `handleUserDetailsSubmit`, if `POST /api/sessions` returns 403, also set `"table-disabled"` instead of `"session-error"`:
```typescript
if (res.status === 403) {
  setActiveScreen("table-disabled");
} else {
  showToast(res.error || "Failed to create session", "error");
}
```

### Changes Made ✅

**`src/app/dine/page.tsx`**
- Added `"table-disabled"` to the `Screen` type union.
- Added early `api.getTableByQR(qr)` call at the top of `init()` — sets `"table-disabled"` if status is `"disabled"`, sets `"session-error"` if the QR is invalid (non-200).
- Added `"table-disabled"` screen render with "Table Not Available" heading and no re-scan button.
- `handleUserDetailsSubmit`: 403 response from `POST /api/sessions` now sets `"table-disabled"` instead of `"session-error"`.

---

## Files to Change

| File | Issue | Change |
|------|-------|--------|
| `src/hooks/dine/useOrders.ts` | #1a SSE ID mismatch | Read `order_id` field from POST response |
| `src/components/admin/LiveOrders.tsx` | #1b Dropdown → button | Replace `<select>` with advance button |
| `src/app/admin/page.tsx` | #2 Spacing + #3 Tables refresh | Apply `.section` CSS class; add tick to order:created + payment:received |
| `src/components/admin/OrderHistory.tsx` | #4 UUID display | Use `idx + 1` sequential display |
| `src/components/admin/AlertsPanel.tsx` | #5 Fade + dismiss behavior | CSS transition, dismiss-all only clears resolved |
| `src/app/api/sessions/route.ts` | #6 Table stays empty | Import eventManager; emit `table:update` after session creation + on resume |
| `src/app/dine/page.tsx` | #7 Disabled table error | Early `GET /api/tables/:qr_token` check; new `table-disabled` screen state |

---

## Verification

After implementing:

1. **SSE fix**: Open dine page in one browser, admin in another. Place an order on dine. In admin LiveOrders, click "Send to Kitchen". Within 1–2 seconds, the dine OrderTracker badge should change from "Received" to "In the Kitchen" without any page reload.

2. **Button UI**: LiveOrders cards show a single labeled action button ("Send to Kitchen", "Mark Ready", "Mark Served") and a Cancel button. No dropdown select.

3. **Spacing**: All admin sections (orders, tables, menu, alerts, history, payments) have visible padding around content — not flush to screen edges or sidebar.

4. **Tables refresh**: After a customer places order → table card immediately updates to "Active" status and shows running bill. After payment → table card shows updated total paid. No page reload needed.

5. **OrderHistory**: All order IDs show as "Order #1", "Order #2", etc.

6. **Alerts**: Clicking Resolve triggers a smooth 0.4s fade. Resolved card stays visible but faded with "Resolved" badge and no Resolve button. "Clear Resolved" button appears only when resolved cards exist, and clicking it removes only faded cards while active alerts remain.

7. **Table active on session create**: Admin Tables section — table card switches from "Empty" to "Active" within 1–2 seconds of customer scanning QR and submitting details. No page reload.

8. **Disabled table**: Scan QR for a disabled table → dine page immediately shows "Table Not Available — please use another table" screen. Never reaches UserDetailsScreen or generic session-error.

---

## Issue 8 — `payment/route.ts`: order_ids Not Scoped to Billing Round; No Emit to Dine

### Symptom
Admin marks a bill as paid. The customer's dine page never updates — the bill stays showing as unpaid until page refresh. Payment records also include all session orders instead of just the orders in the current billing round.

### Root Cause

**Part A — order_ids scope**: The SQL in `POST /api/sessions/[session_id]/payment/route.ts` fetches:
```sql
SELECT id FROM orders WHERE session_id = $1
```
This captures every order ever placed in the session, not just the current round's orders.

**Part B — no dine SSE emit**: After creating the payment record, the route only calls:
```typescript
eventManager.emitToAdmin('payment:received', {...})
```
The dine SSE stream never receives the event, so the customer screen has no way to know payment was accepted.

### Fix

**File: `src/app/api/sessions/[session_id]/payment/route.ts`**

1. Capture `billingRound` before the `UPDATE` (the UPDATE increments it):
```typescript
const billingRound = session.billing_round;
```

2. Scope the order_ids query to the current round:
```sql
SELECT id FROM orders WHERE session_id = ${sessionId}::uuid AND billing_round = ${billingRound}
```

3. After `emitToAdmin`, also emit to dine:
```typescript
eventManager.emitToDine(sessionId, 'payment:received', {
  billing_round: billingRound,
  order_ids: orderIds,
  amount: Number(payment.amount),
  method: payment.method,
  paid_at: payment.paid_at,
});
```

### Changes Made ✅

**`src/app/api/sessions/[session_id]/payment/route.ts`**
- Added `const billingRound = session.billing_round;` immediately after reading `session` from DB (before the UPDATE which increments the round).
- Changed orders query from `WHERE session_id = ${sessionId}::uuid` to `WHERE session_id = ${sessionId}::uuid AND billing_round = ${billingRound}` so only the current round's orders are recorded.
- Added `eventManager.emitToDine(sessionId, 'payment:received', { billing_round, order_ids, amount, method, paid_at })` after the existing `emitToAdmin` call.

---

## Issue 9 — Missing `GET /api/sessions/[session_id]/payments` Route

### Symptom
No endpoint exists to fetch the full payment history for a session. Dine page cannot restore paid-round state on refresh. Admin bill modal cannot show which orders are already paid.

### Fix

**New file: `src/app/api/sessions/[session_id]/payments/route.ts`** (plural — different path from existing `payment/`)

```typescript
export async function GET(req, { params }) {
  const { session_id } = await params;
  const rows = await sql`
    SELECT id AS payment_id, billing_round, order_ids, amount, method, paid_at
    FROM payments
    WHERE session_id = ${session_id}::uuid
    ORDER BY paid_at ASC
  `;
  return NextResponse.json(rows);
}
```

No auth required — same public access pattern as `payment/route.ts`.

### Changes Made ✅

**New file: `src/app/api/sessions/[session_id]/payments/route.ts`**
- Created `GET` handler that queries `payments WHERE session_id = $1 ORDER BY paid_at ASC`.
- Returns `payment_id, billing_round, order_ids, amount, method, paid_at` — `amount` cast to `Number` to avoid Postgres decimal string.
- No auth required; follows the same public-endpoint pattern as `payment/route.ts`.

---

## Issue 10 — `api.ts` Missing `SessionPayment` Type and `getSessionPayments()`

### Symptom
Client code cannot call the new payments list endpoint.

### Fix

**File: `src/lib/api.ts`**

Add interface:
```typescript
export interface SessionPayment {
  payment_id: string;
  billing_round: number;
  order_ids: string[];
  amount: number;
  method: string;
  paid_at: string;
}
```

Add function:
```typescript
getSessionPayments: (sessionId: string) =>
  fetchJson<SessionPayment[]>(`/api/sessions/${sessionId}/payments`),
```

### Changes Made ✅

**`src/lib/api.ts`**
- Added `SessionPayment` interface (`payment_id`, `billing_round`, `order_ids`, `amount`, `method`, `paid_at`) in the PAYMENTS section.
- Added `getSessionPayments(sessionId)` function calling `GET /api/sessions/${sessionId}/payments`, typed as `ApiResponse<SessionPayment[]>`.

---

## Issue 11 — `LiveOrder` Interface and Admin Orders SQL Missing `billing_round`

### Symptom
Admin bill modal cannot group orders by billing round to show paid/unpaid split.

### Fix

**File: `src/components/admin/LiveOrders.tsx`** — add to `LiveOrder` interface:
```typescript
billing_round: number;
```

**File: `src/app/api/admin/orders/route.ts`** — add to SELECT:
```sql
o.billing_round,
```
And include it in the mapped response object.

### Changes Made ✅

**`src/components/admin/LiveOrders.tsx`** — added `billing_round: number;` to the `LiveOrder` interface (line 13).

**`src/app/api/admin/orders/route.ts`** — added `o.billing_round,` to the SELECT column list. The existing `...o` spread in the `mapped` block automatically includes it in the response — no additional mapping change needed.

---

## Issue 12 — `useBilling.ts` Has No `sessionId` Param, No DB Restore, No `applyPaymentReceived`

### Symptom
Paid-round state is lost on page refresh. Admin-triggered payments cannot update the dine UI in real time.

### Root Cause
`useBilling` only tracks billing state in local React state with no persistence or DB sync.

### Fix

**File: `src/hooks/dine/useBilling.ts`**

Change signature: `useBilling(orders: OrderBatch[], sessionId: string | null)`

1. Add a `useEffect` that fires when `sessionId` becomes available:
```typescript
useEffect(() => {
  if (!sessionId) return;
  api.getSessionPayments(sessionId).then((res) => {
    if (res.status !== 200 || !res.data) return;
    const rounds = new Set(res.data.map((p) => p.billing_round));
    setPaidRounds(rounds);
    const maxRound = Math.max(0, ...rounds);
    setCurrentBillingRound(maxRound + 1);
  });
}, [sessionId]);
```

2. Expose new callback:
```typescript
const applyPaymentReceived = useCallback((billingRound: number) => {
  setPaidRounds((prev) => new Set([...prev, billingRound]));
  setCurrentBillingRound((prev) => Math.max(prev, billingRound + 1));
}, []);
```

Return `applyPaymentReceived` in the hook's return value.

### Changes Made ✅

**`src/hooks/dine/useBilling.ts`**
- Added `useEffect` and `useCallback` to imports; added `import * as api from "@/lib/api"`.
- Changed signature from `useBilling(orders)` to `useBilling(orders, sessionId: string | null)`.
- Added `useEffect` on `sessionId`: calls `api.getSessionPayments(sessionId)`, restores `paidRounds` as a Set of `billing_round` values, and sets `currentBillingRound` to `maxRound + 1`.
- Added `applyPaymentReceived(billingRound)` callback: adds the round to `paidRounds` and bumps `currentBillingRound` to at least `billingRound + 1`.
- Returned `applyPaymentReceived` from the hook.

---

## Issue 13 — `dine/page.tsx`: `useBilling` Ignores `sessionId`; No `payment:received` SSE Case

### Symptom
Even after fix #12, the dine page doesn't pass `sessionId` correctly and the SSE payment event is not handled.

### Fix

**File: `src/app/dine/page.tsx`**

1. `useBilling` call already passes `sessionId` as second arg — ensure it's wired once hook accepts it. Destructure `applyPaymentReceived`:
```typescript
const { currentBillingRound, paidRounds, ..., applyPaymentReceived } = useBilling(orders, sessionId);
```

2. In the `useDineStream` `onEvent` handler, add:
```typescript
} else if (event.type === 'payment:received') {
  applyPaymentReceived(event.data.billing_round);
}
```

### Changes Made ✅

**`src/app/dine/page.tsx`**
- `useBilling` call changed from `useBilling(orders)` to `useBilling(orders, sessionId)`. `applyPaymentReceived` destructured from the return value.
- Added `payment:received` SSE case in `useDineStream` `onEvent` handler — calls `applyPaymentReceived(event.data.billing_round)`.

---

## Issue 14 — `TablesGrid.tsx`: No Per-Order Paid Display; "Mark as Paid" Sends Full Total

### Symptom
Admin bill modal shows a flat order list with no paid/unpaid distinction. If some orders were already paid (e.g. partial payment), clicking "Mark as Paid" sends the full session total again instead of just the unpaid remainder.

### Fix

**File: `src/components/admin/TablesGrid.tsx`**

1. Add state:
```typescript
const [billPayments, setBillPayments] = useState<SessionPayment[]>([]);
```

2. When `billTable` is set and has `active_session_id`, fetch:
```typescript
api.getSessionPayments(active_session_id).then((res) => {
  if (res.status === 200 && res.data) setBillPayments(res.data);
});
```

3. Derive paid order IDs:
```typescript
const paidOrderIds = new Set(billPayments.flatMap((p) => p.order_ids));
```

4. In the bill modal order list, show a "Paid" badge per order:
```tsx
{paidOrderIds.has(order.id) && <span className="badge-paid">Paid</span>}
```

5. Fix "Mark as Paid" to send only the unpaid balance:
```typescript
const unpaid = tableTotal(billTable.label) - (billTable.session_total_paid || 0);
await api.recordPayment(billTable.active_session_id, unpaid, 'cash');
```

6. Hide the button when nothing is owed:
```tsx
{unpaid > 0 && <button onClick={handleMarkPaid}>Mark as Paid</button>}
```

### Changes Made ✅

**`src/components/admin/TablesGrid.tsx`**
- Removed unused `React` import; added `SessionPayment` to the `api` import.
- Added `billPayments: SessionPayment[]` state.
- Added `useEffect` on `billTable?.active_session_id` — fetches `api.getSessionPayments()` when the bill modal opens, clears on close.
- Bill modal body: wrapped in an IIFE to derive `paidOrderIds` (Set of paid order UUIDs from `billPayments`) and `unpaid` balance. Each order row now shows a `badge-paid` badge when `paidOrderIds.has(o.id)`. Order IDs changed from `#{o.id.slice(0, 8)}` to `Order #N`. Added "Paid so far" line when partial payment exists.
- Bill modal footer: `unpaid` derived as `grandTotal - session_total_paid`. "Mark as Paid" button now sends `unpaid` (not `grandTotal`) and shows the amount when partial. Button hidden when `unpaid <= 0`. `alert()` calls removed — payment failure is silent (state unchanged, admin can retry). "Reset Table" button moved alongside the disabled "Paid" button.

---

## Implementation Order (Issues 8–14)

1. Issue 8 — `payment/route.ts`: scope order_ids + emit to dine SSE
2. Issue 9 — new `payments/route.ts` GET endpoint
3. Issue 10 — `api.ts`: `SessionPayment` type + `getSessionPayments()`
4. Issue 11 — `LiveOrders.tsx` + `admin/orders/route.ts`: add `billing_round`
5. Issue 12 — `useBilling.ts`: sessionId param + DB restore + `applyPaymentReceived`
6. Issue 13 — `dine/page.tsx`: wire sessionId + SSE handler
7. Issue 14 — `TablesGrid.tsx`: per-order paid display + fix amount

---

## Verification (Issues 8–14)

1. **SSE payment sync**: Customer opens Bill → pays → dine page immediately locks paid orders without refresh.
2. **Refresh restore**: Customer pays, refreshes dine page → paid rounds correctly shown as paid (not reset).
3. **Admin bill modal**: Open running bill for an active table → orders grouped by round with "Paid" badges on settled ones.
4. **Partial payment**: One round paid, new order placed → "Mark as Paid" amount equals only the new unpaid total, not the full session total.
5. **Button hidden when settled**: After full payment, "Mark as Paid" button disappears.

---

## Issue 15 — Dine Page Refresh: Orders Lost on Normal Refresh; No Clear Feedback When Admin Resets Table

### Two Scenarios This Issue Covers

| Scenario | What happens today | What should happen |
|---|---|---|
| Customer refreshes normally (session still active) | Orders vanish — tracker is empty, admin still sees them | Orders restored from DB, customer sees their session exactly as before |
| Admin resets the table, customer then refreshes (or was offline when reset happened) | `sessionStorage` still holds old session ID → page tries to resume a closed session silently | Customer sees a clear "Session Ended" screen explaining staff cleared the table |

The **live** case (tab open when admin hits Reset) already works: the reset route emits `session:closed` via SSE → dine page clears sessionStorage and shows session-error. The **refresh after reset** case is broken because sessionStorage is never validated against the DB on mount.

---

### Root Cause — Normal Refresh (Orders Lost)

`useOrders` stores the `orders` array in plain React state (`useState`). On every page mount it starts as `[]`. The `init()` function in `dine/page.tsx` restores session identity from `sessionStorage` (`riwayat_session_id`, `riwayat_table_id`, `riwayat_user`) but never fetches existing orders for that session. There is no `GET` endpoint that returns a session's orders in the shape `useOrders` expects.

### Root Cause — Refresh After Admin Reset

`init()` reads `storedSessionId` from sessionStorage and proceeds without ever checking whether that session is still open in the DB. If admin closed the session, `createSession` would silently create a fresh session for the same customer — or the page would resume and then fail confusingly when orders can't be placed. There is no `"session-ended"` screen, so the customer has no idea why things look wrong.

---

### Fix

**Step 1 — New route: `GET /api/sessions/[session_id]/orders`**

New file: `src/app/api/sessions/[session_id]/orders/route.ts`

Also add a `closed_at` field to the response so the caller can detect a closed session:

```typescript
// First check session status
const session = await sql`
  SELECT closed_at FROM sessions WHERE id = ${session_id}::uuid
`;
if (!session[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

// Return session status + orders
const orders = await sql`
  SELECT
    o.id AS order_id, o.status, o.total, o.billing_round, o.placed_at,
    json_agg(...) AS items
  FROM orders o JOIN order_items oi ON oi.order_id = o.id
  WHERE o.session_id = ${session_id}::uuid AND o.status != 'cancelled'
  GROUP BY o.id ORDER BY o.placed_at ASC
`;

return NextResponse.json({
  closed_at: session[0].closed_at,   // null = still open
  orders,
});
```

No auth required.

**Step 2 — Add types + `getSessionOrders()` to `api.ts`**

```typescript
export interface SessionOrder {
  order_id: string;
  status: string;
  total: number;
  billing_round: number;
  placed_at: string;
  items: Array<{ menuId: string; name: string; price: number; qty: number; note?: string }>;
}

export interface SessionOrdersResponse {
  closed_at: string | null;
  orders: SessionOrder[];
}

getSessionOrders: (sessionId: string) =>
  fetchJson<SessionOrdersResponse>(`/api/sessions/${sessionId}/orders`),
```

**Step 3 — Add new `Screen` state and `restoreOrders` in `useOrders`**

In `dine/page.tsx`, add `"session-ended"` to the `Screen` type union — distinct from `"session-error"` (which means invalid/expired QR). Render it with copy like:

> **"Your session has been cleared by staff."**
> Your table is now free. Please scan the QR code again if you'd like to place a new order.

No re-scan button needed — the customer knows what to do.

In `src/hooks/dine/useOrders.ts`, add:

```typescript
const restoreOrders = useCallback((fetched: SessionOrder[]) => {
  const batches: OrderBatch[] = fetched.map((o) => ({
    id: o.order_id,
    items: o.items.map((i) => ({ menuId: i.menuId, name: i.name, price: i.price, qty: i.qty, note: i.note })),
    total: o.total,
    status: API_STATUS_MAP[o.status] ?? (o.status as OrderBatch["status"]),
    placedAt: new Date(o.placed_at).getTime(),
    billingRound: o.billing_round,
  }));
  setOrders(batches);
  setNextOrderId(batches.length + 1);
}, []);
```

Return `restoreOrders` from the hook.

**Step 4 — Validate session + restore orders in `dine/page.tsx` init**

After `storedSessionId` is read from sessionStorage (the returning-user path), before proceeding:

```typescript
if (storedSessionId) {
  const sessionRes = await api.getSessionOrders(storedSessionId);

  if (sessionRes.status === 404) {
    // Session ID in storage is invalid (stale/expired)
    sessionStorage.clear();
    setActiveScreen("session-error");
    return;
  }

  if (sessionRes.status === 200 && sessionRes.data?.closed_at) {
    // Admin reset the table — session is closed
    sessionStorage.removeItem("riwayat_session_id");
    sessionStorage.removeItem("riwayat_table_id");
    // Keep riwayat_user so the customer doesn't re-enter name/phone if they scan again
    setActiveScreen("session-ended");
    return;
  }

  // Session is open — restore orders
  if (sessionRes.status === 200 && sessionRes.data?.orders.length) {
    restoreOrders(sessionRes.data.orders);
  }
}
```

This single check handles both scenarios: closed session → `"session-ended"` screen; open session → orders restored seamlessly.

### What This Also Fixes

- `OrderTracker` correctly shows the last known status for each batch instead of being empty.
- `useBilling` (issue #12) restores `paidRounds` and `currentBillingRound` correctly because order data is present before `useBilling`'s own `useEffect` fires.
- Customer cannot accidentally re-order the same items by thinking the page reset.
- Customer gets a clear "Session Cleared" message when staff reset the table and the customer then refreshes or opens a new tab.

> **Behavior note:** The `session-ended` screen appears on **page load** (refresh or new tab after a reset). If the customer's tab is open when admin hits Reset, the existing `session:closed` SSE event fires and shows the `session-error` screen instead — this is pre-existing live behaviour and intentionally distinct. Unifying both paths to `session-ended` is a possible follow-up.

### Changes Made ✅

**`src/app/api/sessions/[session_id]/orders/route.ts`** — Rewrote entirely:
- First queries `sessions` for `closed_at`; returns 404 if not found
- Returns `{ closed_at, orders }` shape
- SQL uses `o.id AS order_id`, `json_agg` for items with `menuId` alias for `menu_item_id`, `ORDER BY placed_at ASC`, `status != 'cancelled'` filter

**`src/lib/api.ts`**
- Added `SessionOrder` interface (`order_id`, `status`, `total`, `billing_round`, `placed_at`, `items[]`)
- Added `SessionOrdersResponse` interface (`closed_at: string | null`, `orders: SessionOrder[]`)
- Updated `getSessionOrders` return type to `ApiResponse<SessionOrdersResponse>`
- Added `order_id?: string` to the `Order` interface (the backend returns this field; the issue 1a fix used it but the type was missing it)

**`src/hooks/dine/useOrders.ts`**
- Added `import type { SessionOrder }` from api
- Added `restoreOrders(fetched: SessionOrder[])` callback: maps each `SessionOrder` to `OrderBatch` (using `API_STATUS_MAP` for status, `Number(i.price)` for price), calls `setOrders` and resets `nextOrderId` to `batches.length + 1`
- Returned `restoreOrders` from the hook

**`src/app/dine/page.tsx`**
- Added `"session-ended"` to the `Screen` type union
- Destructured `restoreOrders` from `useOrders()`
- In `init()`, after `storedSessionId` is read: calls `api.getSessionOrders(storedSessionId)` — 404 clears storage and shows `session-error`; `closed_at` non-null clears session/table from storage and shows `session-ended`; 200 with orders calls `restoreOrders()`
- Added `session-ended` screen: "Session Cleared" heading with door-open icon, instructs customer to re-scan QR

---

## Implementation Order (Issues 8–15)

1. Issue 8 — `payment/route.ts`: scope order_ids + emit to dine SSE
2. Issue 9 — new `payments/route.ts` GET endpoint
3. Issue 10 — `api.ts`: `SessionPayment` type + `getSessionPayments()`
4. Issue 11 — `LiveOrders.tsx` + `admin/orders/route.ts`: add `billing_round`
5. Issue 12 — `useBilling.ts`: sessionId param + DB restore + `applyPaymentReceived`
6. Issue 13 — `dine/page.tsx`: wire sessionId + SSE handler
7. Issue 14 — `TablesGrid.tsx`: per-order paid display + fix amount
8. Issue 15 — new `orders` GET route + `restoreOrders` + `session-ended` screen + init validation

---

## Verification (Issues 8–15)

1. ✅ **SSE payment sync**: Customer opens Bill → pays → dine page immediately locks paid orders without refresh.
2. ✅ **Refresh restore (billing)**: Customer pays, refreshes dine page → paid rounds correctly shown as paid (not reset).
3. ✅ **Admin bill modal**: Open running bill for an active table → orders show `Order #N` labels with "Paid" badges on settled ones.
4. ✅ **Partial payment**: One round paid, new order placed → "Mark as Paid" button shows only the new unpaid amount (e.g. `Mark as Paid (PKR 800)`), not the full session total.
5. ✅ **Button hidden when settled**: After full payment, "Mark as Paid" button replaced by disabled "✓ Paid" + "Reset Table".
6. ✅ **Order restore on refresh**: Customer places orders → refreshes browser → tracker shows all previous orders with correct statuses.
7. ⚠️ **Session-ended screen**: Shows correctly when customer refreshes/reopens tab after admin reset. If the customer's tab is open when reset fires, the pre-existing `session-error` screen appears instead (SSE path). See behaviour note in issue 15.

---

## Test Suite

Run `npm test` — 74/74 must still pass. The sessions route change (Issue 6) adds eventManager emission which is non-breaking. The dine page change (Issue 7) adds an early API call but doesn't change any API contract. Issues 8–15 add new endpoints and extend existing hooks/components without removing existing API contracts.

---

## Issue 16 — QR Token UUID Exposed in Dine Page URL

### Symptom

After scanning a QR code the browser address bar shows:
```
http://localhost:3000/dine?table=T04&token=70ac7fb3-88b2-4e3a-80b7-e7462856e66d
```
The full 36-character UUID `qr_token` is visible in browser history, screenshots, and to anyone glancing at the screen.

### Why It Happens

The QR code is generated in `src/app/api/admin/tables/[id]/qr/route.ts` by building a URL string directly from the table record:
```typescript
`${baseUrl}/dine?table=${table.id}&token=${table.qr_token}`
```
`qr_token` is a raw UUID column in `restaurant_tables`. The dine page reads it with `params.get("token")`, uses it for one table-status check (`GET /api/tables/[qr_token]`) and one session creation call (`POST /api/sessions`). After that it is **never needed again** — all subsequent requests (orders, payments, alerts) use `riwayat_session_id` stored in sessionStorage. The UUID only needs to be in the URL for the very first page load.

The `table=T04` param is also redundant — the token lookup already returns the table label.

### Options Considered

| Option | Verdict |
|--------|---------|
| Base62-encode the UUID (no schema change) | Still ~22 chars, still obviously a long token |
| URL fragment `#token=...` | Not sent to server in HTTP requests but still visible in browser; breaks standard routing |
| Server-side redirect (`/scan/[token]` sets cookie → redirect to `/dine`) | Cleanest UX but large architectural change requiring cookie-based auth on dine page |
| **Short token column (recommended)** | 8-char alphanumeric, clean URL, minimal schema change |

### Fix

Add a `short_token` column to `restaurant_tables` (8-char base62, e.g. `aB3kP9qR`). The QR URL becomes:
```
http://localhost:3000/dine?t=aB3kP9qR
```

**Files to change:**

| File | Change |
|------|--------|
| DB migration | `ALTER TABLE restaurant_tables ADD COLUMN short_token VARCHAR(10) UNIQUE NOT NULL` — backfill with `crypto.randomBytes(6).toString('base64url').slice(0, 8)` |
| `src/app/api/admin/tables/[id]/qr/route.ts` | Build URL as `` `/dine?t=${table.short_token}` `` — drop `table=` param |
| `src/app/api/admin/tables/[id]/regenerate-qr/route.ts` | Regenerate `short_token` alongside `qr_token` |
| New `src/app/api/tables/s/[short_token]/route.ts` | Same shape as existing UUID lookup route but queries `WHERE short_token = ${short_token}` |
| `src/app/api/sessions/route.ts` | Accept `short_token` in body, look up table by `short_token` column |
| `src/app/dine/page.tsx` | Read `params.get("t") ?? params.get("token")` — fallback keeps old printed QR codes working |
| `src/lib/api.ts` | Update `getTableByQR` endpoint path to `/api/tables/s/${token}` |

**Backward compatibility:** The `params.get("t") ?? params.get("token")` fallback means any QR codes already printed with the old `?token=UUID` URL keep working until they are physically replaced or regenerated.

---

## Issue 16 — QR Token UUID Exposed in Dine Page URL (Implemented)

### What Was Done

Used a server-side redirect instead of the short_token approach above. A new API route `GET /api/scan/[token]` sets a short-lived cookie (`rw_qr_token`, 2-min TTL, non-HttpOnly) and returns a 302 redirect to `/dine`. The browser follows the redirect instantly — the UUID is visible for under a second during the redirect, then the URL bar shows `/dine` cleanly.

### Changes Made ✅

**New `src/app/api/scan/[token]/route.ts`** — GET handler: validates UUID format, sets `rw_qr_token` cookie, returns 302 to `/dine`.

**`src/app/api/admin/tables/[id]/qr/route.ts`** — QR URL changed from `` `${baseUrl}/dine?table=${tableId}&token=${table.qr_token}` `` to `` `${baseUrl}/api/scan/${table.qr_token}` ``.

**`src/app/dine/page.tsx`** — Token reading changed from `params.get("token")` to `document.cookie` lookup for `rw_qr_token` (consumed immediately after reading), with `params.get("token")` fallback for old printed QR codes. `setTableNumber` now uses `tableCheck.data.label` from the API response instead of the URL param.

---

## Issue 17 — Table Card Shows Previous Session's Orders After Reset + New Session

### Symptom

Admin resets a table. New customer scans QR and a new session starts. The table card immediately shows the old session's order count and running total instead of starting fresh.

### Root Cause

`tableOrders()` in `TablesGrid.tsx` filtered only by `table_number` (the label like "T04"), never by session. The `orders` array in `admin/page.tsx` is fetched once on auth and never purged. After a reset, old orders for the same table label remain in the array. When the new session starts, `isActive` becomes true again and those stale orders are counted.

Additionally, `o.session_id` was not included in the `GET /api/admin/orders` SQL response, so there was no field available to filter on.

### Changes Made ✅

**`src/app/api/admin/orders/route.ts`** — Added `o.session_id` to the SELECT. The existing `...o` spread in the mapped response includes it automatically.

**`src/components/admin/TablesGrid.tsx`** — `tableOrders`, `tableTotal`, and `firstOrderTime` now take a `sessionId: string | null` second parameter. When `sessionId` is null (table is empty/reset), they return empty. When set, they filter `o.session_id === sessionId` in addition to the label match. All six call sites updated to pass `t.active_session_id ?? null` (or `billTable.active_session_id ?? null` in the bill modal).
