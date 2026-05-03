'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

export function BottomNavWrapper() {
  const pathname = usePathname();
  if (pathname?.startsWith('/workspace')) return null;
  return <BottomNav />;
}
