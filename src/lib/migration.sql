-- Riwayat v2 Database Schema

-- Drop tables in reverse order (for idempotency)
DROP TABLE IF EXISTS waiter_alerts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS menu_extras CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Enum types
CREATE TYPE staff_role AS ENUM ('admin', 'user');
CREATE TYPE table_status AS ENUM ('empty', 'active', 'disabled');
CREATE TYPE order_status AS ENUM ('received', 'kitchen', 'ready', 'served', 'cancelled');
CREATE TYPE alert_type AS ENUM ('waiter', 'bill', 'complaint');
CREATE TYPE payment_method AS ENUM ('card', 'cash');
CREATE TYPE menu_item_type AS ENUM ('single', 'platter');
CREATE TYPE discount_type AS ENUM ('none', 'percent', 'flat');

-- Staff (Admin accounts)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role staff_role NOT NULL,
  pin_hash TEXT NOT NULL,
  avatar_initials TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers (Dine-in users for loyalty tracking)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  total_sessions INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  first_visit TIMESTAMPTZ DEFAULT now(),
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone)
);

-- Restaurant Tables
CREATE TABLE restaurant_tables (
  id TEXT PRIMARY KEY, -- "T01", "T02", etc.
  label TEXT NOT NULL,
  status table_status DEFAULT 'empty',
  active_session_id UUID,
  alert_active BOOLEAN DEFAULT false,
  qr_token UUID UNIQUE DEFAULT gen_random_uuid(),
  qr_regenerated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions (One visit = one session)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
  customer_id UUID REFERENCES customers(id),
  billing_round INTEGER DEFAULT 1,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  total_paid NUMERIC(12,2) DEFAULT 0,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  prep_time INTEGER,
  image_url TEXT,
  image_public_id TEXT,
  type menu_item_type DEFAULT 'single',
  available BOOLEAN DEFAULT true,
  hidden BOOLEAN DEFAULT false,
  discount_type discount_type DEFAULT 'none',
  discount_value NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Extras (Add-ons for menu items)
CREATE TABLE menu_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
  billing_round INTEGER NOT NULL,
  status order_status DEFAULT 'received',
  cancel_reason TEXT,
  total NUMERIC(10,2) DEFAULT 0,
  placed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items (Line items within an order)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
  billing_round INTEGER NOT NULL,
  order_ids UUID[] NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method payment_method NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT now()
);

-- Waiter Alerts
CREATE TABLE waiter_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT NOT NULL REFERENCES restaurant_tables(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  type alert_type NOT NULL,
  message TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_sessions_table_id ON sessions(table_id);
CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX idx_sessions_closed_at ON sessions(closed_at);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_session_id ON payments(session_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_waiter_alerts_table_id ON waiter_alerts(table_id);
CREATE INDEX idx_waiter_alerts_dismissed ON waiter_alerts(dismissed);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_last_visit ON customers(last_visit);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);

-- Constraints
ALTER TABLE restaurant_tables ADD CONSTRAINT fk_active_session_id FOREIGN KEY (active_session_id) REFERENCES sessions(id) ON DELETE SET NULL;
