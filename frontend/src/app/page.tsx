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
        const data = await ProductsApi.getFeaturedProducts(8);
        
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
    <div className="min-h-screen bg-gradient-to-b from-white to-factorialGray overflow-hidden">
      {/* Hero Banner mejorado con animaciones */}
      <section className="relative h-screen min-h-[600px] flex items-center overflow-hidden w-full">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1920"
            alt="Ciclismo"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="transform scale-105 animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>
          
          {/* Partículas decorativas */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-white rounded-full animate-pulse delay-75"></div>
            <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-white rounded-full animate-pulse delay-150"></div>
            <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-white rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-block px-4 py-2 mb-6 text-sm font-medium bg-primary/20 text-white rounded-full backdrop-blur-sm border border-primary/30 animate-pulse shadow-lg shadow-primary/20">
              Diseño exclusivo y personalizado
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
              Tu bicicleta,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary animate-gradient-x">tu estilo</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Diseña la bicicleta de tus sueños con nuestro configurador avanzado. Cada detalle, perfectamente adaptado a ti.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link 
                href="/products" 
                className="btn btn-primary btn-lg group relative overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/30"
              >
                <span className="relative z-10 flex items-center">
                  Comenzar ahora
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="#como-funciona" 
                className="btn bg-white/10 text-white hover:bg-white/20 btn-lg backdrop-blur-sm border border-white/20 transform hover:scale-105 transition-all duration-300 group"
              >
                <span className="flex items-center">
                  Descubre cómo
                  <svg className="w-5 h-5 ml-2 transform group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-factorialGray to-transparent"></div>
        <div className="absolute -bottom-1 left-0 w-full">
          <svg viewBox="0 0 1920 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path fill="currentColor" className="text-factorialGray">
              <animate 
                attributeName="d" 
                dur="20s" 
                repeatCount="indefinite"
                values="
                  M0 128L48 144C96 160 192 192 288 197.3C384 203 480 181 576 160C672 139 768 117 864 128C960 139 1056 181 1152 186.7C1248 192 1344 160 1440 144C1536 128 1632 128 1728 144C1824 160 1920 192 1968 208L2016 224V256H1968C1920 256 1824 256 1728 256C1632 256 1536 256 1440 256C1344 256 1248 256 1152 256C1056 256 960 256 864 256C768 256 672 256 576 256C480 256 384 256 288 256C192 256 96 256 48 256H0V128Z;
                  M0 160L48 144C96 128 192 96 288 106.7C384 117 480 171 576 192C672 213 768 203 864 186.7C960 171 1056 149 1152 133.3C1248 117 1344 107 1440 122.7C1536 139 1632 181 1728 192C1824 203 1920 181 1968 170.7L2016 160V256H1968C1920 256 1824 256 1728 256C1632 256 1536 256 1440 256C1344 256 1248 256 1152 256C1056 256 960 256 864 256C768 256 672 256 576 256C480 256 384 256 288 256C192 256 96 256 48 256H0V160Z"
              />
            </path>
          </svg>
        </div>
      </section>

      {/* Proceso mejorado con más interactividad */}
      <section id="como-funciona" className="py-24 relative w-full">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 mb-4 text-sm font-medium bg-primary/10 text-primary rounded-full shadow-lg shadow-primary/5">
              Proceso sencillo
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Cómo funciona</span>
            </h2>
            <p className="text-xl text-secondary-light max-w-2xl mx-auto">
              En tres simples pasos, tendrás la bicicleta de tus sueños en la puerta de tu casa
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card group p-8 bg-white rounded-factorial shadow-factorial transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="icon mb-8 mx-auto bg-primary/10 w-24 h-24 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                  <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-secondary group-hover:text-primary transition-colors">1. Personaliza</h3>
                <p className="text-secondary-light text-lg">
                  Elige el modelo base y personaliza cada componente según tus preferencias y necesidades.
                </p>
              </div>
            </div>

            <div className="feature-card group p-8 bg-white rounded-factorial shadow-factorial transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="icon mb-8 mx-auto bg-primary/10 w-24 h-24 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                  <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-secondary group-hover:text-primary transition-colors">2. Compra</h3>
                <p className="text-secondary-light text-lg">
                  Proceso de pago seguro y sencillo, con múltiples opciones de financiación.
                </p>
              </div>
            </div>

            <div className="feature-card group p-8 bg-white rounded-factorial shadow-factorial transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="icon mb-8 mx-auto bg-primary/10 w-24 h-24 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
                  <svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-secondary group-hover:text-primary transition-colors">3. Recibe</h3>
                <p className="text-secondary-light text-lg">
                  Tu bicicleta llega perfectamente montada y ajustada, lista para rodar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-full"></div>
        </div>
      </section>
      
      {/* Productos destacados con diseño mejorado */}
      <section className="py-24 bg-white relative overflow-hidden w-full">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 mb-4 text-sm font-medium bg-primary/10 text-primary rounded-full shadow-lg shadow-primary/5">
              Lo más popular
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-secondary mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">Nuestros modelos destacados</span>
            </h2>
            <p className="text-xl text-secondary-light max-w-2xl mx-auto">
              Descubre las bicicletas favoritas de nuestros clientes, todas listas para personalizar
            </p>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-8 border-primary/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-8 border-primary rounded-full animate-spin border-t-transparent"></div>
              </div>
              <span className="mt-6 text-lg text-secondary-light">Cargando bicicletas destacadas...</span>
            </div>
          ) : error ? (
            <div className="text-center p-12 bg-red-50 rounded-factorial max-w-2xl mx-auto">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center p-12 bg-blue-50 rounded-factorial max-w-2xl mx-auto">
              <svg className="w-16 h-16 text-blue-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-secondary-light text-lg">No hay bicicletas destacadas disponibles en este momento.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="group relative bg-white rounded-factorial shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                    <div className="h-64 relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        priority={product.id === featuredProducts[0]?.id}
                        className="transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 right-4 z-20">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-primary/90 text-white backdrop-blur-sm shadow-lg">
                          Destacado
                        </span>
                      </div>
                    </div>
                    <div className="p-6 relative z-20">
                      <h3 className="text-xl font-semibold mb-3 text-secondary group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-secondary-light mb-6 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          €{(product.basePrice || 0).toFixed(2)}
                        </span>
                        <Link 
                          href={`/products/${product.id}/customize`} 
                          className="btn btn-primary transform group-hover:scale-105 transition-transform duration-300 flex items-center gap-2"
                        >
                          Personalizar
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-16">
                <Link 
                  href="/products" 
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold text-primary hover:text-white border-2 border-primary rounded-factorial transition-all duration-300 hover:bg-primary transform hover:-translate-y-1 hover:shadow-lg group"
                >
                  Ver todos los modelos
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-full"></div>
        </div>
      </section>
      
      {/* CTA final con diseño mejorado */}
      <section className="py-32 bg-primary relative overflow-hidden w-full">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        </div>
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              ¿Listo para crear la bicicleta de tus sueños?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
              Comienza ahora el proceso de personalización y pedalea con estilo en tu próxima aventura.
            </p>
            <Link 
              href="/products" 
              className="inline-flex items-center px-10 py-5 text-xl font-semibold bg-white text-primary rounded-factorial transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 group"
            >
              Diseña tu bicicleta
              <svg className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full mix-blend-overlay animate-float"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay animate-float-delayed"></div>
        </div>
      </section>
    </div>
  );
} 