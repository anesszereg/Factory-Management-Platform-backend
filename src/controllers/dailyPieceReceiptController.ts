import { Request, Response } from 'express';
import { dailyPieceReceiptService } from '../services/dailyPieceReceiptService';
import { PaymentStatus } from '@prisma/client';

export const dailyPieceReceiptController = {
  async getAll(req: Request, res: Response) {
    try {
      const { pieceWorkerId, paymentStatus, startDate, endDate } = req.query;
      const receipts = await dailyPieceReceiptService.getAll({
        pieceWorkerId: pieceWorkerId ? parseInt(pieceWorkerId as string) : undefined,
        paymentStatus: paymentStatus as PaymentStatus | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(receipts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const receipt = await dailyPieceReceiptService.getById(id);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      res.json(receipt);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { pieceWorkerId, date, items, paidAmount, notes } = req.body;
      
      // Parse items
      const parsedItems = items.map((item: any) => ({
        itemName: item.itemName,
        quantity: parseInt(item.quantity),
        pricePerPiece: parseFloat(item.pricePerPiece),
      }));
      
      const receipt = await dailyPieceReceiptService.create({
        pieceWorkerId: parseInt(pieceWorkerId),
        date: new Date(date),
        items: parsedItems,
        paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
        notes,
      });
      res.status(201).json(receipt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { date, items, paidAmount, notes } = req.body;
      
      // Parse items if provided
      const parsedItems = items ? items.map((item: any) => ({
        itemName: item.itemName,
        quantity: parseInt(item.quantity),
        pricePerPiece: parseFloat(item.pricePerPiece),
      })) : undefined;
      
      const receipt = await dailyPieceReceiptService.update(id, {
        date: date ? new Date(date) : undefined,
        items: parsedItems,
        paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
        notes,
      });
      res.json(receipt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async addPayment(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { amount } = req.body;
      
      const receipt = await dailyPieceReceiptService.addPayment(id, parseFloat(amount));
      res.json(receipt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await dailyPieceReceiptService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const { pieceWorkerId, startDate, endDate } = req.query;
      const summary = await dailyPieceReceiptService.getSummary(
        pieceWorkerId ? parseInt(pieceWorkerId as string) : undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
