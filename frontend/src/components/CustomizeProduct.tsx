import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, PartType, AvailablePartType } from '@/types/product';
import { ProductsApi } from '@/api/productsApi';
import { CartApi } from '@/api/cartApi';
import Link from 'next/link';
import Image from 'next/image';

interface CustomizeProductProps {
  product: Product;
}

const CustomizeProduct: React.FC<CustomizeProductProps> = ({ product }) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0); // Inicializar a 0 y actualizar en useEffect
  const [availableOptions, setAvailableOptions] = useState<AvailablePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Log para depuración
  console.log('>>>>>>> PRODUCTO RECIBIDO EN CUSTOMIZEPRODUCT:', product);
  console.log('>>>>>>> PRECIO BASE DEL PRODUCTO:', product.basePrice, typeof product.basePrice);
  console.log('>>>>>>> PRECIO BASE CONVERTIDO A NÚMERO:', Number(product.basePrice));
  console.log('>>>>>>> OBJETO COMPLETO DEL PRODUCTO:', JSON.stringify(product, null, 2));

  // Efecto para inicializar el precio base correctamente - usar SOLO datos de la API
  useEffect(() => {
    // Intentar diferentes fuentes para el precio base
    let basePrice = 0;
    
    // 1. Intentar directamente base_price (propiedad original API)
    const rawProduct = product as any;
    if (rawProduct && rawProduct.base_price !== undefined && rawProduct.base_price !== null) {
      if (typeof rawProduct.base_price === 'string') {
        basePrice = parseFloat(rawProduct.base_price);
      } else if (typeof rawProduct.base_price === 'number') {
        basePrice = rawProduct.base_price;
      }
    }
    
    // 2. Si no hay base_price, intentar usar basePrice (propiedad transformada)
    if (basePrice <= 0 && product.basePrice !== undefined && product.basePrice !== null) {
      if (typeof product.basePrice === 'string') {
        basePrice = parseFloat(product.basePrice);
      } else if (typeof product.basePrice === 'number') {
        basePrice = product.basePrice;
      }
    }
    
    // Validar que el precio sea un número positivo
    if (isNaN(basePrice) || basePrice < 0) {
      console.error('No se pudo obtener un precio base válido');
      basePrice = 0;
    }
    
    // Actualizar el precio total
    if (basePrice > 0) {
      console.log(`Inicializando precio total con precio base: ${basePrice}`);
      setTotalPrice(basePrice);
    } else {
      console.warn('Inicializando precio total a 0 porque no se encontró un precio base válido');
      setTotalPrice(0);
    }
  }, [product]);

  // Cargar opciones disponibles cuando cambia la selección
  useEffect(() => {
    // Detectar específicamente si "Aro Rojo" está entre las opciones seleccionadas
    const selectedOptionIds = Object.values(selectedOptions);
    const hasAroRojo = false; // Eliminamos esta detección que no es necesaria y está causando problemas de tipo

    if (hasAroRojo) {
      console.log("********** ARO ROJO ESTÁ SELECCIONADO EN EL USEEFFECT **********");
      console.log("Precio base:", product.basePrice);
      console.log("Precio total actual:", totalPrice);
      console.log("Todas las opciones seleccionadas:", selectedOptions);
      console.log("IDs de opciones seleccionadas:", selectedOptionIds);
    }

    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const selectedOptionIds = Object.values(selectedOptions);
        
        console.log('Product ID para opciones:', product.id);
        console.log('Opciones seleccionadas:', selectedOptionIds);
        
        // Obtener opciones disponibles de la API
        const options = await ProductsApi.getProductOptions(product.id, selectedOptionIds);
        console.log('Opciones disponibles recibidas:', options);
        
        if (Array.isArray(options)) {
          setAvailableOptions(options);
        } else {
          console.error('Formato de opciones inesperado:', options);
          setError('Las opciones recibidas tienen un formato inesperado.');
        }
        
        // Asegurar que el precio base sea un número válido
        const basePrice = typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0
          ? product.basePrice 
          : 0;
        
        console.log(`Usando precio base: ${basePrice} para el cálculo`);
        
        // Calcular precio total - incluir siempre el precio base
        if (selectedOptionIds.length > 0) {
          try {
            const price = await ProductsApi.calculatePrice(selectedOptionIds);
            console.log(`Precio de opciones recibido de la API: ${price}`);
            
            // Solo actualizar el precio si es un número válido
            if (typeof price === 'number' && !isNaN(price)) {
              // Sumar el precio base si el backend no lo incluye en el cálculo
              const newTotalPrice = basePrice + price;
              
              // Asegurar que el precio no sea inferior al precio base
              const finalPrice = newTotalPrice < basePrice ? basePrice : newTotalPrice;
              
              console.log(`Precio calculado final: Precio base (${basePrice}) + Precio opciones (${price}) = ${finalPrice}`);
              setTotalPrice(finalPrice);
            } else {
              // Si el precio no es válido, usar al menos el precio base
              console.warn(`Precio calculado inválido: ${price}, usando precio base: ${basePrice}`);
              setTotalPrice(basePrice);
            }
          } catch (priceError) {
            console.error('Error al calcular precio:', priceError);
            // En caso de error, mantener al menos el precio base
            setTotalPrice(basePrice);
          }
        } else {
          // Si no hay opciones seleccionadas, usar solo el precio base
          console.log(`No hay opciones seleccionadas, usando solo precio base: ${basePrice}`);
          setTotalPrice(basePrice);
        }
      } catch (error) {
        console.error('Error al cargar opciones:', error);
        setError('No se pudieron cargar las opciones. Por favor, recarga la página.');
        
        // Asegurarse de que al menos el precio base esté configurado en caso de error
        const basePrice = typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0
          ? product.basePrice 
          : 0;
        setTotalPrice(basePrice);
      } finally {
        setLoading(false);
      }
    };
    
    loadOptions();
  }, [selectedOptions, product]);

  const handleOptionSelect = (partTypeId: number, optionId: number) => {
    console.log(`Seleccionando opción: partTypeId=${partTypeId}, optionId=${optionId}`);
    
    // Obtener la opción seleccionada para obtener su precio
    let selectedOption: any = null;
    const partType = partTypesToRender.find(pt => pt.id === partTypeId);
    if (partType) {
      // Asegurar que options existe y es un array
      const options = Array.isArray(partType.options) ? partType.options : [];
      selectedOption = options.find(opt => opt.id === optionId);
    }

    // Detección especial para Aro Rojo
    if (selectedOption && selectedOption.name === "Aro Rojo") {
      console.log("********** SELECCIÓN DE ARO ROJO DETECTADA **********");
      console.log("Precio base actual:", product.basePrice);
      console.log("Precio total actual:", totalPrice);
      console.log("Opciones seleccionadas antes de Aro Rojo:", selectedOptions);
    }
    
    // Capturar las selecciones actuales para hacer logging después
    const prevSelections = {...selectedOptions};
    
    // Actualizar las opciones seleccionadas
    setSelectedOptions(prev => {
      const newSelection = {
        ...prev,
        [partTypeId]: optionId,
      };
      console.log('Nueva selección:', newSelection);

      // Para detectar específicamente si estamos seleccionando Aro Rojo
      if (selectedOption && selectedOption.name === "Aro Rojo") {
        console.log("IDs de opciones después de seleccionar Aro Rojo:", Object.values(newSelection));
      }
      return newSelection;
    });
    
    // No recalculamos el precio aquí porque el useEffect se encargará de ello
    // Solo registramos la información para depuración
    if (selectedOption) {
      console.log(`Opción seleccionada: ${selectedOption.name}, precio: ${selectedOption.base_price}`);
    }
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      console.log("=== INICIANDO PROCESO DE AÑADIR AL CARRITO (SIMPLIFICADO) ===");
      
      // 1. Preparar los datos en un formato simple
      const productId = product.id;
      const selectedOptionIds = Object.values(selectedOptions);
      
      console.log(`Producto ID: ${productId}`);
      console.log(`Opciones seleccionadas: ${selectedOptionIds.join(", ")}`);
      console.log(`Cantidad: 1`);
      
      // 1.5 Primero validar compatibilidad antes de enviar al carrito
      console.log("Validando compatibilidad de opciones...");
      const compatibilityResult = await ProductsApi.validateCompatibility(selectedOptionIds);
      
      if (!compatibilityResult.is_compatible) {
        // Extraer detalles de incompatibilidad
        let errorMessage = 'Las opciones seleccionadas no son compatibles entre sí.';
        if (compatibilityResult.incompatibility_details) {
          const details = compatibilityResult.incompatibility_details;
          if (details.type === 'excludes') {
            errorMessage = `La opción "${details.option_name}" no es compatible con "${details.excluded_option_name}".`;
          } else if (details.type === 'requires') {
            errorMessage = `La opción "${details.option_name}" requiere seleccionar "${details.required_option_name}".`;
          }
        }
        // Mostrar mensaje de error
        console.error('Error de compatibilidad:', errorMessage);
        alert(`No se puede añadir al carrito: ${errorMessage} Por favor, elige otra combinación.`);
        setLoading(false);
        return;
      }
      
      // 2. Llamada directa a la API - ahora con validación previa
      const url = '/api/cart/items';
      const requestData = {
        product_id: productId,
        selected_options: selectedOptionIds,
        quantity: 1
      };
      
      console.log("Realizando solicitud directa al servidor...");
      console.log("URL:", url);
      console.log("Datos:", JSON.stringify(requestData));
      
      // Utilizar fetch directamente en lugar de la API para depurar mejor
      const response = await fetch(`http://localhost:8000${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Incluir cookies
        body: JSON.stringify(requestData)
      });
      
      console.log(`Respuesta HTTP: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la respuesta: ${errorText}`);
        
        // Intentar extraer mensaje de error más amigable
        let userMessage = 'Error al añadir el producto al carrito.';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson && errorJson.detail) {
            userMessage = errorJson.detail;
            // Simplificar mensajes de incompatibilidad que vienen del backend
            if (userMessage.includes('Incompatibilidad:')) {
              userMessage = userMessage.replace('Incompatibilidad: ', '');
            }
          }
        } catch (e) {
          // Si no es JSON, usar el texto completo
          if (errorText && errorText.length < 100) {
            userMessage = errorText;
          }
        }
        
        alert(`No se pudo añadir al carrito: ${userMessage}`);
        throw new Error(`Error al añadir al carrito: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Datos de respuesta:", responseData);
      
      // 3. Mostrar mensaje y redirigir
      alert('¡Producto añadido al carrito!');
      console.log("Redirigiendo al carrito...");
      router.push('/cart');
      
    } catch (error) {
      console.error("ERROR AL AÑADIR AL CARRITO:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Determinar qué opciones mostrar - usar las opciones disponibles de la API o de partTypes del producto
  const usePartTypes = availableOptions.length === 0;
  const partTypesToRender = usePartTypes ? (product.partTypes || []) : availableOptions;
  
  console.log('Usando opciones de partTypes del producto:', usePartTypes);
  console.log('PartTypes a renderizar:', partTypesToRender);

  // Verificar si el producto es personalizable
  const isProductPersonalizable = partTypesToRender.length > 0;

  // Nueva función para desplazarse a una sección
  const scrollToSection = (partTypeId: number) => {
    setActiveSection(partTypeId);
    const element = document.getElementById(`part-type-${partTypeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mt-2 text-lg text-gray-600">
              {isProductPersonalizable 
                ? 'Personaliza tu bicicleta seleccionando las opciones a continuación'
                : 'Detalles del producto'}
            </p>
          </div>
          {isProductPersonalizable && (
            <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Personalización avanzada disponible</span>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg bg-white shadow-xl">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Actualizando configuración</p>
                <p className="text-sm text-gray-500">Un momento, por favor...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      {!isProductPersonalizable ? (
        <div className="text-center p-8 bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="mb-6 max-w-3xl mx-auto">
            <div className="text-left">
              <p className="text-gray-600 mb-6">{product.description || 'Bicicleta de alta calidad con configuración estándar.'}</p>
              
              <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-semibold text-secondary mb-3">Características del producto</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Categoría: <span className="font-medium">{product.category}</span></li>
                  <li>Precio: <span className="font-medium text-primary text-lg">
                    €{(typeof product.basePrice === 'number' && !isNaN(product.basePrice)) 
                      ? product.basePrice.toFixed(2) 
                      : (parseFloat(String(product.basePrice)) || 0).toFixed(2)}
                  </span></li>
                  {product.description && <li>Descripción completa: <span className="font-medium">{product.description}</span></li>}
                </ul>
              </div>
              
              <div className="p-5 border rounded-lg bg-gray-50 mb-8">
                <h4 className="font-semibold text-secondary mb-2">Información adicional</h4>
                <p className="text-gray-600">
                  Este modelo cuenta con una configuración estándar de alta calidad. 
                  No requiere personalización adicional y está listo para ser utilizado inmediatamente.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="btn btn-primary flex-1 py-3"
                  onClick={() => {
                    CartApi.addToCart({
                      product_id: product.id,
                      selected_options: [],
                      quantity: 1
                    }).then(() => {
                      alert('Producto añadido al carrito');
                      router.push('/cart');
                    }).catch(err => {
                      console.error('Error al añadir al carrito:', err);
                      alert('Ocurrió un error al añadir el producto al carrito');
                    });
                  }}
                >
                  Añadir al carrito
                </button>
                <Link href="/products" className="btn btn-outline flex-1 py-3">
                  Ver otros modelos
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-4">
            <details>
              <summary className="cursor-pointer hover:text-gray-500">Información técnica (solo para desarrolladores)</summary>
              <p className="mt-2">
                ID: {product.id}, Categoría: {product.category}
              </p>
            </details>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel de opciones - 8 columnas en pantallas grandes */}
          <div className="lg:col-span-8 space-y-6">
            {/* Vista previa del producto */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Tu {product.name}</h2>
                <span className="px-4 py-1.5 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                  Personalización
                </span>
              </div>
              
              <div className="relative aspect-video bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-4">
                {/* Aquí iría la imagen de vista previa de la bicicleta */}
                <div className="text-center p-6">
                  <p className="text-gray-400 mb-2">Vista previa de tu bicicleta personalizada</p>
                  <p className="text-xs text-gray-400">La imagen es ilustrativa y puede variar</p>
                </div>
              </div>
              
            </div>

            {/* Secciones de selección de componentes */}
            {partTypesToRender.map((partType) => (
              <div id={`part-type-${partType.id}`} key={partType.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${
                activeSection === partType.id 
                  ? 'border-primary shadow-md' 
                  : 'border-gray-100'
              } p-6`}>
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">{partType.name}</h2>
                </div>
                
                {partType.options && partType.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partType.options.map((option) => {
                      // Solo mostrar incompatibilidad si hay al menos una selección previa
                      const isIncompatible = option.is_compatible === false && Object.keys(selectedOptions).length > 0;
                      const isSelected = selectedOptions[partType.id] === option.id;
                      
                      return (
                        <div 
                          key={option.id}
                          className={`
                            relative border rounded-xl p-4 transition-all duration-200 hover:shadow-md
                            ${isSelected 
                              ? 'border-primary bg-primary bg-opacity-5 shadow-sm' 
                              : 'border-gray-200 hover:border-primary'}
                            ${isIncompatible ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                          `}
                          onClick={() => {
                            if (!isIncompatible) {
                              handleOptionSelect(partType.id, option.id);
                            } else {
                              alert(`La opción "${option.name}" no es compatible con tu selección actual.`);
                            }
                          }}
                        >
                          {/* Imagen o icono de la opción (placeholder) */}
                          <div className="w-full h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{option.name}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">{option.name}</span>
                            <span className="text-primary font-bold">
                              +€{option.base_price ? option.base_price.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          
                          {isIncompatible && (
                            <div className="mt-2 flex items-center text-red-500 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>No compatible</span>
                            </div>
                          )}
                          
                          {isSelected && (
                            <div className="absolute top-3 right-3 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500">No hay opciones disponibles para este tipo de componente.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Panel de resumen - 4 columnas en pantallas grandes */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Resumen de tu pedido</h2>
              
              {/* Progreso de la personalización */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progreso</span>
                  <span className="text-sm font-medium">
                    {Object.keys(selectedOptions).length}/{partTypesToRender.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ 
                      width: `${(Object.keys(selectedOptions).length / partTypesToRender.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Precio base */}
              <div className="rounded-lg bg-gray-50 p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Precio base</span>
                  <span className="font-bold">
                    €{typeof product.basePrice === 'number' && !isNaN(product.basePrice) 
                      ? product.basePrice.toFixed(2) 
                      : (parseFloat(String(product.basePrice)) || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Opciones seleccionadas */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">COMPONENTES SELECCIONADOS</h3>
                
                {partTypesToRender.map((partType) => {
                  const selectedOptionId = selectedOptions[partType.id];
                  let selectedOptionName = 'No seleccionado';
                  let selectedOptionPrice = 0;
                  let isCompatible = true;
                  
                  if (selectedOptionId) {
                    const option = partType.options.find(opt => opt.id === selectedOptionId);
                    if (option) {
                      selectedOptionName = option.name;
                      selectedOptionPrice = option.base_price;
                      isCompatible = option.is_compatible !== false;
                    }
                  }
                  
                  return (
                    <div 
                      key={partType.id} 
                      className={`p-3 rounded-lg ${selectedOptionId ? 'bg-gray-50' : 'bg-gray-50 bg-opacity-50'} cursor-pointer hover:bg-gray-100 transition-colors`}
                      onClick={() => scrollToSection(partType.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs text-gray-500">{partType.name}</span>
                          <div className={`font-medium ${!isCompatible ? 'text-red-500' : 'text-gray-800'}`}>
                            {selectedOptionId ? selectedOptionName : 'No seleccionado'}
                          </div>
                        </div>
                        {selectedOptionId && (
                          <span className="font-bold text-primary">
                            +€{selectedOptionPrice ? selectedOptionPrice.toFixed(2) : '0.00'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-xl text-gray-800">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-6">Los precios incluyen IVA</p>
              </div>
              
              {/* Botón de añadir al carrito */}
              <button 
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all ${
                  loading || !partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl'
                }`}
                onClick={handleAddToCart}
                disabled={loading || 
                  !partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined)
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : !partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined) ? (
                  'Selecciona todas las opciones'
                ) : (
                  'Añadir al carrito'
                )}
              </button>
              
              {/* Opciones pendientes de selección */}
              {!partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined) && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-amber-700 text-sm font-medium">
                    Aún necesitas seleccionar {partTypesToRender.length - Object.keys(selectedOptions).length} opciones para continuar:
                  </p>
                  <ul className="mt-2 text-xs text-amber-600 pl-5 list-disc">
                    {partTypesToRender.filter(partType => !selectedOptions[partType.id]).map(partType => (
                      <li key={partType.id} className="cursor-pointer hover:text-amber-800" onClick={() => scrollToSection(partType.id)}>
                        {partType.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeProduct; 