import { PrismaClient, MoneyBoxStatus, TransactionType, TransactionCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const moneyBoxService = {
  async getAll() {
    return prisma.moneyBox.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { transactions: true } }
      }
    });
  },

  async getById(id: number) {
    return prisma.moneyBox.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 50 }
      }
    });
  },

  async create(data: {
    name: string;
    description?: string;
    currentBalance?: number;
    responsibleUser?: string;
  }) {
    const box = await prisma.moneyBox.create({ data });
    if (data.currentBalance && data.currentBalance !== 0) {
      await prisma.financialTransaction.create({
        data: {
          moneyBoxId: box.id,
          date: new Date(),
          amount: Math.abs(data.currentBalance),
          type: data.currentBalance > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
          category: TransactionCategory.OPENING_BALANCE,
          description: 'Opening balance',
        }
      });
    }
    return box;
  },

  async update(id: number, data: {
    name?: string;
    description?: string;
    status?: MoneyBoxStatus;
    responsibleUser?: string;
  }) {
    return prisma.moneyBox.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.moneyBox.delete({ where: { id } });
  },

  async adjustBalance(id: number, amount: number) {
    return prisma.moneyBox.update({
      where: { id },
      data: { currentBalance: { increment: amount } }
    });
  },

  async transfer(fromId: number, toId: number, amount: number, description?: string) {
    return prisma.$transaction(async (tx) => {
      const txRecord = await tx.financialTransaction.create({
        data: {
          moneyBoxId: fromId,
          date: new Date(),
          amount,
          type: TransactionType.TRANSFER,
          category: TransactionCategory.INTERNAL_TRANSFER,
          description: description ?? 'Transfer',
        }
      });
      await tx.moneyBoxTransfer.create({
        data: {
          fromMoneyBoxId: fromId,
          toMoneyBoxId: toId,
          transactionId: txRecord.id,
          amount,
          date: new Date(),
          description,
        }
      });
      await tx.moneyBox.update({ where: { id: fromId }, data: { currentBalance: { decrement: amount } } });
      await tx.moneyBox.update({ where: { id: toId }, data: { currentBalance: { increment: amount } } });
      return txRecord;
    });
  }
};
