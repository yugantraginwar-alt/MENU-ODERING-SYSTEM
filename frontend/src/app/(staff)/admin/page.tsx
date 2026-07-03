'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-brand-orange/20 animate-spin border-t-2 border-brand-orange" />
        <span className="text-xs text-fg-muted font-semibold tracking-wide">Routing to staff console...</span>
      </div>
    </div>
  );
}
