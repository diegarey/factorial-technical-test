'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CartApi, Cart, CartItem } from '@/api/cartApi';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await CartApi.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      setError('No se pudo cargar el carrito. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      setLoading(true);
      await CartApi.updateCartItem(itemId, quantity);
      await fetchCart(); // Recargar el carrito
    } catch (error) {
      console.error('Error al actualizar la cantidad:', error);
      setError('No se pudo actualizar la cantidad. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setLoading(true);
      await CartApi.removeCartItem(itemId);
      await fetchCart(); // Recargar el carrito
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      setError('No se pudo eliminar el producto. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular el total del carrito
  const calculateTotal = () => {
    if (!cart || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
      return total + (item.price_snapshot * item.quantity);
    }, 0);
  };

  if (loading && !cart) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchCart}
          className="btn btn-primary"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-8">
          Añade algunos productos a tu carrito para continuar con la compra.
        </p>
        <Link href="/products" className="btn btn-primary">
          Ver bicicletas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Tu carrito</h1>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {cart.items.map((item) => (
            <div key={item.id} className="border rounded-lg mb-4 p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Bicicleta personalizada</h3>
                  <p className="text-gray-600">ID del producto: {item.product_id}</p>
                </div>
                <span className="font-bold text-primary">
                  €{item.price_snapshot.toFixed(2)}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Opciones seleccionadas: {item.options.map(opt => opt.part_option_id).join(', ')}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <button 
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1 border rounded-l-md bg-gray-100"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-t border-b">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1 border rounded-r-md bg-gray-100"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Eliminar producto"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>Calculado en el siguiente paso</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>€{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <button className="btn btn-primary w-full py-3">
              Proceder al pago
            </button>
            
            <div className="mt-4">
              <Link href="/products" className="text-primary hover:underline text-sm">
                ← Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 