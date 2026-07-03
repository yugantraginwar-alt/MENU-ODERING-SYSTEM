import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { OrderRepository } from '@/repositories/orderRepository';
import { OrderService } from '@/services/orderService';
import { TableRepository } from '@/repositories/tableRepository';
import { validateOrderCreate } from '@/validators';
import { logAudit } from '@/utils/auditLogger';
import { prisma } from '@/config/db';

export const enrichOrder = async (order: any) => {
  if (!order) return order;
  try {
    // 1. Fetch active orders in same branch that are PLACED, ACCEPTED, or PREPARING
    const activeOrders = await prisma.order.findMany({
      where: {
        branchId: order.branchId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING'] }
      },
      orderBy: { createdAt: 'asc' }
    });

    const index = activeOrders.findIndex(o => o.id === order.id);
    const queuePosition = index !== -1 ? index + 1 : 0;
    const queueLength = activeOrders.length;

    // 2. Chef Assigned
    let chefAssigned = 'Chef Marco 👨🍳';
    if (order.assignedKitchen?.name) {
      chefAssigned = `${order.assignedKitchen.name} 👨🍳`;
    } else {
      const CHEFS = ['Chef Marco', 'Chef Sophia', 'Chef Antonio', 'Chef Isabella', 'Chef Elena'];
      let sum = 0;
      for (let i = 0; i < order.id.length; i++) {
        sum += order.id.charCodeAt(i);
      }
      chefAssigned = `${CHEFS[sum % CHEFS.length]} 👨🍳`;
    }

    // 3. Progress percentage and remaining times
    let progressPercent = 15;
    let baseRemaining = 15;

    switch (order.status) {
      case 'PLACED':
        progressPercent = 15;
        baseRemaining = 15;
        break;
      case 'ACCEPTED':
        progressPercent = 35;
        baseRemaining = 12;
        break;
      case 'PREPARING':
        progressPercent = 68;
        baseRemaining = 8;
        break;
      case 'READY':
        progressPercent = 90;
        baseRemaining = 0;
        break;
      case 'SERVED':
      case 'PAID':
      case 'CLOSED':
        progressPercent = 100;
        baseRemaining = 0;
        break;
      case 'CANCELLED':
        progressPercent = 0;
        baseRemaining = 0;
        break;
    }

    const itemsCount = order.items?.reduce((acc: number, it: any) => acc + it.quantity, 0) || 0;

    // Remaining time matches status and adds queue buffer and item buffer
    let estimatedTimeRemaining = baseRemaining;
    if (order.status !== 'READY' && order.status !== 'SERVED' && order.status !== 'PAID' && order.status !== 'CLOSED' && order.status !== 'CANCELLED') {
      estimatedTimeRemaining += Math.max(0, queuePosition - 1) * 3 + Math.max(0, itemsCount - 2) * 1;
    }

    const estimatedPrepTime = Math.max(10, 10 + itemsCount * 2 + Math.max(0, queuePosition - 1) * 2);
    const estimatedServingTime = estimatedPrepTime + 3;

    return {
      ...order,
      queuePosition,
      queueLength,
      chefAssigned,
      estimatedPrepTime,
      estimatedServingTime,
      estimatedTimeRemaining,
      progressPercent
    };
  } catch (err) {
    console.error('Error enriching order:', err);
    return order;
  }
};

export const broadcastQueueUpdates = async (io: any, branchId: string) => {
  if (!io) return;
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        branchId,
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] }
      },
      include: {
        table: true,
        restaurant: true,
        branch: true,
        assignedKitchen: true,
        assignedWaiter: true,
        items: { include: { menuItem: true } }
      }
    });

    for (const order of activeOrders) {
      const enriched = await enrichOrder(order);
      io.to(`order_${order.id}`).emit('order_updated', enriched);
    }
  } catch (err) {
    console.error('Failed to broadcast queue updates:', err);
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    const filters: any = {};
    if (branchId) filters.branchId = String(branchId);

    const orders = await OrderRepository.findAll(filters);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
};

