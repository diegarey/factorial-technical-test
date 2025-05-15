import apiClient from './client';
import { AddToCartRequest } from '../types/product';
import { getApiUrl } from '../config/api';

export interface CartItem {
  id: number;
  product_id: number;
  price_snapshot: number | string; // Can come as string from the API
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

// Function to save the cart ID in localStorage
const saveCartIdToLocalStorage = (cartId: number) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_CART_ID_KEY, cartId.toString());
    console.log(`Cart ID saved in localStorage: ${cartId}`);
  } catch (e) {
    console.warn('Could not save cart ID in localStorage:', e);
  }
};

// Function to get the cart ID from localStorage
const getCartIdFromLocalStorage = (): number | null => {
  try {
    const cartId = localStorage.getItem(LOCAL_STORAGE_CART_ID_KEY);
    if (cartId) {
      const cartIdNum = parseInt(cartId, 10);
      console.log(`Cart ID retrieved from localStorage: ${cartIdNum}`);
      return cartIdNum;
    }
  } catch (e) {
    console.warn('Could not get cart ID from localStorage:', e);
  }
  return null;
};

// Function to normalize cart data
const normalizeCartData = (cartData: any): Cart => {
  if (!cartData) {
    return {
      id: 0,
      user_id: null,
      created_at: new Date().toISOString(),
      items: []
    };
  }
  
  // Convert items
  const normalizedItems = Array.isArray(cartData.items) 
    ? cartData.items.map((item: any) => ({
        ...item,
        // Ensure price_snapshot is a number
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
   * Gets the current user's cart
   */
  getCart: async (): Promise<Cart> => {
    try {
      const cartIdFromStorage = getCartIdFromLocalStorage();
      console.log('Cart ID in localStorage before request:', cartIdFromStorage);

      // Get the cart from the server including localStorage ID as query_cart_id parameter
      const response = await apiClient.get(getApiUrl('cart'), {
        params: cartIdFromStorage ? { query_cart_id: cartIdFromStorage } : undefined
      });
      
      const cart = response.data;
      
      // Save the cart ID in localStorage
      if (cart && cart.id) {
        saveCartIdToLocalStorage(cart.id);
        console.log(`Cart ID updated in localStorage: ${cart.id}`);
      }
      
      return normalizeCartData(cart);
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  /**
   * Adds a product to the cart
   */
  addToCart: async (request: AddToCartRequest): Promise<{ cart_item_id: number }> => {
    try {
      const requestBody = {
        product_id: request.product_id,
        selected_options: request.selected_options,
        quantity: request.quantity
      };
      
      console.log('---- STARTING ADD TO CART ----');
      console.log('Data to send to cart:', requestBody);
      
      // Get cart ID from localStorage
      const cartIdFromStorage = getCartIdFromLocalStorage();
      console.log('Cart ID in localStorage:', cartIdFromStorage);
      
      // Make the request including query_cart_id as parameter if it exists
      const response = await apiClient.post(
        getApiUrl('cart/items'),
        requestBody,
        {
          params: cartIdFromStorage ? { query_cart_id: cartIdFromStorage } : undefined
        }
      );
      
      console.log('Add to cart response:', response.data);
      
      // If the response includes a new cart ID, update it in localStorage
      if (response.data && response.data.cart_id) {
        saveCartIdToLocalStorage(response.data.cart_id);
        console.log(`Cart ID updated in localStorage: ${response.data.cart_id}`);
      }
      
      console.log('---- FINISHED ADD TO CART ----');
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  /**
   * Updates the quantity of a product in the cart
   */
  updateCartItemQuantity: async (itemId: number, quantity: number): Promise<CartItem> => {
    try {
      console.log(`Updating item ${itemId} quantity to ${quantity}`);
      const response = await apiClient.put(getApiUrl(`cart/items/${itemId}`), null, {
        params: { quantity }
      });
      return response.data.cart_item;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  /**
   * Removes a product from the cart
   */
  removeCartItem: async (itemId: number): Promise<void> => {
    try {
      console.log(`Removing item ${itemId} from cart`);
      await apiClient.delete(getApiUrl(`cart/items/${itemId}`));
    } catch (error) {
      console.error('Error removing cart item:', error);
      throw error;
    }
  }
}; 