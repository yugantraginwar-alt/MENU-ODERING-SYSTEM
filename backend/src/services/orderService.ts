import { OrderRepository } from '@/repositories/orderRepository';
import { TableRepository } from '@/repositories/tableRepository';
import { prisma } from '@/config/db';

export class OrderService {
  static async createOrder(data: {
    tableId: string;
    sessionId: string;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
  }) {
    // 1. Fetch table details
    const table = await TableRepository.findById(data.tableId);
    if (!table) throw new Error('Table not found');

    // 2. Fetch menu items
    const menuItemIds = data.items.map(it => it.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const orderItemsPayload = [];
    let subtotal = 0;

    for (const item of data.items) {
      const dbItem = dbMenuItems.find(m => m.id === item.menuItemId);
      if (!dbItem) throw new Error(`Menu item not found: ${item.menuItemId}`);
      if (!dbItem.isAvailable || dbItem.status !== 'AVAILABLE') {
        throw new Error(`Menu item '${dbItem.name}' is currently out of stock`);
      }

      const price = dbItem.price;
      const quantity = Math.max(1, item.quantity);
      subtotal += price * quantity;

      orderItemsPayload.push({
        menuItemId: dbItem.id,
        quantity,
        specialInstructions: item.specialInstructions ?? '',
        price,
      });
    }

    // 3. Compute tax, service charges and total
    const rest = table.restaurant;
    const taxAmount = subtotal * (rest.taxRate / 100);
    const serviceAmount = subtotal * (rest.serviceCharge / 100);
    const totalAmount = subtotal + taxAmount + serviceAmount;

    // 4. Generate human readable order number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${datePrefix}-${randomSuffix}`;

    // 5. Commit order and set table status
    const order = await OrderRepository.create({
      orderNumber,
      totalAmount,
      sessionId: data.sessionId,
      tableId: table.id,
      restaurantId: table.restaurantId,
      branchId: table.branchId,
      items: orderItemsPayload,
    });

    await TableRepository.updateStatus(table.id, 'OCCUPIED');

    return order;
  }

  static async updateStatus(id: string, status: string, assignedKitchenId?: string, assignedWaiterId?: string) {
    const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CLOSED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const order = await OrderRepository.findById(id);
    if (!order) throw new Error('Order not found');

    const updatedOrder = await OrderRepository.updateStatus(id, status, assignedKitchenId, assignedWaiterId);

    // If order is served, paid, closed, or cancelled, check table status
    if (['SERVED', 'PAID', 'CLOSED', 'CANCELLED'].includes(status)) {
      const activeCount = await OrderRepository.countActiveByTable(order.tableId);
      if (activeCount === 0) {
        // Mark table AVAILABLE when no active orders remain
        await TableRepository.updateStatus(order.tableId, 'AVAILABLE');
      }
    }

    return updatedOrder;
  }

  static async updatePaymentStatus(id: string, paymentStatus: string) {
    const validPaymentStatuses = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status: ${paymentStatus}`);
    }

    const order = await OrderRepository.findById(id);
    if (!order) throw new Error('Order not found');

    const orderStatus = paymentStatus === 'PAID' ? 'PAID' : undefined;
    const updatedOrder = await OrderRepository.updatePaymentStatus(id, paymentStatus, orderStatus);

    if (paymentStatus === 'PAID') {
      const activeCount = await OrderRepository.countActiveByTable(order.tableId);
      if (activeCount === 0) {
        await TableRepository.updateStatus(order.tableId, 'AVAILABLE');
      }
    }

    return updatedOrder;
  }

  static async transferOrders(fromTableId: string, toTableId: string) {
    const sourceTable = await TableRepository.findById(fromTableId);
    const targetTable = await TableRepository.findById(toTableId);

    if (!sourceTable || !targetTable) {
      throw new Error('Source or target table not found');
    }

    await OrderRepository.transferTableOrders(fromTableId, toTableId);

    // Mark target occupied and check source table
    await TableRepository.updateStatus(toTableId, 'OCCUPIED');
    const sourceActiveCount = await OrderRepository.countActiveByTable(fromTableId);
    if (sourceActiveCount === 0) {
      await TableRepository.updateStatus(fromTableId, 'AVAILABLE');
    }

    return { message: 'Orders transferred successfully' };
  }
}
