import { Request, Response } from 'express';
import { dailyExpenseService } from '../services/dailyExpenseService';
import { ExpenseCategory } from '@prisma/client';

export const dailyExpenseController = {
  async getAll(req: Request, res: Response) {
    try {
      const { category, startDate, endDate } = req.query;
      const expenses = await dailyExpenseService.getAll({
        category: category as ExpenseCategory,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const expense = await dailyExpenseService.getById(id);
      
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { date, category, amount, paymentMethod, description } = req.body;
      const expense = await dailyExpenseService.create({
        date: date ? new Date(date) : new Date(),
        category: category as ExpenseCategory,
        amount: parseFloat(amount),
        paymentMethod,
        description
      });
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { date, category, amount, paymentMethod, description } = req.body;
      const expense = await dailyExpenseService.update(id, {
        date: date ? new Date(date) : undefined,
        category: category as ExpenseCategory,
        amount: amount ? parseFloat(amount) : undefined,
        paymentMethod,
        description
      });
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dailyExpenseService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await dailyExpenseService.getSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
