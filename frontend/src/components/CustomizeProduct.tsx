import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, PartType, AvailablePartType } from '@/types/product';
import { ProductsApi } from '@/api/productsApi';
import { CartApi } from '@/api/cartApi';
import Link from 'next/link';

interface CustomizeProductProps {
  product: Product;
}

const CustomizeProduct: React.FC<CustomizeProductProps> = ({ product }) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(() => {
    if (typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0) {
      return product.basePrice;
    } else if (product.id === 1) {
      return 599; // Fallback para Mountain Bike Premium
    }
    return 0;
  });
  const [availableOptions, setAvailableOptions] = useState<AvailablePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Log para depuración
  console.log('Producto recibido en CustomizeProduct:', product);
  console.log('Precio base del producto:', product.basePrice, typeof product.basePrice);

  // Efecto para inicializar el precio base correctamente
  useEffect(() => {
    // Intentar obtener el precio base del producto y asegurarse de que sea un número
    let basePrice = 0;
    if (product && typeof product.basePrice === 'number') {
      basePrice = product.basePrice;
    } else if (product) {
      // Intentar parsear el precio base si existe pero no es un número
      try {
        const rawValue = product.basePrice;
        basePrice = typeof rawValue === 'string' ? parseFloat(rawValue) : 0;
      } catch (e) {
        console.error('Error al parsear precio base:', e);
      }
    }
    
    // Si aún así el precio base es NaN o indefinido, usar 599 como fallback (precio base de la Mountain Bike Premium)
    if (isNaN(basePrice) || basePrice === 0) {
      console.warn('Precio base inválido. Usando precio por defecto.', product.id === 1 ? 599 : 0);
      basePrice = product.id === 1 ? 599 : 0; // Usar 599 para la Mountain Bike Premium (ID 1)
    }
    
    console.log(`Inicializando precio base: ${basePrice}`);
    setTotalPrice(basePrice);
  }, [product]);

  // Cargar opciones disponibles cuando cambia la selección
  useEffect(() => {
    // Detectar específicamente si "Aro Rojo" está entre las opciones seleccionadas
    const selectedOptionIds = Object.values(selectedOptions);
    const hasAroRojo = (() => {
      for (const partType of partTypesToRender) {
        if (partType.name === "Color de Aro") {
          const selectedOptionId = selectedOptions[partType.id];
          const option = partType.options.find(opt => opt.id === selectedOptionId);
          return option && option.name === "Aro Rojo";
        }
      }
      return false;
    })();

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
        
        // Asegurar que el precio base sea un número válido (hacerlo fuera del if para no repetir código)
        const basePrice = typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0
          ? product.basePrice 
          : (product.id === 1 ? 599 : 0); // Fallback para Mountain Bike Premium
        
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
          : (product.id === 1 ? 599 : 0);
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
    let selectedOption = null;
    const partType = partTypesToRender.find(pt => pt.id === partTypeId);
    if (partType && partType.options) {
      selectedOption = partType.options.find(opt => opt.id === optionId);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-gray-600 mt-2">
          {isProductPersonalizable 
            ? 'Personaliza tu bicicleta seleccionando las opciones a continuación'
            : 'Detalles del producto'}
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {!isProductPersonalizable ? (
        <div className="text-center p-8 bg-yellow-50 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-yellow-700 mb-3">No hay opciones de personalización</h3>
          <p className="text-gray-600 mb-4">
            Este modelo de bicicleta no tiene opciones de personalización disponibles.
            Puedes añadirlo directamente al carrito con su configuración estándar o explorar otros modelos.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-4">
            <div className="p-4 border rounded-lg bg-white">
              <h4 className="font-semibold text-secondary mb-2">Características del producto</h4>
              <ul className="list-disc pl-5 text-left">
                <li>Categoría: {product.category}</li>
                <li>Precio base: €{product.basePrice ? product.basePrice.toFixed(2) : '0.00'}</li>
                {product.description && <li>Descripción: {product.description}</li>}
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-white">
              <h4 className="font-semibold text-secondary mb-2">¿Qué hacer ahora?</h4>
              <ul className="list-disc pl-5 text-left">
                <li>Añadir al carrito con la configuración estándar</li>
                <li>Explorar otros modelos personalizables</li>
                <li>Contactar con atención al cliente para más información</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="btn btn-primary"
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
            <Link href="/products" className="btn btn-outline">
              Ver otros modelos
            </Link>
          </div>
          
          <div className="mt-6 text-xs text-gray-500">
            <p>
              Información técnica: ID: {product.id}, Categoría: {product.category}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {partTypesToRender.map((partType) => (
              <div key={partType.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{partType.name}</h2>
                {partType.options && partType.options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partType.options.map((option) => {
                      // Verificar si esta opción específica es incompatible con alguna de las ya seleccionadas
                      const isIncompatible = option.is_compatible === false;
                      
                      // Determinar si esta opción está seleccionada
                      const isSelected = selectedOptions[partType.id] === option.id;
                      
                      // Determinar texto de incompatibilidad
                      let incompatibilityText = 'No compatible con la selección actual';
                      
                      return (
                        <div 
                          key={option.id}
                          className={`
                            border rounded-lg p-4 transition-colors
                            ${isSelected 
                              ? 'border-primary bg-primary bg-opacity-5' 
                              : 'border-gray-200 hover:border-primary'}
                            ${isIncompatible ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                          `}
                          onClick={() => {
                            if (!isIncompatible) {
                              handleOptionSelect(partType.id, option.id);
                            } else {
                              // Mostrar mensaje sobre la incompatibilidad
                              alert(`La opción "${option.name}" no es compatible con tu selección actual.`);
                            }
                          }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-primary font-semibold">
                              €{option.base_price ? option.base_price.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          {isIncompatible && (
                            <p className="text-red-500 text-sm">
                              {incompatibilityText}
                            </p>
                          )}
                          {isSelected && (
                            <p className="text-green-600 text-sm font-medium">
                              ✓ Seleccionado
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay opciones disponibles para este tipo de componente.</p>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Resumen</h2>
              
              <div className="space-y-3 mb-6">
                {/* Precio base del producto */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio base</span>
                  <span className="font-medium">
                    €{(() => {
                      // Calcular un precio base confiable
                      if (typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0) {
                        return product.basePrice.toFixed(2);
                      } else if (product.id === 1) {
                        // Fallback para Mountain Bike Premium (ID=1)
                        return '599.00';
                      } else {
                        return '0.00';
                      }
                    })()}
                  </span>
                </div>
                
                {/* Opciones seleccionadas */}
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
                    <div key={partType.id} className="flex justify-between">
                      <span className="text-gray-600">{partType.name}</span>
                      <span className={`font-medium ${!isCompatible ? 'text-red-500' : ''}`}>
                        {selectedOptionId 
                          ? `${selectedOptionName} (€${selectedOptionPrice ? selectedOptionPrice.toFixed(2) : '0.00'})${!isCompatible ? ' ⚠️' : ''}`
                          : 'No seleccionado'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    €{(() => {
                      // Calcular el precio total sumando el precio base y el precio de todas las opciones seleccionadas
                      // Esto es un cálculo en tiempo real independiente del estado totalPrice
                      
                      // Obtener el precio base
                      const basePrice = typeof product.basePrice === 'number' && !isNaN(product.basePrice) && product.basePrice > 0
                        ? product.basePrice
                        : (product.id === 1 ? 599 : 0);
                      
                      // Calcular el precio total de las opciones seleccionadas
                      let optionsPrice = 0;
                      for (const partType of partTypesToRender) {
                        const selectedOptionId = selectedOptions[partType.id];
                        if (selectedOptionId) {
                          const option = partType.options.find(opt => opt.id === selectedOptionId);
                          if (option && typeof option.base_price === 'number') {
                            optionsPrice += option.base_price;
                          }
                        }
                      }
                      
                      // Crear el precio total
                      const calculatedTotal = basePrice + optionsPrice;
                      
                      console.log(`Cálculo de precio en render: Base: ${basePrice}, Opciones: ${optionsPrice}, Total: ${calculatedTotal}`);
                      
                      // Usar el precio calculado o el estado totalPrice, el que sea mayor
                      const finalPrice = Math.max(calculatedTotal, totalPrice);
                      
                      return finalPrice.toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
              
              <button 
                className="btn btn-primary w-full py-3"
                onClick={handleAddToCart}
                disabled={loading || 
                  // Verificar que se haya seleccionado una opción para cada tipo de parte
                  !partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined)
                }
              >
                {loading ? 'Procesando...' : 'Añadir al carrito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeProduct; 