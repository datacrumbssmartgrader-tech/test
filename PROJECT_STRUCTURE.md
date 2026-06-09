# Next.js Project Structure - Riwayat (Rooster's Den)

## Overview
This is a Next.js-based restaurant management system with three main interfaces:
- **Landing Page**: Public-facing marketing and reservation site
- **Admin Panel**: Staff interface for order management and menu control
- **Dine Page**: Customer-facing ordering interface

---

## Project Root Files & Configuration

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, scripts, and dependencies |
| `next.config.ts` | Next.js configuration and build settings |
| `tsconfig.json` | TypeScript compiler configuration |
| `eslint.config.mjs` | ESLint rules for code quality |
| `postcss.config.mjs` | PostCSS configuration for Tailwind CSS |
| `README.md` | Basic Next.js setup documentation |
| `PROGRESS.md` | Project progress tracking notes |
| `AGENTS.md` | Custom AI agent configurations |
| `CLAUDE.md` | Claude-specific configuration or notes |
| `convert.js` | Utility script for converting project files |
| `split_admin.js` | Script to split admin-related code |
| `split_dine.js` | Script to split dine-related code |
| `split_globals.js` | Script to split global utilities |
| `next-env.d.ts` | TypeScript definitions for Next.js |

---

## Directory Structure

### `/public`
**Purpose**: Static assets served directly by Next.js

```
public/
└── assets/          # Static images, icons, and other media files
```

---

### `/src` - Main Application Source Code

#### `/src/app` - Next.js App Router (Pages & Layouts)
**Purpose**: Contains page routes, layouts, and app-level configuration

**Root Layout Files:**
- `layout.tsx` - Root layout component applied to all pages
- `page.tsx` - Landing page (home route `/`)
- `globals.css` - Global CSS styles applied app-wide
- `globals/` - Global-level CSS stylesheets
  - `base.css` - Base/reset CSS
  - `landing.css` - Landing page-specific styles
- `theme.css` - Theme configuration and CSS variables

**Admin Section** (`/src/app/admin/`):
- `layout.tsx` - Layout wrapper for admin pages
- `page.tsx` - Main admin panel page (`/admin`)
- `admin.css` - Admin panel core styles
- `adminClient.ts` - Admin page client-side logic and initialization
- `admin_styles/` - Admin-specific CSS modules
  - `login.css` - Admin login screen styles
  - `orders.css` - Order management styles
  - `rest.css` - Rest/default admin styles
  - `shell.css` - Admin shell/container styles
  - `tables.css` - Table management styles

**Dine Section** (`/src/app/dine/`):
- `layout.tsx` - Layout wrapper for dine pages
- `page.tsx` - Main customer ordering page (`/dine`)
- `dine.css` - Dine page core styles
- `dine_styles/` - Dine-specific CSS modules
  - `base.css` - Base dine styles
  - `bill.css` - Bill/checkout screen styles
  - `menu.css` - Menu display styles
  - `nav.css` - Navigation bar styles
  - `sheets.css` - Bottom sheet/modal styles
  - `tracker.css` - Order tracker styles

---

#### `/src/components` - React Components
**Purpose**: Reusable UI components organized by feature

**Admin Components** (`/src/components/admin/`):
| Component | Purpose |
|-----------|---------|
| `AdminSidebar.tsx` | Left sidebar navigation for admin panel |
| `AdminTopbar.tsx` | Top header bar for admin interface |
| `AlertsPanel.tsx` | Display system alerts and notifications |
| `LiveOrders.tsx` | Real-time order display and management |
| `LoginScreen.tsx` | Admin authentication/PIN entry screen |
| `MenuManager.tsx` | Interface for managing menu items |
| `OrderHistory.tsx` | View and search past orders |
| `PaymentsTab.tsx` | Payment processing and settlement |
| `TablesGrid.tsx` | Visual table management grid |

