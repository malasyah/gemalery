# Deploy Guide (Neon + Railway + Vercel)

## 1) Neon (PostgreSQL)
- Branches: production (main), staging, development.
- Use pooled connection for runtime, non-pooled for migrations.
- Get connection strings per branch.

## 2) Server (Railway)
- Create project → New Service from GitHub → set root to repository, build command runs by default.
- Variables (Staging):
  - DATABASE_URL = Neon STAGING pooled
  - JWT_SECRET = strong secret
  - CORS_ORIGIN = https://your-staging-web.app
  - GOOGLE_MAPS_API_KEY = your maps key
- Deploy hook:
  - One-off shell: npx prisma migrate deploy --schema server/prisma/schema.prisma
- Start command: npm -w server run start
- Healthcheck: /health

## 3) Web (Vercel)
- Import web/ subdirectory as project.
- Env vars:
  - VITE_API_BASE = https://your-staging-api.railway.app
- Build & deploy.

## 4) Production
- Repeat for production branch URLs/secrets.
- Run prisma migrate deploy against production Neon (non-pooled URL) once per release, then switch runtime to pooled.

## 5) Notes
- Backups: enable Neon PITR if needed.
- CORS: add both staging and production web URLs to CORS_ORIGIN (comma-separated).
- Logging: check platform logs; add Sentry later if desired.
