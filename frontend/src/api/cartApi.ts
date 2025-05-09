import apiClient from './client';
import { AddToCartRequest } from '../types/product';

export interface CartItem {
  id: number;
  product_id: number;
  price_snapshot: number | string; // Puede venir como string desde la API
  quantity: number;
  options: {
    id: number;
    part_option_id: number;
  }[];
}

export interface Cart {
  id: number;
  user_id: string | null;
  created_at: string;
  items: CartItem[];
}

const LOCAL_STORAGE_CART_ID_KEY = 'marcus_bikes_cart_id';

// Función para guardar el ID del carrito en localStorage
const saveCartIdToLocalStorage = (cartId: number) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CART_ID_KEY, cartId.toString());
    console.log(`ID del carrito guardado en localStorage: ${cartId}`);
  } catch (e) {
    console.warn('No se pudo guardar el ID del carrito en localStorage:', e);
  }
};

// Función para obtener el ID del carrito desde localStorage
const getCartIdFromLocalStorage = (): number | null => {
  try {
    const cartId = localStorage.getItem(LOCAL_STORAGE_CART_ID_KEY);
    if (cartId) {
      const cartIdNum = parseInt(cartId, 10);
      console.log(`ID del carrito recuperado de localStorage: ${cartIdNum}`);
      return cartIdNum;
    }
  } catch (e) {
    console.warn('No se pudo obtener el ID del carrito desde localStorage:', e);
  }
  return null;
};

// Función para normalizar los datos del carrito
const normalizeCartData = (cartData: any): Cart => {
  if (!cartData) {
    return {
      id: 0,
      user_id: null,
      created_at: new Date().toISOString(),
      items: []
    };
  }
  
  // Convertir items
  const normalizedItems = Array.isArray(cartData.items) 
    ? cartData.items.map((item: any) => ({
        ...item,
        // Asegurar que price_snapshot sea un número
        price_snapshot: typeof item.price_snapshot === 'number' 
          ? item.price_snapshot 
          : parseFloat(String(item.price_snapshot)) || 0
      }))
    : [];
  
  return {
    id: cartData.id || 0,
    user_id: cartData.user_id || null,
    created_at: cartData.created_at || new Date().toISOString(),
    items: normalizedItems
  };
};

export const CartApi = {
  /**
   * Obtiene el carrito del usuario actual
   */
  getCart: async (): Promise<Cart> => {
    try {
      // Obtenemos el carrito del servidor - esto debería usar cookies automáticamente
      console.log('Solicitando carrito del servidor');
      const response = await apiClient.get('/api/cart');
      const cart = response.data;
      
      // Guardar el ID del carrito en localStorage como respaldo
      if (cart && cart.id) {
        saveCartIdToLocalStorage(cart.id);
      }
      
      return normalizeCartData(cart);
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      
      // Intentar usar el ID del carrito guardado en localStorage como fallback
      const cartIdFromStorage = getCartIdFromLocalStorage();
      if (cartIdFromStorage) {
        console.log(`Intentando recuperar carrito por ID desde localStorage: ${cartIdFromStorage}`);
        try {
          // Incluir el ID del carrito de localStorage como parámetro de consulta
          const fallbackResponse = await apiClient.get(`/api/cart?cart_id=${cartIdFromStorage}`);
          return normalizeCartData(fallbackResponse.data);
        } catch (fallbackError) {
          console.error('Error al recuperar carrito con ID de localStorage:', fallbackError);
        }
      }
      
      // Simular respuesta en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta del carrito en modo desarrollo');
        return normalizeCartData({
          id: 1,
          user_id: null,
          created_at: new Date().toISOString(),
          items: []
        });
      }
      throw error;
    }
  },

  /**
   * Añade un producto al carrito
   */
  addToCart: async (request: AddToCartRequest): Promise<{ cart_item_id: number }> => {
    try {
      // Ajustar la estructura para adaptarse a lo que espera el backend
      const requestBody = {
        product_id: request.product_id,
        selected_options: request.selected_options,
        quantity: request.quantity
      };
      
      console.log('---- INICIANDO AÑADIR AL CARRITO ----');
      console.log('Datos a enviar al carrito:', requestBody);
      console.log('Estado de las cookies antes de la solicitud:', document.cookie);
      
      // Obtener el ID del carrito de localStorage como respaldo
      const cartIdFromStorage = getCartIdFromLocalStorage();
      let url = '/api/cart/items';
      
      // Si tenemos un ID del carrito en localStorage, lo añadimos como parámetro de consulta
      if (cartIdFromStorage) {
        url = `${url}?cart_id=${cartIdFromStorage}`;
        console.log(`Añadiendo ID del carrito como parámetro: ${cartIdFromStorage}`);
      } else {
        console.log('No se encontró ID del carrito en localStorage');
      }
      
      console.log(`Enviando solicitud POST a: ${url}`);
      const response = await apiClient.post(url, requestBody);
      
      console.log('Respuesta de añadir al carrito:', response.data);
      console.log('Estado de las cookies después de la solicitud:', document.cookie);
      
      // Guardar el ID del carrito si está presente en la respuesta
      if (response.data && response.data.cart_id) {
        console.log(`Guardando ID del carrito desde la respuesta: ${response.data.cart_id}`);
        saveCartIdToLocalStorage(response.data.cart_id);
      }
      
      console.log('---- FINALIZADO AÑADIR AL CARRITO ----');
      return response.data;
    } catch (error: any) {
      console.error('---- ERROR EN AÑADIR AL CARRITO ----');
      console.error('Error detallado:', error);
      
      if (error.response) {
        console.error('Datos de respuesta de error:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        console.error('Encabezados:', error.response.headers);
      } else if (error.request) {
        console.error('No se recibió respuesta a la solicitud');
        console.error('Detalles de la solicitud:', error.request);
      } else {
        console.error('Error durante la configuración de la solicitud:', error.message);
      }
      
      console.error('Estado de las cookies después del error:', document.cookie);
      
      // Simular respuesta en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta de añadir al carrito en modo desarrollo');
        const mockItemId = Math.floor(Math.random() * 1000) + 1;
        console.log(`ID de ítem simulado: ${mockItemId}`);
        return {
          cart_item_id: mockItemId
        };
      }
      
      throw error;
    }
  },

  /**
   * Actualiza la cantidad de un producto en el carrito
   */
  updateCartItem: async (itemId: number, quantity: number): Promise<CartItem> => {
    try {
      const response = await apiClient.put(`/api/cart/items/${itemId}`, { quantity });
      
      // Normalizar el item retornado
      const item = response.data.cart_item;
      return {
        ...item,
        price_snapshot: typeof item.price_snapshot === 'number' 
          ? item.price_snapshot 
          : parseFloat(String(item.price_snapshot)) || 0
      };
    } catch (error) {
      console.error('Error al actualizar el ítem del carrito:', error);
      
      // Simular respuesta en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta de actualización en modo desarrollo');
        return {
          id: itemId,
          product_id: 1,
          price_snapshot: 100,
          quantity: quantity,
          options: []
        };
      }
      throw error;
    }
  },

  /**
   * Elimina un producto del carrito
   */
  removeCartItem: async (itemId: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/cart/items/${itemId}`);
    } catch (error) {
      console.error('Error al eliminar ítem del carrito:', error);
      
      // En modo desarrollo, simplemente log
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando eliminación de ítem en modo desarrollo');
        return;
      }
      throw error;
    }
  }
}; 