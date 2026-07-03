'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Info,
  Star,
  MessageSquare,
  Plus,
  RotateCcw,
  DollarSign,
  Check,
  CheckCircle2,
  Utensils,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useSocket } from '@/store/SocketContext';
import Navbar from '@/components/Navbar';

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
  orderNumber?: string;
  status: string; // PLACED, ACCEPTED, PREPARING, READY, SERVED, CANCELLED, PAID, CLOSED
  paymentStatus: string; // UNPAID, PAID, etc.
  totalAmount: number;
  createdAt: string;
  table: {
    id?: string;
    number: string;
  };
  tableId?: string;
  restaurant?: {
    name: string;
    logoUrl?: string;
  };
  items: OrderItem[];
  // Enriched fields from backend queue
  queuePosition?: number;
  queueLength?: number;
  chefAssigned?: string;
  estimatedPrepTime?: number;
  estimatedServingTime?: number;
  estimatedTimeRemaining?: number;
  progressPercent?: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'ready' | 'delivery' | 'bill';
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const STEPS = [
  { key: 'PLACED', title: 'Order Placed', desc: 'Your order has been successfully received.', icon: ShoppingBag },
  { key: 'ACCEPTED', title: 'Accepted', desc: 'The kitchen has accepted your order.', icon: CheckCircle2 },
  { key: 'PREPARING', title: 'Preparing', desc: 'Our chefs are preparing your meal.', icon: ChefHat },
  { key: 'READY', title: 'Ready', desc: 'Waiting...', icon: BellRing },
  { key: 'SERVED', title: 'Served', desc: 'Waiting...', icon: Flame },
];

const ROTATING_MESSAGES = [
  "Our chefs are preparing your meal.",
  "Using fresh, locally sourced ingredients.",
  "Your order is handcrafted with love by our expert culinary team.",
  "Almost ready - setting up the pass for pick-up.",
  "Thank you for dining with us today!"
];

