/*
  Warnings:

  - You are about to drop the column `pieces_completed` on the `daily_piece_receipts` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_piece` on the `daily_piece_receipts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_PAID', 'PART_PAID', 'PAID');

-- AlterTable
ALTER TABLE "daily_piece_receipts" DROP COLUMN "pieces_completed",
DROP COLUMN "price_per_piece",
ADD COLUMN     "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'NOT_PAID';

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_per_piece" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "daily_piece_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
