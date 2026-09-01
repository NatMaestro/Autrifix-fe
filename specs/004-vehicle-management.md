# SPEC-WEB-004 — Vehicle Management

**Status:** IMPLEMENTED
**Scope:** Web
**Last synchronized with code:** 2026-09-01

## 1. Purpose

The customer's garage — what the provider is being asked to attend.

## 2. Routes

`/customer/vehicles`.

## 3. Requirements

### WEB-004-1 — Full CRUD against the customer endpoints
**Status:** IMPLEMENTED

`services/vehicles.ts` covers list, create, update, delete against `/customers/vehicles/`.

**These paths were `/drivers/vehicles/` and returned 404 until 2026-08-31.** The entire
feature was broken and nothing detected it, because the types were hand-written.

### WEB-004-2 — Only make and model are required
**Status:** IMPLEMENTED

Matches the backend model. Plate, VIN, and specs are optional and unvalidated.

### WEB-004-3 — A local vehicle pack feeds the provider view
**Status:** IMPLEMENTED

`lib/vehicle-profile.ts` keeps a snapshot in browser storage
(`CUSTOMER_VEHICLE_PACK_STORAGE_KEY`) that the provider job page reads for richer display.

## 4. Gaps

- **The vehicle pack is client-side only.** It is written and read in the browser and never
  reaches the backend, so the provider sees it only in the same-device demo path. The real
  provider-facing value remains the backend's derived `vehicle_summary`.
- Plate and VIN are neither validated nor deduplicated, matching the backend.

## 5. Open questions

**OQ-W004-A — Is the local vehicle pack a real feature or a prototype?**
It implies data the API does not carry. Either the backend should model it or the client
should stop suggesting the provider will see it.

## 6. Related

Backend SPEC-004.
