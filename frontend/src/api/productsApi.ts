import apiClient from './client';
import { Product, AvailablePartType } from '../types/product';

// Función de transformación para adaptar los datos del backend al formato del frontend
const transformProductData = (data: any): Product => {
  console.log('Transformando datos:', data);
  console.log('base_price antes de transformar:', data.base_price, typeof data.base_price);
  
  const transformed = {
    ...data,
    basePrice: data.base_price ? parseFloat(data.base_price) : 0,
    image: data.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
    partTypes: data.part_types || []
  };
  
  console.log('basePrice después de transformar:', transformed.basePrice, typeof transformed.basePrice);
  return transformed;
};

export const ProductsApi = {
  /**
   * Obtiene la lista de todos los productos
   */
  getProducts: async (page: number = 1, pageSize: number = 9): Promise<{products: Product[], total: number}> => {
    const skip = (page - 1) * pageSize;
    const response = await apiClient.get('/api/products/', {
      params: { skip, limit: pageSize }
    });
    
    // El backend ahora devuelve un objeto con items y total
    const products = response.data.items.map(transformProductData);
    const total = response.data.total || 0;
    
    return { products, total };
  },

  /**
   * Obtiene los productos destacados
   */
  getFeaturedProducts: async (limit: number = 3): Promise<Product[]> => {
    const response = await apiClient.get('/api/products/featured', {
      params: { limit }
    });
    return response.data.map(transformProductData);
  },

  /**
   * Obtiene un producto por su ID con todos los detalles
   */
  getProduct: async (productId: number): Promise<Product> => {
    const response = await apiClient.get(`/api/products/${productId}`);
    return transformProductData(response.data);
  },

  /**
   * Obtiene las opciones disponibles para un producto
   */
  getProductOptions: async (productId: number, selectedOptions: number[]): Promise<AvailablePartType[]> => {
    try {
      const response = await apiClient.get(`/api/products/${productId}/options`, {
        params: { selected_options: selectedOptions.join(',') }
      });
      return response.data.part_types;
    } catch (error) {
      console.error('Error al obtener opciones del producto:', error);
      
      // En modo desarrollo, simplemente devolver un array vacío
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta de opciones en modo desarrollo');
        return [];
      }
      throw error;
    }
  },

  /**
   * Valida si un conjunto de opciones son compatibles
   */
  validateCompatibility: async (selectedOptions: number[]): Promise<boolean> => {
    try {
      // Cambiar la estructura para adaptarse a lo que espera el backend
      const requestBody = {
        selected_option_ids: selectedOptions
      };
      
      console.log('Enviando datos de validación:', requestBody);
      
      const response = await apiClient.post('/api/products/validate-compatibility', requestBody);
      return response.data.is_compatible;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      
      // En modo desarrollo, asumir que todas las opciones son compatibles
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando validación de compatibilidad en modo desarrollo');
        return true;
      }
      throw error;
    }
  },

  /**
   * Calcula el precio de un producto con las opciones seleccionadas
   */
  calculatePrice: async (selectedOptions: number[]): Promise<number> => {
    try {
      const response = await apiClient.post('/api/products/calculate-price', {
        selected_option_ids: selectedOptions
      });
      return response.data.total_price;
    } catch (error) {
      console.error('Error al calcular precio:', error);
      
      // En modo desarrollo, calcular un precio simulado
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando cálculo de precio en modo desarrollo');
        // Simulamos un precio base de 500 más 50-150 por cada opción
        const basePrice = 500;
        const optionsPrice = selectedOptions.reduce((total) => {
          return total + (Math.floor(Math.random() * 100) + 50);
        }, 0);
        return basePrice + optionsPrice;
      }
      throw error;
    }
  }
}; 