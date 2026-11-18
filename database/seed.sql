-- ============================================================================
-- KoraMarket — Realistic Demo Seed Data
-- ============================================================================
-- Demo Accounts (bcrypt cost 12):
--   Admin:    admin@koramarket.com     / Admin@Kora2026!
--   Customer: amina@koramarket.com     / Customer@Kora2026!
--   Customer: daniel@koramarket.com    / Customer@Kora2026!
-- ============================================================================

BEGIN;

-- Clear existing seed data in FK-safe order so seed.sql is safely re-runnable
TRUNCATE TABLE
    reviews,
    payments,
    order_items,
    orders,
    cart_items,
    carts,
    product_images,
    products,
    categories,
    addresses,
    users
RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, phone, role) VALUES
(
    'KoraMarket Admin',
    'admin@koramarket.com',
    '$2b$12$2VCt7vnc2j6A8bNXKyxyVeYIVeldI4fVNUgaXaklABARwdOtCF6T.',
    '+1-555-0100',
    'admin'
),
(
    'Amina Hassan',
    'amina@koramarket.com',
    '$2b$12$Zkvt9fOu6uxasjNqnolaOuOqSbyVjCBjJw35pj6R.jbvfVmzm933e',
    '+1-555-0142',
    'customer'
),
(
    'Daniel Osei',
    'daniel@koramarket.com',
    '$2b$12$Zkvt9fOu6uxasjNqnolaOuOqSbyVjCBjJw35pj6R.jbvfVmzm933e',
    '+1-555-0198',
    'customer'
);

