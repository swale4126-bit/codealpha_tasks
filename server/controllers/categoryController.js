import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  addCategory,
  editCategory,
  getCategoryBySlug,
  listCategories,
  removeCategory,
} from '../services/categoryService.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  return sendSuccess(res, {
    message: 'Categories retrieved successfully',
    data: { categories },
  });
});

export const getCategory = asyncHandler(async (req, res) => {
  const category = await getCategoryBySlug(req.params.slug);
  return sendSuccess(res, {
    message: 'Category retrieved successfully',
    data: { category },
  });
});

export const createCategoryHandler = asyncHandler(async (req, res) => {
  const category = await addCategory(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: { category },
  });
});

export const updateCategoryHandler = asyncHandler(async (req, res) => {
  const category = await editCategory(req.params.id, req.body);
  return sendSuccess(res, {
    message: 'Category updated successfully',
    data: { category },
  });
});

export const deleteCategoryHandler = asyncHandler(async (req, res) => {
  await removeCategory(req.params.id);
  return sendSuccess(res, {
    message: 'Category deleted successfully',
    data: null,
  });
});
