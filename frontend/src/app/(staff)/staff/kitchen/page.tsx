'use client';

import React from 'react';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import PosHeader from '@/components/PosHeader';
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
  Flame,
  Volume2,
  VolumeX,
  BellRing
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function KitchenDashboard() {
  const {
    token,
    staffName,
    staffRole,
    orders,
    tables,
    loading,
    refreshData,
    handleLogout,
    isConnected,
    socket
  } = useStaffDashboard('KITCHEN');

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

  const activeKitchenOrders = orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  
  // Kanban groupings
  const colIncoming = activeKitchenOrders.filter((o) => o.status === 'PLACED');
  const colAccepted = activeKitchenOrders.filter((o) => o.status === 'ACCEPTED');
  const colPreparing = activeKitchenOrders.filter((o) => o.status === 'PREPARING');
  const colReady = activeKitchenOrders.filter((o) => o.status === 'READY');

  const handleUpdateStatus = async (orderId: string, status: string, tableNumber: string, orderNumber: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error('Status modify failed');
      refreshData();

      // If food is ready, emit instant notification to waitstaff
      if (status === 'READY' && socket) {
        socket.emit('kitchen_ready', {
          tableNumber,
          orderNumber,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const min = Math.floor(elapsed / 1000 / 60);
    return `${min}m ago`;
  };

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
        <div className="space-y-6">
          <h2 className="font-display font-extrabold text-xl flex items-center gap-2 text-fg-primary">
            <ChefHat className="w-5.5 h-5.5 text-brand-orange" /> Kitchen Display Screen (KDS)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* COLUMN 1: INCOMING */}
            <div className="space-y-4">
              <div className="border-b border-glass-border/30 pb-2 mb-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-blue-400">
                <span>Incoming</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10">{colIncoming.length}</span>
              </div>
              <div className="space-y-4">
                {colIncoming.map((ord) => (
                  <div key={ord.id} className="bg-card-bg border border-card-border p-4 rounded-xl space-y-3 text-fg-primary">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-brand-orange">{ord.table.number}</span>
                      <span className="font-mono text-xxs font-light text-fg-muted">#{ord.orderNumber.slice(-4)}</span>
                    </div>
                    <div className="space-y-1 text-xxs text-fg-primary font-medium">
                      {ord.items.map((it: any) => (
                        <div key={it.id}>
                          {it.menuItem.name} &times; <span className="text-brand-orange font-bold font-display">{it.quantity}</span>
                          {it.specialInstructions && <p className="text-[10px] text-red-500 italic">Notes: "{it.specialInstructions}"</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-fg-muted">
                      <span>{getElapsedTime(ord.createdAt)}</span>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED', ord.table.number, ord.orderNumber)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: ACCEPTED */}
            <div className="space-y-4">
              <div className="border-b border-glass-border/30 pb-2 mb-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-500">
                <span>Accepted</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10">{colAccepted.length}</span>
              </div>
              <div className="space-y-4">
                {colAccepted.map((ord) => (
                  <div key={ord.id} className="bg-card-bg border border-card-border p-4 rounded-xl space-y-3 text-fg-primary">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-brand-orange">{ord.table.number}</span>
                      <span className="font-mono text-xxs font-light text-fg-muted">#{ord.orderNumber.slice(-4)}</span>
                    </div>
                    <div className="space-y-1 text-xxs text-fg-primary font-medium">
                      {ord.items.map((it: any) => (
                        <div key={it.id}>
                          {it.menuItem.name} &times; <span className="text-brand-orange font-bold font-display">{it.quantity}</span>
                          {it.specialInstructions && <p className="text-[10px] text-red-500 italic">Notes: "{it.specialInstructions}"</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-fg-muted">
                      <span>{getElapsedTime(ord.createdAt)}</span>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING', ord.table.number, ord.orderNumber)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Preparing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: PREPARING */}
            <div className="space-y-4">
              <div className="border-b border-glass-border/30 pb-2 mb-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-purple-400">
                <span>Preparing</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10">{colPreparing.length}</span>
              </div>
              <div className="space-y-4">
                {colPreparing.map((ord) => (
                  <div key={ord.id} className="bg-card-bg border border-brand-orange/20 p-4 rounded-xl space-y-3 text-fg-primary">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-brand-orange">{ord.table.number}</span>
                      <span className="font-mono text-xxs font-light text-fg-muted">#{ord.orderNumber.slice(-4)}</span>
                    </div>
                    <div className="space-y-1 text-xxs text-fg-primary font-medium">
                      {ord.items.map((it: any) => (
                        <div key={it.id}>
                          {it.menuItem.name} &times; <span className="text-brand-orange font-bold font-display">{it.quantity}</span>
                          {it.specialInstructions && <p className="text-[10px] text-red-500 italic">Notes: "{it.specialInstructions}"</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-fg-muted">
                      <span>{getElapsedTime(ord.createdAt)}</span>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'READY', ord.table.number, ord.orderNumber)}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Ready & Notify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 4: READY */}
            <div className="space-y-4">
              <div className="border-b border-glass-border/30 pb-2 mb-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-green-500">
                <span>Completed (Ready)</span>
                <span className="px-2 py-0.5 rounded bg-green-500/10">{colReady.length}</span>
              </div>
              <div className="space-y-4">
                {colReady.map((ord) => (
                  <div key={ord.id} className="bg-card-bg border border-card-border p-4 rounded-xl opacity-75 space-y-3 text-fg-primary">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{ord.table.number}</span>
                      <span className="font-mono text-xxs font-light">#{ord.orderNumber.slice(-4)}</span>
                    </div>
                    <div className="space-y-1 text-xxs font-light text-fg-muted">
                      {ord.items.map((it: any) => (
                        <div key={it.id}>{it.menuItem.name} &times; {it.quantity}</div>
                      ))}
                    </div>
                    <span className="text-[10px] text-green-500 font-bold block">Ready at pass</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
