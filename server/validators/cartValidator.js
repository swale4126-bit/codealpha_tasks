import { body, param } from 'express-validator';

export const cartItemIdParamValidation = [
  param('itemId').isInt({ min: 1 }).withMessage('Cart item ID must be a positive integer').toInt(),
];

export const addCartItemValidation = [
  body('productId').isInt({ min: 1 }).withMessage('Valid productId is required').toInt(),
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be an integer between 1 and 99')
    .toInt(),
];

export const updateCartItemValidation = [
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be an integer between 1 and 99')
    .toInt(),
];

export const mergeCartValidation = [
  body('items').isArray().withMessage('items must be an array'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Valid productId required').toInt(),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Valid quantity required').toInt(),
];
