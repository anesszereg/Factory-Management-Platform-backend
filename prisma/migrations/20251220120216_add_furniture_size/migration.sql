/*
  Warnings:

  - Added the required column `size` to the `furniture_models` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FurnitureSize" AS ENUM ('SIZE_45CM', 'SIZE_60CM', 'SIZE_80CM', 'SIZE_100CM', 'SIZE_120CM');

-- AlterTable
ALTER TABLE "furniture_models" ADD COLUMN     "size" "FurnitureSize" NOT NULL;
