import api from './api.js';

export async function getAdminDashboard() {
  const response = await api.get('/admin/dashboard');
  return response.data.data;
}

export async function getAdminSalesSummary(days = 30) {
  const response = await api.get('/admin/sales-summary', { params: { days } });
  return response.data.data;
}

export async function getAdminOrders(params = {}) {
  const response = await api.get('/admin/orders', { params });
  return {
    orders: response.data.data,
    meta: response.data.meta,
  };
}

export async function updateAdminOrderStatus(orderId, status) {
  const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
  return response.data;
}

export async function getAdminCustomers(params = {}) {
  const response = await api.get('/admin/customers', { params });
  return {
    customers: response.data.data,
    meta: response.data.meta,
  };
}

export async function updateAdminCustomerStatus(customerId, isActive) {
  const response = await api.patch(`/admin/customers/${customerId}/status`, { isActive });
  return response.data;
}

export async function updateAdminProductInventory(productId, payload) {
  const response = await api.patch(`/admin/products/${productId}/inventory`, payload);
  return response.data;
}
