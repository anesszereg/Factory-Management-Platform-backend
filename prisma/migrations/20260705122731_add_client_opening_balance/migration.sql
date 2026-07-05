-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "opening_balance_date" DATE,
ADD COLUMN     "opening_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "opening_debt" DOUBLE PRECISION NOT NULL DEFAULT 0;
