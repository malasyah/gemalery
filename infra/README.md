# Infra Notes

- API default runs on port 4000; frontend dev on 5173.
- Use managed PostgreSQL (e.g., Neon/Supabase/Railway). Set `DATABASE_URL` in `server/.env` (see `server/ENV.EXAMPLE`).
- CORS: set `CORS_ORIGIN` to your web URL (multiple origins separated by comma).
- Deployment targets: Render/Fly/Railway for API; Vercel/Netlify/Render for Web.



