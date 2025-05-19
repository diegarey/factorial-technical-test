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

const CustomizeProduct: React.FC<CustomizeProductProps> = ({ product }) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0); // Initialize to 0 and update in useEffect
  const [availableOptions, setAvailableOptions] = useState<AvailablePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Debug logging
  console.log('>>>>>>> PRODUCT RECEIVED IN CUSTOMIZEPRODUCT:', product);
  console.log('>>>>>>> PRODUCT BASE PRICE:', product.basePrice, typeof product.basePrice);
  console.log('>>>>>>> BASE PRICE CONVERTED TO NUMBER:', Number(product.basePrice));
  console.log('>>>>>>> COMPLETE PRODUCT OBJECT:', JSON.stringify(product, null, 2));

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

  // Load available options when selection changes
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const selectedOptionIds = Object.values(selectedOptions);
        
        console.log('Product ID for options:', product.id);
        console.log('Selected options:', selectedOptionIds);
        
        // Get available options from the API
        const options = await ProductsApi.getProductOptions(product.id, selectedOptionIds);
        console.log('Available options received:', options);
        
        // Detailed log of options for debugging
        options.forEach(partType => {
          console.log(`Options for ${partType.name} (ID: ${partType.id}):`);
          partType.options.forEach(option => {
            console.log(`- ${option.name} (ID: ${option.id}): compatible=${option.is_compatible}, available=${option.available_for_selection !== false}, selected=${option.selected || false}`);
          });
        });
        
        if (Array.isArray(options)) {
          // Verify compatibility of selected options
          if (selectedOptionIds.length > 0) {
            try {
              const compatibilityResult = await ProductsApi.validateCompatibility(selectedOptionIds, product.id);
              console.log('Compatibility result:', compatibilityResult);
              
              // Update options with the compatibility result from the backend
              if (compatibilityResult && compatibilityResult.product && compatibilityResult.product.components) {
                // Use the backend response directly, which includes the updated compatibility status
                const updatedComponents = compatibilityResult.product.components;
                
                // Convert components from API response format to frontend format
                const updatedOptions = updatedComponents.map((component: any) => ({
                  id: component.id,
                  name: component.name,
                  options: component.options.map((opt: any) => ({
                    id: opt.id,
                    name: opt.name,
                    base_price: opt.base_price,
                    in_stock: opt.in_stock,
                    selected: opt.selected,
                    is_compatible: opt.is_compatible,
                    available_for_selection: opt.available_for_selection !== false,
                    availability_reason: opt.availability_reason
                  }))
                }));
                
                console.log('Options updated with compatibility status:', updatedOptions);
                setAvailableOptions(updatedOptions);
              } else {
                // If the response doesn't have the expected format, use the original options
                console.warn('Compatibility response does not have the expected format, using original options');
                setAvailableOptions(options);
              }
            } catch (compatibilityError) {
              console.error('Error validating compatibility:', compatibilityError);
              // In case of compatibility error, show options as they come from the API
              setAvailableOptions(options);
            }
          } else {
            setAvailableOptions(options);
          }
          
          // Process auto-selected options from the backend
          const newSelections = { ...selectedOptions };
          let selectionUpdated = false;
          
          options.forEach(partType => {
            partType.options.forEach(option => {
              if (option.selected && (!newSelections[partType.id] || newSelections[partType.id] !== option.id)) {
                console.log(`Auto-selecting option: ${option.name} (ID: ${option.id}) of type ${partType.name}`);
                newSelections[partType.id] = option.id;
                selectionUpdated = true;
              }
            });
          });
          
          if (selectionUpdated) {
            console.log('Updating selections with backend auto-selection:', newSelections);
            setSelectedOptions(newSelections);
          }
          
          // Calculate total price
          if (selectedOptionIds.length > 0) {
            try {
              const price = await ProductsApi.calculatePrice(selectedOptionIds);
              if (typeof price === 'number' && !isNaN(price)) {
                const basePrice = typeof product.basePrice === 'number' && !isNaN(product.basePrice) ? product.basePrice : 0;
                const newTotalPrice = basePrice + price;
                setTotalPrice(Math.max(newTotalPrice, basePrice));
              }
            } catch (priceError) {
              console.error('Error calculating price:', priceError);
              setTotalPrice(product.basePrice || 0);
            }
          } else {
            setTotalPrice(product.basePrice || 0);
          }
        } else {
          console.error('Unexpected options format:', options);
          setError('The received options have an unexpected format.');
        }
      } catch (error) {
        console.error('Error loading options:', error);
        setError('Could not load options. Please reload the page.');
        setTotalPrice(product.basePrice || 0);
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
        let errorMessage = 'The selected options are not compatible with each other.';
        
        if (incompatibilityDetails) {
          if (incompatibilityDetails.type === 'excludes') {
            errorMessage = `The option "${incompatibilityDetails.option_name}" is not compatible with "${incompatibilityDetails.excluded_option_name}".`;
          } else if (incompatibilityDetails.type === 'requires') {
            errorMessage = `The option "${incompatibilityDetails.option_name}" requires selecting "${incompatibilityDetails.required_option_name}".`;
          }
        }
        
        alert(`Cannot add to cart: ${errorMessage} Please choose another combination.`);
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
      alert('Product added to cart!');
      router.push('/cart');
      
    } catch (error) {
      console.error("ERROR ADDING TO CART:", error);
      let errorMessage = 'Could not add to cart';
      
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

  // Determine which options to show - use available options from API or product's partTypes
  const usePartTypes = availableOptions.length === 0;
  const partTypesToRender = usePartTypes ? (product.partTypes || []) : availableOptions;
  
  console.log('Using product partTypes options:', usePartTypes);
  console.log('PartTypes to render:', partTypesToRender);

  // Check if the product is customizable
  const isProductPersonalizable = partTypesToRender.length > 0;

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
                ? 'Personalize your bike by selecting the options below'
                : 'Product details'}
            </p>
          </div>
          {isProductPersonalizable && (
            <div className="mt-4 md:mt-0 flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Advanced customization available</span>
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
                <p className="text-lg font-medium text-gray-900">Updating configuration</p>
                <p className="text-sm text-gray-500">One moment, please...</p>
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
              <p className="text-gray-600 mb-6">{product.description || 'High-quality bike with standard configuration.'}</p>
              
              <div className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-semibold text-secondary mb-3">Product features</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-2">
                  <li>Category: <span className="font-medium">{product.category}</span></li>
                  <li>Price: <span className="font-medium text-primary text-lg">
                    €{formatPrice(product.basePrice)}
                  </span></li>
                  {product.description && <li>Complete description: <span className="font-medium">{product.description}</span></li>}
                </ul>
              </div>
              
              <div className="p-5 border rounded-lg bg-gray-50 mb-8">
                <h4 className="font-semibold text-secondary mb-2">Additional information</h4>
                <p className="text-gray-600">
                  This model comes with a standard high-quality configuration. 
                  It doesn't require additional customization and is ready to be used immediately.
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
                      alert('Product added to cart');
                      router.push('/cart');
                    }).catch(err => {
                      console.error('Error adding to cart:', err);
                      alert('An error occurred while adding the product to the cart');
                    });
                  }}
                >
                  Add to cart
                </button>
                <Link href="/products" className="btn btn-outline flex-1 py-3">
                  View other models
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-400 border-t border-gray-100 pt-4">
            <details>
              <summary className="cursor-pointer hover:text-gray-500">Technical information (for developers only)</summary>
              <p className="mt-2">
                ID: {product.id}, Category: {product.category}
              </p>
            </details>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel of options - 8 columns on large screens */}
          <div className="lg:col-span-8 space-y-6">
            {/* Product preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your {product.name}</h2>
                <span className="px-4 py-1.5 bg-primary bg-opacity-10 text-primary rounded-full text-sm font-medium">
                  Customization
                </span>
              </div>
              
              <div className="relative aspect-video bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-4">
                {/* Here would go the preview image of the bike */}
                <div className="text-center p-6">
                  <p className="text-gray-400 mb-2">Preview of your customized bike</p>
                  <p className="text-xs text-gray-400">The image is illustrative and may vary</p>
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
                      // Use directly the value of is_compatible from the backend
                      const isIncompatible = option.is_compatible === false;
                      const isNotAvailable = option.available_for_selection === false;
                      const isSelected = selectedOptions[partType.id] === option.id;
                      
                      // Logs for debugging
                      if (partType.name === 'Horquilla') {
                        console.log(`Rendering horquilla ${option.name}: compatible=${option.is_compatible}, available=${option.available_for_selection !== false}, selected=${isSelected}`);
                      }
                      
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
                              // Allow deselection if already selected
                              handleOptionSelect(partType.id, option.id);
                            } else if (!isIncompatible && !isNotAvailable) {
                              handleOptionSelect(partType.id, option.id);
                            } else if (isNotAvailable) {
                              alert(`You've already selected another option from ${partType.name}. You must deselect that option first.`);
                            } else {
                              // Show a more descriptive alert that indicates why it's not compatible
                              alert(`The option "${option.name}" is not compatible with your current selection. Please select another option or change your previous selections.`);
                            }
                          }}
                        >
                          {/* Image or icon of the option (placeholder) */}
                          <div className="w-full h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{option.name}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${isIncompatible ? 'text-red-600' : isNotAvailable ? 'text-gray-500' : 'text-gray-800'}`}>
                              {option.name}
                            </span>
                            <span className="text-primary font-bold">
                              +€{option.base_price ? option.base_price.toFixed(2) : '0.00'}
                            </span>
                          </div>
                          
                          {isIncompatible && (
                            <div className="mt-2 flex items-center text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Not compatible with your current selection</span>
                            </div>
                          )}
                          
                          {isNotAvailable && !isIncompatible && (
                            <div className="mt-2 flex items-center text-gray-500 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>You've already selected another option</span>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-3 right-3 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {/* Add a forbidden icon for incompatible options */}
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
                    <p className="text-gray-500">No options available for this component type.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary panel - 4 columns on large screens */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order summary</h2>
              
              {/* Customization progress */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
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
              
              {/* Base price */}
              <div className="rounded-lg bg-gray-50 p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-700">Base price</span>
                  <span className="font-bold">
                    €{formatPrice(product.basePrice)}
                  </span>
                </div>
              </div>
              
              {/* Selected options */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">SELECTED COMPONENTS</h3>
                
                {partTypesToRender.map((partType) => {
                  const selectedOptionId = selectedOptions[partType.id];
                  let selectedOptionName = 'Not selected';
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
                            {selectedOptionId ? selectedOptionName : 'Not selected'}
                          </div>
                        </div>
                        {selectedOptionId && (
                          <div className="flex items-center">
                            <span className="font-bold text-primary mr-2">
                              +€{selectedOptionPrice ? selectedOptionPrice.toFixed(2) : '0.00'}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent the onClick of the container from being active
                                handleOptionSelect(partType.id, selectedOptionId);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Deselect option"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
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
                <p className="text-xs text-gray-500 mb-6">Prices include VAT</p>
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
                  'Select all options'
                ) : (
                  'Add to cart'
                )}
              </button>
              
              {/* Pending options to select */}
              {!partTypesToRender.every(partType => selectedOptions[partType.id] !== undefined) && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-amber-700 text-sm font-medium">
                    You still need to select {partTypesToRender.length - Object.keys(selectedOptions).length} options to continue:
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