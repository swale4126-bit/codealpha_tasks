import api from './api.js';

export async function getProductReviews(productId, params = {}) {
  const res = await api.get(`/products/${productId}/reviews`, { params });
  return {
    reviews: res.data.data.reviews,
    summary: res.data.data.summary,
    meta: res.data.meta,
  };
}

export async function createProductReview(productId, payload) {
  const res = await api.post(`/products/${productId}/reviews`, payload);
  return res.data.data.review;
}

export async function deleteProductReview(reviewId) {
  const res = await api.delete(`/reviews/${reviewId}`);
  return res.data;
}
