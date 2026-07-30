'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [token, router, pathname]);

  if (!isMounted) {
    return null; // Avoid hydration mismatch
  }

  if (!token && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
