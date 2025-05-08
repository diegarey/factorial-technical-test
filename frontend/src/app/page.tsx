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
        const data = await ProductsApi.getFeaturedProducts(4); // Aumentamos a 4 productos destacados
        
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

  // Categorías de bicicletas
  const categories = [
    {
      id: 1,
      name: 'Montaña',
      description: 'Para rutas off-road y aventuras',
      image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
      path: '/products?category=mountain'
    },
    {
      id: 2,
      name: 'Carretera',
      description: 'Velocidad y rendimiento en asfalto',
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200',
      path: '/products?category=road'
    },
    {
      id: 3,
      name: 'Urbana',
      description: 'Comodidad para el día a día',
      image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200',
      path: '/products?category=urban'
    },
    {
      id: 4,
      name: 'Eléctrica',
      description: 'Potencia asistida para cualquier ruta',
      image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200',
      path: '/products?category=electric'
    }
  ];

  // Testimonios de clientes
  const testimonials = [
    {
      id: 1,
      name: 'Ana G.',
      role: 'Ciclista urbana',
      content: 'El proceso de personalización fue muy intuitivo. Mi bicicleta es exactamente como la imaginaba y la calidad es excelente.',
      avatar: 'https://randomuser.me/api/portraits/women/17.jpg'
    },
    {
      id: 2,
      name: 'Carlos R.',
      role: 'Ciclista de montaña',
      content: 'Me encantó poder elegir cada detalle de mi MTB. El servicio al cliente fue excepcional durante todo el proceso.',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 3,
      name: 'Elena M.',
      role: 'Triatleta',
      content: 'La bicicleta personalizada superó mis expectativas. Rendimiento perfecto en competiciones y entrenamiento diario.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    }
  ];

  return (
    <div>
      {/* Hero Banner mejorado con imagen de fondo */}
      <section className="relative h-screen min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1920"
            alt="Ciclismo"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 mb-4 text-sm font-medium bg-primary text-white rounded-full">
              Diseño personalizado
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              La bicicleta perfecta, hecha para ti
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Diseña cada detalle de tu bicicleta ideal y recíbela lista para rodar. Experiencia única, calidad garantizada.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn btn-primary btn-lg">
                Comenzar ahora
              </Link>
              <Link href="#como-funciona" className="btn bg-white/20 text-white hover:bg-white/30 btn-lg backdrop-blur-sm">
                Cómo funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías de bicicletas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary mb-4">Explora nuestras categorías</h2>
            <p className="text-secondary-light max-w-2xl mx-auto">
              Ofrecemos varios tipos de bicicletas para adaptarnos a tus necesidades, todas personalizables hasta el último detalle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={category.path} className="group">
                <div className="relative h-60 rounded-factorial overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform group-hover:scale-105 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso mejorado con iconos más modernos */}
      <section id="como-funciona" className="features py-16 bg-factorialGray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 mb-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Proceso sencillo
            </span>
            <h2 className="text-3xl font-bold text-secondary mb-4">Cómo funciona</h2>
            <p className="text-secondary-light max-w-2xl mx-auto">
              En tres simples pasos, tendrás la bicicleta de tus sueños en la puerta de tu casa
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card text-center p-8 bg-white rounded-factorial shadow-factorial">
              <div className="icon mb-6 mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">1. Personaliza</h3>
              <p className="text-secondary-light">
                Elige el modelo base y personaliza cada componente según tus preferencias, necesidades y estilo.
              </p>
            </div>
            <div className="feature-card text-center p-8 bg-white rounded-factorial shadow-factorial">
              <div className="icon mb-6 mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">2. Compra</h3>
              <p className="text-secondary-light">
                Proceso de pago seguro y sencillo, con múltiples opciones de pago y financiación disponibles.
              </p>
            </div>
            <div className="feature-card text-center p-8 bg-white rounded-factorial shadow-factorial">
              <div className="icon mb-6 mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-secondary">3. Recibe</h3>
              <p className="text-secondary-light">
                Tu bicicleta llega a tu puerta perfectamente ajustada, montada y lista para usar desde el primer momento.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Productos destacados mejorados */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 mb-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Lo más popular
            </span>
            <h2 className="text-3xl font-bold text-secondary mb-4">Nuestros modelos destacados</h2>
            <p className="text-secondary-light max-w-2xl mx-auto">
              Descubre las bicicletas favoritas de nuestros clientes, todas listas para personalizar
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
              <span className="ml-2">Cargando bicicletas destacadas...</span>
            </div>
          ) : error ? (
            <p className="text-center text-gray-500">{error}</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-secondary-light">No hay bicicletas destacadas disponibles en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group card overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div className="h-56 bg-gray-200 relative overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      priority={product.id === featuredProducts[0]?.id}
                      className="transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold uppercase py-1 px-2 rounded-full">
                      Destacado
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 text-secondary group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-secondary-light text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
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
          
          <div className="text-center mt-10">
            <Link href="/products" className="btn btn-outline">
              Ver todos los modelos
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonios de clientes */}
      <section className="py-16 bg-factorialGray">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 mb-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
              Testimonios
            </span>
            <h2 className="text-3xl font-bold text-secondary mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-secondary-light max-w-2xl mx-auto">
              Experiencias reales de ciclistas que ya disfrutan de sus bicicletas personalizadas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-factorial shadow-factorial">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary">{testimonial.name}</h4>
                    <p className="text-sm text-secondary-light">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-secondary-light italic">"{testimonial.content}"</p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Ventajas */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 mb-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Nuestras ventajas
              </span>
              <h2 className="text-3xl font-bold text-secondary mb-6">Por qué elegir nuestras bicicletas personalizadas</h2>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Personalización completa</h3>
                    <p className="mt-1 text-secondary-light">Elige cada aspecto de tu bicicleta, desde el cuadro hasta el color de los detalles.</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Materiales de primera calidad</h3>
                    <p className="mt-1 text-secondary-light">Utilizamos los mejores componentes y materiales para garantizar durabilidad y rendimiento.</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Garantía extendida</h3>
                    <p className="mt-1 text-secondary-light">Todos nuestros productos incluyen 2 años de garantía y soporte técnico gratuito.</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-secondary">Envío y montaje incluidos</h3>
                    <p className="mt-1 text-secondary-light">Recibe tu bicicleta completamente montada y ajustada, lista para usar desde el primer día.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 md:h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=1200"
                alt="Bicicleta personalizada"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-factorial"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA final */}
      <section className="py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <path d="M14,16.6L8.2,22.5v-7.2v-5.2h5.8H20v5.8V22L14,16.6z" fill="white" />
            <path d="M13.6,59.8l-5.3,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L13.6,59.8z" fill="white" />
            <path d="M54.9,59.8l-5.8,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L54.9,59.8z" fill="white" />
            <path d="M34.4,37.8l-5.8,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L34.4,37.8z" fill="white" />
            <path d="M54.9,37.8l-5.8,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L54.9,37.8z" fill="white" />
            <path d="M34.4,15.8l-5.8,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L34.4,15.8z" fill="white" />
            <path d="M54.9,15.8l-5.8,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L54.9,15.8z" fill="white" />
            <path d="M74.9,16.6L69,22.5v-7.2v-5.2h5.8H81v5.8V22L74.9,16.6z" fill="white" />
            <path d="M74.5,59.8l-5.3,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L74.5,59.8z" fill="white" />
            <path d="M74.5,37.8l-5.3,5.4v-7.7v-4.8h5.8h5.8v5.8v7.2L74.5,37.8z" fill="white" />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">¿Listo para crear tu bicicleta perfecta?</h2>
            <p className="text-xl text-white/80 mb-8">
              Comienza ahora el proceso de personalización y pedalea con estilo en tu próxima aventura.
            </p>
            <Link href="/products" className="btn bg-white text-primary hover:bg-gray-100 btn-lg">
              Diseña tu bicicleta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 