-- ----------------------------------------------------------------------------
-- 2. ADDRESSES
-- ----------------------------------------------------------------------------
INSERT INTO addresses (user_id, label, recipient_name, phone, street_line1, street_line2, city, state, postal_code, country, is_default) VALUES
(2, 'Home',   'Amina Hassan', '+1-555-0142', '742 Evergreen Terrace', 'Apt 4B',   'Austin',  'TX', '78701', 'United States', TRUE),
(2, 'Office', 'Amina Hassan', '+1-555-0142', '300 Congress Ave',      'Suite 900','Austin',  'TX', '78701', 'United States', FALSE),
(3, 'Home',   'Daniel Osei',  '+1-555-0198', '1180 Peachtree St NE',  NULL,       'Atlanta', 'GA', '30309', 'United States', TRUE);

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES (6 curated departments)
-- ----------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, image_url) VALUES
(
    'Electronics & Audio',
    'electronics-audio',
    'Precision headphones, portable speakers, and everyday acoustic essentials.',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'
),
(
    'Workspace & Tech',
    'workspace-tech',
    'Ergonomic desk accessories, mechanical keyboards, and modern productivity gear.',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'
),
(
    'Home & Living',
    'home-living',
    'Minimalist lighting, ceramic accents, and warm textiles crafted for calm spaces.',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80'
),
(
    'Kitchen & Coffee',
    'kitchen-coffee',
    'Pour-over brewers, insulated glassware, and durable countertop tools.',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80'
),
(
    'Fashion & Accessories',
    'fashion-accessories',
    'Timeless everyday carry bags, minimalist watches, and travel-ready essentials.',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
),
(
    'Fitness & Wellness',
    'fitness-wellness',
    'Hydration gear, recovery essentials, and studio-grade training mats.',
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&q=80'
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS (12 curated products across all 6 categories)
-- ----------------------------------------------------------------------------
INSERT INTO products (
    category_id, name, slug, sku, short_description, description,
    price, compare_at_price, stock_quantity, low_stock_threshold, is_featured
) VALUES
(
    1,
    'KoraSound ANC Wireless Headphones',
    'korasound-anc-wireless-headphones',
    'KM-AUD-001',
    'Active noise cancellation with 40-hour battery life and memory-foam ear cushions.',
    'Engineered for studio-grade clarity wherever you work or travel. Features adaptive hybrid active noise cancellation, multipoint Bluetooth 5.3 pairing, USB-C fast charging (10 minutes gives 5 hours of playback), and a foldable anodized aluminum hinge.',
    189.99, 229.99, 28, 5, TRUE
),
(
    1,
    'Pulse Mini Waterproof Bluetooth Speaker',
    'pulse-mini-waterproof-bluetooth-speaker',
    'KM-AUD-002',
    'Compact 360-degree portable speaker with IP67 dust and water resistance.',
    'Built with dual passive radiators for crisp vocals and balanced bass in a palm-sized aluminum and woven-fabric enclosure. Delivers 16 hours of uninterrupted playback and supports stereo pairing with a second unit.',
    69.00, 85.00, 42, 5, FALSE
),
(
    2,
    'TactilePro 75% Mechanical Keyboard',
    'tactilepro-75-mechanical-keyboard',
    'KM-TEC-001',
    'Hot-swappable wireless mechanical keyboard with CNC aluminum frame.',
    'Designed for developers and writers who appreciate responsive feedback. Equipped with factory-lubed tactile switches, PBT keycaps, gasket mount dampening for a clean acoustic profile, and tri-mode USB-C / 2.4GHz / Bluetooth connectivity.',
    145.00, 169.00, 19, 5, TRUE
),
(
    2,
    'ErgoLift Aluminum Laptop Stand',
    'ergolift-aluminum-laptop-stand',
    'KM-TEC-002',
    'Precision-milled desktop riser for 13 to 16-inch laptops.',
    'Elevates your screen to an ergonomic eye level while improving airflow underneath your laptop. Anti-slip silicone pads keep your device secure, and the open rear channel keeps desk cables tidy.',
    54.50, NULL, 35, 5, FALSE
),
(
    3,
    'Solis Warm LED Desk Lamp',
    'solis-warm-led-desk-lamp',
    'KM-HOM-001',
    'Dimmable brass-accent architectural lamp with stepless color temperature.',
    'Combines matte powder-coated steel with brushed brass joints for an architectural desk centerpiece. High-CRI 95+ LED lighting reduces eye fatigue during late evening reading or coding sessions.',
    92.00, 110.00, 14, 5, TRUE
),
(
    3,
    'Terra Handcrafted Ceramic Vase Set',
    'terra-handcrafted-ceramic-vase-set',
    'KM-HOM-002',
    'Trio of matte stoneware vases in warm sand and sage glazes.',
    'Kiln-fired stoneware vases designed to hold dried botanicals or fresh stems. Each piece features a subtly textured glaze and waterproof interior lining.',
    64.00, NULL, 4, 5, FALSE -- Intentionally low stock (< threshold 5) for Admin alerts!
),
(
    4,
    'BaristaFlow Gooseneck Pour-Over Kettle',
    'baristaflow-gooseneck-pour-over-kettle',
    'KM-KIT-001',
    'Precision electric kettle with degree-by-degree temperature control.',
    'Craft balanced pour-over coffee and specialty teas with a counterbalanced gooseneck spout that delivers a steady, controlled stream. Features a 0.9L stainless steel body, hold-temperature mode, and built-in brew stopwatch.',
    118.00, 139.00, 22, 5, TRUE
),
(
    4,
    'Artisan Double-Wall Espresso Glass Set',
    'artisan-double-wall-espresso-glass-set',
    'KM-KIT-002',
    'Set of 4 hand-blown borosilicate insulated espresso glasses.',
    'Suspended double-wall borosilicate glass keeps espresso piping hot while staying cool to the touch. Dishwasher-safe, condensation-free, and sized at 4.5 oz for single or double shots.',
    34.00, NULL, 50, 8, FALSE
),
(
    5,
    'Nomad Weatherproof Commuter Backpack',
    'nomad-weatherproof-commuter-backpack',
    'KM-FAS-001',
    '22L minimalist daily backpack with suspended 16-inch laptop vault.',
    'Constructed from recycled ballistic nylon with YKK AquaGuard zippers, hidden passport pocket, magnetic sternum strap, and breathable contoured back paneling for effortless daily commuting.',
    134.00, 155.00, 16, 5, TRUE
),
(
    5,
    'Meridian Minimalist Sapphire Watch',
    'meridian-minimalist-sapphire-watch',
    'KM-FAS-002',
    '40mm brushed stainless steel timepiece with scratch-resistant sapphire crystal.',
    'An understated everyday watch powered by a reliable Japanese quartz movement. Includes a quick-release full-grain vegetable-tanned leather strap and 5 ATM water resistance.',
    175.00, 199.00, 11, 4, TRUE
),
(
    6,
    'ZenGrip Natural Rubber Yoga Mat',
    'zengrip-natural-rubber-yoga-mat',
    'KM-FIT-001',
    '5mm studio-grade non-slip mat with laser-etched alignment lines.',
    'Sustainably harvested tree rubber base topped with a moisture-wicking polyurethane surface that stays grippy through intense sessions. Includes a woven cotton carrying strap.',
    78.00, 89.00, 25, 5, FALSE
),
(
    6,
    'HydroCore Insulated Thermal Flask 32oz',
    'hydrocore-insulated-thermal-flask-32oz',
    'KM-FIT-002',
    'Vacuum-insulated stainless steel bottle keeping drinks cold 24 hours.',
    'Built with food-grade 18/8 stainless steel, a sweat-free matte powder finish, and a leak-proof wide-mouth loop cap designed for gym, desk, or trail.',
    38.50, NULL, 60, 10, FALSE
);

-- ----------------------------------------------------------------------------
-- 5. PRODUCT_IMAGES
-- ----------------------------------------------------------------------------
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1,  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 'KoraSound ANC Wireless Headphones front angle', TRUE,  0),
(1,  'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80', 'KoraSound ANC Wireless Headphones studio view', FALSE, 1),
(2,  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80', 'Pulse Mini Bluetooth Speaker', TRUE,  0),
(3,  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', 'TactilePro 75% Mechanical Keyboard top view', TRUE,  0),
(3,  'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80', 'TactilePro 75% Mechanical Keyboard keycaps detail', FALSE, 1),
(4,  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80', 'ErgoLift Aluminum Laptop Stand on desk', TRUE,  0),
(5,  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80', 'Solis Warm LED Desk Lamp lit', TRUE,  0),
(6,  'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=80', 'Terra Ceramic Vase Set', TRUE,  0),
(7,  'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80', 'BaristaFlow Gooseneck Kettle pouring', TRUE,  0),
(8,  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80', 'Artisan Espresso Glass Set', TRUE,  0),
(9,  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 'Nomad Weatherproof Commuter Backpack', TRUE,  0),
(10, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', 'Meridian Minimalist Sapphire Watch', TRUE,  0),
(11, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&q=80', 'ZenGrip Natural Rubber Yoga Mat', TRUE,  0),
(12, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', 'HydroCore Insulated Thermal Flask', TRUE,  0);

-- ----------------------------------------------------------------------------
-- 6. CARTS & 7. CART_ITEMS (Sample active cart for Amina)
-- ----------------------------------------------------------------------------
INSERT INTO carts (user_id) VALUES (2), (3);

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 5, 1),
(1, 8, 2);

-- ----------------------------------------------------------------------------
-- 8. ORDERS, 9. ORDER_ITEMS & 10. PAYMENTS (3 sample orders for analytics/history)
-- ----------------------------------------------------------------------------
INSERT INTO orders (
    order_number, user_id, status, subtotal, shipping_fee, tax_amount, total_amount,
    shipping_address_snapshot, notes, created_at
) VALUES
(
    'KM-2026-1001', 2, 'delivered', 307.99, 0.00, 24.64, 332.63,
    '{"recipientName":"Amina Hassan","phone":"+1-555-0142","streetLine1":"742 Evergreen Terrace","streetLine2":"Apt 4B","city":"Austin","state":"TX","postalCode":"78701","country":"United States"}'::jsonb,
    'Leave at front reception desk.',
    NOW() - INTERVAL '9 days'
),
(
    'KM-2026-1002', 3, 'processing', 279.00, 0.00, 22.32, 301.32,
    '{"recipientName":"Daniel Osei","phone":"+1-555-0198","streetLine1":"1180 Peachtree St NE","streetLine2":null,"city":"Atlanta","state":"GA","postalCode":"30309","country":"United States"}'::jsonb,
    NULL,
    NOW() - INTERVAL '3 days'
),
(
    'KM-2026-1003', 2, 'pending', 78.00, 9.99, 6.24, 94.23,
    '{"recipientName":"Amina Hassan","phone":"+1-555-0142","streetLine1":"300 Congress Ave","streetLine2":"Suite 900","city":"Austin","state":"TX","postalCode":"78701","country":"United States"}'::jsonb,
    'Deliver during office hours 9am-5pm.',
    NOW() - INTERVAL '1 day'
);

INSERT INTO order_items (
    order_id, product_id, product_name_snapshot, product_sku_snapshot,
    product_image_snapshot, unit_price_snapshot, quantity, line_total
) VALUES
(1, 1, 'KoraSound ANC Wireless Headphones', 'KM-AUD-001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', 189.99, 1, 189.99),
(1, 7, 'BaristaFlow Gooseneck Pour-Over Kettle', 'KM-KIT-001', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80', 118.00, 1, 118.00),
(2, 3, 'TactilePro 75% Mechanical Keyboard', 'KM-TEC-001', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80', 145.00, 1, 145.00),
(2, 9, 'Nomad Weatherproof Commuter Backpack', 'KM-FAS-001', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80', 134.00, 1, 134.00),
(3, 11, 'ZenGrip Natural Rubber Yoga Mat', 'KM-FIT-001', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&q=80', 78.00, 1, 78.00);

INSERT INTO payments (order_id, payment_method, payment_status, amount, transaction_ref, paid_at) VALUES
(1, 'simulated_card',   'simulated_paid', 332.63, 'SIM-KM-2026-1001', NOW() - INTERVAL '9 days'),
(2, 'simulated_card',   'simulated_paid', 301.32, 'SIM-KM-2026-1002', NOW() - INTERVAL '3 days'),
(3, 'cash_on_delivery', 'pending',         94.23, 'COD-KM-2026-1003', NULL);

-- ----------------------------------------------------------------------------
-- 11. REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (user_id, product_id, rating, title, comment) VALUES
(2, 1, 5, 'Superb noise cancellation for deep work', 'I wear these six hours a day while coding. Comfort is outstanding and the ANC effortlessly blocks coffee shop chatter.'),
(3, 1, 4, 'Great sound, sturdy build', 'Battery easily lasts a full work week. Slightly warm on the ears in summer, otherwise flawless.'),
(3, 3, 5, 'Best typing feel I have owned', 'The gasket mount gives a clean, muted thock right out of the box and switching between Mac and Windows is instant.'),
(2, 7, 5, 'Precision pour every morning', 'Holds exact water temperature while I grind beans. Completely upgraded my morning pour-over routine.'),
(3, 9, 5, 'Handles rain without blinking', 'Got caught in a heavy downpour walking to the train and my laptop inside stayed completely dry.'),
(2, 10, 4, 'Clean minimalist design', 'Looks far more expensive than its price tag. The leather strap broke in comfortably after three days.'),
(2, 5, 5, 'Warm, glare-free desk light', 'Zero flicker and the brass accents look great on a walnut desk.'),
(3, 12, 5, 'Ice stays frozen overnight', 'Simple, rugged, and never leaks in my gym bag.');

COMMIT;
