# AI-Restaurant — API Reference

All routes are under `/api/`. Public routes require no auth. Protected routes require a valid `rw_session` JWT cookie (set by `/api/auth/login`).

---

## Authentication

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| POST | `/api/auth/login` | Public | `{ pin: "1234" }` | `{ staff_id, name, role }` + sets cookie |
| GET | `/api/auth/me` | Cookie | — | `{ staff_id, name, role }` |
| POST | `/api/auth/logout` | Cookie | — | `{ success: true }` |

---

## Menu

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| GET | `/api/menu` | Public | — | `{ items: MenuItem[], count }` |
| GET | `/api/admin/menu` | Protected | — | `MenuItem[]` (incl. hidden) |
| POST | `/api/admin/menu` | Protected | `{ name, category, price, description?, image_url?, image_public_id?, type?, available?, hidden? }` | `MenuItem` |
| PUT | `/api/admin/menu/:id` | Protected | Same as POST | `MenuItem` |
| PATCH | `/api/admin/menu/:id` | Protected | `{ available?: bool, hidden?: bool }` | `MenuItem` |
| DELETE | `/api/admin/menu/:id` | Protected | — | `{ success: true }` |

---

## Image Upload

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| POST | `/api/upload/image` | Protected | `FormData` with `file` field | `{ upload: { secureUrl, publicId } }` |

---

## Tables & QR

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| GET | `/api/tables/:qr_token` | Public | — | `{ id, label, status, ... }` |
| GET | `/api/admin/tables` | Protected | — | `Table[]` with session info |
| PATCH | `/api/admin/tables/:id` | Protected | `{ status?, label? }` | `Table` |
| POST | `/api/admin/tables/:id/reset` | Protected | — | `{ success: true }` |
| GET | `/api/admin/tables/:id/qr` | Protected | — | PNG image |
| POST | `/api/admin/tables/:id/regenerate-qr` | Protected | — | `{ qr_token }` |

---

## Sessions

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| POST | `/api/sessions` | Public | `{ qr_token, customer_name, customer_phone, customer_email? }` | `{ session_id, customer_id, table_id, opened_at, message }` |
| GET | `/api/sessions/:id/orders` | Public | — | `Order[]` with nested items |
| POST | `/api/sessions/:id/payment` | Public | `{ amount, payment_method: 'card'\|'cash' }` | `{ payment_id, amount, status, paid_at }` |
| GET | `/api/sessions/:id/payment` | Public | — | `{ payment_id, amount, paid_at }` |

**Notes:**
- `POST /api/sessions` returns existing open session if one exists for the table (duplicate prevention); `customer_id` is always returned (not null)
- `POST /api/sessions/:id/payment` increments `sessions.billing_round` after recording payment

---

## Orders

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| POST | `/api/orders` | Public | `{ session_id, items: [{ menu_item_id, quantity, note? }] }` | `{ id, status, total }` |
| GET | `/api/orders/:id` | Public | — | `Order` with items |
| PATCH | `/api/orders/:id` | Public | `{ status }` | `Order` |
| GET | `/api/admin/orders` | Protected | `?status=active` | `LiveOrder[]` |
| PATCH | `/api/admin/orders/:id/status` | Protected | `{ status }` | `Order` |
| PATCH | `/api/admin/orders/:id/cancel` | Protected | `{ reason? }` | `Order` |
| GET | `/api/admin/orders/export/excel` | Protected | — | `.xlsx` file download |

---

## Alerts

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| GET | `/api/admin/alerts` | Protected | — | `Alert[]` (undismissed only) |
| POST | `/api/admin/alerts` | Public | `{ session_id, type: 'waiter'\|'bill'\|'complaint', message, table_id? }` | `{ id, alert_id, table_id, type, status, message, created_at }` |
| PATCH | `/api/admin/alerts/:id` | Protected | `{ dismissed: true }` | `Alert` |
| POST | `/api/admin/alerts/dismiss-all` | Protected | — | `{ count }` |

**Notes:**
- `table_id` is optional in `POST /api/admin/alerts` — the backend derives it from `session_id` if not provided
- Response includes both `id` and `alert_id` (same value) for compatibility

---

## Payments

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| GET | `/api/admin/payments` | Protected | `?from=&to=` | `Payment[]` |
| PATCH | `/api/admin/payments/:id` | Protected | `{ status }` | `Payment` |
| GET | `/api/admin/payments/export/excel` | Protected | — | `.xlsx` file download |

---

## Customers

| Method | Route | Auth | Payload | Response |
|--------|-------|------|---------|----------|
| GET | `/api/admin/customers` | Protected | `?search=` | `Customer[]` |
| GET | `/api/admin/customers/:id` | Protected | — | `Customer` with session history |
| GET | `/api/admin/customers/export/excel` | Protected | — | `.xlsx` file download |

---

## Real-Time Streams (SSE)

| Method | Route | Auth | Events |
|--------|-------|------|--------|
| GET | `/api/admin/stream` | Protected | `order:created`, `order:status_changed`, `alert:created`, `payment:received`, `table:update`, `menu:item_added`, `menu:item_updated`, `menu:item_deleted` |
| GET | `/api/dine/stream/:session_id` | Public | `order:status_changed`, `session:closed` |

### Admin Stream Event Payloads

```js
// order:created
{ order_id, session_id, table_number, table_id, items: [{name, quantity, price}], total, status, placed_at }

// order:status_changed
{ id, order_id, session_id, status, updated_at }

// alert:created
{ alert_id, session_id, table_id, type, message, created_at }

// payment:received
{ payment_id, session_id, amount, payment_method, paid_at }

// table:update
{ table_id, status, active_session_id }

// menu:item_added / menu:item_updated / menu:item_deleted
{ item_id, name, category }
```

### Dine Stream Event Payloads

```js
// order:status_changed
{ id, order_id, session_id, status }

// session:closed
{ session_id, table_id }
```

---

## Common Error Responses

```json
{ "error": "Missing required fields: ..." }   // 400
{ "error": "Invalid or expired QR token" }    // 404
{ "error": "Table is disabled" }              // 403
{ "error": "Unauthorized" }                   // 401
{ "error": "Not found" }                      // 404
{ "error": "Failed to ..." }                  // 500
```
