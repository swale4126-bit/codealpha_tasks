import api from './api.js';

export async function getCategories() {
  const res = await api.get('/categories');
  return res.data.data.categories;
}

export async function getCategoryBySlug(slug) {
  const res = await api.get(`/categories/${slug}`);
  return res.data.data.category;
}
