import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getCustomers,
  getDashboard,
  getOrders,
  getSalesSummary,
  updateCustomerStatus,
  updateOrderStatus,
  updateProductStock,
} from '../controllers/adminController.js';
import {
  salesSummaryValidator,
  updateCustomerStatusValidator,
  updateInventoryValidator,
  updateOrderStatusValidator,
} from '../validators/adminValidator.js';

const router = Router();

// Protect all admin endpoints with authentication and admin role check
router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/sales-summary', salesSummaryValidator, getSalesSummary);
router.get('/orders', getOrders);
router.patch('/orders/:id/status', updateOrderStatusValidator, updateOrderStatus);
router.get('/customers', getCustomers);
router.patch('/customers/:id/status', updateCustomerStatusValidator, updateCustomerStatus);
router.patch('/products/:id/inventory', updateInventoryValidator, updateProductStock);

export default router;
