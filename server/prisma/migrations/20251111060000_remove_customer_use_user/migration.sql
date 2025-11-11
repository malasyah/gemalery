-- Step 1: Add phone and photo columns to User table (if not exists)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photo" TEXT;

-- Step 2: Migrate Customer data to User (for customers that have userId)
-- Update existing users with customer data
UPDATE "User" u
SET 
  "name" = COALESCE(u."name", c."name"),
  "phone" = COALESCE(u."phone", c."phone"),
  "photo" = COALESCE(u."photo", c."photo")
FROM "Customer" c
WHERE c."userId" = u."id";

-- Create new users for customers without userId
-- Note: We'll generate a temporary email if customer doesn't have email
INSERT INTO "User" ("id", "email", "password", "role", "name", "phone", "photo", "createdAt", "updatedAt")
SELECT 
  c."id",
  COALESCE(c."email", 'customer_' || c."id" || '@temp.com'),
  '$2b$10$temp' || SUBSTRING(c."id", 1, 20), -- Temporary password hash
  'customer',
  c."name",
  c."phone",
  c."photo",
  c."createdAt",
  c."updatedAt"
FROM "Customer" c
WHERE c."userId" IS NULL
ON CONFLICT ("email") DO NOTHING;

-- Step 3: Delete orders that reference customers (as requested by user)
-- First delete OrderItems, then Payments, then Shipments, then Orders
DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "customerId" IS NOT NULL);
DELETE FROM "Payment" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "customerId" IS NOT NULL);
DELETE FROM "Shipment" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "customerId" IS NOT NULL);
DELETE FROM "Order" WHERE "customerId" IS NOT NULL;

-- Step 4: Create UserAddress table (migrate from CustomerAddress)
CREATE TABLE IF NOT EXISTS "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "recipient_name" TEXT NOT NULL,
    "recipient_phone" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "province" TEXT,
    "city" TEXT,
    "subdistrict" TEXT,
    "postal_code" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "google_place_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- Migrate CustomerAddress to UserAddress
INSERT INTO "UserAddress" (
    "id", "userId", "label", "recipient_name", "recipient_phone", 
    "address_line", "province", "city", "subdistrict", "postal_code", 
    "lat", "lng", "google_place_id", "is_default", "is_deleted", 
    "createdAt", "updatedAt"
)
SELECT 
    ca."id",
    COALESCE(c."userId", c."id") as "userId", -- Use userId if exists, otherwise use customer id (which is now user id)
    ca."label",
    ca."recipient_name",
    ca."recipient_phone",
    ca."address_line",
    ca."province",
    ca."city",
    ca."subdistrict",
    ca."postal_code",
    ca."lat",
    ca."lng",
    ca."google_place_id",
    ca."is_default",
    ca."is_deleted",
    ca."createdAt",
    ca."updatedAt"
FROM "CustomerAddress" ca
JOIN "Customer" c ON ca."customerId" = c."id";

-- Step 5: Add userId column to Order (if not exists)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Step 6: Create index for UserAddress
CREATE INDEX IF NOT EXISTS "UserAddress_userId_idx" ON "UserAddress"("userId");

-- Step 7: Add foreign key for UserAddress
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Add foreign key for Order.userId
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 9: Drop foreign key constraint for Order.customerId
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_customerId_fkey";

-- Step 10: Drop customerId column from Order
ALTER TABLE "Order" DROP COLUMN IF EXISTS "customerId";

-- Step 11: Drop CustomerAddress table
DROP TABLE IF EXISTS "CustomerAddress";

-- Step 12: Drop Customer table
DROP TABLE IF EXISTS "Customer";

-- Step 13: Drop foreign key constraint from User to Customer (if exists)
-- Note: This is handled automatically when Customer table is dropped

