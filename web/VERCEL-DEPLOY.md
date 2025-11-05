# Vercel Deployment Guide

## Setup

### 1. Project Configuration

Vercel project harus di-set dengan:
- **Root Directory:** `web`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 2. vercel.json

File `web/vercel.json` sudah dikonfigurasi dengan:
- Rewrite rules untuk SPA routing (semua route → `/index.html`)
- Framework: Vite
- Output directory: `dist`

### 3. Environment Variables

Set di Vercel Dashboard → Settings → Environment Variables:

- `VITE_API_BASE` = API base URL (e.g., `https://your-api.railway.app`)

## Troubleshooting

### Error 404 pada Routes (e.g., `/admin`, `/products`)

**Penyebab:**
- Vercel tidak meng-handle client-side routing dengan benar
- `vercel.json` tidak ada atau salah lokasi
- Vercel project root belum di-set ke `web/`

**Solusi:**

1. **Pastikan `vercel.json` ada di `web/` directory:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. **Cek Vercel Project Settings:**
   - Buka Vercel Dashboard → Project → Settings → General
   - Pastikan **Root Directory** di-set ke `web`
   - Jika tidak, ubah ke `web` dan redeploy

3. **Redeploy:**
   - Push perubahan ke GitHub
   - Atau trigger redeploy manual di Vercel Dashboard → Deployments → Redeploy

4. **Clear Cache (jika perlu):**
   - Vercel Dashboard → Settings → General → Clear Build Cache
   - Redeploy

### Error 404 pada `/admin` khususnya

**Kemungkinan:**
- Routing sudah benar di React Router
- Masalahnya di Vercel rewrite rules

**Solusi:**
- Pastikan `vercel.json` ada di `web/` dengan rewrite rules yang benar
- Redeploy setelah perubahan

### Build Failures

**Penyebab:**
- Missing dependencies
- TypeScript errors
- Build command salah

**Solusi:**
1. **Test build lokal:**
   ```bash
   cd web
   npm install
   npm run build
   ```

2. **Cek build logs di Vercel:**
   - Vercel Dashboard → Deployments → Click deployment → View Build Logs

3. **Fix errors:**
   - Fix TypeScript errors
   - Install missing dependencies
   - Update build command jika perlu

### Environment Variables Not Working

**Penyebab:**
- Environment variables tidak di-set
- Variable name salah (harus mulai dengan `VITE_`)

**Solusi:**
1. **Set di Vercel Dashboard:**
   - Settings → Environment Variables
   - Add: `VITE_API_BASE` = `https://your-api.railway.app`

2. **Redeploy setelah set variables**

3. **Verify:**
   - Check browser console untuk `[API] VITE_API_BASE env: ...`

## Deployment Checklist

- [ ] Vercel project root di-set ke `web/`
- [ ] `web/vercel.json` ada dan benar
- [ ] Environment variables di-set (`VITE_API_BASE`)
- [ ] Build berhasil di lokal (`npm run build`)
- [ ] Test semua routes (home, products, admin, dll)
- [ ] Test API calls (cek CORS jika perlu)

## Quick Fix untuk 404 Routes

Jika masih dapat 404 setelah setup:

1. **Hapus dan reimport project:**
   - Vercel Dashboard → Settings → General → Delete Project
   - Import project lagi dengan root directory `web/`

2. **Atau gunakan Vercel CLI:**
   ```bash
   cd web
   vercel --prod
   ```

## Notes

- Vercel secara otomatis detect Vite framework, tapi lebih baik set explicit di `vercel.json`
- Rewrite rules diperlukan untuk SPA routing (React Router)
- Semua routes akan di-rewrite ke `/index.html`, lalu React Router akan handle routing

