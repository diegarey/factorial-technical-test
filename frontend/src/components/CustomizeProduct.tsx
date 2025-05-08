import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, PartType, AvailablePartType } from '@/types/product';
import { ProductsApi } from '@/api/productsApi';
import { CartApi } from '@/api/cartApi';

interface CustomizeProductProps {
  product: Product;
}

const CustomizeProduct: React.FC<CustomizeProductProps> = ({ product }) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [totalPrice, setTotalPrice] = useState<number>(product.basePrice || 0);
  const [availableOptions, setAvailableOptions] = useState<AvailablePartType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Cargar opciones disponibles cuando cambia la selección
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const selectedOptionIds = Object.values(selectedOptions);
        
        // En producción, obtener opciones disponibles de la API
        const options = await ProductsApi.getProductOptions(product.id, selectedOptionIds);
        setAvailableOptions(options);
        
        // Calcular precio total
        if (selectedOptionIds.length > 0) {
          const price = await ProductsApi.calculatePrice(selectedOptionIds);
          setTotalPrice(price);
        } else {
          setTotalPrice(product.basePrice || 0);
        }
      } catch (error) {
        console.error('Error al cargar opciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // En desarrollo, usar datos del producto directamente
    if (process.env.NODE_ENV === 'development') {
      setAvailableOptions(product.partTypes as unknown as AvailablePartType[]);
      
      // Calcular precio manualmente
      let price = product.basePrice || 0; // Iniciar con el precio base
      Object.values(selectedOptions).forEach(optionId => {
        // Buscar la opción en todos los tipos de partes
        for (const partType of product.partTypes) {
          const option = partType.options.find(opt => opt.id === optionId);
          if (option) {
            price += option.base_price;
            break;
          }
        }
      });
      setTotalPrice(price);
      setLoading(false);
    } else {
      loadOptions();
    }
  }, [selectedOptions, product]);

  const handleOptionSelect = (partTypeId: number, optionId: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [partTypeId]: optionId,
    }));
  };

  const handleAddToCart = async () => {
    // Verificar que se haya seleccionado una opción para cada tipo de parte
    const allPartsSelected = product.partTypes.every(partType => 
      selectedOptions[partType.id] !== undefined
    );

    if (!allPartsSelected) {
      alert('Por favor selecciona una opción para cada tipo de parte');
      return;
    }

    try {
      setLoading(true);
      
      // Obtener la lista de opciones seleccionadas
      const selectedOptionIds = Object.values(selectedOptions);
      
      // Validar compatibilidad de opciones antes de añadir al carrito
      const isCompatible = await ProductsApi.validateCompatibility(selectedOptionIds);
      
      if (!isCompatible) {
        alert('Las opciones seleccionadas no son compatibles entre sí. Por favor revisa tu selección.');
        setLoading(false);
        return;
      }
      
      // Si las opciones son compatibles, añadir al carrito
      const response = await CartApi.addToCart({
        product_id: product.id,
        selected_options: selectedOptionIds,
        quantity: 1
      });
      
      // Si todo salió bien, redirigir al carrito
      alert('Producto añadido al carrito');
      router.push('/cart');
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      alert('Ocurrió un error al añadir el producto al carrito');
    } finally {
      setLoading(false);
    }
  };

  // Determinar qué opciones mostrar (las del API o las del producto directamente)
  const partTypesToRender = availableOptions.length > 0 
    ? availableOptions 
    : product.partTypes;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-gray-600 mt-2">
          Personaliza tu bicicleta seleccionando las opciones a continuación
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {partTypesToRender.map((partType) => (
            <div key={partType.id} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{partType.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partType.options.map((option) => (
                  <div 
                    key={option.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-colors
                      ${selectedOptions[partType.id] === option.id 
                        ? 'border-primary bg-primary bg-opacity-5' 
                        : 'border-gray-200 hover:border-primary'}
                      ${!option.is_compatible ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => {
                      if (option.is_compatible !== false) {
                        handleOptionSelect(partType.id, option.id);
                      }
                    }}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-primary font-semibold">
                        €{option.base_price.toFixed(2)}
                      </span>
                    </div>
                    {option.is_compatible === false && (
                      <p className="text-red-500 text-sm">
                        No compatible con la selección actual
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
                <span className="font-medium">€{product.basePrice.toFixed(2)}</span>
              </div>
              
              {/* Opciones seleccionadas */}
              {product.partTypes.map((partType) => {
                const selectedOptionId = selectedOptions[partType.id];
                let selectedOptionName = 'No seleccionado';
                let selectedOptionPrice = 0;
                
                if (selectedOptionId) {
                  const option = partType.options.find(opt => opt.id === selectedOptionId);
                  if (option) {
                    selectedOptionName = option.name;
                    selectedOptionPrice = option.base_price;
                  }
                }
                
                return (
                  <div key={partType.id} className="flex justify-between">
                    <span className="text-gray-600">{partType.name}</span>
                    <span className="font-medium">
                      {selectedOptionId 
                        ? `${selectedOptionName} (€${selectedOptionPrice.toFixed(2)})`
                        : 'No seleccionado'}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary w-full py-3"
              onClick={handleAddToCart}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Añadir al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeProduct; 