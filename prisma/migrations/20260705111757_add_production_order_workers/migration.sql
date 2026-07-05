-- CreateTable
CREATE TABLE "production_order_workers" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "employee_id" INTEGER,
    "piece_worker_id" INTEGER,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_order_workers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "production_order_workers" ADD CONSTRAINT "production_order_workers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_workers" ADD CONSTRAINT "production_order_workers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_order_workers" ADD CONSTRAINT "production_order_workers_piece_worker_id_fkey" FOREIGN KEY ("piece_worker_id") REFERENCES "piece_workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
