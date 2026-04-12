import api from '~/config/axios';

export interface CartItem {
  cartItemId: string;
  productId: string;
  quantity: number;
  amount: number;
  note?: string;
  product?: {
    productId: string;
    productName: string;
    description: string;
    originalPrice: number;
    imageUrl: string;
    status: string;
  };
}

export interface Cart {
  cartId: string;
  customerId: string;
  totalAmount: number;
  items: CartItem[];
}

export interface CartItemDTO {
  productId: string;
  quantity: number;
  amount: number;
  note?: string;
}

// CUSTOMER ENDPOINTS - Require customer authentication
export const getCustomerCart = async (customerId: string) => {
  const response = await api.get(`/api/customer/cart/getCustomer/${customerId}`);
  return response.data;
};

export const addToCart = async (cartId: string, cartItem: CartItemDTO) => {
  const response = await api.post(`/api/customer/cart/${cartId}/items`, cartItem);
  return response.data;
};

export const updateCartItem = async (cartId: string, cartItemId: string, quantity: number) => {
  const response = await api.put(`/api/customer/cart/${cartId}/items/${cartItemId}`, {
    quantity
  });
  return response.data;
};

export const removeCartItem = async (cartId: string, cartItemId: string) => {
  const response = await api.delete(`/api/customer/cart/${cartId}/items/${cartItemId}`);
  return response.data;
};

export const clearCart = async (cartId: string) => {
  const response = await api.delete(`/api/customer/cart/${cartId}/clear`);
  return response.data;
};

export const getCartTotal = async (cartId: string) => {
  const response = await api.get(`/api/customer/cart/${cartId}/total`);
  return response.data;
};

export const createCart = async (customerId: string) => {
  const response = await api.post('/api/customer/cart', { customerId });
  return response.data;
};