export default function OrderTracking() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { socket } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rotating messages state
  const [messageIndex, setMessageIndex] = useState(0);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Track previous status to detect transitions for toasts
  const prevStatusRef = useRef<string | null>(null);

  // Rating and feedback modal state (UI only)
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Demo progression state (used only when tracking ID is 'demo-tracking-session')
  const [demoStepIdx, setDemoStepIdx] = useState(0);
  const [demoQueuePos, setDemoQueuePos] = useState(4);
  const [demoQueueLen, setDemoQueueLen] = useState(9);
  const [demoTimeRemaining, setDemoTimeRemaining] = useState(18);
  const [demoChef, setDemoChef] = useState('Chef Sophia');

  // Add toast helper
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Rotate friendly messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 4500);
    return () => clearInterval(msgInterval);
  }, []);

  // Fetch / Setup Order
  useEffect(() => {
    if (!orderId) return;

    if (orderId === 'demo-tracking-session') {
      const currentKey = STEPS[demoStepIdx].key;
      let progressVal = 15;
      if (demoStepIdx === 1) progressVal = 35;
      else if (demoStepIdx === 2) progressVal = 68;
      else if (demoStepIdx === 3) progressVal = 90;
      else if (demoStepIdx === 4) progressVal = 100;

      // Mock data for demo tracking
      setOrder({
        id: 'demo-tracking-session',
        orderNumber: 'ORD-DEMO-2026',
        status: currentKey,
        paymentStatus: 'UNPAID',
        totalAmount: 48.72,
        createdAt: new Date().toISOString(),
        table: { number: 'Table 12' },
        tableId: 'demo',
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
        queuePosition: demoQueuePos,
        queueLength: demoQueueLen,
        chefAssigned: `${demoChef} 👨🍳`,
        estimatedPrepTime: 20,
        estimatedServingTime: 23,
        estimatedTimeRemaining: demoTimeRemaining,
        progressPercent: progressVal
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
  }, [orderId, socket, demoStepIdx, demoQueuePos, demoQueueLen, demoTimeRemaining, demoChef]);

  // Effect to trigger toasts on status change (handles both demo and live modes!)
  useEffect(() => {
    if (!order) return;
    const currentStatus = order.status;
    const prevStatus = prevStatusRef.current;

    if (prevStatus && prevStatus !== currentStatus) {
      // Status transition toasts
      if (currentStatus === 'ACCEPTED') {
        addToast('✅ Kitchen accepted your order.', 'success');
      } else if (currentStatus === 'PREPARING') {
        addToast('👨🍳 Your meal is being prepared.', 'info');
      } else if (currentStatus === 'READY') {
        addToast('🍽️ Your food is ready.', 'ready');
        setTimeout(() => {
          addToast('🙋 Waiter is bringing your food.', 'delivery');
        }, 1200);
      } else if (currentStatus === 'SERVED' || currentStatus === 'PAID' || currentStatus === 'CLOSED') {
        addToast('🎉 Enjoy your meal!', 'success');
      }
    }
    prevStatusRef.current = currentStatus;
  }, [order?.status]);

  // Demo simulator handlers
  const advanceDemoStep = () => {
    if (demoStepIdx < STEPS.length - 1) {
      const nextIdx = demoStepIdx + 1;
      setDemoStepIdx(nextIdx);

      // Adjust queue indicators to show real-time changes
      if (nextIdx === 1) {
        setDemoQueuePos(3);
        setDemoQueueLen(8);
        setDemoTimeRemaining(12);
        setDemoChef('Chef Marco');
      } else if (nextIdx === 2) {
        setDemoQueuePos(2);
        setDemoQueueLen(7);
        setDemoTimeRemaining(8);
        setDemoChef('Chef Marco');
      } else if (nextIdx === 3) {
        setDemoQueuePos(0);
        setDemoQueueLen(0);
        setDemoTimeRemaining(0);
        setDemoChef('Chef Marco');
      } else if (nextIdx === 4) {
        setDemoQueuePos(0);
        setDemoQueueLen(0);
        setDemoTimeRemaining(0);
        setDemoChef('Chef Marco');
      }
    }
  };

  const adjustQueueSimulator = (posChange: number, lenChange: number) => {
    setDemoQueuePos((prev) => Math.max(1, prev + posChange));
    setDemoQueueLen((prev) => Math.max(1, prev + lenChange));
    setDemoTimeRemaining((prev) => Math.max(1, prev + (posChange * 3)));
    addToast('⚡ Live kitchen queue layout shifted!', 'info');
  };

  const resetDemoStep = () => {
    setDemoStepIdx(0);
    setDemoQueuePos(4);
    setDemoQueueLen(9);
    setDemoTimeRemaining(18);
    setDemoChef('Chef Sophia');
  };

  // Request Bill Button Handler
  const handleRequestBill = () => {
    if (!order) return;
    const tableNum = order.table?.number || 'Table';
    
    if (socket) {
      socket.emit('customer_request', {
        tableId: order.tableId || order.table?.id || 'demo',
        tableNumber: tableNum,
        type: 'Bill',
        timestamp: new Date().toISOString(),
      });
      addToast('💳 Bill is on the way.', 'bill');
    } else {
      // Mock / fallback trigger for demo mode
      addToast('💳 Bill is on the way.', 'bill');
    }
  };

  const handleRateExperience = () => {
    setFeedbackSubmitted(false);
    setShowRatingModal(true);
  };

  const submitRatingFeedback = () => {
    setFeedbackSubmitted(true);
    addToast('⭐ Thank you for your rating!', 'success');
    setTimeout(() => {
      setShowRatingModal(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar isCustomer={true} tableNumber="Loading..." />
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
        <Navbar isCustomer={true} tableNumber="Error" />
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
  const isCancelled = order.status === 'CANCELLED';
  const progressPercent = order.progressPercent ?? 15;

  const restaurantLogoUrl = order.restaurant?.logoUrl || '';
  const restaurantName = order.restaurant?.name || "L'Ardoise Bistro";
  const isOrderReady = order.status === 'READY';
  const isOrderServed = ['SERVED', 'PAID', 'CLOSED'].includes(order.status);

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20 relative">
      {/* CSS Animation Injector */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { transform: translate3d(120%, 0, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pulse-ring {
          box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.6);
          animation: pulse-ring 1.8s cubic-bezier(0.66, 0, 0, 1) infinite;
        }
        @keyframes pulse-ring {
          to {
            box-shadow: 0 0 0 14px rgba(255, 107, 53, 0);
          }
        }
        .pulse-green {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: pulse-green 1.8s cubic-bezier(0.66, 0, 0, 1) infinite;
        }
        @keyframes pulse-green {
          to {
            box-shadow: 0 0 0 14px rgba(16, 185, 129, 0);
          }
        }
        @keyframes fadeInMove {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-move {
          animation: fadeInMove 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Floating Toast Notification Hub */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-in pointer-events-auto p-4 rounded-xl shadow-xl flex items-start gap-3 border backdrop-blur-md glass-panel ${
              t.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-100'
                : t.type === 'ready'
                ? 'border-amber-500/30 bg-amber-950/80 text-amber-100'
                : t.type === 'delivery'
                ? 'border-indigo-500/30 bg-indigo-950/80 text-indigo-100'
                : t.type === 'bill'
                ? 'border-yellow-500/30 bg-yellow-950/80 text-yellow-100'
                : 'border-brand-orange/30 bg-orange-950/80 text-orange-100'
            }`}
          >
            <div className="text-lg">
              {t.type === 'success' && '✅'}
              {t.type === 'ready' && '🍽️'}
              {t.type === 'delivery' && '🙋'}
              {t.type === 'bill' && '💳'}
              {t.type === 'info' && '👨🍳'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-wide">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      <Navbar isCustomer={true} tableNumber={order.table?.number} tableId={order.tableId || 'demo'} />

      {/* Hero Header Area */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Restaurant details */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-glass-border flex items-center justify-center overflow-hidden p-1 shadow-md">
              {restaurantLogoUrl ? (
                <img src={restaurantLogoUrl} alt={restaurantName} className="object-contain max-h-full max-w-full rounded-lg" />
              ) : (
                <Utensils className="w-6 h-6 text-brand-orange" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-fg-muted uppercase tracking-widest">Live Tracker</span>
              <h1 className="text-xl font-display font-black tracking-tight text-fg-primary">{restaurantName}</h1>
              <p className="text-xs font-medium text-brand-orange mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
                Dining at {order.table?.number}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 md:gap-8 border-t md:border-t-0 md:border-l border-glass-border/10 pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
            <div>
              <span className="text-[10px] text-fg-muted uppercase block tracking-wider font-semibold">Order Number</span>
              <span className="text-sm font-display font-black text-fg-primary">#{order.orderNumber || order.id.slice(-6)}</span>
            </div>
            <div>
              <span className="text-[10px] text-fg-muted uppercase block tracking-wider font-semibold">Prep / Serving</span>
              <span className="text-sm font-display font-bold text-fg-primary">
                {order.estimatedPrepTime || 15}m / {order.estimatedServingTime || 18}m
              </span>
            </div>
            <div>
              <span className="text-[10px] text-fg-muted uppercase block tracking-wider font-semibold">Payment</span>
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 mt-1 rounded-full ${
                order.paymentStatus === 'PAID' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-yellow-500/10 text-brand-orange border border-brand-orange/20'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Large SUCCESS: Order Ready Screen */}
          {isOrderReady && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-2xl text-center relative overflow-hidden animate-fade-in-move">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4 pulse-ring">
                <Utensils className="w-8 h-8 text-white animate-bounce" />
              </div>
              <h2 className="text-2xl font-display font-black text-brand-orange">Your Order Is Ready!</h2>
              <p className="text-sm text-fg-primary mt-2">
                Your waiter is bringing your food to <span className="font-bold underline">{order.table?.number}</span>.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-fg-muted bg-card-bg/60 border border-glass-border px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>Plated fresh and ready at the kitchen pass</span>
              </div>
            </div>
          )}

          {/* Large SUCCESS: Order Served Screen */}
          {isOrderServed && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-3xl text-center relative overflow-hidden animate-fade-in-move">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 pulse-green">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400">🎉 Enjoy Your Meal!</h2>
              <p className="text-xs text-fg-muted mt-2">We hope you enjoy your dine-in experience. How was everything?</p>

              {/* Meal Finished Actions Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleRateExperience}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Star className="w-4 h-4" /> Rate Experience
                </button>
                <button
                  onClick={handleRateExperience}
                  className="px-4 py-3 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Leave Feedback
                </button>
                <button
                  onClick={() => router.push(`/menu?tableId=${order.tableId || 'demo'}`)}
                  className="px-4 py-3 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-semibold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Order More
                </button>
                <button
                  onClick={handleRequestBill}
                  className="px-4 py-3 border border-brand-orange/30 hover:bg-brand-orange/10 text-brand-orange rounded-xl text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" /> Request Bill
                </button>
              </div>
            </div>
          )}

          {/* PROGRESS INDICATORS PANEL */}
          {!isCancelled && !isOrderServed && (
            <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-6">
              
              {/* Horizontal Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-fg-muted uppercase tracking-wider">Overall Order Progress</h3>
                  <span className="text-xs font-display font-black text-brand-orange">{progressPercent}%</span>
                </div>

                <div className="relative w-full h-3 bg-glass-border/30 rounded-full overflow-visible py-0.5">
                  {/* Progress Line */}
                  <div
                    className="absolute top-0.5 left-0 h-2 bg-brand-orange rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {/* Process Milestones Dots */}
                  <div className="absolute inset-0 flex justify-between px-0.5 pointer-events-none items-center">
                    {STEPS.map((s, idx) => {
                      const isDone = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div
                          key={s.key}
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-600' 
                              : isCurrent 
                              ? 'bg-brand-orange border-white pulse-ring scale-110' 
                              : 'bg-card-bg border-glass-border'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Progress labels */}
                <div className="flex justify-between text-[10px] text-fg-muted font-bold uppercase tracking-wider mt-3">
                  <span>Placed</span>
                  <span>Accepted</span>
                  <span>Preparing</span>
                  <span>Ready</span>
                  <span>Served</span>
                </div>
              </div>

              {/* Rotating Friendly Messages */}
              <div className="border-t border-glass-border/10 pt-4 flex items-center justify-center">
                <div className="flex items-center gap-2 py-2 px-6 bg-glass-fill border border-glass-border rounded-xl">
                  <Sparkles className="w-4 h-4 text-brand-orange animate-spin" style={{ animationDuration: '4s' }} />
                  <p key={messageIndex} className="text-xs text-fg-muted font-medium animate-fade-in-move">
                    "{ROTATING_MESSAGES[messageIndex]}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VERTICAL TIMELINE SCREEN */}
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card relative">
            <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-4 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-orange" />
              Order Stages
            </h3>

            {/* Stepper Timeline UI */}
            <div className="space-y-8 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-glass-border/20" />
              {/* Highlight completed connecting line */}
              <div
                className="absolute left-[23px] top-6 w-0.5 bg-brand-orange transition-all duration-700 ease-out"
                style={{
                  height: currentStepIndex >= 0 ? `${(Math.min(currentStepIndex, STEPS.length - 1) / (STEPS.length - 1)) * 92}%` : '0%',
                }}
              />

              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                let stateColor = 'bg-card-bg border-glass-border text-fg-muted';
                let iconColor = 'text-fg-muted';
                let pulseClass = '';

                if (isActive) {
                  stateColor = 'bg-brand-orange border-brand-orange text-white scale-105';
                  iconColor = 'text-white';
                  pulseClass = 'pulse-ring';
                } else if (isCompleted) {
                  stateColor = 'bg-emerald-500/10 border-emerald-500 text-emerald-500';
                  iconColor = 'text-emerald-500';
                }

                return (
                  <div key={step.key} className="flex gap-5 relative items-start animate-fade-in-move">
                    {/* Circle icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${stateColor} ${pulseClass}`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Step details */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-bold tracking-tight transition-colors duration-300 ${
                          isActive ? 'text-brand-orange font-black text-base' : 'text-fg-primary'
                        }`}>
                          {step.key === 'PLACED' ? '🟢 Order Placed' :
                           step.key === 'ACCEPTED' ? '🟢 Accepted' :
                           step.key === 'PREPARING' ? '🟡 Preparing' :
                           step.key === 'READY' ? '⚪ Ready' : '⚪ Served'}
                        </h4>
                        {isActive && (
                          <span className="text-[9px] font-bold bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xxs text-fg-muted font-light mt-0.5 leading-relaxed">
                        {step.key === 'PLACED' && '✓ Your order has been successfully received.'}
                        {step.key === 'ACCEPTED' && '✓ The kitchen has accepted your order.'}
                        {step.key === 'PREPARING' && '👨🍳 Our chefs are preparing your meal.'}
                        {step.key === 'READY' && (order.status === 'READY' || isOrderServed ? '✓ Plated and ready at the pass.' : 'Waiting...')}
                        {step.key === 'SERVED' && (isOrderServed ? '✓ Order has been delivered to your table.' : 'Waiting...')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">

          {/* LIVE KITCHEN QUEUE CARD */}
          {!isOrderServed && !isCancelled && (
            <div className="bg-gradient-to-br from-neutral-900 to-black border border-brand-orange/20 p-6 rounded-2xl shadow-xl space-y-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" /> Kitchen Live Queue
                </h4>
                <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-md font-semibold">
                  Queue Active
                </span>
              </div>

              <div className="space-y-4 text-xs font-light">
                
                {/* Queue position */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-white/60">Queue Position:</span>
                  <span className="font-display font-black text-sm text-white">
                    {order.queuePosition && order.queuePosition > 0 
                      ? `${order.queuePosition} of ${order.queueLength || 7} Orders`
                      : 'Next In Pass 🍽️'}
                  </span>
                </div>

                {/* Chef Assigned */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-white/60">Chef Assigned:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    {order.chefAssigned || 'Chef Marco 👨🍳'}
                  </span>
                </div>

                {/* Time remaining */}
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-white/60">Estimated Time Remaining:</span>
                  <span className="font-display font-black text-sm text-brand-orange">
                    {order.estimatedTimeRemaining && order.estimatedTimeRemaining > 0 
                      ? `${order.estimatedTimeRemaining} Minutes` 
                      : '0 Minutes'}
                  </span>
                </div>

                {/* Micro visual progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-white/55 uppercase font-bold tracking-wider">
                    <span>Overall Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ORDER SUMMARY */}
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl glass-card space-y-4">
            <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3 flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-brand-orange" />
              Order Summary
            </h3>

            {/* Items scroll */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {order.items?.map((item) => (
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

          {/* DINING GUIDELINES */}
          <div className="bg-glass-fill/10 border border-glass-border p-5 rounded-2xl space-y-3">
            <h4 className="font-display font-bold text-xs text-fg-primary">Dining Guidelines</h4>
            <ul className="text-xxs text-fg-muted font-light leading-relaxed space-y-2 list-disc pl-4">
              <li>Need another item? Simply scan the QR code again to add to your order.</li>
              <li>Waiters are tracking this dashboard. Need assistance? Wave at staff station.</li>
              <li>All payments are securely handled online or at counter checkout.</li>
            </ul>
          </div>

          {/* CLIENT SIMULATION CONSOLE (Shown only on demo link) */}
          {orderId === 'demo-tracking-session' && (
            <div className="bg-glass-fill border border-brand-orange/30 p-6 rounded-2xl space-y-4">
              <h3 className="font-display font-bold text-sm text-brand-orange flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 animate-spin" style={{ animationDuration: '8s' }} /> Client Review Console
              </h3>
              <p className="text-xxs text-fg-muted leading-relaxed font-light">
                Since this is a demo order tracking link, you can push the kitchen preparation steps manually to test the timeline changes, progress bars, success cards, and realtime toast notifications.
              </p>
              
              <div className="space-y-3 border-t border-glass-border/10 pt-3">
                <div className="flex gap-2">
                  <button
                    onClick={advanceDemoStep}
                    disabled={demoStepIdx === STEPS.length - 1}
                    className="flex-1 px-3 py-2 bg-brand-orange disabled:bg-neutral-700 text-white rounded-lg text-xs font-semibold hover:scale-105 active:scale-95 transition-transform"
                  >
                    Advance Step
                  </button>
                  <button
                    onClick={resetDemoStep}
                    className="px-3 py-2 border border-glass-border rounded-lg text-xs hover:bg-glass-fill transition-colors"
                  >
                    Reset Status
                  </button>
                </div>

                {/* Queue simulation controller */}
                {demoStepIdx < 3 && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-fg-muted uppercase tracking-wider block">
                      Queue Position Simulator
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => adjustQueueSimulator(-1, -1)}
                        disabled={demoQueuePos <= 1}
                        className="flex-1 py-1 bg-white/5 border border-glass-border text-white text-[10px] rounded hover:bg-white/10 active:scale-95 transition-all"
                      >
                        -1 Order Ahead
                      </button>
                      <button
                        onClick={() => adjustQueueSimulator(1, 1)}
                        className="flex-1 py-1 bg-white/5 border border-glass-border text-white text-[10px] rounded hover:bg-white/10 active:scale-95 transition-all"
                      >
                        +1 Order Ahead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RATING & FEEDBACK MODAL (UI Only) */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-bg border border-card-border p-6 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl glass-card animate-fade-in-move">
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-display font-black text-fg-primary">Rate Your Experience</h3>
              <p className="text-xs text-fg-muted">Your feedback helps us provide the finest culinary service.</p>
            </div>

            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-fg-primary">Feedback Submitted!</h4>
                <p className="text-xxs text-fg-muted">Thank you for sharing your thoughts with us.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stars select */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform active:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-neutral-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Text comment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">Comments</label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us about the food, service, or ambiance..."
                    className="w-full text-xs p-3 bg-glass-fill border border-glass-border rounded-xl focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl outline-none h-20 resize-none text-fg-primary"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 py-2.5 border border-glass-border text-fg-primary rounded-xl text-xs font-semibold hover:bg-glass-fill transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRatingFeedback}
                    className="flex-1 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-semibold hover:bg-brand-orange-hover shadow-md transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
