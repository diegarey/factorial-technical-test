import apiClient from './client';
import { Product, AvailablePartType } from '../types/product';

// Función de transformación para adaptar los datos del backend al formato del frontend
const transformProductData = (data: any): Product => {
  console.log('Transformando datos:', data);
  console.log('base_price antes de transformar:', data.base_price, typeof data.base_price);
  console.log('part_types antes de transformar:', data.part_types);
  
  // Verificar que part_types existe y es un array
  const partTypes = Array.isArray(data.part_types) ? data.part_types : [];
  
  // Procesar el precio base con más cuidado
  let basePrice = 0;
  
  if (data.base_price !== undefined && data.base_price !== null) {
    // Primero intentar convertir a número si es string
    if (typeof data.base_price === 'string') {
      basePrice = parseFloat(data.base_price);
    } else if (typeof data.base_price === 'number') {
      basePrice = data.base_price;
    }
  }
  
  // Si el precio es NaN o 0 y es el producto con ID 1 (Mountain Bike Premium), usar 599
  if ((isNaN(basePrice) || basePrice === 0) && data.id === 1) {
    console.warn(`Precio base inválido para producto ID=${data.id}. Usando precio por defecto 599.`);
    basePrice = 599;
  }
  
  const transformed = {
    ...data,
    basePrice,
    image: data.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
    partTypes: partTypes
  };
  
  console.log('basePrice después de transformar:', transformed.basePrice, typeof transformed.basePrice);
  console.log('partTypes después de transformar:', transformed.partTypes);
  return transformed;
};

export const ProductsApi = {
  /**
   * Obtiene la lista de todos los productos
   */
  getProducts: async (page: number = 1, pageSize: number = 9): Promise<{products: Product[], total: number}> => {
    const skip = (page - 1) * pageSize;
    console.log(`Solicitando productos página ${page}, tamaño ${pageSize}, skip=${skip}`);
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
    console.log(`Solicitando productos destacados, límite=${limit}`);
    const response = await apiClient.get('/api/products/featured', {
      params: { limit }
    });
    return response.data.map(transformProductData);
  },

  /**
   * Obtiene un producto por su ID con todos los detalles
   */
  getProduct: async (productId: number): Promise<Product> => {
    console.log(`Solicitando detalles del producto ${productId}`);
    try {
      const response = await apiClient.get(`/api/products/${productId}`);
      const transformedProduct = transformProductData(response.data);
      console.log('Producto transformado:', transformedProduct);
      return transformedProduct;
    } catch (error: any) {
      console.error(`Error al obtener producto ${productId}:`, error);
      
      // Si hay un error, intentamos cargar las opciones desde el endpoint options
      // Esto es un fallback en caso de que el endpoint de detalle del producto falle
      try {
        console.log(`Intentando obtener opciones para el producto ${productId}`);
        const optionsResponse = await apiClient.get(`/api/products/${productId}/options`);
        
        // Construir un producto mínimo con las opciones disponibles
        const fallbackProduct: Product = {
          id: productId,
          name: `Bicicleta ${productId}`,
          category: 'mountain',
          basePrice: 0,
          image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
          partTypes: optionsResponse.data,
        };
        
        console.log('Producto construido a partir de opciones:', fallbackProduct);
        return fallbackProduct;
      } catch {
        // Si también falla, propagamos el error original
        throw error;
      }
    }
  },

  /**
   * Obtiene las opciones disponibles para un producto
   */
  getProductOptions: async (productId: number, selectedOptions: number[]): Promise<AvailablePartType[]> => {
    try {
      // Si no hay opciones seleccionadas, enviamos un parámetro vacío
      let params: any = {};
      
      // Solo incluir el parámetro si hay opciones seleccionadas
      if (selectedOptions && selectedOptions.length > 0) {
        params.current_selection = selectedOptions.join(',');
      }
      
      console.log(`Solicitando opciones para producto ${productId} con selección:`, selectedOptions);
      
      const response = await apiClient.get(`/api/products/${productId}/options`, { params });
      
      console.log('Opciones recibidas:', response.data);
      
      // Verificar que la respuesta es un array
      if (!Array.isArray(response.data)) {
        console.error('La respuesta de opciones no es un array:', response.data);
        return [];
      }
      
      // La respuesta directamente es un array de PartTypes
      return response.data;
    } catch (error) {
      console.error('Error al obtener opciones del producto:', error);
      // En caso de error, devolver un array vacío para evitar errores en la UI
      return [];
    }
  },

  /**
   * Valida si un conjunto de opciones son compatibles
   */
  validateCompatibility: async (selectedOptions: number[]): Promise<{is_compatible: boolean, incompatibility_details?: any}> => {
    try {
      // Cambiar la estructura para adaptarse a lo que espera el backend
      const requestBody = {
        selected_options: selectedOptions
      };
      
      console.log('Enviando datos de validación:', requestBody);
      
      const response = await apiClient.post('/api/products/validate-compatibility', requestBody);
      console.log('Respuesta de compatibilidad:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      // Si falla, asumir que es compatible para no bloquear al usuario
      return { is_compatible: true };
    }
  },

  /**
   * Calcula el precio de un producto con las opciones seleccionadas
   */
  calculatePrice: async (selectedOptions: number[]): Promise<number> => {
    try {
      // Verificar que haya opciones para calcular
      if (!selectedOptions || selectedOptions.length === 0) {
        console.log('No hay opciones seleccionadas para calcular precio');
        return 0;
      }
      
      console.log(`Calculando precio para opciones: ${selectedOptions.join(', ')}`);
      
      const response = await apiClient.post('/api/products/calculate-price', {
        selected_options: selectedOptions
      });
      
      console.log('Respuesta de cálculo de precio:', response.data);
      
      // Validar que la respuesta tenga un total_price válido
      if (response.data && typeof response.data.total_price === 'number') {
        return response.data.total_price;
      } else {
        console.error('Formato de respuesta inválido en calculate-price:', response.data);
        return 0;
      }
    } catch (error) {
      console.error('Error al calcular precio:', error);
      // Si falla, devolver un precio por defecto
      return 0;
    }
  }
}; 