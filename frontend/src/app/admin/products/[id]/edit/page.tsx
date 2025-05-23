'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductsApi } from '@/api/productsApi';
import { Product, PartType, PartOption } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import DependencyEditor from '@/components/DependencyEditor';

// Component for editing a part type
const PartTypeEditor = ({ 
  partType,
  partTypeIndex, 
  onChange, 
  onDelete,
  onDeleteOption 
}: { 
  partType: PartType,
  partTypeIndex: number,
  onChange: (updatedPartType: PartType) => void, 
  onDelete: () => void,
  onDeleteOption: (partTypeIndex: number, optionIndex: number) => Promise<void>
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState(partType.name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onChange({
      ...partType,
      name: newName
    });
  };

  const handleOptionChange = (index: number, option: PartOption) => {
    const updatedOptions = [...partType.options];
    updatedOptions[index] = option;
    onChange({
      ...partType,
      options: updatedOptions
    });
  };

  const handleDeleteOptionClick = async (optionIndex: number) => {
    await onDeleteOption(partTypeIndex, optionIndex);
  };

  const handleAddOption = () => {
    const newOption: PartOption = {
      id: Math.floor(Math.random() * -1000), // Temporary negative ID for new options
      name: 'Nueva opción',
      base_price: 0,
      part_type_id: partType.id,
      in_stock: true
    };
    onChange({
      ...partType,
      options: [...partType.options, newOption]
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="font-medium px-2 py-1 border-b border-transparent focus:border-primary focus:outline-none"
            placeholder="Nombre del componente"
          />
        </div>
        <button 
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-3 flex justify-between items-center">
            <h4 className="font-medium text-gray-700">Opciones</h4>
            <button 
              onClick={handleAddOption}
              className="text-primary hover:text-primary-dark text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Añadir opción
            </button>
          </div>
          
          {partType.options.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hay opciones. Añade una para comenzar.</p>
          ) : (
            <div className="space-y-2">
              {partType.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2 border-b pb-2">
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => handleOptionChange(index, { ...option, name: e.target.value })}
                    className="flex-grow px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nombre de la opción"
                  />
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500 mr-1">€</span>
                    <input
                      type="number"
                      value={option.base_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleOptionChange(index, { 
                          ...option, 
                          base_price: isNaN(value) ? 0 : value
                        });
                      }}
                      className="w-24 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Precio"
                    />
                  </div>
                  <button 
                    onClick={() => handleDeleteOptionClick(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PageProps {
  params: {
    id: string
  }
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();
  const productId = parseInt(params.id);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dependencies, setDependencies] = useState<Array<{
    id: number;
    optionId: number;
    dependsOnOptionId: number;
    type: 'requires' | 'excludes';
  }>>([]);

  useEffect(() => {
    loadProduct();
    loadDependencies();
  }, []);

  const loadProduct = async () => {
    if (isNaN(productId)) {
      setError('ID de producto inválido');
      setLoading(false);
      return;
    }

    try {
      const productData = await ProductsApi.getProduct(productId);
      setProduct(productData);
    } catch (error) {
      console.error('Error al cargar el producto:', error);
      setError('No se pudo cargar el producto. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    if (isNaN(productId)) {
      console.error('ID de producto inválido para cargar dependencias');
      return;
    }

    try {
      console.log('Iniciando carga de dependencias para producto:', productId);
      console.log('Estado actual de dependencies:', dependencies);
      console.log('Estado actual de product:', product);
      
      const deps = await ProductsApi.getProductDependencies(productId);
      console.log('Dependencias cargadas:', deps);
      
      if (Array.isArray(deps)) {
        console.log('Actualizando estado de dependencies con:', deps);
        setDependencies(deps);
      } else {
        console.error('Las dependencias recibidas no son un array:', deps);
        setDependencies([]);
      }
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
      setError('No se pudieron cargar las dependencias. Por favor, intenta nuevamente.');
      setDependencies([]);
    }
  };

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!product) return;
    
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
    if (!product) return;
    
    const { name, checked } = e.target;
    setProduct({
      ...product,
      [name]: checked
    });
  };

  const handlePartTypeChange = (index: number, updatedPartType: PartType) => {
    if (!product) return;
    
    const updatedPartTypes = [...product.partTypes];
    updatedPartTypes[index] = updatedPartType;
    
    setProduct({
      ...product,
      partTypes: updatedPartTypes
    });
  };

  const handleDeletePartType = async (index: number) => {
    if (!product) return;
    
    const partType = product.partTypes[index];
    
    try {
      // If the part type has a positive ID (exists in the backend), delete it
      if (partType.id > 0) {
        await ProductsApi.deletePartType(partType.id);
      }
      
      // Update local state
      const updatedPartTypes = [...product.partTypes];
      updatedPartTypes.splice(index, 1);
      
      setProduct({
        ...product,
        partTypes: updatedPartTypes
      });
    } catch (error) {
      console.error('Error al eliminar el tipo de parte:', error);
      setError('No se pudo eliminar el componente. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteOption = async (partTypeIndex: number, optionIndex: number) => {
    if (!product) return;
    
    const partType = product.partTypes[partTypeIndex];
    const option = partType.options[optionIndex];
    
    try {
      // If the option has a positive ID (exists in the backend), delete it
      if (option.id > 0) {
        await ProductsApi.deletePartOption(partType.id, option.id);
      }
      
      // Update local state
      const updatedPartTypes = [...product.partTypes];
      const updatedOptions = [...updatedPartTypes[partTypeIndex].options];
      updatedOptions.splice(optionIndex, 1);
      updatedPartTypes[partTypeIndex] = {
        ...updatedPartTypes[partTypeIndex],
        options: updatedOptions
      };
      
      setProduct({
        ...product,
        partTypes: updatedPartTypes
      });
    } catch (error) {
      console.error('Error al eliminar la opción:', error);
      setError('No se pudo eliminar la opción. Por favor, intenta nuevamente.');
    }
  };

  const handleAddPartType = () => {
    if (!product) return;
    
    const newPartType: PartType = {
      id: Math.floor(Math.random() * -1000), // Temporary negative ID for new types
      name: 'Nuevo componente',
      product_id: product.id,
      options: []
    };
    
    setProduct({
      ...product,
      partTypes: [...product.partTypes, newPartType]
    });
  };

  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare data to send to the backend
      const productData = {
        name: product.name,
        category: product.category,
        description: product.description,
        basePrice: product.basePrice,
        is_active: product.is_active,
        featured: product.featured,
        image: product.image
      };
      
      // Update product
      const updatedProduct = await ProductsApi.updateProduct(productId, productData);
      
      // Handle part types and options
      const updatedPartTypes = [...product.partTypes];
      
      for (let i = 0; i < updatedPartTypes.length; i++) {
        const partType = updatedPartTypes[i];
        let currentPartTypeId = partType.id;
        
        // If it's a new part type (negative ID)
        if (partType.id < 0) {
          const newPartType = {
            name: partType.name,
            product_id: productId
          };
          const savedPartType = await ProductsApi.addPartType(productId, newPartType);
          currentPartTypeId = savedPartType.id;
          
          // Update ID in local state
          updatedPartTypes[i] = {
            ...partType,
            id: currentPartTypeId
          };
        }
        
        // Save new options (with negative ID) for this part type
        const updatedOptions = [...partType.options];
        
        for (let j = 0; j < updatedOptions.length; j++) {
          const option = updatedOptions[j];
          if (option.id < 0) {
            const newOption = {
              name: option.name,
              base_price: option.base_price,
              in_stock: option.in_stock !== false
            };
            const savedOption = await ProductsApi.addPartOption(currentPartTypeId, newOption);
            
            // Update ID in local state
            updatedOptions[j] = {
              ...option,
              id: savedOption.id,
              part_type_id: currentPartTypeId
            };
          }
        }
        
        // Update options in part type
        updatedPartTypes[i] = {
          ...updatedPartTypes[i],
          options: updatedOptions
        };
      }
      
      // Update local state with new IDs
      setProduct({
        ...product,
        partTypes: updatedPartTypes
      });
      
      alert('Producto actualizado correctamente');
      
      // Reload the product to ensure we have the most recent data
      await loadProduct();
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      setError('No se pudieron guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDependency = async (dependency: {
    optionId: number;
    dependsOnOptionId: number;
    type: 'requires' | 'excludes';
  }) => {
    try {
      const response = await ProductsApi.createDependency(productId, dependency);
      
      // Transform backend response to the format expected by the frontend
      const newDependency = {
        id: response.id,
        optionId: response.option_id,
        dependsOnOptionId: response.depends_on_option_id,
        type: response.type
      };
      
      setDependencies([...dependencies, newDependency]);
    } catch (error) {
      console.error('Error al guardar dependencia:', error);
      setError('No se pudo guardar la dependencia. Por favor, intenta nuevamente.');
    }
  };

  const handleRemoveDependency = async (dependencyId: number) => {
    try {
      await ProductsApi.deleteDependency(dependencyId);
      setDependencies(dependencies.filter(dep => dep.id !== dependencyId));
    } catch (error) {
      console.error('Error al eliminar dependencia:', error);
      setError('No se pudo eliminar la dependencia. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando información del producto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
        <Link href="/admin" className="btn btn-primary">
          Volver al panel de administración
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6">
          No se encontró el producto solicitado.
        </div>
        <Link href="/admin" className="btn btn-primary">
          Volver al panel de administración
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Editar Producto</h1>
        <div className="space-x-3">
          <Link href="/admin" className="btn btn-outline">
            Cancelar
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`btn btn-primary ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic information column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Información básica</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleBasicInfoChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Categoría"
                />
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
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">Precio base (€)</label>
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
            </div>
          </div>

          {/* Components and options */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Componentes y opciones</h2>
              <button 
                onClick={handleAddPartType}
                className="text-primary hover:text-primary-dark flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Añadir componente
              </button>
            </div>

            {product.partTypes.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500">Este producto no tiene componentes configurados.</p>
                <button 
                  onClick={handleAddPartType}
                  className="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                  Añadir primer componente
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {product.partTypes.map((partType, index) => (
                  <PartTypeEditor
                    key={partType.id}
                    partType={partType}
                    partTypeIndex={index}
                    onChange={(updatedPartType) => handlePartTypeChange(index, updatedPartType)}
                    onDelete={() => handleDeletePartType(index)}
                    onDeleteOption={handleDeleteOption}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Vista previa</h2>
            
            <div className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.image || 'https://via.placeholder.com/400?text=Sin+imagen'}
                alt={product.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{product.description || 'Sin descripción'}</p>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Precio base:</span>
                <span className="font-bold text-primary">€{product.basePrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Estado:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Categoría:</span>
                <span className="text-gray-900">{product.category}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-700">Destacado:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${product.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {product.featured ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-gray-800 mb-2">Componentes</h4>
              <ul className="space-y-1 text-sm">
                {product.partTypes.length === 0 ? (
                  <li className="text-gray-500 italic">Sin componentes</li>
                ) : (
                  product.partTypes.map(partType => (
                    <li key={partType.id} className="flex justify-between">
                      <span>{partType.name}</span>
                      <span className="text-gray-500">{partType.options.length} opciones</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link 
                href={`/products/${product.id}/customize`}
                target="_blank"
                className="text-sm text-primary hover:text-primary-dark flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver en tienda
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add dependency editor after components section */}
      {product && product.partTypes && product.partTypes.length > 0 && (
        <div className="mt-8">
          <DependencyEditor
            partTypes={product.partTypes}
            currentDependencies={dependencies}
            onSaveDependency={handleSaveDependency}
            onRemoveDependency={handleRemoveDependency}
          />
        </div>
      )}
    </div>
  );
} 