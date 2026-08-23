# Technical Architecture & Backend Blueprint

## Blissfy.co

| Informasi | Detail |
| --- | --- |
| Dokumen | Technical Architecture & Backend Blueprint |
| Versi | 1.0 |
| Tanggal | 19 Agustus 2026 |
| Acuan produk | PRD Blissfy.co v1.4 |
| Gaya arsitektur | Monorepo + Modular Monolith + Clean Architecture pragmatis |
| Backend | NestJS + TypeScript |
| Database | Supabase PostgreSQL |

---

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan teknis implementasi Blissfy.co setelah keputusan arsitektur v1.4.

Tujuan utamanya:

1. Memisahkan Store UI, Admin UI, dan Backend API secara tegas.
2. Menentukan dependency boundary agar business logic tidak bercampur dengan React/UI.
3. Menjadikan backend sebagai source of truth untuk transaksi.
4. Menjaga codebase tetap mudah dirawat oleh satu developer melalui monorepo.
5. Menghasilkan backend yang kuat sebagai portfolio tanpa over-engineering.
6. Menyiapkan struktur yang dapat bertumbuh tanpa harus langsung menggunakan microservices.

---

## 2. Prinsip Arsitektur

### 2.1 Prinsip utama

- **One monorepo, multiple applications.**
- **Frontend owns presentation; backend owns business rules.**
- **Backend is the only trusted mutation layer.**
- **Database is infrastructure, not application architecture.**
- **Provider eksternal dibungkus adapter.**
- **Domain tidak mengetahui framework/provider.**
- **Controller harus tipis.**
- **Use case mengorkestrasi bisnis.**
- **Repository abstraction mengisolasi persistence.**
- **Shared package dibuat sesedikit mungkin.**
- **Modular monolith dipilih sebelum microservices.**
- **Consistency dan correctness diprioritaskan untuk order/payment/inventory.**

### 2.2 Non-goals

Arsitektur ini tidak bertujuan:

- membuat microservices,
- membuat event-driven distributed system,
- membuat CQRS penuh,
- membuat domain model yang terlalu kompleks untuk semua CRUD,
- memisahkan database per module,
- membuat abstraction hanya demi abstraction.

---

## 3. System Context

```text
                            ┌────────────────────┐
                            │     Pelanggan      │
                            └─────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   Store Frontend    │
                           │ Next.js / TypeScript│
                           └──────────┬──────────┘
                                      │ HTTPS REST
                                      │
                                      ▼
┌────────────────────┐      ┌─────────────────────┐       ┌────────────────────┐
│       Admin        │─────▶│   Blissfy Backend   │──────▶│ Supabase PostgreSQL│
└─────────┬──────────┘ HTTPS│ NestJS Modular Mono │       └────────────────────┘
          │                  └─────────┬───────────┘
          ▼                            │
┌─────────────────────┐               ├──────────────▶ Midtrans
│   Admin Frontend    │               ├──────────────▶ RajaOngkir/Komerce
│ Next.js / TypeScript│               ├──────────────▶ Cloudinary
└─────────────────────┘               └──────────────▶ Email Provider
```

Konsep host:

```text
blissfy.co        -> Store Frontend
admin.blissfy.co  -> Admin Frontend
api.blissfy.co    -> Backend API
```

---

## 4. Monorepo Layout

