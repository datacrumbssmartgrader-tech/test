# Rooster's Den — Next.js Migration Progress

> **Project:** `riwayat-v2` → Next.js App Router  
> **Stack:** Next.js 15 · TypeScript · Tailwind CSS v4  
> **Last Updated:** 2026-05-29

---

## ✅ Phase 1: Setup & Foundation — COMPLETE

| Task | File | Notes |
|------|------|-------|
| Initialize Next.js project | `next-app/` | App Router, TypeScript, Tailwind v4 |
| Global layout | `src/app/layout.tsx` | Google Fonts (Cormorant, Cinzel, Poppins, Mulish, Fredoka One), remixicon CDN |
| Global styles | `src/app/globals.css` | `@import "tailwindcss"` + all CSS variables |
| Design tokens | `src/app/theme.css` | Migrated from `project/src/theme.css` |
| Landing page CSS | `src/app/globals.css` | Migrated from `project/src/style.css` |
| Dine page CSS | `src/app/dine.css` | Migrated from `project/src/dine.css` |
| Admin page CSS | `src/app/admin.css` | Migrated from `project/src/admin.css` |

---

## ✅ Phase 2: Landing Page (`/`) — COMPLETE

All components live in `src/components/landing/`.

| Component | File | Description |
|-----------|------|-------------|
| `Navbar` | `Navbar.tsx` | Scroll-aware shrink, mobile hamburger menu, active link tracking |
| `Hero` | `Hero.tsx` | Full-screen hero with animated headline + CTA buttons |
| `About` | `About.tsx` | About section with history and story content |
| `SignatureDishes` | `SignatureDishes.tsx` | Showcase cards for 3 signature dishes |
| `MenuPreview` | `MenuPreview.tsx` | Tabbed menu preview with `useState` category switching |
| `Specials` | `Specials.tsx` | Weekend specials & special events section |
| `Gallery` | `Gallery.tsx` | Image lightbox gallery with `useState` open/close |
| `Testimonials` | `Testimonials.tsx` | Customer review cards carousel |
| `ReservationForm` | `ReservationForm.tsx` | 3-step form (details → payment → success) with `useState` |
| `Location` | `Location.tsx` | Map embed, address, opening hours, contact info |
| `Footer` | `Footer.tsx` | Newsletter form, nav links, socials, back-to-top button |

**Page entry:** `src/app/page.tsx` — assembles all 11 components.

---

## ✅ Phase 3: Dine Interface (`/dine`) — COMPLETE

All components live in `src/components/dine/`. Shared menu data extracted to `src/lib/menuData.ts`.

### Data / Lib

| File | Description |
|------|-------------|
| `src/lib/menuData.ts` | All menu items (35 dishes across 9 categories) with types `MenuItem` & `Extra` |

### Components

| Component | File | Description |
|-----------|------|-------------|
| `DineHeader` | `DineHeader.tsx` | Sticky header with logo, table badge, call-waiter button |
| `CategoryTabs` | `CategoryTabs.tsx` | Horizontal scrollable category pill tabs (All, Starters, Grills…) |
| `MenuGrid` | `MenuGrid.tsx` | Filterable/searchable grid of item cards with **Prep Time badge** fix |
| `ItemDetailSheet` | `ItemDetailSheet.tsx` | Bottom sheet: image, tags, prep time, extras add-ons, note, qty+add |
| `CartScreen` | `CartScreen.tsx` | Cart list with qty controls + inline order confirm bottom sheet |
| `OrderTracker` | `OrderTracker.tsx` | Live order tracking by course group with countdown timers |
| `BillScreen` | `BillScreen.tsx` | Bill grouped by round, paid status, request bill / pay now |
| `WaiterSheet` | `WaiterSheet.tsx` | Call waiter OR file complaint (with complaint form fix) |
| `PaymentSheet` | `PaymentSheet.tsx` | Card payment form with card network detection, processing state |

**Page entry:** `src/app/dine/page.tsx` — full state machine:
- Screen navigation: `menu | cart | tracker | bill`
- Cart state: add, quick-add, update qty, remove
- Order simulation: auto-advance status (`received → kitchen → on-its-way → served`)
- Billing rounds & paid round tracking
- Toast notification system
- Table number read from URL `?table=T01`

