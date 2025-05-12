'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import CustomizeProduct from '@/components/CustomizeProduct';
import { Product } from '@/types/product';
import { ProductsApi } from '@/api/productsApi';
import Link from 'next/link';

export default function CustomizePage() {
  const params = useParams();
  const productId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      
      console.log(`Intentando cargar producto con ID: ${productId}, tipo: ${typeof productId}`);
      
      try {
        // Intentar convertir el ID a número primero
        const numericId = Number(productId);
        
        if (isNaN(numericId)) {
          throw new Error(`ID de producto inválido: ${productId}`);
        }
        
        console.log(`Obteniendo producto ${numericId}`);
        try {
          // Intentar obtener por el endpoint de detalle
          const data = await ProductsApi.getProduct(numericId);
          console.log('Datos del producto recibidos:', data);
          
          if (data && data.id) {
            setProduct(data);
            setError(null);
            return;
          }
        } catch (detailError) {
          console.error('Error al obtener detalle del producto:', detailError);
          
          // Si falla, intentar obtener de la lista de productos
          console.log('Intentando obtener producto desde la lista...');
          const { products } = await ProductsApi.getProducts(1, 20);
          const productFromList = products.find(p => p.id === numericId);
          
          if (productFromList) {
            console.log('Producto encontrado en la lista:', productFromList);
            
            // Obtener las opciones del producto
            try {
              const options = await ProductsApi.getProductOptions(numericId, []);
              
              // Crear un producto completo con las opciones
              const completeProduct = {
                ...productFromList,
                basePrice: typeof productFromList.basePrice === 'string' 
                  ? parseFloat(productFromList.basePrice) 
                  : (productFromList.basePrice || 0),
                partTypes: options
              };
              
              // Log adicional para verificar
              console.log('Precio base en completeProduct:', completeProduct.basePrice, typeof completeProduct.basePrice);
              
              console.log('Producto completo construido:', completeProduct);
              setProduct(completeProduct);
              setError(null);
              return;
            } catch (optionsError) {
              console.error('Error al obtener opciones:', optionsError);
              // Si no podemos obtener opciones, usar el producto sin opciones
              setProduct(productFromList);
              setError(null);
              return;
            }
          }
        }
        
        // Si llegamos aquí, no se pudo obtener el producto
        throw new Error('No se pudo encontrar información del producto');
      } catch (err: any) {
        console.error('Error al cargar el producto:', err);
        
        // Mensaje de error específico para entornos dockerizados
        if (err.message && err.message.includes('Network Error')) {
          setError('Error de conexión con el servidor. Verifica que el backend esté funcionando y que la URL sea accesible desde el navegador.');
        } else {
          setError(err?.message || 'No se pudo cargar el producto. Por favor, inténtalo de nuevo más tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Cargando detalles del producto...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl text-red-600 mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <p className="mb-4">No se ha podido cargar la información del producto.</p>
        
        <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2">Información técnica:</h3>
          <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
          <p>Producto ID: {productId}</p>
          <p>Entorno: {process.env.NODE_ENV}</p>
        </div>
        
        <div className="flex justify-center">
          <Link href="/products" className="btn btn-primary">
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-8 bg-yellow-50 rounded-lg">
        <h2 className="text-xl text-yellow-600 mb-2">Producto no encontrado</h2>
        <p className="mb-4">No se ha encontrado el producto solicitado.</p>
        <div className="flex justify-center">
          <Link href="/products" className="btn btn-primary">
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  return (
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
  );
} 