import { PrismaClient, PaymentStatus } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function syncPieceWorkerExpense(
  tx: TransactionClient,
  receipt: {
    id: number;
    date: Date;
    paidAmount: number;
    expenseId: number | null;
    pieceWorker?: { firstName: string; lastName: string } | null;
  },
  createExpense: boolean,
  moneyBoxId?: number
) {
  if (!createExpense || receipt.paidAmount <= 0) {
    if (receipt.expenseId) {
      const existing = await tx.dailyExpense.findUnique({ where: { id: receipt.expenseId } });
      if (existing?.moneyBoxId) {
        await tx.moneyBox.update({ where: { id: existing.moneyBoxId }, data: { currentBalance: { increment: existing.amount } } });
      }
      await tx.dailyExpense.delete({ where: { id: receipt.expenseId } }).catch(() => {});
    }
    return null;
  }

  const description = receipt.pieceWorker
    ? `Piece worker payment: ${receipt.pieceWorker.firstName} ${receipt.pieceWorker.lastName}`
    : 'Piece worker payment';

  if (receipt.expenseId) {
    const existing = await tx.dailyExpense.findUnique({ where: { id: receipt.expenseId } });
    if (existing) {
      // Restore old money box if changed
      if (existing.moneyBoxId && existing.moneyBoxId !== moneyBoxId) {
        await tx.moneyBox.update({ where: { id: existing.moneyBoxId }, data: { currentBalance: { increment: existing.amount } } });
      }
      // Adjust balance on same money box if amount changed
      if (existing.moneyBoxId && existing.moneyBoxId === moneyBoxId) {
        await tx.moneyBox.update({ where: { id: existing.moneyBoxId }, data: { currentBalance: { increment: existing.amount - receipt.paidAmount } } });
      }
      // Decrement new money box if changed
      if (moneyBoxId && existing.moneyBoxId !== moneyBoxId) {
        await tx.moneyBox.update({ where: { id: moneyBoxId }, data: { currentBalance: { decrement: receipt.paidAmount } } });
      }
      return await tx.dailyExpense.update({
        where: { id: receipt.expenseId },
        data: {
          date: receipt.date,
          amount: receipt.paidAmount,
          description,
          ...(moneyBoxId ? { moneyBox: { connect: { id: moneyBoxId } } } : { moneyBox: { disconnect: true } }),
        },
      });
    }
  }

  const expense = await tx.dailyExpense.create({
    data: {
      date: receipt.date,
      category: 'OTHER',
      amount: receipt.paidAmount,
      description,
      ...(moneyBoxId ? { moneyBox: { connect: { id: moneyBoxId } } } : {}),
    },
  });

  if (moneyBoxId) {
    await tx.moneyBox.update({ where: { id: moneyBoxId }, data: { currentBalance: { decrement: receipt.paidAmount } } });
  }

  return expense;
}

interface ReceiptItemInput {
  itemName: string;
  quantity: number;
  pricePerPiece: number;
}

