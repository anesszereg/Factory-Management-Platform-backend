import { PrismaClient, ProductionStep } from '@prisma/client';
import { rawMaterialService } from './rawMaterialService';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const materialConsumptionService = {
  async getAll(filters?: { 
    materialId?: number; 
    orderId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.materialConsumption.findMany({
      where: {
        ...(filters?.materialId && { materialId: filters.materialId }),
        ...(filters?.orderId && { orderId: filters.orderId }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate)
          }
        })
      },
      include: {
        material: true,
        order: {
          include: {
            model: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.materialConsumption.findUnique({
      where: { id },
      include: {
        material: true,
        order: {
          include: {
            model: true
          }
        }
      }
    });
  },

  async create(data: {
    materialId: number;
    date: Date;
    quantity: number;
    orderId?: number;
    step?: ProductionStep;
    notes?: string;
  }) {
    const consumption = await prisma.materialConsumption.create({
      data,
      include: {
        material: true,
        order: {
          include: {
            model: true
          }
        }
      }
    });

    await rawMaterialService.updateStock(data.materialId, data.quantity, 'subtract');

    return consumption;
  },

  async update(id: number, data: {
    quantity?: number;
    notes?: string;
  }) {
    const oldConsumption = await prisma.materialConsumption.findUnique({
      where: { id }
    });

    if (!oldConsumption) {
      throw new Error('Consumption not found');
    }

    if (data.quantity && data.quantity !== oldConsumption.quantity) {
      const difference = data.quantity - oldConsumption.quantity;
      if (difference > 0) {
        await rawMaterialService.updateStock(oldConsumption.materialId, difference, 'subtract');
      } else {
        await rawMaterialService.updateStock(oldConsumption.materialId, Math.abs(difference), 'add');
      }
    }

    return await prisma.materialConsumption.update({
      where: { id },
      data,
      include: {
        material: true,
        order: {
          include: {
            model: true
          }
        }
      }
    });
  },

  async delete(id: number) {
    const consumption = await prisma.materialConsumption.findUnique({
      where: { id }
    });

    if (!consumption) {
      throw new Error('Consumption not found');
    }

    await rawMaterialService.updateStock(consumption.materialId, consumption.quantity, 'add');

    return await prisma.materialConsumption.delete({
      where: { id }
    });
  }
};
