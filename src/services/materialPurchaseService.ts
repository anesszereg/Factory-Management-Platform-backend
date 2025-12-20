import { PrismaClient } from '@prisma/client';
import { rawMaterialService } from './rawMaterialService';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const materialPurchaseService = {
  async getAll(filters?: { 
    materialId?: number; 
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.materialPurchase.findMany({
      where: {
        ...(filters?.materialId && { materialId: filters.materialId }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate)
          }
        })
      },
      include: {
        material: true
      },
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.materialPurchase.findUnique({
      where: { id },
      include: {
        material: true
      }
    });
  },

  async create(data: {
    materialId: number;
    date: Date;
    supplier: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }) {
    const purchase = await prisma.materialPurchase.create({
      data,
      include: {
        material: true
      }
    });

    await rawMaterialService.updateStock(data.materialId, data.quantity, 'add');

    return purchase;
  },

  async update(id: number, data: {
    supplier?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }) {
    const oldPurchase = await prisma.materialPurchase.findUnique({
      where: { id }
    });

    if (!oldPurchase) {
      throw new Error('Purchase not found');
    }

    if (data.quantity && data.quantity !== oldPurchase.quantity) {
      const difference = data.quantity - oldPurchase.quantity;
      if (difference > 0) {
        await rawMaterialService.updateStock(oldPurchase.materialId, difference, 'add');
      } else {
        await rawMaterialService.updateStock(oldPurchase.materialId, Math.abs(difference), 'subtract');
      }
    }

    return await prisma.materialPurchase.update({
      where: { id },
      data,
      include: {
        material: true
      }
    });
  },

  async delete(id: number) {
    const purchase = await prisma.materialPurchase.findUnique({
      where: { id }
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    await rawMaterialService.updateStock(purchase.materialId, purchase.quantity, 'subtract');

    return await prisma.materialPurchase.delete({
      where: { id }
    });
  }
};
