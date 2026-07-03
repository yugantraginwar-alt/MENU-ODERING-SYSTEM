import { prisma } from '@/config/db';

export class OrderRepository {
  static async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        restaurant: true,
        branch: true,
        assignedKitchen: true,
        assignedWaiter: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  static async findAll(filters: { restaurantId?: string; branchId?: string } = {}) {
    const whereClause: any = {};
    if (filters.restaurantId) whereClause.restaurantId = filters.restaurantId;
    if (filters.branchId) whereClause.branchId = filters.branchId;

    return prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        restaurant: true,
        branch: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findActive(filters: { restaurantId?: string; branchId?: string } = {}) {
    const whereClause: any = {
      status: {
        in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'],
      },
    };
    if (filters.restaurantId) whereClause.restaurantId = filters.restaurantId;
    if (filters.branchId) whereClause.branchId = filters.branchId;

    return prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        restaurant: true,
        branch: true,
        assignedKitchen: true,
        assignedWaiter: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: {
    orderNumber: string;
    totalAmount: number;
    sessionId: string;
    tableId: string;
    restaurantId: string;
    branchId: string;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string; price: number }>;
  }) {
    return prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        sessionId: data.sessionId,
        tableId: data.tableId,
        restaurantId: data.restaurantId,
        branchId: data.branchId,
        items: {
          create: data.items.map(it => ({
            quantity: it.quantity,
            specialInstructions: it.specialInstructions ?? '',
            price: it.price,
            menuItemId: it.menuItemId,
          })),
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  static async updateStatus(id: string, status: string, assignedKitchenId?: string, assignedWaiterId?: string) {
    const data: any = { status };
    if (assignedKitchenId !== undefined) data.assignedKitchenId = assignedKitchenId;
    if (assignedWaiterId !== undefined) data.assignedWaiterId = assignedWaiterId;

    return prisma.order.update({
      where: { id },
      data,
      include: {
        table: true,
        assignedKitchen: true,
        assignedWaiter: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  static async updatePaymentStatus(id: string, paymentStatus: string, status?: string) {
    const updateData: any = { paymentStatus };
    if (status) updateData.status = status;
    return prisma.order.update({
      where: { id },
      data: updateData,
      include: { table: true },
    });
  }

  static async transferTableOrders(fromTableId: string, toTableId: string) {
    return prisma.order.updateMany({
      where: {
        tableId: fromTableId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      data: {
        tableId: toTableId,
      },
    });
  }

  static async countActiveByTable(tableId: string) {
    return prisma.order.count({
      where: {
        tableId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
    });
  }

  static async findActiveByTable(tableId: string) {
    return prisma.order.findMany({
      where: {
        tableId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }
}
