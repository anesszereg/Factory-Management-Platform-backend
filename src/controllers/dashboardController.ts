import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const stats = await dashboardService.getStats(
        date ? new Date(date as string) : undefined
      );
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
