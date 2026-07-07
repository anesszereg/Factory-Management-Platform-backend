import { PrismaClient, ProductionStep } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';
import { warehouseService } from './warehouseService';

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
        colorSplits: true,
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
        colorSplits: true,
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
    colorSplits?: { color: string; quantity: number }[];
  }) {
    const { colorSplits, ...productionData } = data;

    if (productionData.step === ProductionStep.PAINT && colorSplits && colorSplits.length > 0) {
      const splitTotal = colorSplits.reduce((sum, s) => sum + s.quantity, 0);
      if (splitTotal !== productionData.quantityCompleted) {
        throw new Error(`Color split total (${splitTotal}) must equal completed quantity (${productionData.quantityCompleted})`);
      }
    }

    const production = await prisma.dailyProduction.create({
      data: {
        ...productionData,
        colorSplits: colorSplits && colorSplits.length > 0
          ? { create: colorSplits }
          : undefined
      },
      include: {
        colorSplits: true,
        order: {
          include: {
            model: true
          }
        }
      }
    });

    if (production.step === ProductionStep.PACKAGING) {
      await this.finishOrderAndStock(production.orderId);
    }

    return production;
  },

  async finishOrderAndStock(orderId: number) {
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        model: true,
        materialConsumption: { include: { material: true } },
        workers: true,
        pieceWorkerPayments: true,
      }
    });

    if (!order || order.status !== 'IN_PROGRESS') return;

    const allSteps = Object.values(ProductionStep);
    const records = await prisma.dailyProduction.findMany({
      where: { orderId }
    });
    const stepCompleted: Record<string, number> = {};
    records.forEach(r => {
      stepCompleted[r.step] = (stepCompleted[r.step] || 0) + r.quantityCompleted;
    });
    const allStepsCompleted = allSteps.every(step => (stepCompleted[step] || 0) >= order.quantity);
    if (!allStepsCompleted) {
      console.warn(`Order ${orderId} has not completed all production steps; skipping auto-stock insertion`);
      return;
    }

    // Calculate total production cost
    const materialCost = order.materialConsumption.reduce(
      (sum, c) => sum + (c.quantity * (c.material.purchasePrice || 0)), 0
    );
    const laborCost = order.workers.reduce((sum, w) => sum + w.cost, 0);
    const pieceWorkerCost = order.pieceWorkerPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCost = materialCost + laborCost + pieceWorkerCost;
    const costPerUnit = order.quantity > 0 ? totalCost / order.quantity : 0;

    const paintRecords = await prisma.dailyProduction.findMany({
      where: { orderId, step: ProductionStep.PAINT },
      include: { colorSplits: true }
    });

    const colorTotals: Record<string, number> = {};
    paintRecords.forEach(record => {
      record.colorSplits.forEach(split => {
        colorTotals[split.color] = (colorTotals[split.color] || 0) + split.quantity;
      });
    });

    const colors = Object.keys(colorTotals);
    if (colors.length === 0) {
      colorTotals['DEFAULT'] = order.quantity;
    }

    const warehouse = await prisma.warehouse.findFirst({ orderBy: { id: 'asc' } });
    if (!warehouse) {
      console.warn('No warehouse found; cannot auto-insert finished products');
      return;
    }

    for (const [color, quantity] of Object.entries(colorTotals)) {
      const sku = `${order.model.name}-${order.model.size}-${color}`.toUpperCase();
      await warehouseService.addInventory({
        modelId: order.modelId,
        warehouseId: warehouse.id,
        sku,
        color: color !== 'DEFAULT' ? color : undefined,
        quantity,
        productionCost: costPerUnit,
        productionDate: new Date().toISOString().split('T')[0],
      });
    }

    await prisma.productionOrder.update({
      where: { id: orderId },
      data: { status: 'FINISHED' }
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
        colorSplits: true,
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
        colorSplits: true,
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
        colorSplits: true,
        order: {
          include: {
            model: true
          }
        }
      }
    });
  }
};