```text
blissfy/
├── apps/
│   ├── store/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── package.json
│   │
│   ├── admin/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── contracts/
│   ├── types/
│   ├── validation/
│   ├── config/
│   ├── eslint-config/
│   └── tsconfig/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── adr/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### 4.1 Workspace ownership

| Workspace | Tanggung jawab |
| --- | --- |
| `apps/store` | UI pelanggan, cart client state, SEO, API consumption |
| `apps/admin` | UI admin, forms, dashboards, API consumption |
| `apps/api` | Semua business logic, persistence, authz, integrations |
| `packages/contracts` | Shared API request/response contracts |
| `packages/types` | Shared types yang aman untuk frontend |
| `packages/validation` | Schema lintas app jika benar-benar identik |
| `supabase` | SQL migrations, seed, DB-local tooling |
| `docs` | Architecture, API notes, ADR |

### 4.2 Forbidden dependency

```text
apps/store  ─X─> database implementation
apps/admin  ─X─> database implementation
apps/store  ─X─> Midtrans server SDK/secret
apps/admin  ─X─> Midtrans server SDK/secret
packages/*  ─X─> application secrets
```

---

## 5. Backend Module Map

Backend menggunakan modular monolith.

```text
apps/api/src/modules/
├── auth/
├── products/
├── categories/
├── discounts/
├── inventory/
├── checkout/
├── orders/
├── payments/
├── shipping/
├── uploads/
├── settings/
├── audit/
└── jobs/
```

### 5.1 Module responsibilities

#### `auth`

- Verifikasi Supabase access token.
- Resolve admin identity.
- Authorization guard untuk endpoint admin.
- Tidak menyimpan password sendiri jika Supabase Auth digunakan.

#### `products`

- Product lifecycle.
- Product detail.
- Product publication/archive.
- Product images reference.
- Query katalog.

#### `categories`

- Category CRUD.
- Category-product relation.

#### `discounts`

- Validasi diskon.
- Active discount resolution.
- Price calculation rules.

#### `inventory`

- Variant stock.
- Stock reservation.
- Inventory movement.
- Manual adjustment.
- Overselling prevention.

#### `checkout`

- Validasi cart snapshot dari frontend.
- Resolve current product/variant/price.
- Shipping quote validation.
- Calculate payable total.
- Orchestrate order creation.

#### `orders`

- Order aggregate/lifecycle.
- Order item snapshot.
- Fulfillment transition.
- Tracking access token.
- Order read models untuk admin/customer.

#### `payments`

- Payment creation.
- Midtrans adapter.
- Payment status mapping.
- Webhook validation.
- Idempotency.
- Retry payment.
- Reconciliation.

#### `shipping`

- Shipping quote.
- Provider adapter.
- Package weight.
- Shipping snapshot.
- Shipment/resi.

#### `uploads`

- Cloudinary signed upload.
- Verify upload metadata.
- Delete asset orchestration.

#### `settings`

- Origin address.
- Packaging weight.
- Store-level configuration yang aman.

#### `audit`

- Admin-sensitive operations.
- Security-relevant events.

#### `jobs`

- Payment reconciliation.
- Expired reservation recovery.
- PII retention/anonymization.

---

## 6. Clean Architecture per Module

Struktur default:

```text
modules/orders/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   ├── ports/
│   ├── dto/
│   └── mappers/
│
├── infrastructure/
│   ├── persistence/
│   ├── repositories/
│   └── providers/
│
└── presentation/
    ├── controllers/
    └── presenters/
```

### 6.1 Dependency rule

```text
presentation ──> application ──> domain
                       ▲
                       │
infrastructure ─────────┘
```

- `domain` tidak import NestJS.
- `domain` tidak import database client.
- `domain` tidak import Midtrans/Cloudinary/RajaOngkir SDK.
- `application` bergantung pada port/interface.
- `infrastructure` mengimplementasikan port.
- `presentation` mengubah HTTP request menjadi input use case.

### 6.2 Pragmatic rule

Untuk CRUD sederhana seperti category, tidak perlu memaksa entity/value-object kompleks.

Gunakan struktur minimal bila cukup:

```text
categories/
├── application/
├── infrastructure/
└── presentation/
```

Clean architecture dipakai untuk menjaga arah dependency, bukan memperbanyak file.

---

## 7. Request Lifecycle

Contoh endpoint admin:

```text
PATCH /v1/admin/products/:id
```

Flow:

```text
HTTP Request
   ↓
Auth Guard
   ↓
Validation Pipe
   ↓
ProductController
   ↓
UpdateProductUseCase
   ↓
ProductRepository Port
   ↓
PostgresProductRepository
   ↓
Supabase PostgreSQL
   ↓
Result
   ↓
Presenter / Response DTO
```

Controller tidak boleh memiliki logic harga, stok, payment, atau transaction orchestration.

---

## 8. API Design Standard

### 8.1 Versioning

Base version:

```text
/v1
```

### 8.2 Resource naming

Gunakan plural noun:

```text
/v1/products
/v1/orders
/v1/admin/orders
```

Hindari endpoint verb-heavy seperti:

```text
/createProduct
/getOrders
```

### 8.3 Success response

Untuk resource tunggal:

```json
{
  "data": {
    "id": "..."
  }
}
```

Untuk list:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 8.4 Error response

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stok produk tidak mencukupi.",
    "details": null,
    "requestId": "req_..."
  }
}
```

Error `code` harus stabil agar frontend tidak bergantung pada string message.

### 8.5 HTTP status guideline

| Kasus | Status |
| --- | --- |
| Success GET/PATCH | 200 |
| Created | 201 |
| Empty success DELETE | 204 |
| Invalid input | 400 |
| Unauthenticated | 401 |
| Unauthorized | 403 |
| Not found | 404 |
| Conflict/idempotency/state | 409 |
| Rate limited | 429 |
| Provider/internal error | 5xx sesuai kasus |

### 8.6 Idempotency

Operasi kritis menggunakan `Idempotency-Key`:

```text
POST /v1/orders
POST /v1/orders/:token/retry-payment
```

Backend menyimpan hasil operasi berdasarkan kombinasi scope + key.

---

## 9. API Endpoint Blueprint

### 9.1 Public catalog

```text
GET /v1/products
GET /v1/products/:slug
GET /v1/categories
```

Query contoh:

```text
GET /v1/products?category=dress&size=M&color=black&page=1&limit=20
```

### 9.2 Shipping

```text
POST /v1/shipping/rates
```

Request konseptual:

```json
{
  "destination": {
    "provinceId": "...",
    "cityId": "...",
    "districtId": "...",
    "postalCode": "..."
  },
  "items": [
    {
      "variantId": "uuid",
      "quantity": 2
    }
  ]
}
```

Backend menghitung berat dari database, bukan mempercayai `weight` dari frontend.

### 9.3 Order creation

```text
POST /v1/orders
Idempotency-Key: <uuid>
```

Request:

```json
{
  "items": [
    {
      "variantId": "uuid",
      "quantity": 2
    }
  ],
  "customer": {
    "name": "...",
    "email": "...",
    "whatsapp": "..."
  },
  "shippingAddress": {
    "province": "...",
    "city": "...",
    "district": "...",
    "postalCode": "...",
    "addressLine": "..."
  },
  "shippingQuoteId": "...",
  "notes": "..."
}
```

Frontend tidak mengirim trusted subtotal/total.

Response:

```json
{
  "data": {
    "orderNumber": "BLF-...",
    "accessToken": "...",
    "payment": {
      "status": "PENDING",
      "amount": 289000,
      "qrUrl": "...",
      "expiresAt": "..."
    }
  }
}
```

### 9.4 Tracking

```text
GET /v1/orders/track/:accessToken
```

Response tidak boleh menampilkan PII berlebihan.

### 9.5 Admin product

```text
GET    /v1/admin/products
POST   /v1/admin/products
GET    /v1/admin/products/:id
PATCH  /v1/admin/products/:id
```

### 9.6 Admin inventory

```text
PATCH /v1/admin/inventory/:variantId
```

Request:

```json
{
  "adjustment": 5,
  "reason": "RESTOCK"
}
```

Tidak menerima `newStock` mentah jika ledger movement lebih aman untuk audit; backend menghitung saldo akhir.

### 9.7 Admin order

```text
GET   /v1/admin/orders
GET   /v1/admin/orders/:id
PATCH /v1/admin/orders/:id/status
PATCH /v1/admin/orders/:id/shipment
```

### 9.8 Upload

```text
POST /v1/admin/uploads/sign
POST /v1/admin/products/:id/images
PATCH /v1/admin/products/:id/images/:imageId
DELETE /v1/admin/products/:id/images/:imageId
```

### 9.9 Webhook

```text
POST /v1/webhooks/midtrans
```

Endpoint ini public secara jaringan, tetapi provider-authenticated melalui signature verification.

---

## 10. Authentication & Authorization

### 10.1 Admin authentication

Supabase Auth menangani identity authentication.

Flow:

```text
Admin Frontend
    ↓ login
Supabase Auth
    ↓ access token
Admin Frontend
    ↓ Authorization: Bearer <token>
Backend API
    ↓ verify token
Admin Authorization Guard
    ↓
Use Case
```

### 10.2 Authorization

Backend wajib memastikan user tersebut memang admin yang diizinkan.

Possible policy MVP:

```text
valid Supabase user
AND
user id/email tercatat sebagai active admin
```

UI tidak dianggap security boundary.

### 10.3 Guest customer

Customer tidak memiliki account/session global.

Order tracking menggunakan random high-entropy access token.

Token harus:

- tidak sequential,
- tidak diturunkan dari order number,
- cukup panjang,
- tidak dicatat plaintext dalam analytics log.

---

## 11. Database Architecture

### 11.1 Core tables

```text
admin_users
categories
products
product_images
product_variants
discounts
orders
order_items
payments
payment_events
shipments
stock_reservations
inventory_movements
store_settings
audit_logs
idempotency_keys
```

### 11.2 Important constraints

- `products.slug` unique.
- `product_variants.sku` unique.
- Monetary values menggunakan integer smallest currency unit/rupiah integer; hindari float.
- Payment provider transaction/reference unique.
- Payment event/provider event id unique bila tersedia.
- `stock >= 0` invariant dijaga oleh transaction logic.
- Satu primary image per product.
- Tracking token unique.
- Idempotency key unique per operation scope.

### 11.3 Inventory ledger

`inventory_movements` menjadi audit trail perubahan stok.

Movement type contoh:

```text
INITIAL
RESTOCK
MANUAL_ADJUSTMENT
RESERVATION_CREATED
RESERVATION_RELEASED
SALE_COMMITTED
RETURNED
```

Tidak semua movement harus mengubah `stock_on_hand` dengan cara yang sama; definisi stok harus konsisten.

Recommended conceptual values:

```text
on_hand       = stok fisik
reserved      = stok ditahan payment pending
available     = on_hand - reserved
```

### 11.4 Reservation

`stock_reservations` minimal:

```text
id
order_id
variant_id
quantity
status
expires_at
created_at
released_at
committed_at
```

Status:

```text
ACTIVE
COMMITTED
RELEASED
EXPIRED
```

### 11.5 Transaction boundary

Pembuatan order minimal membutuhkan transaction yang melindungi:

1. Validasi availability.
2. Lock/update reservation state.
3. Insert order.
4. Insert order items.
5. Insert stock reservation.

Panggilan provider eksternal sebaiknya tidak menahan DB lock lebih lama dari perlu.

Gunakan workflow yang memisahkan DB transaction dan external call secara aman, lalu lakukan compensation/recovery jika payment creation gagal.

---

## 12. Order Domain Blueprint

### 12.1 Order state

Fulfillment:

```text
WAITING_PAYMENT
PROCESSING
PACKED
SHIPPED
DELIVERED
CANCELLED
```

Payment:

```text
PENDING
PAID
EXPIRED
FAILED
REFUNDED
```

Kedua state disimpan terpisah.

### 12.2 Allowed fulfillment transitions

```text
WAITING_PAYMENT -> PROCESSING   (setelah payment PAID)
PROCESSING      -> PACKED
PACKED          -> SHIPPED
SHIPPED         -> DELIVERED
WAITING_PAYMENT -> CANCELLED    (sesuai rule)
PROCESSING      -> CANCELLED    (hanya bila policy mengizinkan)
```

Invalid transition harus menghasilkan domain/application error, bukan sekadar di-disable pada UI.

### 12.3 Order snapshot

`order_items` wajib menyimpan snapshot:

- product name,
- variant label,
- SKU,
- normal price,
- discount,
- final unit price,
- quantity.

Perubahan katalog setelah transaksi tidak mengubah histori.

---

## 13. Checkout Use Case Blueprint

Use case utama:

```text
CreateOrderUseCase
```

Input hanya berisi identifier dan data customer yang diperlukan.

Flow:

```text
1. Validate request
2. Resolve variants
3. Reject inactive/unavailable variants
4. Resolve current prices
5. Resolve active discounts
6. Calculate subtotal
7. Resolve package weight
8. Validate shipping quote
9. Calculate grand total
10. Acquire inventory consistency boundary
11. Create order + order items
12. Create stock reservations
13. Commit DB transaction
14. Create Midtrans payment
15. Persist payment reference
16. Return payment information
```

Jika step 14 gagal setelah order/reservation dibuat:

- order/payment harus masuk state yang dapat direcover,
- reservation tidak boleh tertahan tanpa batas,
- retry/recovery job dapat memperbaiki state.

Jangan mencoba membuat distributed transaction dengan provider eksternal.

---

## 14. Payment Architecture

### 14.1 Port

Application layer mendefinisikan interface konseptual:

```ts
interface PaymentGateway {
  createQrisPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(reference: string): Promise<PaymentStatusResult>;
  verifyWebhook(payload: unknown): Promise<VerifiedPaymentEvent>;
}
```

Midtrans hanya di infrastructure:

```text
infrastructure/providers/midtrans-payment.gateway.ts
```

### 14.2 Webhook flow

```text
Midtrans
   ↓
WebhookController
   ↓
Verify signature
   ↓
Normalize provider status
   ↓
ProcessPaymentEventUseCase
   ↓
Check event idempotency
   ↓
DB transaction
   ├─ update payment
   ├─ update order
   └─ commit/release reservation
   ↓
Persist payment event
```

### 14.3 Security checks

- Signature valid.
- Provider transaction reference cocok.
- Order reference cocok.
- Amount cocok dengan nilai backend.
- Event status di-map secara eksplisit.
- Duplicate event tidak mengulang side effect.

---

## 15. Shipping Architecture

Application port:

```ts
interface ShippingProvider {
  getRates(input: ShippingRateInput): Promise<ShippingRate[]>;
}
```

Provider-specific detail tidak masuk domain.

Shipping quote yang dipilih harus dapat divalidasi dan disnapshot sebelum order final.

Jangan mempercayai biaya ongkir yang dikirim langsung oleh browser.

---

## 16. Cloudinary Upload Architecture

### 16.1 Signed upload flow

```text
Admin Frontend
   ↓ POST /v1/admin/uploads/sign
Backend
   ↓ verify admin
CloudinarySigner
   ↓
Admin receives short-lived signature
   ↓
Browser -> Cloudinary direct upload
   ↓
Cloudinary metadata
   ↓
Admin -> Backend metadata registration
   ↓
Backend verifies allowed folder/public_id
   ↓
product_images
```

### 16.2 Validation

- MIME/extension allowlist.
- Maximum size.
- Maximum image count per product.
- Cloudinary folder prefix whitelist.
- Jangan menerima arbitrary external image URL.

---

## 17. Shared Contract Strategy

`packages/contracts` berisi bentuk API yang aman dipakai lintas app.

Contoh:

```text
contracts/
├── products/
├── orders/
├── payments/
├── shipping/
└── admin/
```

Rules:

- Tidak import database model.
- Tidak export ORM entity.
- Tidak export provider SDK type.
- API DTO tidak harus identik dengan DB row.
- Backward-compatible change diprioritaskan untuk endpoint yang sudah dipakai.

---

## 18. Validation Strategy

Validasi terjadi pada beberapa boundary:

### Frontend

Untuk UX cepat:

- required field,
- format email,
- file size/type,
- basic quantity.

### Backend

Menjadi validation authoritative:

- request schema,
- business invariants,
- authorization,
- product state,
- stock,
- pricing,
- shipping validity,
- payment state.

Frontend validation tidak menggantikan backend validation.

---

## 19. Error Taxonomy

Domain/application error code contoh:

```text
PRODUCT_NOT_FOUND
VARIANT_NOT_FOUND
PRODUCT_INACTIVE
INSUFFICIENT_STOCK
INVALID_DISCOUNT
SHIPPING_QUOTE_EXPIRED
SHIPPING_PROVIDER_UNAVAILABLE
ORDER_NOT_FOUND
ORDER_INVALID_STATE
PAYMENT_ALREADY_PAID
PAYMENT_EXPIRED
PAYMENT_WEBHOOK_INVALID
UNAUTHORIZED_ADMIN
FORBIDDEN
IDEMPOTENCY_CONFLICT
```

Frontend menggunakan `error.code` untuk menentukan state UI.

---

## 20. Security Blueprint

### 20.1 Secrets

API-only:

```text
SUPABASE service/server credentials yang diperlukan
MIDTRANS_SERVER_KEY
CLOUDINARY_API_SECRET
SHIPPING_API_KEY
EMAIL_PROVIDER_SECRET
```

Frontend hanya mendapat public configuration yang aman.

### 20.2 CORS

Allowlist production:

```text
https://blissfy.co
https://admin.blissfy.co
```

Development origin dikonfigurasi terpisah.

### 20.3 Rate limiting targets

Prioritas:

- admin login-related endpoints,
- order creation,
- shipping rate,
- upload sign,
- tracking brute-force protection,
- webhook abuse protection tanpa mengganggu provider yang sah.

### 20.4 Logging

Jangan log penuh:

- password/token,
- API secret,
- payment credential,
- complete address bila tidak diperlukan,
- raw customer PII tanpa masking.

---

## 21. Observability

Minimum backend observability:

```text
requestId
method
path
statusCode
duration
module/useCase
errorCode
providerName (jika relevan)
```

Health endpoints:

```text
GET /health
GET /health/ready   (optional)
```

Audit events contoh:

```text
ADMIN_PRODUCT_CREATED
ADMIN_PRODUCT_UPDATED
ADMIN_INVENTORY_ADJUSTED
ADMIN_ORDER_STATUS_CHANGED
ADMIN_SHIPMENT_UPDATED
ADMIN_IMAGE_DELETED
```

---

## 22. Scheduled Jobs

### 22.1 Expired reservation recovery

Tujuan:

- mencari ACTIVE reservation yang melewati expiry,
- memastikan payment belum PAID,
- release secara idempotent.

### 22.2 Payment reconciliation

Tujuan:

- memeriksa payment pending yang melewati window tertentu,
- query provider bila webhook belum datang,
- sinkronkan state secara aman.

### 22.3 Privacy retention

Tujuan:

- cari order `DELIVERED/CANCELLED` > 2 bulan,
- anonymize/delete PII,
- pertahankan data transaksi nonpersonal.

Semua job harus idempotent.

---

## 23. Testing Pyramid

### 23.1 Unit test

Prioritas tertinggi pada:

- price calculation,
- discount rules,
- stock availability,
- reservation transitions,
- order state transitions,
- payment mapping,
- use cases.

### 23.2 Integration test

- Postgres repository.
- Transaction/locking.
- Midtrans sandbox adapter.
- Shipping adapter.
- Supabase Auth verification.
- Cloudinary signing.

### 23.3 API E2E

Critical paths:

```text
create order
idempotent duplicate order
payment success webhook
payment duplicate webhook
payment expired
admin auth failure
admin inventory adjustment
fulfillment transition
tracking token validation
```

### 23.4 Frontend E2E

Store/Admin diuji sebagai client terhadap backend contract.

---

## 24. CI/CD Blueprint

Pipeline minimum:

```text
install
  ↓
lint
  ↓
typecheck
  ↓
unit test
  ↓
integration/API test
  ↓
build affected workspaces
```

Monorepo pipeline ideal hanya menjalankan pekerjaan untuk workspace terdampak bila memungkinkan.

Deployment terpisah:

```text
apps/store -> Store deployment
apps/admin -> Admin deployment
apps/api   -> API deployment
```

Database migration harus dijalankan dengan prosedur terkontrol sebelum/bersama rilis backend yang membutuhkan schema baru.

---

## 25. Environment Strategy

Minimal environment:

```text
local
test/staging
production
```

Environment variable dibagi berdasarkan ownership.

### Store

Hanya public API base URL dan public client config yang dibutuhkan.

### Admin

API base URL dan public Supabase Auth config bila auth dilakukan dari browser.

### API

Semua server secret dan database credentials.

Jangan copy seluruh `.env` ke semua aplikasi.

---

## 26. Coding Conventions

### Backend naming

```text
create-order.use-case.ts
order.repository.ts
postgres-order.repository.ts
midtrans-payment.gateway.ts
orders.controller.ts
```

### Controller rule

Controller idealnya hanya:

1. menerima input,
2. memanggil use case,
3. mengubah output menjadi response.

### Repository rule

Repository tidak menentukan HTTP response.

### Domain rule

Domain tidak mengetahui framework.

### Provider adapter rule

Provider-specific response dinormalisasi sebelum masuk application/domain.

---

## 27. Suggested Backend Folder Example

```text
apps/api/src/
├── main.ts
├── app.module.ts
│
├── common/
│   ├── auth/
│   ├── config/
│   ├── database/
│   ├── errors/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── logging/
│   └── validation/
│
├── modules/
│   ├── products/
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   ├── ports/
│   │   │   └── use-cases/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── errors/
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   └── presentation/
│   │       └── products.controller.ts
│   │
│   ├── inventory/
│   ├── orders/
│   ├── payments/
│   ├── shipping/
│   └── uploads/
│
└── jobs/
```

`common` tidak boleh menjadi tempat membuang semua helper. Sesuatu tetap berada di module jika hanya relevan untuk module tersebut.

---

## 28. Migration Strategy dari Arsitektur Lama

Jika codebase saat ini masih memiliki Next.js Route Handler/Server Action yang mengakses Supabase langsung:

### Step 1 - Freeze boundary

Jangan menambah business logic baru di Route Handler lama.

### Step 2 - Create monorepo shell

```text
apps/store
apps/admin
apps/api
packages/contracts
supabase
```

### Step 3 - Move frontend only

Pindahkan komponen Store dan Admin tanpa memindahkan server business logic ke frontend.

### Step 4 - Build backend foundation

NestJS config, auth, database, error format, Swagger, health.

### Step 5 - Migrate module-by-module

Urutan disarankan:

```text
products/categories
    ↓
discounts/inventory
    ↓
uploads
    ↓
orders/checkout
    ↓
shipping
    ↓
payments/webhooks
    ↓
tracking/admin operations
```

### Step 6 - Replace direct DB calls

Store/Admin hanya memakai API client.

### Step 7 - Remove legacy server logic

Setelah parity test lulus, hapus Route Handler/Server Action lama yang sudah dipindahkan.

---

## 29. Implementation Milestones

### Milestone A - Architecture foundation

Definition:

- monorepo terbentuk,
- 3 apps berjalan,
- lint/typecheck/build pass,
- API health + Swagger,
- shared contracts tersedia.

### Milestone B - Catalog vertical slice

End-to-end:

```text
Admin create product
   ↓
Backend
   ↓
Postgres
   ↓
Store list/detail product
```

Ini menjadi pembuktian pertama boundary baru.

### Milestone C - Inventory & upload

- variants,
- stock,
- movement,
- Cloudinary upload.

### Milestone D - Checkout & shipping

- cart validation,
- shipping rate,
- price calculation.

### Milestone E - Order & payment

- reservation,
- Midtrans,
- webhook,
- expiry/retry.

### Milestone F - Operations & production

- admin fulfillment,
- tracking,
- retention,
- audit,
- CI/CD,
- production readiness.

---

## 30. Architecture Decision Summary

| Keputusan | Pilihan |
| --- | --- |
| Repository | One monorepo |
| Package manager | pnpm |
| Build orchestration | Turborepo |
| Store | Next.js |
| Admin | Next.js |
| Backend | NestJS |
| API | REST + OpenAPI |
| Backend style | Modular monolith |
| Code organization | Clean architecture pragmatis |
| Database | Supabase PostgreSQL |
| Admin identity | Supabase Auth |
| Data access | Backend-only untuk tabel bisnis |
| Image | Cloudinary signed upload |
| Payment | Midtrans QRIS + webhook |
| Shipping | RajaOngkir/Komerce adapter |
| Customer account | Tidak ada pada MVP |
| Inventory | Ready stock + reservation |
| Deployment | Store/Admin/API independen |
| Microservices | Tidak digunakan pada MVP |

---

## 31. Definition of Technical Ready

Backend architecture dianggap siap masuk implementasi fitur penuh jika:

- monorepo berhasil menjalankan Store/Admin/API,
- dependency boundary terdokumentasi,
- API memiliki global validation,
- error response standar tersedia,
- authentication verification tersedia,
- database migration strategy tersedia,
- repository pattern sudah terbukti pada satu vertical slice,
- Swagger/OpenAPI tersedia,
- health endpoint tersedia,
- lint/typecheck/unit test berjalan,
- CI dapat membangun workspace terkait,
- tidak ada secret backend pada frontend.

---

## 32. Prioritas Implementasi Pertama

Jangan langsung memindahkan seluruh fitur sekaligus.

Vertical slice pertama yang direkomendasikan:

```text
Admin Product Create
      ↓
POST /v1/admin/products
      ↓
CreateProductUseCase
      ↓
ProductRepository
      ↓
PostgreSQL
      ↓
GET /v1/products
      ↓
Store Product Listing
```

Jika vertical slice ini berhasil, arsitektur dasar telah terbukti sebelum masuk ke area yang lebih kritis seperti inventory, order, dan payment.

---

## Penutup

Arsitektur Blissfy.co sengaja menyeimbangkan tiga tujuan: **clean architecture**, **maintainability**, dan **portfolio backend yang kuat**, tanpa mengorbankan kesederhanaan operasional toko yang masih dikelola dalam satu codebase.

Backend tetap berupa modular monolith agar transaksi dan maintenance sederhana, sementara Store dan Admin dipisahkan sebagai aplikasi frontend independen. Boundary ini memungkinkan Blissfy.co berkembang menjadi web commerce yang lebih besar atau menambahkan mobile client di masa depan tanpa memindahkan ulang seluruh business logic.
