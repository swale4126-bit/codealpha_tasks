import AppError from '../utils/AppError.js';
import slugify from '../utils/slugify.js';
import {
  countProductsInCategory,
  createCategory,
  deleteCategoryById,
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
  updateCategory,
} from '../models/categoryModel.js';

export async function listCategories() {
  return findAllCategories();
}

export async function getCategoryBySlug(slug) {
  const category = await findCategoryBySlug(slug);
  if (!category) {
    throw new AppError(404, 'Category not found.');
  }
  return category;
}

export async function addCategory({ name, description, imageUrl }) {
  const slug = slugify(name);
  if (!slug) {
    throw new AppError(400, 'Category name must contain alphanumeric characters.');
  }
  return createCategory({ name, slug, description, imageUrl });
}

export async function editCategory(id, { name, description, imageUrl }) {
  const existing = await findCategoryById(id);
  if (!existing) {
    throw new AppError(404, 'Category not found.');
  }

  const nextSlug = name !== undefined ? slugify(name) : undefined;
  return updateCategory(id, { name, slug: nextSlug, description, imageUrl });
}

export async function removeCategory(id) {
  const existing = await findCategoryById(id);
  if (!existing) {
    throw new AppError(404, 'Category not found.');
  }

  const productCount = await countProductsInCategory(id);
  if (productCount > 0) {
    throw new AppError(
      409,
      `Cannot delete category "${existing.name}" because ${productCount} product(s) still reference it. Reassign those products first.`
    );
  }

  await deleteCategoryById(id);
}
