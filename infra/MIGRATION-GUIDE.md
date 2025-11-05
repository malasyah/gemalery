# Migration Guide - Neon Database

## Konsep Pooled vs Non-Pooled

### Pooled Connection
- **Digunakan untuk:** Runtime (normal operation) - aplikasi berjalan
- **Keuntungan:** Lebih efisien, bisa handle banyak concurrent connections
- **Format:** `...-pooler.ap-southeast-1.aws.neon.tech/...`
- **Contoh:** `postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/dbname`

### Non-Pooled Connection
- **Digunakan untuk:** Migrations, schema changes, one-off operations
- **Alasan:** Pooled connection tidak support transaction yang panjang (migrations)
- **Format:** `...-pooler.ap-southeast-1.aws.neon.tech/...` (tanpa pooler) atau langsung ke endpoint
- **Contoh:** `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/dbname`

## Cara Set DATABASE_URL

### 1. Di Railway Variables (Recommended untuk Runtime)

**Untuk Production:**
1. Buka Railway Dashboard → Project `gemalery-server` → Service → **Variables**
2. Cari atau tambahkan variable: `DATABASE_URL`
3. Set value dengan **Pooled URL** (untuk runtime):
   ```
   postgresql://user:password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/dbname?sslmode=require
   ```
4. Save → Railway akan otomatis redeploy

**Untuk Staging:**
- Sama seperti di atas, tapi pakai URL dari Neon Staging branch

### 2. Di Command (Untuk Migration Saja)

**Via Railway Shell:**
```bash
# Set DATABASE_URL non-pooled untuk migration
export DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"

# Run migration
cd server
npx prisma migrate deploy
```

**Atau langsung di command (one-liner):**

**Bash/Unix:**
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require" npx prisma migrate deploy
```

**PowerShell (Windows):**
```powershell
$env:DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"; npx prisma migrate deploy
```

## Cara Run Migration di Production

### Metode 1: Via Railway Shell (Paling Mudah)

1. **Buka Railway Dashboard** → Project `gemalery-server` → Service
2. **Klik tab "Shell"** atau "Deploy" → "Run Command"
3. **Ambil Non-Pooled URL dari Neon:**
   - Buka Neon Dashboard → Project → Database
   - Klik "Connection String"
   - Pilih **"Non-pooled"** (bukan "Pooled")
   - Copy connection string

4. **Di Railway Shell, run:**
   ```bash
   # Set DATABASE_URL ke non-pooled (production)
   export DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"
   
   # Run migration
   cd server
   npx prisma migrate deploy
   ```

5. **Setelah migration selesai:**
   - Pastikan `DATABASE_URL` di Railway Variables masih menggunakan **Pooled URL** (untuk runtime)
   - Jika sudah diubah ke non-pooled, kembalikan ke pooled

### Metode 2: Via Local (Jika Railway Shell Tidak Tersedia)

1. **Ambil Non-Pooled URL dari Neon** (Production)
2. **Set di PowerShell:**
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require"
   ```
3. **Run migration:**
   ```powershell
   cd C:\Gemalery\Apps\gemalery\server
   npx prisma migrate deploy
   ```

## Checklist Migration Production

### Sebelum Migration:
- [ ] Backup database (jika ada data penting)
- [ ] Ambil **Non-Pooled URL** dari Neon Dashboard (Production branch)
- [ ] Pastikan Railway Variables `DATABASE_URL` masih menggunakan **Pooled URL** (untuk runtime)

### Saat Migration:
- [ ] Set `DATABASE_URL` ke **Non-Pooled URL** (hanya di command, tidak di Railway Variables)
- [ ] Run `npx prisma migrate deploy`
- [ ] Tunggu sampai selesai (check output)

### Setelah Migration:
- [ ] Verifikasi migration berhasil (check logs)
- [ ] Pastikan Railway Variables `DATABASE_URL` masih menggunakan **Pooled URL** (untuk runtime)
- [ ] Test aplikasi apakah masih berjalan normal

## Catatan Penting

1. **Runtime selalu pakai Pooled URL** (di Railway Variables)
2. **Migration pakai Non-Pooled URL** (hanya di command, temporary)
3. **Jangan set Non-Pooled URL di Railway Variables** untuk runtime (akan slow)
4. **Production vs Staging:**
   - Production: Pakai URL dari Neon Production branch
   - Staging: Pakai URL dari Neon Staging branch

## Troubleshooting

### Error: "too many connections"
- **Solusi:** Pastikan runtime pakai Pooled URL, bukan Non-Pooled

### Error: "migration failed"
- **Solusi:** Cek apakah pakai Non-Pooled URL (bukan Pooled)

### Error: "database schema out of sync"
- **Solusi:** Run migration lagi dengan Non-Pooled URL

