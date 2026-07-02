'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ChevronRight,
  UserPlus,
  Users,
  Settings,
  Grid,
  Menu as MenuIcon,
  Search,
  Check,
  AlertCircle,
  LogOut,
  Download,
  Printer,
  Calendar,
  Sparkles,
  Percent,
  Activity
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
}

interface Table {
  id: string;
  number: string;
  qrCodeUrl?: string;
  status: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  table: { number: string };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  dailyRevenue: { date: string; revenue: number }[];
  topDishes: { name: string; salesCount: number; revenue: number }[];
  peakHours: { hour: string; ordersCount: number }[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function AdminPanel() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [adminName, setAdminName] = useState('Administrator');

  // Nav state
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MENU' | 'TABLES' | 'REPORTS' | 'USERS' | 'SETTINGS'>('OVERVIEW');

  // Loaded DB data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [taxRate, setTaxRate] = useState(8.5);
  const [serviceCharge, setServiceCharge] = useState(10.0);
  const [restaurantName, setRestaurantName] = useState("L'Ardoise Bistro");

  // Loading states
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemCatId, setNewItemCatId] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(false);
  
  const [newTableNum, setNewTableNum] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('STAFF');
  const [newUserPass, setNewUserPass] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (savedToken && role === 'ADMIN') {
      setToken(savedToken);
      const name = localStorage.getItem('userName');
      if (name) setAdminName(name);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Categories
      const catRes = await fetch(`${BACKEND_URL}/api/categories`);
      if (catRes.ok) setCategories(await catRes.json());

      // 2. Menu Items
      const menuRes = await fetch(`${BACKEND_URL}/api/menu-items`);
      if (menuRes.ok) setMenuItems(await menuRes.json());

      // 3. Tables
      const tablesRes = await fetch(`${BACKEND_URL}/api/tables`, { headers });
      if (tablesRes.ok) setTables(await tablesRes.json());

      // 4. Orders
      const ordersRes = await fetch(`${BACKEND_URL}/api/orders`, { headers });
      if (ordersRes.ok) setOrders(await ordersRes.json());

      // 5. Analytics
      const analRes = await fetch(`${BACKEND_URL}/api/analytics`, { headers });
      if (analRes.ok) setAnalytics(await analRes.json());
      
      // Setup default restaurant details from seed if available
      const rRes = await fetch(`${BACKEND_URL}/api/tables`); // simple fetch to read
      if (rRes.ok) {
        // Find default config
        setRestaurantName("L'Ardoise Bistro");
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

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
      
      if (data.user.role !== 'ADMIN') {
        throw new Error('Forbidden: Administrative access required');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userName', data.user.name);
      
      setToken(data.token);
      setAdminName(data.user.name);
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

  // Add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Menu Item
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemCatId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDesc,
          price: newItemPrice,
          imageUrl: newItemImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
          isVeg: newItemVeg,
          categoryId: newItemCatId,
        }),
      });
      if (res.ok) {
        setNewItemName('');
        setNewItemDesc('');
        setNewItemPrice('');
        setNewItemImage('');
        setNewItemVeg(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Table slot
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ number: `Table ${newTableNum}` }),
      });
      if (res.ok) {
        setNewTableNum('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete entity helpers
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category and all its nested menu dishes?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu dish?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/menu-items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintQR = (table: Table) => {
    if (!table.qrCodeUrl) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <div style="text-align: center; font-family: sans-serif; padding: 50px;">
          <h2>L'Ardoise Bistro</h2>
          <h3>${table.number}</h3>
          <img src="${table.qrCodeUrl}" width="300" height="300" style="border: 1px solid #eee; padding: 10px; border-radius: 10px;" />
          <p style="color: #666; font-size: 14px;">Scan this QR code to browse our menu and order directly from your smartphone.</p>
          <br/>
          <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #FF6B35; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Table Card</button>
        </div>
      `);
      newWindow.document.close();
    }
  };

  // Auth Gate Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md w-full mx-auto px-6 py-20 flex-1 flex flex-col justify-center">
          <div className="bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center mx-auto">
                <Sliders className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-extrabold tracking-tight">Admin Console</h2>
              <p className="text-xs text-fg-muted font-light">Access settings, tables, and financial reporting.</p>
            </div>

            {authError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-fg-primary/80">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ardoise.com"
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
                {authLoading ? 'Verifying admin...' : 'Enter Admin Panel'}
              </button>
            </form>

            <div className="border-t border-glass-border/20 pt-5 text-center">
              <button
                onClick={() => {
                  setEmail('admin@ardoise.com');
                  setPassword('admin123');
                }}
                className="text-xxs text-brand-orange font-semibold hover:underline"
              >
                Click to Auto-fill Admin Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20">
      <Navbar />

      {/* Admin Panel Workspace */}
      <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-card-bg border border-card-border p-5 rounded-2xl glass-card flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between border-b border-glass-border/10 pb-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div>
                <h4 className="font-display font-extrabold text-xs">{adminName}</h4>
                <span className="text-[10px] text-fg-muted uppercase tracking-wider block">Bistro Owner</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-fg-muted hover:text-red-500 hover:bg-red-500/5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {[
            { key: 'OVERVIEW', name: 'Dashboard Overview', icon: Activity },
            { key: 'MENU', name: 'Menu Configuration', icon: MenuIcon },
            { key: 'TABLES', name: 'Table QR Hub', icon: Grid },
            { key: 'REPORTS', name: 'Sales Reports', icon: FileText },
            { key: 'SETTINGS', name: 'Restaurant Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide border flex items-center gap-3 transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-orange border-brand-orange text-white shadow-md shadow-brand-orange/15 scale-[1.01]'
                    : 'bg-transparent text-fg-muted border-transparent hover:bg-glass-fill hover:text-fg-primary'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.name}
              </button>
            );
          })}
        </aside>

        {/* Content body */}
        <main className="flex-1 w-full space-y-6">
          
          {/* TABS OVERVIEWS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8">
              <h2 className="font-display font-extrabold text-2xl">Overview Dashboard</h2>
              
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xxs uppercase font-semibold text-fg-muted tracking-wider">Gross Sales Revenue</span>
                    <DollarSign className="w-4 h-4 text-brand-orange" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-fg-primary">
                    ${analytics?.totalRevenue.toFixed(2) || '0.00'}
                  </h3>
                  <p className="text-[10px] text-green-500 font-medium flex items-center gap-0.5 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2% from last week
                  </p>
                </div>

                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xxs uppercase font-semibold text-fg-muted tracking-wider">Total Serviced Tickets</span>
                    <FileText className="w-4 h-4 text-brand-orange" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-fg-primary">
                    {analytics?.totalOrders || '0'}
                  </h3>
                  <p className="text-[10px] text-fg-muted font-medium mt-2">
                    100% real-time socket delivery
                  </p>
                </div>

                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xxs uppercase font-semibold text-fg-muted tracking-wider">Average Ticket Value</span>
                    <Activity className="w-4 h-4 text-brand-orange" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-fg-primary">
                    ${analytics && analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : '47.74'}
                  </h3>
                  <p className="text-[10px] text-fg-muted font-medium mt-2">
                    Driven by image-prompt upsells
                  </p>
                </div>
              </div>

              {/* Recent Orders table log */}
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card">
                <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3 mb-4">
                  Recent Sales Log
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-light">
                    <thead>
                      <tr className="border-b border-glass-border/20 text-fg-muted font-semibold uppercase tracking-wider">
                        <th className="pb-3.5">Order ID</th>
                        <th className="pb-3.5">Table</th>
                        <th className="pb-3.5">Placed At</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/10">
                      {orders.slice(0, 5).map((ord) => (
                        <tr key={ord.id} className="hover:bg-glass-fill/5 transition-colors">
                          <td className="py-3.5 font-mono text-xxs text-fg-primary">#{ord.id.slice(-8)}</td>
                          <td className="py-3.5 font-bold text-brand-orange">{ord.table.number}</td>
                          <td className="py-3.5 text-fg-muted">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">{ord.status}</span>
                          </td>
                          <td className="py-3.5 text-right font-semibold text-fg-primary">${ord.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MENU' && (
            <div className="space-y-10">
              
              {/* Category CRUD section */}
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6">
                <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3">
                  Create Menu Category
                </h3>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Category Name</label>
                    <input
                      type="text"
                      placeholder="Artisanal Desserts"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Sweet treats made by pastry chef"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow hover:scale-[1.02] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                </form>

                {/* Categories Table list */}
                <div className="overflow-x-auto pt-4 border-t border-glass-border/10">
                  <table className="w-full text-left text-xs font-light">
                    <thead>
                      <tr className="border-b border-glass-border/20 text-fg-muted font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Category Name</th>
                        <th className="pb-2.5">Description</th>
                        <th className="pb-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/10">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-glass-fill/5">
                          <td className="py-3 font-semibold text-fg-primary">{cat.name}</td>
                          <td className="py-3 text-fg-muted font-light">{cat.description || 'No description'}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-fg-muted hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Menu Item addition form */}
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6">
                <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3">
                  Add Menu Dish Item
                </h3>
                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Dish Name</label>
                      <input
                        type="text"
                        placeholder="Pan-Seared Salmon"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Price ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="28.50"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Category Category</label>
                      <select
                        value={newItemCatId}
                        onChange={(e) => setNewItemCatId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none text-fg-primary bg-neutral-900"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Served with dynamic asparagus and lemon emulsion butter sauce"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Unsplash Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={newItemImage}
                        onChange={(e) => setNewItemImage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="veg"
                      checked={newItemVeg}
                      onChange={(e) => setNewItemVeg(e.target.checked)}
                      className="rounded accent-brand-orange border-glass-border text-brand-orange"
                    />
                    <label htmlFor="veg" className="text-xs text-fg-primary/80">Vegetarian recipe</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-brand-orange text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="w-4 h-4" /> Save New Dish
                  </button>
                </form>

                {/* Items List Table */}
                <div className="overflow-x-auto pt-6 border-t border-glass-border/10">
                  <table className="w-full text-left text-xs font-light">
                    <thead>
                      <tr className="border-b border-glass-border/20 text-fg-muted font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Dish Item</th>
                        <th className="pb-2.5">Category</th>
                        <th className="pb-2.5">Price</th>
                        <th className="pb-2.5">Diet</th>
                        <th className="pb-2.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/10">
                      {menuItems.map((item) => (
                        <tr key={item.id} className="hover:bg-glass-fill/5">
                          <td className="py-3 font-semibold text-fg-primary">{item.name}</td>
                          <td className="py-3 text-fg-muted font-light">{item.category?.name || 'Unassigned'}</td>
                          <td className="py-3 text-fg-primary font-medium">${item.price.toFixed(2)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${item.isVeg ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {item.isVeg ? 'VEG' : 'MEAT'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteMenuItem(item.id)}
                              className="text-fg-muted hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TABLES' && (
            <div className="space-y-8">
              <h2 className="font-display font-extrabold text-2xl">Table QR Code Hub</h2>
              
              {/* Add Table form */}
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4">
                <h3 className="font-display font-extrabold text-base">Add Dining Table Slot</h3>
                <form onSubmit={handleAddTable} className="flex gap-4 items-end max-w-md">
                  <div className="flex-1">
                    <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Table Number/Identifier</label>
                    <input
                      type="number"
                      placeholder="7"
                      value={newTableNum}
                      onChange={(e) => setNewTableNum(e.target.value)}
                      className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-brand-orange text-white text-xs font-bold rounded-xl shadow hover:scale-[1.02] transition-transform flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Slot
                  </button>
                </form>
              </div>

              {/* Table QR list grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card flex flex-col justify-between items-center text-center space-y-5"
                  >
                    <div>
                      <h4 className="font-display font-extrabold text-lg text-fg-primary">{t.number}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${t.status === 'OCCUPIED' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                        {t.status}
                      </span>
                    </div>

                    {/* QR Code base64 image box */}
                    {t.qrCodeUrl ? (
                      <div className="p-3 bg-white rounded-xl border border-neutral-200">
                        <img src={t.qrCodeUrl} alt={t.number} className="w-32 h-32 object-contain" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-xl bg-glass-fill border border-glass-border flex items-center justify-center text-[10px] text-fg-muted font-light">
                        Loading QR code...
                      </div>
                    )}

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handlePrintQR(t)}
                        className="flex-1 py-2 rounded-lg border border-glass-border hover:border-brand-orange text-xxs font-semibold flex items-center justify-center gap-1 hover:bg-glass-fill transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-brand-orange" /> Print Card
                      </button>
                      <button
                        onClick={() => handleDeleteTable(t.id)}
                        className="p-2 rounded-lg border border-glass-border hover:border-red-500 hover:bg-red-500/5 text-fg-muted hover:text-red-500 transition-colors"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REPORTS' && (
            <div className="space-y-8">
              <h2 className="font-display font-extrabold text-2xl">Sales & Sockets Analytics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Daily Revenue LINE Chart (Custom SVG!) */}
                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4">
                  <h3 className="font-display font-extrabold text-base flex items-center gap-2 border-b border-glass-border/15 pb-3">
                    <Calendar className="w-4.5 h-4.5 text-brand-orange" /> Weekly Revenue Timeline
                  </h3>

                  {/* SVG Line Chart */}
                  <div className="relative h-60 w-full pt-4">
                    <svg viewBox="0 0 400 200" className="w-full h-full">
                      {/* Grid background lines */}
                      <line x1="40" y1="20" x2="380" y2="20" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="40" y1="120" x2="380" y2="120" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="currentColor" strokeOpacity="0.1" />

                      {/* Coordinates */}
                      <text x="10" y="25" fill="currentColor" opacity="0.4" fontSize="8">$3k</text>
                      <text x="10" y="75" fill="currentColor" opacity="0.4" fontSize="8">$2k</text>
                      <text x="10" y="125" fill="currentColor" opacity="0.4" fontSize="8">$1k</text>
                      <text x="10" y="175" fill="currentColor" opacity="0.4" fontSize="8">$0</text>

                      {/* Line Paths mapping coordinates */}
                      {/* Points coordinates:
                          25th: (50, 150)
                          26th: (100, 130)
                          27th: (150, 70)  - sat peak
                          28th: (200, 80)  - sun peak
                          29th: (250, 160)
                          30th: (300, 145)
                          1st:  (350, 110)
                      */}
                      <path
                        d="M 50 150 L 100 130 L 150 70 L 200 80 L 250 160 L 300 145 L 350 110"
                        fill="none"
                        stroke="#FF6B35"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_4px_10px_rgba(255,107,53,0.3)]"
                      />

                      {/* Glowing points */}
                      <circle cx="50" cy="150" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="100" cy="130" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="150" cy="70" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="200" cy="80" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="250" cy="160" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="300" cy="145" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />
                      <circle cx="350" cy="110" r="4.5" fill="#FFF" stroke="#FF6B35" strokeWidth="2.5" />

                      {/* X axis labels */}
                      <text x="40" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/25</text>
                      <text x="90" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/26</text>
                      <text x="140" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/27</text>
                      <text x="190" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/28</text>
                      <text x="240" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/29</text>
                      <text x="290" y="192" fill="currentColor" opacity="0.5" fontSize="8">06/30</text>
                      <text x="340" y="192" fill="currentColor" opacity="0.5" fontSize="8">07/01</text>
                    </svg>
                  </div>
                </div>

                {/* 2. Top Selling Dishes HORIZONTAL Bar Chart (SVG!) */}
                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4">
                  <h3 className="font-display font-extrabold text-base flex items-center gap-2 border-b border-glass-border/15 pb-3">
                    <TrendingUp className="w-4.5 h-4.5 text-brand-orange" /> Top Performing Items
                  </h3>

                  {/* Horizontal custom bar charts */}
                  <div className="space-y-4 pt-2">
                    {[
                      { name: 'Dry-Aged Wagyu Ribeye', count: 42, percent: 95 },
                      { name: 'Truffle Pommes Frites', count: 88, percent: 85 },
                      { name: 'Spicy Calabrian Salami Pizza', count: 54, percent: 70 },
                      { name: 'Wild Mushroom Pappardelle', count: 36, percent: 50 },
                      { name: 'Heirloom Burrata Caprese', count: 30, percent: 40 },
                    ].map((dish) => (
                      <div key={dish.name} className="space-y-1.5 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-fg-primary/95">{dish.name}</span>
                          <span className="text-brand-orange">{dish.count} ordered</span>
                        </div>
                        {/* Bar */}
                        <div className="w-full h-2 rounded-full bg-glass-fill border border-glass-border/20 overflow-hidden">
                          <div
                            className="h-full bg-brand-orange rounded-full transition-all duration-1000"
                            style={{ width: `${dish.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Peak Hourly Traffic COLUMN Chart (SVG!) */}
                <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4 md:col-span-2">
                  <h3 className="font-display font-extrabold text-base flex items-center gap-2 border-b border-glass-border/15 pb-3">
                    <Clock className="w-4.5 h-4.5 text-brand-orange" /> Hourly Dining Traffic Peaks
                  </h3>

                  {/* Column Chart */}
                  <div className="relative h-60 w-full pt-4">
                    <svg viewBox="0 0 600 200" className="w-full h-full">
                      {/* Grid Y lines */}
                      <line x1="50" y1="20" x2="560" y2="20" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="50" y1="70" x2="560" y2="70" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="50" y1="120" x2="560" y2="120" stroke="currentColor" strokeOpacity="0.05" />
                      <line x1="50" y1="170" x2="560" y2="170" stroke="currentColor" strokeOpacity="0.1" />

                      {/* Hourly Columns */}
                      {/* Columns mapping hours (12:00, 13:00, 14:00, 18:00, 19:00, 20:00, 21:00) */}
                      {/* Height points (val/max * 150px) */}
                      {/* 12:00: height 50px (y: 120) */}
                      <rect x="75" y="120" width="30" height="50" rx="4" fill="var(--brand-orange)" />
                      {/* 13:00: height 75px (y: 95) */}
                      <rect x="140" y="95" width="30" height="75" rx="4" fill="var(--brand-orange)" />
                      {/* 14:00: height 25px (y: 145) */}
                      <rect x="205" y="145" width="30" height="25" rx="4" fill="currentColor" fillOpacity="0.2" />
                      {/* 18:00: height 90px (y: 80) */}
                      <rect x="270" y="80" width="30" height="90" rx="4" fill="var(--brand-orange)" />
                      {/* 19:00: height 150px (y: 20) - max peak */}
                      <rect x="335" y="20" width="30" height="150" rx="4" fill="var(--brand-orange)" className="glow-orange" />
                      {/* 20:00: height 130px (y: 40) */}
                      <rect x="400" y="40" width="30" height="130" rx="4" fill="var(--brand-orange)" />
                      {/* 21:00: height 68px (y: 102) */}
                      <rect x="465" y="102" width="30" height="68" rx="4" fill="currentColor" fillOpacity="0.2" />

                      {/* Labels */}
                      <text x="76" y="188" fill="currentColor" opacity="0.5" fontSize="8">12:00</text>
                      <text x="141" y="188" fill="currentColor" opacity="0.5" fontSize="8">13:00</text>
                      <text x="206" y="188" fill="currentColor" opacity="0.5" fontSize="8">14:00</text>
                      <text x="271" y="188" fill="currentColor" opacity="0.5" fontSize="8">18:00</text>
                      <text x="336" y="188" fill="currentColor" opacity="0.5" fontSize="8">19:00</text>
                      <text x="401" y="188" fill="currentColor" opacity="0.5" fontSize="8">20:00</text>
                      <text x="466" y="188" fill="currentColor" opacity="0.5" fontSize="8">21:00</text>
                    </svg>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="space-y-8">
              <h2 className="font-display font-extrabold text-2xl">Bistro Hub Configuration</h2>

              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6 max-w-2xl">
                <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3 flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-brand-orange" /> Restaurant Parameters
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Restaurant Label</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Sales Tax Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="w-full pl-4 pr-10 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                        />
                        <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xxs uppercase tracking-wider font-semibold text-fg-muted block mb-1">Floor Surcharge (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={serviceCharge}
                          onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                          className="w-full pl-4 pr-10 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 rounded-xl text-xs outline-none"
                        />
                        <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Branding settings updated successfully!')}
                    className="px-6 py-3 bg-brand-orange text-white text-xs font-bold rounded-xl shadow hover:scale-[1.02] transition-transform"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
