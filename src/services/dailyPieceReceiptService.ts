import { PrismaClient, PaymentStatus } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

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
  }) {
    // Calculate total from items
    const itemsWithTotal = data.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.pricePerPiece,
    }));
    
    const totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);
    const paidAmount = data.paidAmount || 0;
    
    // Determine payment status
    let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
    if (paidAmount >= totalAmount) {
      paymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.PART_PAID;
    }
    
    return await prisma.dailyPieceReceipt.create({
      data: {
        pieceWorkerId: data.pieceWorkerId,
        date: data.date,
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
        items: true,
      },
    });
  },

  async update(id: number, data: {
    date?: Date;
    items?: ReceiptItemInput[];
    paidAmount?: number;
    notes?: string;
  }) {
    const existing = await prisma.dailyPieceReceipt.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new Error('Receipt not found');
    }

    let totalAmount = existing.totalAmount;
    let itemsData = undefined;

    // If items are provided, recalculate total and update items
    if (data.items) {
      const itemsWithTotal = data.items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.pricePerPiece,
      }));
      totalAmount = itemsWithTotal.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Delete existing items and create new ones
      await prisma.receiptItem.deleteMany({
        where: { receiptId: id },
      });
      
      itemsData = {
        create: itemsWithTotal,
      };
    }

    const paidAmount = data.paidAmount ?? existing.paidAmount;
    
    // Determine payment status
    let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
    if (paidAmount >= totalAmount) {
      paymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.PART_PAID;
    }

    return await prisma.dailyPieceReceipt.update({
      where: { id },
      data: {
        date: data.date,
        totalAmount,
        paidAmount,
        paymentStatus,
        notes: data.notes,
        ...(itemsData && { items: itemsData }),
      },
      include: {
        pieceWorker: true,
        items: true,
      },
    });
  },

  async addPayment(id: number, amount: number) {
    const existing = await prisma.dailyPieceReceipt.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Receipt not found');
    }

    const newPaidAmount = existing.paidAmount + amount;
    
    // Determine payment status
    let paymentStatus: PaymentStatus = PaymentStatus.NOT_PAID;
    if (newPaidAmount >= existing.totalAmount) {
      paymentStatus = PaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      paymentStatus = PaymentStatus.PART_PAID;
    }

    return await prisma.dailyPieceReceipt.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
      include: {
        pieceWorker: true,
        items: true,
      },
    });
  },

  async delete(id: number) {
    return await prisma.dailyPieceReceipt.delete({
      where: { id },
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
