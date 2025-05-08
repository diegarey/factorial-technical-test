'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import CustomizeProduct from '@/components/CustomizeProduct';
import { Product } from '@/types/product';

export default function CustomizePage() {
  const params = useParams();
  const productId = params.id;
  
  // En producción, estos datos vendrían de la API
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Simulamos la carga del producto desde la API
    const fetchProduct = async () => {
      setLoading(true);
      
      // Datos de ejemplo con precios base según el ID del producto
      const productPrices = {
        '1': 599, // Mountain Bike
        '2': 699, // Bicicleta de Carretera
        '3': 499, // Bicicleta Urbana
        '4': 649  // Bicicleta Híbrida
      };
      
      // Imágenes para cada tipo de bicicleta
      const productImages = {
        '1': 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200', // Mountain Bike
        '2': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200', // Carretera
        '3': 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200', // Urbana
        '4': 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200'  // Híbrida
      };
      
      // Nombres para cada tipo de bicicleta
      const productNames = {
        '1': 'Bicicleta Mountain Bikea',
        '2': 'Bicicleta de Carretera',
        '3': 'Bicicleta Urbana',
        '4': 'Bicicleta Híbrida'
      };
      
      // Obtener el precio base según el ID o usar un valor predeterminado
      const basePrice = productPrices[productId as keyof typeof productPrices] || 499;
      const image = productImages[productId as keyof typeof productImages] || productImages['1'];
      const name = productNames[productId as keyof typeof productNames] || `Bicicleta Modelo ${productId}`;
      
      // Simular una llamada a la API con datos de ejemplo
      setTimeout(() => {
        const productData = {
          id: Number(productId),
          name: name,
          category: 'mountain',
          basePrice: basePrice, // Precio base dinámico según el ID
          image: image, // Imagen según el tipo de bicicleta
          partTypes: [
            {
              id: 1,
              name: 'Cuadro',
              options: [
                { id: 1, name: 'Cuadro Diamond', base_price: 150, is_compatible: true },
                { id: 2, name: 'Cuadro Full-suspension', base_price: 250, is_compatible: true }
              ]
            },
            {
              id: 2,
              name: 'Acabado',
              options: [
                { id: 3, name: 'Mate', base_price: 35, is_compatible: true },
                { id: 4, name: 'Brillante', base_price: 30, is_compatible: true }
              ]
            },
            {
              id: 3,
              name: 'Ruedas',
              options: [
                { id: 5, name: 'Ruedas Mountain', base_price: 100, is_compatible: true },
                { id: 6, name: 'Ruedas Fat Bike', base_price: 120, is_compatible: true }
              ]
            },
            {
              id: 4,
              name: 'Color de Aro',
              options: [
                { id: 7, name: 'Aro Negro', base_price: 25, is_compatible: true },
                { id: 8, name: 'Aro Rojo', base_price: 35, is_compatible: true }
              ]
            }
          ]
        };
        
        setProduct(productData);
        setLoading(false);
      }, 1000);
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {product && (
        <div>
          <div className="mb-8 relative h-80 rounded-lg overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="text-xl mt-2">Personaliza tu bicicleta</p>
              </div>
            </div>
          </div>
          <CustomizeProduct product={product} />
        </div>
      )}
    </div>
  );
} 