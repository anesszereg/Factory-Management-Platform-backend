import { PrismaClient, SupplierTransactionType, TransactionType, TransactionCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const supplierLedgerService = {
  async getLedger(supplierId: number) {
    return prisma.supplierTransaction.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' }
    });
  },

  async getSupplierSummary(supplierId: number) {
    const transactions = await prisma.supplierTransaction.findMany({ where: { supplierId } });
    const purchases = transactions.filter(t => t.type === SupplierTransactionType.PURCHASE);
    const payments = transactions.filter(t => t.type === SupplierTransactionType.PAYMENT);
    const totalPurchases = purchases.reduce((s, t) => s + t.amount, 0);
    const totalPayments = payments.reduce((s, t) => s + t.amount, 0);
    const balance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    return { totalPurchases, totalPayments, balance, remainingDebt: Math.max(0, balance) };
  },

  async recordPayment(data: {
    supplierId: number;
    moneyBoxId: number;
    orderId?: number;
    date: string;
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const last = await tx.supplierTransaction.findFirst({
        where: { supplierId: data.supplierId },
        orderBy: { date: 'desc' }
      });
      const currentBalance = last?.balance ?? 0;
      const newBalance = currentBalance - data.amount;

      const txRecord = await tx.financialTransaction.create({
        data: {
          moneyBoxId: data.moneyBoxId,
          date: new Date(data.date),
          amount: data.amount,
          type: TransactionType.EXPENSE,
          category: TransactionCategory.SUPPLIER_PAYMENT,
          description: data.notes ?? `Payment to supplier #${data.supplierId}`,
          reference: data.reference,
          relatedId: data.supplierId,
          relatedType: 'Supplier',
        }
      });

      await tx.moneyBox.update({
        where: { id: data.moneyBoxId },
        data: { currentBalance: { decrement: data.amount } }
      });

      await tx.supplierTransaction.create({
        data: {
          supplierId: data.supplierId,
          date: new Date(data.date),
          type: SupplierTransactionType.PAYMENT,
          amount: data.amount,
          balance: newBalance,
          description: data.notes ?? 'Payment',
          referenceId: txRecord.id,
          referenceType: 'FinancialTransaction',
        }
      });

      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: data.supplierId,
          orderId: data.orderId,
          moneyBoxId: data.moneyBoxId,
          transactionId: txRecord.id,
          date: new Date(data.date),
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        }
      });

      if (data.orderId) {
        const order = await tx.supplierOrder.findUnique({ where: { id: data.orderId } });
        if (order) {
          const newPaid = order.paidAmount + data.amount;
          const status = newPaid >= order.totalAmount ? 'COMPLETED' : 'PARTIAL';
          await tx.supplierOrder.update({
            where: { id: data.orderId },
            data: { paidAmount: newPaid, status: status as any }
          });
        }
      }

      return payment;
    });
  }
};
