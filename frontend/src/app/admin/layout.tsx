'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/admin" className="text-white text-xl font-bold">
                Panel de Administración
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-white hover:text-gray-200 text-sm">
                Ver tienda
              </Link>
              <span className="text-white">|</span>
              <span className="text-white text-sm">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <Link 
            href="/admin" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/admin') && !isActive('/admin/products') 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/products/new" 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/admin/products/new') 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Nuevo Producto
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
} 