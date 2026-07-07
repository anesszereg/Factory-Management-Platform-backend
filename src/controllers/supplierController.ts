import { Request, Response } from 'express';
import { supplierService } from '../services/supplierService';
import { SupplierStatus, SupplierOrderStatus } from '@prisma/client';

export const supplierController = {
  // Suppliers
  async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const suppliers = await supplierService.getAll({
        status: status as SupplierStatus,
      });
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const supplier = await supplierService.getById(id);
      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, phone, address, notes, openingCredit, openingDebt, openingBalanceDate, status } = req.body;
      const supplier = await supplierService.create({
        name,
        phone,
        address,
        notes,
        openingCredit: openingCredit ? parseFloat(openingCredit) : 0,
        openingDebt: openingDebt ? parseFloat(openingDebt) : 0,
        openingBalanceDate,
        status: status as SupplierStatus,
      });
      res.status(201).json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, phone, address, notes, openingCredit, openingDebt, openingBalanceDate, status } = req.body;
      const supplier = await supplierService.update(id, {
        name,
        phone,
        address,
        notes,
        openingCredit: openingCredit ? parseFloat(openingCredit) : undefined,
        openingDebt: openingDebt ? parseFloat(openingDebt) : undefined,
        openingBalanceDate,
        status: status as SupplierStatus,
      });
      res.json(supplier);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await supplierService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getSummary(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const summary = await supplierService.getSupplierSummary(id);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Orders
  async getAllOrders(req: Request, res: Response) {
    try {
      const { supplierId, status, startDate, endDate } = req.query;
      const orders = await supplierService.getAllOrders({
        supplierId: supplierId ? parseInt(supplierId as string) : undefined,
        status: status as SupplierOrderStatus,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const order = await supplierService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOrder(req: Request, res: Response) {
    try {
      const { supplierId, orderDate, notes, items } = req.body;
      const order = await supplierService.createOrder({
        supplierId: parseInt(supplierId),
        orderDate: new Date(orderDate),
        notes,
        items,
      });
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateOrder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { orderDate, notes, status } = req.body;
      const order = await supplierService.updateOrder(id, {
        orderDate: orderDate ? new Date(orderDate) : undefined,
        notes,
        status: status as SupplierOrderStatus,
      });
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteOrder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await supplierService.deleteOrder(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Payments
  async addPayment(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.orderId);
      const { date, amount, paymentMethod, notes, createExpense, moneyBoxId } = req.body;
      const payment = await supplierService.addPayment({
        orderId,
        date: new Date(date),
        amount: parseFloat(amount),
        paymentMethod,
        notes,
        createExpense,
        moneyBoxId: moneyBoxId ? parseInt(moneyBoxId) : undefined,
      });
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deletePayment(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await supplierService.deletePayment(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
