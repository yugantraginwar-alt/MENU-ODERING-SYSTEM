'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingDefault() {
  const router = useRouter();

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const savedOrders = localStorage.getItem(`orders_${sessionId}`);
      if (savedOrders) {
        try {
          const list = JSON.parse(savedOrders);
          if (Array.isArray(list) && list.length > 0) {
            router.replace(`/menu/tracking/${list[0]}`);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    router.replace('/menu');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-brand-orange/20 animate-spin border-t-2 border-brand-orange" />
        <span className="text-xs text-fg-muted font-semibold tracking-wide">Syncing order tracker...</span>
      </div>
    </div>
  );
}
