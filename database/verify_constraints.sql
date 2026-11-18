-- ============================================================================
-- KoraMarket — PostgreSQL Constraint & Relationship Verification Script
-- Safely tests every critical database safeguard inside a rolled-back block.
-- ============================================================================

-- 1. Show row counts across all 11 tables
SELECT table_name, row_count
FROM (
    SELECT 'users'          AS table_name, COUNT(*)::int AS row_count FROM users
    UNION ALL SELECT 'addresses',      COUNT(*)::int FROM addresses
    UNION ALL SELECT 'categories',     COUNT(*)::int FROM categories
    UNION ALL SELECT 'products',       COUNT(*)::int FROM products
    UNION ALL SELECT 'product_images', COUNT(*)::int FROM product_images
    UNION ALL SELECT 'carts',          COUNT(*)::int FROM carts
    UNION ALL SELECT 'cart_items',     COUNT(*)::int FROM cart_items
    UNION ALL SELECT 'orders',         COUNT(*)::int FROM orders
    UNION ALL SELECT 'order_items',    COUNT(*)::int FROM order_items
    UNION ALL SELECT 'payments',       COUNT(*)::int FROM payments
    UNION ALL SELECT 'reviews',        COUNT(*)::int FROM reviews
) t
ORDER BY table_name;

-- 2. Verify relational joins (Products + Categories + Average Ratings)
SELECT
    p.sku,
    p.name,
    c.name AS category,
    p.price,
    p.stock_quantity,
    COUNT(r.id) AS review_count,
    COALESCE(ROUND(AVG(r.rating), 2), 0) AS avg_rating
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, c.name
ORDER BY p.id
LIMIT 5;

-- 3. Verify database constraints actively reject invalid operations
DO $$
BEGIN
    -- Test A: Negative stock must fail
    BEGIN
        UPDATE products SET stock_quantity = -1 WHERE id = 1;
        RAISE EXCEPTION 'FAIL: Negative stock was erroneously allowed!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS [1/6]: CHECK constraint blocked negative stock_quantity.';
    END;

    -- Test B: Invalid user role must fail
    BEGIN
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES ('Bad Role', 'badrole@example.com', 'hash', 'supergod');
        RAISE EXCEPTION 'FAIL: Invalid role was erroneously allowed!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS [2/6]: CHECK constraint blocked invalid user role.';
    END;

    -- Test C: Rating out of 1..5 range must fail
    BEGIN
        INSERT INTO reviews (user_id, product_id, rating, comment)
        VALUES (2, 2, 6, 'Impossible 6-star rating');
        RAISE EXCEPTION 'FAIL: Out-of-range rating was erroneously allowed!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS [3/6]: CHECK constraint blocked out-of-range review rating (6).';
    END;

    -- Test D: Duplicate review by same user on same product must fail
    BEGIN
        INSERT INTO reviews (user_id, product_id, rating, comment)
        VALUES (2, 1, 5, 'Second review on same product');
        RAISE EXCEPTION 'FAIL: Duplicate review was erroneously allowed!';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS [4/6]: UNIQUE constraint blocked duplicate review per user+product.';
    END;

    -- Test E: Hard-deleting a product referenced by order_items must fail (ON DELETE RESTRICT)
    BEGIN
        DELETE FROM products WHERE id = 1;
        RAISE EXCEPTION 'FAIL: Deleting an ordered product was erroneously allowed!';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS [5/6]: FOREIGN KEY ON DELETE RESTRICT protected historical order_items.';
    END;

    -- Test F: Multiple default addresses for the same user must fail (partial unique index)
    BEGIN
        INSERT INTO addresses (user_id, label, recipient_name, phone, street_line1, city, state, postal_code, is_default)
        VALUES (2, 'Second Default', 'Amina Hassan', '+1-555-0142', '999 Test Rd', 'Austin', 'TX', '78701', TRUE);
        RAISE EXCEPTION 'FAIL: Two default addresses for one user were erroneously allowed!';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS [6/6]: Partial UNIQUE index enforced at most one default address per user.';
    END;
END;
$$;
