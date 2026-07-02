'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Menu as MenuIcon, X, QrCode } from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Demo Menu', path: '/menu?tableId=demo' },
    { name: 'Staff Panel', path: '/staff' },
    { name: 'Kitchen Feed', path: '/kitchen' },
    { name: 'Admin Console', path: '/admin' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white transition-transform group-hover:scale-105 duration-300">
            <QrCode className="w-5.5 h-5.5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            L'Ardoise<span className="text-brand-orange">.QR</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || (link.path.startsWith('/menu') && pathname === '/menu');
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 hover:text-brand-orange ${
                  isActive ? 'text-brand-orange font-semibold' : 'text-fg-muted'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-glass-border hover:bg-glass-fill hover:border-brand-orange/30 text-fg-primary transition-all duration-300 hover:scale-105"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold tracking-wide shadow-lg shadow-brand-orange/20 transition-all duration-300 hover:scale-[1.03] active:scale-95"
          >
            Book Free Demo
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-glass-border hover:bg-glass-fill text-fg-primary"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-glass-border hover:bg-glass-fill text-fg-primary"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <MenuIcon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full glass-panel border-t border-glass-border px-6 py-6 space-y-4 animate-fade-in">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium py-2 border-b border-glass-border/30 text-fg-primary hover:text-brand-orange"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full py-3 text-center rounded-xl bg-brand-orange text-white font-semibold shadow-lg shadow-brand-orange/15"
          >
            Book Free Demo
          </Link>
        </div>
      )}
    </header>
  );
}
