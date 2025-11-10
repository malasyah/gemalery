-- CreateTable
CREATE TABLE "CategoryOperationalCostComponent" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryOperationalCostComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryOperationalCostComponent_categoryId_idx" ON "CategoryOperationalCostComponent"("categoryId");

-- AddForeignKey
ALTER TABLE "CategoryOperationalCostComponent" ADD CONSTRAINT "CategoryOperationalCostComponent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
