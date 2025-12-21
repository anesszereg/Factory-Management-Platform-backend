-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('PRODUCT_SALES', 'SERVICE_REVENUE', 'CUSTOM_ORDERS', 'REPAIRS', 'CONSULTING', 'OTHER');

-- CreateTable
CREATE TABLE "incomes" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "source" "IncomeSource" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incomes_pkey" PRIMARY KEY ("id")
);
