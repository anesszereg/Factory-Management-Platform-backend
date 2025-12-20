import { Request, Response } from 'express';
import { furnitureModelService } from '../services/furnitureModelService';

export const furnitureModelController = {
  async getAll(req: Request, res: Response) {
    try {
      const models = await furnitureModelService.getAll();
      res.json(models);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const model = await furnitureModelService.getById(id);
      
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      
      res.json(model);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const model = await furnitureModelService.create(req.body);
      res.status(201).json(model);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const model = await furnitureModelService.update(id, req.body);
      res.json(model);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await furnitureModelService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
