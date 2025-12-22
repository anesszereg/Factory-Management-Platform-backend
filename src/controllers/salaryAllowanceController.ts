import { Request, Response } from 'express';
import { salaryAllowanceService } from '../services/salaryAllowanceService';

export const salaryAllowanceController = {
  async getAll(req: Request, res: Response) {
    try {
      const { employeeId, startDate, endDate } = req.query;
      const allowances = await salaryAllowanceService.getAll({
        employeeId: employeeId ? parseInt(employeeId as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(allowances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const allowance = await salaryAllowanceService.getById(id);
      
      if (!allowance) {
        return res.status(404).json({ error: 'Allowance not found' });
      }
      
      res.json(allowance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { employeeId, date, amount, description } = req.body;
      const allowance = await salaryAllowanceService.create({
        employeeId: parseInt(employeeId),
        date: date ? new Date(date) : new Date(),
        amount: parseFloat(amount),
        description
      });
      res.status(201).json(allowance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { date, amount, description } = req.body;
      const allowance = await salaryAllowanceService.update(id, {
        date: date ? new Date(date) : undefined,
        amount: amount ? parseFloat(amount) : undefined,
        description
      });
      res.json(allowance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await salaryAllowanceService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await salaryAllowanceService.getSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
