import { Router } from 'express';
import {
  createProductHandler,
  deleteProductHandler,
  getProductByIdOrSlug,
  getProducts,
  updateProductHandler,
} from '../controllers/productController.js';
import { createReviewHandler, getProductReviews } from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createProductValidation,
  listProductsQueryValidation,
  productIdParamValidation,
  updateProductValidation,
} from '../validators/productValidator.js';
import { createReviewValidation, reviewProductIdParamValidation } from '../validators/reviewValidator.js';

const router = Router();

// Public storefront product endpoints
router.get('/', listProductsQueryValidation, validateRequest, getProducts);

// Nested product review endpoints (placed before /:idOrSlug so /:id/reviews matches cleanly)
router.get('/:id/reviews', reviewProductIdParamValidation, validateRequest, getProductReviews);
router.post(
  '/:id/reviews',
  authenticate,
  reviewProductIdParamValidation,
  createReviewValidation,
  validateRequest,
  createReviewHandler
);

router.get('/:idOrSlug', getProductByIdOrSlug);

// Admin-only product management endpoints
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createProductValidation,
  validateRequest,
  createProductHandler
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  productIdParamValidation,
  updateProductValidation,
  validateRequest,
  updateProductHandler
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  productIdParamValidation,
  validateRequest,
  deleteProductHandler
);

export default router;
