import { Request, Response } from 'express';
import { employeeService } from '../services/employeeService';
import { EmployeeStatus } from '@prisma/client';

export const employeeController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const employees = await employeeService.getAll({
        status: status as EmployeeStatus
      });
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const employee = await employeeService.getById(id);
      
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { firstName, lastName, phone, address, hireDate, monthlySalary, status } = req.body;
      const employee = await employeeService.create({
        firstName,
        lastName,
        phone,
        address,
        hireDate: new Date(hireDate),
        monthlySalary: parseFloat(monthlySalary),
        status: status as EmployeeStatus
      });
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { firstName, lastName, phone, address, hireDate, monthlySalary, status } = req.body;
      const employee = await employeeService.update(id, {
        firstName,
        lastName,
        phone,
        address,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        monthlySalary: monthlySalary ? parseFloat(monthlySalary) : undefined,
        status: status as EmployeeStatus
      });
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await employeeService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSalaryInfo(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { month } = req.query;
      const salaryInfo = await employeeService.getEmployeeSalaryInfo(
        id,
        month ? new Date(month as string) : undefined
      );
      res.json(salaryInfo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getSalarySummary(req: Request, res: Response) {
    try {
      const { month } = req.query;
      const summary = await employeeService.getAllEmployeesSalarySummary(
        month ? new Date(month as string) : undefined
      );
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
