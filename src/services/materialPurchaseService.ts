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
        material: true,
        supplier: true
      },
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.materialPurchase.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: true
      }
    });
  },

  async create(data: {
    materialId: number;
    date: Date;
    supplierId?: number;
    supplierName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }) {
    const totalPrice = data.totalPrice ?? data.quantity * data.unitPrice;

    const purchase = await prisma.materialPurchase.create({
      data: {
        materialId: data.materialId,
        date: data.date,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice
      },
      include: {
        material: true,
        supplier: true
      }
    });

    await rawMaterialService.updateStock(data.materialId, data.quantity, 'add');

    return purchase;
  },

  async update(id: number, data: {
    supplierId?: number;
    supplierName?: string;
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

    const unitPrice = data.unitPrice ?? oldPurchase.unitPrice;
    const quantity = data.quantity ?? oldPurchase.quantity;
    const totalPrice = data.totalPrice ?? quantity * unitPrice;

    return await prisma.materialPurchase.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice
      },
      include: {
        material: true,
        supplier: true
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
