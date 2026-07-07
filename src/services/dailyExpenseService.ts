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
      include: { moneyBox: { select: { id: true, name: true } } },
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
      where: { id },
      include: { moneyBox: { select: { id: true, name: true } } }
    });
  },

  async create(data: {
    date: Date;
    category: ExpenseCategory;
    amount: number;
    moneyBoxId?: number;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const expense = await tx.dailyExpense.create({
        data: {
          date: data.date,
          category: data.category,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          description: data.description,
          ...(data.moneyBoxId ? { moneyBox: { connect: { id: data.moneyBoxId } } } : {})
        }
      });
      if (data.moneyBoxId) {
        console.log('[dailyExpenseService.create] decrementing moneyBox', data.moneyBoxId, 'by', data.amount);
        await tx.moneyBox.update({
          where: { id: data.moneyBoxId },
          data: { currentBalance: { decrement: data.amount } }
        });
      } else {
        console.log('[dailyExpenseService.create] no moneyBoxId, skipping balance update');
      }
      return expense;
    });
  },

  async update(id: number, data: {
    date?: Date;
    category?: ExpenseCategory;
    amount?: number;
    moneyBoxId?: number | null;
    paymentMethod?: string;
    description?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const old = await tx.dailyExpense.findUnique({ where: { id } });
      if (!old) throw new Error('Expense not found');

      const newAmount = data.amount ?? old.amount;
      const newMoneyBoxId = data.moneyBoxId === null ? null : (data.moneyBoxId ?? old.moneyBoxId);

      if (old.moneyBoxId && old.moneyBoxId === newMoneyBoxId) {
        // Same money box: adjust by amount difference
        const diff = newAmount - old.amount;
        if (diff !== 0) {
          await tx.moneyBox.update({
            where: { id: old.moneyBoxId },
            data: { currentBalance: { decrement: diff } }
          });
        }
      } else if (old.moneyBoxId && newMoneyBoxId && old.moneyBoxId !== newMoneyBoxId) {
        // Switching money boxes: restore old, deduct from new
        await tx.moneyBox.update({
          where: { id: old.moneyBoxId },
          data: { currentBalance: { increment: old.amount } }
        });
        await tx.moneyBox.update({
          where: { id: newMoneyBoxId },
          data: { currentBalance: { decrement: newAmount } }
        });
      } else if (old.moneyBoxId && !newMoneyBoxId) {
        // Removing money box: restore old
        await tx.moneyBox.update({
          where: { id: old.moneyBoxId },
          data: { currentBalance: { increment: old.amount } }
        });
      } else if (!old.moneyBoxId && newMoneyBoxId) {
        // Adding money box: deduct full amount from new
        await tx.moneyBox.update({
          where: { id: newMoneyBoxId },
          data: { currentBalance: { decrement: newAmount } }
        });
      }

      const updateData: any = { ...data };
      if (data.moneyBoxId === null) {
        updateData.moneyBox = { disconnect: true };
        delete updateData.moneyBoxId;
      } else if (data.moneyBoxId) {
        updateData.moneyBox = { connect: { id: data.moneyBoxId } };
        delete updateData.moneyBoxId;
      } else {
        delete updateData.moneyBoxId;
      }

      return tx.dailyExpense.update({ where: { id }, data: updateData });
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      const expense = await tx.dailyExpense.findUnique({ where: { id } });
      if (expense?.moneyBoxId) {
        await tx.moneyBox.update({
          where: { id: expense.moneyBoxId },
          data: { currentBalance: { increment: expense.amount } }
        });
      }
      return tx.dailyExpense.delete({ where: { id } });
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
