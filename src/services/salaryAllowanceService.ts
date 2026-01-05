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
    return await prisma.salaryAllowance.findMany({
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
  },

  async getById(id: number) {
    return await prisma.salaryAllowance.findUnique({
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
  },

  async create(data: {
    employeeId: number;
    date: Date;
    amount: number;
    description?: string;
  }) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId }
    });

    if (!employee) {
      throw new Error('Employee not found');
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

    const result = await prisma.$transaction(async (tx) => {
      const allowance = await tx.salaryAllowance.create({
        data,
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
          description: data.description 
            ? `Salary allowance for ${employee.firstName} ${employee.lastName}: ${data.description}`
            : `Salary allowance for ${employee.firstName} ${employee.lastName}`,
        }
      });

      return allowance;
    });

    return result;
  },

  async update(id: number, data: {
    date?: Date;
    amount?: number;
    description?: string;
  }) {
    const existingAllowance = await prisma.salaryAllowance.findUnique({
      where: { id },
      include: {
        employee: true
      }
    });

    if (!existingAllowance) {
      throw new Error('Allowance not found');
    }

    if (data.amount) {
      const targetDate = data.date || existingAllowance.date;
      const salaryCycle = getEmployeeSalaryCycle(existingAllowance.employee.hireDate, targetDate);
      
      const monthAllowances = await prisma.salaryAllowance.findMany({
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

      if (data.amount > remainingSalary) {
        throw new Error(
          `Updated allowance amount (${data.amount}) exceeds remaining salary (${remainingSalary})`
        );
      }
    }

    return await prisma.salaryAllowance.update({
      where: { id },
      data,
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
  },

  async delete(id: number) {
    return await prisma.salaryAllowance.delete({
      where: { id }
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
