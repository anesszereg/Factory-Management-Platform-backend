-- AlterTable
ALTER TABLE "material_consumption" ADD COLUMN     "employee_id" INTEGER;

-- AddForeignKey
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
