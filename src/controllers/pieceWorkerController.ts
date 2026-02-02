import { Request, Response } from 'express';
import { pieceWorkerService } from '../services/pieceWorkerService';
import { PieceWorkerStatus } from '@prisma/client';

export const pieceWorkerController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const workers = await pieceWorkerService.getAll({
        status: status as PieceWorkerStatus | undefined,
      });
      res.json(workers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const worker = await pieceWorkerService.getById(id);
      
      if (!worker) {
        return res.status(404).json({ error: 'Piece worker not found' });
      }
      
      res.json(worker);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { firstName, lastName, phone, pricePerPiece, status } = req.body;
      const worker = await pieceWorkerService.create({
        firstName,
        lastName,
        phone,
        pricePerPiece: parseFloat(pricePerPiece),
        status: status as PieceWorkerStatus,
      });
      res.status(201).json(worker);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { firstName, lastName, phone, pricePerPiece, status } = req.body;
      const worker = await pieceWorkerService.update(id, {
        firstName,
        lastName,
        phone,
        pricePerPiece: pricePerPiece ? parseFloat(pricePerPiece) : undefined,
        status: status as PieceWorkerStatus,
      });
      res.json(worker);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await pieceWorkerService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
