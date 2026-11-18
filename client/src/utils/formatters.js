export function formatCurrency(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function getDiscountPercent(price, compareAtPrice) {
  const p = Number(price);
  const c = Number(compareAtPrice);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

export function extractApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.message).join('. ');
  }
  return data?.message || error?.message || fallback;
}
