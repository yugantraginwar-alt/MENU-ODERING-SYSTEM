'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  ChevronRight,
  Receipt,
  QrCode,
  Flame,
  ChefHat,
  BellRing,
  ShoppingBag,
  Info
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../../components/Navbar';

interface OrderItem {
  id: string;
  quantity: number;
  specialInstructions?: string;
  price: number;
  menuItem: {
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  status: string; // PLACED, ACCEPTED, PREPARING, READY, SERVED, CANCELLED
  totalAmount: number;
  createdAt: string;
  table: {
    number: string;
  };
  items: OrderItem[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const STEPS = [
  { key: 'PLACED', title: 'Order Placed', desc: 'Sent to the kitchen waitlist.', icon: ShoppingBag },
  { key: 'ACCEPTED', title: 'Accepted', desc: 'Maître D\' confirmed order.', icon: CheckCircle },
  { key: 'PREPARING', title: 'Preparing', desc: 'Chef is cooking your dish.', icon: ChefHat },
  { key: 'READY', title: 'Ready', desc: 'Hot and plated at pass.', icon: BellRing },
  { key: 'SERVED', title: 'Served', desc: 'Delivered to your table!', icon: Flame },
];

export default function OrderTracking() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { socket } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo progression state (used only when tracking ID is 'demo-tracking-session')
  const [demoStepIdx, setDemoStepIdx] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    if (orderId === 'demo-tracking-session') {
      // Mock data for demo tracking
      setOrder({
        id: 'demo-tracking-session',
        status: STEPS[demoStepIdx].key,
        totalAmount: 48.72,
        createdAt: new Date().toISOString(),
        table: { number: 'Table 4' },
        items: [
          {
            id: 'item-1',
            quantity: 1,
            specialInstructions: 'Extra cheese, hot honey on side',
            price: 24.50,
            menuItem: {
              name: 'Spicy Calabrian Salami & Honey Pizza',
              imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'item-2',
            quantity: 1,
            specialInstructions: 'No salt on fries please',
            price: 14.00,
            menuItem: {
              name: 'Truffle & Parmesan Pommes Frites',
              imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=80',
            },
          },
        ],
      });
      setLoading(false);
      return;
    }

    // Fetch order details from server
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        console.error('Fetch order error:', err);
        setError('Unable to fetch order status. Check your network or server state.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Listen to real-time events via Socket.io
    if (socket) {
      // Join the table order-specific room
      socket.emit('join_order', orderId);

      socket.on('order_updated', (updatedOrder: Order) => {
        if (updatedOrder.id === orderId) {
          setOrder(updatedOrder);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('order_updated');
      }
    };
  }, [orderId, socket, demoStepIdx]);

  // Demo simulator functions
  const advanceDemoStep = () => {
    if (demoStepIdx < STEPS.length - 1) {
      setDemoStepIdx((prev) => prev + 1);
    }
  };

  const resetDemoStep = () => {
    setDemoStepIdx(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center space-y-6">
          <div className="h-10 bg-glass-border/30 rounded-xl w-1/3 animate-pulse" />
          <div className="h-40 bg-glass-border/20 rounded-2xl animate-pulse" />
          <div className="h-56 bg-glass-border/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
          <Info className="w-12 h-12 text-brand-orange mx-auto opacity-80" />
          <h2 className="text-xl font-bold">Order not found</h2>
          <p className="text-xs text-fg-muted font-light">{error || 'The requested order details could not be parsed.'}</p>
          <button
            onClick={() => router.push('/menu?tableId=demo')}
            className="px-6 py-3 rounded-xl bg-brand-orange text-white font-semibold shadow-lg hover:scale-105 transition-transform"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Get current step index from order status
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Tracking Left: Progress Stepper */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative overflow-hidden">
            {/* Overlay glow on top of status screen */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-glass-border/10 pb-4 mb-6">
              <div>
                <span className="text-xxs uppercase tracking-widest text-fg-muted">Order ID: #{order.id.slice(-6)}</span>
                <h2 className="text-xl font-display font-extrabold mt-0.5">Tracking Status</h2>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold flex items-center space-x-1.5">
                <QrCode className="w-4 h-4" />
                <span>{order.table.number}</span>
              </div>
            </div>

            {/* Stepper Timeline UI */}
            <div className="space-y-6 relative">
              {/* Stepper Connecting Line (Vertical) */}
              <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-glass-border/30" />
              {/* Completed connecting line highlight */}
              <div
                className="absolute left-[23px] top-6 w-0.5 bg-brand-orange transition-all duration-700 ease-out"
                style={{
                  height: currentStepIndex >= 0 ? `${(currentStepIndex / (STEPS.length - 1)) * 90}%` : '0%',
                }}
              />

              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                return (
                  <div key={step.key} className="flex gap-4 relative items-start group">
                    {/* Step circle */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                        isActive
                          ? 'bg-brand-orange border-brand-orange text-white pulse-glow scale-105'
                          : isCompleted
                          ? 'bg-brand-orange/10 border-brand-orange text-brand-orange'
                          : 'bg-card-bg border-glass-border text-fg-muted'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>

                    {/* Step details */}
                    <div className="flex-1 pt-1.5">
                      <h3
                        className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                          isActive ? 'text-brand-orange font-extrabold' : 'text-fg-primary'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-xxs text-fg-muted font-light mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    {/* Check icon for finished states */}
                    {isCompleted && (
                      <div className="pt-2 text-brand-orange">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviewer simulation console (shown ONLY on demo session link!) */}
          {orderId === 'demo-tracking-session' && (
            <div className="bg-glass-fill border border-brand-orange/30 p-6 rounded-2xl space-y-4">
              <h3 className="font-display font-bold text-sm text-brand-orange flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5" /> Client Review Console
              </h3>
              <p className="text-xs text-fg-muted leading-relaxed font-light">
                Since this is a demo order tracking link, you can push the kitchen preparation steps manually to test the timeline changes and animations.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={advanceDemoStep}
                  disabled={demoStepIdx === STEPS.length - 1}
                  className="px-4 py-2 bg-brand-orange disabled:bg-neutral-700 text-white rounded-lg text-xs font-semibold hover:scale-105 transition-transform"
                >
                  Advance Step
                </button>
                <button
                  onClick={resetDemoStep}
                  className="px-4 py-2 border border-glass-border rounded-lg text-xs hover:bg-glass-fill transition-colors"
                >
                  Reset Status
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tracking Right: Order Summary Details */}
        <div className="space-y-6">
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4">
            <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3 flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-brand-orange" /> Order Summary
            </h3>

            {/* Items scroll */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {order.items.map((item) => (
                <div key={item.id} className="text-xs border-b border-glass-border/5 pb-3 last:border-b-0 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-fg-primary pr-2">
                      {item.menuItem.name} <span className="text-brand-orange font-bold font-display">&times;{item.quantity}</span>
                    </span>
                    <span className="text-fg-primary flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.specialInstructions && (
                    <p className="text-xxs text-brand-orange italic font-light">
                      Notes: "{item.specialInstructions}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Math recap */}
            <div className="border-t border-glass-border/20 pt-4 space-y-2 text-xs">
              <div className="flex justify-between font-display font-extrabold text-sm text-fg-primary">
                <span>Paid (Inclusive of tax)</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Dining guidelines */}
          <div className="bg-glass-fill/10 border border-glass-border p-5 rounded-2xl space-y-3">
            <h4 className="font-display font-bold text-xs text-fg-primary">Dining Guidelines</h4>
            <ul className="text-xxs text-fg-muted font-light leading-relaxed space-y-2 list-disc pl-4">
              <li>Need another item? Simply scan the QR code again to add to your order.</li>
              <li>Waiters are tracking this dashboard. Need assistance? Wave at staff station.</li>
              <li>All payments are securely handled online or at counter checkout.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
