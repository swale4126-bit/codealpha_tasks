import {
  fetchDashboardMetrics,
  fetchSalesSummary,
  findAdminCustomers,
  findAdminOrders,
  setCustomerActiveStatus,
  setProductInventory,
  updateOrderStatusModel,
} from '../models/adminModel.js';

export async function getDashboardData() {
  return await fetchDashboardMetrics();
}

export async function getSalesSummaryData(days = 30) {
  const parsedDays = Math.min(Math.max(parseInt(days, 10) || 30, 1), 365);
  return await fetchSalesSummary(parsedDays);
}

export async function getAdminOrdersList(filters) {
  return await findAdminOrders(filters);
}

export async function changeOrderStatus(orderId, nextStatus) {
  const updated = await updateOrderStatusModel(orderId, nextStatus);
  if (!updated) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

export async function getAdminCustomersList(filters) {
  return await findAdminCustomers(filters);
}

export async function toggleCustomerActive(customerId, isActive, currentAdminId) {
  if (parseInt(customerId, 10) === parseInt(currentAdminId, 10)) {
    const error = new Error('Administrators cannot modify their own active account status.');
    error.statusCode = 400;
    throw error;
  }

  const updated = await setCustomerActiveStatus(customerId, isActive);
  if (!updated) {
    const error = new Error('Customer account not found or cannot be modified.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

export async function updateInventory(productId, stockQuantity, lowStockThreshold) {
  const updated = await setProductInventory(productId, stockQuantity, lowStockThreshold);
  if (!updated) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}
