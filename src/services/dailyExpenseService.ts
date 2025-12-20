import { PrismaClient, ExpenseCategory } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const dailyExpenseService = {
  async getAll(filters?: { 
    category?: ExpenseCategory;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.dailyExpense.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate)
          }
        })
      },
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.dailyExpense.findUnique({
      where: { id }
    });
  },

  async create(data: {
    date: Date;
    category: ExpenseCategory;
    amount: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.dailyExpense.create({
      data
    });
  },

  async update(id: number, data: {
    date?: Date;
    category?: ExpenseCategory;
    amount?: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.dailyExpense.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.dailyExpense.delete({
      where: { id }
    });
  },

  async getSummary(startDate?: Date, endDate?: Date) {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const expenses = await prisma.dailyExpense.findMany({
      where: {
        date: {
          gte: startOfDay(start),
          lte: endOfDay(end)
        }
      }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const byCategory = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return {
      totalAmount,
      byCategory,
      count: expenses.length,
      period: { start, end }
    };
  },

  async getDailyTotal(date?: Date) {
    const targetDate = date || new Date();
    
    const expenses = await prisma.dailyExpense.findMany({
      where: {
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate)
        }
      }
    });

    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  },

  async getMonthlyTotal(date?: Date) {
    const targetDate = date || new Date();
    
    const expenses = await prisma.dailyExpense.findMany({
      where: {
        date: {
          gte: startOfMonth(targetDate),
          lte: endOfMonth(targetDate)
        }
      }
    });

    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
};
