#!/bin/bash
# Migrate database for Gemalery
# Usage: railway run --service gemalery-server bash server/migrate.sh

cd server
npx prisma migrate deploy

