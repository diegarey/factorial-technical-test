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
  // Calcular el ahorro total por precios condicionales
  const totalSavings = conditionalPrices.reduce(
    (sum, item) => sum + (item.originalPrice - item.discountedPrice),
    0
  );

  // Formatear precio con símbolo de moneda
  const formatPrice = (price: number) => `${currency}${price.toFixed(2)}`;

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
      
      {totalSavings > 0 && (
        <div className="price-summary-line discount">
          <span className="price-label">Ahorro por combinaciones</span>
          <span className="price-value savings">-{formatPrice(totalSavings)}</span>
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
          {conditionalPrices.map((item, index) => (
            <div key={index} className="conditional-price-item">
              <div className="option-name">{item.optionName}</div>
              <div className="price-detail">
                <span className="original-price">{formatPrice(item.originalPrice)}</span>
                <span className="arrow">→</span>
                <span className="discounted-price">{formatPrice(item.discountedPrice)}</span>
              </div>
              <div className="condition-detail">
                Al combinar con: {item.conditionedBy}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 