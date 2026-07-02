'use client';

import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
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
  Volume2,
  VolumeX,
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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function KitchenDashboard() {
  const { socket, isConnected } = useSocket();
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [chefName, setChefName] = useState('Chef');

  // Dashboard states
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Force rerender clock for countdown timers
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (savedToken && (role === 'KITCHEN' || role === 'ADMIN')) {
      setToken(savedToken);
      const name = localStorage.getItem('userName');
      if (name) setChefName(name);
    } else {
      setLoading(false);
    }
  }, []);

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synth Chime for new orders
  const triggerAudioChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      
      // Play C5 -> E5 -> G5 arpeggio chime
      const now = audioCtx.currentTime;
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.12); // E5
      oscillator.frequency.setValueAtTime(783.99, now + 0.24); // G5
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (err) {
      console.warn('Synth chime block by browser auto-play policy:', err);
    }
  };

  // Fetch kitchen orders
  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        // Fetch active orders (placed, accepted, preparing, ready)
        const res = await fetch(`${BACKEND_URL}/api/orders/active`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Fetch kitchen dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Socket real-time synchronization
    if (socket) {
      // New order
      socket.on('new_order', (newOrder: Order) => {
        setOrders((prev) => {
          // Prevent duplicates
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        triggerAudioChime();
      });

      // Status updates
      socket.on('order_status_changed', (updatedOrder: Order) => {
        setOrders((prev) => {
          // If order is served or cancelled, remove it from active kitchen dashboard
          if (updatedOrder.status === 'SERVED' || updatedOrder.status === 'CANCELLED') {
            return prev.filter((o) => o.id !== updatedOrder.id);
          }
          // Otherwise, update in-place
          const exists = prev.some((o) => o.id === updatedOrder.id);
          if (exists) {
            return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
          } else {
            return [updatedOrder, ...prev];
          }
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order');
        socket.off('order_status_changed');
      }
    };
  }, [token, socket, soundEnabled]);

  // Authenticate Kitchen user
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
      
      if (data.user.role !== 'KITCHEN' && data.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Kitchen chef access level required');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userName', data.user.name);
      
      setToken(data.token);
      setChefName(data.user.name);
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
      
      // Update local state (remove from board if served, else update)
      if (status === 'SERVED') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating order state');
    }
  };

  // Timer calculation
  const getTimerInfo = (createdAt: string) => {
    const elapsedMs = currentTime.getTime() - new Date(createdAt).getTime();
    const elapsedMin = Math.floor(elapsedMs / 1000 / 60);
    const elapsedSec = Math.floor((elapsedMs / 1000) % 60);

    const timeStr = `${elapsedMin.toString().padStart(2, '0')}:${elapsedSec.toString().padStart(2, '0')}`;

    let colorClass = 'text-green-500 bg-green-500/10 border-green-500/20';
    let pulseClass = '';

    if (elapsedMin >= 10) {
      colorClass = 'text-red-500 bg-red-500/10 border-red-500/20';
      pulseClass = 'animate-pulse';
    } else if (elapsedMin >= 5) {
      colorClass = 'text-brand-orange bg-brand-orange/10 border-brand-orange/20';
    }

    return { timeStr, colorClass, pulseClass };
  };

  // Column grouping for Kanban board
  const colPending = orders.filter((o) => o.status === 'PLACED' || o.status === 'ACCEPTED');
  const colPreparing = orders.filter((o) => o.status === 'PREPARING');
  const colReady = orders.filter((o) => o.status === 'READY');

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('kitchen123');
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
                <ChefHat className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">Kitchen Login</h2>
              <p className="text-xs text-fg-muted font-light">Access Chef display dashboard controls.</p>
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
                  placeholder="kitchen@ardoise.com"
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
              <button
                onClick={() => handleQuickLogin('kitchen@ardoise.com')}
                className="w-full text-xxs py-2.5 px-3 border border-glass-border hover:border-brand-orange bg-glass-fill hover:bg-glass-fill/10 text-fg-primary font-semibold rounded-lg transition-all"
              >
                Kitchen Chef
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-16">
      <Navbar />

      {/* Control subbar */}
      <div className="w-full bg-glass-fill border-b border-glass-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold flex items-center space-x-1.5">
              <ChefHat className="w-4 h-4" />
              <span>{chefName}</span>
            </div>

            {/* Realtime WebSocket State */}
            {isConnected ? (
              <span className="text-xxs bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Wifi className="w-3 h-3" /> Live Kitchen Feed
              </span>
            ) : (
              <span className="text-xxs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <WifiOff className="w-3 h-3 animate-pulse" /> Offline Reconnecting...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-glass-border hover:bg-glass-fill text-fg-muted hover:text-fg-primary transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Toggle Audio Alert Chime"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-500" /> Sound Enabled
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-fg-muted" /> Muted
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="text-xs text-fg-muted hover:text-red-500 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/5 transition-all font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <h2 className="font-display font-extrabold text-2xl mb-8 flex items-center gap-2">
          Chef Display System <span className="text-xs bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full font-bold">{orders.length} tickets</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            <div className="h-96 bg-glass-border/30 rounded-2xl animate-pulse" />
            <div className="h-96 bg-glass-border/30 rounded-2xl animate-pulse" />
            <div className="h-96 bg-glass-border/30 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: PENDING TICKETS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-glass-border/20 pb-3 mb-4">
                <span className="font-display font-black text-sm tracking-wide uppercase">01. Waitlist (Pending)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">{colPending.length}</span>
              </div>
              <div className="space-y-5">
                {colPending.map((ord) => {
                  const { timeStr, colorClass, pulseClass } = getTimerInfo(ord.createdAt);
                  return (
                    <div
                      key={ord.id}
                      className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                    >
                      {/* Ticket Time Counter Badge */}
                      <span className={`absolute top-4 right-4 px-2.5 py-1 border rounded-lg text-xxs font-bold font-mono flex items-center gap-1 ${colorClass} ${pulseClass}`}>
                        <Clock className="w-3.5 h-3.5" /> {timeStr}
                      </span>

                      <div>
                        {/* Table Number */}
                        <div className="flex items-center space-x-1.5 border-b border-glass-border/10 pb-2 mb-3">
                          <span className="font-display font-black text-sm text-brand-orange">{ord.table.number}</span>
                          <span className="text-xxs text-fg-muted font-light">#{ord.id.slice(-6)}</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {ord.items.map((it) => (
                            <div key={it.id} className="text-xs">
                              <span className="text-fg-primary">
                                {it.menuItem.name} <span className="text-brand-orange font-bold font-display">&times; {it.quantity}</span>
                              </span>
                              {it.specialInstructions && (
                                <p className="text-xxs text-brand-orange italic font-light ml-0.5 mt-0.5">
                                  Notes: "{it.specialInstructions}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                        className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-brand-orange/10 hover:scale-[1.02] transition-transform"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Preparing
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: PREPARING TICKETS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-glass-border/20 pb-3 mb-4">
                <span className="font-display font-black text-sm tracking-wide uppercase">02. Cooking (Preparing)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange font-bold">{colPreparing.length}</span>
              </div>
              <div className="space-y-5">
                {colPreparing.map((ord) => {
                  const { timeStr, colorClass, pulseClass } = getTimerInfo(ord.createdAt);
                  return (
                    <div
                      key={ord.id}
                      className="bg-card-bg border border-brand-orange/20 p-5 rounded-2xl glass-card relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                    >
                      {/* Timer */}
                      <span className={`absolute top-4 right-4 px-2.5 py-1 border rounded-lg text-xxs font-bold font-mono flex items-center gap-1 ${colorClass} ${pulseClass}`}>
                        <Clock className="w-3.5 h-3.5" /> {timeStr}
                      </span>

                      <div>
                        {/* Table Number */}
                        <div className="flex items-center space-x-1.5 border-b border-glass-border/10 pb-2 mb-3">
                          <span className="font-display font-black text-sm text-brand-orange">{ord.table.number}</span>
                          <span className="text-xxs text-fg-muted font-light">#{ord.id.slice(-6)}</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {ord.items.map((it) => (
                            <div key={it.id} className="text-xs">
                              <span className="text-fg-primary">
                                {it.menuItem.name} <span className="text-brand-orange font-bold font-display">&times; {it.quantity}</span>
                              </span>
                              {it.specialInstructions && (
                                <p className="text-xxs text-brand-orange italic font-light ml-0.5 mt-0.5">
                                  Notes: "{it.specialInstructions}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'READY')}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow hover:scale-[1.02] transition-transform"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Plated & Ready
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 3: READY TICKETS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-glass-border/20 pb-3 mb-4">
                <span className="font-display font-black text-sm tracking-wide uppercase">03. Pass Table (Ready)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold">{colReady.length}</span>
              </div>
              <div className="space-y-5">
                {colReady.map((ord) => {
                  const { timeStr, colorClass, pulseClass } = getTimerInfo(ord.createdAt);
                  return (
                    <div
                      key={ord.id}
                      className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                    >
                      {/* Timer */}
                      <span className={`absolute top-4 right-4 px-2.5 py-1 border rounded-lg text-xxs font-bold font-mono flex items-center gap-1 ${colorClass} ${pulseClass}`}>
                        <Clock className="w-3.5 h-3.5" /> {timeStr}
                      </span>

                      <div>
                        {/* Table Number */}
                        <div className="flex items-center space-x-1.5 border-b border-glass-border/10 pb-2 mb-3">
                          <span className="font-display font-black text-sm text-brand-orange">{ord.table.number}</span>
                          <span className="text-xxs text-fg-muted font-light">#{ord.id.slice(-6)}</span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {ord.items.map((it) => (
                            <div key={it.id} className="text-xs font-light opacity-80">
                              <span>
                                {it.menuItem.name} <span className="text-brand-orange font-bold font-display">&times; {it.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                        className="w-full py-2.5 bg-neutral-600 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow hover:scale-[1.02] transition-transform"
                      >
                        <Flame className="w-3.5 h-3.5" /> Mark Served
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
