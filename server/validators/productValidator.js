import { body, param, query as queryValidator } from 'express-validator';

export const productIdParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer').toInt(),
];

export const listProductsQueryValidation = [
  queryValidator('minPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a non-negative number'),
  queryValidator('maxPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a non-negative number'),
  queryValidator('minRating')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 5 })
    .withMessage('minRating must be between 0 and 5'),
  queryValidator('sort')
    .optional({ values: 'falsy' })
    .isIn(['newest', 'price_asc', 'price_desc', 'rating_desc'])
    .withMessage('Invalid sort value'),
  queryValidator('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  queryValidator('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
];

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 180 })
    .withMessage('Product name must be between 2 and 180 characters'),
  body('categoryId')
    .isInt({ min: 1 })
    .withMessage('Valid categoryId is required')
    .toInt(),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 2, max: 64 })
    .withMessage('SKU must be between 2 and 64 characters'),
  body('shortDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Short description must be 300 characters or fewer'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater').toFloat(),
  body('compareAtPrice')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('compareAtPrice must be 0 or greater')
    .toFloat()
    .custom((val, { req }) => {
      if (val !== null && val !== undefined && val < Number(req.body.price)) {
        throw new Error('compareAtPrice must be greater than or equal to price');
      }
      return true;
    }),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer')
    .toInt(),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('images').optional().isArray().withMessage('images must be an array'),
  body('images.*.imageUrl')
    .if(body('images').exists())
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Each product image must have a valid http/https imageUrl'),
  body('images.*.altText').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
  body('images.*.isPrimary').optional().isBoolean(),
];

export const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 180 })
    .withMessage('Product name must be between 2 and 180 characters'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('categoryId must be a positive integer')
    .toInt(),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('SKU must be between 2 and 64 characters'),
  body('shortDescription')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 300 }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or greater').toFloat(),
  body('compareAtPrice')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('compareAtPrice must be 0 or greater')
    .toFloat(),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer')
    .toInt(),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .toInt(),
  body('isFeatured').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
  body('images').optional().isArray(),
  body('images.*.imageUrl')
    .if(body('images').exists())
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Each product image must have a valid http/https imageUrl'),
];
