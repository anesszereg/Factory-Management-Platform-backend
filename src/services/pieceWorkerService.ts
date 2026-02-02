import { PrismaClient, PieceWorkerStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const pieceWorkerService = {
  async getAll(filters?: { status?: PieceWorkerStatus }) {
    return await prisma.pieceWorker.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: number) {
    return await prisma.pieceWorker.findUnique({
      where: { id },
    });
  },

  async create(data: {
    firstName: string;
    lastName: string;
    phone?: string;
    pricePerPiece: number;
    status?: PieceWorkerStatus;
  }) {
    return await prisma.pieceWorker.create({
      data: {
        ...data,
        status: data.status || PieceWorkerStatus.ACTIVE,
      },
    });
  },

  async update(id: number, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    pricePerPiece?: number;
    status?: PieceWorkerStatus;
  }) {
    return await prisma.pieceWorker.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return await prisma.pieceWorker.delete({
      where: { id },
    });
  },
};
