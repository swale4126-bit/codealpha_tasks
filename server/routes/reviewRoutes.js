import { Router } from 'express';
import { deleteReviewHandler } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { reviewIdParamValidation } from '../validators/reviewValidator.js';

const router = Router();

router.delete('/:id', authenticate, reviewIdParamValidation, validateRequest, deleteReviewHandler);

export default router;
