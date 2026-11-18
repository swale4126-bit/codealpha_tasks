import AppError from '../utils/AppError.js';
import { findProductByIdOrSlug } from '../models/productModel.js';
import {
  createReview,
  deleteReviewById,
  findReviewById,
  findReviewsByProductId,
  findUserReviewForProduct,
} from '../models/reviewModel.js';

export async function listProductReviews(productId, pagination) {
  const product = await findProductByIdOrSlug(productId, { includeInactive: false });
  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  return findReviewsByProductId(productId, pagination);
}

export async function addProductReview(userId, productId, { rating, title, comment }) {
  const product = await findProductByIdOrSlug(productId, { includeInactive: false });
  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  const existing = await findUserReviewForProduct(userId, productId);
  if (existing) {
    throw new AppError(409, 'You have already submitted a review for this product.');
  }

  return createReview({ userId, productId, rating, title, comment });
}

export async function removeReview(reviewId, currentUser) {
  const review = await findReviewById(reviewId);
  if (!review) {
    throw new AppError(404, 'Review not found.');
  }

  const isOwner = review.userId === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError(403, 'You do not have permission to delete this review.');
  }

  await deleteReviewById(reviewId);
}
