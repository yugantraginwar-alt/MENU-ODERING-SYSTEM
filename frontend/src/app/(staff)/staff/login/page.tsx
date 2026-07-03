'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function StaffLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to matching role dashboard
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (savedToken && role) {
      router.push(`/staff/${role.toLowerCase()}`);
    }
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userName', data.user.name);
      if (data.user.branchId) localStorage.setItem('branchId', data.user.branchId);

      router.push(`/staff/${data.user.role.toLowerCase()}`);
    } catch (err: any) {
      setAuthError(err.message || 'Server connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setAuthError(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col justify-between antialiased">
      <header className="w-full bg-neutral-950 border-b border-neutral-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white font-display font-extrabold text-sm shadow-md">
            L'A
          </div>
          <span className="font-display font-black text-sm tracking-widest text-white uppercase">
            L'Ardoise<span className="text-brand-orange">.POS</span>
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
          Secure Terminal Access
        </span>
      </header>
      <div className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/15 text-brand-orange flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-extrabold tracking-tight">Staff Login Hub</h2>
            <p className="text-xs text-fg-muted font-light">Access your dedicated operational POS terminal.</p>
          </div>

          {authError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1 text-fg-primary/80">Terminal Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="terminal@ardoise.com"
                className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all text-fg-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 text-fg-primary/80">Security Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all text-fg-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-orange/10 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {authLoading ? 'Verifying access...' : 'Open Terminal Session'}
            </button>
          </form>

          <div className="border-t border-glass-border/20 pt-5 space-y-3">
            <span className="text-xxs uppercase tracking-wider text-fg-muted font-bold block">Developer Terminals (Demo Fill)</span>
            <div className="flex flex-wrap gap-2 text-xxs">
              <button
                type="button"
                onClick={() => handleQuickFill('waiter@ardoise.com')}
                className="px-3 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill text-fg-primary rounded-xl cursor-pointer"
              >
                Waiter Terminal
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('kitchen@ardoise.com')}
                className="px-3 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill text-fg-primary rounded-xl cursor-pointer"
              >
                Kitchen Terminal
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cashier@ardoise.com')}
                className="px-3 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill text-fg-primary rounded-xl cursor-pointer"
              >
                Cashier Terminal
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@ardoise.com')}
                className="px-3 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill text-fg-primary rounded-xl cursor-pointer"
              >
                Manager Terminal
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('owner@ardoise.com')}
                className="px-3 py-2 border border-glass-border hover:border-brand-orange bg-glass-fill text-fg-primary rounded-xl cursor-pointer"
              >
                Owner Terminal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
