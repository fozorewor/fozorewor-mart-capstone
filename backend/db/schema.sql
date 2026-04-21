CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_user_password_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.password_hash IS NULL AND NEW.password IS NOT NULL THEN
    NEW.password_hash = NEW.password;
  ELSIF NEW.password IS NULL AND NEW.password_hash IS NOT NULL THEN
    NEW.password = NEW.password_hash;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_product_category_columns()
RETURNS TRIGGER AS $$
DECLARE
  resolved_category_id integer;
  resolved_category_name text;
BEGIN
  IF NEW.category IS NOT NULL AND btrim(NEW.category) <> '' THEN
    INSERT INTO categories(name)
    VALUES (NEW.category)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO resolved_category_id;

    NEW.category_id = resolved_category_id;
  ELSIF NEW.category_id IS NOT NULL THEN
    SELECT c.name INTO resolved_category_name
    FROM categories c
    WHERE c.id = NEW.category_id;

    IF resolved_category_name IS NOT NULL THEN
      NEW.category = resolved_category_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cents_to_decimal(cents integer)
RETURNS numeric AS $$
BEGIN
  RETURN round((COALESCE(cents, 0)::numeric / 100.0), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE categories (
  id serial PRIMARY KEY,
  name varchar(80) NOT NULL UNIQUE,
  description text
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  username varchar(50) UNIQUE,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  password_hash text,
  first_name text,
  last_name text,
  phone text UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER users_sync_password_columns
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_password_columns();

CREATE TABLE products (
  id serial PRIMARY KEY,
  category_id integer REFERENCES categories(id),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  price numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(price_cents)) STORED,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  rating_stars numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating_stars >= 0 AND rating_stars <= 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  unit_label text DEFAULT '',
  image_path text NOT NULL,
  image_gallery_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_active_idx ON products (is_active);

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER products_sync_category_columns
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_category_columns();

CREATE TABLE carts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX carts_user_id_idx ON carts (user_id);

CREATE TRIGGER carts_set_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
  id serial PRIMARY KEY,
  cart_id integer NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  added_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX cart_items_cart_id_idx ON cart_items (cart_id);
CREATE INDEX cart_items_product_id_idx ON cart_items (product_id);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'delivered')),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  subtotal numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(subtotal_cents)) STORED,
  tax_cents integer NOT NULL CHECK (tax_cents >= 0),
  tax numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(tax_cents)) STORED,
  delivery_fee_cents integer NOT NULL CHECK (delivery_fee_cents >= 0),
  delivery_fee numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(delivery_fee_cents)) STORED,
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  total numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(total_cents)) STORED,
  delivery_date timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id serial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  price_at_purchase numeric(10,2) GENERATED ALWAYS AS (cents_to_decimal(unit_price_cents)) STORED,
  line_total_cents integer NOT NULL CHECK (line_total_cents >= 0)
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);
