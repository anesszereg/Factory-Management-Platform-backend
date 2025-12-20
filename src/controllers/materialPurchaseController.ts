import { Request, Response } from 'express';
import { materialPurchaseService } from '../services/materialPurchaseService';

export const materialPurchaseController = {
  async getAll(req: Request, res: Response) {
    try {
      const { materialId, startDate, endDate } = req.query;
      const purchases = await materialPurchaseService.getAll({
        materialId: materialId ? parseInt(materialId as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const purchase = await materialPurchaseService.getById(id);
      
      if (!purchase) {
        return res.status(404).json({ error: 'Purchase not found' });
      }
      
      res.json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { materialId, date, supplier, quantity, unitPrice, totalPrice } = req.body;
      const purchase = await materialPurchaseService.create({
        materialId: parseInt(materialId),
        date: new Date(date),
        supplier,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice)
      });
      res.status(201).json(purchase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { supplier, quantity, unitPrice, totalPrice } = req.body;
      const purchase = await materialPurchaseService.update(id, {
        supplier,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        totalPrice: totalPrice ? parseFloat(totalPrice) : undefined
      });
      res.json(purchase);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await materialPurchaseService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
