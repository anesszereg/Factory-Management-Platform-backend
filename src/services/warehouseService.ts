import { PrismaClient, InventoryMovementType } from '@prisma/client';

const prisma = new PrismaClient();

export const warehouseService = {
  async getAll() {
    return prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { inventoryItems: true } }
      }
    });
  },

  async getById(id: number) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryItems: { include: { model: true }, orderBy: { updatedAt: 'desc' } }
      }
    });
  },

  async create(data: { name: string; code?: string; address?: string; description?: string }) {
    return prisma.warehouse.create({ data });
  },

  async update(id: number, data: { name?: string; code?: string; address?: string; description?: string }) {
    return prisma.warehouse.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.warehouse.delete({ where: { id } });
  },

  async getAllInventory(warehouseId?: number) {
    return prisma.finishedProductInventory.findMany({
      where: warehouseId ? { warehouseId } : {},
      include: {
        model: { select: { id: true, name: true, size: true } },
        warehouse: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  },

  async getInventoryById(id: number) {
    return prisma.finishedProductInventory.findUnique({
      where: { id },
      include: {
        model: true,
        warehouse: true,
        movements: { orderBy: { date: 'desc' }, take: 30 }
      }
    });
  },

  async addInventory(data: {
    modelId: number;
    warehouseId: number;
    sku: string;
    quantity: number;
    productionCost?: number;
    batchNumber?: string;
    productionDate?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.finishedProductInventory.findFirst({
        where: { sku: data.sku }
      });
      let product;
      if (existing) {
        product = await tx.finishedProductInventory.update({
          where: { id: existing.id },
          data: { quantity: { increment: data.quantity } }
        });
      } else {
        product = await tx.finishedProductInventory.create({
          data: {
            modelId: data.modelId,
            warehouseId: data.warehouseId,
            sku: data.sku,
            quantity: data.quantity,
            productionCost: data.productionCost ?? 0,
            batchNumber: data.batchNumber,
            productionDate: data.productionDate ? new Date(data.productionDate) : null,
          }
        });
      }
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          toWarehouseId: data.warehouseId,
          type: InventoryMovementType.PRODUCTION_IN,
          quantity: data.quantity,
          date: new Date(),
          notes: `Stock added`,
        }
      });
      return product;
    });
  },

  async adjustInventory(id: number, quantity: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.finishedProductInventory.findUnique({ where: { id } });
      if (!product) throw new Error('Product not found');
      const updated = await tx.finishedProductInventory.update({
        where: { id },
        data: { quantity: { increment: quantity } }
      });
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          toWarehouseId: product.warehouseId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: Math.abs(quantity),
          date: new Date(),
          notes: notes ?? 'Manual adjustment',
        }
      });
      return updated;
    });
  },

  async transfer(productId: number, fromWarehouseId: number, toWarehouseId: number, quantity: number, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.finishedProductInventory.findUnique({ where: { id: productId } });
      if (!product || product.quantity < quantity) throw new Error('Insufficient stock');
      await tx.finishedProductInventory.update({ where: { id: productId }, data: { quantity: { decrement: quantity } } });
      const existing = await tx.finishedProductInventory.findFirst({ where: { modelId: product.modelId, warehouseId: toWarehouseId } });
      if (existing) {
        await tx.finishedProductInventory.update({ where: { id: existing.id }, data: { quantity: { increment: quantity } } });
      } else {
        await tx.finishedProductInventory.create({
          data: { modelId: product.modelId, warehouseId: toWarehouseId, sku: `${product.sku}-W${toWarehouseId}`, quantity }
        });
      }
      await tx.inventoryMovement.create({
        data: {
          productId,
          fromWarehouseId,
          toWarehouseId,
          type: InventoryMovementType.TRANSFER,
          quantity,
          date: new Date(),
          notes: notes ?? 'Warehouse transfer',
        }
      });
    });
  }
};
