'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartApi, Cart, CartItem } from '@/api/cartApi';
import { TrashIcon } from '@heroicons/react/24/outline';
import { ProductsApi } from '@/api/productsApi';
import { Product, PartOption, PartType } from '@/types/product';
import { convertToValidPrice, formatPrice } from '../../utils/dataUtils';

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

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [productsData, setProductsData] = useState<Record<number, Product>>({});
  const [optionsData, setOptionsData] = useState<Record<number, {name: string, price: number, partType: string}>>({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      console.log('Obtaining cart...');
      console.log('Current cookies:', document.cookie);
      
      // Attempt to get the cart ID saved in localStorage if it exists
      let cartIdFromStorage = null;
      try {
        cartIdFromStorage = localStorage.getItem('marcus_bikes_cart_id');
        console.log('Cart ID in localStorage:', cartIdFromStorage);
      } catch (e) {
        console.warn('Error accessing localStorage:', e);
      }
      
      const cartData = await CartApi.getCart();
      console.log('Cart data received:', cartData);
      setCart(cartData);
      
      // If we receive a cart with ID, save it in localStorage
      if (cartData && cartData.id) {
        try {
          localStorage.setItem('marcus_bikes_cart_id', cartData.id.toString());
          console.log('Cart ID saved in localStorage:', cartData.id);
        } catch (e) {
          console.warn('Error saving ID in localStorage:', e);
        }
      }
      
      // If there are products in the cart, load their details
      if (cartData && cartData.items.length > 0) {
        await fetchProductsDetails(cartData.items);
      }
      
      // Verify cookies again after receiving the cart
      console.log('Cookies after loading cart:', document.cookie);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('No se pudo cargar el carrito. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Function to load product and option details
  const fetchProductsDetails = async (items: CartItem[]) => {
    try {
      // Get unique product IDs
      const productIds = Array.from(new Set(items.map(item => item.product_id)));
      
      // Create an object to store product data
      const productsMap: Record<number, Product> = {};
      const optionsMap: Record<number, {name: string, price: number, partType: string}> = {};
      
      // Load details for each product
      for (const productId of productIds) {
        try {
          const productData = await ProductsApi.getProduct(productId);
          productsMap[productId] = productData;
          
          // Load details for all available options for this product
          if (productData.partTypes) {
            productData.partTypes.forEach(partType => {
              partType.options.forEach(option => {
                optionsMap[option.id] = {
                  name: option.name,
                  price: option.base_price,
                  partType: partType.name
                };
              });
            });
          }
        } catch (err) {
          console.error(`Error loading product ${productId}:`, err);
        }
      }
      
      // Para cada elemento del carrito, necesitamos calcular precios condicionales
      for (const item of items) {
        // Extraer las IDs de las opciones para este artículo
        const optionIds = item.options.map(option => option.part_option_id);
        
        // Si hay más de una opción, verificar precios condicionales
        if (optionIds.length > 1) {
          try {
            // Calcular el precio usando la API, que devolverá precios condicionales si corresponde
            const priceResponse = await ProductsApi.calculatePrice(optionIds);
            
            // Si hay precios condicionales, actualizamos nuestros optionsMap
            if (priceResponse.conditional_prices) {
              console.log('Precios condicionales encontrados:', priceResponse.conditional_prices);
              
              Object.entries(priceResponse.conditional_prices).forEach(([optionId, data]) => {
                const numericOptionId = Number(optionId);
                if (optionsMap[numericOptionId]) {
                  // Actualizamos el precio en nuestro mapa local con el precio condicional
                  const conditionalValue = data as any; // Necesario para acceder a las propiedades
                  optionsMap[numericOptionId].price = conditionalValue.conditional_price || 
                                                     conditionalValue.conditionalPrice || 
                                                     optionsMap[numericOptionId].price;
                  
                  console.log(`Precio condicional aplicado para ${optionsMap[numericOptionId].name}: ${optionsMap[numericOptionId].price}€`);
                }
              });
            }
          } catch (error) {
            console.error('Error al calcular precios condicionales:', error);
          }
        }
      }
      
      setProductsData(productsMap);
      setOptionsData(optionsMap);
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      setLoading(true);
      await CartApi.updateCartItemQuantity(itemId, quantity);
      await fetchCart(); // Reload cart
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('No se pudo actualizar la cantidad. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setLoading(true);
      await CartApi.removeCartItem(itemId);
      await fetchCart(); // Reload cart
    } catch (error) {
      console.error('Error removing product:', error);
      setError('No se pudo eliminar el producto. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate the total of the cart
  const calculateTotal = () => {
    if (!cart || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
      // Ensure price_snapshot is a number
      const price = typeof item.price_snapshot === 'number' 
        ? item.price_snapshot 
        : parseFloat(String(item.price_snapshot)) || 0;
      
      return total + (price * item.quantity);
    }, 0);
  };

  // Get product name
  const getProductName = (productId: number) => {
    // If we have product data, use the actual name
    if (productsData[productId]?.name) {
      return productsData[productId].name;
    }
    
    // If we don't have data, use a generic name dependent on the ID
    return `Producto ${productId}`;
  };

  // Group options by part type
  const getGroupedOptions = (item: CartItem) => {
    const grouped: Record<string, {name: string, price: number}[]> = {};

    item.options.forEach(option => {
      const optionData = optionsData[option.part_option_id];
      if (optionData) {
        if (!grouped[optionData.partType]) {
          grouped[optionData.partType] = [];
        }
        grouped[optionData.partType].push({
          name: optionData.name,
          price: optionData.price
        });
      }
    });

    return grouped;
  };

  // Calculate the product base price
  const getBasePrice = (productId: number): number => {
    // If we have the data in productsData and it's a valid number, use it
    if (productsData[productId]) {
      return convertToValidPrice(productsData[productId].basePrice, 599);
    }
    
    // If we don't have the data, return a reasonable default value
    console.warn(`No valid base price found for product ${productId}, using default price (599)`);
    return 599; // Reasonable default base price
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
          Añade algunos productos a tu carrito para continuar comprando.
        </p>
        
        <Link href="/products" className="btn btn-primary">
          Ir a la Tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: styles.secondary, borderBottom: `1px solid ${styles.lightGray}`, paddingBottom: '1rem' }}>Tu carrito</h1>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4" style={{ boxShadow: styles.boxShadow }}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: styles.primary }}></div>
            <p className="text-gray-700 font-medium">Actualizando carrito...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {cart.items.map((item) => {
            const productName = getProductName(item.product_id);
            const groupedOptions = getGroupedOptions(item);
            const basePrice = getBasePrice(item.product_id);
            
            // Calculate the total price of options by summing the price of each option
            let calculatedOptionsPrice = 0;
            item.options.forEach(option => {
              const optionData = optionsData[option.part_option_id];
              if (optionData) {
                calculatedOptionsPrice += optionData.price;
              }
            });
            
            // Use the calculated price if it's greater than 0, or use the difference with price_snapshot
            const optionsPrice = calculatedOptionsPrice > 0 
              ? calculatedOptionsPrice 
              : (typeof item.price_snapshot === 'number' 
                ? item.price_snapshot - basePrice 
                : parseFloat(String(item.price_snapshot)) - basePrice || 0);
            
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-xl overflow-hidden border border-gray-100"
                style={{ 
                  boxShadow: styles.boxShadow, 
                  transition: 'box-shadow 0.3s ease',
                  backgroundColor: styles.itemBackground
                }}
              >
                <div className="p-5 space-y-4">
                  {/* First row: image, name, and price */}
                  <div className="flex items-start">
                    {/* Product image */}
                    <div className="relative h-20 w-20 mr-4 overflow-hidden rounded-md flex-shrink-0">
                      <Image
                        src={productsData[item.product_id]?.image || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200'}
                        alt={productName}
                        fill
                        sizes="80px"
                        style={{ 
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    
                    {/* Product information */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-1 transition-colors" style={{ color: styles.secondary }}>{productName}</h3>
                          <p className="text-gray-500 text-sm">Ref: #{item.product_id}</p>
                        </div>
                        <span className="font-bold text-xl px-3 py-1 rounded-full" 
                          style={{ 
                            color: styles.primary, 
                            backgroundColor: `${styles.primary}10` 
                          }}>
                          €{formatPrice(item.price_snapshot)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Second row: price and options details */}
                  <div className="p-4 rounded-lg shadow-inner" style={{ backgroundColor: styles.lightGray }}>
                    <div className="flex justify-between text-sm font-medium mb-3 pb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <span className="text-gray-600">Precio base:</span>
                      <span className="text-gray-800 font-semibold">€{formatPrice(basePrice)}</span>
                    </div>
                    
                    {Object.entries(groupedOptions).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(groupedOptions).map(([partType, options]) => (
                          <div key={partType} className="mb-2 last:mb-0">
                            <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: styles.primary }}></span>
                              {partType}:
                            </h4>
                            {options.map((option, index) => {
                              // Intentar identificar si es un precio condicional buscando en el mapa de opciones original
                              const optionId = Object.keys(optionsData).find(
                                key => optionsData[Number(key)].name === option.name && 
                                      optionsData[Number(key)].partType === partType
                              );
                              
                              // Verificar si el precio podría ser condicional (Shimano Ultegra, etc.)
                              const isConditionalPrice = option.name.includes('Ultegra') && option.price === 999;
                              
                              return (
                                <div key={index} className="flex justify-between text-sm pl-4 py-0.5">
                                  <span className="text-gray-600">{option.name}</span>
                                  <span className={`${isConditionalPrice ? 'text-green-600 font-medium' : 'text-gray-800'}`}>
                                    €{formatPrice(option.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                        
                        {optionsPrice > 0 && (
                          <div className="flex justify-between text-sm font-semibold mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <span className="text-gray-700">Extra por opciones:</span>
                            <span style={{ color: styles.primary }}>
                              €{formatPrice(optionsPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic py-1">Sin personalizaciones adicionales</p>
                    )}
                  </div>
                  
                  {/* Third row: quantity controls and remove button */}
                  <div className="flex justify-end items-center pt-2">
                    
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex items-center py-1.5 px-3 rounded-lg transition-colors ml-auto"
                      style={{ 
                        color: '#ff3b30', 
                        transition: styles.buttonTransition 
                      }}
                      aria-label="Eliminar producto"
                    >
                      <TrashIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between mt-8">
            <Link 
              href="/products" 
              className="flex items-center font-medium transition-colors"
              style={{ color: styles.primary }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continuar comprando
            </Link>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 sticky top-8 border border-gray-100" 
            style={{ boxShadow: styles.boxShadow }}>
            <h2 className="text-xl font-bold mb-6 pb-3" 
              style={{ color: styles.secondary, borderBottom: '1px solid #eee' }}>
              Resumen del pedido
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">€{formatPrice(calculateTotal())}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-500 italic">Se calculará en el siguiente paso</span>
              </div>
              
              <div className="flex justify-between pt-3 text-sm text-gray-500">
                <span>Impuestos</span>
                <span>Incluidos</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span style={{ color: styles.secondary }}>Total</span>
                <span style={{ color: styles.primary }}>€{formatPrice(calculateTotal())}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">Impuestos incluidos</p>
            </div>
            
            <button
              onClick={() => window.location.href = '/checkout'}
              className="w-full py-3.5 text-white font-bold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: styles.primary,
                boxShadow: `0 4px 12px ${styles.primary}40`,
                transition: styles.buttonTransition
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.primaryDark}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.primary}
            >
              <span>Proceder al pago</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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