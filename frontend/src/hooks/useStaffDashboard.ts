'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/store/SocketContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function useStaffDashboard(allowedRole: string) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [token, setToken] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('Staff');
  const [staffRole, setStaffRole] = useState('');
  const [branchId, setBranchId] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [waiterAlert, setWaiterAlert] = useState<string | null>(null);
  const [customerRequests, setCustomerRequests] = useState<any[]>([]);

  // Auth and Token validation
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');
    const savedBranch = localStorage.getItem('branchId');

    if (!savedToken || !role) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('branchId');
      router.push('/staff/login');
      return;
    }

    const upperRole = role.toUpperCase();
    if (upperRole !== allowedRole.toUpperCase()) {
      // Unauthorized role for this dashboard
      router.push('/staff/login');
      return;
    }

    setToken(savedToken);
    setStaffRole(upperRole);
    if (name) setStaffName(name);
    if (savedBranch) setBranchId(savedBranch);
  }, [router, allowedRole]);

  // Fetch core data
  const refreshData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const ordersRes = await fetch(`${BACKEND_URL}/api/orders`, { headers });
      if (ordersRes.ok) setOrders(await ordersRes.json());

      const tablesRes = await fetch(`${BACKEND_URL}/api/tables`, { headers });
      if (tablesRes.ok) setTables(await tablesRes.json());

      const catRes = await fetch(`${BACKEND_URL}/api/categories`, { headers });
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [token]);

  // Socket sync
  useEffect(() => {
    if (!socket || !token) return;

    socket.on('new_order', (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
      setTables((prev) =>
        prev.map((t) => (t.id === newOrder.table.id ? { ...t, status: 'OCCUPIED' } : t))
      );
    });

    socket.on('order_updated', (updated: any) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    });

    socket.on('order_status_changed', (updated: any) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      refreshData();
    });

    socket.on('table_updated', (updatedTable: any) => {
      setTables((prev) => prev.map((t) => (t.id === updatedTable.id ? updatedTable : t)));
    });

    socket.on('customer_request', (req: { tableId: string; tableNumber: string; type: string; timestamp: string }) => {
      try {
        const audio = new Audio('/chime.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}

      setCustomerRequests((prev) => [
        {
          id: `${req.tableId}-${Date.now()}`,
          tableNumber: req.tableNumber,
          type: req.type,
          timestamp: req.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);

      setTables((prev) =>
        prev.map((t) => (t.id === req.tableId ? { ...t, status: 'NEEDS_ASSISTANCE' } : t))
      );
    });

    socket.on('kitchen_ready', (data: { tableNumber: string; orderNumber: string }) => {
      try {
        const audio = new Audio('/chime.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      setWaiterAlert(`🔊 KITCHEN NOTIFY: Food for ${data.tableNumber} (Order #${data.orderNumber}) is ready at the pass!`);
      setTimeout(() => setWaiterAlert(null), 10000);
    });

    return () => {
      socket.off('new_order');
      socket.off('order_updated');
      socket.off('order_status_changed');
      socket.off('table_updated');
      socket.off('customer_request');
      socket.off('kitchen_ready');
    };
  }, [socket, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('branchId');
    router.push('/staff/login');
  };

  return {
    token,
    staffName,
    staffRole,
    branchId,
    orders,
    setOrders,
    tables,
    setTables,
    categories,
    customerRequests,
    setCustomerRequests,
    waiterAlert,
    setWaiterAlert,
    loading,
    refreshData,
    handleLogout,
    isConnected,
    socket
  };
}
