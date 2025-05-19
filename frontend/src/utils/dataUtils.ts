/**
 * Utilidades para transformación y validación de datos
 */

/**
 * Convierte un valor de precio a número, manejando diferentes formatos
 * @param priceValue - El valor de precio (puede ser string, number, etc)
 * @param defaultValue - Valor por defecto si la conversión falla (predeterminado: 0)
 * @returns Un número positivo o el valor por defecto
 */
export const convertToValidPrice = (priceValue: any, defaultValue: number = 0): number => {
  // Si no hay valor, devolver el por defecto
  if (priceValue === undefined || priceValue === null) {
    return defaultValue;
  }
  
  // Convertir a número si es string
  let numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
  
  // Verificar que sea un número válido
  if (isNaN(numericPrice) || numericPrice < 0) {
    return defaultValue;
  }
  
  return numericPrice;
};

/**
 * Formatea un precio para mostrar con 2 decimales
 * @param price - El valor de precio a formatear
 * @returns String con el precio formateado con 2 decimales
 */
export const formatPrice = (price: any): string => {
  const validPrice = convertToValidPrice(price);
  return validPrice.toFixed(2);
};

/**
 * Convierte valores de la API al formato usado en el frontend
 * @param apiData - Datos que vienen de la API
 * @param fieldMap - Mapeo de nombres de campos entre backend y frontend
 * @returns Objeto con los datos transformados
 */
export const transformApiData = (apiData: any, fieldMap: Record<string, string> = {}): any => {
  if (!apiData) {
    return null;
  }
  
  // Crear objeto resultado
  const result: Record<string, any> = {};
  
  // Mapeo de campos por defecto (snake_case a camelCase)
  const defaultFieldMap: Record<string, string> = {
    base_price: 'basePrice',
    image_url: 'image',
    ...fieldMap
  };
  
  // Copiar campos simples
  Object.keys(apiData).forEach(key => {
    // Si el campo está en el mapeo, usar el nombre mapeado
    const targetKey = defaultFieldMap[key] || key;
    
    // Manejar campos especiales
    if (key === 'base_price') {
      result[targetKey] = convertToValidPrice(apiData[key]);
    } else {
      result[targetKey] = apiData[key];
    }
  });
  
  return result;
};

/**
 * Transforma los datos para enviarlos al backend (camelCase a snake_case)
 * @param frontendData - Datos del frontend
 * @param fieldMap - Mapeo de nombres de campos
 * @returns Objeto con los datos transformados para el backend
 */
export const transformDataForApi = (frontendData: any, fieldMap: Record<string, string> = {}): any => {
  if (!frontendData) {
    return null;
  }
  
  const result: Record<string, any> = {};
  
  // Mapeo de campos por defecto (camelCase a snake_case)
  const defaultFieldMap: Record<string, string> = {
    basePrice: 'base_price',
    image: 'image_url',
    ...fieldMap
  };
  
  // Copiar campos
  Object.keys(frontendData).forEach(key => {
    // Si el campo está en el mapeo, usar el nombre mapeado
    const targetKey = defaultFieldMap[key] || key;
    result[targetKey] = frontendData[key];
  });
  
  return result;
}; 