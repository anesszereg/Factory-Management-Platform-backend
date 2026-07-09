import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { getEmployeeSalaryCycle } from '../utils/dateUtils';

const prisma = new PrismaClient();

export const salaryAllowanceService = {
  async getAll(filters?: { 
    employeeId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const allowances = await prisma.salaryAllowance.findMany({
      where: {
        ...(filters?.employeeId && { employeeId: filters.employeeId }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate)
          }
        })
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            monthlySalary: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Attach moneyBoxId from the linked expense (if any)
    const expenses = await prisma.dailyExpense.findMany({
      where: {
        category: 'SALARIES',
        ...(allowances.length > 0 && {
          OR: allowances.map(a => {
            const employeeName = `${a.employee.firstName} ${a.employee.lastName}`;
            return {
              amount: a.amount,
              date: a.date,
              description: { contains: employeeName }
            };
          })
        })
      }
    });

    return allowances.map(a => {
      const employeeName = `${a.employee.firstName} ${a.employee.lastName}`;
      const expense = expenses.find(e =>
        e.amount === a.amount &&
        e.date.getTime() === new Date(a.date).getTime() &&
        e.description?.includes(employeeName)
      );
      return { ...a, moneyBoxId: expense?.moneyBoxId ?? null };
    });
  },

  async getById(id: number) {
    const allowance = await prisma.salaryAllowance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            monthlySalary: true
          }
        }
      }
    });

    if (!allowance) return null;

    const employeeName = `${allowance.employee.firstName} ${allowance.employee.lastName}`;
    const expense = await prisma.dailyExpense.findFirst({
      where: {
        category: 'SALARIES',
        amount: allowance.amount,
        date: allowance.date,
        description: { contains: employeeName }
      }
    });

    return { ...allowance, moneyBoxId: expense?.moneyBoxId ?? null };
  },

  async create(data: {
    employeeId: number;
    date: Date;
    amount: number;
    description?: string;
    moneyBoxId?: number;
  }) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (data.moneyBoxId) {
      const moneyBox = await prisma.moneyBox.findUnique({ where: { id: data.moneyBoxId } });
      if (!moneyBox) throw new Error('Money box not found');
      if (moneyBox.currentBalance < data.amount) {
        throw new Error(`Insufficient balance in money box (available: ${moneyBox.currentBalance})`);
      }
    }

    const salaryCycle = getEmployeeSalaryCycle(employee.hireDate, data.date);

    const existingAllowances = await prisma.salaryAllowance.findMany({
      where: {
        employeeId: data.employeeId,
        date: {
          gte: salaryCycle.start,
          lte: salaryCycle.end
        }
      }
    });

    const totalAllowances = existingAllowances.reduce(
      (sum, allowance) => sum + allowance.amount,
      0
    );

    const remainingSalary = employee.monthlySalary - totalAllowances;

    if (data.amount > remainingSalary) {
      throw new Error(
        `Allowance amount (${data.amount}) exceeds remaining salary (${remainingSalary})`
      );
    }

    const { moneyBoxId, ...allowanceData } = data;

    const result = await prisma.$transaction(async (tx) => {
      const allowance = await tx.salaryAllowance.create({
        data: allowanceData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              monthlySalary: true
            }
          }
        }
      });

      await tx.dailyExpense.create({
        data: {
          date: data.date,
          category: 'SALARIES',
          amount: data.amount,
          moneyBoxId: moneyBoxId || null,
          description: data.description
            ? `Salary allowance for ${employee.firstName} ${employee.lastName}: ${data.description}`
            : `Salary allowance for ${employee.firstName} ${employee.lastName}`,
        }
      });

      if (moneyBoxId) {
        await tx.moneyBox.update({
          where: { id: moneyBoxId },
          data: { currentBalance: { decrement: data.amount } }
        });
      }

      return allowance;
    });

    return result;
  },

  async update(id: number, data: {
    date?: Date;
    amount?: number;
    description?: string;
    moneyBoxId?: number | null;
  }) {
    return await prisma.$transaction(async (tx) => {
      const existingAllowance = await tx.salaryAllowance.findUnique({
        where: { id },
        include: { employee: true }
      });

      if (!existingAllowance) {
        throw new Error('Allowance not found');
      }

      const newAmount = data.amount ?? existingAllowance.amount;
      const newDate = data.date ?? existingAllowance.date;
      const newDescription = data.description !== undefined ? data.description : existingAllowance.description;

      if (data.amount !== undefined) {
        const salaryCycle = getEmployeeSalaryCycle(existingAllowance.employee.hireDate, newDate);

        const monthAllowances = await tx.salaryAllowance.findMany({
          where: {
            employeeId: existingAllowance.employeeId,
            id: { not: id },
            date: {
              gte: salaryCycle.start,
              lte: salaryCycle.end
            }
          }
        });

        const totalOtherAllowances = monthAllowances.reduce(
          (sum, allowance) => sum + allowance.amount,
          0
        );

        const remainingSalary = existingAllowance.employee.monthlySalary - totalOtherAllowances;

        if (newAmount > remainingSalary) {
          throw new Error(
            `Updated allowance amount (${newAmount}) exceeds remaining salary (${remainingSalary})`
          );
        }
      }

      // Find associated expense record
      const employeeName = `${existingAllowance.employee.firstName} ${existingAllowance.employee.lastName}`;
      const expense = await tx.dailyExpense.findFirst({
        where: {
          category: 'SALARIES',
          amount: existingAllowance.amount,
          date: existingAllowance.date,
          description: { contains: employeeName }
        }
      });

      const newMoneyBoxId = data.moneyBoxId === null ? null : (data.moneyBoxId ?? expense?.moneyBoxId ?? null);
      const expenseDescription = newDescription
        ? `Salary allowance for ${employeeName}: ${newDescription}`
        : `Salary allowance for ${employeeName}`;

      if (expense) {
        const oldMoneyBoxId = expense.moneyBoxId;

        if (oldMoneyBoxId && oldMoneyBoxId === newMoneyBoxId) {
          // Same money box: adjust by amount difference
          const diff = newAmount - existingAllowance.amount;
          if (diff !== 0) {
            await tx.moneyBox.update({
              where: { id: oldMoneyBoxId },
              data: { currentBalance: { decrement: diff } }
            });
          }
        } else if (oldMoneyBoxId && newMoneyBoxId && oldMoneyBoxId !== newMoneyBoxId) {
          // Switching money boxes: restore old, deduct from new
          await tx.moneyBox.update({
            where: { id: oldMoneyBoxId },
            data: { currentBalance: { increment: existingAllowance.amount } }
          });
          await tx.moneyBox.update({
            where: { id: newMoneyBoxId },
            data: { currentBalance: { decrement: newAmount } }
          });
        } else if (oldMoneyBoxId && !newMoneyBoxId) {
          // Removing money box: restore old
          await tx.moneyBox.update({
            where: { id: oldMoneyBoxId },
            data: { currentBalance: { increment: existingAllowance.amount } }
          });
        } else if (!oldMoneyBoxId && newMoneyBoxId) {
          // Adding money box: deduct full amount from new
          await tx.moneyBox.update({
            where: { id: newMoneyBoxId },
            data: { currentBalance: { decrement: newAmount } }
          });
        }

        const updateData: any = {
          amount: newAmount,
          date: newDate,
          description: expenseDescription
        };
        if (data.moneyBoxId === null) {
          updateData.moneyBox = { disconnect: true };
        } else if (data.moneyBoxId) {
          updateData.moneyBox = { connect: { id: data.moneyBoxId } };
        }

        await tx.dailyExpense.update({
          where: { id: expense.id },
          data: updateData
        });
      } else if (newMoneyBoxId) {
        // No existing expense but a money box was selected: create expense and deduct
        await tx.dailyExpense.create({
          data: {
            date: newDate,
            category: 'SALARIES',
            amount: newAmount,
            description: expenseDescription,
            moneyBox: { connect: { id: newMoneyBoxId } }
          }
        });
        await tx.moneyBox.update({
          where: { id: newMoneyBoxId },
          data: { currentBalance: { decrement: newAmount } }
        });
      }

      return await tx.salaryAllowance.update({
        where: { id },
        data: {
          ...(data.date && { date: data.date }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.description !== undefined && { description: data.description })
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              monthlySalary: true
            }
          }
        }
      });
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      const allowance = await tx.salaryAllowance.findUnique({
        where: { id },
        include: { employee: true }
      });
      if (!allowance) throw new Error('Allowance not found');

      // Find and delete associated expense, restore money box balance
      const expense = await tx.dailyExpense.findFirst({
        where: {
          category: 'SALARIES',
          amount: allowance.amount,
          date: allowance.date,
          description: { contains: `${allowance.employee.firstName} ${allowance.employee.lastName}` }
        }
      });

      if (expense) {
        if (expense.moneyBoxId) {
          await tx.moneyBox.update({
            where: { id: expense.moneyBoxId },
            data: { currentBalance: { increment: expense.amount } }
          });
        }
        await tx.dailyExpense.delete({ where: { id: expense.id } });
      }

      return tx.salaryAllowance.delete({ where: { id } });
    });
  },

  async getSummary(startDate?: Date, endDate?: Date) {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const allowances = await prisma.salaryAllowance.findMany({
      where: {
        date: {
          gte: startOfDay(start),
          lte: endOfDay(end)
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const totalAmount = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);

    const byEmployee = allowances.reduce((acc, allowance) => {
      const key = allowance.employeeId;
      if (!acc[key]) {
        acc[key] = {
          employeeId: allowance.employeeId,
          employeeName: `${allowance.employee.firstName} ${allowance.employee.lastName}`,
          totalAmount: 0,
          count: 0
        };
      }
      acc[key].totalAmount += allowance.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<number, { employeeId: number; employeeName: string; totalAmount: number; count: number }>);

    return {
      totalAmount,
      byEmployee: Object.values(byEmployee),
      count: allowances.length,
      period: { start, end }
    };
  }
};
