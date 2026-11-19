import { Router } from 'express';
import {
  cancelMyOrder,
  checkout,
  getMyOrders,
  getOrder,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createOrderValidation,
  listOrdersQueryValidation,
  orderIdParamValidation,
} from '../validators/orderValidator.js';

const router = Router();

// All customer order endpoints require authentication
router.use(authenticate);

router.post('/', createOrderValidation, validateRequest, checkout);
router.get('/my-orders', listOrdersQueryValidation, validateRequest, getMyOrders);
router.get('/:id', orderIdParamValidation, validateRequest, getOrder);
router.patch('/:id/cancel', orderIdParamValidation, validateRequest, cancelMyOrder);

export default router;
