import { Request, Response } from 'express';
import { incomeService } from '../services/incomeService';

export const incomeController = {
  async getAll(req: Request, res: Response) {
    try {
      const { startDate, endDate, source } = req.query;
      const incomes = await incomeService.getAll({
        startDate: startDate as string,
        endDate: endDate as string,
        source: source as any
      });
      res.json(incomes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const income = await incomeService.getById(id);
      
      if (!income) {
        return res.status(404).json({ error: 'Income not found' });
      }
      
      res.json(income);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const income = await incomeService.create(req.body);
      res.status(201).json(income);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const income = await incomeService.update(id, req.body);
      res.json(income);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await incomeService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await incomeService.getSummary({
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
