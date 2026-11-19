import {
  changeOrderStatus,
  getAdminCustomersList,
  getAdminOrdersList,
  getDashboardData,
  getSalesSummaryData,
  toggleCustomerActive,
  updateInventory,
} from '../services/adminService.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await getDashboardData();
    res.json({
      success: true,
      message: 'Admin dashboard metrics retrieved successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesSummary(req, res, next) {
  try {
    const data = await getSalesSummaryData(req.query.days);
    res.json({
      success: true,
      message: 'Sales summary retrieved successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrders(req, res, next) {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const result = await getAdminOrdersList({
      status,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updated = await changeOrderStatus(orderId, status);
    res.json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const result = await getAdminCustomersList({
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json({
      success: true,
      data: result.customers,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomerStatus(req, res, next) {
  try {
    const customerId = req.params.id;
    const { isActive } = req.body;
    const updated = await toggleCustomerActive(customerId, isActive, req.user.id);
    res.json({
      success: true,
      message: `Customer account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductStock(req, res, next) {
  try {
    const productId = req.params.id;
    const { stockQuantity, lowStockThreshold } = req.body;
    const updated = await updateInventory(productId, stockQuantity, lowStockThreshold);
    res.json({
      success: true,
      message: 'Product inventory updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
