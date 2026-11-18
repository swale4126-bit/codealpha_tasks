import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  addProduct,
  editProduct,
  getProductDetails,
  listStorefrontProducts,
  removeProduct,
} from '../services/productService.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await listStorefrontProducts({
    search: req.query.search,
    category: req.query.category,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    minRating: req.query.minRating,
    inStock: req.query.inStock,
    featured: req.query.featured,
    sort: req.query.sort,
    page: req.query.page,
    limit: req.query.limit,
  });

  return sendSuccess(res, {
    message: 'Products retrieved successfully',
    data: { products },
    meta,
  });
});

export const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const result = await getProductDetails(req.params.idOrSlug);
  return sendSuccess(res, {
    message: 'Product details retrieved successfully',
    data: result,
  });
});

export const createProductHandler = asyncHandler(async (req, res) => {
  const product = await addProduct(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Product created successfully',
    data: { product },
  });
});

export const updateProductHandler = asyncHandler(async (req, res) => {
  const product = await editProduct(req.params.id, req.body);
  return sendSuccess(res, {
    message: 'Product updated successfully',
    data: { product },
  });
});

export const deleteProductHandler = asyncHandler(async (req, res) => {
  const result = await removeProduct(req.params.id);
  const message =
    result.deletionType === 'soft'
      ? `Product "${result.productName}" has historical orders and was safely archived instead of permanently deleted.`
      : `Product "${result.productName}" permanently deleted.`;

  return sendSuccess(res, {
    message,
    data: result,
  });
});
