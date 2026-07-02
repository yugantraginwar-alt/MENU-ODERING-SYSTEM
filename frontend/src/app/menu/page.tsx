'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  MessageSquare,
  QrCode,
  AlertTriangle,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import Navbar from '../../components/Navbar';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  menuItems: MenuItem[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function DigitalMenu() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col justify-center items-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-orange/20 animate-spin border-t-2 border-brand-orange" />
          <span className="text-xs text-fg-muted font-semibold tracking-wide">Syncing digital menu...</span>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // States
  const [tableId, setTableId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('Demo Table');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Active instructions item
  const [editingInstructionsIdx, setEditingInstructionsIdx] = useState<number | null>(null);
  const [tempInstructions, setTempInstructions] = useState('');

  // Categories ref for scrolling
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Get table ID from URL query parameters
    const tId = searchParams.get('tableId') || '';
    setTableId(tId);
    
    // Fetch Menu and Table info
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch table details if id is not demo
        if (tId && tId !== 'demo') {
          const tableRes = await fetch(`${BACKEND_URL}/api/tables/${tId}`);
          if (tableRes.ok) {
            const tableData = await tableRes.json();
            setTableName(tableData.number);
          }
        }

        // Fetch categories
        const catRes = await fetch(`${BACKEND_URL}/api/categories`);
        if (!catRes.ok) throw new Error('Failed to fetch categories');
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) {
          setSelectedCategory(catData[0].id);
        }
      } catch (err: any) {
        console.error('Fetch error, using seed fallbacks:', err);
        // Fallback seed data in case backend isn't up
        const mockCategories: Category[] = [
          {
            id: 'c1',
            name: 'Starters & Small Plates',
            description: 'Curated appetizers to awaken your palate',
            menuItems: [
              {
                id: 'm1',
                name: 'Truffle & Parmesan Pommes Frites',
                description: 'Crispy hand-cut fries, white truffle oil, grated Parmigiano-Reggiano, fresh rosemary dust.',
                price: 14.00,
                imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
                isVeg: true,
                isAvailable: true,
                categoryId: 'c1'
              },
              {
                id: 'm2',
                name: 'Crispy Calamari Fritti',
                description: 'Lightly dusted calamari, dynamic saffron aioli, charred lemon wedges, micro-cilantro.',
                price: 19.00,
                imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
                isVeg: false,
                isAvailable: true,
                categoryId: 'c1'
              },
              {
                id: 'm3',
                name: 'Heirloom Burrata Caprese',
                description: 'Creamy burrata pugliese, organic heirloom tomatoes, basil pistou, aged dark balsamic pearls.',
                price: 18.50,
                imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=600&auto=format&fit=crop&q=80',
                isVeg: true,
                isAvailable: true,
                categoryId: 'c1'
              }
            ]
          },
          {
            id: 'c2',
            name: 'Artisanal Mains',
            description: 'Premium locally sourced entrees',
            menuItems: [
              {
                id: 'm4',
                name: 'Dry-Aged Wagyu Ribeye',
                description: '12oz Australian Wagyu BMS 7+, compound bone marrow butter, roasted heritage root vegetables, red wine jus.',
                price: 68.00,
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
                isVeg: false,
                isAvailable: true,
                categoryId: 'c2'
              },
              {
                id: 'm5',
                name: 'Pan-Seared Atlantic Chilean Seabass',
                description: 'Chilean seabass filet, ginger-infused dashi broth, braised baby bok choy, wild black rice.',
                price: 46.00,
                imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
                isVeg: false,
                isAvailable: true,
                categoryId: 'c2'
              }
            ]
          },
          {
            id: 'c3',
            name: 'Wood-Fired Pizzas',
            description: 'Naturally fermented 48-hour sourdough crust',
            menuItems: [
              {
                id: 'm6',
                name: 'Margherita D.O.C.',
                description: 'San Marzano tomatoes, fresh fior di latte mozzarella, organic basil, extra virgin olive oil drizzle.',
                price: 21.00,
                imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
                isVeg: true,
                isAvailable: true,
                categoryId: 'c3'
              },
              {
                id: 'm7',
                name: 'Spicy Calabrian Salami & Honey',
                description: 'San Marzano base, fior di latte, hot Calabrian soppressata, dynamic organic hot honey.',
                price: 24.50,
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
                isVeg: false,
                isAvailable: true,
                categoryId: 'c3'
              }
            ]
          }
        ];
        setCategories(mockCategories);
        setSelectedCategory(mockCategories[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Cart operations
  const getCartQuantity = (itemId: string) => {
    const item = cart.find((c) => c.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [...prev, { menuItem, quantity: 1, specialInstructions: '' }];
      }
    });
  };

  const removeFromCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((c) => c.menuItem.id !== menuItem.id);
      } else {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
    });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.menuItem.id === itemId ? { ...c, quantity: qty } : c))
      );
    }
  };

  const handleOpenInstructions = (idx: number) => {
    setEditingInstructionsIdx(idx);
    setTempInstructions(cart[idx].specialInstructions);
  };

  const handleSaveInstructions = () => {
    if (editingInstructionsIdx !== null) {
      setCart((prev) =>
        prev.map((c, i) =>
          i === editingInstructionsIdx
            ? { ...c, specialInstructions: tempInstructions }
            : c
        )
      );
      setEditingInstructionsIdx(null);
    }
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const taxRate = 8.5; // percentage
  const serviceChargeRate = 10.0; // percentage
  const taxAmount = subtotal * (taxRate / 100);
  const serviceAmount = subtotal * (serviceChargeRate / 100);
  const totalAmount = subtotal + taxAmount + serviceAmount;
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filter menu items
  const filteredCategories = categories.map((cat) => {
    const items = cat.menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = !vegOnly || item.isVeg;
      return matchesSearch && matchesVeg;
    });
    return { ...cat, menuItems: items };
  }).filter((cat) => cat.menuItems.length > 0);

  const scrollToCategory = (catId: string) => {
    setSelectedCategory(catId);
    const element = categoryRefs.current[catId];
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    
    // Fallback: If table ID isn't set, we create a mock table or use a fallback mock table ID
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
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions,
        })),
      };

      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error('Order creation failed');
      const order = await res.json();
      
      // Clear cart
      setCart([]);
      setCartOpen(false);

      // Redirect to Order Tracking page
      router.push(`/order/${order.id}`);
    } catch (err) {
      console.error('Failed to checkout:', err);
      // Fallback checkout redirect (Demo simulation)
      alert("Demo Mode: Checkout simulation active! Redirecting to live tracking console...");
      router.push(`/order/demo-tracking-session`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12 w-full space-y-8 flex-1 flex flex-col justify-center">
          {/* Skeleton Loaders */}
          <div className="h-10 bg-glass-border/30 rounded-xl w-1/3 animate-pulse" />
          <div className="h-14 bg-glass-border/30 rounded-2xl w-full animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-glass-border/20 rounded-3xl animate-pulse" />
            <div className="h-64 bg-glass-border/20 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-24 relative">
      <Navbar />

      {/* Floating Cart Button (Sticky bottom right) */}
      {totalCartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-4.5 rounded-full shadow-2xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 glow-orange font-semibold"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2.5 -right-3 bg-white text-brand-orange text-xxs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-brand-orange">
              {totalCartCount}
            </span>
          </div>
          <span>View Cart</span>
          <span>&middot;</span>
          <span>${totalAmount.toFixed(2)}</span>
        </button>
      )}

      {/* Hero Banner / Table Info */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold mb-4">
          <QrCode className="w-3.5 h-3.5" />
          <span>Active Session: {tableName}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
          L'Ardoise Menu
        </h1>
        <p className="text-sm text-fg-muted font-light mt-1">
          Handcrafted French bistronomy, freshly prepared.
        </p>
      </div>

      {/* Search & Veg Filter Row */}
      <div className="sticky top-20 z-20 w-full bg-bg-primary/95 backdrop-blur-md border-b border-glass-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
            <input
              type="text"
              placeholder="Search dishes (truffle, steak, burrata...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Veg/Non-Veg Filter */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <span className="text-xs text-fg-muted font-medium">Vegetarian only</span>
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                vegOnly ? 'bg-brand-orange' : 'bg-glass-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  vegOnly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Category Tab Bar */}
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto flex space-x-2 pb-3 select-none scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/15 scale-[1.02]'
                  : 'bg-glass-fill text-fg-muted border-glass-border hover:border-glass-border-dark'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Categories List */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-glass-fill border border-glass-border/30 rounded-3xl space-y-4">
            <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto" />
            <h3 className="text-lg font-bold">No dishes matching filters</h3>
            <p className="text-xs text-fg-muted max-w-xs mx-auto font-light">
              Try updating your search string or toggling off the vegetarian switch.
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.id] = el;
              }}
              className="space-y-6 scroll-mt-36"
            >
              <div className="border-b border-glass-border/20 pb-4">
                <h2 className="text-xl font-display font-extrabold tracking-tight text-fg-primary">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs text-fg-muted font-light mt-1">{cat.description}</p>
                )}
              </div>

              {/* Menu items card layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cat.menuItems.map((item) => {
                  const q = getCartQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-card-bg border border-card-border p-5 rounded-2xl flex gap-5 glass-card relative overflow-hidden group hover:border-brand-orange/20"
                    >
                      {/* Veg indicator badge */}
                      <span
                        className={`absolute top-4 left-4 z-10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          item.isVeg
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {item.isVeg ? 'Veg' : 'Meat'}
                      </span>

                      {/* Item Image */}
                      {item.imageUrl && (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 relative">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Content details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-bold text-base tracking-tight text-fg-primary group-hover:text-brand-orange transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-fg-muted font-light mt-1.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className="font-display font-extrabold text-base text-fg-primary">
                            ${item.price.toFixed(2)}
                          </span>

                          {/* Add button / stepper */}
                          {q > 0 ? (
                            <div className="flex items-center space-x-2.5 bg-glass-fill border border-glass-border px-2.5 py-1.5 rounded-xl">
                              <button
                                onClick={() => removeFromCart(item)}
                                className="p-1 hover:text-brand-orange rounded transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-display font-bold text-xs w-4 text-center">
                                {q}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="p-1 hover:text-brand-orange rounded transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-2 text-xs font-bold rounded-xl border border-glass-border bg-glass-fill hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Drawer Backing Overlay */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Cart Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 bg-card-bg border-l border-card-border shadow-2xl flex flex-col justify-between transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-glass-border/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShoppingCart className="w-5 h-5 text-brand-orange" />
            <h2 className="font-display font-extrabold text-lg">Your Cart</h2>
            <span className="text-xs bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded-full font-bold">
              {totalCartCount} items
            </span>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1.5 rounded-lg hover:bg-glass-fill text-fg-muted hover:text-fg-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Item list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-fg-muted space-y-4">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-light">Your shopping cart is empty.</p>
              <button
                onClick={() => setCartOpen(false)}
                className="text-xs text-brand-orange font-semibold hover:underline"
              >
                Go browse dishes
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.menuItem.id} className="space-y-2 border-b border-glass-border/10 pb-5">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-sm leading-tight text-fg-primary">
                      {item.menuItem.name}
                    </h4>
                    <span className="text-xs text-fg-muted font-bold block mt-1">
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 bg-glass-fill border border-glass-border px-2 py-1 rounded-lg self-start">
                    <button
                      onClick={() => removeFromCart(item.menuItem)}
                      className="p-0.5 hover:text-brand-orange"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item.menuItem)}
                      className="p-0.5 hover:text-brand-orange"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Custom instructions row */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  {editingInstructionsIdx === idx ? (
                    <div className="w-full flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="No onions, extra sauce..."
                        value={tempInstructions}
                        onChange={(e) => setTempInstructions(e.target.value)}
                        className="flex-1 text-xs bg-glass-fill border border-glass-border rounded px-2.5 py-1 outline-none text-fg-primary"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveInstructions}
                        className="bg-brand-orange text-white p-1 rounded hover:bg-brand-orange-hover"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xxs text-fg-muted font-light italic truncate max-w-[280px]">
                        {item.specialInstructions
                          ? `Notes: "${item.specialInstructions}"`
                          : 'No special cooking notes'}
                      </p>
                      <button
                        onClick={() => handleOpenInstructions(idx)}
                        className="text-xxs text-brand-orange hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <MessageSquare className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer - Calculations & Checkout */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-glass-border/30 bg-glass-fill/10 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-fg-muted">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-fg-muted">
                <span>V.A.T. ({taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-fg-muted">
                <span>Service Charge ({serviceChargeRate}%)</span>
                <span>${serviceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-display font-extrabold text-base pt-2 border-t border-glass-border/20 text-fg-primary">
                <span>Total amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={checkoutLoading}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-600 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <span>Sending to Kitchen...</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
