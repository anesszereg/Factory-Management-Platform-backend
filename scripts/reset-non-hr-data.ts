import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting reset of non-HR/production data...');

  // 1. Delete child records that reference tables we are dropping
  await prisma.materialConsumption.deleteMany();
  console.log('✅ Material consumption records deleted');

  await prisma.materialPurchase.deleteMany();
  console.log('✅ Material purchases deleted');

  await prisma.supplierOrderItem.deleteMany();
  console.log('✅ Supplier order items deleted');

  await prisma.supplierPayment.deleteMany();
  console.log('✅ Supplier payments deleted');

  await prisma.supplierOrder.deleteMany();
  console.log('✅ Supplier orders deleted');

  await prisma.supplier.deleteMany();
  console.log('✅ Suppliers deleted');

  await prisma.dailyProduction.deleteMany();
  console.log('✅ Daily production records deleted');

  await prisma.productionOrder.deleteMany();
  console.log('✅ Production orders deleted');

  await prisma.furnitureModel.deleteMany();
  console.log('✅ Furniture models deleted');

  await prisma.rawMaterial.deleteMany();
  console.log('✅ Raw materials deleted');

  // 2. Drop expenses and incomes (expense_id column is not present in this DB)
  await prisma.dailyExpense.deleteMany();
  console.log('✅ Daily expenses deleted');

  await prisma.income.deleteMany();
  console.log('✅ Incomes deleted');

  console.log('\n✅ Reset complete. The following data is preserved:');
  console.log('   - Employees');
  console.log('   - Salary allowances');
  console.log('   - Piece workers');
  console.log('   - Piece worker receipts and their items');
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
