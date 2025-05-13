import apiClient from './client';
import { AddToCartRequest } from '../types/product';
import { getApiUrl } from '../config/api';

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
      const cartIdFromStorage = getCartIdFromLocalStorage();
      console.log('ID del carrito en localStorage antes de la solicitud:', cartIdFromStorage);

      // Obtener el carrito del servidor incluyendo el ID de localStorage como parámetro query_cart_id
      const response = await apiClient.get(getApiUrl('cart'), {
        params: cartIdFromStorage ? { query_cart_id: cartIdFromStorage } : undefined
      });
      
      const cart = response.data;
      
      // Guardar el ID del carrito en localStorage
      if (cart && cart.id) {
        saveCartIdToLocalStorage(cart.id);
        console.log(`ID del carrito actualizado en localStorage: ${cart.id}`);
      }
      
      return normalizeCartData(cart);
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      throw error;
    }
  },

  /**
   * Añade un producto al carrito
   */
  addToCart: async (request: AddToCartRequest): Promise<{ cart_item_id: number }> => {
    try {
      const requestBody = {
        product_id: request.product_id,
        selected_options: request.selected_options,
        quantity: request.quantity
      };
      
      console.log('---- INICIANDO AÑADIR AL CARRITO ----');
      console.log('Datos a enviar al carrito:', requestBody);
      
      // Obtener el ID del carrito de localStorage
      const cartIdFromStorage = getCartIdFromLocalStorage();
      console.log('ID del carrito en localStorage:', cartIdFromStorage);
      
      // Realizar la solicitud incluyendo el query_cart_id como parámetro si existe
      const response = await apiClient.post(
        getApiUrl('cart/items'),
        requestBody,
        {
          params: cartIdFromStorage ? { query_cart_id: cartIdFromStorage } : undefined
        }
      );
      
      console.log('Respuesta de añadir al carrito:', response.data);
      
      // Si la respuesta incluye un nuevo ID de carrito, actualizarlo en localStorage
      if (response.data && response.data.cart_id) {
        saveCartIdToLocalStorage(response.data.cart_id);
        console.log(`ID del carrito actualizado en localStorage: ${response.data.cart_id}`);
      }
      
      console.log('---- FINALIZADO AÑADIR AL CARRITO ----');
      return response.data;
    } catch (error) {
      console.error('Error al añadir al carrito:', error);
      throw error;
    }
  },

  /**
   * Actualiza la cantidad de un producto en el carrito
   */
  updateCartItemQuantity: async (itemId: number, quantity: number): Promise<CartItem> => {
    try {
      console.log(`Actualizando cantidad del ítem ${itemId} a ${quantity}`);
      const response = await apiClient.put(getApiUrl(`cart/items/${itemId}`), null, {
        params: { quantity }
      });
      return response.data.cart_item;
    } catch (error) {
      console.error('Error al actualizar ítem del carrito:', error);
      throw error;
    }
  },

  /**
   * Elimina un producto del carrito
   */
  removeCartItem: async (itemId: number): Promise<void> => {
    try {
      console.log(`Eliminando ítem ${itemId} del carrito`);
      await apiClient.delete(getApiUrl(`cart/items/${itemId}`));
    } catch (error) {
      console.error('Error al eliminar ítem del carrito:', error);
      throw error;
    }
  }
}; 