export const getActiveOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    const filters: any = {};
    if (branchId) filters.branchId = String(branchId);

    const orders = await OrderRepository.findActive(filters);
    res.json(orders);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: 'Server error retrieving active orders' });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await OrderRepository.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Server error retrieving order details' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    validateOrderCreate(req.body);
    const { tableId, sessionId, items } = req.body;

    const finalSessionId = sessionId || `sess-${Math.random().toString(36).slice(2, 11)}`;

    const order = await OrderService.createOrder({
      tableId,
      sessionId: finalSessionId,
      items,
    });

    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      const fullOrder = await OrderRepository.findById(order.id);
      const enriched = await enrichOrder(fullOrder || order);
      io.emit('new_order', enriched);
      io.to(`order_${order.id}`).emit('order_updated', enriched);

      // Broadcast queue updates to other tracking clients since a new order has joined the queue
      await broadcastQueueUpdates(io, order.branchId);

      // Fetch table and emit table update
      const table = await TableRepository.findById(tableId);
      if (table) io.emit('table_updated', table);
    }

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message || 'Server error placing order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const assignedKitchenId = req.user?.role === 'KITCHEN' ? req.user.id : undefined;
    const assignedWaiterId = req.user?.role === 'WAITER' ? req.user.id : undefined;

    const updated = await OrderService.updateStatus(id, status, assignedKitchenId, assignedWaiterId);

    const io = req.app.get('io');
    if (io) {
      const fullOrder = await OrderRepository.findById(id);
      const enriched = await enrichOrder(fullOrder || updated);
      io.to(`order_${id}`).emit('order_updated', enriched);
      io.emit('order_status_changed', enriched);

      // Broadcast queue position updates for other orders in the same branch
      await broadcastQueueUpdates(io, updated.branchId);

      // Emit table updates to staff board
      const table = await TableRepository.findById(updated.tableId);
      if (table) io.emit('table_updated', table);
    }

    // Log status transitions in audit log
    await logAudit({
      userId: req.user?.id,
      restaurantId: updated.restaurantId,
      branchId: updated.branchId,
      action: 'STAFF_ACTION',
      details: { message: `Updated Order status to ${status}`, orderId: id, orderNumber: updated.orderNumber },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(400).json({ error: error.message || 'Server error updating status' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    const updated = await OrderService.updatePaymentStatus(id, paymentStatus);

    const io = req.app.get('io');
    if (io) {
      const fullOrder = await OrderRepository.findById(id);
      const enriched = await enrichOrder(fullOrder || updated);
      io.to(`order_${id}`).emit('order_updated', enriched);
      io.emit('payment_completed', enriched);

      // Broadcast queue position updates as an order is paid and removed from the active kitchen queue
      await broadcastQueueUpdates(io, updated.branchId);
      
      const table = await TableRepository.findById(updated.tableId);
      if (table) io.emit('table_updated', table);
    }

    await logAudit({
      userId: req.user?.id,
      restaurantId: updated.restaurantId,
      branchId: updated.branchId,
      action: 'REFUND', // or PAYMENT_SETTLEMENT
      details: { message: `Settled payment status: ${paymentStatus}`, orderId: id, total: updated.totalAmount },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update payment error:', error);
    res.status(400).json({ error: error.message || 'Server error settling bill' });
  }
};

export const transferOrders = async (req: AuthRequest, res: Response) => {
  const { fromTableId, toTableId } = req.body;

  try {
    const result = await OrderService.transferOrders(fromTableId, toTableId);

    const io = req.app.get('io');
    if (io) {
      io.emit('orders_transferred', { fromTableId, toTableId });
      
      const source = await TableRepository.findById(fromTableId);
      const target = await TableRepository.findById(toTableId);
      if (source) io.emit('table_updated', source);
      if (target) io.emit('table_updated', target);
    }

    await logAudit({
      userId: req.user?.id,
      action: 'TABLE_TRANSFER',
      details: { message: 'Transferred orders', fromTableId, toTableId },
    });

    res.json(result);
  } catch (error: any) {
    console.error('Transfer orders error:', error);
    res.status(400).json({ error: error.message || 'Server error transferring orders' });
  }
};
