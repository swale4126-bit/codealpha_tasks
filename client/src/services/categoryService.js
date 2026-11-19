import api from './api.js';

export async function getCategories() {
  const res = await api.get('/categories');
  return res.data.data.categories;
}

export async function getCategoryBySlug(slug) {
  const res = await api.get(`/categories/${slug}`);
  return res.data.data.category;
}

export async function createCategory(data) {
  const res = await api.post('/categories', data);
  return res.data.data.category;
}

export async function updateCategory(id, data) {
  const res = await api.put(`/categories/${id}`, data);
  return res.data.data.category;
}

export async function deleteCategory(id) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}
