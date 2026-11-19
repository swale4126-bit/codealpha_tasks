import api from './api.js';

export async function getCartRequest() {
  const res = await api.get('/cart');
  return res.data.data.cart;
}

export async function addCartItemRequest({ productId, quantity }) {
  const res = await api.post('/cart/items', { productId, quantity });
  return res.data.data.cart;
}

export async function updateCartItemRequest(itemId, quantity) {
  const res = await api.patch(`/cart/items/${itemId}`, { quantity });
  return res.data.data.cart;
}

export async function removeCartItemRequest(itemId) {
  const res = await api.delete(`/cart/items/${itemId}`);
  return res.data.data.cart;
}

export async function clearCartRequest() {
  const res = await api.delete('/cart');
  return res.data.data.cart;
}

export async function mergeCartRequest(items) {
  const res = await api.post('/cart/merge', { items });
  return res.data.data.cart;
}
