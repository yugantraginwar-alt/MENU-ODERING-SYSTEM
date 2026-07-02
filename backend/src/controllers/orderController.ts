import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
};

export const getActiveOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'],
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
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({ error: 'Server error retrieving active orders' });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Server error retrieving order details' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  const { tableId, items } = req.body;

  try {
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Table ID and order items are required' });
    }

    // 1. Fetch table and restaurant
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const restaurant = table.restaurant;

    // 2. Fetch menu items to calculate prices
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = dbMenuItems.find((m) => m.id === item.menuItemId);
      if (!dbItem) {
        return res.status(400).json({ error: `Menu item with ID ${item.menuItemId} not found` });
      }
      if (!dbItem.isAvailable) {
        return res.status(400).json({ error: `Menu item '${dbItem.name}' is currently unavailable` });
      }

      const price = dbItem.price;
      const quantity = parseInt(item.quantity) || 1;
      subtotal += price * quantity;

      orderItemsData.push({
        quantity,
        specialInstructions: item.specialInstructions || '',
        price,
        menuItemId: dbItem.id,
      });
    }

    // Compute total with tax and service charge
    const taxAmount = subtotal * (restaurant.taxRate / 100);
    const serviceAmount = subtotal * (restaurant.serviceCharge / 100);
    const totalAmount = subtotal + taxAmount + serviceAmount;

    // 3. Create order
    const order = await prisma.order.create({
      data: {
        status: 'PLACED',
        totalAmount,
        tableId: table.id,
        restaurantId: restaurant.id,
        items: {
          create: orderItemsData,
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

    // 4. Mark table as OCCUPIED
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' },
    });

    // 5. Broadcast to Socket.io
    const io = req.app.get('io');
    if (io) {
      // Emit to general room for staff and kitchen feeds
      io.emit('new_order', order);
      io.emit('order_status_changed', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error placing order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

  try {
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // If order is served or cancelled, reset table back to AVAILABLE
    if (status === 'SERVED' || status === 'CANCELLED') {
      // Check if there are other active orders for this table first
      const activeOrdersCount = await prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
          id: { not: id },
        },
      });

      if (activeOrdersCount === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Broadcast update via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Send to the table specific room
      io.to(`order_${id}`).emit('order_updated', updated);
      // Send to dashboards
      io.emit('order_status_changed', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error updating order status' });
  }
};
