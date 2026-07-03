'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, QrCode, ShoppingCart, LogOut, Shield } from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';

interface NavbarProps {
  isCustomer?: boolean;
  tableNumber?: string;
  tableId?: string;
  cartCount?: number;
  onCartClick?: () => void;
}

export default function Navbar({
  isCustomer = false,
  tableNumber,
  tableId,
  cartCount,
  onCartClick,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // Staff login states
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);

  useEffect(() => {
    // Check if staff token exists
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');
    if (token) {
      setIsStaffLoggedIn(true);
      setStaffRole(role);
      setStaffName(name);
    } else {
      setIsStaffLoggedIn(false);
      setStaffRole(null);
      setStaffName(null);
    }
  }, [pathname]);

  const handleStaffLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    setIsStaffLoggedIn(false);
    setStaffRole(null);
    setStaffName(null);
    router.push('/staff/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo and Brand Name */}
        <div className="flex items-center space-x-4">
          <Link
            href={isCustomer ? `/menu?tableId=${tableId || 'demo'}` : (isStaffLoggedIn && staffRole ? `/staff/${staffRole.toLowerCase()}` : '/staff/login')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-300">
              <QrCode className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              L'Ardoise<span className="text-brand-orange">.QR</span>
            </span>
          </Link>

          {/* Customer Table Badge */}
          {isCustomer && tableNumber && (
            <div className="px-3.5 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold font-display tracking-wide animate-pulse">
              Dining at {tableNumber.startsWith('Table') ? tableNumber : `Table #${tableNumber}`}
            </div>
          )}

          {/* Staff Terminal Mode Badge */}
          {!isCustomer && isStaffLoggedIn && staffRole && (
            <div className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full bg-glass-fill border border-glass-border text-xxs font-bold text-fg-primary/80 items-center gap-1 uppercase tracking-widest font-mono">
              <Shield className="w-3.5 h-3.5 text-brand-orange" />
              <span>{staffRole} Terminal</span>
            </div>
          )}
        </div>

        {/* Center Navigation (Only Customer Menu link) */}
        {isCustomer && (
          <nav className="hidden md:flex items-center">
            <Link
              href={`/menu?tableId=${tableId || 'demo'}`}
              className="text-sm font-semibold tracking-wide transition-colors duration-200 text-brand-orange hover:text-brand-orange-hover"
            >
              Menu
            </Link>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Customer Cart Shortcut */}
          {isCustomer && cartCount !== undefined && cartCount > 0 && onCartClick && (
            <button
              onClick={onCartClick}
              className="px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold tracking-wide flex items-center space-x-1.5 shadow-lg shadow-brand-orange/20 cursor-pointer hover:scale-105 transition-transform"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cartCount})</span>
            </button>
          )}

          {/* Staff Login Badge & Logout */}
          {!isCustomer && isStaffLoggedIn && (
            <div className="flex items-center space-x-3">
              <div className="hidden md:inline-flex px-3 py-1.5 rounded-lg bg-glass-fill border border-glass-border text-xxs font-bold text-fg-primary/80 items-center gap-1">
                <span>{staffName}</span>
              </div>
              <button
                onClick={handleStaffLogout}
                className="p-2.5 rounded-xl border border-glass-border text-fg-muted hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-glass-border hover:bg-glass-fill hover:border-brand-orange/30 text-fg-primary transition-all duration-300 hover:scale-105 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
