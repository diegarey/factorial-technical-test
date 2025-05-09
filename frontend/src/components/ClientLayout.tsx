'use client';

import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <main className={`max-w-screen-2xl mx-auto ${!isHomePage ? 'py-8 px-4' : ''}`}>
      {children}
    </main>
  );
} 