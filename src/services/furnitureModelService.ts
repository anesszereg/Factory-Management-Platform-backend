import { PrismaClient, ProductionStep } from '@prisma/client';

const prisma = new PrismaClient();

type FurnitureSize = 'SIZE_45CM' | 'SIZE_60CM' | 'SIZE_80CM' | 'SIZE_100CM' | 'SIZE_120CM';

type MaterialRequirementInput = {
  step: ProductionStep;
  materialId: number;
  quantity: number;
  price?: number;
};

export const furnitureModelService = {
  async getAll() {
    return await prisma.furnitureModel.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { productionOrders: true }
        },
        materialRequirements: {
          include: { material: true }
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
        },
        materialRequirements: {
          include: { material: true }
        }
      }
    });
  },

  async create(data: {
    name: string;
    description?: string;
    size: FurnitureSize;
    materialRequirements?: MaterialRequirementInput[];
  }) {
    const { materialRequirements, ...modelData } = data;
    return await prisma.furnitureModel.create({
      data: {
        ...modelData,
        materialRequirements: materialRequirements
          ? { create: materialRequirements }
          : undefined
      },
      include: {
        materialRequirements: {
          include: { material: true }
        }
      }
    });
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      size?: FurnitureSize;
      materialRequirements?: MaterialRequirementInput[];
    }
  ) {
    const { materialRequirements, ...modelData } = data;
    return await prisma.$transaction(async (tx) => {
      if (materialRequirements) {
        await tx.modelMaterialRequirement.deleteMany({
          where: { modelId: id }
        });
        await tx.modelMaterialRequirement.createMany({
          data: materialRequirements.map((req) => ({
            modelId: id,
            step: req.step,
            materialId: req.materialId,
            quantity: req.quantity,
            price: req.price ?? 0
          }))
        });
      }
      return await tx.furnitureModel.update({
        where: { id },
        data: modelData,
        include: {
          materialRequirements: {
            include: { material: true }
          }
        }
      });
    });
  },

  async delete(id: number) {
    return await prisma.furnitureModel.delete({
      where: { id }
    });
  }
};
