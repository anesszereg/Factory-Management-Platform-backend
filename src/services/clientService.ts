import { PrismaClient, ClientStatus, ClientTransactionType, TransactionType, TransactionCategory } from '@prisma/client';

const prisma = new PrismaClient();

export const clientService = {
  async getAll(filters?: { status?: ClientStatus }) {
    return prisma.client.findMany({
      where: filters?.status ? { status: filters.status } : {},
      orderBy: { firstName: 'asc' },
      include: {
        _count: { select: { sales: true } }
      }
    });
  },

  async getById(id: number) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        sales: { orderBy: { orderDate: 'desc' }, take: 20, include: { items: true, payments: true } },
        transactions: { orderBy: { date: 'desc' }, take: 50 },
        salePayments: { orderBy: { date: 'desc' }, take: 20 }
      }
    });
  },

  async create(data: {
    firstName: string;
    lastName: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    notes?: string;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const openingCredit = data.openingCredit ?? 0;
      const openingDebt = data.openingDebt ?? 0;
      const outstandingBalance = openingDebt - openingCredit;
      const client = await tx.client.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company,
          phone: data.phone,
          email: data.email,
          address: data.address,
          creditLimit: data.creditLimit ?? 0,
          outstandingBalance,
          openingCredit,
          openingDebt,
          openingBalanceDate: data.openingBalanceDate ? new Date(data.openingBalanceDate) : undefined,
          notes: data.notes,
        }
      });
      if (openingCredit !== 0 || openingDebt !== 0) {
        await tx.clientTransaction.create({
          data: {
            clientId: client.id,
            date: data.openingBalanceDate ? new Date(data.openingBalanceDate) : new Date(),
            type: ClientTransactionType.OPENING_BALANCE,
            amount: Math.abs(outstandingBalance),
            balance: outstandingBalance,
            description: 'Opening balance',
          }
        });
      }
      return client;
    });
  },

  async update(id: number, data: {
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    creditLimit?: number;
    notes?: string;
    status?: ClientStatus;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
  }) {
    const updateData: any = { ...data };
    if (data.openingBalanceDate) {
      updateData.openingBalanceDate = new Date(data.openingBalanceDate);
    }
    if (data.openingCredit !== undefined || data.openingDebt !== undefined) {
      const current = await prisma.client.findUnique({ where: { id } });
      if (current) {
        updateData.outstandingBalance =
          (data.openingDebt ?? current.openingDebt) - (data.openingCredit ?? current.openingCredit);
      }
    }
    return prisma.client.update({ where: { id }, data: updateData });
  },

  async delete(id: number) {
    return prisma.client.delete({ where: { id } });
  },

  async getLedger(id: number) {
    return prisma.clientTransaction.findMany({
      where: { clientId: id },
      orderBy: { date: 'asc' }
    });
  },

  async recordPayment(data: {
    clientId: number;
    moneyBoxId: number;
    orderId?: number;
    date: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const txRecord = await tx.financialTransaction.create({
        data: {
          moneyBoxId: data.moneyBoxId,
          date: new Date(data.date),
          amount: data.amount,
          type: TransactionType.INCOME,
          category: TransactionCategory.CLIENT_PAYMENT,
          description: `Payment from client #${data.clientId}`,
          reference: data.reference,
          relatedId: data.clientId,
          relatedType: 'Client',
        }
      });
      await tx.moneyBox.update({
        where: { id: data.moneyBoxId },
        data: { currentBalance: { increment: data.amount } }
      });
      const client = await tx.client.findUnique({ where: { id: data.clientId } });
      const newBalance = (client?.outstandingBalance ?? 0) - data.amount;
      await tx.client.update({
        where: { id: data.clientId },
        data: { outstandingBalance: newBalance }
      });
      await tx.clientTransaction.create({
        data: {
          clientId: data.clientId,
          date: new Date(data.date),
          type: ClientTransactionType.PAYMENT,
          amount: data.amount,
          balance: newBalance,
          description: data.notes ?? `Payment received`,
          referenceId: txRecord.id,
          referenceType: 'FinancialTransaction',
        }
      });
      if (data.orderId) {
        const order = await tx.salesOrder.findUnique({ where: { id: data.orderId } });
        if (order) {
          const newPaid = order.paidAmount + data.amount;
          const status = newPaid >= order.total ? 'PAID' : 'PART_PAID';
          await tx.salesOrder.update({
            where: { id: data.orderId },
            data: { paidAmount: newPaid, paymentStatus: status as any }
          });
          await tx.salePayment.create({
            data: {
              orderId: data.orderId,
              clientId: data.clientId,
              moneyBoxId: data.moneyBoxId,
              transactionId: txRecord.id,
              date: new Date(data.date),
              amount: data.amount,
              paymentMethod: data.paymentMethod as any,
              reference: data.reference,
              notes: data.notes,
            }
          });
        }
      }
      return txRecord;
    });
  },

  async deletePayment(clientId: number, paymentId: number) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.salePayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new Error('Payment not found');
      if (payment.clientId !== clientId) throw new Error('Payment does not belong to this client');

      // Reverse money box balance
      await tx.moneyBox.update({
        where: { id: payment.moneyBoxId },
        data: { currentBalance: { decrement: payment.amount } }
      });

      // Reverse client outstanding balance
      await tx.client.update({
        where: { id: clientId },
        data: { outstandingBalance: { increment: payment.amount } }
      });

      // Reverse order paid amount if linked to an order
      if (payment.orderId) {
        const order = await tx.salesOrder.findUnique({ where: { id: payment.orderId } });
        if (order) {
          const newPaid = Math.max(0, order.paidAmount - payment.amount);
          const status = newPaid <= 0 ? 'NOT_PAID' : newPaid >= order.total ? 'PAID' : 'PART_PAID';
          await tx.salesOrder.update({
            where: { id: payment.orderId },
            data: { paidAmount: newPaid, paymentStatus: status as any }
          });
        }
      }

      // Delete associated financial transaction
      if (payment.transactionId) {
        await tx.financialTransaction.delete({ where: { id: payment.transactionId } }).catch(() => {});
      }

      // Delete related client transaction
      await tx.clientTransaction.deleteMany({
        where: { clientId, referenceId: payment.transactionId, referenceType: 'FinancialTransaction' }
      });

      // Delete the payment
      return tx.salePayment.delete({ where: { id: paymentId } });
    });
  },

  async updatePayment(clientId: number, paymentId: number, data: { amount?: number; date?: string; paymentMethod?: string; reference?: string; notes?: string }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.salePayment.findUnique({ where: { id: paymentId } });
      if (!payment) throw new Error('Payment not found');
      if (payment.clientId !== clientId) throw new Error('Payment does not belong to this client');

      const amountDiff = (data.amount ?? payment.amount) - payment.amount;

      if (amountDiff !== 0) {
        // Adjust money box
        await tx.moneyBox.update({
          where: { id: payment.moneyBoxId },
          data: { currentBalance: { increment: amountDiff } }
        });

        // Adjust client outstanding balance
        await tx.client.update({
          where: { id: clientId },
          data: { outstandingBalance: { decrement: amountDiff } }
        });

        // Adjust order paid amount
        if (payment.orderId) {
          const order = await tx.salesOrder.findUnique({ where: { id: payment.orderId } });
          if (order) {
            const newPaid = order.paidAmount + amountDiff;
            const status = newPaid <= 0 ? 'NOT_PAID' : newPaid >= order.total ? 'PAID' : 'PART_PAID';
            await tx.salesOrder.update({
              where: { id: payment.orderId },
              data: { paidAmount: newPaid, paymentStatus: status as any }
            });
          }
        }

        // Adjust financial transaction
        if (payment.transactionId) {
          await tx.financialTransaction.update({
            where: { id: payment.transactionId },
            data: { amount: data.amount ?? payment.amount }
          });
        }
      }

      return tx.salePayment.update({
        where: { id: paymentId },
        data: {
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.paymentMethod ? { paymentMethod: data.paymentMethod as any } : {}),
          ...(data.reference !== undefined ? { reference: data.reference } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
        include: { moneyBox: { select: { id: true, name: true } } }
      });
    });
  }
};
