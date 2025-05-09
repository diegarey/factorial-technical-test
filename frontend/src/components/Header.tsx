import React from 'react';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-factorial">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold flex items-center">
              <span className="text-primary mr-1">Marcus</span>
              <span className="text-secondary">Bikes</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-secondary font-medium hover:text-primary">
              Inicio
            </Link>
            <Link href="/products" className="text-secondary font-medium hover:text-primary">
              Bicicletas
            </Link>
          </nav>
          
          <div className="flex items-center">
            <Link
              href="/cart"
              className="text-secondary hover:text-primary flex items-center"
            >
              <ShoppingCartIcon className="h-6 w-6 mr-1" />
              <span className="hidden md:inline">Carrito</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 