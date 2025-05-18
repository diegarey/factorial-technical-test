import apiClient from './client';
import { Product, AvailablePartType, PartType, PartOption } from '../types/product';
import { getApiUrl } from '../config/api';

// Transformation function to adapt backend data to frontend format
const transformProductData = (data: any): Product => {
  // Check if data is null or undefined
  if (!data) {
    console.error('Datos nulos o indefinidos pasados a transformProductData');
    // Return a product object with default values
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
  
  // Verify that part_types exists and is an array
  const partTypes = Array.isArray(data.part_types) ? data.part_types : [];
  
  // Process the base price directly from the backend
  // The backend returns the base price as string when it's a Decimal
  let basePrice = 0;
  
  // Try different sources for base price
  if (data.base_price !== undefined && data.base_price !== null) {
    // Convert to number if it's a string
    if (typeof data.base_price === 'string') {
      basePrice = parseFloat(data.base_price);
    } else if (typeof data.base_price === 'number') {
      basePrice = data.base_price;
    }
  } else if (data.basePrice !== undefined && data.basePrice !== null) {
    // Also try with basePrice in case it's already transformed
    if (typeof data.basePrice === 'string') {
      basePrice = parseFloat(data.basePrice);
    } else if (typeof data.basePrice === 'number') {
      basePrice = data.basePrice;
    }
  }
  
  // Validate that the base price is a valid positive number
  if (isNaN(basePrice) || basePrice < 0) {
    console.error(`Precio base inválido recibido del backend para el producto ID=${data.id || 'desconocido'}: ${data.base_price}`);
    console.error('Se requiere un precio base válido desde el backend');
    basePrice = 0; // Assign 0 as default value in case of error
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
   * Gets the list of all products
   */
  getProducts: async (page: number = 1, pageSize: number = 9): Promise<{products: Product[], total: number}> => {
    try {
      const skip = (page - 1) * pageSize;
      console.log(`Solicitando productos página ${page}, tamaño ${pageSize}, skip=${skip}`);
      const response = await apiClient.get(getApiUrl('products/'), {
        params: { skip, limit: pageSize }
      });
      
      console.log('Respuesta completa de productos:', response);
      
      // Check if the response is null or doesn't contain items
      if (!response.data || !response.data.items) {
        console.warn('La respuesta del backend para productos es null o no tiene items:', response.data);
        // Return an empty array and total 0 to avoid errors
        return { products: [], total: 0 };
      }
      
      // The backend now returns an object with items and total
      const products = response.data.items.map(transformProductData);
      const total = response.data.total || 0;
      
      return { products, total };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      // In case of error, return an empty array to avoid breaking the UI
      return { products: [], total: 0 };
    }
  },

  /**
   * Gets featured products
   */
  getFeaturedProducts: async (limit: number = 3): Promise<Product[]> => {
    console.log(`Solicitando productos destacados, límite=${limit}`);
    const response = await apiClient.get(getApiUrl('products/featured'), {
      params: { limit }
    });
    return response.data.map(transformProductData);
  },

  /**
   * Gets a product by its ID with all details
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
      
      // In case of error, try to get basic product information and its options
      try {
        // Try to get products to see if we can find this product with its base price
        const productsResponse = await apiClient.get(getApiUrl(`products/`), {
          params: { skip: 0, limit: 100 }
        });
        
        // Look for the product in the list
        const productFromList = productsResponse.data.items.find((item: any) => item.id === productId);
        
        if (productFromList) {
          console.log(`Producto ${productId} encontrado en la lista de productos:`, productFromList);
          
          // Now get the options
          const optionsResponse = await apiClient.get(getApiUrl(`products/${productId}/options`));
          
          // Build a complete product with the information found
          const fallbackProduct = transformProductData({
            ...productFromList,
            part_types: optionsResponse.data
          });
          
          console.log('Producto reconstruido con datos de la lista y opciones:', fallbackProduct);
          return fallbackProduct;
        }
        
        // If we don't find it in the list, try with just the options
        console.log(`Intentando obtener solo opciones para el producto ${productId}`);
        const optionsResponse = await apiClient.get(getApiUrl(`products/${productId}/options`));
        
        // Build a minimal product with available information
        const minimalProduct: Product = {
          id: productId,
          name: `Producto ${productId}`,
          category: 'general',
          basePrice: 599, // Reasonable default value in case of error
          image: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
          partTypes: optionsResponse.data,
        };
        
        console.log('Producto construido a partir de opciones (mínimo):', minimalProduct);
        console.warn('ADVERTENCIA: Se está usando un producto de respaldo con precio base estimado. El backend debe proporcionar esta información correctamente.');
        return minimalProduct;
      } catch (fallbackError) {
        console.error('Error también al intentar reconstruir el producto:', fallbackError);
        // If it also fails, propagate the original error
        throw error;
      }
    }
  },

  /**
   * Gets available options for a product
   */
  getProductOptions: async (productId: number, selectedOptions: number[]): Promise<AvailablePartType[]> => {
    try {
      // If no options are selected, send an empty parameter
      let params: any = {};
      
      // Only include the parameter if there are selected options
      if (selectedOptions && selectedOptions.length > 0) {
        params.current_selection = selectedOptions.join(',');
      }
      
      console.log(`Solicitando opciones para producto ${productId} con selección:`, selectedOptions);
      
      const response = await apiClient.get(getApiUrl(`products/${productId}/options`), { params });
      
      console.log('Opciones recibidas:', response.data);
      
      // Verify that the response is an array
      if (!Array.isArray(response.data)) {
        console.error('La respuesta de opciones no es un array:', response.data);
        return [];
      }
      
      // The response is directly an array of PartTypes
      return response.data;
    } catch (error) {
      console.error('Error al obtener opciones del producto:', error);
      // In case of error, return an empty array to avoid errors in the UI
      return [];
    }
  },

  /**
   * Validates if a set of options are compatible
   */
  validateCompatibility: async (selectedOptions: number[], productId?: number): Promise<any> => {
    try {
      // Prepare the product ID
      let requestProductId = productId || null;
      
      // If no ID is provided and there are selected options, try to infer the ID
      if (!requestProductId && selectedOptions.length > 0) {
        try {
          // This logic will be implemented in the backend, so we avoid making additional calls here
          console.log('Usando opción seleccionada para inferir el producto:', selectedOptions[0]);
        } catch (inferError) {
          console.warn('No se pudo inferir el productId a partir de las opciones seleccionadas:', inferError);
        }
      }

      // Change the structure to adapt to what the backend expects
      const requestBody = {
        product_id: requestProductId,
        selected_options: selectedOptions
      };
      
      console.log('Enviando datos de validación:', requestBody);
      
      const response = await apiClient.post(getApiUrl('products/validate-compatibility'), requestBody);
      console.log('Respuesta de compatibilidad:', response.data);
      
      // Return the complete response directly to handle it in components
      return response.data;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      throw error; // Propagate the error instead of assuming compatibility
    }
  },

  /**
   * Calculates the price of a product with selected options
   */
  calculatePrice: async (selectedOptions: number[]): Promise<number> => {
    try {
      // Try to get the product ID from the first selected option
      let productId = null;
      if (selectedOptions.length > 0) {
        try {
          // This logic will be implemented in the backend, so we avoid making additional calls here
          console.log('Usando opción seleccionada para inferir el producto en calculate-price:', selectedOptions[0]);
        } catch (inferError) {
          console.warn('No se pudo inferir el productId a partir de las opciones seleccionadas:', inferError);
        }
      }

      // Change the structure to adapt to what the backend expects
      const requestBody = {
        product_id: productId, // This value will be null and the backend will detect it and act accordingly
        selected_options: selectedOptions
      };
      
      console.log('Enviando datos para cálculo de precio:', requestBody);
      
      const response = await apiClient.post(getApiUrl('products/calculate-price'), requestBody);
      console.log('Respuesta de cálculo de precio:', response.data);
      
      // Get the price from the response object and ensure it's a valid number
      const total_price = response.data.total_price;
      
      // Validate and convert the price
      if (total_price === undefined || total_price === null) {
        console.error('La API no devolvió un valor de precio válido');
        return 0;
      }
      
      // Convert to number if it's a string
      const numericPrice = typeof total_price === 'string' ? parseFloat(total_price) : total_price;
      
      // Verify that it's a valid number
      if (isNaN(numericPrice)) {
        console.error('La API devolvió un precio que no se puede convertir a número:', total_price);
        return 0;
      }
      
      return numericPrice;
    } catch (error) {
      console.error('Error al calcular precio:', error);
      // If it fails, return 0 to avoid breaking the UI
      return 0;
    }
  },

  /**
   * Creates a new product
   */
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    try {
      console.log('Creando nuevo producto:', productData);
      
      // Make sure the base price is in the correct format
      const dataToSend: any = { ...productData };
      
      // If basePrice exists in productData, convert it to base_price for the backend
      if (dataToSend.basePrice !== undefined) {
        dataToSend.base_price = dataToSend.basePrice;
        delete dataToSend.basePrice; // Remove the frontend property to avoid duplication
      }
      
      // If image exists in productData, convert it to image_url for the backend
      if (dataToSend.image !== undefined) {
        dataToSend.image_url = dataToSend.image;
        delete dataToSend.image; // Remove the frontend property to avoid duplication
      }
      
      console.log('Datos formateados para enviar al backend:', dataToSend);
      
      // Print full URL for debugging
      const apiUrl = getApiUrl('products');
      console.log('URL de creación de producto:', apiUrl);
      
      // Use native fetch to avoid axios middleware and redirects
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(dataToSend)
      });
      
      console.log('Código de estado de respuesta:', response.status);
      console.log('Headers de respuesta:', Object.fromEntries(response.headers));
      
      // If the response is not successful, try to get the error text
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Check the content type of the response
      const contentType = response.headers.get('content-type');
      console.log('Tipo de contenido de respuesta:', contentType);
      
      // If the response is empty or not JSON, handle it specially
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('La respuesta no es JSON, posiblemente está vacía o mal formateada');
        
        // If the response is successful but there is no JSON data, create a minimal product
        if (response.status >= 200 && response.status < 300) {
          console.log('Respuesta exitosa pero sin datos JSON. Creando producto mínimo...');
          
          // Create a minimal product based on the sent data
          const minimalProduct: Product = {
            id: Math.floor(Math.random() * 10000), // Temporary ID until reload
            name: dataToSend.name || 'Nuevo producto',
            category: dataToSend.category || 'general',
            basePrice: dataToSend.base_price || 0,
            image: dataToSend.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
            partTypes: []
          };
          
          console.log('Producto mínimo creado:', minimalProduct);
          return minimalProduct;
        }
        
        // If the response is not successful and it's not JSON, throw an error
        const respText = await response.text();
        throw new Error(`Respuesta no JSON (${response.status}): ${respText}`);
      }
      
      // Try to parse the JSON data
      let data;
      try {
        const responseText = await response.text();
        console.log('Texto de respuesta completo:', responseText);
        
        // If the text is empty, handle it
        if (!responseText || responseText.trim() === '') {
          console.warn('La respuesta JSON está vacía');
          throw new Error('Respuesta JSON vacía');
        }
        
        // Try to parse the JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error al parsear la respuesta JSON:', parseError);
        throw new Error(`Error al parsear respuesta: ${parseError}`);
      }
      
      console.log('Respuesta del backend al crear producto:', data);
      
      // If the response is null but the code is successful, create a minimal product
      if (!data && response.status >= 200 && response.status < 300) {
        console.warn('Respuesta del backend es null pero el código es exitoso. Creando producto mínimo...');
        
        // Create a minimal product based on the sent data
        const minimalProduct: Product = {
          id: Math.floor(Math.random() * 10000), // Temporary ID until reload
          name: dataToSend.name || 'Nuevo producto',
          category: dataToSend.category || 'general',
          basePrice: dataToSend.base_price || 0,
          image: dataToSend.image_url || 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200',
          partTypes: []
        };
        
        console.log('Producto mínimo creado:', minimalProduct);
        return minimalProduct;
      }
      
      // Verify that data contains the expected information
      if (!data || !data.id) {
        console.error('Respuesta del backend no contiene un ID de producto:', data);
        
        // If there is some kind of data in the response, try to use it
        if (data) {
          console.log('Intentando recuperar datos parciales de la respuesta...');
          
          // Create a product with available data and a temporary ID
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
   * Updates an existing product
   */
  updateProduct: async (productId: number, productData: Partial<Product>): Promise<Product> => {
    try {
      console.log(`Actualizando producto ${productId}:`, productData);
      
      // Make sure the base price is in the correct format
      const dataToSend: any = { ...productData };
      
      // If basePrice exists in productData, convert it to base_price for the backend
      if (dataToSend.basePrice !== undefined) {
        dataToSend.base_price = dataToSend.basePrice;
        delete dataToSend.basePrice; // Remove the frontend property to avoid duplication
      }
      
      // If image exists in productData, convert it to image_url for the backend
      if (dataToSend.image !== undefined) {
        dataToSend.image_url = dataToSend.image;
        delete dataToSend.image; // Remove the frontend property to avoid duplication
      }
      
      console.log('Datos formateados para enviar al backend:', dataToSend);
      
      // Generate the full URL with getApiUrl
      const apiUrl = getApiUrl(`products/${productId}`);
      console.log('URL de actualización de producto:', apiUrl);
      
      // Use native fetch to avoid redirects
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Respuesta del backend al actualizar producto:', data);
      
      // Verify that data contains the expected information
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
   * Deletes a product
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
   * Adds a new part type to a product
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
   * Adds a new option to a part type
   */
  addPartOption: async (partTypeId: number, optionData: Partial<PartOption>): Promise<PartOption> => {
    try {
      console.log(`Agregando opción al tipo de parte ${partTypeId}:`, optionData);
      
      // Make sure the data is in the correct format
      const dataToSend = {
        name: optionData.name,
        base_price: optionData.base_price,
        in_stock: optionData.in_stock !== false // Default to true if not defined
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
   * Deletes a part type
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
   * Deletes an option from a part type
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
   * Gets the dependencies of a product
   */
  getProductDependencies: async (productId: number) => {
    try {
      console.log(`Solicitando dependencias para el producto ${productId}`);
      const response = await apiClient.get(getApiUrl(`admin/products/${productId}/dependencies`));
      console.log('Respuesta de dependencias:', response.data);
      
      // Verify that the response is an array
      if (!Array.isArray(response.data)) {
        console.error('La respuesta de dependencias no es un array:', response.data);
        return [];
      }
      
      // Transform the data if necessary
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
      // In case of error, return an empty array to avoid breaking the UI
      return [];
    }
  },

  /**
   * Creates a new dependency between options
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
   * Deletes a dependency
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