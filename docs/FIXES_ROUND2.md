# AI-Restaurant — Bug Fixes & UI Improvements (Round 2)

> **Context for fresh sessions:** This project is a Next.js 16 full-stack QR ordering app. Admin dashboard at `/admin`, customer dine page at `/dine`. Real-time via SSE. All previous refactoring is complete (74/74 tests pass). This document covers 7 issues found during manual testing.

## Progress

| # | Issue | Status |
|---|-------|--------|
| 1a | `useOrders.ts` reads `id` instead of `order_id` from POST response | ❌ Remaining |
| 1b | `LiveOrders` still uses `<select>` dropdown instead of advance button | ❌ Remaining |
| 2 | Admin section spacing — inline `style` display, `.section` class never applied | ✅ Done |
| 3 | Tables tick not incremented on `order:created` / `payment:received` | ❌ Remaining |
| 4 | `OrderHistory` shows UUID slugs (`#e3bb1779`) | ✅ Done |
| 5 | Alerts: no fade transition on resolve; dismiss-all clears active alerts | ✅ Done |
| 6 | `sessions/route.ts` never emitted `table:update` SSE | ✅ Done |
| 7 | Disabled table shows wrong error; no early status check | ✅ Done |

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

## Test Suite

Run `npm test` — 74/74 must still pass. The sessions route change (Issue 6) adds eventManager emission which is non-breaking. The dine page change (Issue 7) adds an early API call but doesn't change any API contract.
