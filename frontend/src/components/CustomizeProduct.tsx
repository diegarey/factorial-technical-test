import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, PartType, AvailablePartType } from '@/types/product';
import { ProductsApi } from '@/api/productsApi';
import { CartApi } from '@/api/cartApi';
import Link from 'next/link';
import Image from 'next/image';
import { convertToValidPrice, formatPrice } from '../utils/dataUtils';

interface CustomizeProductProps {
  product: Product;
}

interface ConditionalPriceInfo {
  originalPrice: number;
  conditionalPrice: number;
}

interface ConditionalPricesMap {
  [key: number]: ConditionalPriceInfo;
}

const CustomizeProduct: React.FC<CustomizeProductProps> = ({ product }) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [availableOptions, setAvailableOptions] = useState<AvailablePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [conditionalPrices, setConditionalPrices] = useState<ConditionalPricesMap>({});
  
  // Debug logging
  console.log('>>>>>>> PRODUCT RECEIVED IN CUSTOMIZEPRODUCT:', product);
  console.log('>>>>>>> PRODUCT BASE PRICE:', product.basePrice, typeof product.basePrice);
  console.log('>>>>>>> BASE PRICE CONVERTED TO NUMBER:', Number(product.basePrice));
  console.log('>>>>>>> COMPLETE PRODUCT OBJECT:', JSON.stringify(product, null, 2));

  // Función auxiliar para aplicar precios condicionales
  const applyConditionalPrices = (options: AvailablePartType[], condPrices: ConditionalPricesMap): AvailablePartType[] => {
    console.log('🔧 Applying conditional prices to options');
    
    return options.map(partType => ({
      ...partType,
      options: partType.options.map(option => {
        const conditionalPrice = condPrices[option.id];
        if (conditionalPrice) {
          console.log(`🔧 Option ${option.name} gets conditional price: ${option.base_price} -> ${conditionalPrice.conditionalPrice}`);
          return {
            ...option,
            conditional_price: {
              originalPrice: option.base_price,
              conditionalPrice: conditionalPrice.conditionalPrice
            }
          };
        }
        return option;
      })
    }));
  };

  // Determine which options to show - use available options from API or product's partTypes
  const usePartTypes = availableOptions.length === 0;
  const partTypesToRender = usePartTypes ? (product.partTypes || []) : availableOptions;
  
  console.log('Using product partTypes options:', usePartTypes);
  console.log('PartTypes to render:', partTypesToRender);

  // Check if the product is customizable
  const isProductPersonalizable = partTypesToRender.length > 0;

  // Effect to initialize the base price correctly - use ONLY API data
  useEffect(() => {
    // Get the base price using the utility function
    const basePrice = convertToValidPrice(product.basePrice, 0);
    
    // Update the total price
    if (basePrice > 0) {
      console.log(`Initializing total price with base price: ${basePrice}`);
      setTotalPrice(basePrice);
    } else {
      console.warn('Initializing total price to 0 because no valid base price was found');
      setTotalPrice(0);
    }
  }, [product]);

  // Calcula el precio total basado en las opciones seleccionadas
  useEffect(() => {
    const calculateTotalPrice = async () => {
      // Si no hay opciones seleccionadas, mostrar solo el precio base
      if (Object.keys(selectedOptions).length === 0) {
        setTotalPrice(product.basePrice || 0);
        return;
      }

      try {
        const selectedOptionIds = Object.values(selectedOptions);
        console.log('Calculando precio para opciones seleccionadas:', selectedOptionIds);
        
        // Usar directamente la API para calcular el precio total
        const priceResponse = await ProductsApi.calculatePrice(selectedOptionIds);
        
        if (priceResponse && typeof priceResponse.total_price === 'number') {
          const basePrice = convertToValidPrice(product.basePrice, 0);
          const optionsPrice = priceResponse.total_price;
          const newTotalPrice = basePrice + optionsPrice;
          
          console.log(`Precio calculado desde el backend - Base: ${basePrice}, Opciones: ${optionsPrice}, Total: ${newTotalPrice}`);
          setTotalPrice(newTotalPrice);
        }
      } catch (error) {
        console.error('Error al calcular precio total:', error);
        
        // En caso de error, calcular el precio manualmente sumando los precios base
        let manualTotal = product.basePrice || 0;
        
        Object.entries(selectedOptions).forEach(([partTypeIdStr, optionId]) => {
          const partTypeId = Number(partTypeIdStr);
          const partType = partTypesToRender.find(pt => pt.id === partTypeId);
          
          if (partType) {
            const option = partType.options.find(opt => opt.id === optionId);
            if (option) {
              manualTotal += option.base_price;
            }
          }
        });
        
        console.warn(`Usando cálculo manual de precio como fallback: ${manualTotal}`);
        setTotalPrice(manualTotal);
      }
    };
    
    calculateTotalPrice();
  }, [selectedOptions, product.basePrice, partTypesToRender]);

  // Load available options when selection changes
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const selectedOptionIds = Object.values(selectedOptions);
        
        console.log('🔍 Product ID for options:', product.id);
        console.log('🔍 Selected options:', selectedOptionIds);
        
        // Get available options from the API
        const options = await ProductsApi.getProductOptions(product.id, selectedOptionIds);
        console.log('🔍 Available options received:', options);
        
        // Para debug: examinar detalladamente cada opción
        options.forEach(partType => {
          console.log(`🔍 Part type ${partType.name} (ID: ${partType.id}):`);
          partType.options.forEach(option => {
            console.log(`  - Option ${option.name} (ID: ${option.id}), price: ${option.base_price}`);
          });
        });
        
        // Calculate total price and get conditional prices
        if (selectedOptionIds.length > 0) {
          try {
            console.log('🔍 Calling calculatePrice with options:', selectedOptionIds);
            const priceResponse = await ProductsApi.calculatePrice(selectedOptionIds);
            console.log('🔍 Price response raw:', priceResponse);
            console.log('🔍 Price response JSON:', JSON.stringify(priceResponse));
            console.log('🔍 Total price from API:', priceResponse.total_price);
            console.log('🔍 Conditional prices from API:', priceResponse.conditional_prices);
            
            // Procesar precios condicionales si existen
            const conditionalPricesMap: ConditionalPricesMap = {};
            
            if (priceResponse.conditional_prices && typeof priceResponse.conditional_prices === 'object') {
              console.log('🔍 Processing conditional prices:', priceResponse.conditional_prices);
              
              // Si es un objeto (no un array)
              if (!Array.isArray(priceResponse.conditional_prices)) {
                console.log('🔍 Conditional prices is an object with keys:', Object.keys(priceResponse.conditional_prices));
                
                Object.entries(priceResponse.conditional_prices).forEach(([key, value]) => {
                  const optionId = Number(key);
                  
                  console.log(`🔍 Processing price for option ID ${optionId}:`, value);
                  
                  // Buscar el precio original de esta opción
                  let originalPrice = 0;
                  const option = options.flatMap(pt => pt.options).find(opt => opt.id === optionId);
                  if (option) {
                    originalPrice = option.base_price;
                    console.log(`🔍 Found original price for option ${option.name}: ${originalPrice}`);
                  } else {
                    console.log(`🔍 Could not find original price for option ID ${optionId}`);
                  }
                  
                  // Determinar el precio condicional
                  let conditionalPrice = 0;
                  
                  if (typeof value === 'number') {
                    conditionalPrice = value;
                    console.log(`🔍 Value is a number: ${conditionalPrice}`);
                  } else if (value && typeof value === 'object') {
                    console.log(`🔍 Value is an object:`, value);
                    const valueObj = value as Record<string, any>;
                    
                    if ('conditionalPrice' in valueObj) {
                      conditionalPrice = Number(valueObj.conditionalPrice);
                      console.log(`🔍 Found conditionalPrice field: ${conditionalPrice}`);
                    } else if ('price' in valueObj) {
                      conditionalPrice = Number(valueObj.price);
                      console.log(`🔍 Found price field: ${conditionalPrice}`);
                    } else if ('conditional_price' in valueObj) {
                      conditionalPrice = Number(valueObj.conditional_price);
                      console.log(`🔍 Found conditional_price field: ${conditionalPrice}`);
                    } else {
                      conditionalPrice = Number(value);
                      console.log(`🔍 Using value as number: ${conditionalPrice}`);
                    }
                  }
                  
                  if (conditionalPrice > 0) {
                    conditionalPricesMap[optionId] = {
                      originalPrice,
                      conditionalPrice
                    };
                    console.log(`🔍 Final conditional price for option ${optionId}:`, conditionalPricesMap[optionId]);
                  }
                });
              } 
              // Si es un array
              else if (Array.isArray(priceResponse.conditional_prices)) {
                const condPricesArray = priceResponse.conditional_prices as any[];
                console.log('🔍 Conditional prices is an array with length:', condPricesArray.length);
                
                condPricesArray.forEach(item => {
                  if (item && typeof item === 'object' && 'option_id' in item) {
                    const optionId = Number(item.option_id);
                    const originalPrice = Number(item.original_price || item.originalPrice || 0);
                    const conditionalPrice = Number(item.conditional_price || item.conditionalPrice || 0);
                    
                    conditionalPricesMap[optionId] = {
                      originalPrice,
                      conditionalPrice
                    };
                    console.log(`🔍 Added conditional price from array item for option ${optionId}:`, conditionalPricesMap[optionId]);
                  }
                });
              }
              
              console.log('🔍 Final conditional prices map:', conditionalPricesMap);
            } else {
              console.log('🔍 No conditional prices found in the response');
            }
            
            // Guardar los precios condicionales en el estado
            setConditionalPrices(conditionalPricesMap);
            
            // Aplicar los precios condicionales a las opciones
            console.log('🔍 Applying conditional prices to options');
            const updatedOptions = applyConditionalPrices(options, conditionalPricesMap);
            
            console.log('🔍 Setting updated options with conditional prices');
            setAvailableOptions(updatedOptions);
            
          } catch (priceError) {
            console.error('Error calculating price:', priceError);
            setConditionalPrices({});
            setAvailableOptions(options);
          }
        } else {
          setConditionalPrices({});
          setAvailableOptions(options);
        }
        
      } catch (error) {
        console.error('Error loading options:', error);
        setError('No se pudieron cargar las opciones. Por favor, recarga la página.');
        setConditionalPrices({});
      } finally {
        setLoading(false);
      }
    };
    
    loadOptions();
  }, [selectedOptions, product]);

  const handleOptionSelect = (partTypeId: number, optionId: number) => {
    console.log(`Selecting option: partTypeId=${partTypeId}, optionId=${optionId}`);
    
    // Get the selected option to get its price
    let selectedOption: any = null;
    const partType = partTypesToRender.find(pt => pt.id === partTypeId);
    if (partType) {
      // Ensure options exists and is an array
      const options = Array.isArray(partType.options) ? partType.options : [];
      selectedOption = options.find(opt => opt.id === optionId);
    }

    // Special detection for Red Rim
    if (selectedOption && selectedOption.name === "Aro Rojo") {
      console.log("********** RED RIM SELECTION DETECTED **********");
      console.log("Current base price:", product.basePrice);
      console.log("Current total price:", totalPrice);
      console.log("Selected options before Red Rim:", selectedOptions);
    }
    
    // Capture current selections for logging after
    const prevSelections = {...selectedOptions};
    
    // Update selected options - allow deselection
    setSelectedOptions(prev => {
      // If the option is already selected, deselect it
      if (prev[partTypeId] === optionId) {
        const newSelection = {...prev};
        delete newSelection[partTypeId];
        console.log('Option deselected:', optionId);
        console.log('New selection:', newSelection);
        return newSelection;
      } else {
        // If not selected, select it
        const newSelection = {
          ...prev,
          [partTypeId]: optionId,
        };
        console.log('New selection:', newSelection);

        // To specifically detect if we're selecting Red Rim
        if (selectedOption && selectedOption.name === "Aro Rojo") {
          console.log("Option IDs after selecting Red Rim:", Object.values(newSelection));
        }
        return newSelection;
      }
    });
    
    // We don't recalculate the price here because the useEffect will handle it
    // We just log the information for debugging
    if (selectedOption) {
      console.log(`Selected option: ${selectedOption.name}, price: ${selectedOption.base_price}`);
    }
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      console.log("=== STARTING ADD TO CART PROCESS ===");
      
      // 1. Prepare the data
      const productId = product.id;
      const selectedOptionIds = Object.values(selectedOptions);
      
      console.log(`Product ID: ${productId}`);
      console.log(`Selected options: ${selectedOptionIds.join(", ")}`);
      
      // 2. Validate compatibility before sending to cart
      console.log("Validating options compatibility...");
      const compatibilityResult = await ProductsApi.validateCompatibility(selectedOptionIds, productId);
      
      console.log("Complete compatibility result:", compatibilityResult);
      
      // Check if any selected option is incompatible
      let isIncompatible = false;
      let incompatibilityDetails = null;
      
      if (compatibilityResult.product && compatibilityResult.product.components) {
        // Examine each component and each selected option
        for (const component of compatibilityResult.product.components) {
          for (const option of component.options) {
            if (option.selected && option.is_compatible === false) {
              isIncompatible = true;
              console.log(`Incompatible option found: ${option.name} (ID: ${option.id})`);
              
              // Capture incompatibility details if they exist
              if (option.compatibility_details) {
                incompatibilityDetails = {
                  type: option.compatibility_details.reason,
                  option_name: option.name,
                  option_id: option.id,
                  required_option_name: undefined,
                  excluded_option_name: undefined
                };
                
                // Add specific details based on incompatibility type
                if (option.compatibility_details.reason === "requires") {
                  incompatibilityDetails.required_option_name = option.compatibility_details.dependency_name;
                } else if (option.compatibility_details.reason === "excludes") {
                  incompatibilityDetails.excluded_option_name = option.compatibility_details.dependency_name;
                }
              }
              break;
            }
          }
          if (isIncompatible) break;
        }
      } else if (compatibilityResult.is_compatible === false) {
        // Old response format
        isIncompatible = true;
        incompatibilityDetails = compatibilityResult.incompatibility_details;
      }
      
      // If there's incompatibility, show message and stop
      if (isIncompatible) {
        let errorMessage = 'Las opciones seleccionadas no son compatibles entre sí.';
        
        if (incompatibilityDetails) {
          if (incompatibilityDetails.type === 'excludes') {
            errorMessage = `La opción "${incompatibilityDetails.option_name}" no es compatible con "${incompatibilityDetails.excluded_option_name}".`;
          } else if (incompatibilityDetails.type === 'requires') {
            errorMessage = `La opción "${incompatibilityDetails.option_name}" requiere seleccionar "${incompatibilityDetails.required_option_name}".`;
          }
        }
        
        alert(`No se puede añadir al carrito: ${errorMessage} Por favor, elige otra combinación.`);
        setLoading(false);
        return;
      }
      
      // 3. Use CartApi to add to cart
      const result = await CartApi.addToCart({
        product_id: productId,
        selected_options: selectedOptionIds,
        quantity: 1
      });
      
      console.log("Product added to cart:", result);
      
      // 4. Show message and redirect
      alert('¡Producto añadido al carrito!');
      router.push('/cart');
      
    } catch (error) {
      console.error("ERROR ADDING TO CART:", error);
      let errorMessage = 'No se pudo añadir al carrito';
      
      if (error instanceof Error) {
        // If it's an API error, try to extract the message
        const apiError = error as any;
        if (apiError.response?.data?.detail) {
          errorMessage = apiError.response.data.detail;
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      setLoading(false);
    }
  };

  // New function to scroll to a section
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
                    €{formatPrice(product.basePrice)}
                  </span></li>
                  {product.description && <li>Descripción completa: <span className="font-medium">{product.description}</span></li>}
                </ul>
              </div>
              
              <div className="p-5 border rounded-lg bg-gray-50 mb-8">
                <h4 className="font-semibold text-secondary mb-2">Información adicional</h4>
                <p className="text-gray-600">
                  Este modelo viene con una configuración estándar de alta calidad.
                  No requiere personalización adicional y está listo para usarse inmediatamente.
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
                      console.error('Error adding to cart:', err);
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
          
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel of options - 8 columns on large screens */}
          <div className="lg:col-span-8 space-y-6">
            {/* Product preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Tu {product.name}</h2>
                <span className="px-4 py-1.5 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                  Personalización
                </span>
              </div>
              
              <div className="relative aspect-video bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-4">
                {/* Here would go the preview image of the bike */}
                <div className="text-center p-6">
                  <p className="text-gray-400 mb-2">Vista previa de tu bicicleta personalizada</p>
                  <p className="text-xs text-gray-400">La imagen es ilustrativa y puede variar</p>
                </div>
              </div>
              
            </div>

            {/* Selection sections of components */}
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
                      const isIncompatible = option.is_compatible === false;
                      const isNotAvailable = option.available_for_selection === false;
                      const isSelected = selectedOptions[partType.id] === option.id;
                      
                      // Debug para esta opción específica
                      console.log(`🔶 Rendering option ${option.name} (ID: ${option.id}):`, {
                        originalPrice: option.base_price,
                        conditionalPrice: option.conditional_price,
                        isSelected,
                        isIncompatible,
                        isNotAvailable
                      });
                      
                      // Verificar si hay precio condicional para esta opción
                      let hasConditionalPrice = false;
                      let displayPrice = option.base_price;
                      const originalPrice = option.base_price;
                      
                      // Revisar si tiene precio condicional en la opción directamente
                      if (option.conditional_price) {
                        console.log(`🔶 Option ${option.name} has conditional price:`, option.conditional_price);
                        hasConditionalPrice = true;
                        displayPrice = option.conditional_price.conditionalPrice;
                      }
                      // O revisar si tiene precio condicional en el estado
                      else if (conditionalPrices[option.id]) {
                        console.log(`🔶 Option ${option.name} has conditional price in state:`, conditionalPrices[option.id]);
                        hasConditionalPrice = true;
                        displayPrice = conditionalPrices[option.id].conditionalPrice;
                      }
                      
                      const showDiscount = hasConditionalPrice && displayPrice < originalPrice;
                      
                      // Debug final para este precio
                      console.log(`🔶 Final price display for ${option.name}: original=${originalPrice}, display=${displayPrice}, showDiscount=${showDiscount}`);
                      
                      return (
                        <div 
                          key={option.id}
                          className={`
                            relative border rounded-xl p-4 transition-all duration-200 hover:shadow-md
                            ${isSelected 
                              ? 'border-primary bg-primary bg-opacity-5 shadow-sm' 
                              : isIncompatible 
                                ? 'border-red-300 bg-red-50'
                                : isNotAvailable
                                  ? 'border-gray-300 bg-gray-50'
                                  : 'border-gray-200 hover:border-primary'}
                            ${(isIncompatible || isNotAvailable) ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          onClick={() => {
                            if (isSelected) {
                              handleOptionSelect(partType.id, option.id);
                            } else if (!isIncompatible && !isNotAvailable) {
                              handleOptionSelect(partType.id, option.id);
                            } else if (isNotAvailable) {
                              alert(`Ya has seleccionado otra opción de ${partType.name}. Debes deseleccionar esa opción primero.`);
                            } else {
                              alert(`La opción "${option.name}" no es compatible con tu selección actual. Por favor, selecciona otra opción o cambia tus selecciones previas.`);
                            }
                          }}
                        >
                          {/* Image or icon of the option (placeholder) */}
                          <div className="w-full h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{option.name}</span>
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <span className={`font-medium ${isIncompatible ? 'text-red-600' : isNotAvailable ? 'text-gray-500' : 'text-gray-800'}`}>
                              {option.name}
                            </span>
                            <div className="flex flex-col items-end">
                              {/* Corregir la variable no definida */}
                              <div className="flex flex-col items-end">
                                {hasConditionalPrice ? (
                                  <>
                                    <div className="flex items-center">
                                      <span className="line-through text-gray-400 mr-2">
                                        +€{originalPrice.toFixed(2)}
                                      </span>
                                      <span className={`font-bold ${displayPrice < originalPrice ? 'text-green-600' : 'text-amber-600'}`}>
                                        +€{displayPrice.toFixed(2)}
                                      </span>
                                    </div>
                                    {displayPrice < originalPrice ? (
                                      <div className="text-xs text-green-600 mt-1">
                                        ¡Ahorro de €{(originalPrice - displayPrice).toFixed(2)}!
                                      </div>
                                    ) : (
                                      <div className="text-xs text-amber-600 mt-1">
                                        Precio especial
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-bold text-primary">
                                    +€{displayPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isIncompatible && (
                            <div className="mt-2 flex items-center text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>No compatible con tu selección actual</span>
                            </div>
                          )}
                          
                          {isNotAvailable && !isIncompatible && (
                            <div className="mt-2 flex items-center text-gray-500 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Ya has seleccionado otra opción</span>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-3 right-3 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {isIncompatible && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

          {/* Summary panel - 4 columns on large screens */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Resumen del pedido</h2>
              
              {/* Customization progress */}
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
              
              {/* Selected options */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">COMPONENTES SELECCIONADOS</h3>
                
                {partTypesToRender.map((partType) => {
                  const selectedOptionId = selectedOptions[partType.id];
                  let selectedOptionName = 'No seleccionado';
                  let selectedOptionPrice = 0;
                  let isCompatible = true;
                  let hasConditionalPrice = false;
                  let displayPrice = 0;
                  let originalPrice = 0;
                  
                  if (selectedOptionId) {
                    const option = partType.options.find(opt => opt.id === selectedOptionId);
                    if (option) {
                      selectedOptionName = option.name;
                      originalPrice = option.base_price;
                      selectedOptionPrice = originalPrice;
                      isCompatible = option.is_compatible !== false;
                      
                      console.log(`🔷 Summary for selected option ${option.name} (ID: ${option.id}):`, {
                        originalPrice,
                        conditionalPrice: option.conditional_price,
                        conditionalPriceInState: conditionalPrices[option.id]
                      });
                      
                      // Verificar si hay precio condicional (de dos maneras)
                      // 1. Desde el objeto option
                      if (option.conditional_price) {
                        console.log(`🔷 Option ${option.name} has conditional price in object:`, option.conditional_price);
                        hasConditionalPrice = true;
                        displayPrice = option.conditional_price.conditionalPrice;
                        selectedOptionPrice = displayPrice;
                      }
                      // 2. Desde el estado
                      else if (conditionalPrices[selectedOptionId]) {
                        console.log(`🔷 Option ${option.name} has conditional price in state:`, conditionalPrices[selectedOptionId]);
                        hasConditionalPrice = true;
                        displayPrice = conditionalPrices[selectedOptionId].conditionalPrice;
                        selectedOptionPrice = displayPrice;
                      } else {
                        displayPrice = originalPrice;
                      }
                      
                      console.log(`🔷 Final price for ${option.name} in summary: original=${originalPrice}, display=${displayPrice}, hasConditional=${hasConditionalPrice}`);
                    }
                  }
                  
                  return (
                    <div 
                      key={partType.id} 
                      className={`p-4 rounded-lg ${selectedOptionId ? 'bg-gray-50' : 'bg-gray-50 bg-opacity-50'} cursor-pointer hover:bg-gray-100 transition-colors`}
                      onClick={() => scrollToSection(partType.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <span className="text-xs text-gray-500">{partType.name}</span>
                          <div className={`font-medium ${!isCompatible ? 'text-red-500' : 'text-gray-800'}`}>
                            {selectedOptionId ? selectedOptionName : 'No seleccionado'}
                          </div>
                        </div>
                        {selectedOptionId && (
                          <div className="flex flex-col items-end">
                            {hasConditionalPrice ? (
                              <>
                                <div className="flex items-center">
                                  <span className="line-through text-gray-400 mr-2">
                                    +€{originalPrice.toFixed(2)}
                                  </span>
                                  <span className={`font-bold ${displayPrice < originalPrice ? 'text-green-600' : 'text-amber-600'}`}>
                                    +€{displayPrice.toFixed(2)}
                                  </span>
                                </div>
                                {displayPrice < originalPrice ? (
                                  <div className="text-xs text-green-600 mt-1">
                                    ¡Ahorro de €{(originalPrice - displayPrice).toFixed(2)}!
                                  </div>
                                ) : (
                                  <div className="text-xs text-amber-600 mt-1">
                                    Precio especial
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="font-bold text-primary">
                                +€{displayPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {hasConditionalPrice && (
                        <div className="mt-2 text-sm bg-green-50 p-2 rounded-lg border border-green-100">
                          <div className="flex items-center text-green-700">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Precio especial por combinación con otras opciones
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Total y descuentos */}
              <div className="rounded-lg bg-gray-50 p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Precio base</span>
                  <span className="font-bold">€{formatPrice(product.basePrice)}</span>
                </div>
              </div>
              
              {/* Subtotal */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold text-xl text-gray-800">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Precios incluyen IVA</p>
              </div>
              
              {/* Add to cart button */}
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
                    Processing...
                  </span>
                ) : !partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined) ? (
                  'Selecciona todas las opciones'
                ) : (
                  'Añadir al carrito'
                )}
              </button>
              
              {/* Pending options to select */}
              {!partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined) && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-amber-700 text-sm font-medium">
                    Todavía necesitas seleccionar {partTypesToRender.length - Object.keys(selectedOptions).length} opciones para continuar:
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