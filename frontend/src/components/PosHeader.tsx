'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Bell, LogOut, Shield, ShieldAlert, Clock, User, BellOff } from 'lucide-react';

interface PosHeaderProps {
  staffName: string;
  staffRole: string;
  isConnected: boolean;
  customerRequests?: any[];
  setCustomerRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  onLogout: () => void;
}

export default function PosHeader({
  staffName,
  staffRole,
  isConnected,
  customerRequests = [],
  setCustomerRequests,
  onLogout,
}: PosHeaderProps) {
  const [shiftName, setShiftName] = useState('Standard Shift');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Calculate Shift dynamically based on hour of day
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 16) {
      setShiftName('Morning Shift ☀️');
    } else if (hour >= 16 && hour < 23) {
      setShiftName('Evening Shift 🌙');
    } else {
      setShiftName('Night Shift 🌃');
    }
  }, []);

  const handleClearAlert = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    if (setCustomerRequests) {
      setCustomerRequests((prev) => prev.filter((r) => r.id !== alertId));
    }
  };

  const handleClearAllAlerts = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setCustomerRequests) {
      setCustomerRequests([]);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-950 border-b border-neutral-800 text-neutral-200">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        
        {/* Brand/Operational Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white font-display font-extrabold text-sm shadow-md">
              L'A
            </div>
            <span className="font-display font-black text-sm tracking-widest text-white uppercase">
              L'Ardoise<span className="text-brand-orange">.POS</span>
            </span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="hidden md:flex items-center space-x-1 text-xxs text-neutral-400 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            <span>{shiftName}</span>
          </div>
        </div>

        {/* Sync, Notifications, & User operational badges */}
        <div className="flex items-center space-x-4">
          
          {/* Sync Status Badge */}
          <div className="flex items-center">
            {isConnected ? (
              <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold uppercase tracking-wide">
                <Wifi className="w-3 h-3" /> Sync Online
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold uppercase tracking-wide animate-pulse">
                <WifiOff className="w-3 h-3" /> Sync Offline
              </span>
            )}
          </div>

          {/* Guest Calls Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-brand-orange/40 text-neutral-400 hover:text-white transition-all cursor-pointer relative"
              title="Operational Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {customerRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-orange text-white text-[9px] font-black font-display rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {customerRequests.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl p-4 space-y-3 z-50 text-xs">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <span className="font-extrabold uppercase tracking-wider text-xxs text-neutral-400">Operational Alerts</span>
                  {customerRequests.length > 0 && (
                    <button
                      onClick={handleClearAllAlerts}
                      className="text-[10px] text-red-500 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customerRequests.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 space-y-2">
                      <BellOff className="w-8 h-8 mx-auto opacity-40 text-neutral-600" />
                      <p className="text-[10px] font-light">No pending guest alerts.</p>
                    </div>
                  ) : (
                    customerRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 bg-neutral-950 border border-neutral-850 rounded-lg flex items-center justify-between text-neutral-300"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-xxs text-brand-orange block">Table {req.tableNumber}</span>
                          <span className="text-[10px] text-neutral-400 font-medium">{req.type} Call</span>
                        </div>
                        <button
                          onClick={(e) => handleClearAlert(e, req.id)}
                          className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User & Role Badge */}
          <div className="flex items-center space-x-2.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <div className="w-6.5 h-6.5 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-xxs font-black text-neutral-300 block">{staffName}</span>
              <span className="text-[8px] uppercase tracking-wider text-brand-orange font-bold font-mono">
                {staffRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl border border-neutral-800 hover:border-red-500/20 text-neutral-400 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
            title="Sign Out Terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
}
