import { PrismaClient, SupplierStatus, SupplierOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const supplierService = {
  async getAll(filters?: { status?: SupplierStatus }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    return prisma.supplier.findMany({
      where,
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: number) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
            payments: {
              include: {
                expense: true,
              },
            },
          },
          orderBy: { orderDate: 'desc' },
        },
      },
    });
  },

  async create(data: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
    status?: SupplierStatus;
  }) {
    return prisma.supplier.create({
      data,
    });
  },

  async update(id: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
    openingCredit?: number;
    openingDebt?: number;
    openingBalanceDate?: string;
    status?: SupplierStatus;
  }) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  },

  async delete(id: number) {
    return prisma.supplier.delete({
      where: { id },
    });
  },

  // Supplier Orders
  async getAllOrders(filters?: {
    supplierId?: number;
    status?: SupplierOrderStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.orderDate = {};
      if (filters.startDate) {
        where.orderDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.orderDate.lte = new Date(filters.endDate);
      }
    }
    return prisma.supplierOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        payments: true,
      },
      orderBy: { orderDate: 'desc' },
    });
  },

  async getOrderById(id: number) {
    return prisma.supplierOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        payments: {
          include: {
            expense: true,
          },
        },
      },
    });
  },

  async createOrder(data: {
    supplierId: number;
    orderDate: Date;
    notes?: string;
    items: {
      materialId?: number;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return prisma.supplierOrder.create({
      data: {
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        totalAmount,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            materialId: item.materialId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        payments: true,
      },
    });
  },

  async updateOrder(id: number, data: {
    orderDate?: Date;
    notes?: string;
    status?: SupplierOrderStatus;
  }) {
    return prisma.supplierOrder.update({
      where: { id },
      data,
      include: {
        supplier: true,
        items: {
          include: {
            material: true,
          },
        },
        payments: true,
      },
    });
  },

  async deleteOrder(id: number) {
    return prisma.supplierOrder.delete({
      where: { id },
    });
  },

  // Payments
  async addPayment(data: {
    orderId: number;
    date: Date;
    amount: number;
    paymentMethod?: string;
    notes?: string;
    createExpense?: boolean;
  }) {
    const order = await prisma.supplierOrder.findUnique({
      where: { id: data.orderId },
      include: { supplier: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    let expenseId: number | undefined;

    // Create expense record if requested
    if (data.createExpense) {
      const expense = await prisma.dailyExpense.create({
        data: {
          date: data.date,
          category: 'OTHER',
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          description: `Payment to supplier: ${order.supplier.name}`,
        },
      });
      expenseId = expense.id;
    }

    // Create payment
    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: order.supplierId,
        orderId: data.orderId,
        date: data.date,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        expenseId,
      },
      include: {
        expense: true,
      },
    });

    // Update order paid amount and status
    const newPaidAmount = order.paidAmount + data.amount;
    let newStatus: SupplierOrderStatus = order.status;

    if (newPaidAmount >= order.totalAmount) {
      newStatus = 'COMPLETED';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.supplierOrder.update({
      where: { id: data.orderId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return payment;
  },

  async deletePayment(id: number) {
    const payment = await prisma.supplierPayment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update order paid amount
    const newPaidAmount = (payment.order?.paidAmount ?? 0) - payment.amount;
    let newStatus: SupplierOrderStatus = payment.order?.status ?? 'PENDING';

    if (newPaidAmount <= 0) {
      newStatus = 'PENDING';
    } else if (newPaidAmount < (payment.order?.totalAmount ?? 0)) {
      newStatus = 'PARTIAL';
    }

    await prisma.supplierOrder.update({
      where: { id: payment.orderId ?? 0 },
      data: {
        paidAmount: Math.max(0, newPaidAmount),
        status: newStatus,
      },
    });

    // Delete associated expense if exists
    if (payment.expenseId) {
      await prisma.dailyExpense.delete({
        where: { id: payment.expenseId },
      });
    }

    return prisma.supplierPayment.delete({
      where: { id },
    });
  },

  // Get supplier summary
  async getSupplierSummary(supplierId: number) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        orders: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const totalOrders = supplier.orders.length;
    const totalAmount = supplier.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaid = supplier.orders.reduce((sum, o) => sum + o.paidAmount, 0);
    const totalRemaining = totalAmount - totalPaid;
    const pendingOrders = supplier.orders.filter(o => o.status === 'PENDING').length;
    const partialOrders = supplier.orders.filter(o => o.status === 'PARTIAL').length;
    const completedOrders = supplier.orders.filter(o => o.status === 'COMPLETED').length;

    return {
      supplier,
      totalOrders,
      totalAmount,
      totalPaid,
      totalRemaining,
      pendingOrders,
      partialOrders,
      completedOrders,
    };
  },
};
