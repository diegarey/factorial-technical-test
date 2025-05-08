'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductsApi } from '@/api/productsApi';
import { Product } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await ProductsApi.getProducts();
        
        console.log('Productos originales:', data);
        
        // Adaptar los datos del backend al formato esperado por el frontend
        const adaptedProducts = data.map(product => {
          console.log(`Producto ${product.id} antes de adaptar:`, product);
          console.log(`basePrice recibido:`, product.basePrice, typeof product.basePrice);
          
          const adapted = {
            ...product,
            description: product.description || '',
            basePrice: typeof product.basePrice === 'number' ? product.basePrice : 0,
            image: product.image || product.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
            partTypes: product.partTypes || product.part_types || []
          };
          
          console.log(`Producto ${product.id} después de adaptar:`, adapted);
          console.log(`basePrice adaptado:`, adapted.basePrice, typeof adapted.basePrice);
          
          return adapted;
        });
        
        console.log('Productos adaptados finales:', adaptedProducts);
        
        setProducts(adaptedProducts);
        setError(null);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Cargando bicicletas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h2 className="text-xl text-red-600 mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuestras Bicicletas</h1>
        <p className="text-gray-600 mt-2">
          Selecciona un modelo para comenzar tu personalización
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">No hay bicicletas disponibles en este momento.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="card">
              <div className="h-48 bg-gray-200 relative">
                <Image
                  src={product.image || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200'}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized={true}
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-4">{product.description || 'Bicicleta personalizable con múltiples opciones'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-primary">
                    Desde €{(product.basePrice || 0).toFixed(2)}
                  </span>
                  <Link href={`/products/${product.id}/customize`} className="btn btn-primary">
                    Personalizar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 