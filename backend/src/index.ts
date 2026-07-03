import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import controllers
import { login, getProfile } from '@/controllers/authController';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '@/controllers/menuController';
import {
  getTables,
  getTableDetails,
  createTable,
  deleteTable,
  validateQR,
  updateTableStatus,
  updateTableGuests,
} from '@/controllers/tableController';
import {
  getOrders,
  getActiveOrders,
  getOrderDetails,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  transferOrders,
} from '@/controllers/orderController';
import { getAnalytics } from '@/controllers/analyticsController';

// Import middlewares
import { authenticateJWT, requireRole } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Setup Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);
app.set('io', io);

// --- Routes Definition ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Authentication
app.post('/api/auth/login', login);
app.get('/api/auth/profile', authenticateJWT, getProfile);

// Categories
app.get('/api/categories', getCategories);
app.post('/api/categories', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), createCategory);
app.put('/api/categories/:id', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), updateCategory);
app.delete('/api/categories/:id', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), deleteCategory);

// Menu Items
app.get('/api/menu-items', getMenuItems);
app.post('/api/menu-items', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), createMenuItem);
app.put('/api/menu-items/:id', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), updateMenuItem);
app.delete('/api/menu-items/:id', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), deleteMenuItem);

// Tables
app.get('/api/tables/validate-qr', validateQR);
app.get('/api/tables', getTables);
app.get('/api/tables/:id', getTableDetails);
app.post('/api/tables', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), createTable);
app.delete('/api/tables/:id', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), deleteTable);
app.put('/api/tables/:id/status', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER']), updateTableStatus);
app.put('/api/tables/:id/guests', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER']), updateTableGuests);

// Orders
app.get('/api/orders', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']), getOrders);
app.get('/api/orders/active', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']), getActiveOrders);
app.get('/api/orders/:id', getOrderDetails);
app.post('/api/orders', createOrder);
app.post('/api/orders/transfer', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER']), transferOrders);
app.put('/api/orders/:id/status', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN']), updateOrderStatus);
app.put('/api/orders/:id/payment', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER', 'CASHIER']), updatePaymentStatus);

// Analytics
app.get('/api/analytics', authenticateJWT, requireRole(['ADMIN', 'OWNER', 'MANAGER']), getAnalytics);

// Global Error Handler
app.use(errorHandler);

// --- Socket.io Coordination ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Customer joins a room specifically for their order tracking
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined tracking room: order_${orderId}`);
  });

  // Forward customer requests to staff terminal room/clients
  socket.on('customer_request', (data) => {
    console.log(`Forwarding customer_request for table ${data.tableNumber}: ${data.type}`);
    io.emit('customer_request', data);
  });

  // Forward kitchen ready status notifications to waiter terminals
  socket.on('kitchen_ready', (data) => {
    console.log(`Forwarding kitchen_ready for table ${data.tableNumber}`);
    io.emit('kitchen_ready', data);
  });

  // Client requests manual disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
