@echo off
REM Migrate database for Gemalery
REM Usage: railway run --service gemalery-server server\migrate.bat

cd server
npx prisma migrate deploy

