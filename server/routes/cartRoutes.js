import { Router } from 'express';
import {
  addCartItem,
  clearCart,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  addCartItemValidation,
  cartItemIdParamValidation,
  mergeCartValidation,
  updateCartItemValidation,
} from '../validators/cartValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', addCartItemValidation, validateRequest, addCartItem);
router.patch(
  '/items/:itemId',
  cartItemIdParamValidation,
  updateCartItemValidation,
  validateRequest,
  updateCartItem
);
router.delete('/items/:itemId', cartItemIdParamValidation, validateRequest, removeCartItem);
router.delete('/', clearCart);
router.post('/merge', mergeCartValidation, validateRequest, mergeCart);

export default router;
