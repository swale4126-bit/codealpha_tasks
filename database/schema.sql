-- ============================================================================
-- KoraMarket — PostgreSQL 16 Normalized Database Schema (3NF)
-- Phase 3: Database Design & Implementation
-- ============================================================================
-- Entities (11 tables):
--   1. users            2. addresses         3. categories
--   4. products         5. product_images    6. carts
--   7. cart_items       8. orders            9. order_items
--  10. payments        11. reviews
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Shared Trigger Function: automatically refresh updated_at on row updates
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. USERS — Customer and Administrator accounts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    role            VARCHAR(20)  NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_role CHECK (role IN ('customer', 'admin')),
    CONSTRAINT chk_users_email_lowercase CHECK (email = LOWER(email))
);

-- ----------------------------------------------------------------------------
-- 2. ADDRESSES — Reusable customer shipping addresses (1:N with users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50)  DEFAULT 'Home',
    recipient_name  VARCHAR(120) NOT NULL,
    phone           VARCHAR(30)  NOT NULL,
    street_line1    VARCHAR(255) NOT NULL,
    street_line2    VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(30)  NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'United States',
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Partial unique index: guarantees at most ONE default address per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_one_default_per_user
    ON addresses (user_id)
    WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES — Product catalog departments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    description     TEXT,
    image_url       TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS — Storefront catalog with inventory & soft-delete safeguards
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                  SERIAL PRIMARY KEY,
    category_id         INTEGER        NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name                VARCHAR(180)   NOT NULL,
    slug                VARCHAR(200)   NOT NULL UNIQUE,
    sku                 VARCHAR(64)    NOT NULL UNIQUE,
    short_description   VARCHAR(300),
    description         TEXT           NOT NULL,
    price               NUMERIC(10, 2) NOT NULL,
    compare_at_price    NUMERIC(10, 2),
    stock_quantity      INTEGER        NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER        NOT NULL DEFAULT 5,
    is_featured         BOOLEAN        NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_products_price_non_negative CHECK (price >= 0),
    CONSTRAINT chk_products_compare_price CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    CONSTRAINT chk_products_stock_non_negative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_products_low_stock_non_negative CHECK (low_stock_threshold >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_price ON products (is_active, price);
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured) WHERE is_featured = TRUE AND is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 5. PRODUCT_IMAGES — Multi-image product galleries (1:N with products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url       TEXT         NOT NULL,
    alt_text        VARCHAR(200),
    is_primary      BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_product_images_sort_order CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_one_primary
    ON product_images (product_id)
    WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id, sort_order);

-- ----------------------------------------------------------------------------
-- 6. CARTS — Persistent active cart container (1:1 with users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. CART_ITEMS — Junction table resolving M:N between carts and products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id              SERIAL PRIMARY KEY,
    cart_id         INTEGER      NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id      INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER      NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT chk_cart_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);

-- ----------------------------------------------------------------------------
-- 8. ORDERS — Immutable customer order headers with shipping address snapshot
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                          SERIAL PRIMARY KEY,
    order_number                VARCHAR(40)    NOT NULL UNIQUE,
    user_id                     INTEGER        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status                      VARCHAR(25)    NOT NULL DEFAULT 'pending',
    subtotal                    NUMERIC(10, 2) NOT NULL,
    shipping_fee                NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount                  NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount                NUMERIC(10, 2) NOT NULL,
    shipping_address_snapshot   JSONB          NOT NULL,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_orders_status CHECK (
        status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    ),
    CONSTRAINT chk_orders_amounts_non_negative CHECK (
        subtotal >= 0 AND shipping_fee >= 0 AND tax_amount >= 0 AND total_amount >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_created ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. ORDER_ITEMS — Frozen order line items (ON DELETE RESTRICT protects history)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id                      SERIAL PRIMARY KEY,
    order_id                INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id              INTEGER        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_snapshot   VARCHAR(180)   NOT NULL,
    product_sku_snapshot    VARCHAR(64)    NOT NULL,
    product_image_snapshot  TEXT,
    unit_price_snapshot     NUMERIC(10, 2) NOT NULL,
    quantity                INTEGER        NOT NULL,
    line_total              NUMERIC(10, 2) NOT NULL,

    CONSTRAINT chk_order_items_price_non_negative CHECK (unit_price_snapshot >= 0),
    CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_order_items_line_total_non_negative CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- ----------------------------------------------------------------------------
-- 10. PAYMENTS — COD or Simulated Demo Payment record (1:1 with orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER        NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    payment_method  VARCHAR(30)    NOT NULL,
    payment_status  VARCHAR(30)    NOT NULL DEFAULT 'pending',
    amount          NUMERIC(10, 2) NOT NULL,
    transaction_ref VARCHAR(100)   UNIQUE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payments_method CHECK (payment_method IN ('cash_on_delivery', 'simulated_card')),
    CONSTRAINT chk_payments_status CHECK (payment_status IN ('pending', 'simulated_paid', 'failed', 'refunded')),
    CONSTRAINT chk_payments_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (payment_status);

-- ----------------------------------------------------------------------------
-- 11. REVIEWS — Customer ratings & reviews (M:N unique per user + product)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating          SMALLINT     NOT NULL,
    title           VARCHAR(150),
    comment         TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id),
    CONSTRAINT chk_reviews_rating_range CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id_created ON reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);

-- ----------------------------------------------------------------------------
-- Attach updated_at Triggers
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'users', 'addresses', 'categories', 'products',
        'carts', 'cart_items', 'orders', 'payments', 'reviews'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', tbl, tbl);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
            tbl, tbl
        );
    END LOOP;
END;
$$;

COMMIT;
