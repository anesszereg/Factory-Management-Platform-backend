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
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.income.findUnique({
      where: { id }
    });
  },

  async create(data: {
    date: string;
    source: IncomeSource;
    amount: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.income.create({
      data: {
        ...data,
        date: new Date(data.date)
      }
    });
  },

  async update(
    id: number,
    data: {
      date?: string;
      source?: IncomeSource;
      amount?: number;
      paymentMethod?: string;
      description?: string;
    }
  ) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    return await prisma.income.update({
      where: { id },
      data: updateData
    });
  },

  async delete(id: number) {
    return await prisma.income.delete({
      where: { id }
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
