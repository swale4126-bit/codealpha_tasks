import { Router } from 'express';
import {
  createCategoryHandler,
  deleteCategoryHandler,
  getCategories,
  getCategory,
  updateCategoryHandler,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  categoryIdParamValidation,
  createCategoryValidation,
  updateCategoryValidation,
} from '../validators/categoryValidator.js';

const router = Router();

// Public storefront endpoints
router.get('/', getCategories);
router.get('/:slug', getCategory);

// Admin-only management endpoints
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createCategoryValidation,
  validateRequest,
  createCategoryHandler
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  categoryIdParamValidation,
  updateCategoryValidation,
  validateRequest,
  updateCategoryHandler
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  categoryIdParamValidation,
  validateRequest,
  deleteCategoryHandler
);

export default router;
