# KoraMarket — Project Charter

## 1. Project Overview

| Attribute | Value |
|---|---|
| **Project Name** | KoraMarket |
| **Internship Program** | CodeAlpha Full-Stack Development Internship |
| **Task** | Task 1 — Simple E-commerce Store |
| **Architecture** | Full-Stack Web Application (React SPA + Node.js/Express REST API + PostgreSQL) |
| **Target Repository** | `codealpha_tasks` |

KoraMarket is a production-minded, full-stack e-commerce web platform designed to showcase clean relational database design, secure REST API engineering, transactional checkout integrity, role-based administration, and a refined commercial user interface.

---

## 2. Business Objectives

1. **Seamless Customer Shopping Experience:** Enable shoppers to discover products via search, category navigation, multi-facet filtering, sorting, and detailed product pages with verified customer reviews.
2. **Reliable Cart & Order Integrity:** Guarantee that inventory counts never drop below zero and that every placed order snapshots product names, prices, and shipping addresses inside an atomic PostgreSQL transaction.
3. **Complete Store Administration:** Equip store administrators with a dedicated dashboard for real-time sales metrics, catalog/category/inventory management, customer visibility, and order fulfillment workflows.
4. **Security by Design:** Enforce `bcrypt` password hashing, signed JWT authentication, strict role-based access control (RBAC), input validation, parameterized SQL queries, CORS allowlisting, HTTP security headers, and rate limiting.
5. **Engineering Clarity:** Maintain clear separation of concerns, modular files, automated tests, and thorough documentation so any developer can understand, maintain, and extend the codebase.

---

## 3. User Personas

| Persona | Role in DB | Primary Goals |
|---|---|---|
| **Guest Visitor** | Unauthenticated | Browse storefront, search/filter/sort catalog, inspect product details and reviews, add items to a local guest cart. |
| **Registered Customer** | `customer` | Maintain persistent DB cart, save shipping addresses, complete checkout, track order status history, leave 1–5 star reviews. |
| **Store Administrator** | `admin` | Monitor KPIs and sales summaries, manage products/categories/stock, safely archive ordered products, inspect customers, update order statuses. |

---

## 4. Functional Scope

### A. Customer-Facing Requirements (20 Modules)
1. Homepage with curated featured categories, bestsellers, and brand value props.
2. Responsive navigation bar (search bar, categories, live cart badge, account menu, mobile drawer).
3. Paginated product catalog.
4. Product category browsing.
5. Keyword product search (name, description, SKU).
6. Multi-criteria filtering (category, price range, minimum rating, in-stock only).
7. Product sorting (newest, price ascending/descending, top-rated).
8. Product detail view (multi-image gallery, SKU, live stock status, quantity picker, related items).
9. Shopping cart (slide-out drawer + dedicated cart page, itemized totals).
10. Cart quantity management (increment, decrement, stock-capped updates, removal, guest-to-user merge on login).
11. User registration with validation.
12. User login issuing a signed JWT.
13. User logout clearing client auth state.
14. User profile management (name, phone, password change).
15. Shipping address book (CRUD + default address selection).
16. Checkout workflow (address selection/entry, order summary, delivery/payment option).
17. Atomic order placement (stock verification, inventory decrement, order/item/payment creation, cart clearing).
18. Order history list.
19. Order status tracking timeline (`pending` → `confirmed` → `processing` → `shipped` → `delivered` / `cancelled`) + cancellation of pending orders.
20. Product reviews and star ratings (1–5 stars, one review per user per product, live rating averages).

### B. Admin Requirements (10 Modules)
1. Admin authentication and backend/frontend role enforcement (`role === 'admin'`).
2. Admin dashboard with KPI cards (revenue, orders, customers, low-stock alerts).
3. Product management list (active and archived products).
4. Category management (create, edit, slugify, delete unused categories).
5. Inventory management (stock updates, low-stock threshold highlights).
6. Order management (filter by status, inspect items, update fulfillment status).
7. Customer management (registered accounts, order count, total spend, active toggle).
8. Sales summary (revenue by order status, top-selling products, recent sales breakdown).
9. Product creation and editing forms with validation and image management.
10. Safeguarded product deletion (soft-delete when referenced by historical orders; hard-delete only when never ordered).

---

## 5. Payment & Security Scope Statement

- **Payment Simulation Policy:** KoraMarket does **not** process real credit cards or collect sensitive PAN/CVV payment card numbers. Checkout explicitly supports **Cash on Delivery (COD)** and **Simulated Demo Payment (Test Mode)**, clearly labeled in both the UI and the `payments` table (`cash_on_delivery` / `simulated_card`).
- **Secrets Hygiene:** All credentials, database passwords, and JWT secrets live exclusively in local `.env` files excluded by `.gitignore`. Only sanitized `.env.example` templates are committed.

---

## 6. Success Criteria & Definition of Done

A feature is considered **complete** only when:
1. Its database queries, API endpoints, and UI flows are implemented cleanly.
2. Input validation, error handling, and authorization rules are enforced on the backend (not just hidden in the UI).
3. Automated tests and manual verification confirm it works end-to-end against PostgreSQL.
4. No secrets, build artifacts, or `node_modules` are tracked by Git.
