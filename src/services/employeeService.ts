import { PrismaClient, EmployeeStatus } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const employeeService = {
  async getAll(filters?: { 
    status?: EmployeeStatus;
  }) {
    return await prisma.employee.findMany({
      where: {
        ...(filters?.status && { status: filters.status })
      },
      include: {
        salaryAllowances: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { firstName: 'asc' }
    });
  },

  async getById(id: number) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        salaryAllowances: {
          orderBy: { date: 'desc' }
        }
      }
    });
  },

  async create(data: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    hireDate: Date;
    monthlySalary: number;
    status?: EmployeeStatus;
  }) {
    return await prisma.employee.create({
      data
    });
  },

  async update(id: number, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    hireDate?: Date;
    monthlySalary?: number;
    status?: EmployeeStatus;
  }) {
    return await prisma.employee.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.employee.delete({
      where: { id }
    });
  },

  async getEmployeeSalaryInfo(id: number, month?: Date) {
    const targetMonth = month || new Date();
    const startDate = startOfMonth(targetMonth);
    const endDate = endOfMonth(targetMonth);

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        salaryAllowances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const totalAllowances = employee.salaryAllowances.reduce(
      (sum, allowance) => sum + allowance.amount, 
      0
    );

    const remainingSalary = employee.monthlySalary - totalAllowances;

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        monthlySalary: employee.monthlySalary
      },
      month: {
        start: startDate,
        end: endDate
      },
      totalAllowances,
      remainingSalary,
      allowances: employee.salaryAllowances
    };
  },

  async getAllEmployeesSalarySummary(month?: Date) {
    const targetMonth = month || new Date();
    const startDate = startOfMonth(targetMonth);
    const endDate = endOfMonth(targetMonth);

    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        salaryAllowances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const summary = employees.map(employee => {
      const totalAllowances = employee.salaryAllowances.reduce(
        (sum, allowance) => sum + allowance.amount,
        0
      );
      const remainingSalary = employee.monthlySalary - totalAllowances;

      return {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        monthlySalary: employee.monthlySalary,
        totalAllowances,
        remainingSalary,
        allowanceCount: employee.salaryAllowances.length
      };
    });

    const totals = {
      totalMonthlySalaries: summary.reduce((sum, emp) => sum + emp.monthlySalary, 0),
      totalAllowancesPaid: summary.reduce((sum, emp) => sum + emp.totalAllowances, 0),
      totalRemaining: summary.reduce((sum, emp) => sum + emp.remainingSalary, 0)
    };

    return {
      month: {
        start: startDate,
        end: endDate
      },
      employees: summary,
      totals
    };
  }
};
