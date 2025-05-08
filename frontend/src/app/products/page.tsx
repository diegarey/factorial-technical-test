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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 6; // Número de productos por página

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await ProductsApi.getProducts(currentPage, pageSize);
        
        console.log('Productos originales:', response.products);
        
        // Adaptar los datos del backend al formato esperado por el frontend
        const adaptedProducts = response.products.map(product => {
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
        setTotalProducts(response.total);
        setError(null);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalProducts / pageSize);

  // Generar números de página para mostrar en la paginación
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Si estamos en las primeras páginas
    if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    
    // Si estamos en las últimas páginas
    if (currentPage > totalPages - Math.ceil(maxPagesToShow / 2)) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    // Si estamos en el medio
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };

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
        <h1 className="text-3xl font-bold text-secondary mb-2">Nuestras Bicicletas</h1>
        <p className="text-secondary-light">
          Selecciona un modelo para comenzar tu personalización
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-center text-secondary-light">No hay bicicletas disponibles en este momento.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="card transition-transform hover:translate-y-[-5px]">
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
                  <h2 className="text-xl font-semibold mb-2 text-secondary">{product.name}</h2>
                  <p className="text-secondary-light mb-4">{product.description || 'Bicicleta personalizable con múltiples opciones'}</p>
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
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <nav className="flex items-center space-x-2" aria-label="Paginación">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-secondary hover:bg-gray-100'}`}
                  aria-label="Página anterior"
                >
                  &laquo;
                </button>
                
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-1">...</span>
                    ) : (
                      <button
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:bg-gray-100'
                        }`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-secondary hover:bg-gray-100'}`}
                  aria-label="Página siguiente"
                >
                  &raquo;
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
} 