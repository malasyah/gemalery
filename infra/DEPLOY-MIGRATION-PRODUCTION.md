# Deploy Migration ke Production Database

## Masalah
Error `ERR_CONNECTION_RESET` terjadi karena migration `20251111013441_add_product_is_archived` belum di-deploy ke production database. Server crash saat mencoba query field `isArchived` yang belum ada.

## Solusi: Deploy Migration ke Production

### Opsi 1: Via Railway Shell (Recommended)

1. Buka Railway Dashboard: https://railway.app
2. Pilih project `gemalery-server-production`
3. Klik pada service yang menjalankan server
4. Buka tab "Shell" atau "Deployments" → pilih deployment terbaru → "Shell"
5. Jalankan command berikut:

```bash
cd server
npx prisma migrate deploy
```

**PENTING:** Pastikan `DATABASE_URL` di Railway sudah di-set dengan URL non-pooled dari Neon.

### Opsi 2: Via Local Machine (Jika Railway Shell tidak tersedia)

1. Pastikan Anda punya akses ke production `DATABASE_URL` (non-pooled)
2. Buka terminal di local machine
3. Set environment variable:

**PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_atAQqhV6k1ZF@ep-jolly-fog-a1amsgsm.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Command Prompt:**
```cmd
set DATABASE_URL=postgresql://neondb_owner:npg_atAQqhV6k1ZF@ep-jolly-fog-a1amsgsm.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

4. Navigate ke folder server:
```bash
cd server
```

5. Deploy migration:
```bash
npx prisma migrate deploy
```

6. Verifikasi migration berhasil:
```bash
npx prisma migrate status
```

### Opsi 3: Manual SQL (Jika migrate deploy tidak berfungsi)

Jika kedua opsi di atas tidak berfungsi, Anda bisa menjalankan SQL langsung:

1. Buka Neon Console: https://console.neon.tech
2. Pilih database `neondb`
3. Buka SQL Editor
4. Jalankan SQL berikut:

```sql
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false;
```

5. Verifikasi kolom sudah ditambahkan:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'isArchived';
```

## Setelah Migration Berhasil

1. Restart server di Railway (jika perlu)
2. Verifikasi server berjalan dengan baik
3. Test endpoint:
   - `GET /categories` - harus berhasil
   - `GET /products?archived=false` - harus berhasil
   - `GET /products?archived=true` - harus berhasil

## Troubleshooting

### Error: "Migration already applied"
- Migration sudah di-deploy sebelumnya
- Server mungkin perlu restart
- Cek Railway logs untuk error lain

### Error: "Connection timeout"
- Pastikan menggunakan non-pooled connection string
- Pastikan database URL benar
- Cek firewall/network settings

### Error: "Column already exists"
- Kolom sudah ada di database
- Coba restart server
- Cek Prisma Client sudah di-generate ulang: `npx prisma generate`

