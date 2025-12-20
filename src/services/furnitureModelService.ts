import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type FurnitureSize = 'SIZE_45CM' | 'SIZE_60CM' | 'SIZE_80CM' | 'SIZE_100CM' | 'SIZE_120CM';

export const furnitureModelService = {
  async getAll() {
    return await prisma.furnitureModel.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { productionOrders: true }
        }
      }
    });
  },

  async getById(id: number) {
    return await prisma.furnitureModel.findUnique({
      where: { id },
      include: {
        productionOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  },

  async create(data: { name: string; description?: string; size: FurnitureSize }) {
    return await prisma.furnitureModel.create({
      data
    });
  },

  async update(id: number, data: { name?: string; description?: string; size?: FurnitureSize }) {
    return await prisma.furnitureModel.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.furnitureModel.delete({
      where: { id }
    });
  }
};
