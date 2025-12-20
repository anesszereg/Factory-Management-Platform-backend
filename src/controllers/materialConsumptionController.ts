import { Request, Response } from 'express';
import { materialConsumptionService } from '../services/materialConsumptionService';
import { ProductionStep } from '@prisma/client';

export const materialConsumptionController = {
  async getAll(req: Request, res: Response) {
    try {
      const { materialId, orderId, startDate, endDate } = req.query;
      const consumptions = await materialConsumptionService.getAll({
        materialId: materialId ? parseInt(materialId as string) : undefined,
        orderId: orderId ? parseInt(orderId as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(consumptions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const consumption = await materialConsumptionService.getById(id);
      
      if (!consumption) {
        return res.status(404).json({ error: 'Consumption not found' });
      }
      
      res.json(consumption);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { materialId, date, quantity, orderId, step, notes } = req.body;
      const consumption = await materialConsumptionService.create({
        materialId: parseInt(materialId),
        date: new Date(date),
        quantity: parseFloat(quantity),
        orderId: orderId ? parseInt(orderId) : undefined,
        step: step as ProductionStep,
        notes
      });
      res.status(201).json(consumption);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { quantity, notes } = req.body;
      const consumption = await materialConsumptionService.update(id, {
        quantity: quantity ? parseFloat(quantity) : undefined,
        notes
      });
      res.json(consumption);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await materialConsumptionService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
