import api from './api.js';

export async function getProducts(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const res = await api.get('/products', { params: cleanParams });
  return {
    products: res.data.data.products,
    meta: res.data.meta,
  };
}

export async function getProductByIdOrSlug(idOrSlug) {
  const res = await api.get(`/products/${idOrSlug}`);
  return res.data.data;
}
