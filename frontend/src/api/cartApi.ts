import apiClient from './client';
import { AddToCartRequest } from '../types/product';

export interface CartItem {
  id: number;
  product_id: number;
  price_snapshot: number;
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

export const CartApi = {
  /**
   * Obtiene el carrito del usuario actual
   */
  getCart: async (): Promise<Cart> => {
    try {
      const response = await apiClient.get('/api/cart');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      
      // Simular respuesta en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta del carrito en modo desarrollo');
        return {
          id: 1,
          user_id: null,
          created_at: new Date().toISOString(),
          items: []
        };
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
        selected_option_ids: request.selected_options,
        quantity: request.quantity
      };
      
      console.log('Enviando datos al carrito:', requestBody);
      
      const response = await apiClient.post('/api/cart/items', requestBody);
      return response.data;
    } catch (error) {
      console.error('Error en addToCart:', error);
      
      // Simular respuesta en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulando respuesta de añadir al carrito en modo desarrollo');
        return {
          cart_item_id: Math.floor(Math.random() * 1000) + 1
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
      return response.data.cart_item;
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