import AppError from '../utils/AppError.js';
import slugify from '../utils/slugify.js';
import { findCategoryById } from '../models/categoryModel.js';
import {
  createProductWithImages,
  deleteProductSafely,
  findProductByIdOrSlug,
  findProducts,
  findRelatedProducts,
  updateProductWithImages,
} from '../models/productModel.js';

export async function listStorefrontProducts(filters) {
  return findProducts({
    ...filters,
    includeInactive: false,
  });
}

export async function getProductDetails(idOrSlug) {
  const product = await findProductByIdOrSlug(idOrSlug, { includeInactive: false });
  if (!product) {
    throw new AppError(404, 'Product not found.');
  }

  const relatedProducts = await findRelatedProducts(product.category.id, product.id, 4);
  return { product, relatedProducts };
}

export async function addProduct(payload) {
  const category = await findCategoryById(payload.categoryId);
  if (!category) {
    throw new AppError(400, 'Selected category does not exist.');
  }

  const baseSlug = slugify(payload.name);
  if (!baseSlug) {
    throw new AppError(400, 'Product name must contain alphanumeric characters.');
  }

  const slug = `${baseSlug}-${slugify(payload.sku)}`;
  return createProductWithImages({
    ...payload,
    slug,
  });
}

export async function editProduct(id, payload) {
  const existing = await findProductByIdOrSlug(id, { includeInactive: true });
  if (!existing) {
    throw new AppError(404, 'Product not found.');
  }

  if (payload.categoryId !== undefined) {
    const category = await findCategoryById(payload.categoryId);
    if (!category) {
      throw new AppError(400, 'Selected category does not exist.');
    }
  }

  const nextPrice = payload.price !== undefined ? payload.price : existing.price;
  const nextCompare =
    payload.compareAtPrice !== undefined ? payload.compareAtPrice : existing.compareAtPrice;
  if (nextCompare !== null && nextCompare < nextPrice) {
    throw new AppError(400, 'compareAtPrice must be greater than or equal to price.');
  }

  let nextSlug;
  if (payload.name !== undefined || payload.sku !== undefined) {
    const nextName = payload.name ?? existing.name;
    const nextSku = payload.sku ?? existing.sku;
    nextSlug = `${slugify(nextName)}-${slugify(nextSku)}`;
  }

  return updateProductWithImages(id, {
    ...payload,
    ...(nextSlug && { slug: nextSlug }),
  });
}

export async function removeProduct(id) {
  const result = await deleteProductSafely(id);
  if (!result) {
    throw new AppError(404, 'Product not found.');
  }
  return result;
}
