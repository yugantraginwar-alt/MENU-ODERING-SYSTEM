'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Grid,
  Filter,
  Check,
  AlertCircle,
  LogOut,
  Wifi,
  WifiOff,
  Flame,
  ChefHat,
  BellRing
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import Navbar from '../../components/Navbar';

interface OrderItem {
  id: string;
  quantity: number;
  specialInstructions?: string;
  price: number;
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string; // PLACED, ACCEPTED, PREPARING, READY, SERVED, CANCELLED
  totalAmount: number;
  createdAt: string;
  table: {
    id: string;
    number: string;
  };
  items: OrderItem[];
}

interface Table {
  id: string;
  number: string;
  status: string; // AVAILABLE, OCCUPIED
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function StaffDashboard() {
  const { socket, isConnected } = useSocket();
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [staffName, setStaffName] = useState('Staff');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL'); // ALL, PLACED, PREPARING, READY, SERVED
  
  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (savedToken && (role === 'STAFF' || role === 'ADMIN')) {
      setToken(savedToken);
      const name = localStorage.getItem('userName');
      if (name) setStaffName(name);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch orders and tables
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch all orders
        const ordersRes = await fetch(`${BACKEND_URL}/api/orders`, { headers });
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        }

        // Fetch tables
        const tablesRes = await fetch(`${BACKEND_URL}/api/tables`, { headers });
        const tablesData = await tablesRes.json();
        if (Array.isArray(tablesData)) {
          setTables(tablesData);
        }
      } catch (err) {
        console.error('Fetch dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Socket real-time events
    if (socket) {
      // Listen to new order arrivals
      socket.on('new_order', (newOrder: Order) => {
        setOrders((prev) => [newOrder, ...prev]);
        // Update table list state
        setTables((prev) =>
          prev.map((t) =>
            t.id === newOrder.table.id ? { ...t, status: 'OCCUPIED' } : t
          )
        );
      });

      // Listen to order status updates
      socket.on('order_status_changed', (updatedOrder: Order) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        // Refresh tables in background
        fetch(`${BACKEND_URL}/api/tables`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => res.json())
          .then((data) => { if (Array.isArray(data)) setTables(data); });
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_status_changed');
      }
    };
  }, [token, socket]);

  // Authenticate user
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      if (data.user.role !== 'STAFF' && data.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Staff access level required');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userName', data.user.name);
      
