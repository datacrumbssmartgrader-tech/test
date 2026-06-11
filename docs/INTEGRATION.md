# AI-Restaurant — Integration Status

**Backend:** 74/74 tests passing ✅  
**Frontend:** All integration gaps resolved ✅

---

## Client-Side Integration

| Feature | API Endpoint | Status | Notes |
|---------|-------------|--------|-------|
| QR token validation | `GET /api/tables/:qr_token` | ✅ | On page load |
| Session creation | `POST /api/sessions` | ✅ | Duplicate-safe (resumes existing, returns real customer_id) |
| Menu fetch | `GET /api/menu` | ✅ | Fetched on init |
| Place order | `POST /api/orders` | ✅ | via useOrders hook |
| Real-time order status | `GET /api/dine/stream/:id` | ✅ | via useDineStream |
| Call waiter | `POST /api/admin/alerts` | ✅ | type: 'waiter' |
| File complaint | `POST /api/admin/alerts` | ✅ | type: 'complaint' |
| Request bill | `POST /api/admin/alerts` | ✅ | type: 'bill' |
| Record payment | `POST /api/sessions/:id/payment` | ✅ | via PaymentSheet |
| Session restore | sessionStorage | ✅ | Survives page refresh |
| Session closed by admin | SSE `session:closed` | ✅ | Shows session-error screen, clears storage |

## Admin-Side Integration

| Feature | API Endpoint | Status | Notes |
|---------|-------------|--------|-------|
| Login | `POST /api/auth/login` | ✅ | PIN-based, JWT cookie — real backend (no hardcoded check) |
| Session restore | `GET /api/auth/me` | ✅ | On mount via useAuth |
| Logout | `POST /api/auth/logout` | ✅ | |
| Alert badge init | `GET /api/admin/alerts` | ✅ | Count fetched from DB on login, not starting at 0 |
| Live orders | `GET /api/admin/orders` | ✅ | Initial load + SSE |
| Advance order status | `PATCH /api/orders/:id` | ✅ | Dropdown in card |
| Cancel order | `PATCH /api/orders/:id` | ✅ | Cancel button |
| Admin SSE stream | `GET /api/admin/stream` | ✅ | Handles all 6 event types |
| Tables list | `GET /api/admin/tables` | ✅ | Auto-refreshes on `table:update` SSE |
| Reset table | `POST /api/admin/tables/:id/reset` | ✅ | Closes session, emits SSE to dine client |
| Regenerate QR | `POST /api/admin/tables/:id/regenerate-qr` | ✅ | |
| Menu CRUD | `GET/POST/PUT/DELETE /api/admin/menu` | ✅ | Full CRUD |
| Menu auto-refresh | SSE `menu:item_*` | ✅ | MenuManager re-fetches on any menu SSE event |
| Toggle availability | `PATCH /api/admin/menu/:id` | ✅ | |
| Image upload | `POST /api/upload/image` | ✅ | Cloudinary |
| Alerts list | `GET /api/admin/alerts` | ✅ | Undismissed only |
| Dismiss alert | `PATCH /api/admin/alerts/:id` | ✅ | |
| Dismiss all | `POST /api/admin/alerts/dismiss-all` | ✅ | |
| Payments list | `GET /api/admin/payments` | ✅ | Auto-refreshes on `payment:received` SSE |
| Excel exports | `export/excel` endpoints | ✅ | Orders, payments, customers |

## Real-Time Sync Matrix

| Customer Action | Admin Sees Instantly | Via |
|----------------|---------------------|-----|
| Place order | New card in LiveOrders | `order:created` SSE |
| Call waiter | Alert badge increments + AlertsPanel updates | `alert:created` SSE |
| Pay | PaymentsTab refreshes + toast notification | `payment:received` SSE |

| Admin Action | Customer Sees Instantly | Via |
|-------------|------------------------|-----|
| Advance order status | Tracker badge updates | `order:status_changed` SSE |
| Reset table | Session-error screen shown | `session:closed` SSE |

| System Event | Admin Sees Instantly | Via |
|-------------|---------------------|-----|
| Any table status change | TablesGrid refreshes | `table:update` SSE |
| Menu item added/updated/deleted | MenuManager refreshes | `menu:item_*` SSE |

## Resolved Gaps

| Gap | Fix Applied |
|-----|-------------|
| Inline LoginScreen had hardcoded `pin === "1234"` | Replaced with standalone `LoginScreen` component that calls real backend |
| Alert badge started at 0 on page load | Now initialized from `GET /api/admin/alerts` after login |
| `table:update` SSE not handled | TablesGrid now accepts `refreshTick`, re-fetches on every `table:update` |
| `menu:item_*` SSE not handled | MenuManager accepts `refreshTick`, re-fetches on any menu event |
| `payment:received` SSE not handled in PaymentsTab | PaymentsTab accepts `refreshTick`, re-fetches on `payment:received` |
| `session:closed` SSE not handled in dine client | Dine page listens for it → clears storage → shows session-error |
| TablesGrid used wrong reset endpoint | Now calls `POST /api/admin/tables/:id/reset` (closes session + emits SSE) |
| Duplicate session on QR rescan | Sessions route checks for existing open session, resumes it with real customer_id |
| Billing round lost on page refresh | Backend increments `sessions.billing_round` after each payment |
| Alert creation required explicit `table_id` | Backend derives `table_id` from `session_id` when not provided |
| Alert response had no `alert_id` field | Response now includes both `id` and `alert_id` |
