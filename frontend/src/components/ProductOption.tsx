import React from 'react';
import { Badge, Card, Tooltip } from '../ui/components';

interface OptionPrice {
  base_price: number;
  applicable_price?: number;
  price_condition_met?: boolean;
  condition_option_name?: string;
  conditional_prices?: Array<{
    condition_option_id: number;
    condition_option_name: string;
    conditional_price: number;
  }>;
}

interface ProductOptionProps {
  id: number;
  name: string;
  selected: boolean;
  is_compatible: boolean;
  availability_reason?: string;
  compatibility_details?: any;
  in_stock: boolean;
  onSelect: (id: number) => void;
  base_price: number;
  applicable_price?: number;
  price_condition_met?: boolean;
  condition_option_name?: string;
  conditional_prices?: Array<{
    condition_option_id: number;
    condition_option_name: string;
    conditional_price: number;
  }>;
}

export const ProductOption: React.FC<ProductOptionProps> = ({
  id,
  name,
  selected,
  is_compatible,
  availability_reason,
  compatibility_details,
  in_stock,
  onSelect,
  base_price,
  applicable_price,
  price_condition_met,
  condition_option_name,
  conditional_prices,
}) => {
  // Asegurarnos de que los precios son números
  const numericBasePrice = typeof base_price === 'string' ? parseFloat(base_price) : base_price;
  const numericApplicablePrice = applicable_price !== undefined ? 
    (typeof applicable_price === 'string' ? parseFloat(applicable_price) : applicable_price) : undefined;
  
  // Formatear precio con símbolo de euro
  const formatPrice = (price: number) => `+€${price.toFixed(2)}`;
  
  // Determinar el precio a mostrar
  const displayPrice = numericApplicablePrice !== undefined ? numericApplicablePrice : numericBasePrice;
  
  // Determinar si hay un precio condicional aplicado
  const hasPriceCondition = numericApplicablePrice !== undefined && 
    numericApplicablePrice !== numericBasePrice && 
    price_condition_met === true;
    
    // Una forma más directa de verificar: si el nuevo precio es menor, es un descuento.
    // Si es mayor, es un incremento.
    const isDiscount = numericApplicablePrice !== undefined && numericApplicablePrice < numericBasePrice;
    const isPriceIncrease = numericApplicablePrice !== undefined && numericApplicablePrice > numericBasePrice;
    
    // Calcular la diferencia absoluta (para mostrar)
    const priceDifference = numericApplicablePrice !== undefined 
      ? Math.abs(numericBasePrice - numericApplicablePrice)
      : 0;
  
  console.log('priceDifference', priceDifference)
  console.log('isDiscount', isDiscount)
  console.log('isPriceIncrease', isPriceIncrease)

  
  // Generar mensaje de tooltip para precios condicionales disponibles
  const conditionalPriceTooltip = conditional_prices && conditional_prices.length > 0 
    ? `Combina con: ${conditional_prices.map(cp => {
        const numericConditionalPrice = typeof cp.conditional_price === 'string' 
          ? parseFloat(cp.conditional_price) 
          : cp.conditional_price;
        return `${cp.condition_option_name} (${formatPrice(numericConditionalPrice)})`;
      }).join(', ')}` 
    : '';
  
  return (
    <Card 
      onClick={() => is_compatible && in_stock ? onSelect(id) : null}
      className={`
        option-card
        ${selected ? 'selected' : ''}
        ${!is_compatible || !in_stock ? 'disabled' : ''}
      `}
    >
      <div className="option-content">
        {selected && (
          <div className="selected-indicator">
            <span className="checkmark">✓</span>
          </div>
        )}
        
        <div className="option-name">{name}</div>
        
        <div className="option-price">
          {hasPriceCondition && (
            <>
              <span className="original-price">{formatPrice(numericBasePrice)}</span>
              <Tooltip content={`Precio especial por combinar con ${condition_option_name}`}>
                <Badge variant={isDiscount ? "success" : "warning"} className="price-change-badge">
                  {isDiscount 
                    ? `¡Ahorro de €${priceDifference.toFixed(2)}!` 
                    : `+€${priceDifference.toFixed(2)}`}
                </Badge>
              </Tooltip>
            </>
          )}
          <span className={hasPriceCondition ? 'conditional-price' : ''}>
            {formatPrice(displayPrice)}
          </span>
          
          {conditional_prices && conditional_prices.length > 0 && !price_condition_met && (
            <Tooltip content={conditionalPriceTooltip}>
              <Badge variant="info" className="conditional-badge">
                Precio con combos
              </Badge>
            </Tooltip>
          )}
        </div>
        
        {selected && hasPriceCondition && (
          <div className="price-condition-info">
            <Tooltip content={isDiscount ? 
              `Ahorro de €${priceDifference.toFixed(2)} al combinar con ${condition_option_name}` : 
              `Incremento de €${priceDifference.toFixed(2)} al combinar con ${condition_option_name}`}>
              <span className="price-condition-badge">
                Precio especial por combinación con otras opciones
              </span>
            </Tooltip>
          </div>
        )}
        
        {!is_compatible && availability_reason && (
          <div className="compatibility-warning">
            {availability_reason === 'out_of_stock' ? (
              <span className="stock-warning">Agotado</span>
            ) : availability_reason === 'requires' ? (
              <Tooltip content={`Requiere: ${compatibility_details?.dependency_name}`}>
                <span className="dependency-warning">Requiere otra opción</span>
              </Tooltip>
            ) : availability_reason === 'excludes' ? (
              <Tooltip content={`Incompatible con: ${compatibility_details?.dependency_name}`}>
                <span className="dependency-warning">Incompatible con la selección</span>
              </Tooltip>
            ) : (
              <span className="general-warning">No disponible</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}; 