**Dine Components** (`/src/components/dine/`):
| Component | Purpose |
|-----------|---------|
| `DineHeader.tsx` | Header for customer dining interface |
| `CategoryTabs.tsx` | Menu category selector/filter tabs |
| `MenuGrid.tsx` | Grid display of available menu items |
| `ItemDetailSheet.tsx` | Bottom sheet showing item details and customization |
| `CartScreen.tsx` | Shopping cart with items and totals |
| `OrderTracker.tsx` | Real-time order status tracking |
| `BillScreen.tsx` | Final bill display before payment |
| `PaymentSheet.tsx` | Payment method selection interface |
| `WaiterSheet.tsx` | Call waiter/staff assistance interface |
| `WelcomeScreen.tsx` | Initial greeting/welcome screen |
| `WelcomeScreen.module.css` | Scoped styles for welcome screen |
| `UserDetailsScreen.tsx` | Customer information entry form |
| `UserDetailsScreen.module.css` | Scoped styles for user details form |

**Landing Components** (`/src/components/landing/`):
| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Navigation bar with links to sections |
| `Hero.tsx` | Large hero banner section |
| `About.tsx` | Restaurant information/description |
| `SignatureDishes.tsx` | Featured signature dishes showcase |
| `MenuPreview.tsx` | Preview of menu with categories |
| `Specials.tsx` | Special offers and promotions |
| `Gallery.tsx` | Photo gallery of restaurant |
| `Testimonials.tsx` | Customer reviews/testimonials |
| `ReservationForm.tsx` | Form for table reservations |
| `Location.tsx` | Map and location information |
| `Footer.tsx` | Footer with links and info |

---

#### `/src/lib` - Utilities & Data
**Purpose**: Shared utilities, constants, and data models

| File | Purpose |
|------|---------|
| `menuData.ts` | Menu items database with TypeScript interfaces for `MenuItem` and `Extra` |

**Key Exports from menuData.ts:**
- `MenuItem` interface - Shape of menu items with id, name, price, category, image, tags, extras, prep time
- `Extra` interface - Shape of item customizations/add-ons (label, price)
- `MENU` array - Complete restaurant menu with all dishes

---

## Key Technologies & Dependencies

### Runtime Dependencies
- **Next.js 16.2.6** - React framework with SSR, routing, and optimizations
- **React 19.2.4** - UI library
- **React DOM 19.2.4** - React rendering for web

### Development Dependencies
- **TypeScript 5** - Static type checking
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS 4** - CSS transformation tool
- **ESLint 9** - Code quality and linting

---

## Build & Development Scripts

```json
{
  "dev": "next dev",      // Run development server (http://localhost:3000)
  "build": "next build",  // Build for production
  "start": "next start",  // Start production server
  "lint": "eslint"        // Run code linting checks
}
```

---

## Application Flow

### **Landing Page** (`/`)
1. User visits root route
2. Displays marketing components (Hero, Menu Preview, Testimonials, etc.)
3. Options to reserve table or navigate to dine

### **Admin Panel** (`/admin`)
1. PIN authentication required
2. Access to order management, menu editing, payments
3. Real-time order tracking and status updates
4. Table management interface

### **Dine/Ordering** (`/dine`)
1. Welcome screen with table number selection
2. User details collection screen
3. Menu browsing by category
4. Item selection with customization options
5. Cart management
6. Order placement and real-time tracking
7. Bill review and payment

---

## CSS Architecture

- **Global Styles** (`globals.css`, `theme.css`, `globals/`) - Applied app-wide
- **Feature Scoped** (`admin.css`, `dine.css`) - Feature-specific base styles
- **Module Scoped** (`*.module.css`) - Component-scoped isolated styles
- **Utility Styles** (CSS folders under each section) - Subsystem-specific styles

---

## Development Tips

### File Organization Principles
- Pages under `/app/[route]/page.tsx`
- Layout wrappers under `/app/[route]/layout.tsx`
- Reusable components under `/components/[feature]/`
- Shared utilities and data in `/lib/`
- Feature-specific CSS in `/app/[feature]/[feature].css`
- Component-scoped CSS in `ComponentName.module.css`

### Type Safety
- All major data structures (MenuItem, Extra, etc.) are TypeScript interfaces
- Components are `.tsx` files with proper type annotations
- Use strict TypeScript for better IDE support and fewer runtime errors

### Hot Reload
- Next.js automatically reloads on file changes during development
- CSS changes reflect instantly
- Component changes trigger fast refresh
