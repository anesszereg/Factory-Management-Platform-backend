import { Request, Response } from 'express';
import { productionOrderService } from '../services/productionOrderService';
import { ProductionStatus } from '@prisma/client';

export const productionOrderController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, modelId } = req.query;
      const orders = await productionOrderService.getAll({
        status: status as ProductionStatus,
        modelId: modelId ? parseInt(modelId as string) : undefined
      });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const order = await productionOrderService.getById(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { modelId, quantity, startDate } = req.body;
      const order = await productionOrderService.create({
        modelId: parseInt(modelId),
        quantity: parseInt(quantity),
        startDate: new Date(startDate)
      });
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { quantity, startDate, status } = req.body;
      const order = await productionOrderService.update(id, {
        quantity: quantity ? parseInt(quantity) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        status: status as ProductionStatus
      });
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await productionOrderService.updateStatus(id, status as ProductionStatus);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await productionOrderService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getProgress(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const progress = await productionOrderService.getProgress(id);
      
      if (!progress) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
