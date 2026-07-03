'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderLegacyRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/menu/tracking/${id}`);
    } else {
      router.replace('/menu');
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-brand-orange/20 animate-spin border-t-2 border-brand-orange" />
        <span className="text-xs text-fg-muted font-semibold tracking-wide">Syncing order status...</span>
      </div>
    </div>
  );
}
