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
    // Fetch all receipts for this worker to clean up linked expenses
    const receipts = await prisma.dailyPieceReceipt.findMany({
      where: { pieceWorkerId: id },
      select: { id: true, expenseId: true },
    });

    const expenseIds = receipts
      .map(r => r.expenseId)
      .filter((eid): eid is number => eid !== null);

    // Delete receipt items first (FK child of DailyPieceReceipt)
    await prisma.receiptItem.deleteMany({
      where: { receiptId: { in: receipts.map(r => r.id) } },
    });

    // Delete all receipts for this worker
    await prisma.dailyPieceReceipt.deleteMany({
      where: { pieceWorkerId: id },
    });

    // Delete linked daily expenses
    if (expenseIds.length > 0) {
      await prisma.dailyExpense.deleteMany({
        where: { id: { in: expenseIds } },
      });
    }

    return await prisma.pieceWorker.delete({
      where: { id },
    });
  },
};
