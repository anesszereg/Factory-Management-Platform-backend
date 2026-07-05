-- CreateTable
CREATE TABLE "production_color_splits" (
    "id" SERIAL NOT NULL,
    "daily_production_id" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_color_splits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "production_color_splits" ADD CONSTRAINT "production_color_splits_daily_production_id_fkey" FOREIGN KEY ("daily_production_id") REFERENCES "daily_production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
