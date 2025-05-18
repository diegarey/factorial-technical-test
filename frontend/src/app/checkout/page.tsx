'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartApi, Cart } from '@/api/cartApi';
import { useRouter } from 'next/navigation';

// Custom styles
const styles = {
  primary: '#ff3366',
  primaryDark: '#e61e50',
  secondary: '#333333',
  accent: '#00aaff',
  lightGray: '#f7f9fc',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  itemBackground: 'white',
  buttonTransition: 'all 0.3s ease'
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'España',
    paymentMethod: 'credit_card'
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await CartApi.getCart();
      setCart(cartData);
      
      if (!cartData || cartData.items.length === 0) {
        // If the cart is empty, redirect to cart
        router.push('/cart');
      }
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      setError('No se pudo cargar el carrito. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // Here will be the payment processing logic
      // For now, we simulate a successful processing
      setTimeout(() => {
        alert('¡Pago procesado con éxito! Este es un ejemplo de demostración.');
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setError('No se pudo procesar el pago. Inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  // Calculate cart total
  const calculateTotal = () => {
    if (!cart || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
      const price = typeof item.price_snapshot === 'number' 
        ? item.price_snapshot 
        : parseFloat(String(item.price_snapshot)) || 0;
      
      return total + (price * item.quantity);
    }, 0);
  };

  // Calculate shipping cost (example)
  const shippingCost = 12.99;

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: styles.secondary, borderBottom: `1px solid ${styles.lightGray}`, paddingBottom: '1rem' }}>Finalizar compra</h1>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4" style={{ boxShadow: styles.boxShadow }}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: styles.primary }}></div>
            <p className="text-gray-700 font-medium">Procesando...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6" style={{ boxShadow: styles.boxShadow }}>
            <h2 className="text-xl font-bold mb-4">Información de contacto</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4 mt-8">Dirección de envío</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Código postal</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="España">España</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Francia">Francia</option>
                    <option value="Italia">Italia</option>
                    <option value="Alemania">Alemania</option>
                  </select>
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4 mt-8">Método de pago</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    value="credit_card"
                    checked={formData.paymentMethod === 'credit_card'}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary"
                  />
                  <label htmlFor="credit_card" className="ml-2 text-gray-700">Tarjeta de crédito/débito</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary"
                  />
                  <label htmlFor="paypal" className="ml-2 text-gray-700">PayPal</label>
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Link 
                  href="/cart" 
                  className="flex items-center font-medium transition-colors"
                  style={{ color: styles.primary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al carrito
                </Link>
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 sticky top-8" style={{ boxShadow: styles.boxShadow }}>
            <h2 className="text-xl font-bold mb-6 pb-3" style={{ color: styles.secondary, borderBottom: '1px solid #eee' }}>
              Resumen del pedido
            </h2>
            
            {cart && cart.items.length > 0 && (
              <div className="mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs">
                        {item.quantity}
                      </span>
                      <span className="text-gray-800">{`Producto #${item.product_id}`}</span>
                    </div>
                    <span className="font-medium">
                      €{((typeof item.price_snapshot === 'number' 
                        ? item.price_snapshot 
                        : parseFloat(String(item.price_snapshot)) || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">€{calculateTotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium text-gray-800">€{shippingCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between pt-3 text-sm text-gray-500">
                <span>Impuestos</span>
                <span>Incluidos</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span style={{ color: styles.secondary }}>Total</span>
                <span style={{ color: styles.primary }}>€{(calculateTotal() + shippingCost).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">Impuestos incluidos</p>
            </div>
            
            <button
              type="submit"
              form="checkout-form"
              className="w-full py-3.5 text-white font-bold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: styles.primary,
                boxShadow: `0 4px 12px ${styles.primary}40`,
                transition: styles.buttonTransition
              }}
              onClick={handleSubmit}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.primary}
            >
              <span>Completar compra</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            
            <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: styles.lightGray }}>
              <div className="flex items-center justify-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">Pago 100% seguro. Tus datos están protegidos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 