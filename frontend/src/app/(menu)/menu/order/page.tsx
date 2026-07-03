'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Clock, ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    menuItem: {
      name: string;
    };
  }>;
}

export default function CustomerOrdersHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const savedOrdersStr = localStorage.getItem(`orders_${sessionId}`);
    if (!savedOrdersStr) {
      setLoading(false);
      return;
    }

    try {
      const orderIds: string[] = JSON.parse(savedOrdersStr);
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        setLoading(false);
        return;
      }

      const fetchAll = async () => {
        const fetchedList: Order[] = [];
        for (const id of orderIds) {
          try {
            const res = await fetch(`${BACKEND_URL}/api/orders/${id}`);
            if (res.ok) {
              const details = await res.json();
              fetchedList.push(details);
            }
          } catch (e) {
            console.error('Error fetching details for order', id, e);
          }
        }
        fetchedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(fetchedList);
        setLoading(false);
      };

      fetchAll();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar isCustomer={true} />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center space-y-6">
          <div className="h-10 bg-glass-border/30 rounded-xl w-1/3 animate-pulse" />
          <div className="h-40 bg-glass-border/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20">
      <Navbar isCustomer={true} />

      <div className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-brand-orange transition-colors cursor-pointer font-bold uppercase tracking-wider bg-transparent border-0"
          >
            <ArrowLeft className="w-4 h-4" /> Menu
          </button>
          
          <h2 className="font-display font-black text-xl text-fg-primary flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-orange" /> Order History
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="bg-card-bg border border-card-border p-10 rounded-3xl text-center space-y-6 glass-card">
            <ShoppingBag className="w-12 h-12 text-fg-muted mx-auto opacity-75" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-fg-primary uppercase">No Active Tickets</h3>
              <p className="text-xxs text-fg-muted font-light leading-relaxed">
                You haven't placed any order tickets from this table session yet.
              </p>
            </div>
            <button
              onClick={() => router.push('/menu')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Order Food Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const dateStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={ord.id}
                  onClick={() => router.push(`/menu/tracking/${ord.id}`)}
                  className="bg-card-bg border border-card-border hover:border-brand-orange/30 p-5 rounded-2xl glass-card flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] group text-fg-primary"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-sm text-fg-primary">
                        Ticket #{ord.orderNumber || ord.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        ['SERVED', 'PAID', 'CLOSED'].includes(ord.status)
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : ord.status === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-brand-orange/10 text-brand-orange animate-pulse'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-fg-muted font-light flex items-center gap-2">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
                      <span>&bull;</span>
                      <span>{ord.items.reduce((sum, i) => sum + i.quantity, 0)} Items</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-display font-black text-brand-orange block">${ord.totalAmount.toFixed(2)}</span>
                      <span className="text-[9px] text-fg-muted">View Details</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-fg-muted group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
