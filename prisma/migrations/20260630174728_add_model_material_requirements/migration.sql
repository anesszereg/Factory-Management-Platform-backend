-- AlterTable
ALTER TABLE "daily_piece_receipts" ADD COLUMN     "expense_id" INTEGER;

-- AlterTable
ALTER TABLE "material_purchases" ADD COLUMN     "supplier_id" INTEGER,
ALTER COLUMN "supplier" DROP NOT NULL;

-- CreateTable
CREATE TABLE "model_material_requirements" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "step" "ProductionStep" NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_material_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "model_material_requirements_model_id_step_material_id_key" ON "model_material_requirements"("model_id", "step", "material_id");

-- AddForeignKey
ALTER TABLE "model_material_requirements" ADD CONSTRAINT "model_material_requirements_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "furniture_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_material_requirements" ADD CONSTRAINT "model_material_requirements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_purchases" ADD CONSTRAINT "material_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_piece_receipts" ADD CONSTRAINT "daily_piece_receipts_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "daily_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
