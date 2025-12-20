import { Request, Response } from 'express';
import { dailyProductionService } from '../services/dailyProductionService';
import { ProductionStep } from '@prisma/client';

export const dailyProductionController = {
  async getAll(req: Request, res: Response) {
    try {
      const { orderId, step, date, startDate, endDate } = req.query;
      const productions = await dailyProductionService.getAll({
        orderId: orderId ? parseInt(orderId as string) : undefined,
        step: step as ProductionStep,
        date: date ? new Date(date as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(productions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const production = await dailyProductionService.getById(id);
      
      if (!production) {
        return res.status(404).json({ error: 'Production entry not found' });
      }
      
      res.json(production);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { orderId, step, date, quantityEntered, quantityCompleted, quantityLost, notes } = req.body;
      const production = await dailyProductionService.create({
        orderId: parseInt(orderId),
        step: step as ProductionStep,
        date: new Date(date),
        quantityEntered: parseInt(quantityEntered),
        quantityCompleted: parseInt(quantityCompleted),
        quantityLost: quantityLost ? parseInt(quantityLost) : undefined,
        notes
      });
      res.status(201).json(production);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { quantityEntered, quantityCompleted, quantityLost, notes } = req.body;
      const production = await dailyProductionService.update(id, {
        quantityEntered: quantityEntered ? parseInt(quantityEntered) : undefined,
        quantityCompleted: quantityCompleted ? parseInt(quantityCompleted) : undefined,
        quantityLost: quantityLost ? parseInt(quantityLost) : undefined,
        notes
      });
      res.json(production);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dailyProductionService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getByStep(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const groupedByStep = await dailyProductionService.getByStep(
        date ? new Date(date as string) : undefined
      );
      res.json(groupedByStep);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getFinishedProducts(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const finished = await dailyProductionService.getFinishedProducts(
        date ? new Date(date as string) : undefined
      );
      res.json(finished);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
