# Admin User Scripts

## Create Admin User

Script untuk membuat user admin baru di database.

### Usage

#### Default (Quick Start)

```bash
cd server
npm run create-admin
```

Ini akan membuat user admin dengan:
- **Email:** `admin@gemalery.com`
- **Password:** `admin123`
- **Name:** `Admin`

#### Custom Email/Password

Set environment variables sebelum run:

**Windows (PowerShell):**
```powershell
$env:ADMIN_EMAIL="your-email@example.com"
$env:ADMIN_PASSWORD="your-password"
$env:ADMIN_NAME="Your Name"
npm run create-admin
```

**Windows (CMD):**
```cmd
set ADMIN_EMAIL=your-email@example.com
set ADMIN_PASSWORD=your-password
set ADMIN_NAME=Your Name
npm run create-admin
```

**Linux/Mac:**
```bash
export ADMIN_EMAIL="your-email@example.com"
export ADMIN_PASSWORD="your-password"
export ADMIN_NAME="Your Name"
npm run create-admin
```

### Production Database

Untuk production database, set `DATABASE_URL` ke production database:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:password@host:port/database"
npm run create-admin
```

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
npm run create-admin
```

### Behavior

1. **New User:** Jika email belum ada, akan membuat user baru dengan role `admin`
2. **Existing User:** Jika email sudah ada:
   - Jika role sudah `admin`, akan skip (tidak update)
   - Jika role bukan `admin`, akan update role ke `admin` dan password

### Security Notes

⚠️ **Important:**
- Default password adalah `admin123` - **UBAH SETELAH LOGIN PERTAMA!**
- Jangan commit `.env` file dengan production credentials
- Gunakan strong password untuk production

### Example Output

```
Creating admin user: admin@gemalery.com
✅ Admin user created successfully!
Email: admin@gemalery.com
Password: admin123
Name: Admin
ID: cmhlmvcz700005vgwkhhe4tav

⚠️  Please change the default password after first login!
```

### Troubleshooting

**Error: "Environment variable not found: DATABASE_URL"**
- Set `DATABASE_URL` di `.env` file atau environment variables
- Pastikan database connection string valid

**Error: "email already registered"**
- Email sudah ada di database
- Jika ingin update password, delete user dulu atau update manual di database

**Error: "Unknown file extension"**
- Pastikan `tsx` sudah terinstall: `npm install --save-dev tsx`