export const dailyPieceReceiptService = {
  async getAll(filters?: {
    pieceWorkerId?: number;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.dailyPieceReceipt.findMany({
      where: {
        ...(filters?.pieceWorkerId && { pieceWorkerId: filters.pieceWorkerId }),
        ...(filters?.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters?.startDate && filters?.endDate && {
          date: {
            gte: startOfDay(filters.startDate),
            lte: endOfDay(filters.endDate),
          },
        }),
      },
      include: {
        pieceWorker: true,
        expense: true,
        items: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  async getById(id: number) {
    return await prisma.dailyPieceReceipt.findUnique({
      where: { id },
      include: {
        pieceWorker: true,
        expense: true,
        items: true,
      },
    });
  },

  async create(data: {
    pieceWorkerId: number;
    date: Date;
    items: ReceiptItemInput[];
    paidAmount?: number;
    notes?: string;
    createExpense?: boolean;
    moneyBoxId?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const itemsWithTotal = data.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.pricePerPiece,
      }));

      const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);
      const paidAmount = data.paidAmount || 0;

      let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
      if (paidAmount >= totalAmount) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PART_PAID;
      }

      const pieceWorker = await tx.pieceWorker.findUnique({
        where: { id: data.pieceWorkerId },
      });

      const expense = await syncPieceWorkerExpense(
        tx,
        { id: 0, date: data.date, paidAmount, expenseId: null, pieceWorker },
        !!data.createExpense,
        data.moneyBoxId
      );

      return await tx.dailyPieceReceipt.create({
        data: {
          pieceWorkerId: data.pieceWorkerId,
          date: data.date,
          expenseId: expense?.id,
          totalAmount,
          paidAmount,
          paymentStatus,
          notes: data.notes,
          items: {
            create: itemsWithTotal,
          },
        },
        include: {
          pieceWorker: true,
          expense: true,
          items: true,
        },
      });
    });
  },

  async update(id: number, data: {
    date?: Date;
    items?: ReceiptItemInput[];
    paidAmount?: number;
    notes?: string;
    createExpense?: boolean;
    moneyBoxId?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyPieceReceipt.findUnique({
        where: { id },
        include: { items: true, pieceWorker: true },
      });

      if (!existing) {
        throw new Error('Receipt not found');
      }

      let totalAmount = existing.totalAmount;
      let itemsData = undefined;

      if (data.items) {
        const itemsWithTotal = data.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.pricePerPiece,
        }));
        totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);

        await tx.receiptItem.deleteMany({
          where: { receiptId: id },
        });

        itemsData = {
          create: itemsWithTotal,
        };
      }

      const paidAmount = data.paidAmount ?? existing.paidAmount;

      let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
      if (paidAmount >= totalAmount) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        paymentStatus = PaymentStatus.PART_PAID;
      }

      const createExpense = data.createExpense ?? !!existing.expenseId;
      const expense = await syncPieceWorkerExpense(
        tx,
        {
          id: existing.id,
          date: data.date ?? existing.date,
          paidAmount,
          expenseId: existing.expenseId,
          pieceWorker: existing.pieceWorker,
        },
        createExpense,
        data.moneyBoxId
      );

      return await tx.dailyPieceReceipt.update({
        where: { id },
        data: {
          date: data.date,
          totalAmount,
          paidAmount,
          paymentStatus,
          notes: data.notes,
          expenseId: expense?.id,
          ...(itemsData && { items: itemsData }),
        },
        include: {
          pieceWorker: true,
          expense: true,
          items: true,
        },
      });
    });
  },

  async addPayment(id: number, amount: number, createExpense: boolean = true, moneyBoxId?: number) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyPieceReceipt.findUnique({
        where: { id },
        include: { pieceWorker: true },
      });

      if (!existing) {
        throw new Error('Receipt not found');
      }

      const newPaidAmount = existing.paidAmount + amount;

      let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
      if (newPaidAmount >= existing.totalAmount) {
        paymentStatus = PaymentStatus.PAID;
      } else if (newPaidAmount > 0) {
        paymentStatus = PaymentStatus.PART_PAID;
      }

      const shouldCreateExpense = createExpense || !!existing.expenseId;
      const expense = await syncPieceWorkerExpense(
        tx,
        {
          id: existing.id,
          date: existing.date,
          paidAmount: newPaidAmount,
          expenseId: existing.expenseId,
          pieceWorker: existing.pieceWorker,
        },
        shouldCreateExpense,
        moneyBoxId
      );

      return await tx.dailyPieceReceipt.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus,
          expenseId: expense?.id,
        },
        include: {
          pieceWorker: true,
          expense: true,
          items: true,
        },
      });
    });
  },

  async delete(id: number) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.dailyPieceReceipt.findUnique({
        where: { id },
      });

      if (existing?.expenseId) {
        const expense = await tx.dailyExpense.findUnique({ where: { id: existing.expenseId } });
        if (expense?.moneyBoxId) {
          await tx.moneyBox.update({ where: { id: expense.moneyBoxId }, data: { currentBalance: { increment: expense.amount } } });
        }
        await tx.dailyExpense.delete({ where: { id: existing.expenseId } }).catch(() => {});
      }

      return await tx.dailyPieceReceipt.delete({
        where: { id },
      });
    });
  },

  async getSummary(pieceWorkerId?: number, startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (pieceWorkerId) {
      where.pieceWorkerId = pieceWorkerId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      };
    }

    const receipts = await prisma.dailyPieceReceipt.findMany({
      where,
      include: {
        pieceWorker: true,
        items: true,
      },
    });

    const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaid = receipts.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;

    return {
      totalReceipts: receipts.length,
      totalItems,
      totalAmount,
      totalPaid,
      totalRemaining,
    };
  },
};
