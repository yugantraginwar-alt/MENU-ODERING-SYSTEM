'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (savedToken && role) {
      router.replace(`/staff/${role.toLowerCase()}`);
    } else {
      router.replace('/staff/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-brand-orange/20 animate-spin border-t-2 border-brand-orange" />
        <span className="text-xs text-fg-muted font-semibold tracking-wide">Connecting to terminal...</span>
      </div>
    </div>
  );
}
