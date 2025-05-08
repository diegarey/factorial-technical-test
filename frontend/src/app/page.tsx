'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductsApi } from '@/api/productsApi';
import { Product } from '@/types/product';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const data = await ProductsApi.getFeaturedProducts();
        
        // Adaptar los datos del backend al formato esperado por el frontend
        const adaptedProducts = data.map(product => ({
          ...product,
          description: product.description || '',
          basePrice: typeof product.basePrice === 'number' ? product.basePrice : 0,
          image: product.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200',
          partTypes: product.partTypes || product.part_types || []
        }));
        
        setFeaturedProducts(adaptedProducts);
        setError(null);
      } catch (err) {
        console.error('Error al cargar productos destacados:', err);
        setError('No se pudieron cargar los productos destacados.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div>
      <section className="hero py-16 md:py-24 bg-gradient-to-br from-primary-light to-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Personaliza la bicicleta de tus sueños
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Diseña cada detalle de tu bicicleta ideal y recíbela en tu casa, totalmente ajustada a tus necesidades.
            </p>
            <Link href="/products" className="btn btn-secondary btn-lg">
              Comenzar ahora
            </Link>
          </div>
        </div>
      </section>

      <section className="features py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestro proceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card text-center p-6">
              <div className="icon mb-4 mx-auto">
                <svg className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Personaliza</h3>
              <p className="text-gray-600">
                Elige cada componente de tu bicicleta según tus preferencias y necesidades específicas.
              </p>
            </div>
            <div className="feature-card text-center p-6">
              <div className="icon mb-4 mx-auto">
                <svg className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Compra</h3>
              <p className="text-gray-600">
                Proceso de pago seguro y sencillo, con opciones de financiación disponibles.
              </p>
            </div>
            <div className="feature-card text-center p-6">
              <div className="icon mb-4 mx-auto">
                <svg className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Recibe</h3>
              <p className="text-gray-600">
                Tu bicicleta llega a tu puerta perfectamente ajustada y lista para usar.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Nuestros modelos más populares
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
              <span className="ml-2">Cargando bicicletas destacadas...</span>
            </div>
          ) : error ? (
            <p className="text-center text-gray-500">{error}</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-gray-500">No hay bicicletas destacadas disponibles en este momento.</p>
          ) : (
            <div className={`grid grid-cols-1 ${featuredProducts.length <= 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
              {featuredProducts.map((product) => (
                <div key={product.id} className="card overflow-hidden">
                  <div className="h-64 bg-gray-200 relative">
                    {/* Imagen de la bicicleta */}
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={product.id === featuredProducts[0]?.id} // Priorizar carga de la primera imagen
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">
                        Desde €{(product.basePrice || 0).toFixed(2)}
                      </span>
                      <Link href={`/products/${product.id}/customize`} className="btn btn-outline">
                        Personalizar
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 