import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  addProductReview,
  listProductReviews,
  removeReview,
} from '../services/reviewService.js';

export const getProductReviews = asyncHandler(async (req, res) => {
  const { reviews, summary, meta } = await listProductReviews(req.params.id, {
    page: req.query.page,
    limit: req.query.limit,
  });

  return sendSuccess(res, {
    message: 'Product reviews retrieved successfully',
    data: { reviews, summary },
    meta,
  });
});

export const createReviewHandler = asyncHandler(async (req, res) => {
  const review = await addProductReview(req.user.id, req.params.id, req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: { review },
  });
});

export const deleteReviewHandler = asyncHandler(async (req, res) => {
  await removeReview(req.params.id, req.user);
  return sendSuccess(res, {
    message: 'Review deleted successfully',
    data: null,
  });
});
