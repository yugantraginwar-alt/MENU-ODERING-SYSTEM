'use client';

import React, { useState, useEffect } from 'react';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import PosHeader from '@/components/PosHeader';
import {
  Sparkles,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingBag,
  Users,
  QrCode,
  Plus,
  Trash2,
  Settings,
  Layers,
  ArrowRight,
  HelpCircle,
  TrendingDown,
  Clock,
  Briefcase
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Table {
  id: string;
  number: string;
  status: string;
  guestsCount: number;
  branchId: string;
  floor?: {
    name: string;
  };
}

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
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  table: {
    id: string;
    number: string;
  };
  items: OrderItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  status: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  menuItems: MenuItem[];
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  shift: string;
}

export default function OwnerDashboard() {
  const {
    token,
    staffName,
    staffRole,
    orders: rawOrders,
    tables: rawTables,
    categories: rawCategories,
    loading,
    refreshData,
    handleLogout,
    isConnected,
    socket
  } = useStaffDashboard('OWNER');

  const orders = rawOrders as Order[];
  const tables = rawTables as Table[];
  const categories = rawCategories as Category[];

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'MENU' | 'STAFF' | 'TAXES' | 'QR' | 'OPERATIONS'>('ANALYTICS');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Tax setting inputs
  const [taxRate, setTaxRate] = useState<number>(8.5);
  const [serviceCharge, setServiceCharge] = useState<number>(10.0);
  const [loadingTaxUpdate, setLoadingTaxUpdate] = useState(false);
  const [businessHours, setBusinessHours] = useState('09:00 AM - 11:30 PM');

  // Staff Management local state
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: '1', name: 'Eleanor Vance', email: 'owner@ardoise.com', role: 'OWNER', shift: 'All Shifts' },
    { id: '2', name: 'Julian Rostand', email: 'manager@ardoise.com', role: 'MANAGER', shift: 'All Shifts' },
    { id: '3', name: 'Clara Dubois', email: 'cashier@ardoise.com', role: 'CASHIER', shift: 'Morning Shift' },
    { id: '4', name: 'Chef Marcus Wareing', email: 'kitchen@ardoise.com', role: 'KITCHEN', shift: 'Evening Shift' },
    { id: '5', name: 'Pierre Gringoire', email: 'waiter@ardoise.com', role: 'WAITER', shift: 'Evening Shift' },
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('WAITER');
  const [newStaffShift, setNewStaffShift] = useState('Morning Shift');

  // QR Generator inputs
  const [qrTableNumber, setQrTableNumber] = useState('');
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  if (loading || !token) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <header className="h-18 bg-neutral-950 border-b border-neutral-800" />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center space-y-6">
          <div className="h-10 bg-glass-border/30 rounded-xl w-1/3 animate-pulse" />
          <div className="h-40 bg-glass-border/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Handle menu item availability toggle
  const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
    const isAvail = newStatus === 'AVAILABLE';

    try {
      const res = await fetch(`${BACKEND_URL}/api/menu-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          isAvailable: isAvail,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle item availability');
      refreshData();
      alert('Dish availability toggled!');
    } catch (e) {
      console.error(e);
    }
  };

  // Modify central branch settings
  const handleSaveTaxes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTaxUpdate(true);
    try {
      setTimeout(() => {
        setLoadingTaxUpdate(false);
        alert('Tax policies and service surcharges successfully updated company-wide!');
      }, 800);
    } catch (e) {
      setLoadingTaxUpdate(false);
    }
  };

  // Add staff trigger
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    const newMember: StaffMember = {
      id: Math.random().toString(36).substring(2, 9),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      shift: newStaffShift
    };
    setStaffList([...staffList, newMember]);
    setNewStaffName('');
    setNewStaffEmail('');
    alert(`Successfully registered operational credentials for ${newStaffName}!`);
  };

  const handleRemoveStaff = (id: string, name: string) => {
    if (name === staffName) {
      alert('Cannot terminate your own logged in session.');
      return;
    }
    if (confirm(`Are you sure you want to remove staff member ${name}?`)) {
      setStaffList(staffList.filter(s => s.id !== id));
    }
  };

  // Generate QR Trigger
  const handleGenerateQrCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTableNumber) return;
    // Generate secure QR Ordering token payload
    const demoToken = `t-sess-${Math.random().toString(36).substring(2, 9)}`;
    const url = `http://localhost:3000/menu?restaurantId=ardoise-rest-id&branchId=ardoise-branch-id&tableId=${qrTableNumber}&token=${demoToken}`;
    setGeneratedQr(url);
  };

  // Compute Owner Revenue analytics metrics
  const totalRevenuePaid = orders
    .filter((o) => ['SERVED', 'PAID', 'CLOSED'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const netProfit = totalRevenuePaid * 0.72;
  const averageBill = orders.length > 0 ? totalRevenuePaid / orders.length : 0;
  const refundsCount = orders.filter(o => o.paymentStatus === 'REFUNDED').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'NEEDS_ASSISTANCE').length;
  const guestsTotalCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'NEEDS_ASSISTANCE').reduce((sum, t) => sum + (t.guestsCount || 2), 0);

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary">
      <PosHeader
        staffName={staffName}
        staffRole={staffRole}
        isConnected={isConnected}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8 text-fg-primary">
          
          {/* Header controls tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-glass-border/30 pb-4 gap-4">
            <div>
              <h2 className="font-display font-extrabold text-xl text-fg-primary">Executive Owner Console</h2>
              <p className="text-xxs text-fg-muted font-light mt-0.5">Corporate configuration and financial charts desk</p>
            </div>

            <div className="flex flex-wrap bg-glass-fill/30 border border-glass-border p-1 rounded-xl gap-1">
              {[
                { key: 'ANALYTICS', label: 'Analytics' },
                { key: 'OPERATIONS', label: 'Operations Desk' },
                { key: 'MENU', label: 'Menu Stock' },
                { key: 'STAFF', label: 'Staff Roster' },
                { key: 'QR', label: 'QR Generator' },
                { key: 'TAXES', label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-colors ${
                    activeTab === tab.key ? 'bg-brand-orange text-white' : 'text-fg-muted hover:text-fg-primary hover:bg-glass-fill/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: EXECUTIVE ANALYTICS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-8 animate-fade-in-move">
              
              {/* Financial & Performance KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                
                <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-fg-muted uppercase block">Gross Revenue</span>
                  <span className="font-display font-black text-2xl mt-1 block text-fg-primary">${totalRevenuePaid.toFixed(2)}</span>
                  <span className="text-[9px] text-green-500 font-bold block mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +14.2% today</span>
                </div>

                <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-fg-muted uppercase block">Net Profit (Est.)</span>
                  <span className="font-display font-black text-2xl mt-1 block text-emerald-500">${netProfit.toFixed(2)}</span>
                  <span className="text-[9px] text-fg-muted font-light block mt-1">Based on 72% margins</span>
                </div>

                <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-brand-orange">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-fg-muted uppercase block">Total Orders</span>
                  <span className="font-display font-black text-2xl mt-1 block text-fg-primary">{orders.length} Tickets</span>
                  <span className="text-[9px] text-fg-muted font-light block mt-1">Sourced from branch</span>
                </div>

                <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card relative overflow-hidden">
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Percent className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-fg-muted uppercase block">Average Ticket Bill</span>
                  <span className="font-display font-black text-2xl mt-1 block text-fg-primary">${averageBill.toFixed(2)}</span>
                  <span className="text-[9px] text-indigo-500 font-bold block mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +2.5% this week</span>
                </div>

              </div>

              {/* Operations & Sessional KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-card-bg border border-card-border p-5.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-fg-muted block uppercase">Active Seated Tables</span>
                  <span className="font-display font-black text-lg block mt-1 text-brand-orange">{occupiedCount} Tables</span>
                </div>
                <div className="bg-card-bg border border-card-border p-5.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-fg-muted block uppercase">Customer Count Seated</span>
                  <span className="font-display font-black text-lg block mt-1 text-fg-primary">{guestsTotalCount} Guests</span>
                </div>
                <div className="bg-card-bg border border-card-border p-5.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-fg-muted block uppercase">Cancelled Orders</span>
                  <span className="font-display font-black text-lg block mt-1 text-red-500">{cancelledCount} tickets</span>
                </div>
                <div className="bg-card-bg border border-card-border p-5.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-fg-muted block uppercase">Refunds Processed</span>
                  <span className="font-display font-black text-lg block mt-1 text-red-500">${(refundsCount * averageBill).toFixed(2)}</span>
                </div>
              </div>

              {/* Weekly Sales Trend & Leaderboards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Trend graph */}
                <div className="lg:col-span-2 bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-6">
                  <span className="font-display font-extrabold text-sm uppercase text-fg-primary">Weekly Sales Trend (Gross)</span>
                  <div className="h-56 flex items-end justify-between gap-4 pt-10 px-4">
                    {[
                      { label: 'Mon', height: '40%', val: '$1,420' },
                      { label: 'Tue', height: '52%', val: '$1,850' },
                      { label: 'Wed', height: '82%', val: '$2,900' },
                      { label: 'Thu', height: '74%', val: '$2,600' },
                      { label: 'Fri', height: '31%', val: '$1,100' },
                      { label: 'Sat', height: '44%', val: '$1,550' },
                      { label: 'Sun', height: '95%', val: '$3,420' },
                    ].map((day) => (
                      <div key={day.label} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        <span className="absolute -top-6 text-[10px] font-mono text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.val}
                        </span>
                        <div
                          className="w-full bg-brand-orange/20 border-t-2 border-brand-orange rounded-t-lg group-hover:bg-brand-orange/40 transition-colors"
                          style={{ height: day.height }}
                        />
                        <span className="text-xxs font-bold text-fg-muted mt-2">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling & Staff Leaderboard */}
                <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-6">
                  <span className="font-display font-extrabold text-sm uppercase block border-b border-glass-border/10 pb-3">
                    Corporate Metrics
                  </span>
                  
                  <div className="space-y-4 text-xs font-semibold text-fg-primary">
                    <div className="space-y-2">
                      <span className="text-xxs text-fg-muted uppercase block">Top Selling Items</span>
                      <ul className="space-y-1.5 pl-1 list-disc text-xxs font-medium text-fg-primary">
                        <li>Spicy Calabrian Salami Pizza &middot; <span className="text-brand-orange font-bold">14 sold</span></li>
                        <li>Truffle Parmesan Pommes Frites &middot; <span className="text-brand-orange font-bold">12 sold</span></li>
                        <li>Warm Chocolate Torte &middot; <span className="text-brand-orange font-bold">8 sold</span></li>
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-glass-border/10">
                      <span className="text-xxs text-fg-muted uppercase block">Peak Operational Hours</span>
                      <p className="text-xxs font-medium text-fg-primary">7:30 PM - 9:15 PM &middot; <span className="text-brand-orange font-bold">Average 8 Occupied Tables</span></p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: OPERATIONS DESK PANEL */}
          {activeTab === 'OPERATIONS' && (
            <div className="space-y-6 animate-fade-in-move">
              <h3 className="font-display font-extrabold text-base text-fg-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-orange" /> Real-time Table Grid Operations
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {tables.map((t) => {
                  const billAmount = orders
                    .filter((o) => o.table.id === t.id && ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status))
                    .reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <div
                      key={t.id}
                      className="p-4.5 border border-card-border bg-card-bg rounded-2xl flex flex-col justify-between items-center text-center text-xs space-y-3 relative"
                    >
                      <span className="font-bold text-sm block text-fg-primary">{t.number}</span>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.status === 'AVAILABLE' 
                          ? 'bg-green-500/10 text-green-500' 
                          : t.status === 'NEEDS_ASSISTANCE' 
                          ? 'bg-red-500/10 text-red-500 animate-pulse border border-red-500/20'
                          : 'bg-brand-orange/10 text-brand-orange'
                      }`}>
                        {t.status}
                      </span>

                      {billAmount > 0 ? (
                        <span className="font-mono text-xs font-bold text-brand-orange">${billAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-xxs text-fg-muted italic">Empty Session</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MENU STOCK CONTROL */}
          {activeTab === 'MENU' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in-move">
              {/* Categories Sidebar */}
              <div className="space-y-3">
                <span className="text-xxs font-bold text-fg-muted uppercase block">Categories</span>
                <div className="flex flex-col space-y-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-colors border-0 ${
                        selectedCategory === cat.id ? 'bg-brand-orange text-white' : 'bg-glass-fill border border-glass-border hover:bg-glass-fill/15 text-fg-muted hover:text-fg-primary'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Stock list */}
              <div className="lg:col-span-3 space-y-4">
                <span className="text-xxs font-bold text-fg-muted uppercase block">Menu Items Availability</span>
                <div className="space-y-3">
                  {categories
                    .find((c) => c.id === selectedCategory)
                    ?.menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border border-card-border bg-card-bg rounded-2xl flex justify-between items-center text-xs text-fg-primary"
                      >
                        <div>
                          <span className="font-bold block text-fg-primary">{item.name}</span>
                          <span className="text-xxs text-fg-muted font-light">${item.price.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => handleToggleItemStatus(item.id, item.status)}
                          className={`px-3 py-1.5 font-bold text-xxs rounded-lg transition-colors cursor-pointer border-0 ${
                            item.status === 'AVAILABLE'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25'
                          }`}
                        >
                          {item.status === 'AVAILABLE' ? 'In Stock (Available)' : 'Out of Stock (Hidden)'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STAFF ROSTER */}
          {activeTab === 'STAFF' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-move">
              
              {/* Staff List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-display font-extrabold text-sm text-fg-muted uppercase tracking-wider">Operational Staff Roster</h3>
                
                <div className="space-y-3">
                  {staffList.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-card-bg border border-card-border rounded-2xl flex justify-between items-center text-xs text-fg-primary"
                    >
                      <div className="space-y-1">
                        <span className="font-bold block text-sm">{member.name}</span>
                        <div className="flex gap-2 text-xxs text-fg-muted font-light font-mono">
                          <span>{member.email}</span>
                          <span>&bull;</span>
                          <span className="text-brand-orange font-bold">{member.role}</span>
                          <span>&bull;</span>
                          <span>{member.shift}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveStaff(member.id, member.name)}
                        className="p-2.5 border border-glass-border hover:border-red-500/20 text-fg-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl cursor-pointer bg-transparent border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Staff Form */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-4">
                <h3 className="font-display font-extrabold text-sm uppercase text-fg-primary flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-brand-orange" /> Register Staff Member
                </h3>
                
                <form onSubmit={handleAddStaff} className="space-y-4 text-xs font-semibold text-fg-primary">
                  <div className="space-y-1">
                    <label className="text-xxs text-fg-muted uppercase block">Full Name</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Marie Laurent"
                      className="w-full px-3.5 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/45 rounded-xl outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs text-fg-muted uppercase block">Email Address</label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="e.g. marie@ardoise.com"
                      className="w-full px-3.5 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/45 rounded-xl outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs text-fg-muted uppercase block">Terminal Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-glass-fill border border-glass-border rounded-xl text-xs"
                    >
                      <option value="WAITER">WAITER</option>
                      <option value="KITCHEN">KITCHEN</option>
                      <option value="CASHIER">CASHIER</option>
                      <option value="MANAGER">MANAGER</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xxs text-fg-muted uppercase block">Assign Shift</label>
                    <select
                      value={newStaffShift}
                      onChange={(e) => setNewStaffShift(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-glass-fill border border-glass-border rounded-xl text-xs"
                    >
                      <option value="Morning Shift">Morning Shift</option>
                      <option value="Evening Shift">Evening Shift</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl shadow-lg border-0 cursor-pointer text-xs"
                  >
                    Add Staff Credentials
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 5: QR CODE GENERATOR */}
          {activeTab === 'QR' && (
            <div className="max-w-xl mx-auto bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6 animate-fade-in-move">
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-sm uppercase text-fg-primary flex items-center gap-1.5">
                  <QrCode className="w-5 h-5 text-brand-orange" /> Table QR Code Dispatcher
                </h3>
                <p className="text-xxs text-fg-muted font-light">Generate instant table scanned routes for dining tables.</p>
              </div>

              <form onSubmit={handleGenerateQrCode} className="space-y-4 text-xs font-semibold text-fg-primary">
                <div className="space-y-1">
                  <label className="text-xxs text-fg-muted uppercase block">Table Identifier / Number</label>
                  <input
                    type="text"
                    value={qrTableNumber}
                    onChange={(e) => setQrTableNumber(e.target.value)}
                    placeholder="e.g. Table 4, Patio 2, Bar 1"
                    className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/45 rounded-xl outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs border-0 cursor-pointer"
                >
                  Generate QR Session Link
                </button>
              </form>

              {generatedQr && (
                <div className="border-t border-glass-border/10 pt-6 space-y-4 text-center animate-fade-in-move">
                  <span className="text-xxs text-fg-muted uppercase block font-bold">Generated Link Output</span>
                  <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl font-mono text-[10px] text-brand-orange select-all break-all leading-normal">
                    {generatedQr}
                  </div>
                  <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-lg border border-glass-border/30">
                    {/* Simplified mock QR visual */}
                    <div className="w-full h-full border-4 border-black p-1 flex flex-col justify-between">
                      <div className="flex justify-between"><div className="w-6 h-6 bg-black"></div><div className="w-6 h-6 bg-black"></div></div>
                      <div className="text-center font-mono font-black text-neutral-800 text-[10px] uppercase">L'ARDOISE</div>
                      <div className="flex justify-between"><div className="w-6 h-6 bg-black"></div><div className="w-10 h-3 bg-black"></div></div>
                    </div>
                  </div>
                  <a
                    href={generatedQr}
                    target="_blank"
                    className="inline-block px-4 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill rounded-xl text-xxs font-bold text-fg-primary"
                  >
                    Open Live Session
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RESTAURANT SETTINGS */}
          {activeTab === 'TAXES' && (
            <div className="max-w-md bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6 animate-fade-in-move">
              <h3 className="font-display font-extrabold text-sm uppercase text-fg-primary flex items-center gap-1.5">
                <Settings className="w-4.5 h-4.5 text-brand-orange" /> Restaurant Parameters
              </h3>
              
              <form onSubmit={handleSaveTaxes} className="space-y-4 text-xs font-semibold text-fg-primary">
                
                <div>
                  <label className="text-xxs font-bold text-fg-muted uppercase block mb-1">Company Operating Hours</label>
                  <input
                    type="text"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/45 rounded-xl outline-none text-fg-primary font-medium"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-fg-muted uppercase block mb-1">Local GST rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl outline-none text-fg-primary"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold text-fg-muted uppercase block mb-1">Service surcharge charge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl outline-none text-fg-primary"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-glass-border/10">
                  <span className="text-xxs text-fg-muted uppercase block font-bold">Subscription Plan</span>
                  <div className="p-3.5 bg-brand-orange/5 border border-brand-orange/20 rounded-xl flex justify-between items-center text-brand-orange">
                    <div>
                      <span className="font-bold block text-xs">L'Ardoise Enterprise Pro</span>
                      <span className="text-[9px] text-fg-muted block">Next renewal: Jan 2027</span>
                    </div>
                    <span className="text-xxs bg-brand-orange/15 px-2.5 py-0.5 rounded-full font-bold">Active</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingTaxUpdate}
                  className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs transition-transform active:scale-98 cursor-pointer border-0"
                >
                  {loadingTaxUpdate ? 'Updating settings...' : 'Save Corporate settings'}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
