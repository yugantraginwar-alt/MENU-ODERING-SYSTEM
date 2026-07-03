'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Receipt, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface CartItem {
  quantity: number;
  specialInstructions?: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

function CartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState<string>('');
  const [tableId, setTableId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore Session ID
    let currentSessionId = localStorage.getItem('sessionId');
    if (!currentSessionId) {
      currentSessionId = `sess-${Math.random().toString(36).substring(2, 11)}-${Date.now().toString().slice(-4)}`;
      localStorage.setItem('sessionId', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Restore table ID from search query or local storage
    const tParam = searchParams.get('t') || searchParams.get('tableId') || localStorage.getItem('tableId') || 'demo';
    setTableId(tParam);

    // Restore Cart from localStorage
    const savedCart = localStorage.getItem(`cart_${currentSessionId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
    setLoading(false);
  }, [searchParams]);

  const updateCartInStorage = (newCart: CartItem[]) => {
    setCart(newCart);
    if (sessionId) {
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(newCart));
    }
  };

  const adjustQty = (menuItemId: string, delta: number) => {
    const item = cart.find(i => i.menuItem.id === menuItemId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      updateCartInStorage(cart.filter(i => i.menuItem.id !== menuItemId));
    } else {
      updateCartInStorage(
        cart.map(i => i.menuItem.id === menuItemId ? { ...i, quantity: newQty } : i)
      );
    }
  };

  const removeItem = (menuItemId: string) => {
    updateCartInStorage(cart.filter(i => i.menuItem.id !== menuItemId));
  };

  const handleUpdateInstructions = (menuItemId: string, notes: string) => {
    updateCartInStorage(
      cart.map(i => i.menuItem.id === menuItemId ? { ...i, specialInstructions: notes } : i)
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    let finalTableId = tableId;
    if (!finalTableId || finalTableId === 'demo') {
      try {
        const tableListRes = await fetch(`${BACKEND_URL}/api/tables`);
        if (tableListRes.ok) {
          const list = await tableListRes.json();
          if (list.length > 0) finalTableId = list[0].id;
        }
      } catch (err) {
        console.warn('Could not fetch tables for placeholder order:', err);
      }
    }

    try {
      const orderPayload = {
        tableId: finalTableId || 'mock-table-id-12345',
        sessionId: sessionId,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions || '',
        })),
      };

      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error('Order creation failed');
      const order = await res.json();

      // Save Order to history
      const savedOrdersStr = localStorage.getItem(`orders_${sessionId}`) || '[]';
      const updatedOrders = JSON.parse(savedOrdersStr);
      if (!updatedOrders.includes(order.id)) {
        updatedOrders.push(order.id);
        localStorage.setItem(`orders_${sessionId}`, JSON.stringify(updatedOrders));
      }

      // Clear cart
      updateCartInStorage([]);
      router.push(`/menu/tracking/${order.id}`);
    } catch (err) {
      console.error('Failed to checkout:', err);
      alert("Order placement failed. Running in demo mode: simulating checkout...");
      router.push(`/menu/tracking/demo-tracking-session`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = subtotal * 0.085;
  const serviceCharge = subtotal * 0.10;
  const total = subtotal + tax + serviceCharge;

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

      <div className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/menu')}
            className="flex items-center gap-1 text-xs text-fg-muted hover:text-brand-orange transition-colors cursor-pointer font-bold uppercase tracking-wider bg-transparent border-0"
          >
            <ArrowLeft className="w-4 h-4" /> Menu
          </button>
          
          <h2 className="font-display font-black text-xl text-fg-primary flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-orange" /> Checkout Basket
          </h2>
        </div>

        {cart.length === 0 ? (
          <div className="bg-card-bg border border-card-border p-12 rounded-3xl text-center space-y-6 glass-card">
            <ShoppingBag className="w-16 h-16 text-fg-muted mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-fg-primary uppercase">Your Basket is Empty</h3>
              <p className="text-xxs text-fg-muted font-light leading-relaxed">
                Add delicious food and drinks from our menu to begin your order ticket.
              </p>
            </div>
            <button
              onClick={() => router.push('/menu')}
              className="px-6 py-3 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer border-0"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Basket Items List */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="bg-card-bg border border-card-border p-5 rounded-2xl glass-card space-y-4 text-fg-primary"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-sm block text-fg-primary">{item.menuItem.name}</span>
                      <span className="text-xxs text-brand-orange font-bold font-mono">
                        ${item.menuItem.price.toFixed(2)} each
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-glass-fill border border-glass-border rounded-xl">
                        <button
                          onClick={() => adjustQty(item.menuItem.id, -1)}
                          className="p-2 text-fg-muted hover:text-brand-orange cursor-pointer bg-transparent border-0"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold font-display">{item.quantity}</span>
                        <button
                          onClick={() => adjustQty(item.menuItem.id, 1)}
                          className="p-2 text-fg-muted hover:text-brand-orange cursor-pointer bg-transparent border-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="p-2 rounded-xl text-fg-muted hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer bg-transparent border-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Special Instruction Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-fg-muted uppercase tracking-wider block">
                      Preparation Instructions
                    </label>
                    <input
                      type="text"
                      value={item.specialInstructions || ''}
                      onChange={(e) => handleUpdateInstructions(item.menuItem.id, e.target.value)}
                      placeholder="e.g. No onions, extra spicy, hot honey..."
                      className="w-full text-xxs px-3.5 py-2 bg-glass-fill/10 border border-glass-border focus:border-brand-orange/45 rounded-xl outline-none text-fg-primary font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-6 text-fg-primary text-xs">
              <h3 className="font-display font-extrabold text-sm border-b border-glass-border/10 pb-3 flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-brand-orange" />
                Bill Breakdown
              </h3>

              <div className="space-y-2.5 font-medium">
                <div className="flex justify-between text-xxs text-fg-muted">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xxs text-fg-muted">
                  <span>Tax (8.5% GST):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xxs text-fg-muted">
                  <span>Service charge (10%):</span>
                  <span>${serviceCharge.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-display font-black text-sm text-fg-primary border-t border-glass-border/20 pt-3 mt-3">
                  <span>Order Total:</span>
                  <span className="text-brand-orange">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-glass-border/10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-fg-muted font-light justify-center">
                  <Clock className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Estimated time: ~15m prep time</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-850 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-orange/15 transition-transform active:scale-[0.98] cursor-pointer border-0"
                >
                  {checkoutLoading ? 'Placing Order...' : 'Send Order to Kitchen'}
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function DedicatedCartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <header className="h-18 bg-neutral-950 border-b border-neutral-800" />
        <div className="max-w-2xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center space-y-6">
          <div className="h-10 bg-glass-border/30 rounded-xl w-1/3 animate-pulse" />
          <div className="h-40 bg-glass-border/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}
