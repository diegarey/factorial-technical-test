import apiClient from './client';
import { Product, AvailablePartType, PartType, PartOption } from '../types/product';
import { getApiUrl } from '../config/api';

// Función de transformación para adaptar los datos del backend al formato del frontend
const transformProductData = (data: any): Product => {
  // Verificar si data es null o undefined
  if (!data) {
    console.error('Datos nulos o indefinidos pasados a transformProductData');
    // Devolver un objeto de producto con valores por defecto
    return {
      id: 0,
      name: "Producto desconocido",
      category: "general",
      basePrice: 0,
      image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
      partTypes: []
    };
  }
  
  console.log('Transformando datos:', data);
  console.log('base_price antes de transformar:', data.base_price, typeof data.base_price);
  console.log('part_types antes de transformar:', data.part_types);
  
  // Verificar que part_types existe y es un array
  const partTypes = Array.isArray(data.part_types) ? data.part_types : [];
  
  // Procesar el precio base directamente desde el backend
  // El backend devuelve el precio base como string cuando es un Decimal
  let basePrice = 0;
  
  // Intentar diferentes fuentes para el precio base
  if (data.base_price !== undefined && data.base_price !== null) {
    // Convertir a número si es string
    if (typeof data.base_price === 'string') {
      basePrice = parseFloat(data.base_price);
    } else if (typeof data.base_price === 'number') {
      basePrice = data.base_price;
    }
  } else if (data.basePrice !== undefined && data.basePrice !== null) {
    // También intentar con basePrice por si ya está transformado
    if (typeof data.basePrice === 'string') {
      basePrice = parseFloat(data.basePrice);
    } else if (typeof data.basePrice === 'number') {
      basePrice = data.basePrice;
    }
  }
  
  // Validar que el precio base sea un número positivo válido
  if (isNaN(basePrice) || basePrice < 0) {
    console.error(`Precio base inválido recibido del backend para el producto ID=${data.id || 'desconocido'}: ${data.base_price}`);
    console.error('Se requiere un precio base válido desde el backend');
    basePrice = 0; // Asignar 0 como valor por defecto en caso de error
  }
  
  const transformed = {
    id: data.id,
    name: data.name,
    category: data.category,
    description: data.description,
    basePrice,
    image: data.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
    is_active: data.is_active,
    featured: data.featured,
    partTypes: partTypes.map((pt: any) => ({
      id: pt.id,
      name: pt.name,
      product_id: pt.product_id,
      options: Array.isArray(pt.options) ? pt.options.map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        base_price: typeof opt.base_price === 'string' ? parseFloat(opt.base_price) : opt.base_price,
        part_type_id: opt.part_type_id,
        in_stock: opt.in_stock
      })) : []
    }))
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
    try {
      const skip = (page - 1) * pageSize;
      console.log(`Solicitando productos página ${page}, tamaño ${pageSize}, skip=${skip}`);
      const response = await apiClient.get(getApiUrl('products/'), {
        params: { skip, limit: pageSize }
      });
      
      console.log('Respuesta completa de productos:', response);
      
      // Verificar si la respuesta es null o no contiene items
      if (!response.data || !response.data.items) {
        console.warn('La respuesta del backend para productos es null o no tiene items:', response.data);
        // Devolver un array vacío y total 0 para evitar errores
        return { products: [], total: 0 };
      }
      
      // El backend ahora devuelve un objeto con items y total
      const products = response.data.items.map(transformProductData);
      const total = response.data.total || 0;
      
      return { products, total };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      // En caso de error, devolver un array vacío para no romper la UI
      return { products: [], total: 0 };
    }
  },

  /**
   * Obtiene los productos destacados
   */
  getFeaturedProducts: async (limit: number = 3): Promise<Product[]> => {
    console.log(`Solicitando productos destacados, límite=${limit}`);
    const response = await apiClient.get(getApiUrl('products/featured'), {
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
      const response = await apiClient.get(getApiUrl(`products/${productId}`));
      const transformedProduct = transformProductData(response.data);
      console.log('Producto transformado:', transformedProduct);
      return transformedProduct;
    } catch (error: any) {
      console.error(`Error al obtener producto ${productId}:`, error);
      
      // En caso de error, intentar obtener información básica del producto y sus opciones
      try {
        // Intentar obtener productos para ver si podemos encontrar este producto con su precio base
        const productsResponse = await apiClient.get(getApiUrl(`products/`), {
          params: { skip: 0, limit: 100 }
        });
        
        // Buscar el producto en la lista
        const productFromList = productsResponse.data.items.find((item: any) => item.id === productId);
        
        if (productFromList) {
          console.log(`Producto ${productId} encontrado en la lista de productos:`, productFromList);
          
          // Ahora obtenemos las opciones
          const optionsResponse = await apiClient.get(getApiUrl(`products/${productId}/options`));
          
          // Construir un producto completo con la información encontrada
          const fallbackProduct = transformProductData({
            ...productFromList,
            part_types: optionsResponse.data
          });
          
          console.log('Producto reconstruido con datos de la lista y opciones:', fallbackProduct);
          return fallbackProduct;
        }
        
        // Si no lo encontramos en la lista, intentar solo con las opciones
        console.log(`Intentando obtener solo opciones para el producto ${productId}`);
        const optionsResponse = await apiClient.get(getApiUrl(`products/${productId}/options`));
        
        // Construir un producto mínimo con la información disponible
        const minimalProduct: Product = {
          id: productId,
          name: `Producto ${productId}`,
          category: 'general',
          basePrice: 599, // Valor por defecto razonable en caso de error
          image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
          partTypes: optionsResponse.data,
        };
        
        console.log('Producto construido a partir de opciones (mínimo):', minimalProduct);
        console.warn('ADVERTENCIA: Se está usando un producto de respaldo con precio base estimado. El backend debe proporcionar esta información correctamente.');
        return minimalProduct;
      } catch (fallbackError) {
        console.error('Error también al intentar reconstruir el producto:', fallbackError);
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
      
      const response = await apiClient.get(getApiUrl(`products/${productId}/options`), { params });
      
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
      
      const response = await apiClient.post(getApiUrl('products/validate-compatibility'), requestBody);
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
      
      // Imprimir el cuerpo completo de la solicitud para depuración
      const requestBody = {
        selected_options: selectedOptions
      };
      console.log('Enviando solicitud de cálculo de precio:', requestBody);
      
      const response = await apiClient.post(getApiUrl('products/calculate-price'), requestBody);
      
      console.log('Respuesta completa de cálculo de precio:', response);
      console.log('Datos de respuesta de cálculo de precio:', response.data);
      
      // Validar que la respuesta tenga un total_price válido
      if (response.data && typeof response.data.total_price === 'number') {
        const price = response.data.total_price;
        console.log(`Precio calculado recibido del servidor: ${price}`);
        return price;
      } else {
        console.error('Formato de respuesta inválido en calculate-price, datos:', response.data);
        if (response.data) {
          console.log('Tipo de total_price:', typeof response.data.total_price);
          console.log('Valor de total_price:', response.data.total_price);
        }
        console.log('Retornando 0 como precio por defecto debido a formato inválido');
        return 0;
      }
    } catch (error: any) {
      console.error('Error al calcular precio:', error);
      // Imprimir más detalles sobre el error
      if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
      } else if (error.request) {
        console.error('Error en la solicitud sin respuesta');
      } else {
        console.error('Error de configuración:', error.message);
      }
      console.log('Retornando 0 como precio por defecto debido a error');
      return 0;
    }
  },

  /**
   * Crea un nuevo producto
   */
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      console.log('Creando nuevo producto:', productData);
      
      // Asegurarse de que el precio base esté en el formato correcto
      const dataToSend: any = { ...productData };
      
      // Si basePrice existe en productData, convertirlo a base_price para el backend
      if (dataToSend.basePrice !== undefined) {
        dataToSend.base_price = dataToSend.basePrice;
        delete dataToSend.basePrice; // Eliminar la propiedad frontend para evitar duplicación
      }
      
      // Si image existe en productData, convertirlo a image_url para el backend
      if (dataToSend.image !== undefined) {
        dataToSend.image_url = dataToSend.image;
        delete dataToSend.image; // Eliminar la propiedad frontend para evitar duplicación
      }
      
      console.log('Datos formateados para enviar al backend:', dataToSend);
      
      // Imprimir URL completa para depuración
      const apiUrl = getApiUrl('products');
      console.log('URL de creación de producto:', apiUrl);
      
      // Usar fetch nativo para evitar middleware y redirecciones de axios
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Incluir cookies para autenticación
        body: JSON.stringify(dataToSend)
      });
      
      console.log('Código de estado de respuesta:', response.status);
      console.log('Headers de respuesta:', Object.fromEntries(response.headers));
      
      // Si la respuesta no es exitosa, intentar obtener el texto del error
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Verificar el tipo de contenido de la respuesta
      const contentType = response.headers.get('content-type');
      console.log('Tipo de contenido de respuesta:', contentType);
      
      // Si la respuesta está vacía o no es JSON, manejarlo de manera especial
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('La respuesta no es JSON, posiblemente está vacía o mal formateada');
        
        // Si la respuesta es exitosa pero no hay datos JSON, crear un producto mínimo
        if (response.status >= 200 && response.status < 300) {
          console.log('Respuesta exitosa pero sin datos JSON. Creando producto mínimo...');
          
          // Crear un producto mínimo basado en los datos enviados
          const minimalProduct: Product = {
            id: Math.floor(Math.random() * 10000), // ID temporal hasta recargar
            name: dataToSend.name || 'Nuevo producto',
            category: dataToSend.category || 'general',
            basePrice: dataToSend.base_price || 0,
            image: dataToSend.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
            partTypes: []
          };
          
          console.log('Producto mínimo creado:', minimalProduct);
          return minimalProduct;
        }
        
        // Si la respuesta no es exitosa y no es JSON, lanzar error
        const respText = await response.text();
        throw new Error(`Respuesta no JSON (${response.status}): ${respText}`);
      }
      
      // Intentar analizar los datos JSON
      let data;
      try {
        const responseText = await response.text();
        console.log('Texto de respuesta completo:', responseText);
        
        // Si el texto está vacío, manejarlo
        if (!responseText || responseText.trim() === '') {
          console.warn('La respuesta JSON está vacía');
          throw new Error('Respuesta JSON vacía');
        }
        
        // Intentar parsear el JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error al parsear la respuesta JSON:', parseError);
        throw new Error(`Error al parsear respuesta: ${parseError}`);
      }
      
      console.log('Respuesta del backend al crear producto:', data);
      
      // Si la respuesta es null pero el código es exitoso, crear un producto mínimo
      if (!data && response.status >= 200 && response.status < 300) {
        console.warn('Respuesta del backend es null pero el código es exitoso. Creando producto mínimo...');
        
        // Crear un producto mínimo basado en los datos enviados
        const minimalProduct: Product = {
          id: Math.floor(Math.random() * 10000), // ID temporal hasta recargar
          name: dataToSend.name || 'Nuevo producto',
          category: dataToSend.category || 'general',
          basePrice: dataToSend.base_price || 0,
          image: dataToSend.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
          partTypes: []
        };
        
        console.log('Producto mínimo creado:', minimalProduct);
        return minimalProduct;
      }
      
      // Verificar que data contiene la información esperada
      if (!data || !data.id) {
        console.error('Respuesta del backend no contiene un ID de producto:', data);
        
        // Si hay algún tipo de datos en la respuesta, intentar usarlos
        if (data) {
          console.log('Intentando recuperar datos parciales de la respuesta...');
          
          // Crear un producto con los datos disponibles y un ID temporal
          const partialProduct: Product = {
            id: data.id || Math.floor(Math.random() * 10000),
            name: data.name || dataToSend.name || 'Nuevo producto',
            category: data.category || dataToSend.category || 'general',
            basePrice: data.base_price || dataToSend.base_price || 0,
            image: data.image_url || dataToSend.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
            partTypes: []
          };
          
          console.log('Producto parcial creado:', partialProduct);
          return partialProduct;
        }
        
        throw new Error('Respuesta del backend inválida al crear producto');
      }
      
      return transformProductData(data);
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },

  /**
   * Actualiza un producto existente
   */
  updateProduct: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    try {
      console.log(`Actualizando producto ${productId}:`, productData);
      
      // Asegurarse de que el precio base esté en el formato correcto
      const dataToSend: any = { ...productData };
      
      // Si basePrice existe en productData, convertirlo a base_price para el backend
      if (dataToSend.basePrice !== undefined) {
        dataToSend.base_price = dataToSend.basePrice;
        delete dataToSend.basePrice; // Eliminar la propiedad frontend para evitar duplicación
      }
      
      // Si image existe en productData, convertirlo a image_url para el backend
      if (dataToSend.image !== undefined) {
        dataToSend.image_url = dataToSend.image;
        delete dataToSend.image; // Eliminar la propiedad frontend para evitar duplicación
      }
      
      console.log('Datos formateados para enviar al backend:', dataToSend);
      
      // Generar la URL completa con getApiUrl
      const apiUrl = getApiUrl(`products/${productId}`);
      console.log('URL de actualización de producto:', apiUrl);
      
      // Usar fetch nativo para evitar redirecciones
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Incluir cookies para autenticación
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Respuesta del backend al actualizar producto:', data);
      
      // Verificar que data contiene la información esperada
      if (!data || !data.id) {
        console.error('Respuesta del backend no contiene un ID de producto:', data);
        throw new Error('Respuesta del backend inválida al actualizar producto');
      }
      
      return transformProductData(data);
    } catch (error) {
      console.error(`Error al actualizar producto ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un producto
   */
  deleteProduct: async (productId: number): Promise<void> => {
    try {
      console.log(`Eliminando producto ${productId}`);
      await apiClient.delete(getApiUrl(`products/${productId}`));
    } catch (error) {
      console.error(`Error al eliminar producto ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Agrega un nuevo tipo de parte a un producto
   */
  addPartType: async (productId: number, partTypeData: Partial<PartType>): Promise<PartType> => {
    try {
      console.log(`Agregando tipo de parte al producto ${productId}:`, partTypeData);
      const response = await apiClient.post(getApiUrl(`admin/products/${productId}/part-types`), partTypeData);
      return response.data;
    } catch (error) {
      console.error(`Error al agregar tipo de parte al producto ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Agrega una nueva opción a un tipo de parte
   */
  addPartOption: async (partTypeId: number, optionData: Partial<PartOption>): Promise<PartOption> => {
    try {
      console.log(`Agregando opción al tipo de parte ${partTypeId}:`, optionData);
      
      // Asegurarse de que los datos están en el formato correcto
      const dataToSend = {
        name: optionData.name,
        base_price: optionData.base_price,
        in_stock: optionData.in_stock !== false // Default a true si no está definido
      };
      
      console.log('Datos formateados para enviar al backend:', dataToSend);
      
      const response = await apiClient.post(getApiUrl(`admin/part-types/${partTypeId}/options`), dataToSend);
      return response.data;
    } catch (error) {
      console.error(`Error al agregar opción al tipo de parte ${partTypeId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un tipo de parte
   */
  deletePartType: async (partTypeId: number): Promise<void> => {
    try {
      console.log(`Eliminando tipo de parte ${partTypeId}`);
      await apiClient.delete(getApiUrl(`admin/part-types/${partTypeId}`));
    } catch (error) {
      console.error(`Error al eliminar tipo de parte ${partTypeId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una opción de un tipo de parte
   */
  deletePartOption: async (partTypeId: number, optionId: number): Promise<void> => {
    try {
      console.log(`Eliminando opción ${optionId} del tipo de parte ${partTypeId}`);
      await apiClient.delete(getApiUrl(`admin/part-types/${partTypeId}/options/${optionId}`));
    } catch (error) {
      console.error(`Error al eliminar opción ${optionId} del tipo de parte ${partTypeId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene las dependencias de un producto
   */
  getProductDependencies: async (productId: number) => {
    try {
      console.log(`Solicitando dependencias para el producto ${productId}`);
      const response = await apiClient.get(getApiUrl(`api/v1/admin/products/${productId}/dependencies`));
      console.log('Respuesta de dependencias:', response.data);
      
      // Verificar que la respuesta sea un array
      if (!Array.isArray(response.data)) {
        console.error('La respuesta de dependencias no es un array:', response.data);
        return [];
      }
      
      // Transformar los datos si es necesario
      const dependencies = response.data.map(dep => ({
        id: dep.id,
        optionId: dep.option_id,
        dependsOnOptionId: dep.depends_on_option_id,
        type: dep.type
      }));
      
      console.log('Dependencias transformadas:', dependencies);
      return dependencies;
    } catch (error) {
      console.error('Error al obtener dependencias:', error);
      // En caso de error, devolver un array vacío para no romper la UI
      return [];
    }
  },

  /**
   * Crea una nueva dependencia entre opciones
   */
  createDependency: async (productId: number, dependency: {
    optionId: number;
    dependsOnOptionId: number;
    type: 'requires' | 'excludes';
  }) => {
    try {
      const response = await apiClient.post(
        getApiUrl(`admin/products/${productId}/dependencies`),
        dependency
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear dependencia:', error);
      throw error;
    }
  },

  /**
   * Elimina una dependencia
   */
  deleteDependency: async (dependencyId: number) => {
    try {
      await apiClient.delete(getApiUrl(`admin/dependencies/${dependencyId}`));
    } catch (error) {
      console.error('Error al eliminar dependencia:', error);
      throw error;
    }
  },
}; 