import React from 'react';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary">
              Marcus Bikes
            </Link>
          </div>
          <nav className="flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary">
              Inicio
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-primary">
              Bicicletas
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary">
              Sobre Nosotros
            </Link>
          </nav>
          <div>
            <Link
              href="/cart"
              className="text-gray-700 hover:text-primary flex items-center"
            >
              <ShoppingCartIcon className="h-6 w-6 mr-1" />
              <span>Carrito</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 