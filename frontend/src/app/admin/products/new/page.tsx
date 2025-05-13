'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductsApi } from '@/api/productsApi';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    description: '',
    basePrice: 0,
    image: 'https://via.placeholder.com/400?text=Nueva+Bicicleta',
    is_active: true,
    featured: false,
    partTypes: []
  });

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'basePrice') {
      const priceValue = parseFloat(value);
      setProduct({
        ...product,
        [name]: isNaN(priceValue) ? 0 : priceValue
      });
    } else {
      setProduct({
        ...product,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProduct({
      ...product,
      [name]: checked
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Validaciones básicas
      if (!product.name) {
        setError('El nombre del producto es obligatorio.');
        return;
      }
      if (!product.category) {
        setError('La categoría es obligatoria.');
        return;
      }
      if (!product.basePrice || product.basePrice <= 0) {
        setError('El precio base debe ser mayor que cero.');
        return;
      }
      
      const createdProduct = await ProductsApi.createProduct(product);
      
      alert('Producto creado correctamente');
      // Redireccionar a la página de edición del producto creado
      router.push(`/admin/products/${createdProduct.id}/edit`);
    } catch (error) {
      console.error('Error al crear el producto:', error);
      setError('Ocurrió un error al crear el producto. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Crear Nuevo Producto</h1>
        <div className="space-x-3">
          <Link href="/admin" className="btn btn-outline">
            Cancelar
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`btn btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de información básica */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Información básica</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del producto"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Categoría"
                />
                <p className="mt-1 text-xs text-gray-500">Ejemplos: MTB, Carretera, Urbana, etc.</p>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  value={product.description || ''}
                  onChange={handleBasicInfoChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descripción del producto"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">Precio base (€) *</label>
                <input
                  type="number"
                  id="basePrice"
                  name="basePrice"
                  value={product.basePrice}
                  onChange={handleBasicInfoChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={product.image}
                  onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">URL pública de la imagen del producto</p>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={product.is_active || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Activo
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={product.featured || false}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    Destacado
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-gray-600 mb-2">* Campos obligatorios</p>
                <p className="text-sm text-gray-600">
                  Después de crear el producto, podrás añadir componentes y opciones editando el producto.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna de vista previa */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Vista previa</h2>
            
            <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.image || 'https://via.placeholder.com/400?text=Sin+imagen'}
                alt={product.name || 'Nuevo producto'}
                layout="fill"
                objectFit="cover"
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-lg">{product.name || 'Nombre del producto'}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{product.description || 'Sin descripción'}</p>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Precio base:</span>
                <span className="font-bold text-primary">€{(product.basePrice || 0).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Estado:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Categoría:</span>
                <span className="text-gray-900">{product.category || '-'}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Destacado:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${product.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {product.featured ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 