import { Request, Response } from 'express';
import { productionOrderWorkerService } from '../services/productionOrderWorkerService';

export const productionOrderWorkerController = {
  async getByOrderId(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.orderId);
      const workers = await productionOrderWorkerService.getByOrderId(orderId);
      res.json(workers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { orderId, employeeId, pieceWorkerId, cost, notes } = req.body;
      const worker = await productionOrderWorkerService.create({
        orderId: parseInt(orderId),
        employeeId: employeeId ? parseInt(employeeId) : undefined,
        pieceWorkerId: pieceWorkerId ? parseInt(pieceWorkerId) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes
      });
      res.status(201).json(worker);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { employeeId, pieceWorkerId, cost, notes } = req.body;
      const worker = await productionOrderWorkerService.update(id, {
        employeeId: employeeId ? parseInt(employeeId) : undefined,
        pieceWorkerId: pieceWorkerId ? parseInt(pieceWorkerId) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes
      });
      res.json(worker);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await productionOrderWorkerService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
