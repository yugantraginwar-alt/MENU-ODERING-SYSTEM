'use client';

import React, { useState } from 'react';
import { useStaffDashboard } from '@/hooks/useStaffDashboard';
import PosHeader from '@/components/PosHeader';
import {
  Printer,
  Download,
  ClipboardList,
  GitMerge,
  Undo
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

export default function CashierDashboard() {
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
  } = useStaffDashboard('CASHIER');

  const orders = rawOrders as Order[];
  const tables = rawTables as Table[];

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [mergeTargetTableId, setMergeTargetTableId] = useState('');

  const handleMergeBill = async () => {
    if (!selectedTable || !mergeTargetTableId) return;
    if (!confirm('Are you sure you want to merge this table bill?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromTableId: selectedTable.id,
          toTableId: mergeTargetTableId,
        }),
      });

      if (!res.ok) throw new Error('Merge failed');
      refreshData();
      setSelectedTable(null);
      setMergeTargetTableId('');
      alert('Bills successfully merged!');
    } catch (err: any) {
      alert(err.message || 'Error merging bills');
    }
  };

  const handleRefundBill = async () => {
    if (!selectedTable) return;
    if (!confirm('Are you sure you want to refund this session?')) return;
    const active = getTableActiveOrders(selectedTable.id);
    try {
      for (const ord of active) {
        await fetch(`${BACKEND_URL}/api/orders/${ord.id}/payment`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentStatus: 'REFUNDED' }),
        });
        await fetch(`${BACKEND_URL}/api/orders/${ord.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'CANCELLED' }),
        });
      }
      await fetch(`${BACKEND_URL}/api/tables/${selectedTable.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });

      refreshData();
      setSelectedTable(null);
      alert('Bill successfully refunded!');
    } catch (e) {
      console.error(e);
      alert('Error processing refund');
    }
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

  const handleMarkPaid = async () => {
    if (!selectedTable) return;
    const active = getTableActiveOrders(selectedTable.id);
    try {
      for (const ord of active) {
        await fetch(`${BACKEND_URL}/api/orders/${ord.id}/payment`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentStatus: 'PAID' }),
        });
      }
      // Force status update to available
      await fetch(`${BACKEND_URL}/api/tables/${selectedTable.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });

      refreshData();
      setSelectedTable(null);
      alert('Table bill paid & closed successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const activeOrdersForBill = selectedTable ? getTableActiveOrders(selectedTable.id) : [];
  const billItems = activeOrdersForBill.flatMap((o) => o.items);
  const consolidatedItems = billItems.reduce((acc: Array<{ name: string; price: number; quantity: number; totalPrice: number }>, item) => {
    const existing = acc.find((a: { name: string; price: number; quantity: number; totalPrice: number }) => a.name === item.menuItem.name);
    if (existing) {
      existing.quantity += item.quantity;
      existing.totalPrice += item.price * item.quantity;
    } else {
      acc.push({
        name: item.menuItem.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
      });
    }
    return acc;
  }, [] as Array<{ name: string; price: number; quantity: number; totalPrice: number }>);

  const billSubtotal = consolidatedItems.reduce((sum, it) => sum + it.totalPrice, 0);
  const billDiscount = billSubtotal * (discountPercent / 100);
  const billTax = (billSubtotal - billDiscount) * 0.085;
  const billService = (billSubtotal - billDiscount) * 0.10;
  const billTotal = billSubtotal - billDiscount + billTax + billService;

  const occupiedTables = tables.filter((t) => (t.status === 'OCCUPIED' || t.status === 'NEEDS_ASSISTANCE') && t.number.toLowerCase().includes(searchQuery.toLowerCase()));

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
          {/* Active Seated tables list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-extrabold text-xl text-fg-primary">Cashier billing desk</h2>
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-glass-fill border border-glass-border rounded-xl text-xs outline-none w-44 text-fg-primary"
              />
            </div>

            <div className="space-y-4">
              {occupiedTables.length === 0 ? (
                <div className="p-8 border border-dashed border-glass-border text-center text-xs text-fg-muted font-light rounded-2xl">
                  No active seated bills found.
                </div>
              ) : (
                occupiedTables.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTable(t)}
                    className={`p-4.5 border rounded-2xl cursor-pointer transition-all flex justify-between items-center ${
                      selectedTable?.id === t.id ? 'border-brand-orange bg-glass-fill/10' : 'border-card-border bg-card-bg hover:border-brand-orange/20'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block text-fg-primary">{t.number}</span>
                      <span className="text-xxs text-fg-muted">{getTableActiveOrders(t.id).length} active tickets</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-brand-orange block">${getTableBillAmount(t.id).toFixed(2)}</span>
                      <span className="text-[10px] text-fg-muted font-light font-mono">Unpaid</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* POS invoice summary */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-6">
                <div className="border-b border-dashed border-glass-border pb-4 text-center text-fg-primary">
                  <span className="font-bold block uppercase font-mono tracking-widest">L'ARDOISE BISTRO</span>
                  <span className="text-xxs font-mono text-fg-muted">GST: 27AAAAA1111A1Z1 &middot; {selectedTable.number}</span>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xxs font-mono text-fg-primary">
                  {consolidatedItems.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <span>{item.name} &times; {item.quantity}</span>
                      <span>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Discount and split details */}
                <div className="pt-2 border-t border-glass-border/20 text-xs space-y-3 font-mono text-fg-primary">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-fg-muted">Discount percentage:</span>
                    <select
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                      className="bg-glass-fill border border-glass-border rounded px-2 py-0.5 text-xs font-mono font-bold text-fg-primary"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-fg-muted">Split Invoice among:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={splitCount}
                      onChange={(e) => setSplitCount(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-0.5 bg-glass-fill border border-glass-border rounded text-center text-xs font-mono font-bold text-fg-primary"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xxs text-fg-muted">Merge Bill into:</span>
                    <div className="flex gap-1.5">
                      <select
                        value={mergeTargetTableId}
                        onChange={(e) => setMergeTargetTableId(e.target.value)}
                        className="bg-glass-fill border border-glass-border rounded px-2 py-0.5 text-[10px] font-mono font-bold text-fg-primary"
                      >
                        <option value="">Select Table</option>
                        {tables
                          .filter((t) => t.id !== selectedTable.id && (t.status === 'OCCUPIED' || t.status === 'NEEDS_ASSISTANCE'))
                          .map((t) => (
                            <option key={t.id} value={t.id}>{t.number}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={handleMergeBill}
                        disabled={!mergeTargetTableId}
                        className="px-2 py-1 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-800 text-white rounded text-[9px] font-bold cursor-pointer border-0"
                      >
                        Merge
                      </button>
                    </div>
                  </div>

                  {splitCount > 1 && (
                    <div className="p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-xl flex justify-between text-xxs font-bold text-brand-orange animate-pulse">
                      <span>Each pays ({splitCount} ways):</span>
                      <span>${(billTotal / splitCount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Pricing calculations */}
                <div className="pt-4 border-t border-dashed border-glass-border/40 text-xs font-mono space-y-1.5 text-fg-primary">
                  <div className="flex justify-between text-fg-muted text-xxs">
                    <span>Subtotal:</span>
                    <span>${billSubtotal.toFixed(2)}</span>
                  </div>
                  {billDiscount > 0 && (
                    <div className="flex justify-between text-red-500 text-xxs">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-${billDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-fg-muted text-xxs">
                    <span>Tax (8.5%):</span>
                    <span>${billTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-fg-muted text-xxs">
                    <span>Service charge (10%):</span>
                    <span>${billService.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-fg-primary pt-2 border-t border-glass-border/20">
                    <span>Total bill:</span>
                    <span className="text-brand-orange">${billTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Print/Download and Complete checkout actions */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    onClick={() => alert('Sending POS receipt payload to thermal checkout printer...')}
                    className="py-2.5 border border-glass-border hover:bg-glass-fill text-fg-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={() => alert('Generating Invoice PDF download...')}
                    className="py-2.5 border border-glass-border hover:bg-glass-fill text-fg-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Download PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleMarkPaid}
                    className="py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs tracking-wider transition-all cursor-pointer border-0"
                  >
                    Settle Bill (Paid)
                  </button>
                  <button
                    onClick={handleRefundBill}
                    className="py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl text-xs tracking-wider border border-red-500/20 transition-all cursor-pointer"
                  >
                    Refund / Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card-bg border border-card-border p-8 rounded-3xl glass-card text-center space-y-2">
                <ClipboardList className="w-8 h-8 text-fg-muted mx-auto" />
                <h4 className="font-bold text-xs uppercase text-fg-primary">POS checkouts</h4>
                <p className="text-xxs text-fg-muted font-light leading-relaxed">
                  Select an active dining table from the left list to settle its receipt, apply discount variables, split balances, or export invoice slips.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
