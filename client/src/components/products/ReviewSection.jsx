import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import useToast from '../../hooks/useToast.js';
import {
  createProductReview,
  deleteProductReview,
  getProductReviews,
} from '../../services/reviewService.js';
import { extractApiError, formatDate } from '../../utils/formatters.js';
import Button from '../common/Button.jsx';
import StarRating from '../common/StarRating.jsx';
import { EmptyState, LoadingSpinner } from '../common/StateBlocks.jsx';

export default function ReviewSection({ productId, onReviewChanged }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductReviews(productId, { limit: 20 });
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const userAlreadyReviewed = Boolean(user && reviews.some((r) => r.userId === user.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      toast.error('Please write at least 5 characters in your review.');
      return;
    }

    setSubmitting(true);
    try {
      await createProductReview(productId, { rating, title: title.trim() || undefined, comment });
      toast.success('Thank you! Your review has been published.');
      setTitle('');
      setComment('');
      setRating(5);
      await loadReviews();
      onReviewChanged?.();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteProductReview(reviewId);
      toast.info('Review deleted.');
      await loadReviews();
      onReviewChanged?.();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not delete review'));
    }
  };

  return (
    <section className="mt-16 border-t border-stone-200 pt-12">
      <h2 className="font-display text-2xl font-bold text-slate-900">Customer Reviews</h2>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Rating Summary & Composer */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="font-display text-4xl font-extrabold text-slate-900">
                {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '0.0'}
              </div>
              <div>
                <StarRating rating={summary.averageRating} size="md" />
                <p className="mt-1 text-xs text-slate-500">
                  Based on {summary.totalReviews}{' '}
                  {summary.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution?.[star] || 0;
                const pct = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-10 font-medium text-slate-600">{star} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Form */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-base font-bold text-slate-900">Write a Review</h3>
            {!isAuthenticated ? (
              <p className="mt-2 text-sm text-slate-600">
                Please{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                  sign in
                </Link>{' '}
                to share your experience with this product.
              </p>
            ) : userAlreadyReviewed ? (
              <p className="mt-2 text-sm text-slate-600">
                You have already reviewed this product. Delete your existing review if you would
                like to post a new one.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Your Rating</label>
                  <div className="mt-1.5">
                    <StarRating rating={rating} size="lg" interactive onChange={setRating} />
                  </div>
                </div>
                <div>
                  <label htmlFor="review-title" className="block text-xs font-semibold text-slate-700">
                    Headline (optional)
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    maxLength={150}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your impression"
                    className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="review-comment" className="block text-xs font-semibold text-slate-700">
                    Review Details
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    minLength={5}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What stood out about the quality, performance, or value?"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <Button type="submit" loading={submitting} className="w-full">
                  Submit Review
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Review List */}
        <div className="lg:col-span-7">
          {loading ? (
            <LoadingSpinner label="Loading reviews..." />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews yet"
              description="Be the first shopper to review this product and help others decide."
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const canDelete = isAuthenticated && (user.id === review.userId || isAdmin);
                return (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-slate-900">
                            {review.reviewerName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          title="Delete review"
                          aria-label="Delete review"
                          className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {review.title && (
                      <h4 className="mt-3 text-sm font-bold text-slate-900">{review.title}</h4>
                    )}
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