---

## 🔲 Phase 4: Admin Dashboard (`/admin`) — IN PROGRESS

All components will live in `src/components/admin/`.

| Component | File | Status |
|-----------|------|--------|
| `LoginScreen` | `LoginScreen.tsx` | ⏳ Started (scaffolded) |
| `AdminSidebar` | `AdminSidebar.tsx` | ⏳ Started (scaffolded) |
| `AdminTopbar` | `AdminTopbar.tsx` | ⏳ Started (scaffolded) |
| `LiveOrders` | `LiveOrders.tsx` | ⏳ Started (scaffolded) |
| `TablesGrid` | `TablesGrid.tsx` | ⏳ Started (scaffolded) |
| `MenuManager` | `MenuManager.tsx` | ⏳ Started (scaffolded) |
| `AlertsPanel` | `AlertsPanel.tsx` | ⏳ Started (scaffolded) |
| `OrderHistory` | `OrderHistory.tsx` | ⏳ Started (scaffolded) |
| `PaymentsTab` | `PaymentsTab.tsx` | ⏳ Started (scaffolded) |

**Page entry:** `src/app/admin/page.tsx` — not started.

Note: Initial scaffolding added for the admin components listed above. Next steps: flesh out `LoginScreen`, wire sidebar/topbar navigation, implement LiveOrders and TablesGrid functionality, then add MenuManager, Alerts, History and Payments UI.

---

## 🔲 Phase 5: Final Polish — NOT STARTED

- [ ] Verify all Tailwind classes render correctly
- [ ] Check routing between `/`, `/dine`, `/admin`
- [ ] Fix any TypeScript/React warnings
- [ ] Test mobile responsiveness
- [ ] Validate original `FIXES_PLAN.md` items are preserved

---

## Project File Tree (current)

```
next-app/src/
├── app/
│   ├── admin.css               ✅ migrated
│   ├── dine.css                ✅ migrated
│   ├── dine/
│   │   └── page.tsx            ✅ complete
│   ├── favicon.ico
│   ├── globals.css             ✅ migrated
│   ├── layout.tsx              ✅ complete
│   ├── page.tsx                ✅ complete
│   └── theme.css               ✅ migrated
├── components/
│   ├── admin/                  🔲 empty, to be built
│   ├── dine/
│   │   ├── BillScreen.tsx      ✅
│   │   ├── CartScreen.tsx      ✅
│   │   ├── CategoryTabs.tsx    ✅
│   │   ├── DineHeader.tsx      ✅
│   │   ├── ItemDetailSheet.tsx ✅
│   │   ├── MenuGrid.tsx        ✅
│   │   ├── OrderTracker.tsx    ✅
│   │   ├── PaymentSheet.tsx    ✅
│   │   └── WaiterSheet.tsx     ✅
│   └── landing/
│       ├── About.tsx           ✅
│       ├── Footer.tsx          ✅
│       ├── Gallery.tsx         ✅
│       ├── Hero.tsx            ✅
│       ├── Location.tsx        ✅
│       ├── MenuPreview.tsx     ✅
│       ├── Navbar.tsx          ✅
│       ├── ReservationForm.tsx ✅
│       ├── SignatureDishes.tsx ✅
│       ├── Specials.tsx        ✅
│       └── Testimonials.tsx    ✅
└── lib/
    └── menuData.ts             ✅
```

---

## Key Design Decisions

- **`"use client"`** on all interactive components (scroll effects, state, event handlers)
- **Server components** avoided intentionally for simplicity during migration
- **Menu data** extracted to `src/lib/menuData.ts` — shared between `/dine` and landing `MenuPreview`
- **Prep Time badge** preserved on `MenuGrid` cards (from `FIXES_PLAN.md`)
- **Complaint form** preserved in `WaiterSheet` (from `FIXES_PLAN.md`)
- **Order simulation** (status progression) done client-side with `setTimeout` — can be replaced with WebSocket/polling later
- **CSS** kept as vanilla CSS files (no Tailwind utilities on components) to stay 1:1 with original design
