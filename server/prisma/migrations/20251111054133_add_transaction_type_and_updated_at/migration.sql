/*
  Warnings:

  - Added the required column `updatedAt` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
