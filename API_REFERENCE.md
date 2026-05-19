# Diagon Alley API Reference

> Complete API reference for the Diagon Alley e-commerce backend.
> Designed to serve as context for AI agents generating a frontend client.
> Covers all entities, DTOs, endpoints, security rules, and business logic.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Base URL & Environment](#base-url--environment)
3. [Authentication & Security](#authentication--security)
4. [Security Config (requestMatchers)](#security-config-requestmatchers)
5. [Entity Relationship Diagram](#entity-relationship-diagram)
6. [Domain Objects](#domain-objects)
   - [Entities](#entities)
   - [DTOs / Responses](#dtos--responses)
   - [Request DTOs](#request-dtos)
7. [API Endpoints](#api-endpoints)
   - [Auth](#auth)
   - [Products](#products)
   - [Categories](#categories)
   - [Shopping Cart](#shopping-cart)
   - [Orders](#orders)
   - [Users](#users)
8. [Business Rules](#business-rules)
9. [Error Handling](#error-handling)
10. [Test Credentials](#test-credentials)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Language | Java 21 |
| Framework | Spring Boot 3.5.3 |
| Security | Spring Security + JWT (jjwt 0.11.5, HMAC-SHA) |
| Database | PostgreSQL / MySQL (configurable via `DB_DRIVER`) |
| ORM | Spring Data JPA + Hibernate (`ddl-auto: update`) |
| Validation | Hibernate Validator + Jakarta Validation |
| Email | Spring Boot Mail Starter (SMTP) |
| API Docs | SpringDoc OpenAPI 2.8.9 (Swagger UI) |
| Build | Maven (wrapper `./mvnw`) |
| Container | Docker (multi-stage, Temurin 21 JRE) |

---

## Base URL & Environment

```
Base URL: https://talento-tech-production.up.railway.app
Swagger:  https://talento-tech-production.up.railway.app/swagger-ui      (ADMIN only)
API Docs: https://talento-tech-production.up.railway.app/v3/api-docs     (ADMIN only)
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | JDBC database URL | — |
| `DB_USERNAME` | Database username | — |
| `DB_PASSWORD` | Database password | — |
| `DB_DRIVER` | JDBC driver class | — |
| `JWT_SECRET` | Base64-encoded HMAC-SHA signing key | — |
| `JWT_EXPIRATION` | JWT validity period (milliseconds) | — |
| `FRONTEND_URL` | Frontend base URL (used in password reset email links) | — |
| `MAIL_HOST` | SMTP server host | — |
| `MAIL_PORT` | SMTP server port | — |
| `MAIL_USERNAME` | SMTP username | — |
| `MAIL_PASSWORD` | SMTP password | — |
| `PORT` | Server port | `8080` |

---

## Authentication & Security

### JWT Authentication Flow

1. Client sends `POST /auth/login` with `{ email, password }`
2. Server validates credentials and returns a signed JWT:
   ```json
   { "token": "eyJhbGciOiJIUzI1NiJ9..." }
   ```
3. Client includes the token in every subsequent request:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ```
4. Server validates the token on every request via `JwtAuthenticationFilter`
5. On logout, the token is added to an in-memory blacklist (lost on restart)

### JWT Payload (Claims)

```json
{
  "sub": "user@email.com",
  "userId": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "iat": 1715000000,
  "exp": 1715000900
}
```

### Roles

| Role | Authority String | Access |
|------|-----------------|--------|
| `USER` | `ROLE_USER` | Browse products, manage own cart, place orders, manage own profile |
| `ADMIN` | `ROLE_ADMIN` | Full CRUD on products/categories/users/orders, Swagger UI access |

Spring Security uses `hasRole("ADMIN")` which checks for `ROLE_ADMIN`.

### Session Management

- **Stateless** (no HTTP sessions)
- **CSRF**: disabled
- **CORS**: all origins allowed (development default)

---

## Security Config (requestMatchers)

> The exact `requestMatchers` rules from `SecurityConfig.java`, in evaluation order.
> Spring Security evaluates rules top-to-bottom and stops at the **first match**.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PREFIX: /auth                                                     │
├────────────┬──────────────────────────────┬────────────────────────┤
│  Method    │  Path                        │  Access                │
├────────────┼──────────────────────────────┼────────────────────────┤
│  POST      │  /auth/register              │  PUBLIC (permitAll)    │
│  POST      │  /auth/login                 │  PUBLIC (permitAll)    │
│  POST      │  /auth/logout                │  USER / ADMIN          │
│  POST      │  /auth/forgot-password       │  PUBLIC (permitAll)    │
│  GET       │  /auth/validate              │  PUBLIC (permitAll)    │
│  POST      │  /auth/reset-password        │  PUBLIC (permitAll)    │
│  POST      │  /auth/change-password       │  USER / ADMIN          │
│  GET       │  /auth/me                    │  USER / ADMIN          │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /carts                                                      │
├────────────┼──────────────────────────────┼────────────────────────┤
│  ANY       │  /carts/**                   │  USER                  │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /categories                                                  │
├────────────┼──────────────────────────────┼────────────────────────┤
│  GET       │  /categories                 │  PUBLIC (permitAll)    │
│  GET       │  /categories/all             │  ADMIN                 │
│  GET       │  /categories/*               │  USER / ADMIN          │
│  POST      │  /categories                 │  ADMIN                 │
│  PUT       │  /categories/*               │  ADMIN                 │
│  DELETE    │  /categories/*               │  ADMIN                 │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /orders                                                      │
├────────────┼──────────────────────────────┼────────────────────────┤
│  GET       │  /orders/my-orders           │  USER                  │
│  POST      │  /orders/**                  │  USER                  │
│  ANY       │  /orders/**                  │  ADMIN                 │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /products                                                    │
├────────────┼──────────────────────────────┼────────────────────────┤
│  GET       │  /products                   │  PUBLIC (permitAll)    │
│  GET       │  /products/*                 │  USER / ADMIN          │
│  POST      │  /products                   │  ADMIN                 │
│  PUT       │  /products/*                 │  ADMIN                 │
│  DELETE    │  /products/*                 │  ADMIN                 │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /users                                                       │
├────────────┼──────────────────────────────┼────────────────────────┤
│  GET       │  /users                      │  ADMIN                 │
│  GET       │  /users/*                    │  ADMIN                 │
│  PUT       │  /users/*                    │  USER / ADMIN          │
│  DELETE    │  /users/*                    │  ADMIN                 │
├────────────┼──────────────────────────────┼────────────────────────┤
│  PREFIX: /swagger / /v3                                              │
├────────────┼──────────────────────────────┼────────────────────────┤
│  ANY       │  /swagger-ui/**              │  ADMIN                 │
│  ANY       │  /swagger-ui.html            │  ADMIN                 │
│  ANY       │  /v3/api-docs/**             │  ADMIN                 │
├────────────┼──────────────────────────────┼────────────────────────┤
│  FALLBACK                                                             │
├────────────┼──────────────────────────────┼────────────────────────┤
│  ANY       │  any unmatched path          │  authenticated (401)   │
└────────────┴──────────────────────────────┴────────────────────────┘
```

**Important:** Order matters. In `/orders`, `GET /orders/my-orders` and `POST /orders/**` are evaluated before the wildcard `"/orders/**" → ADMIN`, ensuring USER checkout and admin listing coexist correctly.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    User     │       │  ShoppingCart    │       │    CartItem      │
├─────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)     │──1:1──│ id (PK)          │──1:N──│ id (PK)          │
│ name        │       │ user_id (FK,UQ)  │       │ cart_id (FK)     │
│ email (UQ)  │       │ created_at       │       │ product_id (FK)  │
│ password    │       │ updated_at       │       │ quantity (int)   │
│ active      │       └──────────────────┘       │ created_at       │
│ user_role   │                                        │ updated_at       │
│ created_at  │                                   └────────┬─────────┘
│ updated_at  │                                            │
└──────┬──────┘                                   ┌────────┴─────────┐
       │                                          │     Product      │
       │ 1:N                                      ├──────────────────┤
       │                                   ┌──────│ id (PK)          │
       ▼                                   │      │ name             │
┌─────────────┐        ┌──────────────┐    │      │ description      │
│    Order    │──1:N───│  OrderLine   │    │      │ price (Float)    │
├─────────────┤        ├──────────────┤    │      │ stock (Integer)  │
│ id (PK)     │        │ id (PK)      │    │      │ image_url        │
│ user_id (FK)│        │ order_id (FK)│    │      │ category_id (FK) │
│ payment_    │        │ product_id(FK)│───┘      │ created_at       │
│  status     │        │ unit_price   │           │ updated_at       │
│ total (Float)        │ quantity     │           └────────┬─────────┘
│ created_at  │        │ subtotal     │                    │
│ updated_at  │        │ created_at   │              N:1   │
└─────────────┘        │ updated_at   │                    │
                       └──────────────┘          ┌────────┴─────────┐
                                                  │    Category     │
                                                  ├──────────────────┤
                                                  │ id (PK, Short)  │
                                                  │ name            │
                                                  │ created_at      │
                                                  │ updated_at      │
                                                  └──────────────────┘

┌──────────────────────┐
│  PasswordChangeToken │
├──────────────────────┤
│ id (PK)              │
│ token (SHA-256, UQ)  │
│ user_id (FK)         │
│ expiration_date      │
│ used (boolean)       │
│ created_at           │
│ updated_at           │
└──────────────────────┘
```

### Relationship Summary

| Entity | Relation | Target | Notes |
|--------|----------|--------|-------|
| User → ShoppingCart | **1:1** | One cart per user — unique constraint on `carts.user_id` |
| ShoppingCart → CartItem | **1:N** | Cascade MERGE, orphanRemoval = true, EAGER fetch |
| CartItem → Product | **N:1** | — |
| Order → User | **N:1** | — |
| Order → OrderLine | **1:N** | Cascade PERSIST + REMOVE |
| OrderLine → Product | **N:1** | unitPrice frozen at order time |
| Product → Category | **N:1** | EAGER fetch, nullable |
| User → PasswordChangeToken | **1:N** | — |

---

## Domain Objects

### Entities

#### User (`users` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `name` | `String` | unique, not null | Display name |
| `email` | `String` | unique, not null | Used as login (getUsername()) |
| `password` | `String` | not null | BCrypt-hashed |
| `active` | `boolean` | not null | For soft-delete |
| `userRole` | `Role` (enum) | not null | `USER` or `ADMIN` |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

Implements `UserDetails`: `getUsername()` → email, `getAuthorities()` → `ROLE_USER`/`ROLE_ADMIN`.

#### Role (enum)

```java
public enum Role { USER, ADMIN }
```

#### Product (`products` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `name` | `String` | not null | — |
| `description` | `String` (TEXT) | — | Long text |
| `price` | `Float` | not null | ⚠️ Float — prone to rounding errors |
| `stock` | `Integer` | — | Nullable in DB, validated in DTO |
| `imageUrl` | `String` (TEXT) | — | URL string |
| `category` | `Category` | `@ManyToOne(EAGER)` | Can be null |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

#### Category (`categories` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Short` | PK, auto-increment | ⚠️ Short — limited to 32,767 |
| `name` | `String` | not null | — |
| `products` | `Set<Product>` | `@OneToMany(LAZY)` | Inverse side |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

#### ShoppingCart (`carts` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `user` | `User` | `@ManyToOne(LAZY)`, **unique** | One cart per user via `@UniqueConstraint(columnNames = "user_id")` |
| `items` | `Set<CartItem>` | `@OneToMany(EAGER, MERGE, orphanRemoval=true)` | Ordered LinkedHashSet |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

Key methods:
- `addItem(product)` — adds 1 unit; increments quantity if already exists
- `removeItem(productId)` — removes item from collection
- `clearItems()` — removes all items
- `getItem(productId)` — finds item by product ID
- `getTotalPrice()` — sums all item subtotals as `Float`
- `belongsTo(user)` — ownership check
- `isEmpty()` — true if no items

#### CartItem (`cart_items` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `cart` | `ShoppingCart` | `@ManyToOne` | Owning side |
| `product` | `Product` | `@ManyToOne` | — |
| `quantity` | `int` | not null | — |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

Key methods:
- `getSubtotalPrice()`: `product.getPrice() * quantity` (handles null price → 0f)

#### Order (`orders` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `customer` | `User` | `@ManyToOne(LAZY)` | Order owner |
| `paymentStatus` | `PaymentStatus` (enum STRING) | not null | Default PENDING |
| `total` | `Float` | — | ⚠️ Float |
| `lines` | `Set<OrderLine>` | `@OneToMany(PERSIST + REMOVE)` | Order items |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

Factory method: `Order.orderFromShoppingCart(user, cart)` — copies all CartItems to OrderLines, freezing unit prices.

#### OrderLine (`order_lines` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `order` | `Order` | `@ManyToOne` | Owning side |
| `product` | `Product` | `@ManyToOne` | — |
| `unitPrice` | `Float` | — | Frozen at order time |
| `quantity` | `Integer` | — | Nullable in entity |
| `subtotalPrice` | `Float` | — | Calculated: `unitPrice * quantity` |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

#### PaymentStatus (enum STRING)

```
PENDING  →  PAID  →  PROCESSING  →  REFUNDED
                                 →  CANCELED
         →  FAILED
```

No state-machine validation — any transition is allowed via `PUT /orders/{id}/status`.

#### PasswordChangeToken (`password_reset_tokens` table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `Long` | PK, auto-increment | — |
| `token` | `String` | unique, not null | SHA-256 hash of raw UUID |
| `user` | `User` | `@ManyToOne`, not null | Token owner |
| `expirationDate` | `LocalDateTime` | — | 10 minutes after creation |
| `used` | `boolean` | not null | false initially |
| `createdAt` | `LocalDateTime` | — | Auto-set |
| `updatedAt` | `LocalDateTime` | — | Auto-updated |

---

### DTOs / Responses

#### AuthResponse
```json
{
  "token": "string"   // JWT token
}
```

#### ProductResponse
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "price": 999.99,
  "stock": 50,
  "imageUrl": "string",
  "categoryId": 1,
  "categoryName": "string"
}
```

#### ProductDto (lightweight, embedded in cart/order items)
```json
{
  "id": 1,
  "name": "string",
  "price": 999.99
}
```

#### CategoryResponse
```json
{
  "id": 1,
  "name": "string"
}
```

#### CartResponse
```json
{
  "id": 1,
  "items": [
    {
      "product": { "id": 1, "name": "string", "price": 100.0 },
      "quantity": 2,
      "subtotal": 200.0
    }
  ],
  "total": 200.0
}
```

#### CartItemResponse
```json
{
  "product": { "id": 1, "name": "string", "price": 100.0 },
  "quantity": 2,
  "subtotal": 200.0
}
```

#### OrderResponse
```json
{
  "id": 1,
  "paymentStatus": "PENDING",
  "createdAt": "2026-05-12T10:30:00",
  "items": [
    {
      "product": { "id": 1, "name": "string", "price": 100.0 },
      "quantity": 2,
      "subtotalPrice": 200.0
    }
  ],
  "totalPrice": 200.0
}
```

#### OrderLineResponse
```json
{
  "product": { "id": 1, "name": "string", "price": 100.0 },
  "quantity": 2,
  "subtotalPrice": 200.0
}
```

#### UserProfileResponse (GET /auth/me)
```json
{
  "id": 1,
  "name": "string",
  "email": "string"
}
```

#### UserResponse (GET /users/{id})
```json
{
  "id": 1,
  "name": "string",
  "email": "string"
}
```

#### UserDto (GET /users — full user data, admin only)
```json
{
  "id": 1,
  "name": "string",
  "email": "string",
  "active": true,
  "createdAt": "2026-05-12T10:30:00",
  "updatedAt": "2026-05-12T10:30:00",
  "userRole": "USER"
}
```

---

### Request DTOs

#### LoginRequest (POST /auth/login)

| Field | Type | Validation |
|-------|------|------------|
| `email` | `String` | @NotBlank, @Email, max 60 |
| `password` | `String` | @NotBlank, 10-25 chars, must contain uppercase, lowercase, digit, special |

```json
{
  "email": "juan@example.com",
  "password": "User12345-"
}
```

#### RegisterRequest (POST /auth/register)

| Field | Type | Validation |
|-------|------|------------|
| `name` | `String` | @NotBlank, 5-25 chars, letters and spaces only |
| `email` | `String` | @NotBlank, @Email, max 60 |
| `password` | `String` | @NotBlank, 10-25 chars, must contain uppercase, lowercase, digit, special (same regex as login) |

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "User12345-"
}
```

#### ForgotPasswordRequest (POST /auth/forgot-password)

| Field | Type | Validation |
|-------|------|------------|
| `email` | `String` | @NotBlank, @Email |

```json
{
  "email": "juan@example.com"
}
```

#### ResetPasswordRequest (POST /auth/reset-password)

| Field | Type | Validation |
|-------|------|------------|
| `token` | `String` | @NotBlank — the UUID received by email |
| `newPassword` | `String` | @NotBlank, 10-25 chars, uppercase + lowercase + digit + special |

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "newPassword": "NewP4ssword-"
}
```

#### ChangePassword (POST /auth/change-password — authenticated)

| Field | Type | Validation |
|-------|------|------------|
| `oldPassword` | `String` | @NotBlank, 10-25 chars |
| `newPassword` | `String` | @NotBlank, 10-25 chars, uppercase + lowercase + digit + special |

```json
{
  "oldPassword": "User12345-",
  "newPassword": "NewP4ssword-"
}
```

#### ProductRequest (POST/PUT /products)

| Field | Type | Validation |
|-------|------|------------|
| `name` | `String` | @NotNull, 5-80 chars |
| `description` | `String` | @NotNull, 10-600 chars |
| `price` | `float` (primitive) | @NotNull, @PositiveOrZero |
| `categoryId` | `Short` | @NotNull, @Positive |
| `stock` | `int` (primitive) | @NotNull, @Min(0) |
| `imageUrl` | `String` | @NotNull, @URL |

```json
{
  "name": "Notebook ASUS ROG",
  "description": "High-performance gaming laptop with RTX 5080...",
  "price": 8108400.0,
  "categoryId": 1,
  "stock": 150,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### CategoryRequest (POST/PUT /categories)

| Field | Type | Validation |
|-------|------|------------|
| `name` | `String` | @NotNull, 3-25 chars, letters and spaces only |

```json
{
  "name": "Electrónica"
}
```

#### AddItemRequest (POST /carts/{cartId}/items)

| Field | Type | Validation |
|-------|------|------------|
| `productId` | `Long` | @NotNull, @Min(1) |

```json
{
  "productId": 1
}
```

> **Note:** Always adds **1 unit**. If the product is already in the cart, increments quantity by 1.

#### UpdateItemRequest (PUT /carts/{cartId}/items/{productId})

| Field | Type | Validation |
|-------|------|------------|
| `quantity` | `Integer` | @NotNull, @Min(0), @Max(1000000) |

```json
{
  "quantity": 5
}
```

> **Note:** Setting quantity to 0 keeps the item with 0 quantity (does not auto-remove). Use DELETE to remove.

#### UpdateUser (PUT /users/{id})

| Field | Type | Validation |
|-------|------|------------|
| `name` | `String` | @NotBlank, 5-25 chars, letters and spaces only |

```json
{
  "name": "Juan Pérez"
}
```

---

## API Endpoints

### Auth

#### `POST /auth/register` — PUBLIC

Register a new user.

- **Request:** `RegisterRequest`
- **Response** `200 OK`: `UserDto`
- **Errors:** `400` — validation error or duplicate email/name

#### `POST /auth/login` — PUBLIC

Authenticate and receive JWT.

- **Request:** `LoginRequest`
- **Response** `200 OK`: `AuthResponse` (`{ "token": "..." }`)
- **Errors:** `401` — invalid credentials

#### `POST /auth/forgot-password` — PUBLIC

Request a password reset email.

- **Request:** `ForgotPasswordRequest`
- **Response** `200 OK` (always, even if email not found):
  ```json
  { "message": "If an account with that email exists, a password reset link has been sent." }
  ```
- **Behavior:**
  1. Invalidates any existing unused tokens for the user
  2. Generates UUID token
  3. Sends email with reset link: `{FRONTEND_URL}/reset?token={uuid}`
  4. Only persists the token AFTER successful email send
  5. Token is SHA-256 hashed before storage
  6. Email contains both HTML (with styled button) and plain text fallback
- **Errors:** `400` — email validation, `500` — email service failure

#### `GET /auth/validate?token={uuid}` — PUBLIC

Check if a reset token is valid.

- **Response** `200 OK`: `{ "message": "Token is valid" }`
- **Errors:** `400` — token invalid, expired, or already used

#### `POST /auth/reset-password` — PUBLIC

Reset password using token from email. Does NOT require old password.

- **Request:** `ResetPasswordRequest`
- **Response** `200 OK`: `{ "message": "Password reset successfully" }`
- **Behavior:**
  1. Validates token (hashes input, compares with stored hash)
  2. Encodes new password with BCrypt
  3. Updates user
  4. Deletes the used token
- **Errors:** `400` — invalid/expired token, validation error

#### `POST /auth/logout` — USER / ADMIN

Invalidate current JWT.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `204 No Content`

#### `GET /auth/me` — USER / ADMIN

Get current user's profile.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `UserProfileResponse`
- **Errors:** `401` — no token, `404` — user not found

#### `POST /auth/change-password` — USER / ADMIN

Change password while logged in. Requires old password + JWT.

- **Headers:** `Authorization: Bearer {jwt}`
- **Request:** `ChangePassword`
- **Response** `200 OK`: `{ "message": "Password changed successfully" }`
- **Errors:** `400` — old password incorrect, validation error

---

### Products

#### `GET /products` — PUBLIC

List all products.

- **Query params:** `?categoryId={id}` (optional, filter by category)
- **Response** `200 OK`: `ProductResponse[]`

#### `GET /products/{id}` — USER / ADMIN

Get product by ID.

- **Response** `200 OK`: `ProductResponse`
- **Errors:** `404` — product not found

#### `POST /products` — ADMIN

Create a new product.

- **Request:** `ProductRequest`
- **Response** `200 OK`: `ProductResponse`
- **Errors:** `400` — validation error

#### `PUT /products/{id}` — ADMIN

Update an existing product.

- **Request:** `ProductRequest` (all fields required)
- **Response** `200 OK`: `ProductResponse`
- **Errors:** `404` — product not found

#### `DELETE /products/{id}` — ADMIN

Delete a product.

- **Response** `204 No Content`
- **Errors:** `404` — product not found

---

### Categories

#### `GET /categories` — PUBLIC

List all categories.

- **Response** `200 OK`: `CategoryResponse[]`

#### `GET /categories/all` — ADMIN

List all categories (raw entity, no DTO wrapping).

- **Response** `200 OK`: Category entity array (includes timestamps)

#### `GET /categories/{id}` — USER / ADMIN

Get category by ID.

- **Response** `200 OK`: `CategoryResponse`
- **Errors:** `404` — category not found

#### `POST /categories` — ADMIN

Create a new category.

- **Request:** `CategoryRequest`
- **Response** `200 OK`: `CategoryResponse`
- **Errors:** `400` — validation error, duplicate name

#### `PUT /categories/{id}` — ADMIN

Update a category.

- **Request:** `CategoryRequest`
- **Response** `200 OK`: `CategoryResponse`
- **Errors:** `400` — duplicate name

#### `DELETE /categories/{id}` — ADMIN

Delete a category. Sets `category = null` on affected products.

- **Response** `204 No Content`
- **Errors:** `404` — category not found

---

### Shopping Cart

> **Key rule:** Each user has exactly **one** cart. Use `GET /carts/mine` to always get it without needing to track a cartId.

#### `GET /carts/mine` — USER

Get current user's cart. Auto-creates one if the user doesn't have a cart yet.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `CartResponse`
- **This is the recommended way to get the cart from the frontend.**

#### `POST /carts` — USER

Create a new cart. **Idempotent** — if the user already has a cart, returns the existing one.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `201 Created`: `CartResponse` with Location header

#### `GET /carts/{cartId}` — USER

Get cart by ID. Validates ownership.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `CartResponse`
- **Errors:** `403` — not your cart, `404` — cart not found

#### `POST /carts/{cartId}/items` — USER

Add a product to the cart (1 unit). If product already in cart, increments quantity by 1.

- **Headers:** `Authorization: Bearer {jwt}`
- **Request:** `AddItemRequest`
- **Response** `201 Created`: `CartItemResponse`
- **Errors:** `403` — not your cart, `404` — cart/product not found

#### `PUT /carts/{cartId}/items/{productId}` — USER

Update item quantity.

- **Headers:** `Authorization: Bearer {jwt}`
- **Request:** `UpdateItemRequest`
- **Response** `200 OK`: `CartItemResponse`
- **Errors:** `403`, `404`

#### `DELETE /carts/{cartId}/items/{productId}` — USER

Remove a specific item from the cart.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `204 No Content`

#### `DELETE /carts/{cartId}/items` — USER

Clear all items from the cart.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `204 No Content`

---

### Orders

#### `POST /orders/checkout/{cartId}` — USER

Checkout: create an order from the cart.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `OrderResponse` (paymentStatus = "PENDING")
- **Behavior (inside `@Transactional`):**
  1. Validates cart ownership
  2. Validates cart is not empty
  3. For each item: validates product.stock >= item.quantity; reduces stock
  4. Creates Order from cart items (freezes unit prices)
  5. Clears the cart
  6. If ANY step fails → full rollback
- **Errors:**
  - `403` — not your cart
  - `404` — cart not found
  - `422` — cart is empty
  - `409` — insufficient stock (`InsufficientStockException`)
  - `500` — unexpected error (rolls back)

#### `GET /orders/my-orders` — USER

Get current user's orders.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `OrderResponse[]`

#### `GET /orders` — ADMIN

List all orders.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `OrderResponse[]`

#### `GET /orders/{orderId}` — ADMIN

Get order by ID.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `OrderResponse`
- **Errors:** `404` — order not found

#### `PUT /orders/{orderId}/status?status={status}` — ADMIN

Update order payment status.

- **Headers:** `Authorization: Bearer {jwt}`
- **Query params:** `status` — one of: `PENDING`, `PAID`, `PROCESSING`, `CANCELED`, `FAILED`, `REFUNDED`
- **Response** `200 OK`: `OrderResponse`
- **Errors:** `404` — order not found

---

### Users

#### `GET /users` — ADMIN

List all active users.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `UserDto[]`

#### `GET /users/{id}` — ADMIN

Get user by ID.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `200 OK`: `UserResponse`
- **Errors:** `404` — user not found

#### `PUT /users/{id}` — USER / ADMIN

Update user's display name. USER can update own profile; ADMIN can update any.

- **Headers:** `Authorization: Bearer {jwt}`
- **Request:** `UpdateUser`
- **Response** `200 OK`: `UserResponse`
- **Errors:** `403` — not your own profile (and not admin), `404` — user not found

#### `DELETE /users/{id}` — ADMIN

Hard-delete a user.

- **Headers:** `Authorization: Bearer {jwt}`
- **Response** `204 No Content`
- **Errors:** `404` — user not found

---

## Business Rules

### Cart (one per user)

- Each user has exactly **one** shopping cart.
- Enforced at DB level via `@UniqueConstraint(columnNames = "user_id")` on the `carts` table.
- `POST /carts` is idempotent: returns existing cart if user already has one.
- `GET /carts/mine` uses get-or-create pattern: always returns a cart.
- Every modification validates ownership via `belongsTo(user)`.

### Stock Management

- **Stock is reduced on checkout** inside a `@Transactional` block.
- If any product has insufficient stock (`stock < quantity`), the entire checkout rolls back and returns `409 Conflict`.
- If `product.stock` is null (possible in DB), it is treated as 0 (insufficient).
- There is no stock increment endpoint — stock only decreases when orders are placed.

### Order Creation

- `Order.orderFromShoppingCart()` freezes the `unitPrice` at the current product price.
- After checkout, the cart is cleared and stock is reduced.
- All operations (stock reduction, order creation, cart clearing) are atomic via `@Transactional`.

### Password Reset

1. User requests reset → server generates UUID token
2. **SHA-256 hash** of the token is stored in the DB (never the raw token)
3. **Email is sent first** with the raw token. Only on success is the hash persisted.
4. Token expires in **10 minutes**
5. Token is **single-use** — deleted after successful password change
6. Previous unused tokens for the same user are invalidated when a new one is requested
7. Endpoint always returns 200 regardless of whether the email exists (prevents email enumeration)

### Ownership Validation

- Cart operations: `ShoppingCartServiceImpl.validateOwnership()` checks `cart.belongsTo(currentUser)`
- User profile access: `UserAccessValidate.validateUserAccess()` checks that the authenticated user ID matches the target user ID (or is ADMIN)
- Order listing: `GET /orders/my-orders` filters by authenticated user

### Email

- Only one email type is sent: password reset.
- Email contains both `text/plain` (fallback) and `text/html` (styled with button) versions.
- HTML includes user's name and expiration notice.
- Configuration: SMTP via environment variables (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`).

---

## Error Handling

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful operation |
| `201` | Resource created (cart, cart item) |
| `204` | Deletion, logout (no content) |
| `400` | Validation error (`MethodArgumentNotValidException`), invalid token, invalid request body |
| `401` | Missing/invalid JWT (`BadCredentialsException`, `InsufficientAuthenticationException`) |
| `403` | Forbidden — wrong role or resource ownership (`AccessDeniedException`) |
| `404` | Resource not found (product, category, cart, order, user) |
| `409` | Conflict — insufficient stock (`InsufficientStockException`) |
| `422` | Unprocessable — cart is empty (`CartEmptyException`) |
| `500` | Internal server error, email failure |

### Validation Error Response (400)

```json
{
  "fieldName": "error message for this field",
  "anotherField": "another error message"
}
```

### General Error Response

```json
{
  "error": "Error description"
}
```

### Specific Error Messages by Exception

| Exception | HTTP | Message |
|-----------|------|---------|
| `DuplicateUserException` | 400 | "Email already registered" / "Username already exists" |
| `DuplicateCategory` | 400 | Custom message |
| `UserNotFoundException` | 404 | "User not found." |
| `ProductNotFoundException` | 404 | "Product not found." |
| `CategoryNotFoundException` | 404 | "Category not found." |
| `CartNotFoundException` | 404 | "Cart not found." |
| `OrderNotFoundException` | 404 | "Order not found." |
| `CartEmptyException` | 422 | "Cart is empty." |
| `InsufficientStockException` | 409 | "Stock insuficiente para: {productName}" |
| `BadCredentialsException` | 401 | "Invalid credentials." |
| `AccessDeniedException` | 403 | "You do not have permission to access this resource." |
| `InsufficientAuthenticationException` | 401 | "Authentication required to access this resource." |
| `MessagingException` | 500 | "Failed to send email. Please try again later." |
| `HttpServerErrorException.InternalServerError` | 500 | "An unexpected error occurred. Please try again later." |

---

## Test Credentials

> Pre-loaded by `DataLoader.java` when the database is empty.

| Role | Name | Email | Password |
|------|------|-------|----------|
| 👑 **ADMIN** | Admin | `admin@techlab.com` | `Admin12345-` |
| 👤 **USER** | Juan Pérez | `juan@example.com` | `User12345-` |
| 👤 **USER** | María García | `maria@example.com` | `User12345-` |

### Sample Data

- **12 products** across 5 categories (Electrónica, Ropa, Hogar, Deportes, Libros)
- **2 shopping carts** — one for each user (Juan's has no items post-seed, María's is empty)
- **1 sample order** for Juan (PAID status, with 3 items)
- Juan's cart is cleared after the sample order is created

---

## Typical Frontend Flow

```
1. VISIT SITE (no auth)
   GET  /products                        → show product catalog
   GET  /categories                      → show category filter

2. REGISTER / LOGIN
   POST /auth/register  or  POST /auth/login  → receive JWT
   → Store JWT in localStorage/sessionStorage

3. BROWSE & ADD TO CART (auth required)
   GET  /carts/mine                      → get or create cart (don't need to store cartId)
   POST /carts/{id}/items { productId }  → add 1 unit
   GET  /carts/mine                      → refresh cart (items, total)

4. MANAGE CART (auth required)
   PUT  /carts/{id}/items/{productId} { quantity }  → update quantity
   DELETE /carts/{id}/items/{productId}             → remove item
   DELETE /carts/{id}/items                         → clear cart

5. CHECKOUT (auth required)
   POST /orders/checkout/{cartId}        → create order, reduce stock, clear cart
   → Handle 409 if stock insufficient
   → Navigate to order confirmation

6. VIEW ORDERS (auth required)
   GET  /orders/my-orders                → list user's orders

7. PROFILE (auth required)
   GET  /auth/me                         → get user profile
   PUT  /users/{id} { name }             → update display name
   POST /auth/change-password { old, new } → change password

8. PASSWORD RESET (no auth)
   POST /auth/forgot-password { email }  → receive email
   GET  /auth/validate?token={uuid}      → validate token
   POST /auth/reset-password { token, newPassword } → set new password

9. ADMIN FLOW
   POST /products { ... }                → create product
   PUT  /products/{id} { ... }           → update product
   DELETE /products/{id}                 → delete product
   POST /categories { name }             → create category
   GET  /orders                          → list all orders
   PUT  /orders/{id}/status?status=PAID  → update payment status
   GET  /users                           → list all users
   GET  /users/{id}                      → get user details
   PUT  /users/{id} { name }             → update user
   DELETE /users/{id}                    → delete user

10. LOGOUT
    POST /auth/logout                    → invalidate JWT
    → Clear JWT from storage
    → Redirect to login
```
