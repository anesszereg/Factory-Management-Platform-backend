import { PrismaClient, EmployeeStatus } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getEmployeeSalaryCycle } from '../utils/dateUtils';

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

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const salaryCycle = getEmployeeSalaryCycle(employee.hireDate, targetMonth);

    const salaryAllowances = await prisma.salaryAllowance.findMany({
      where: {
        employeeId: id,
        date: {
          gte: salaryCycle.start,
          lte: salaryCycle.end
        }
      },
      orderBy: { date: 'desc' }
    });

    const totalAllowances = salaryAllowances.reduce(
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
      salaryCycle: {
        start: salaryCycle.start,
        end: salaryCycle.end
      },
      totalAllowances,
      remainingSalary,
      allowances: salaryAllowances
    };
  },

  async getAllEmployeesSalarySummary(month?: Date) {
    const targetMonth = month || new Date();

    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    const summary = await Promise.all(employees.map(async (employee) => {
      const salaryCycle = getEmployeeSalaryCycle(employee.hireDate, targetMonth);
      
      const salaryAllowances = await prisma.salaryAllowance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: salaryCycle.start,
            lte: salaryCycle.end
          }
        }
      });

      const totalAllowances = salaryAllowances.reduce(
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
        allowanceCount: salaryAllowances.length,
        salaryCycle: {
          start: salaryCycle.start,
          end: salaryCycle.end
        }
      };
    }));

    const totals = {
      totalMonthlySalaries: summary.reduce((sum, emp) => sum + emp.monthlySalary, 0),
      totalAllowancesPaid: summary.reduce((sum, emp) => sum + emp.totalAllowances, 0),
      totalRemaining: summary.reduce((sum, emp) => sum + emp.remainingSalary, 0)
    };

    return {
      referenceDate: targetMonth,
      employees: summary,
      totals
    };
  }
};
