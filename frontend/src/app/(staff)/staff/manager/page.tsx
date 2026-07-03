'use client';

import React, { useState } from 'react';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import PosHeader from '@/components/PosHeader';
import {
  ClipboardList,
  Search,
  Users,
  GitMerge
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

export default function ManagerDashboard() {
  const {
    token,
    staffName,
    staffRole,
    orders: rawOrders,
    tables: rawTables,
    loading,
    refreshData,
    handleLogout,
    isConnected
  } = useStaffDashboard('MANAGER');

  const orders = rawOrders as Order[];
  const tables = rawTables as Table[];

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedWaiter, setAssignedWaiter] = useState('');

  const handleAssignWaiter = () => {
    if (!selectedTable || !assignedWaiter) return;
    alert(`Successfully assigned Waiter ${assignedWaiter} to ${selectedTable.number}!`);
    setAssignedWaiter('');
  };

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

  const handleForceCloseTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to force close this table session? This cancels or served-archives all active orders.')) return;
    try {
      const active = getTableActiveOrders(tableId);
      for (const ord of active) {
        await fetch(`${BACKEND_URL}/api/orders/${ord.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'CLOSED' }),
        });
      }
      await fetch(`${BACKEND_URL}/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });

      refreshData();
      setSelectedTable(null);
      alert('Table closed successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedTable || !transferTargetId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromTableId: selectedTable.id,
          toTableId: transferTargetId,
        }),
      });

      if (!res.ok) throw new Error('Transfer failed');
      refreshData();
      setSelectedTable(null);
      setTransferTargetId('');
      alert('Table re-routed successfully!');
    } catch (err: any) {
      alert(err.message || 'Error transferring table');
    }
  };

  const handleUpdateStatus = async (tableId: string, status: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/tables/${tableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED' || t.status === 'NEEDS_ASSISTANCE').length;
  const filteredTables = tables.filter(t => t.number.toLowerCase().includes(searchQuery.toLowerCase()));

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tables grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="font-display font-extrabold text-xl flex items-center gap-2 text-fg-primary">
                Manager Control Board <span className="text-xs bg-brand-orange/15 text-brand-orange px-2.5 py-0.5 rounded-full font-bold">{occupiedCount} / {tables.length} Seated</span>
              </h2>
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-glass-fill border border-glass-border rounded-xl text-xs outline-none text-fg-primary w-44"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredTables.map((t) => {
                const bill = getTableBillAmount(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 transition-all hover:scale-[1.02] ${
                      selectedTable?.id === t.id ? 'border-brand-orange bg-glass-fill/10' : 'border-card-border bg-card-bg'
                    }`}
                  >
                    <span className="font-display font-bold text-sm block text-fg-primary">{t.number}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500' : 'bg-brand-orange/10 text-brand-orange'
                    }`}>
                      {t.status}
                    </span>
                    {bill > 0 && (
                      <span className="block font-bold text-xs text-brand-orange">${bill.toFixed(2)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operations Panel */}
          <div className="space-y-6">
            {selectedTable ? (
              <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6">
                <div className="border-b border-glass-border/10 pb-3 text-fg-primary">
                  <h3 className="font-display font-extrabold text-sm uppercase">{selectedTable.number} Admin Actions</h3>
                </div>

                {/* Quick status change */}
                <div className="space-y-2 text-fg-primary">
                  <label className="text-xxs font-bold text-fg-muted uppercase">Manual status overwrite</label>
                  <select
                    value={selectedTable.status}
                    onChange={(e) => handleUpdateStatus(selectedTable.id, e.target.value)}
                    className="w-full px-3 py-2 bg-glass-fill border border-glass-border rounded-xl text-xs font-semibold text-fg-primary"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="CLEANING_NEEDED">CLEANING_NEEDED</option>
                  </select>
                </div>

                {/* Merge / Re-route Tables */}
                {getTableActiveOrders(selectedTable.id).length > 0 && (
                  <div className="space-y-3 text-fg-primary">
                    <label className="text-xxs font-bold text-fg-muted uppercase block">Merge / Re-route Bill</label>
                    <div className="flex gap-2">
                      <select
                        value={transferTargetId}
                        onChange={(e) => setTransferTargetId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-glass-fill border border-glass-border rounded-xl text-[10px] font-medium text-fg-primary"
                      >
                        <option value="">Select target table</option>
                        {tables
                          .filter((t) => t.id !== selectedTable.id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.number} ({t.status === 'AVAILABLE' ? 'Merge/Free' : 'Merge/Occupied'})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleTransferTable}
                        disabled={!transferTargetId}
                        className="px-3 py-2 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white font-bold rounded-xl text-xs cursor-pointer border-0"
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                )}

                {/* Assign Waiter */}
                <div className="space-y-3 text-fg-primary pt-2 border-t border-glass-border/10">
                  <label className="text-xxs font-bold text-fg-muted uppercase block">Assign Waiter Host</label>
                  <div className="flex gap-2">
                    <select
                      value={assignedWaiter}
                      onChange={(e) => setAssignedWaiter(e.target.value)}
                      className="flex-1 px-3 py-2 bg-glass-fill border border-glass-border rounded-xl text-[10px] font-medium text-fg-primary"
                    >
                      <option value="">Select Waiter</option>
                      <option value="Pierre">Pierre</option>
                      <option value="Clara">Clara</option>
                      <option value="Marcus">Chef Marcus</option>
                      <option value="Julian">Julian</option>
                    </select>
                    <button
                      onClick={handleAssignWaiter}
                      disabled={!assignedWaiter}
                      className="px-3 py-2 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white font-bold rounded-xl text-xs cursor-pointer border-0"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Force close */}
                <div className="pt-2 border-t border-glass-border/10">
                  <button
                    onClick={() => handleForceCloseTable(selectedTable.id)}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/20 rounded-xl text-xs cursor-pointer"
                  >
                    Force close session (Free Table)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card text-center space-y-2 text-fg-primary">
                <ClipboardList className="w-8 h-8 text-fg-muted mx-auto" />
                <h4 className="font-bold text-xs uppercase">Manager Console</h4>
                <p className="text-xxs text-fg-muted font-light">
                  Click a table to overwrite Seating statuses, re-route orders, or perform force session closures.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
