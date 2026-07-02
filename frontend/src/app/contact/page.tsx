'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Building,
  User
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Contact() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Time slot options
  const timeSlots = ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  // Calendar dates mock generator (next 5 working days)
  const getNextDays = () => {
    const days = [];
    const options = { weekday: 'short', month: 'short', day: 'numeric' } as const;
    let count = 0;
    let dateIndex = 1;

    while (count < 5) {
      const d = new Date();
      d.setDate(d.getDate() + dateIndex);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push({
          formatted: d.toLocaleDateString('en-US', options),
          value: d.toISOString().split('T')[0],
        });
        count++;
      }
      dateIndex++;
    }
    return days;
  };

  const bookingDates = getNextDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !restaurantName) {
      alert('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary pb-20 flex flex-col justify-between">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-12 md:pt-20 w-full flex-1">
        
        {/* Split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Form / Success state */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-sm font-semibold tracking-wider text-brand-orange uppercase">
                Let's Talk
              </span>
              <h1 className="text-4xl font-display font-extrabold tracking-tight">
                Request an Onboarding Demo
              </h1>
              <p className="text-fg-muted font-light leading-relaxed max-w-lg">
                See how L'Ardoise QR can optimize table turnaround times, reduce waiter friction, and grow revenue for your restaurant.
              </p>
            </div>

            {submitted ? (
              <div className="bg-card-bg border border-green-500/30 p-8 rounded-3xl glass-card text-center space-y-6 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto pulse-glow">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-xl">Thank You, Chef!</h3>
                  <p className="text-xs text-fg-muted font-light max-w-sm mx-auto leading-relaxed">
                    Our restaurant onboarding team has received your demo request. We have reserved your chosen time slot. A validation calendar invitation was sent to <span className="font-semibold text-fg-primary">{email}</span>.
                  </p>
                </div>

                {selectedDate && selectedTime && (
                  <div className="bg-glass-fill border border-glass-border p-4 rounded-2xl max-w-xs mx-auto text-xs text-fg-primary font-medium flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-brand-orange" />
                    <div className="text-left">
                      <span>{bookingDates.find(d => d.value === selectedDate)?.formatted}</span>
                      <span className="block text-xxs text-fg-muted">{selectedTime} EST</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-brand-orange font-bold hover:underline"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border p-8 rounded-3xl glass-card space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg-primary/80 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-brand-orange" /> Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Eleanor Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg-primary/80 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-brand-orange" /> Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="owner@ardoise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Restaurant Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-fg-primary/80 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-brand-orange" /> Restaurant Brand
                    </label>
                    <input
                      type="text"
                      placeholder="L'Ardoise Bistro"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Chosen slot badge preview */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <div className="p-3 bg-glass-fill border border-glass-border rounded-xl text-xxs text-fg-muted font-light h-[46px] flex items-center">
                      {selectedDate && selectedTime ? (
                        <span className="text-fg-primary font-bold">
                          Reserved: {bookingDates.find(d => d.value === selectedDate)?.formatted} @ {selectedTime}
                        </span>
                      ) : (
                        <span>Pick a date & time block from the schedule calendar</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg-primary/80 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-brand-orange" /> Inquiry Details (Optional)
                  </label>
                  <textarea
                    placeholder="Tell us about your kitchen, active table count, and current POS systems..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-glass-fill border border-glass-border focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/20 rounded-xl text-sm outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-orange hover:bg-brand-orange-hover disabled:bg-neutral-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-brand-orange/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Registering session...</span>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

          {/* Right Column: Support & Calendar Booking scheduler */}
          <div className="space-y-8 lg:pl-6">
            
            {/* Interactive Scheduler Calendar Widget */}
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl glass-card space-y-5">
              <h3 className="font-display font-extrabold text-base border-b border-glass-border/10 pb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-orange" /> Onboarding Scheduler
              </h3>

              {/* Steps info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-fg-muted tracking-wider block">Step 1: Choose Date</span>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                    {bookingDates.map((date) => (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => setSelectedDate(date.value)}
                        className={`px-3 py-3 rounded-xl border text-xxs font-bold text-center shrink-0 min-w-[90px] transition-all ${
                          selectedDate === date.value
                            ? 'bg-brand-orange border-brand-orange text-white shadow shadow-brand-orange/20 scale-[1.02]'
                            : 'bg-glass-fill border-glass-border text-fg-muted hover:border-glass-border-dark'
                        }`}
                      >
                        {date.formatted.split(',')[0]}
                        <span className="block font-display font-black text-sm mt-1">{date.formatted.split(',')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-fg-muted tracking-wider block">Step 2: Choose Time block</span>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3.5 py-2.5 rounded-xl border text-xxs font-bold transition-all ${
                          selectedTime === slot
                            ? 'bg-brand-orange border-brand-orange text-white shadow shadow-brand-orange/20 scale-[1.02]'
                            : 'bg-glass-fill border-glass-border text-fg-muted hover:border-glass-border-dark'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Contact info details */}
            <div className="bg-glass-fill/10 border border-glass-border p-6 rounded-3xl space-y-4">
              <h3 className="font-display font-bold text-sm">Direct Contact lines</h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-glass-fill border border-glass-border flex items-center justify-center text-brand-orange">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xxs text-fg-muted uppercase tracking-wider block font-semibold">Toll-Free Phone</span>
                    <a href="tel:+15557328877" className="font-bold hover:underline">+1 (555) 732-8877</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-glass-fill border border-glass-border flex items-center justify-center text-brand-orange">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xxs text-fg-muted uppercase tracking-wider block font-semibold">General Inquiries</span>
                    <a href="mailto:info@ardoise.com" className="font-bold hover:underline">info@ardoise.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-glass-fill border border-glass-border flex items-center justify-center text-brand-orange">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xxs text-fg-muted uppercase tracking-wider block font-semibold">Global Headquarters</span>
                    <span className="font-medium text-fg-primary/95">452 Premium Avenue, Culinary District</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
