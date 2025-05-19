/**
 * Utilities for data transformation and validation
 */

/**
 * Converts a price value to a number, handling different formats
 * @param priceValue - The price value (can be string, number, etc)
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns A positive number or the default value
 */
export const convertToValidPrice = (priceValue: any, defaultValue: number = 0): number => {
  // If there's no value, return the default
  if (priceValue === undefined || priceValue === null) {
    return defaultValue;
  }
  
  // Convert to number if it's a string
  let numericPrice = typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
  
  // Verify that it's a valid number
  if (isNaN(numericPrice) || numericPrice < 0) {
    return defaultValue;
  }
  
  return numericPrice;
};

/**
 * Formats a price to display with 2 decimal places
 * @param price - The price value to format
 * @returns String with the price formatted with 2 decimal places
 */
export const formatPrice = (price: any): string => {
  const validPrice = convertToValidPrice(price);
  return validPrice.toFixed(2);
};

/**
 * Converts API values to the format used in the frontend
 * @param apiData - Data coming from the API
 * @param fieldMap - Mapping of field names between backend and frontend
 * @returns Object with the transformed data
 */
export const transformApiData = (apiData: any, fieldMap: Record<string, string> = {}): any => {
  if (!apiData) {
    return null;
  }
  
  // Create result object
  const result: Record<string, any> = {};
  
  // Default field mapping (snake_case to camelCase)
  const defaultFieldMap: Record<string, string> = {
    base_price: 'basePrice',
    image_url: 'image',
    ...fieldMap
  };
  
  // Copy simple fields
  Object.keys(apiData).forEach(key => {
    // If the field is in the mapping, use the mapped name
    const targetKey = defaultFieldMap[key] || key;
    
    // Handle special fields
    if (key === 'base_price') {
      result[targetKey] = convertToValidPrice(apiData[key]);
    } else {
      result[targetKey] = apiData[key];
    }
  });
  
  return result;
};

/**
 * Transforms data to send it to the backend (camelCase to snake_case)
 * @param frontendData - Frontend data
 * @param fieldMap - Field name mapping
 * @returns Object with data transformed for the backend
 */
export const transformDataForApi = (frontendData: any, fieldMap: Record<string, string> = {}): any => {
  if (!frontendData) {
    return null;
  }
  
  const result: Record<string, any> = {};
  
  // Default field mapping (camelCase to snake_case)
  const defaultFieldMap: Record<string, string> = {
    basePrice: 'base_price',
    image: 'image_url',
    ...fieldMap
  };
  
  // Copy fields
  Object.keys(frontendData).forEach(key => {
    // If the field is in the mapping, use the mapped name
    const targetKey = defaultFieldMap[key] || key;
    result[targetKey] = frontendData[key];
  });
  
  return result;
}; 