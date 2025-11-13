# CORS Configuration Guide

## Masalah CORS di Railway

Jika Anda mendapat error CORS seperti:
```
Access to fetch at 'https://YOUR-API-URL' from origin 'https://YOUR-WEB-URL' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Solusi

### 1. Set CORS_ORIGIN di Railway Variables (PENTING!)

1. Buka [Railway Dashboard](https://railway.app) → Pilih service `gemalery-server` → Tab **Variables**
2. Cari atau tambahkan variable `CORS_ORIGIN`
3. Set value dengan format (tanpa spasi setelah koma):
   ```
   https://gemalery.vercel.app,http://localhost:5173
   ```
   **Untuk production, gunakan:**
   ```
   https://gemalery.vercel.app
   ```

4. **Save** dan tunggu Railway redeploy otomatis (biasanya 1-2 menit)

5. **Verifikasi:** Setelah redeploy, cek Railway Logs untuk melihat:
   ```
   CORS_ORIGIN: https://gemalery.vercel.app
   ```

### 2. Verifikasi CORS_ORIGIN

Pastikan formatnya benar:
- ✅ Benar: `https://gemalery.vercel.app,http://localhost:5173`
- ✅ Benar: `*` (untuk allow semua origins - hanya untuk development)
- ❌ Salah: `https://gemalery.vercel.app, http://localhost:5173` (ada spasi setelah koma)

### 3. Test CORS

Setelah redeploy, test dengan:
1. Buka browser → `https://gemalery.vercel.app`
2. Buka DevTools (F12) → Network tab
3. Coba delete product
4. Cek response headers, harus ada: `Access-Control-Allow-Origin: https://gemalery.vercel.app`

### 4. Troubleshooting

Jika masih error setelah set CORS_ORIGIN:

1. **Cek Railway Logs:**
   - Railway → Service → Logs
   - Cari pesan: `CORS blocked origin: ...`
   - Pastikan origin yang di-block sama dengan URL Vercel Anda

2. **Hard Refresh Browser:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Clear Browser Cache:**
   - Buka DevTools → Application → Clear Storage

4. **Cek URL Vercel:**
   - Pastikan URL Vercel di CORS_ORIGIN sama persis (tanpa trailing slash)
   - Contoh: `https://gemalery.vercel.app` (bukan `https://gemalery.vercel.app/`)

### 5. Development (Local)

Untuk development lokal, set di `server/.env`:
```
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

atau gunakan wildcard (hanya untuk development):
```
CORS_ORIGIN=*
```

**⚠️ Jangan gunakan `*` di production!**

