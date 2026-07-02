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
} from '@/controllers/tableController';
import {
  getOrders,
  getActiveOrders,
  getOrderDetails,
  createOrder,
  updateOrderStatus,
} from '@/controllers/orderController';
import { getAnalytics } from '@/controllers/analyticsController';

// Import middlewares
import { authenticateJWT, requireRole } from '@/middleware/auth';

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
app.set('io', io); // Make socket io accessible in controllers

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
app.post('/api/categories', authenticateJWT, requireRole(['ADMIN']), createCategory);
app.put('/api/categories/:id', authenticateJWT, requireRole(['ADMIN']), updateCategory);
app.delete('/api/categories/:id', authenticateJWT, requireRole(['ADMIN']), deleteCategory);

// Menu Items
app.get('/api/menu-items', getMenuItems);
app.post('/api/menu-items', authenticateJWT, requireRole(['ADMIN']), createMenuItem);
app.put('/api/menu-items/:id', authenticateJWT, requireRole(['ADMIN']), updateMenuItem);
app.delete('/api/menu-items/:id', authenticateJWT, requireRole(['ADMIN']), deleteMenuItem);

// Tables
app.get('/api/tables', getTables);
app.get('/api/tables/:id', getTableDetails);
app.post('/api/tables', authenticateJWT, requireRole(['ADMIN']), createTable);
app.delete('/api/tables/:id', authenticateJWT, requireRole(['ADMIN']), deleteTable);

// Orders
app.get('/api/orders', authenticateJWT, requireRole(['ADMIN', 'STAFF', 'KITCHEN']), getOrders);
app.get('/api/orders/active', authenticateJWT, requireRole(['ADMIN', 'STAFF', 'KITCHEN']), getActiveOrders);
app.get('/api/orders/:id', getOrderDetails);
app.post('/api/orders', createOrder);
app.put('/api/orders/:id/status', authenticateJWT, requireRole(['ADMIN', 'STAFF', 'KITCHEN']), updateOrderStatus);

// Analytics
app.get('/api/analytics', authenticateJWT, requireRole(['ADMIN']), getAnalytics);

// --- Socket.io Coordination ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Customer joins a room specifically for their order tracking
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined tracking room: order_${orderId}`);
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
