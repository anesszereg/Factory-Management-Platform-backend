import { PrismaClient, ProductionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const productionOrderService = {
  async getAll(filters?: { status?: ProductionStatus; modelId?: number }) {
    const orders = await prisma.productionOrder.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.modelId && { modelId: filters.modelId })
      },
      include: {
        model: true,
        workers: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
            pieceWorker: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        materialConsumption: {
          include: { material: true }
        },
        pieceWorkerPayments: true,
        _count: {
          select: { dailyProduction: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(order => {
      const materialCost = order.materialConsumption.reduce(
        (sum, c) => sum + (c.quantity * (c.material.purchasePrice || 0)),
        0
      );
      const pieceWorkerCost = order.pieceWorkerPayments.reduce(
        (sum, p) => sum + p.totalAmount,
        0
      );
      const laborCost = order.workers.reduce((sum, w) => sum + w.cost, 0);
      return {
        ...order,
        materialCost,
        pieceWorkerCost,
        laborCost,
        totalCost: materialCost + pieceWorkerCost + laborCost
      };
    });
  },

  async getById(id: number) {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        model: true,
        dailyProduction: {
          orderBy: { date: 'asc' }
        },
        workers: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
            pieceWorker: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        materialConsumption: {
          include: { material: true }
        },
        pieceWorkerPayments: true
      }
    });

    if (!order) return null;

    const materialCost = order.materialConsumption.reduce(
      (sum, c) => sum + (c.quantity * (c.material.purchasePrice || 0)),
      0
    );
    const pieceWorkerCost = order.pieceWorkerPayments.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );
    const laborCost = order.workers.reduce((sum, w) => sum + w.cost, 0);

    return {
      ...order,
      materialCost,
      pieceWorkerCost,
      laborCost,
      totalCost: materialCost + pieceWorkerCost + laborCost
    };
  },

  async create(data: {
    modelId: number;
    quantity: number;
    startDate: Date;
  }) {
    return await prisma.productionOrder.create({
      data: {
        ...data,
        status: 'IN_PROGRESS'
      },
      include: {
        model: true
      }
    });
  },

  async update(id: number, data: {
    quantity?: number;
    startDate?: Date;
    status?: ProductionStatus;
  }) {
    return await prisma.productionOrder.update({
      where: { id },
      data,
      include: {
        model: true
      }
    });
  },

  async updateStatus(id: number, status: ProductionStatus) {
    return await prisma.productionOrder.update({
      where: { id },
      data: { status },
      include: {
        model: true
      }
    });
  },

  async delete(id: number) {
    return await prisma.productionOrder.delete({
      where: { id }
    });
  },

  async getProgress(id: number) {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        dailyProduction: true
      }
    });

    if (!order) return null;

    const progressByStep = {
      CUTTING: 0,
      MONTAGE: 0,
      FINITION: 0,
      PAINT: 0,
      PACKAGING: 0
    };

    order.dailyProduction.forEach(dp => {
      progressByStep[dp.step] += dp.quantityCompleted;
    });

    return {
      orderId: order.id,
      totalQuantity: order.quantity,
      progressByStep,
      status: order.status
    };
  }
};
