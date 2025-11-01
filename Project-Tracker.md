# Project Tracker - Gemalery

## 2025-10-30
- Initialized monorepo: `web/` (Vite React TS), `server/` (Express TS)
- API health endpoint: `/health`
- Added server `ENV.EXAMPLE` and `infra/README.md`

- Added Prisma ORM and PostgreSQL schema covering: users/customers/addresses, products/variants with weight_gram & default costs, inventory, orders/items/payments, purchases & COGS, shipments (JNE), expenses, integrations.
- Added Prisma client and DB healthcheck endpoint `/health/db`.
- Added API routes:
  - `/customers/:id/addresses` CRUD + set default (max 5, soft delete)
  - `/products` CRUD basic + `/products/:id/variants` create; `/products/variants/:id` update
  - `/shipping/quote` placeholder (JNE integration ready point)
- Added Prisma seed for base channels (web, tokopedia, shopee, tiktok, offline)

Auth & POS:
- Added JWT auth routes: `/auth/register`, `/auth/login`
- Added middleware for auth and role checks
- Added POS endpoint (staff/admin): `POST /pos/orders` to create offline orders, snapshot COGS, and reduce stock

Maps integration (server proxy):
- `/maps/autocomplete` and `/maps/geocode` (requires `GOOGLE_MAPS_API_KEY`)

Next priorities
- Managed PostgreSQL configured (Neon). Ran initial migrations and seeded channels.
- Implement auth (JWT) + RBAC (staff POS-only)
- Start products/variants CRUD incl. `weight_gram`, default costs

Checkout & Shipping:
- Added `/checkout` endpoint: supports guest/customer, address snapshot, auto JNE estimate based on total weight.

Orders, Payments, Fulfillment:
- Added `/orders` list/detail and `/orders/:id/status`
- Added `POST /orders/:id/payments` to mark paid (manual)
- Added `POST /orders/:id/fulfill` to create shipment (JNE AWB) and `GET /orders/:id/shipments`
  - Added `GET /orders/:id/tracking/latest` to return latest JNE tracking event only

Inventory:
- Added `POST /inventory/movements` (IN/OUT/ADJUST) and `GET /inventory/low-stock?threshold=5`

Expenses & Reports:
- Added Expenses CRUD: `GET/POST/PATCH/DELETE /expenses`
- Added Reports:
  - `/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&channel=web|tokopedia|...`
  - `/reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD`

Cart:
- Added `POST /cart/price` to calculate subtotal and JNE estimate without persisting

Frontend (initial wiring):
- Address Book page to manage addresses via API
- Checkout page to price cart and create order (guest/customer)
 - Products page to create products & variants (with weight_gram, default costs)
 - Dashboard page to view sales by day and P&L

Integrations (stubs):
- Added `/integrations/:channel/connect` and `/webhooks/:channel` placeholders

Deploy setup:
- Added `infra/DEPLOY.md` with Neon + Railway + Vercel guide
- Updated web to read `VITE_API_BASE` for API URL

Repository:
- Initialized git and pushed to GitHub: https://github.com/malasyah/gemalery.git

Purchases & Costs:
- Suppliers CRUD: `GET/POST/PATCH/DELETE /suppliers`
- Purchase Orders: `POST /purchase-orders`, `POST /purchase-orders/:id/items`, `POST /purchase-orders/:id/receive`, `GET /purchase-orders`, `GET /purchase-orders/:id`
- Receiving updates stock (IN) and recalculates weighted-average `cogs_current`
- Operational cost templates: `POST/GET /cost-templates`, `POST /cost-templates/:id/components`, `POST /variants/:id/cost-template`

Checkout improvements:
- Fixed COGS snapshot on order creation (uses variant.cogs_current)
- Checkout now reduces stock on order creation (OUT movement)

Frontend additions:
- POS page for staff to create offline orders (requires JWT token)

Marketplace import:
- Added `POST /orders/import` to manually import orders from Tokopedia/Shopee/TikTok with normalized fees
- Records marketplace fees in `fees_total`, reduces stock, creates shipment if AWB provided

Deployment:
- Fixed ESM import issues (added .js extensions to all relative imports)
- Fixed missing @vitejs/plugin-react dependency for Vercel build
- Deployed API to Railway (production environment)
- Deployed web to Vercel (gemalery.vercel.app)
- Database migrations applied to Neon (main branch)
- Seed data (channels) populated successfully
- CORS configured for Vercel domain

