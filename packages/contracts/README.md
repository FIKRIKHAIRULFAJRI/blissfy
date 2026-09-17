# @blissfy/contracts

Shared TypeScript contracts for Blissfy.co API.

## Purpose

This package provides type-safe contracts between:
- Store Frontend ↔ Backend API
- Admin Frontend ↔ Backend API
- Backend modules (internal consistency)

## Usage

```typescript
// Import from root
import type { Product, Order, CreateOrderRequest } from '@blissfy/contracts';

// Or import from submodules
import type { Product } from '@blissfy/contracts/products';
import type { Order } from '@blissfy/contracts/orders';
```

## Structure

- `common/` - Shared types (enums, base interfaces)
- `products/` - Product, variant, image, discount types
- `orders/` - Order, order item, payment, shipment types
- `payments/` - Payment and webhook types
- `shipping/` - Shipping quote and rate types
- `admin/` - Admin-specific types (upload, inventory, dashboard)

## Rules

1. **No implementation** - Only types, interfaces, and type aliases
2. **No external dependencies** - Keep it lean (only TypeScript)
3. **No database models** - API contracts only, not DB schemas
4. **No provider SDKs** - Provider-agnostic types only
5. **Backend is source of truth** - Extract types from backend implementation
