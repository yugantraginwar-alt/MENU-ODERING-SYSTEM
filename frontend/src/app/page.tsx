'use client';

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  Clock,
  Smartphone,
  ChefHat,
  Users,
  Sliders,
  Receipt,
  BarChart3,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Menu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home() {
  const features = [
    { icon: QrCode, title: "Contactless QR Menu", desc: "Instant table scans load a high-end digital menu with interactive filters and search." },
    { icon: Clock, title: "Live Order Tracking", desc: "Provide peace of mind with a dynamic order-state tracker showing kitchen preparation stages." },
    { icon: Smartphone, title: "PWA Mobile Friendly", desc: "A smooth native-feeling menu drawer with sticky category bars, optimized for iOS and Android." },
    { icon: ChefHat, title: "Kitchen Kanban Board", desc: "Keep chefs organized. Color-coded ticket timers count down preparation benchmarks with audio alarms." },
    { icon: Users, title: "Staff Flow Dashboard", desc: "Waitstaff view incoming orders instantly on glass dashboards, managing serving routes easily." },
    { icon: Sliders, title: "Branded Admin Console", desc: "Modify menu categories, set service surcharges, manage active tables, and export print-ready QR PDF sheets." },
    { icon: Receipt, title: "Splitting & Direct Checkout", desc: "Clean calculations factoring service charges and local taxes, outputting elegant summary tickets." },
    { icon: BarChart3, title: "Revenue & Sales Reports", desc: "Track peak dining hours, discover top-performing dishes, and monitor daily revenue changes." },
    { icon: Lock, title: "JWT Staff Authentication", desc: "Secure role-restricted routes separating kitchen chef logs, admin reports, and floor waiter dashboards." },
  ];

  const steps = [
    { num: '01', title: 'Scan Table QR', desc: 'Customer points camera at QR. No app install required.' },
    { num: '02', title: 'Browse & Choose', desc: 'Beautiful categories, clear dietary filters, and detailed descriptions.' },
    { num: '03', title: 'Customize & Order', desc: 'Add special kitchen instructions. Place order instantly.' },
    { num: '04', title: 'Kitchen Prepares', desc: 'Chef accepts the ticket on the Kanban board. Timer begins.' },
    { num: '05', title: 'Table Service', desc: 'Staff is notified order is ready, bringing food to the correct table number.' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-fg-primary">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 pb-24 md:py-32 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Text Area */}
        <div className="flex-1 text-left space-y-8 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-glass-fill border border-glass-border">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-semibold tracking-wider uppercase text-fg-primary/80">
              Next-Gen Restaurant Tech
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.08] max-w-xl">
            Smart QR Ordering <br />
            <span className="text-brand-orange text-glow-orange">For Modern Dining</span>
          </h1>

          <p className="text-lg text-fg-muted max-w-lg leading-relaxed font-light">
            Empower your customers to scan, browse the menu, add customizations, and place orders instantly. 
            Kitchens cook, staff serves, and your table turnaround rate skyrockets.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-base font-semibold tracking-wide shadow-xl shadow-brand-orange/20 transition-all duration-300 hover:scale-[1.03]"
            >
              Book Free Demo
            </Link>
            <Link
              href="/menu?tableId=demo"
              className="px-8 py-4 rounded-xl border border-glass-border bg-glass-fill hover:border-brand-orange/30 hover:bg-glass-fill/10 text-fg-primary text-base font-semibold tracking-wide transition-all duration-300 hover:scale-[1.03]"
            >
              View Demo Menu
            </Link>
          </div>

          {/* Core Trust Badges */}
          <div className="pt-8 border-t border-glass-border/30 flex items-center space-x-8 text-xs text-fg-muted font-medium uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-brand-orange" /> Real-time Sockets
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-brand-orange" /> Role-based Security
            </div>
          </div>
        </div>

        {/* Hero Interactive SVG Illustration */}
        <div className="flex-1 w-full max-w-lg md:max-w-none flex justify-center z-10">
          <div className="relative w-full aspect-square max-w-[480px] float-anim">
            {/* Soft background light */}
            <div className="absolute inset-0 bg-brand-orange/10 rounded-full blur-[60px] translate-y-4" />
            
            <svg
              viewBox="0 0 500 500"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Outer Grid Ring */}
              <circle cx="250" cy="250" r="230" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="5 5" />
              <circle cx="250" cy="250" r="180" stroke="currentColor" strokeOpacity="0.03" strokeWidth="1" />
              
              {/* Isometric Table Top Grid */}
              <path d="M120 280 L250 190 L380 280 L250 370 Z" fill="var(--card-bg)" stroke="var(--card-border)" strokeWidth="2" />
              
              {/* Table Under-shadow */}
              <path d="M120 280 L250 370 L380 280 M250 370 L250 410" stroke="var(--card-border)" strokeWidth="2" strokeLinecap="round" />
              
              {/* QR Block Stand on Table */}
              <path d="M240 220 L260 210 L270 215 L250 225 Z" fill="#222" />
              <path d="M240 220 L250 225 L250 240 L240 235 Z" fill="#111" />
              <path d="M260 210 L270 215 L270 230 L260 225 Z" fill="#333" />
              {/* QR Indicator lines */}
              <rect x="251" y="217" width="6" height="6" transform="skewY(-20)" fill="var(--brand-orange)" opacity="0.8" />

              {/* Smartphone Glowing UI (Hovering) */}
              <g transform="translate(0, -15)">
                {/* phone base */}
                <path d="M180 320 L230 280 L310 320 L260 360 Z" fill="#0A0A0A" stroke="#FF6B35" strokeWidth="3.5" />
                <path d="M185 320 L230 284 L305 320 L260 356 Z" fill="url(#phoneGrad)" />
                {/* Glowing menu items on phone */}
                <path d="M210 310 L240 295 M215 318 L245 303" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
                <path d="M200 325 L210 320" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" />
                {/* Mini Image card */}
                <path d="M250 305 L285 320 L265 330 L230 315 Z" fill="#FF6B35" fillOpacity="0.25" stroke="#FF6B35" strokeWidth="1" />
              </g>

              {/* Floating Dashboard Badges */}
              {/* Badge 1: Order Status Preparing */}
              <g transform="translate(300, 120)" className="cursor-pointer group">
                <rect x="0" y="0" width="130" height="42" rx="12" fill="var(--card-bg)" stroke="var(--card-border)" strokeWidth="1" />
                <circle cx="20" cy="21" r="5" fill="#FF6B35" className="pulse-glow" />
                <text x="36" y="25" fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Table 4: Cooking</text>
              </g>

              {/* Badge 2: Revenue Count */}
              <g transform="translate(60, 160)">
                <rect x="0" y="0" width="120" height="42" rx="12" fill="var(--card-bg)" stroke="var(--card-border)" strokeWidth="1" />
                <text x="16" y="25" fill="#FF6B35" fontSize="13" fontWeight="bold" fontFamily="sans-serif">$2,842</text>
                <text x="70" y="25" fill="currentColor" fontSize="9" fontWeight="medium" fontFamily="sans-serif" opacity="0.6">Today</text>
              </g>

              {/* Connected dashed waves to show Socket real-time */}
              <path d="M260 120 Q220 180 250 260" stroke="#FF6B35" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
              <path d="M120 180 Q200 240 235 300" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

              {/* Gradients */}
              <defs>
                <linearGradient id="phoneGrad" x1="180" y1="320" x2="310" y2="320" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1A1A1A" />
                  <stop offset="0.5" stopColor="#262626" />
                  <stop offset="1" stopColor="#1A1A1A" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-t border-b border-glass-border/30 bg-glass-fill py-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs uppercase tracking-widest text-fg-muted font-semibold">
            Trusted by award-winning hospitality groups
          </span>
          <div className="flex flex-wrap items-center gap-8 md:gap-12 opacity-60">
            <span className="font-display font-extrabold text-lg tracking-wider">SAVOUR RESTAURANTS</span>
            <span className="font-display font-extrabold text-lg tracking-wider">NOBLE EATS</span>
            <span className="font-display font-extrabold text-lg tracking-wider">VANGUARD CLUB</span>
            <span className="font-display font-extrabold text-lg tracking-wider">BISTRO COLLAB</span>
          </div>
        </div>
      </section>

      {/* Customer Flow Timeline Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-sm font-semibold tracking-wider text-brand-orange uppercase">
            The Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
            How It Works in 5 Steps
          </h2>
          <p className="text-fg-muted font-light leading-relaxed">
            Contactless efficiency engineered for guests, waiters, and kitchen chefs alike.
          </p>
        </div>

        {/* Timeline Desktop grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-1/10 right-1/10 h-0.5 bg-glass-border/30 z-0" />

          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="relative bg-card-bg border border-card-border p-6 rounded-2xl glass-card z-10 flex flex-col items-start gap-4 hover:border-brand-orange/30 group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 group-hover:bg-brand-orange text-brand-orange group-hover:text-white flex items-center justify-center font-display font-bold text-lg transition-all duration-300">
                {step.num}
              </div>
              <h3 className="font-display font-bold text-lg mt-2">{step.title}</h3>
              <p className="text-sm text-fg-muted font-light leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="w-full bg-glass-fill/10 border-t border-glass-border/20 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="text-sm font-semibold tracking-wider text-brand-orange uppercase">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
                Designed for High-Volume Operations
              </h2>
            </div>
            <p className="text-fg-muted font-light max-w-md leading-relaxed">
              Every interface is built by designers who understand hospitality dynamics. No bloated dashboards, just pure speed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-card-bg border border-card-border p-8 rounded-2xl glass-card hover:border-brand-orange/30 group cursor-pointer hover:shadow-xl hover:shadow-brand-orange/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-orange/5 text-brand-orange flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300">
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 tracking-tight group-hover:text-brand-orange transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-fg-muted leading-relaxed font-light">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Testimonials */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 md:py-32 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-sm font-semibold tracking-wider text-brand-orange uppercase">
            SaaS Feedback
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
            What Restaurateurs Are Saying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-card-bg border border-card-border glass-card relative flex flex-col justify-between">
            <p className="text-lg text-fg-primary/90 font-light italic leading-relaxed">
              "We deployed L'Ardoise QR across 45 tables at our downtown bistro. Guests love not having to wait for menus, and our average order size increased by 22% due to visual prompting and easy cart add-ons."
            </p>
            <div className="mt-8 flex items-center gap-4 border-t border-glass-border/30 pt-6">
              <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center font-bold text-white text-xs">
                JD
              </div>
              <div>
                <h4 className="font-display font-bold text-sm">Jean-Luc Dupond</h4>
                <p className="text-xs text-fg-muted">Managing Partner, L'Ardoise Paris</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-card-bg border border-card-border glass-card relative flex flex-col justify-between">
            <p className="text-lg text-fg-primary/90 font-light italic leading-relaxed">
              "The kitchen display timer changed how our chefs perform. The color coding clearly maps urgency, and we've reduced table ticket delay by nearly 6 minutes. Sockets stay perfectly in sync."
            </p>
            <div className="mt-8 flex items-center gap-4 border-t border-glass-border/30 pt-6">
              <div className="w-10 h-10 rounded-full bg-neutral-600 flex items-center justify-center font-bold text-white text-xs">
                MW
              </div>
              <div>
                <h4 className="font-display font-bold text-sm">Chef Marcus Wareing</h4>
                <p className="text-xs text-fg-muted">Executive Chef, Savour Group</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section className="w-full bg-glass-fill border-t border-b border-glass-border/30 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
            Ready to upgrade your guest experience?
          </h2>
          <p className="text-lg text-fg-muted font-light max-w-xl mx-auto leading-relaxed">
            Get started with a custom brand trial. No credit card required. Connect your kitchen POS and table lines in minutes.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-base font-semibold tracking-wide shadow-xl shadow-brand-orange/20 transition-all duration-300 hover:scale-[1.03]"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl border border-glass-border bg-glass-fill hover:border-brand-orange/30 hover:bg-glass-fill/10 text-fg-primary text-base font-semibold tracking-wide transition-all duration-300 hover:scale-[1.03]"
            >
              Schedule a Call
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-glass-border/30 bg-bg-primary py-16 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
                QR
              </div>
              <span className="font-display font-bold text-lg tracking-tight">L'Ardoise<span className="text-brand-orange">.QR</span></span>
            </Link>
            <p className="text-xs text-fg-muted font-light leading-relaxed">
              Sleek, instantaneous digital ordering platforms. Empowering restaurants to coordinate guest flows effortlessly.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm tracking-wide uppercase text-brand-orange">Dashboards</h4>
            <ul className="space-y-2 font-light text-fg-muted">
              <li><Link href="/menu?tableId=demo" className="hover:text-fg-primary transition-colors">Digital Menu Demo</Link></li>
              <li><Link href="/staff" className="hover:text-fg-primary transition-colors">Staff Station</Link></li>
              <li><Link href="/kitchen" className="hover:text-fg-primary transition-colors">Kitchen Board</Link></li>
              <li><Link href="/admin" className="hover:text-fg-primary transition-colors">Admin Settings</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm tracking-wide uppercase text-brand-orange">Product</h4>
            <ul className="space-y-2 font-light text-fg-muted">
              <li><a href="#" className="hover:text-fg-primary transition-colors">QR Customization</a></li>
              <li><a href="#" className="hover:text-fg-primary transition-colors">POS Integration</a></li>
              <li><a href="#" className="hover:text-fg-primary transition-colors">Table Overviews</a></li>
              <li><a href="#" className="hover:text-fg-primary transition-colors">Privacy & Terms</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm tracking-wide uppercase text-brand-orange">Contact</h4>
            <p className="font-light text-fg-muted leading-relaxed">
              L'Ardoise Technologies Inc.<br />
              info@ardoise.com<br />
              +1 (555) 732-8877
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-glass-border/20 text-center text-xs text-fg-muted font-light">
          &copy; {new Date().getFullYear()} L'Ardoise QR Ordering SaaS. All rights reserved. Built for modern food spots.
        </div>
      </footer>
    </div>
  );
}
