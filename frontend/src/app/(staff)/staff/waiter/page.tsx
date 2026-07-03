'use client';

import React, { useState } from 'react';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import PosHeader from '@/components/PosHeader';
import {
  Search,
  BellRing,
  ClipboardList,
  ArrowRight,
  Clock
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
  items: Array<{
    id: string;
    quantity: number;
    specialInstructions?: string;
    price: number;
    menuItem: {
      name: string;
    };
  }>;
}

export default function WaiterDashboard() {
  const {
    token,
    staffName,
    staffRole,
    orders: rawOrders,
    tables: rawTables,
    customerRequests,
    setCustomerRequests,
    setTables,
    waiterAlert,
    setWaiterAlert,
    loading,
    refreshData,
    handleLogout,
    isConnected,
    socket
  } = useStaffDashboard('WAITER');

  const orders = rawOrders as Order[];
  const tables = rawTables as Table[];

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const getTableActiveOrders = (tableId: string) => {
    return orders.filter(
      (o) => o.table.id === tableId && ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(o.status)
    );
  };

  const getTableBillAmount = (tableId: string) => {
    const active = getTableActiveOrders(tableId);
    return active.reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const handleMarkServed = async (tableId: string) => {
    const active = getTableActiveOrders(tableId);
    const readyOrders = active.filter(o => o.status === 'READY');
    
    if (readyOrders.length === 0) {
      alert('No food items are currently in READY status for this table.');
      return;
    }

    try {
      for (const ord of readyOrders) {
        await fetch(`${BACKEND_URL}/api/orders/${ord.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'SERVED' }),
        });
      }
      refreshData();
      alert('Orders marked as SERVED!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTable = async (tableId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'OCCUPIED' }),
      });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCallKitchen = (tableNumber: string) => {
    if (socket) {
      socket.emit('customer_request', {
        tableId: 'kitchen-alert',
        tableNumber,
        type: 'Waiter Called Kitchen',
        timestamp: new Date().toISOString(),
      });
      alert(`Alert sent to Kitchen: Waiter calls chef for ${tableNumber}`);
    }
  };

  const handleResolveAlert = (alertId: string, tableNumber: string) => {
    setCustomerRequests((prev) => prev.filter((r) => r.id !== alertId));
    const activeAlerts = customerRequests.filter(r => r.id !== alertId && r.tableNumber === tableNumber);
    if (activeAlerts.length === 0) {
      const tab = tables.find(t => t.number === tableNumber);
      if (tab && tab.status === 'NEEDS_ASSISTANCE') {
        fetch(`${BACKEND_URL}/api/tables/${tab.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'OCCUPIED' }),
        }).then(() => refreshData());
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'OCCUPIED': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'RESERVED': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'NEEDS_ASSISTANCE': return 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse';
      case 'CLEANING_NEEDED': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const filteredTables = tables.filter(t => t.number.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary">
      <PosHeader
        staffName={staffName}
        staffRole={staffRole}
        isConnected={isConnected}
        customerRequests={customerRequests}
        setCustomerRequests={setCustomerRequests}
        onLogout={handleLogout}
      />

      {/* Global Waiter Audio-Visual Alert Desk Banner */}
      {waiterAlert && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-brand-orange text-white p-4 rounded-xl shadow-lg font-bold flex items-center justify-between text-xs animate-bounce">
            <span>{waiterAlert}</span>
            <button onClick={() => setWaiterAlert(null)} className="text-white hover:opacity-85 font-black uppercase text-xxs px-2">Dismiss</button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Tables Grid Layout */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="font-display font-extrabold text-xl flex items-center gap-2 text-fg-primary">
                Waiter Tables Panel <span className="text-xs bg-brand-orange/15 text-brand-orange px-2.5 py-0.5 rounded-full font-bold">{tables.length} Active</span>
              </h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                <input
                  type="text"
                  placeholder="Search table number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-xs outline-none text-fg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredTables.map((t) => {
                const activeOrders = getTableActiveOrders(t.id);
                const bill = getTableBillAmount(t.id);
                const readyItems = activeOrders.filter((o) => o.status === 'READY').length;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`bg-card-bg border p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between min-h-[180px] hover:scale-[1.01] ${
                      selectedTable?.id === t.id ? 'border-brand-orange ring-1 ring-brand-orange' : 'border-card-border'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-display font-black text-lg block text-fg-primary">{t.number}</span>
                        <span className="text-xxs text-fg-muted">Guests: {t.guestsCount || 2}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status === 'AVAILABLE' ? 'FREE' : t.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-fg-primary">
                      {activeOrders.length > 0 ? (
                        <>
                          <div className="flex justify-between font-medium">
                            <span>Pending Tickets:</span>
                            <span className="font-bold text-brand-orange">{activeOrders.length}</span>
                          </div>
                          <div className="flex justify-between text-xxs text-fg-muted">
                            <span>Current Bill:</span>
                            <span>${bill.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xxs text-fg-muted font-light italic">No active orders</div>
                      )}
                    </div>

                    {/* Quick actions on card */}
                    <div className="border-t border-glass-border/10 pt-3 mt-3 flex justify-between items-center gap-1.5">
                      {t.status === 'AVAILABLE' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenTable(t.id); }}
                          className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xxs w-full text-center cursor-pointer"
                        >
                          Open Table
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkServed(t.id); }}
                            disabled={readyItems === 0}
                            className="px-2.5 py-1.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white font-bold rounded-lg text-xxs flex-1 text-center truncate cursor-pointer"
                          >
                            Serve {readyItems > 0 && `(${readyItems})`}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCallKitchen(t.number); }}
                            className="px-2.5 py-1.5 border border-glass-border hover:bg-glass-fill text-fg-primary text-xxs font-semibold rounded-lg cursor-pointer"
                          >
                            Call Kitchen
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Calls alerts drawer */}
          <div className="space-y-6">
            {customerRequests.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/25 p-5 rounded-2xl space-y-4">
                <h3 className="font-display font-extrabold text-xs text-red-500 tracking-wide uppercase flex items-center gap-1.5">
                  <BellRing className="w-4 h-4" /> Guest Calls Desk ({customerRequests.length})
                </h3>
                <div className="space-y-3">
                  {customerRequests.map((req) => (
                    <div key={req.id} className="p-3 border border-red-500/20 bg-card-bg rounded-xl flex items-center justify-between text-xs text-fg-primary">
                      <div>
                        <span className="font-bold block text-red-500">{req.tableNumber}</span>
                        <span className="text-xxs text-fg-primary font-medium">{req.type}</span>
                      </div>
                      <button
                        onClick={() => handleResolveAlert(req.id, req.tableNumber)}
                        className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xxs rounded-lg cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected table details view */}
            {selectedTable ? (
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6">
                <div className="flex justify-between items-start border-b border-glass-border/10 pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-sm uppercase text-fg-primary">{selectedTable.number} details</h3>
                    <span className="text-xxs text-fg-muted">{selectedTable.status}</span>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="text-xxs text-fg-muted hover:text-fg-primary cursor-pointer">Close</button>
                </div>

                <div className="space-y-3 text-xs text-fg-primary">
                  <span className="text-xxs font-bold text-fg-muted block uppercase">Seated Items</span>
                  {getTableActiveOrders(selectedTable.id).length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {getTableActiveOrders(selectedTable.id).map(ord => (
                        <div key={ord.id} className="p-2.5 bg-glass-fill/10 border border-glass-border/30 rounded-lg">
                          <div className="flex justify-between font-bold">
                            <span>#{ord.orderNumber}</span>
                            <span className="text-brand-orange">${ord.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1 mt-1 text-xxs text-fg-muted font-light">
                            {ord.items.map(it => (
                              <div key={it.id}>{it.menuItem.name} &times; {it.quantity}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xxs text-fg-muted italic">No active orders</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card text-center space-y-2">
                <ClipboardList className="w-8 h-8 text-fg-muted mx-auto" />
                <h4 className="font-bold text-xs uppercase text-fg-primary">Waitstaff Desk</h4>
                <p className="text-xxs text-fg-muted font-light leading-relaxed">
                  Tap a table in the grid to view current seated items and print receipt copy.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
