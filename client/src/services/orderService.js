import api from './api.js';

export async function createOrderRequest(payload) {
  const res = await api.post('/orders', payload);
  return res.data.data.order;
}

export async function getMyOrdersRequest(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const res = await api.get('/orders/my-orders', { params: cleanParams });
  return {
    orders: res.data.data.orders,
    meta: res.data.meta,
  };
}

export async function getOrderByIdRequest(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data.data.order;
}

export async function cancelOrderRequest(orderId) {
  const res = await api.patch(`/orders/${orderId}/cancel`);
  return res.data.data.order;
}
