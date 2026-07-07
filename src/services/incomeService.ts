import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type IncomeSource = 'PRODUCT_SALES' | 'SERVICE_REVENUE' | 'CUSTOM_ORDERS' | 'REPAIRS' | 'CONSULTING' | 'OTHER';

export const incomeService = {
  async getAll(filters?: { startDate?: string; endDate?: string; source?: IncomeSource }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    if (filters?.source) {
      where.source = filters.source;
    }

    return await prisma.income.findMany({
      where,
      include: { moneyBox: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.income.findUnique({
      where: { id },
      include: { moneyBox: { select: { id: true, name: true } } }
    });
  },

  async create(data: {
    date: string;
    source: IncomeSource;
    amount: number;
    moneyBoxId?: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data: {
          date: new Date(data.date),
          source: data.source,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          description: data.description,
          ...(data.moneyBoxId ? { moneyBox: { connect: { id: data.moneyBoxId } } } : {})
        }
      });
      if (data.moneyBoxId) {
        await tx.moneyBox.update({
          where: { id: data.moneyBoxId },
          data: { currentBalance: { increment: data.amount } }
        });
      }
      return income;
    });
  },

  async update(
    id: number,
    data: {
      date?: string;
      source?: IncomeSource;
      amount?: number;
      moneyBoxId?: number | null;
      paymentMethod?: string;
      description?: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const old = await tx.income.findUnique({ where: { id } });
      if (!old) throw new Error('Income not found');

      const newAmount = data.amount ?? old.amount;
      const newMoneyBoxId = data.moneyBoxId === null ? null : (data.moneyBoxId ?? old.moneyBoxId);

      if (old.moneyBoxId && old.moneyBoxId === newMoneyBoxId) {
        // Same money box: adjust by amount difference
        const diff = newAmount - old.amount;
        if (diff !== 0) {
          await tx.moneyBox.update({
            where: { id: old.moneyBoxId },
            data: { currentBalance: { increment: diff } }
          });
        }
      } else if (old.moneyBoxId && newMoneyBoxId && old.moneyBoxId !== newMoneyBoxId) {
        // Switching money boxes: reverse old, apply new
        await tx.moneyBox.update({
          where: { id: old.moneyBoxId },
          data: { currentBalance: { decrement: old.amount } }
        });
        await tx.moneyBox.update({
          where: { id: newMoneyBoxId },
          data: { currentBalance: { increment: newAmount } }
        });
      } else if (old.moneyBoxId && !newMoneyBoxId) {
        // Removing money box: reverse old
        await tx.moneyBox.update({
          where: { id: old.moneyBoxId },
          data: { currentBalance: { decrement: old.amount } }
        });
      } else if (!old.moneyBoxId && newMoneyBoxId) {
        // Adding money box: apply full amount
        await tx.moneyBox.update({
          where: { id: newMoneyBoxId },
          data: { currentBalance: { increment: newAmount } }
        });
      }

      const updateData: any = { ...data };
      if (data.date) updateData.date = new Date(data.date);
      if (data.moneyBoxId === null) {
        updateData.moneyBox = { disconnect: true };
        delete updateData.moneyBoxId;
      } else if (data.moneyBoxId) {
        updateData.moneyBox = { connect: { id: data.moneyBoxId } };
        delete updateData.moneyBoxId;
      } else {
        delete updateData.moneyBoxId;
      }

      return tx.income.update({ where: { id }, data: updateData });
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      const income = await tx.income.findUnique({ where: { id } });
      if (income?.moneyBoxId) {
        await tx.moneyBox.update({
          where: { id: income.moneyBoxId },
          data: { currentBalance: { decrement: income.amount } }
        });
      }
      return tx.income.delete({ where: { id } });
    });
  },

  async getSummary(filters?: { startDate?: string; endDate?: string }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const incomes = await prisma.income.findMany({ where });

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const bySource = incomes.reduce((acc, income) => {
      acc[income.source] = (acc[income.source] || 0) + income.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      bySource,
      count: incomes.length
    };
  }
};
