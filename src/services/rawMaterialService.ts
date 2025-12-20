import { PrismaClient, MaterialUnit } from '@prisma/client';

const prisma = new PrismaClient();

export const rawMaterialService = {
  async getAll() {
    return await prisma.rawMaterial.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { 
            purchases: true,
            consumption: true
          }
        }
      }
    });
  },

  async getById(id: number) {
    return await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { date: 'desc' },
          take: 10
        },
        consumption: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });
  },

  async create(data: {
    name: string;
    unit: MaterialUnit;
    currentStock?: number;
    minStockAlert?: number;
  }) {
    return await prisma.rawMaterial.create({
      data
    });
  },

  async update(id: number, data: {
    name?: string;
    unit?: MaterialUnit;
    minStockAlert?: number;
  }) {
    return await prisma.rawMaterial.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return await prisma.rawMaterial.delete({
      where: { id }
    });
  },

  async getLowStock() {
    return await prisma.rawMaterial.findMany({
      where: {
        currentStock: {
          lte: prisma.rawMaterial.fields.minStockAlert
        }
      },
      orderBy: { currentStock: 'asc' }
    });
  },

  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract') {
    const material = await prisma.rawMaterial.findUnique({
      where: { id }
    });

    if (!material) {
      throw new Error('Material not found');
    }

    const newStock = operation === 'add' 
      ? material.currentStock + quantity 
      : material.currentStock - quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    return await prisma.rawMaterial.update({
      where: { id },
      data: { currentStock: newStock }
    });
  }
};
