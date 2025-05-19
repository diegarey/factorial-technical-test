import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Función para obtener opciones de un producto con la selección actual
export const getProductOptions = async (productId: number, currentSelection: number[] = []) => {
  try {
    // Convertir el array de IDs a una cadena separada por comas
    const currentSelectionStr = currentSelection.join(',');
    
    console.log(`Obteniendo opciones para producto ${productId} con selección: ${currentSelectionStr}`);
    
    // Pasar los IDs de selección como un parámetro de consulta
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/options`, {
      params: {
        current_selection: currentSelectionStr
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener opciones del producto:', error);
    console.error('Failed URL:', `${API_BASE_URL}/products/${productId}/options`);
    console.error('Method: GET');
    console.error('Sent data:', undefined);
    console.error('Sent parameters:', { current_selection: currentSelection.join(',') });
    throw error;
  }
};

// Función para validar compatibilidad
export const validateCompatibility = async (productId: number, selectedOptionIds: number[]) => {
  try {
    console.log(`Validando compatibilidad para producto ${productId} con opciones: ${selectedOptionIds}`);
    
    const response = await axios.post(`${API_BASE_URL}/products/validate-compatibility`, {
      product_id: productId,
      selected_option_ids: selectedOptionIds
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al validar compatibilidad:', error);
    throw error;
  }
};

// Función para calcular precio
export const calculatePrice = async (productId: number, selectedOptionIds: number[]) => {
  try {
    console.log(`Calculando precio para producto ${productId} con opciones: ${selectedOptionIds}`);
    
    const response = await axios.post(`${API_BASE_URL}/products/calculate-price`, {
      product_id: productId,
      selected_option_ids: selectedOptionIds
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al calcular precio:', error);
    throw error;
  }
}; 