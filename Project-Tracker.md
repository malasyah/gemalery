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

Testing & Code Quality:
- Setup Vitest for unit testing (backend + frontend)
- Setup ESLint for linting (TypeScript/React)
- Setup Prettier for code formatting
- Added code coverage reporting (@vitest/coverage-v8)
- Created example unit tests for products API and React components
- Added test scripts: test, test:ui, test:coverage, lint, lint:fix, format, format:check

Customer-Facing UI:
- Added ProductCategory model and categoryId to Product
- Added images field to ProductVariant for variant-specific images
- Added ContactMessage model for contact form submissions
- Created migration `20251103054429_add_customer_ui_features` for schema changes
- Applied migration to production database (Neon Production)
- Created migration guide documentation (infra/MIGRATION-GUIDE.md)

Admin UI Improvements:
- Refactored AdminApp to use React Router instead of tab-based navigation
- Added AdminProtectedRoute for role-based access control (admin/staff only)
- Created AdminNavigation component with Tailwind CSS styling
- Admin routes: `/admin/dashboard`, `/admin/products`, `/admin/customers`, `/admin/pos`, `/admin/checkout`, `/admin/addresses`
- Added "View Site" button to navigate back to customer-facing UI
- Responsive design with mobile menu support
- Created admin UI documentation (web/src/ui/admin/README.md)

User Management:
- Created API routes for user management (GET, POST, PATCH, DELETE /users) - admin only
  - List all users with customer information
  - Create new users (admin, staff, or customer role)
  - Update user email, name, role, and password
  - Delete users (with validation to prevent self-deletion)
  - All routes protected with admin-only access
- Created admin UI page for managing users (/admin/users)
  - User list with role badges (admin/staff/customer)
  - Create user form with email, password, name, and role selection
  - Edit user functionality with optional password update
  - Delete user with confirmation
  - Admin-only access (hidden from staff users)
- Updated create-admin script to support creating staff users
  - Added USER_ROLE environment variable (default: "admin")
  - Can create admin or staff users via script
  - Usage: `USER_ROLE=staff npm run create-admin`

Bug Fixes:
- Fixed Cart page error: "Cannot read properties of undefined (reading 'images')"
  - Added optional chaining for variant?.product?.images to prevent undefined access
  - Fixed TypeError when variant.product is undefined in cart items
  - Ensured safe access to product images in cart display
- Fixed Users page form reset issue
  - Added useLocation to detect route changes
  - Reset form fields (email, password, name, role) when component mounts or route changes
  - Ensure form is empty when opening Users tab
  - Reset form after successful create/update operations
  - Reset edit form when canceling edit mode
  - Fix issue where form labels were not empty when opening Users tab
- Fixed Users page form auto-fill issue - ensure form is always empty
  - Reset form before loading data to ensure empty state
  - Add autoComplete='off' on form element to prevent browser autofill
  - Add autoComplete='off' and autoComplete='new-password' on input fields
  - Add unique key props on form container and input fields to force React recreation
  - Add unique name attributes on inputs to prevent browser autofill matching
  - Wrap form in form element with proper structure
  - Ensure Email, Password, and Name fields are always empty when opening Users tab
  - Only Role field has default value 'staff' as expected

- Enhanced POS (Point of Sale) page with customer dropdown and add new customer modal
  - Replaced customer ID text input with dropdown (select) that displays customer names
  - Added "Add New Customer" button next to dropdown
  - Implemented modal/popup for creating new customer from POS page
  - Modal includes form fields: name (required), email, phone, photo (with image upload)
  - After creating new customer, dropdown automatically updates with new data
  - Dropdown automatically selects the newly created customer
  - Integrated image compression and base64 conversion for customer photos
  - Modal can be closed by clicking outside or cancel button
  - Form resets after successful customer creation
  - Integrated AuthContext for automatic authentication (removed manual JWT token input)
  - Token is now automatically retrieved from localStorage (same as admin pages)
  - Token is read-only and cannot be edited by user
  - Added status indicators showing login status and user role
  - Added visual indicator that JWT token is automatically filled and cannot be edited
  - Added role-based access control checks (only staff/admin can create orders)
  - Customer selection resets after order is successfully created
- Complete POS redesign with 3-column layout
  - Header section: JWT token status (auto-filled, read-only) and customer dropdown with add new customer button
  - Left column: Category menu with "All Products" option and all product categories
  - Center column: Product grid displaying products with images, names, SKU, prices, and stock
  - Products are clickable to add to cart (disabled if out of stock)
  - Right column: Shopping cart/order list with:
    - Product name, SKU, quantity controls (increase/decrease), price per item, total price
    - Remove item button
    - Subtotal calculation
    - Discount input (percentage)
    - Total after discount calculation
    - Payment method selection (Cash, QRIS, Card)
    - Cash payment: input for cash amount with automatic change calculation
    - QRIS/Card payment: "Sudah Dibayar" button
    - Process payment button (disabled if cart empty or cash insufficient)
  - Print receipt/struk functionality:
    - Opens print dialog with formatted receipt
    - Includes store name, date/time, order items, subtotal, discount, total, payment method, change (if cash), order ID
    - Optimized for 80mm thermal printer
    - Auto-prints and closes after printing
  - All features integrated and working together
