import { Request, Response } from 'express';
import { rawMaterialService } from '../services/rawMaterialService';
import { MaterialUnit } from '@prisma/client';

export const rawMaterialController = {
  async getAll(req: Request, res: Response) {
    try {
      const materials = await rawMaterialService.getAll();
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const material = await rawMaterialService.getById(id);
      
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }
      
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, unit, currentStock, minStockAlert } = req.body;
      const material = await rawMaterialService.create({
        name,
        unit: unit as MaterialUnit,
        currentStock: currentStock ? parseFloat(currentStock) : undefined,
        minStockAlert: minStockAlert ? parseFloat(minStockAlert) : undefined
      });
      res.status(201).json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, unit, minStockAlert } = req.body;
      const material = await rawMaterialService.update(id, {
        name,
        unit: unit as MaterialUnit,
        minStockAlert: minStockAlert ? parseFloat(minStockAlert) : undefined
      });
      res.json(material);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await rawMaterialService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getLowStock(req: Request, res: Response) {
    try {
      const materials = await rawMaterialService.getLowStock();
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
