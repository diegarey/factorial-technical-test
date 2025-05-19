import React from 'react';

interface ConditionalPriceInfo {
  optionName: string;
  originalPrice: number;
  discountedPrice: number;
  conditionedBy: string;
}

interface ProductPriceSummaryProps {
  baseProductPrice: number;
  optionsPrice: number;
  totalPrice: number;
  conditionalPrices: ConditionalPriceInfo[];
  currency?: string;
}

export const ProductPriceSummary: React.FC<ProductPriceSummaryProps> = ({
  baseProductPrice,
  optionsPrice,
  totalPrice,
  conditionalPrices,
  currency = '€'
}) => {
  // Calcular los ajustes totales por precios condicionales (pueden ser positivos o negativos)
  const totalPriceAdjustment = conditionalPrices.reduce(
    (sum, item) => sum + (item.originalPrice - item.discountedPrice),
    0
  );

  // Determinar si el ajuste total es un descuento o un incremento
  const isDiscount = totalPriceAdjustment > 0;
  const isIncrease = totalPriceAdjustment < 0;

  // Formatear precio con símbolo de moneda
  const formatPrice = (price: number) => `${currency}${price.toFixed(2)}`;
  
  // Formatear el ajuste de precio (con signo + o - según corresponda)
  const formatPriceAdjustment = (adjustment: number) => {
    const absAdjustment = Math.abs(adjustment);
    // Si es un descuento (adjustment positivo), mostramos signo negativo
    // Si es un incremento (adjustment negativo), mostramos signo positivo
    if (adjustment > 0) {
      return `-${formatPrice(absAdjustment)}`; // Es un descuento
    } else {
      return `+${formatPrice(absAdjustment)}`; // Es un incremento
    }
  };

  return (
    <div className="price-summary-container">
      <h3>Resumen de precios</h3>
      
      <div className="price-summary-line">
        <span className="price-label">Precio base</span>
        <span className="price-value">{formatPrice(baseProductPrice)}</span>
      </div>
      
      <div className="price-summary-line">
        <span className="price-label">Componentes seleccionados</span>
        <span className="price-value">{formatPrice(optionsPrice)}</span>
      </div>
      
      {totalPriceAdjustment !== 0 && (
        <div className={`price-summary-line ${isDiscount ? 'discount' : 'surcharge'}`}>
          <span className="price-label">Ajustes por combinaciones</span>
          <span className={`price-value ${isDiscount ? 'savings' : 'surcharge'}`}>
            {formatPriceAdjustment(totalPriceAdjustment)}
          </span>
        </div>
      )}
      
      <div className="price-summary-divider" />
      
      <div className="price-summary-total">
        <span className="price-label">Precio total</span>
        <span className="price-value total">{formatPrice(totalPrice)}</span>
      </div>
      
      {conditionalPrices.length > 0 && (
        <div className="conditional-prices-detail">
          <h4>Precios especiales aplicados</h4>
          {conditionalPrices.map((item, index) => {
            const priceChangeType = item.originalPrice > item.discountedPrice ? 'discount' : 'increase';
            const priceDifference = Math.abs(item.originalPrice - item.discountedPrice);
            const priceChangeText = priceChangeType === 'discount' 
              ? `-${currency}${priceDifference.toFixed(2)}` 
              : `+${currency}${priceDifference.toFixed(2)}`;
              
            return (
              <div key={index} className={`conditional-price-item ${priceChangeType}`}>
                <div className="option-name">
                  {item.optionName}
                  <span className="price-change">{priceChangeText}</span>
                </div>
                <div className="price-detail">
                  <span className="original-price">{formatPrice(item.originalPrice)}</span>
                  <span className="arrow">→</span>
                  <span className="conditional-price">{formatPrice(item.discountedPrice)}</span>
                </div>
                <div className="condition-detail">
                  Precio especial al combinar con: {item.conditionedBy}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 