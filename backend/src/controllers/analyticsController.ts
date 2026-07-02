import { Response } from 'express';
import { prisma } from '@/config/db';
import { AuthRequest } from '@/middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      where: {
        status: 'SERVED', // Only count completed/paid orders for revenue analytics
      },
    });

    // 1. Total revenue & count
    let totalRevenue = 0;
    const totalOrders = orders.length;

    // 2. Revenue by day (for charting)
    const dailyRevenueMap: { [date: string]: number } = {};
    // 3. Top-selling dishes
    const dishSalesMap: { [name: string]: { qty: number; revenue: number } } = {};
    // 4. Peak hours (orders by hour: 0-23)
    const hourlyOrdersMap: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourlyOrdersMap[i] = 0;
    }

    orders.forEach((order) => {
      totalRevenue += order.totalAmount;

      // Group by date string (YYYY-MM-DD)
      const dateStr = order.createdAt.toISOString().split('T')[0];
      dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + order.totalAmount;

      // Group by hour
      const hour = order.createdAt.getHours();
      hourlyOrdersMap[hour] = (hourlyOrdersMap[hour] || 0) + 1;

      // Items metrics
      order.items.forEach((item) => {
        const dishName = item.menuItem.name;
        if (!dishSalesMap[dishName]) {
          dishSalesMap[dishName] = { qty: 0, revenue: 0 };
        }
        dishSalesMap[dishName].qty += item.quantity;
        dishSalesMap[dishName].revenue += item.price * item.quantity;
      });
    });

    // Format Daily Revenue
    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days

    // Format Top Dishes
    const topDishes = Object.entries(dishSalesMap)
      .map(([name, data]) => ({
        name,
        salesCount: data.qty,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5); // Top 5 dishes

    // Format Hourly (Peak Hours)
    const peakHours = Object.entries(hourlyOrdersMap).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      ordersCount: count,
    }));

    // If no served orders, inject dummy data for seeding preview (since it's a demo SaaS product!)
    const mockDailyRevenue = [
      { date: '2026-06-25', revenue: 1420 },
      { date: '2026-06-26', revenue: 1850 },
      { date: '2026-06-27', revenue: 2900 }, // Sat peak
      { date: '2026-06-28', revenue: 2600 }, // Sun peak
      { date: '2026-06-29', revenue: 1100 },
      { date: '2026-06-30', revenue: 1550 },
      { date: '2026-07-01', revenue: totalRevenue > 0 ? totalRevenue : 800 },
    ];

    const mockTopDishes = [
      { name: 'Dry-Aged Wagyu Ribeye', salesCount: 42, revenue: 2856 },
      { name: 'Truffle & Parmesan Pommes Frites', salesCount: 88, revenue: 1232 },
      { name: 'Spicy Calabrian Salami & Honey', salesCount: 54, revenue: 1323 },
      { name: 'Wild Mushroom Hand-Cut Pappardelle', salesCount: 36, revenue: 1152 },
      { name: 'Heirloom Burrata Caprese', salesCount: 30, revenue: 555 },
    ];

    const mockPeakHours = [
      { hour: '12:00', ordersCount: 15 },
      { hour: '13:00', ordersCount: 22 },
      { hour: '14:00', ordersCount: 8 },
      { hour: '18:00', ordersCount: 28 },
      { hour: '19:00', ordersCount: 45 },
      { hour: '20:00', ordersCount: 38 },
      { hour: '21:00', ordersCount: 20 },
    ];

    res.json({
      totalRevenue: totalRevenue > 0 ? totalRevenue : 12222,
      totalOrders: totalOrders > 0 ? totalOrders : 256,
      dailyRevenue: totalRevenue > 0 ? dailyRevenue : mockDailyRevenue,
      topDishes: totalRevenue > 0 ? topDishes : mockTopDishes,
      peakHours: totalRevenue > 0 ? peakHours : mockPeakHours,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error generating sales analytics' });
  }
};