      setToken(data.token);
      setStaffName(data.user.name);
    } catch (err: any) {
      setAuthError(err.message || 'Server connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    setToken(null);
  };

  // Modify order status
  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      
      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating order state');
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return o.status !== 'CANCELLED';
    return o.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ACCEPTED': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'PREPARING': return 'bg-brand-orange/10 text-brand-orange border-brand-orange/20';
      case 'READY': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'SERVED': return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
      default: return 'bg-neutral-500/10 text-fg-muted';
    }
  };

  // Quick fill logins for review ease
  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword(roleEmail.startsWith('admin') ? 'admin123' : 'staff123');
  };

  // Auth Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md w-full mx-auto px-6 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">Staff Login</h2>
              <p className="text-xs text-fg-muted font-light">Access Waiter dashboard controls.</p>
            </div>

            {authError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-fg-primary/80">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@ardoise.com"
                  className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-fg-primary/80">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-orange/10 transition-all hover:scale-[1.02]"
              >
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Quick login prompts */}
            <div className="border-t border-glass-border/20 pt-5 space-y-3">
              <span className="text-xxs uppercase tracking-wider text-fg-muted font-bold block">Developer Quick Fill Credentials</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickLogin('staff@ardoise.com')}
                  className="flex-1 text-xxs py-2 px-3 border border-glass-border hover:border-brand-orange bg-glass-fill hover:bg-glass-fill/10 text-fg-primary font-medium rounded-lg transition-all"
                >
                  Waiter Staff
                </button>
                <button
                  onClick={() => handleQuickLogin('admin@ardoise.com')}
                  className="flex-1 text-xxs py-2 px-3 border border-glass-border hover:border-brand-orange bg-glass-fill hover:bg-glass-fill/10 text-fg-primary font-medium rounded-lg transition-all"
                >
                  Admin Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20">
      <Navbar />

      {/* Control Subbar */}
      <div className="w-full bg-glass-fill border-b border-glass-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold flex items-center space-x-1.5">
              <Users className="w-4 h-4" />
              <span>{staffName}</span>
            </div>

            {/* Realtime WebSocket Connection State */}
            {isConnected ? (
              <span className="text-xxs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Wifi className="w-3 h-3" /> Live Sync Active
              </span>
            ) : (
              <span className="text-xxs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <WifiOff className="w-3 h-3 animate-pulse" /> Reconnecting Sockets...
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-xs text-fg-muted hover:text-red-500 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/5 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Sidebar details */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Filters card */}
          <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card space-y-4">
            <h3 className="font-display font-extrabold text-sm border-b border-glass-border/10 pb-2.5 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-orange" /> Ticket Filter
            </h3>
            <div className="flex flex-col gap-1.5">
              {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all ${
                    activeFilter === filter
                      ? 'bg-brand-orange border-brand-orange text-white shadow shadow-brand-orange/15 scale-[1.01]'
                      : 'bg-transparent text-fg-muted border-transparent hover:bg-glass-fill hover:text-fg-primary'
                  }`}
                >
                  {filter === 'ALL' ? 'All Active Orders' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Tables state layout */}
          <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card space-y-4">
            <h3 className="font-display font-extrabold text-sm border-b border-glass-border/10 pb-2.5 flex items-center gap-2">
              <Grid className="w-4 h-4 text-brand-orange" /> Table Grid Map
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    t.status === 'OCCUPIED'
                      ? 'bg-brand-orange/15 border-brand-orange text-brand-orange font-bold glow-orange'
                      : 'bg-glass-fill border-glass-border text-fg-muted text-xs'
                  }`}
                >
                  <span className="text-xxs uppercase tracking-wider block opacity-70">Table</span>
                  <span className="font-display font-bold text-sm">{t.number.replace('Table ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Realtime Order list */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-xl">Waiter Order Feed</h2>
            <span className="text-xs text-fg-muted font-light">{filteredOrders.length} ticket(s) found</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-glass-border/30 rounded-2xl animate-pulse" />
              <div className="h-48 bg-glass-border/30 rounded-2xl animate-pulse" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-glass-fill border border-glass-border/20 rounded-3xl space-y-3">
              <Check className="w-8 h-8 text-green-500 mx-auto" />
              <h3 className="font-bold">No active tickets</h3>
              <p className="text-xs text-fg-muted font-light">All orders have been successfully cleared and served!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card flex flex-col justify-between hover:border-brand-orange/20 relative group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-glass-border/10 pb-3 mb-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-display font-black text-sm text-brand-orange">{ord.table.number}</span>
                        <span className="text-xxs text-fg-muted font-light">#{ord.id.slice(-6)}</span>
                      </div>
                      <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(ord.status)}`}>
                        {ord.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 pl-1 mb-4">
                      {ord.items.map((it) => (
                        <div key={it.id} className="text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-fg-primary">
                              {it.menuItem.name} <span className="text-brand-orange font-bold">&times; {it.quantity}</span>
                            </span>
                          </div>
                          {it.specialInstructions && (
                            <p className="text-xxs text-brand-orange italic font-light mt-0.5">
                              Note: "{it.specialInstructions}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="border-t border-glass-border/10 pt-4 mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center text-xxs text-fg-muted font-light">
                      <Clock className="w-3.5 h-3.5 text-brand-orange mr-1" />
                      <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex gap-2">
                      {ord.status === 'PLACED' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                          className="px-3.5 py-2 bg-brand-orange text-white font-bold rounded-xl text-xxs shadow hover:bg-brand-orange-hover hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Order
                        </button>
                      )}

                      {ord.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                          className="px-3.5 py-2 bg-brand-orange text-white font-bold rounded-xl text-xxs shadow hover:bg-brand-orange-hover hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <ChefHat className="w-3.5 h-3.5" /> Start Cooking
                        </button>
                      )}

                      {ord.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'READY')}
                          className="px-3.5 py-2 bg-green-600 text-white font-bold rounded-xl text-xxs shadow hover:bg-green-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <BellRing className="w-3.5 h-3.5" /> Mark Ready
                        </button>
                      )}

                      {ord.status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                          className="px-3.5 py-2 bg-green-600 text-white font-bold rounded-xl text-xxs shadow hover:bg-green-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Flame className="w-3.5 h-3.5" /> Mark Served
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
