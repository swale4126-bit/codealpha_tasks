# KoraMarket — REST API Documentation (Specification)

> **Base URL (Local Development):** `http://localhost:5000/api`  
> **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`  
> **Content-Type:** `application/json`

This document defines the planned RESTful API contract for KoraMarket. Exact payloads and examples will be verified against live endpoints during Phases 4–9.

---

## 1. System Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Verifies API server status and PostgreSQL connectivity. |

---

## 2. Authentication & Profile (`/api/auth`)

| Method | Endpoint | Auth | Request Body / Validation | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | Public | `{ fullName, email, password, phone? }` (email valid, password >= 8 chars) | `201` `{ user, token }` |
| `POST` | `/auth/login` | Public | `{ email, password }` | `200` `{ user, token }` |
| `GET` | `/auth/me` | Bearer | — | `200` `{ user }` |
| `PATCH` | `/auth/profile` | Bearer | `{ fullName?, phone? }` | `200` `{ user }` |
| `PATCH` | `/auth/password` | Bearer | `{ currentPassword, newPassword }` | `200` `{ message }` |

---

## 3. Shipping Addresses (`/api/addresses`)

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/addresses` | Bearer | — | `200` `{ addresses: [...] }` |
| `POST` | `/addresses` | Bearer | `{ label?, recipientName, phone, streetLine1, streetLine2?, city, state, postalCode, country, isDefault? }` | `201` `{ address }` |
| `PUT` | `/addresses/:id` | Bearer (Owner) | Same as `POST` | `200` `{ address }` |
| `PATCH` | `/addresses/:id/default` | Bearer (Owner) | — | `200` `{ address }` |
| `DELETE` | `/addresses/:id` | Bearer (Owner) | — | `200` `{ message }` |

---

## 4. Categories (`/api/categories`)

| Method | Endpoint | Auth | Request Body / Params | Response |
|---|---|---|---|---|
| `GET` | `/categories` | Public | Returns all categories with active product counts | `200` `{ categories: [...] }` |
| `GET` | `/categories/:slug` | Public | Single category metadata | `200` `{ category }` |
| `POST` | `/categories` | Admin | `{ name, description?, imageUrl? }` | `201` `{ category }` |
| `PUT` | `/categories/:id` | Admin | `{ name?, description?, imageUrl? }` | `200` `{ category }` |
| `DELETE` | `/categories/:id` | Admin | Blocked (`409`) if category still has products | `200` `{ message }` |

---

## 5. Products (`/api/products`)

| Method | Endpoint | Auth | Query / Request Body | Response |
|---|---|---|---|---|
| `GET` | `/products` | Public | Query: `search`, `category` (slug or id), `minPrice`, `maxPrice`, `minRating`, `inStock`, `featured`, `sort` (`newest`, `price_asc`, `price_desc`, `rating_desc`), `page`, `limit` | `200` `{ products: [...] }` + `meta` pagination |
| `GET` | `/products/:idOrSlug` | Public | Returns product, `images[]`, category info, rating summary, and related products | `200` `{ product, relatedProducts }` |
| `POST` | `/products` | Admin | `{ name, categoryId, sku, shortDescription?, description, price, compareAtPrice?, stockQuantity, lowStockThreshold?, isFeatured?, images?: [{ imageUrl, altText?, isPrimary? }] }` | `201` `{ product }` |
| `PUT` | `/products/:id` | Admin | Same fields (partial or full update) | `200` `{ product }` |
| `DELETE` | `/products/:id` | Admin | Soft-deletes (`is_active = false`) if ordered before; hard-deletes otherwise | `200` `{ message, deletionType }` |

---

## 6. Product Reviews (`/api/products/:id/reviews` & `/api/reviews`)

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/products/:id/reviews` | Public | Query: `page`, `limit` | `200` `{ reviews: [...], summary: { averageRating, totalReviews } }` |
| `POST` | `/products/:id/reviews` | Bearer | `{ rating (1..5), title?, comment }` (one per user/product) | `201` `{ review }` |
| `DELETE` | `/reviews/:id` | Bearer (Owner or Admin) | — | `200` `{ message }` |

---

## 7. Shopping Cart (`/api/cart`)

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/cart` | Bearer | — | `200` `{ items: [...], itemCount, subtotal }` |
| `POST` | `/cart/items` | Bearer | `{ productId, quantity }` (validated against live stock) | `201` `{ cart }` |
| `PATCH` | `/cart/items/:itemId` | Bearer | `{ quantity }` (must be `>= 1` and `<= stockQuantity`) | `200` `{ cart }` |
| `DELETE` | `/cart/items/:itemId` | Bearer | — | `200` `{ cart }` |
| `DELETE` | `/cart` | Bearer | Clears entire cart | `200` `{ cart }` |
| `POST` | `/cart/merge` | Bearer | `{ items: [{ productId, quantity }] }` (merges guest cart on login) | `200` `{ cart }` |

---

## 8. Orders (`/api/orders`)

| Method | Endpoint | Auth | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/orders` | Bearer | `{ addressId? or shippingAddress: {...}, paymentMethod: 'cash_on_delivery' \| 'simulated_card', notes? }` | `201` `{ order }` (runs atomic DB transaction) |
| `GET` | `/orders/my-orders` | Bearer | Query: `page`, `limit`, `status` | `200` `{ orders: [...] }` + `meta` |
| `GET` | `/orders/:id` | Bearer (Owner or Admin) | — | `200` `{ order }` (with items + payment info) |
| `PATCH` | `/orders/:id/cancel` | Bearer (Owner) | Allowed only when order status is `pending`; restores stock atomically | `200` `{ order }` |

---

## 9. Admin Operations (`/api/admin`)

All routes under `/api/admin` require a valid JWT **and** `user.role === 'admin'`.

| Method | Endpoint | Request / Query | Response |
|---|---|---|---|
| `GET` | `/admin/dashboard` | — | `200` KPI totals (revenue, order counts by status, customer count, low-stock products, recent orders) |
| `GET` | `/admin/sales-summary` | Query: `days` (default `30`) | `200` Revenue timeline, top-selling products, category breakdown |
| `GET` | `/admin/products` | Query: `search`, `category`, `status` (`all`/`active`/`archived`), `lowStock`, `page`, `limit` | `200` Full catalog view including inactive items |
| `PATCH` | `/admin/products/:id/inventory` | `{ stockQuantity, lowStockThreshold? }` | `200` `{ product }` |
| `GET` | `/admin/orders` | Query: `status`, `search`, `page`, `limit` | `200` All store orders with customer info |
| `PATCH` | `/admin/orders/:id/status` | `{ status }` (validated status transition; cancelling restores inventory) | `200` `{ order }` |
| `GET` | `/admin/customers` | Query: `search`, `page`, `limit` | `200` Customer directory with order counts and lifetime spend |
| `PATCH` | `/admin/customers/:id/status` | `{ isActive }` (prevents self-deactivation) | `200` `{ customer }` |

---

## 10. HTTP Status Codes Used

- `200 OK` — Successful read, update, or deletion.
- `201 Created` — New resource created.
- `400 Bad Request` — Validation failure or invalid state transition (e.g., insufficient stock).
- `401 Unauthorized` — Missing, invalid, or expired JWT.
- `403 Forbidden` — Authenticated user lacks required role (`admin`) or resource ownership.
- `404 Not Found` — Requested record does not exist.
- `409 Conflict` — Unique constraint violation (e.g., duplicate email/SKU/review) or protected deletion.
- `429 Too Many Requests` — Rate limit exceeded.
- `500 Internal Server Error` — Unhandled server failure (sanitized in production).
