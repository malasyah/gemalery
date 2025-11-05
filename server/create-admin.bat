@echo off
REM Create admin user for Gemalery
REM Usage: create-admin.bat
REM Or set environment variables:
REM   set ADMIN_EMAIL=admin@example.com
REM   set ADMIN_PASSWORD=password123
REM   set ADMIN_NAME=Admin Name

echo Creating admin user...
echo.
echo Default values:
echo   Email: admin@gemalery.com
echo   Password: admin123
echo   Name: Admin
echo.
echo To customize, set environment variables:
echo   set ADMIN_EMAIL=your-email@example.com
echo   set ADMIN_PASSWORD=your-password
echo   set ADMIN_NAME=Your Name
echo.

npm run create-admin

