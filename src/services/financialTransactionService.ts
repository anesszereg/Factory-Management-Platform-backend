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
