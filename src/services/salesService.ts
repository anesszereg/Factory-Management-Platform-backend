import { PrismaClient, SalesOrderStatus, TransactionType, TransactionCategory, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const salesService = {
  async getAll(filters?: { clientId?: number; status?: SalesOrderStatus }) {
    const where: any = {};
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;
    return prisma.salesOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, company: true } },
        items: { include: { product: { include: { model: { select: { id: true, name: true } } } } } },
        payments: true,
      }
    });
  },

  async getById(id: number) {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: { include: { model: true, warehouse: true } } } },
        payments: { include: { moneyBox: { select: { id: true, name: true } } } },
      }
    });
  },

  async create(data: {
    clientId: number;
    salesperson?: string;
    orderDate: string;
    discount?: number;
    tax?: number;
    notes?: string;
    items: { productId: number; quantity: number; unitPrice: number; discount?: number }[];
  }) {
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discount ?? 0) / 100), 0);
    const discount = data.discount ?? 0;
    const tax = data.tax ?? 0;
    const total = subtotal - discount + tax;

    return prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const product = await tx.finishedProductInventory.findUnique({ where: { id: item.productId } });
        if (!product || product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product #${item.productId}`);
        }
      }
      const order = await tx.salesOrder.create({
        data: {
          clientId: data.clientId,
          salesperson: data.salesperson,
          orderDate: new Date(data.orderDate),
          subtotal,
          discount,
          tax,
          total,
          status: SalesOrderStatus.DRAFT,
          items: {
            create: data.items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount ?? 0,
              total: i.quantity * i.unitPrice * (1 - (i.discount ?? 0) / 100),
            }))
          }
        },
        include: { items: true }
      });
      return order;
    });
  },

  async confirm(id: number) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('Order not found');
      for (const item of order.items) {
        await tx.finishedProductInventory.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE_OUT',
            quantity: item.quantity,
            date: order.orderDate,
            referenceId: order.id,
            referenceType: 'SalesOrder',
          }
        });
      }
      await tx.client.update({
        where: { id: order.clientId },
        data: { outstandingBalance: { increment: order.total } }
      });
      return tx.salesOrder.update({
        where: { id },
        data: { status: SalesOrderStatus.CONFIRMED }
      });
    });
  },

  async update(id: number, data: { status?: SalesOrderStatus; notes?: string; salesperson?: string }) {
    return prisma.salesOrder.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.salesOrder.delete({ where: { id } });
  },

  async recordPayment(data: {
    orderId: number;
    moneyBoxId: number;
    date: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({ where: { id: data.orderId } });
      if (!order) throw new Error('Order not found');

      const txRecord = await tx.financialTransaction.create({
        data: {
          moneyBoxId: data.moneyBoxId,
          date: new Date(data.date),
          amount: data.amount,
          type: TransactionType.INCOME,
          category: TransactionCategory.CLIENT_PAYMENT,
          description: `Payment for sale #${data.orderId}`,
          reference: data.reference,
          relatedId: data.orderId,
          relatedType: 'SalesOrder',
        }
      });

      await tx.moneyBox.update({
        where: { id: data.moneyBoxId },
        data: { currentBalance: { increment: data.amount } }
      });

      const newPaid = order.paidAmount + data.amount;
      const payStatus: PaymentStatus = newPaid >= order.total ? PaymentStatus.PAID : PaymentStatus.PART_PAID;

      await tx.salesOrder.update({
        where: { id: data.orderId },
        data: { paidAmount: newPaid, paymentStatus: payStatus }
      });

      await tx.client.update({
        where: { id: order.clientId },
        data: { outstandingBalance: { decrement: data.amount } }
      });

      return tx.salePayment.create({
        data: {
          orderId: data.orderId,
          clientId: order.clientId,
          moneyBoxId: data.moneyBoxId,
          transactionId: txRecord.id,
          date: new Date(data.date),
          amount: data.amount,
          paymentMethod: data.paymentMethod as any,
          reference: data.reference,
          notes: data.notes,
        }
      });
    });
  }
};
