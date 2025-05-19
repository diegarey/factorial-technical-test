import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductOption } from '../components/ProductOption';
import { ProductPriceSummary } from '../components/ProductPriceSummary';
import '../styles/product-option.css';
import '../styles/price-summary.css';
import '../styles/product-config.css';
import '../styles/ui-components.css';

interface ConditionalPrice {
  condition_option_id: number;
  condition_option_name: string;
  conditional_price: number;
}

interface Option {
  id: number;
  name: string;
  base_price: number;
  in_stock: boolean;
  selected: boolean;
  is_compatible: boolean;
  availability_reason?: string;
  compatibility_details?: any;
  required_by?: Array<{
    option_id: number;
    option_name: string;
  }>;
  conditional_prices?: ConditionalPrice[];
  applicable_price?: number;
  price_condition_met?: boolean;
  condition_option_id?: number;
  condition_option_name?: string;
}

interface Component {
  id: number;
  name: string;
  options: Option[];
}

interface Product {
  id: number;
  name: string;
  components: Component[];
}

interface ValidationResponse {
  product: Product;
  total_price: number;
}

const ProductConfig: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [conditionalPrices, setConditionalPrices] = useState<any[]>([]);

  // Cargar producto y validar compatibilidad inicial
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Obtener detalles básicos del producto
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();
        
        // Establecer el precio base del producto
        setBasePrice(productData.base_price || 0);
        
        // Validar compatibilidad sin opciones seleccionadas
        await validateCompatibility([]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar el producto:', error);
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);

  // Función para validar compatibilidad
  const validateCompatibility = async (options: number[]) => {
    try {
      console.log("Validando compatibilidad para opciones:", options);
      
      const response = await fetch('/api/products/validate-compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: Number(productId),
          selected_option_ids: options,
        }),
      });
      
      const data: ValidationResponse = await response.json();
      console.log("Respuesta de la API:", data);
      
      setProduct(data.product);
      setTotalPrice(data.total_price);
      
      // Procesar precios condicionales
      const appliedConditionalPrices = [];
      
      for (const component of data.product.components) {
        for (const option of component.options) {
          // Convertir precios a números si son strings
          const basePrice = typeof option.base_price === 'string' ? 
            parseFloat(option.base_price) : option.base_price;
            
          const applicablePrice = option.applicable_price !== undefined ? 
            (typeof option.applicable_price === 'string' ? 
              parseFloat(option.applicable_price) : option.applicable_price) : undefined;
          
          // Verificar si hay un descuento aplicado
          if (option.selected && 
              applicablePrice !== undefined && 
              applicablePrice < basePrice &&
              option.price_condition_met) {
            
            appliedConditionalPrices.push({
              optionName: option.name,
              originalPrice: basePrice,
              discountedPrice: applicablePrice,
              conditionedBy: option.condition_option_name || 'combinación especial'
            });
            
            console.log(`Descuento aplicado a ${option.name}: Original ${basePrice}, Descuento ${applicablePrice}`);
          }
        }
      }
      
      console.log("Precios condicionales aplicados:", appliedConditionalPrices);
      setConditionalPrices(appliedConditionalPrices);
      
      return data;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      return null;
    }
  };

  // Manejar selección de opciones
  const handleOptionSelect = async (optionId: number) => {
    let newSelectedOptions;
    
    if (selectedOptions.includes(optionId)) {
      // Si ya está seleccionada, quitarla
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
    } else {
      // Buscar la opción para ver su tipo de componente
      let componentId = 0;
      
      if (product) {
        for (const component of product.components) {
          const option = component.options.find(opt => opt.id === optionId);
          if (option) {
            componentId = component.id;
            break;
          }
        }
        
        // Quitar cualquier otra opción seleccionada del mismo componente
        const filteredOptions = selectedOptions.filter(id => {
          for (const component of product.components) {
            if (component.id === componentId) {
              return !component.options.some(opt => opt.id === id);
            }
          }
          return true;
        });
        
        // Añadir la nueva opción
        newSelectedOptions = [...filteredOptions, optionId];
      } else {
        newSelectedOptions = [...selectedOptions, optionId];
      }
    }
    
    console.log("Nuevas opciones seleccionadas:", newSelectedOptions);
    
    // Actualizar estado y validar compatibilidad
    setSelectedOptions(newSelectedOptions);
    await validateCompatibility(newSelectedOptions);
  };

  if (loading) {
    return <div className="loading">Cargando configurador...</div>;
  }

  if (!product) {
    return <div className="error">No se pudo cargar el producto</div>;
  }

  // Calcular precio de las opciones (sin precio base)
  const optionsPrice = totalPrice;

  return (
    <div className="product-config-container">
      <div className="product-header">
        <h1>{product.name}</h1>
        <p className="product-description">
          Configura tu producto seleccionando las opciones para cada componente
        </p>
      </div>
      
      <div className="product-config-layout">
        <div className="components-column">
          {product.components.map(component => (
            <div key={component.id} className="component-section">
              <h2 className="component-title">{component.name}</h2>
              
              <div className="component-options">
                {component.options.map(option => (
                  <ProductOption
                    key={option.id}
                    id={option.id}
                    name={option.name}
                    selected={option.selected}
                    is_compatible={option.is_compatible}
                    availability_reason={option.availability_reason}
                    compatibility_details={option.compatibility_details}
                    in_stock={option.in_stock}
                    onSelect={handleOptionSelect}
                    base_price={option.base_price}
                    applicable_price={option.applicable_price}
                    price_condition_met={option.price_condition_met}
                    condition_option_name={option.condition_option_name}
                    conditional_prices={option.conditional_prices}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="summary-column">
          <ProductPriceSummary
            baseProductPrice={basePrice}
            optionsPrice={optionsPrice}
            totalPrice={basePrice + optionsPrice}
            conditionalPrices={conditionalPrices}
          />
          
          <div className="actions">
            <button
              className="primary-button"
              onClick={() => {
                // Añadir al carrito y redirigir
                // TODO: Implementar lógica para añadir al carrito
                navigate('/cart');
              }}
              disabled={selectedOptions.length === 0}
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConfig; 