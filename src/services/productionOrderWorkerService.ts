import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const productionOrderWorkerService = {
  async getByOrderId(orderId: number) {
    return prisma.productionOrderWorker.findMany({
      where: { orderId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        pieceWorker: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: {
    orderId: number;
    employeeId?: number;
    pieceWorkerId?: number;
    cost?: number;
    notes?: string;
  }) {
    if (!data.employeeId && !data.pieceWorkerId) {
      throw new Error('Either employeeId or pieceWorkerId is required');
    }
    if (data.employeeId && data.pieceWorkerId) {
      throw new Error('Only one of employeeId or pieceWorkerId should be provided');
    }
    return prisma.productionOrderWorker.create({
      data: {
        orderId: data.orderId,
        employeeId: data.employeeId,
        pieceWorkerId: data.pieceWorkerId,
        cost: data.cost ?? 0,
        notes: data.notes
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        pieceWorker: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  },

  async update(id: number, data: {
    employeeId?: number;
    pieceWorkerId?: number;
    cost?: number;
    notes?: string;
  }) {
    if (data.employeeId && data.pieceWorkerId) {
      throw new Error('Only one of employeeId or pieceWorkerId should be provided');
    }
    return prisma.productionOrderWorker.update({
      where: { id },
      data,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        pieceWorker: { select: { id: true, firstName: true, lastName: true } }
      }
    });
  },

  async delete(id: number) {
    return prisma.productionOrderWorker.delete({ where: { id } });
  }
};
