# AI-Restaurant — Project Overview

## What It Is

A full-stack QR-based in-restaurant ordering system. Customers scan a QR code at their table, enter their details, browse the menu, place orders, and pay — all from their phone. Staff manage orders, menus, alerts, and tables from an admin dashboard that updates in real time.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Full-stack React — pages + API routes in one project |
| Database | NeonDB (PostgreSQL) | Cloud-hosted relational DB via HTTP (`@neondatabase/serverless`) |
| Image CDN | Cloudinary | Menu item image upload, storage, and CDN delivery |
| Auth | JWT + HTTP-only cookies | PIN-based staff login; `jose` library for signing |
| Real-time | Server-Sent Events (SSE) | Push updates from server to admin + dine clients |
| QR codes | `qrcode` npm package | Server-side per-table QR image generation |
| Exports | `xlsx` | Excel export for orders, payments, and customers |
| Styling | Tailwind CSS v4 + custom CSS | Utility-first with design tokens in CSS variables |

---

## Directory Structure

```
next-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              Root layout (title: AI-Restaurant, fonts, CSS)
│   │   ├── page.tsx                Root → redirects to /admin
│   │   ├── admin/
│   │   │   ├── layout.tsx          Admin layout (imports admin.css)
│   │   │   └── page.tsx            Admin dashboard (auth + SSE + section routing)
│   │   ├── dine/
│   │   │   ├── layout.tsx          Dine layout (imports dine.css)
│   │   │   └── page.tsx            Customer ordering app (~250 lines after refactor)
│   │   └── api/                    All backend routes (Next.js Route Handlers)
│   │       ├── auth/               login, logout, me
│   │       ├── menu/               public menu fetch
│   │       ├── admin/              protected CRUD + SSE stream
│   │       ├── sessions/           session creation + orders + payment
│   │       ├── orders/             order placement + status
│   │       ├── tables/             public QR lookup
│   │       ├── dine/stream/        SSE stream per session
│   │       └── upload/image/       Cloudinary upload
│   │
│   ├── components/
│   │   ├── dine/                   Customer-facing UI components
│   │   └── admin/                  Admin dashboard UI components
│   │
│   ├── hooks/
│   │   └── dine/
│   │       ├── useCart.ts          Cart state + mutations
│   │       ├── useOrders.ts        Order placement + SSE status updates
│   │       └── useBilling.ts       Billing rounds + payment state
│   │
│   └── lib/
│       ├── api.ts                  Centralized API client (all fetch calls)
│       ├── db.ts                   NeonDB SQL client
│       ├── auth.ts                 JWT sign/verify helpers
│       ├── events.ts               SSE event emission system
│       ├── useSSE.ts               SSE hook (useAdminStream, useDineStream)
│       ├── useAuth.tsx             Auth context + hook for admin
│       ├── menuData.ts             34 menu items (seed source + fallback)
│       ├── migration.sql           Database schema
│       └── seed.ts                 Seed script (admin, tables, menu items)
│
├── tests/                          Backend API tests (74/74 passing)
├── docs/                           This documentation
└── package.json
```

---

## Database Schema

### Tables Overview

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `staff` | Admin/staff accounts | id, name, role (admin\|user), pin_hash, active |
| `customers` | Dine-in customer loyalty | id, name, phone (unique), total_sessions, total_spent |
| `restaurant_tables` | Physical tables T01–T12 | id, status (empty\|active\|disabled), qr_token (UUID), active_session_id |
| `sessions` | One visit = one session | id, table_id FK, customer_id FK, billing_round, opened_at, closed_at, total_paid |
| `menu_items` | Menu dishes | id, name, category, price, image_url, type (single\|platter), available, hidden |
| `menu_extras` | Add-on options per item | id, menu_item_id FK, label, price |
| `orders` | Order batches per session | id, session_id FK, table_id FK, billing_round, status, total |
| `order_items` | Line items within orders | id, order_id FK, menu_item_id FK, qty, price, note |
| `payments` | Payment records | id, session_id FK, billing_round, order_ids[], amount, method (card\|cash) |
| `waiter_alerts` | Staff alerts | id, session_id FK, type (waiter\|bill\|complaint), message, dismissed |

### Status Enums

```sql
order_status: received | kitchen | ready | served | cancelled
table_status: empty | active | disabled
alert_type:   waiter | bill | complaint
staff_role:   admin | user
payment_method: card | cash
```

---

## Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
JWT_SECRET=your_long_random_secret_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_BASE_URL=https://yourapp.vercel.app
```

---

## Setup & Running

```bash
# Install dependencies
cd next-app && npm install

# Run database migration
npx tsx src/lib/migration.sql   # or run SQL directly in NeonDB console

# Seed initial data (admin PIN: 1234, 12 tables, 34 menu items)
npx tsx src/lib/seed.ts

# Start development server
npm run dev

# Build for production
npm run build

# Run backend tests
npm run test            # all 74 tests
npm run test:phase-b    # individual phase
```

---

## User Roles

| Role | Access | Entry Point |
|------|--------|-------------|
| **Customer** | Dine page only | `/dine?table=T01&token=<uuid>` (via QR scan) |
| **Staff (user)** | Admin dashboard, order management | `/admin` |
| **Staff (admin)** | Full admin access | `/admin` |

---

## Test Coverage

| Phase | Area | Tests | Status |
|-------|------|-------|--------|
| B | Auth (login, logout, /me) | 7 | ✅ passing |
| C | Menu CRUD + Cloudinary upload | 8 | ✅ passing |
| D | QR generation + tables | 8 | ✅ passing |
| E | Orders + sessions | 9 | ✅ passing |
| F | Customers + Excel export | 7 | ✅ passing |
| G | Alerts + payments | 10 | ✅ passing |
| H | Real-time SSE streams | 9 | ✅ passing |
| I | Error handling + security | 16 | ✅ passing |
| **Total** | | **74/74** | ✅ |
