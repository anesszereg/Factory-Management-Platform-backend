-- CreateEnum
CREATE TYPE "PieceWorkerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "material_consumption" ADD COLUMN     "piece_worker_id" INTEGER;

-- CreateTable
CREATE TABLE "piece_workers" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "price_per_piece" DOUBLE PRECISION NOT NULL,
    "status" "PieceWorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "piece_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_piece_receipts" (
    "id" SERIAL NOT NULL,
    "piece_worker_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "pieces_completed" INTEGER NOT NULL,
    "price_per_piece" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_piece_receipts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_piece_worker_id_fkey" FOREIGN KEY ("piece_worker_id") REFERENCES "piece_workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_piece_receipts" ADD CONSTRAINT "daily_piece_receipts_piece_worker_id_fkey" FOREIGN KEY ("piece_worker_id") REFERENCES "piece_workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
