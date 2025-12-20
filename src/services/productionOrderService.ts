import { PrismaClient, ProductionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const productionOrderService = {
  async getAll(filters?: { status?: ProductionStatus; modelId?: number }) {
    return await prisma.productionOrder.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.modelId && { modelId: filters.modelId })
      },
      include: {
        model: true,
        _count: {
          select: { dailyProduction: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getById(id: number) {
    return await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        model: true,
        dailyProduction: {
          orderBy: { date: 'asc' }
        }
      }
    });
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