- Fixed POS order creation error (500 Internal Server Error)
  - Added comprehensive error handling in backend POS route
  - Added auto-create offline channel if missing in database
  - Improved error messages in frontend to show detailed error information
  - Fixed customerId handling (only send if not empty)
  - Added console logging for debugging
  - Better error handling for validation errors, missing variants, and database errors
  - Fixed TypeScript error: Changed Prisma.ChannelKey to ChannelKey enum import from @prisma/client
- Implemented automatic COGS calculation based on category operational costs
  - Added CategoryOperationalCostComponent model to schema for category operational cost variants
  - Each category can have multiple operational cost components (name/description + cost)
  - Created migration for category operational cost components
  - Updated ProductCategory model to include operational cost components relation
  - Created API routes for CRUD category operational cost components:
    - GET /categories/:id - Get category with operational cost components
    - POST /categories/:id/operational-cost-components - Add component to category
    - PATCH /categories/operational-cost-components/:componentId - Update component
    - DELETE /categories/operational-cost-components/:componentId - Delete component
  - Updated product creation form:
    - Category is now required (must be selected before creating product)
    - Operational cost automatically filled from selected category's total operational cost
    - COGS automatically calculated = purchase price + operational cost
    - Operational cost and COGS fields are read-only (cannot be edited)
    - Only purchase price and selling price can be edited (both required)
    - Display category operational cost breakdown when category is selected
  - Updated backend product creation:
    - Validates category is required
    - Calculates operational cost from category automatically
    - Calculates COGS = purchase_price + operational_cost automatically
    - Validates purchase price and selling price are required and > 0
  - Updated frontend product form:
    - Category dropdown with operational cost display
    - Auto-update operational cost and COGS when category or purchase price changes
    - Read-only fields for operational cost and COGS with visual indication
    - Validation for required fields (category, purchase price, selling price)
  - Added "New Kategori" button next to category dropdown in product form
  - Created popup/modal for creating new category with operational cost components
  - Modal allows adding multiple operational cost components (name + cost)
  - After creating new category, dropdown automatically updates and selects the new category
  - Dropdown displays category description and total operational cost
  - Operational cost automatically filled from newly created category
  - POS auto-reloads products after successful transaction to update stock without page refresh
  - Created Categories management page with full CRUD operations (Create, Read, Update, Delete)
  - Categories page includes operational cost components management
  - Categories page shows product count per category
  - Added Categories route to admin navigation (admin-only access)
  - Updated edit product form to match create form:
    - Category dropdown with operational cost display
    - Full variant management (add, edit, delete variants)
    - Auto-calculate operational cost and COGS when category or purchase price changes
    - Read-only fields for operational cost and COGS
    - Validation for required fields (category, purchase price, selling price)
  - Updated backend product update route to handle categoryId

Product Archiving Feature:
- Implemented product archiving instead of permanent deletion
  - Added `isArchived` field to Product model (Boolean, default false)
  - Created migration `20251111013441_add_product_is_archived` to add isArchived column
  - Replaced DELETE endpoint with PATCH /products/:productId/archive endpoint
  - Added PATCH /products/:productId/unarchive endpoint to restore archived products
  - Products with related data (orders, purchases, stock movements, inventory) are archived with warning message
  - Updated admin product list route to support filtering by archived status (?archived=true/false)
  - Updated all public product routes to filter out archived products (isArchived: false)
  - Updated POS page to filter out archived products
  - Updated customer-facing product pages (Home, Products) to filter out archived products
  - Added "Arsip" tab to admin Products page
  - Replaced "Delete" button with "Archive" button (📦) for active products
  - Added "Unarchive" button (♻️) for archived products
  - Archive confirmation modal with product name display
  - Products automatically filtered based on active tab (all/archived)
- Deployed migration to production database
  - Applied migration `20251111013441_add_product_is_archived` to Neon production database
  - Verified database schema is up to date
  - Added error handling for backward compatibility (graceful fallback if column doesn't exist)
  - Created migration deployment guide (infra/DEPLOY-MIGRATION-PRODUCTION.md)

Next priorities:
- Test customer-facing UI routes (recommended, latest, popular products)
- Verify category filtering and search functionality
- Test contact form submission
- Test admin UI routes and role-based access control
- Verify product archiving functionality works correctly
- Test archived products are hidden from POS and customer pages

