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
  Check,
  BellRing,
  Coffee,
  Receipt,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useSocket } from '@/store/SocketContext';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  status: string; // AVAILABLE, OUT_OF_STOCK, HIDDEN
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
  const { socket } = useSocket();
  
  // Session States
  const [sessionId, setSessionId] = useState<string>('');
  const [tableId, setTableId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('Scanning Table...');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Cart & Order History States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [serviceRequestSent, setServiceRequestSent] = useState<string | null>(null);
  
  // Active instructions item
  const [editingInstructionsIdx, setEditingInstructionsIdx] = useState<number | null>(null);
  const [tempInstructions, setTempInstructions] = useState('');

  // Categories ref for scrolling
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [errorType, setErrorType] = useState<'INVALID_QR' | 'TABLE_NOT_FOUND' | 'EXPIRED_SESSION' | 'NETWORK_ERROR' | 'NO_MENU' | null>(null);

  // 1. Initial Load & Session Restoration
  useEffect(() => {
    // Parse URL search parameters
    const rParam = searchParams.get('r') || '';
    const bParam = searchParams.get('b') || '';
    const tParam = searchParams.get('t') || '';
    const tokenParam = searchParams.get('token') || '';
    const legacyTableId = searchParams.get('tableId') || '';

    // Initialize or restore Anonymous Session ID
    let currentSessionId = localStorage.getItem('sessionId');
    if (!currentSessionId) {
      currentSessionId = `sess-${Math.random().toString(36).substring(2, 11)}-${Date.now().toString().slice(-4)}`;
      localStorage.setItem('sessionId', currentSessionId);
    }
    setSessionId(currentSessionId);

    // Restore Cart from localStorage
    const savedCart = localStorage.getItem(`cart_${currentSessionId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        // Fallback silently without throwing or crashing
      }
    }

    // Restore Recent Orders
    const savedOrders = localStorage.getItem(`orders_${currentSessionId}`);
    if (savedOrders) {
      try {
        setRecentOrderIds(JSON.parse(savedOrders));
      } catch (e) {
        // Fallback silently without throwing or crashing
      }
    }

    const loadSessionAndMenu = async () => {
      setLoading(true);
      setErrorType(null);
      setError(null);
      try {
        // Resolve parameters from URL -> localStorage -> sessionStorage -> session metadata
        let rVal = rParam || localStorage.getItem('restaurantId') || sessionStorage.getItem('restaurantId') || '';
        let bVal = bParam || localStorage.getItem('branchId') || sessionStorage.getItem('branchId') || '';
        let tVal = tParam || legacyTableId || localStorage.getItem('tableId') || sessionStorage.getItem('tableId') || '';
        let tokenVal = tokenParam || localStorage.getItem('qrToken') || sessionStorage.getItem('qrToken') || '';

        const savedMeta = localStorage.getItem(`session_metadata_${currentSessionId}`);
        if (savedMeta && (!rVal || !bVal || !tVal)) {
          try {
            const meta = JSON.parse(savedMeta);
            if (!rVal) rVal = meta.restaurantId;
            if (!bVal) bVal = meta.branchId;
            if (!tVal) tVal = meta.tableId;
            if (!tokenVal) tokenVal = meta.qrToken;
          } catch (e) {}
        }

        // Default to demo if empty
        if (!tVal) {
          tVal = 'demo';
        }

        let activeTableId = tVal;
        let activeTableName = tVal === 'demo' ? 'Demo Table' : `Table ${tVal}`;
        let resolvedRestId = rVal;
        let resolvedBranchId = bVal;

        // Perform backend validation if not in demo mode
        if (activeTableId !== 'demo') {
          if (resolvedRestId && resolvedBranchId && tokenVal) {
            try {
              const validateRes = await fetch(
                `${BACKEND_URL}/api/tables/validate-qr?r=${resolvedRestId}&b=${resolvedBranchId}&t=${activeTableId}&token=${tokenVal}`
              );
              if (validateRes.status === 410) {
                setErrorType('EXPIRED_SESSION');
                setLoading(false);
                return;
              }
              if (validateRes.status === 404) {
                setErrorType('TABLE_NOT_FOUND');
                setLoading(false);
                return;
              }
              if (!validateRes.ok) {
                setErrorType('INVALID_QR');
                setLoading(false);
                return;
              }
              const tableData = await validateRes.json();
              activeTableId = tableData.id;
              activeTableName = tableData.number;
              setQrToken(tokenVal);
            } catch (netErr) {
              setErrorType('NETWORK_ERROR');
              setLoading(false);
              return;
            }
          } else {
            // Check table metadata fallback lookup
            try {
              const tableRes = await fetch(`${BACKEND_URL}/api/tables/${activeTableId}`);
              if (tableRes.status === 404) {
                setErrorType('TABLE_NOT_FOUND');
                setLoading(false);
                return;
              }
              if (!tableRes.ok) {
                setErrorType('INVALID_QR');
                setLoading(false);
                return;
              }
              const tableData = await tableRes.json();
              activeTableId = tableData.id;
              activeTableName = tableData.number;
              resolvedRestId = tableData.restaurantId;
              resolvedBranchId = tableData.branchId;
            } catch (netErr) {
              setErrorType('NETWORK_ERROR');
              setLoading(false);
              return;
            }
          }
        }

        setTableId(activeTableId);
        setTableName(activeTableName);
        setRestaurantId(resolvedRestId);
        setBranchId(resolvedBranchId);

        // Store resolved values
        localStorage.setItem('tableId', activeTableId);
        localStorage.setItem('restaurantId', resolvedRestId);
        localStorage.setItem('branchId', resolvedBranchId);
        if (tokenVal) localStorage.setItem('qrToken', tokenVal);

        sessionStorage.setItem('tableId', activeTableId);
        sessionStorage.setItem('restaurantId', resolvedRestId);
        sessionStorage.setItem('branchId', resolvedBranchId);

        // Save session metadata
        localStorage.setItem(
          `session_metadata_${currentSessionId}`,
          JSON.stringify({
            tableId: activeTableId,
            tableName: activeTableName,
            restaurantId: resolvedRestId,
            branchId: resolvedBranchId,
            qrToken: tokenVal || qrToken,
          })
        );

        if (activeTableId === 'demo') {
          // Bypassing for sandbox demo mode
          let catData = [];
          try {
            const categoriesUrl = resolvedBranchId 
              ? `${BACKEND_URL}/api/categories?branchId=${resolvedBranchId}`
              : `${BACKEND_URL}/api/categories`;
            const catRes = await fetch(categoriesUrl);
            if (catRes.ok) {
              catData = await catRes.json();
            }
          } catch (e) {}

          if (catData.length === 0) {
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
                    isVeg: true,
                    isAvailable: true,
                    status: 'AVAILABLE',
                    categoryId: 'c1'
                  },
                  {
                    id: 'm2',
                    name: 'Crispy Calamari Fritti',
                    description: 'Lightly dusted calamari, dynamic saffron aioli, charred lemon wedges, micro-cilantro.',
                    price: 19.00,
                    isVeg: false,
                    isAvailable: true,
                    status: 'AVAILABLE',
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
                    description: '12oz Australian Wagyu BMS 7+, compound bone marrow butter, roasted heritage root vegetables.',
                    price: 68.00,
                    isVeg: false,
                    isAvailable: true,
                    status: 'AVAILABLE',
                    categoryId: 'c2'
                  }
                ]
              }
            ];
            setCategories(mockCategories);
            setSelectedCategory(mockCategories[0].id);
            setLoading(false);
            return;
          }

          const activeCategories = catData.map((cat: Category) => ({
            ...cat,
            menuItems: cat.menuItems.filter(item => item.status === 'AVAILABLE' && item.isAvailable),
          })).filter((cat: Category) => cat.menuItems.length > 0);

          setCategories(activeCategories);
          if (activeCategories.length > 0) {
            setSelectedCategory(activeCategories[0].id);
          }
          setLoading(false);
          return;
        }

        // Fetch categories with full query parameters to validate on backend
        const categoriesUrl = `${BACKEND_URL}/api/categories?restaurantId=${resolvedRestId}&branchId=${resolvedBranchId}&tableId=${activeTableId}&sessionId=${currentSessionId}`;
        
        let catRes;
        try {
          catRes = await fetch(categoriesUrl);
        } catch (netErr) {
          setErrorType('NETWORK_ERROR');
          setLoading(false);
          return;
        }

        if (catRes.status === 404) {
          setErrorType('TABLE_NOT_FOUND');
          setLoading(false);
          return;
        }
        if (catRes.status === 410) {
          setErrorType('EXPIRED_SESSION');
          setLoading(false);
          return;
        }
        if (!catRes.ok) {
          setErrorType('INVALID_QR');
          setLoading(false);
          return;
        }

        const catData = await catRes.json();
        
        // Filter menu items by AVAILABLE inventory status
        const activeCategories = catData.map((cat: Category) => ({
          ...cat,
          menuItems: cat.menuItems.filter(item => item.status === 'AVAILABLE' && item.isAvailable),
        })).filter((cat: Category) => cat.menuItems.length > 0);

        if (activeCategories.length === 0) {
          setErrorType('NO_MENU');
          setLoading(false);
          return;
        }

        setCategories(activeCategories);
        setSelectedCategory(activeCategories[0].id);
      } catch (err: any) {
        setErrorType('INVALID_QR');
      } finally {
        setLoading(false);
      }
    };

    loadSessionAndMenu();
  }, [searchParams]);

  // 2. Persist Cart on change
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`cart_${sessionId}`, JSON.stringify(cart));
    }
  }, [cart, sessionId]);

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

  // Service Request Sender (Socket.io real-time notifications)
  const handleServiceRequest = (type: string) => {
    if (!socket || !tableId) {
      alert(`Connecting to server... Service requested: ${type}`);
      return;
    }
    
    // Emit real-time service event to waitstaff dashboard
    socket.emit('customer_request', {
      tableId,
      tableNumber: tableName,
      type,
      timestamp: new Date().toISOString(),
    });

    setServiceRequestSent(type);
    setTimeout(() => setServiceRequestSent(null), 3000);
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const taxRate = 8.5; 
  const serviceChargeRate = 10.0; 
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

  // Place Order Flow
  const handlePlaceOrder = async () => {
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
      
      // Update local orders history list
      const updatedOrders = [order.id, ...recentOrderIds];
      setRecentOrderIds(updatedOrders);
      localStorage.setItem(`orders_${sessionId}`, JSON.stringify(updatedOrders));

      // Clear cart
      setCart([]);
      setCartOpen(false);

      // Redirect to tracking page
      router.push(`/menu/tracking/${order.id}`);
    } catch (err) {
      console.error('Failed to checkout:', err);
      alert("Order placement failed. Running in demo mode: simulating checkout...");
      router.push(`/menu/tracking/demo-tracking-session`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary pb-24 relative">
        <Navbar isCustomer={true} tableNumber="Loading Table..." tableId={tableId || 'demo'} />
        {/* Sticky Service Requests skeleton */}
        <div className="w-full bg-glass-fill border-b border-glass-border/30 py-3 sticky top-20 z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex gap-2.5 items-center justify-start">
            <div className="h-6 w-20 bg-glass-border/20 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-glass-border/20 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-glass-border/20 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-glass-border/20 rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* Hero Area skeleton */}
        <div className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 space-y-3">
          <div className="h-5 w-32 bg-green-500/10 rounded-full animate-pulse" />
          <div className="h-10 w-2/3 bg-glass-border/30 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-glass-border/20 rounded animate-pulse" />
        </div>

        {/* Categories scrollbar skeleton */}
        <div className="w-full bg-bg-primary/95 border-b border-glass-border/30 py-3 sticky top-[133px] z-20">
          <div className="max-w-7xl mx-auto px-6 flex space-x-2">
            <div className="h-8 w-24 bg-glass-border/30 rounded-xl animate-pulse" />
            <div className="h-8 w-28 bg-glass-border/20 rounded-xl animate-pulse" />
            <div className="h-8 w-24 bg-glass-border/20 rounded-xl animate-pulse" />
            <div className="h-8 w-32 bg-glass-border/20 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Menu items grid skeleton */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-card-bg border border-card-border p-4.5 rounded-2xl flex gap-4 animate-pulse">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-glass-border/20 shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-glass-border/30 rounded w-3/4" />
                  <div className="h-3 bg-glass-border/20 rounded w-5/6" />
                  <div className="h-3 bg-glass-border/20 rounded w-1/2" />
                  <div className="h-8 bg-glass-border/30 rounded-xl w-24 pt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorType) {
    return (
      <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
        <Navbar isCustomer={true} tableNumber="Error" tableId={tableId || 'demo'} />
        <div className="max-w-md mx-auto px-6 py-20 w-full text-center flex-1 flex flex-col justify-center">
          <div className="bg-card-bg border border-card-border p-8 rounded-3xl space-y-6 glass-card shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-black text-lg text-fg-primary uppercase tracking-wide">
                {errorType === 'INVALID_QR' && 'Invalid QR Code'}
                {errorType === 'TABLE_NOT_FOUND' && 'Table Not Found'}
                {errorType === 'EXPIRED_SESSION' && 'Session Expired'}
                {errorType === 'NETWORK_ERROR' && 'Connection Offline'}
                {errorType === 'NO_MENU' && 'No Menu Configured'}
              </h2>
              <p className="text-xxs text-fg-muted font-light leading-relaxed">
                {errorType === 'INVALID_QR' && 'This QR Code configuration is invalid or unrecognized. Please scan the QR code printed on your table again to access the menu.'}
                {errorType === 'TABLE_NOT_FOUND' && 'We could not locate this dining table session in our system. Please check with restaurant staff.'}
                {errorType === 'EXPIRED_SESSION' && 'Your current table session has expired. Please rescan the table QR code to start a new dining ticket.'}
                {errorType === 'NETWORK_ERROR' && 'We are having trouble connecting to our digital menu server. Please check your internet connection and try again.'}
                {errorType === 'NO_MENU' && 'No dishes are currently active or available for ordering at this branch. Please check back shortly.'}
              </p>
            </div>

            <div className="pt-2">
              {errorType === 'NETWORK_ERROR' ? (
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer border-0"
                >
                  Retry Connection
                </button>
              ) : (
                <button
                  onClick={() => {
                    router.push('/menu?t=demo');
                  }}
                  className="w-full py-3 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer border-0"
                >
                  Rescan QR (Demo Menu)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-24 relative">
      {/* Customer Custom Navbar */}
      <Navbar
        isCustomer={true}
        tableNumber={tableName}
        tableId={tableId}
        cartCount={totalCartCount}
        onCartClick={() => router.push(`/menu/cart?t=${tableId || 'demo'}`)}
      />

      {/* Sticky Service Requests Bar */}
      <div className="w-full bg-glass-fill border-b border-glass-border/30 py-3 sticky top-20 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap gap-2.5 items-center justify-start text-xs font-semibold">
          <span className="text-fg-muted mr-1.5 flex items-center gap-1 font-light uppercase tracking-wider text-xxs">
            <BellRing className="w-3.5 h-3.5 text-brand-orange animate-bounce" /> Service Desk:
          </span>
          <button
            onClick={() => handleServiceRequest('Waiter')}
            disabled={!!serviceRequestSent}
            className="px-3 py-1.5 rounded-lg border border-glass-border hover:border-brand-orange bg-card-bg hover:bg-glass-fill/10 text-fg-primary cursor-pointer active:scale-95 transition-all"
          >
            🔔 Request Waiter
          </button>
          <button
            onClick={() => handleServiceRequest('Water')}
            disabled={!!serviceRequestSent}
            className="px-3 py-1.5 rounded-lg border border-glass-border hover:border-brand-orange bg-card-bg hover:bg-glass-fill/10 text-fg-primary cursor-pointer active:scale-95 transition-all"
          >
            💧 Bring Water
          </button>
          <button
            onClick={() => handleServiceRequest('Bill')}
            disabled={!!serviceRequestSent}
            className="px-3 py-1.5 rounded-lg border border-glass-border hover:border-brand-orange bg-card-bg hover:bg-glass-fill/10 text-fg-primary cursor-pointer active:scale-95 transition-all"
          >
            💵 Request Bill
          </button>
          <button
            onClick={() => handleServiceRequest('Assistance')}
            disabled={!!serviceRequestSent}
            className="px-3 py-1.5 rounded-lg border border-glass-border hover:border-brand-orange bg-card-bg hover:bg-glass-fill/10 text-fg-primary cursor-pointer active:scale-95 transition-all"
          >
            🆘 Help Assistance
          </button>

          {serviceRequestSent && (
            <span className="text-xxs text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md animate-pulse">
              Request for {serviceRequestSent} sent!
            </span>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {totalCartCount > 0 && (
        <button
          onClick={() => router.push(`/menu/cart?t=${tableId || 'demo'}`)}
          className="fixed bottom-6 right-6 z-40 bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-4.5 rounded-full shadow-2xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 glow-orange font-semibold cursor-pointer border-0"
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
        {error ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>QR Authentication fallback active (Demo Session)</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Secure Table Connection Active</span>
          </div>
        )}
        
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
          L'Ardoise digital menu
        </h1>
        <p className="text-sm text-fg-muted font-light mt-1">
          Handcrafted French bistronomy, freshly prepared.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-glass-border/20">
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

      {/* Category Scroll navigation */}
      <div className="sticky top-[133px] z-20 w-full bg-bg-primary/95 backdrop-blur-md border-b border-glass-border/30">
        <div className="max-w-7xl mx-auto px-6 py-3 overflow-x-auto scrollbar-hide flex space-x-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/10'
                  : 'bg-glass-fill border border-glass-border text-fg-muted hover:text-fg-primary hover:bg-glass-fill/20'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-12">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-glass-border rounded-3xl space-y-3">
              <Coffee className="w-10 h-10 text-fg-muted mx-auto animate-pulse" />
              <h3 className="font-display font-bold text-lg">No dishes found</h3>
              <p className="text-sm text-fg-muted font-light">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                className="space-y-6 scroll-mt-36"
              >
                <div>
                  <h2 className="font-display font-extrabold text-2xl tracking-tight">{category.name}</h2>
                  {category.description && (
                    <p className="text-xs text-fg-muted font-light mt-1">{category.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card-bg border border-card-border p-4.5 rounded-2xl flex gap-4 hover:border-brand-orange/20 transition-colors group"
                    >
                      {item.imageUrl && (
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-glass-fill shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-bold text-base tracking-tight truncate">
                              {item.name}
                            </h3>
                            {item.isVeg && (
                              <span className="w-3.5 h-3.5 border border-green-500 rounded flex items-center justify-center shrink-0 mt-0.5" title="Vegetarian">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-fg-muted line-clamp-2 mt-1 leading-relaxed font-light">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <span className="font-display font-black text-lg text-fg-primary">${item.price.toFixed(2)}</span>
                          
                          {getCartQuantity(item.id) > 0 ? (
                            <div className="flex items-center space-x-2.5 bg-brand-orange text-white px-2.5 py-1.5 rounded-xl shadow-md shadow-brand-orange/15">
                              <button
                                onClick={() => removeFromCart(item)}
                                className="p-1 rounded-lg hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold font-display min-w-[12px] text-center">
                                {getCartQuantity(item.id)}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="p-1 rounded-lg hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-2 border border-glass-border hover:border-brand-orange/30 bg-glass-fill hover:bg-brand-orange/5 text-fg-primary text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-brand-orange" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order History / Pending List sidebar */}
        {recentOrderIds.length > 0 && (
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-4">
              <h3 className="font-display font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-brand-orange" /> Recent Orders ({recentOrderIds.length})
              </h3>
              <p className="text-xxs text-fg-muted font-light">Follow preparation and checkout status live:</p>
              
              <div className="space-y-3">
                {recentOrderIds.map((ordId) => (
                  <button
                    key={ordId}
                    onClick={() => router.push(`/menu/tracking/${ordId}`)}
                    className="w-full text-left p-3 border border-glass-border hover:border-brand-orange/30 bg-glass-fill hover:bg-glass-fill/15 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer active:scale-98 group"
                  >
                    <div>
                      <span className="font-semibold block text-fg-primary">Ticket #{ordId.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xxs text-fg-muted font-light">View real-time status</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-md bg-bg-primary h-full shadow-2xl flex flex-col border-l border-glass-border animate-slide-in">
            <div className="p-6 border-b border-glass-border/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-brand-orange" />
                <h2 className="font-display font-black text-lg">Your Cart</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl border border-glass-border hover:bg-glass-fill text-fg-muted hover:text-fg-primary"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                  <ShoppingCart className="w-12 h-12 text-glass-border animate-pulse" />
                  <h3 className="font-display font-bold text-base">Cart is empty</h3>
                  <p className="text-xs text-fg-muted max-w-xs font-light">Select delicious plates from our digital menu to place your table order.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={item.menuItem.id}
                    className="flex flex-col border-b border-glass-border/20 pb-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-fg-primary">{item.menuItem.name}</h4>
                        <span className="font-semibold text-xs text-fg-primary mt-1 block">${item.menuItem.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="p-1 border border-glass-border hover:border-brand-orange/30 rounded bg-glass-fill hover:bg-brand-orange/5 cursor-pointer text-fg-muted"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-display min-w-[12px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="p-1 border border-glass-border hover:border-brand-orange/30 rounded bg-glass-fill hover:bg-brand-orange/5 cursor-pointer text-fg-muted"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Special Instructions trigger / box */}
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenInstructions(idx)}
                        className="text-xxs text-brand-orange hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" /> 
                        {item.specialInstructions ? 'Edit Instructions' : 'Add Kitchen Instructions'}
                      </button>
                      {item.specialInstructions && (
                        <span className="text-xxs text-fg-muted truncate max-w-[200px] italic">
                          "{item.specialInstructions}"
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart pricing summaries and checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-glass-border/30 bg-glass-fill/25 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-fg-muted">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-fg-muted">
                    <span>Local Tax (8.5%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-fg-muted">
                    <span>Service Surcharge (10%)</span>
                    <span>${serviceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-display font-black text-sm text-fg-primary border-t border-glass-border/20 pt-3 mt-2">
                    <span>Estimated Total</span>
                    <span className="text-brand-orange font-black">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-brand-orange/10 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 glow-orange"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Order to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Place Table Order</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Add Instructions modal overlay */}
          {editingInstructionsIdx !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
              <div
                onClick={() => setEditingInstructionsIdx(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div className="relative bg-card-bg border border-card-border p-6 rounded-3xl w-full max-w-sm glass-card space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-brand-orange" />
                  <h3 className="font-display font-bold text-sm tracking-wide uppercase">Kitchen Instructions</h3>
                </div>
                <textarea
                  value={tempInstructions}
                  onChange={(e) => setTempInstructions(e.target.value)}
                  placeholder="e.g. no onions, medium rare, extra hot sauce..."
                  rows={3}
                  className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all resize-none"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditingInstructionsIdx(null)}
                    className="flex-1 py-2.5 border border-glass-border hover:bg-glass-fill text-fg-muted font-bold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInstructions}
                    className="flex-1 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-lg text-xs shadow shadow-brand-orange/10"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
