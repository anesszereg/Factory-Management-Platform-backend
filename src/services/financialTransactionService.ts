import { PrismaClient, TransactionType, TransactionCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const financialTransactionService = {
  async getAll(filters?: {
    moneyBoxId?: number;
    type?: TransactionType;
    category?: TransactionCategory;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.moneyBoxId) where.moneyBoxId = filters.moneyBoxId;
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    return prisma.financialTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { moneyBox: { select: { id: true, name: true } } }
    });
  },

  async getById(id: number) {
    return prisma.financialTransaction.findUnique({
      where: { id },
      include: { moneyBox: true }
    });
  },

  async create(data: {
    moneyBoxId: number;
    date: Date | string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    description?: string;
    reference?: string;
    relatedId?: number;
    relatedType?: string;
  }) {
    const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date;
    const balanceChange = data.type === TransactionType.INCOME ? data.amount : -data.amount;

    return prisma.$transaction(async (tx) => {
      const txRecord = await tx.financialTransaction.create({
        data: { ...data, date: dateObj }
      });
      await tx.moneyBox.update({
        where: { id: data.moneyBoxId },
        data: { currentBalance: { increment: balanceChange } }
      });
      return txRecord;
    });
  },

  async update(id: number, data: {
    date?: string;
    amount?: number;
    type?: TransactionType;
    category?: TransactionCategory;
    description?: string;
    reference?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.financialTransaction.findUnique({ where: { id } });
      if (!existing) throw new Error('Transaction not found');

      // Reverse old balance effect
      const oldBalanceChange = existing.type === TransactionType.INCOME ? existing.amount : -existing.amount;
      await tx.moneyBox.update({
        where: { id: existing.moneyBoxId },
        data: { currentBalance: { decrement: oldBalanceChange } }
      });

      const newType = data.type ?? existing.type;
      const newAmount = data.amount ?? existing.amount;
      const newBalanceChange = newType === TransactionType.INCOME ? newAmount : -newAmount;

      await tx.moneyBox.update({
        where: { id: existing.moneyBoxId },
        data: { currentBalance: { increment: newBalanceChange } }
      });

      // If amount changed and this is a client payment, adjust client balance and sale payment
      const amountDiff = newAmount - existing.amount;
      if (amountDiff !== 0 && existing.category === TransactionCategory.CLIENT_PAYMENT) {
        const salePayments = await tx.salePayment.findMany({ where: { transactionId: id } });
        for (const sp of salePayments) {
          await tx.client.update({
            where: { id: sp.clientId },
            data: { outstandingBalance: { decrement: amountDiff } }
          });
          await tx.salePayment.update({
            where: { id: sp.id },
            data: { amount: newAmount }
          });
          if (sp.orderId) {
            const order = await tx.salesOrder.findUnique({ where: { id: sp.orderId } });
            if (order) {
              const newPaid = order.paidAmount + amountDiff;
              const status = newPaid <= 0 ? 'NOT_PAID' : newPaid >= order.total ? 'PAID' : 'PART_PAID';
              await tx.salesOrder.update({
                where: { id: sp.orderId },
                data: { paidAmount: newPaid, paymentStatus: status as any }
              });
            }
          }
        }
      }

      return tx.financialTransaction.update({
        where: { id },
        data: {
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.type ? { type: data.type } : {}),
          ...(data.category ? { category: data.category } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.reference !== undefined ? { reference: data.reference } : {}),
        },
        include: { moneyBox: { select: { id: true, name: true } } }
      });
    });
  },

  async delete(id: number) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.financialTransaction.findUnique({ where: { id } });
      if (!existing) throw new Error('Transaction not found');

      // Reverse balance effect on money box
      const balanceChange = existing.type === TransactionType.INCOME ? existing.amount : -existing.amount;
      await tx.moneyBox.update({
        where: { id: existing.moneyBoxId },
        data: { currentBalance: { decrement: balanceChange } }
      });

      // Reverse sale payment effects if any
      const salePayments = await tx.salePayment.findMany({ where: { transactionId: id } });
      for (const sp of salePayments) {
        // Reverse client outstanding balance
        await tx.client.update({
          where: { id: sp.clientId },
          data: { outstandingBalance: { increment: sp.amount } }
        });
        // Reverse order paid amount
        if (sp.orderId) {
          const order = await tx.salesOrder.findUnique({ where: { id: sp.orderId } });
          if (order) {
            const newPaid = Math.max(0, order.paidAmount - sp.amount);
            const status = newPaid <= 0 ? 'NOT_PAID' : newPaid >= order.total ? 'PAID' : 'PART_PAID';
            await tx.salesOrder.update({
              where: { id: sp.orderId },
              data: { paidAmount: newPaid, paymentStatus: status as any }
            });
          }
        }
      }

      // Delete related client transaction entries
      await tx.clientTransaction.deleteMany({ where: { referenceId: id, referenceType: 'FinancialTransaction' } });

      // Delete related records
      await tx.moneyBoxTransfer.deleteMany({ where: { transactionId: id } });
      await tx.salePayment.deleteMany({ where: { transactionId: id } });

      return tx.financialTransaction.delete({ where: { id } });
    });
  },

  async getDailySummary(date: string) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const transactions = await prisma.financialTransaction.findMany({
      where: { date: { gte: start, lt: end } },
      include: { moneyBox: { select: { id: true, name: true } } }
    });
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    return { date, totalIncome, totalExpense, net: totalIncome - totalExpense, transactions };
  },

  async getMonthlyReport(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return prisma.financialTransaction.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
      include: { moneyBox: { select: { id: true, name: true } } }
    });
  }
};
