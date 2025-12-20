import { PrismaClient, ProductionStep } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const dailyProductionService = {
  async getAll(filters?: { 
    orderId?: number; 
    step?: ProductionStep; 
    date?: Date;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.dailyProduction.findMany({
      where: {
        ...(filters?.orderId && { orderId: filters.orderId }),
        ...(filters?.step && { step: filters.step }),
        ...(filters?.date && { 
          date: {
            gte: startOfDay(filters.date),
            lte: endOfDay(filters.date)
          }
        }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate)
          }
        })
      },
      include: {
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
    return await prisma.dailyProduction.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            model: true
          }
        }
      }
    });
  },

  async create(data: {
    orderId: number;
    step: ProductionStep;
    date: Date;
    quantityEntered: number;
    quantityCompleted: number;
    quantityLost?: number;
    notes?: string;
  }) {
    return await prisma.dailyProduction.create({
      data,
      include: {
        order: {
          include: {
            model: true
          }
        }
      }
    });
  },

  async update(id: number, data: {
    quantityEntered?: number;
    quantityCompleted?: number;
    quantityLost?: number;
    notes?: string;
  }) {
    return await prisma.dailyProduction.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            model: true
          }
        }
      }
    });
  },

  async delete(id: number) {
    return await prisma.dailyProduction.delete({
      where: { id }
    });
  },

  async getByStep(date?: Date) {
    const targetDate = date || new Date();
    
    const productions = await prisma.dailyProduction.findMany({
      where: {
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate)
        }
      },
      include: {
        order: {
          include: {
            model: true
          }
        }
      }
    });

    const groupedByStep = {
      CUTTING: { quantityEntered: 0, quantityCompleted: 0, items: [] as any[] },
      MONTAGE: { quantityEntered: 0, quantityCompleted: 0, items: [] as any[] },
      FINITION: { quantityEntered: 0, quantityCompleted: 0, items: [] as any[] },
      PAINT: { quantityEntered: 0, quantityCompleted: 0, items: [] as any[] },
      PACKAGING: { quantityEntered: 0, quantityCompleted: 0, items: [] as any[] }
    };

    productions.forEach(prod => {
      groupedByStep[prod.step].quantityEntered += prod.quantityEntered;
      groupedByStep[prod.step].quantityCompleted += prod.quantityCompleted;
      groupedByStep[prod.step].items.push(prod);
    });

    return groupedByStep;
  },

  async getFinishedProducts(date?: Date) {
    const targetDate = date || new Date();
    
    return await prisma.dailyProduction.findMany({
      where: {
        step: 'PACKAGING',
        date: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate)
        }
      },
      include: {
        order: {
          include: {
            model: true
          }
        }
      }
    });
  }
};
