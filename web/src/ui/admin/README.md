# Admin UI

## Overview

Admin UI adalah area terpisah untuk admin dan staff dengan akses ke fitur-fitur management seperti:
- Dashboard
- Products Management
- Customers Management
- POS (Point of Sale)
- Checkout
- Address Book

## Routes

Semua admin routes berada di bawah prefix `/admin/*`:

- `/admin` → Redirect ke `/admin/dashboard`
- `/admin/dashboard` → Dashboard
- `/admin/products` → Products Management
- `/admin/customers` → Customers Management
- `/admin/pos` → POS (Point of Sale)
- `/admin/checkout` → Checkout
- `/admin/addresses` → Address Book

## Authentication & Authorization

### Role-Based Access Control

Admin UI dilindungi oleh `AdminProtectedRoute` yang mengecek:
1. User harus login (memiliki token)
2. User harus memiliki role `admin` atau `staff`
3. Jika tidak memenuhi syarat, user akan di-redirect ke:
   - `/` jika belum login
   - `/home` jika role bukan admin/staff

### Navigation

AdminNavigation component menampilkan:
- Navigation bar dengan menu items
- User info (name/email dan role)
- Logout button
- "View Site" button untuk kembali ke customer-facing UI

## Features

### Dashboard
- Overview sales, orders, products
- Reports and analytics

### Products Management
- Create, read, update, delete products
- Manage product variants
- Stock management

### Customers Management
- View all customers
- Create, edit customer records
- Link customers to user accounts

### POS (Point of Sale)
- Create offline orders
- Quick checkout for in-store sales

### Checkout
- Process online orders
- Review order details

### Address Book
- Manage customer addresses
- Set default addresses

## Styling

Admin UI menggunakan Tailwind CSS dengan:
- Dark navigation bar (`bg-gray-800`)
- Light content area (`bg-gray-50`)
- Responsive design (mobile-friendly)

## Development

### Adding New Admin Pages

1. Create new page component in `web/src/ui/pages/`
2. Add route in `AdminApp.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Add navigation item in `AdminNavigation`:
   ```tsx
   { path: "/new-page", label: "New Page", icon: "🔧" }
   ```

### Protected Routes

Semua admin routes otomatis dilindungi oleh `AdminProtectedRoute`. Tidak perlu menambahkan protection manual di setiap page.

