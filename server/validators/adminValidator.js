import { body, param, query } from 'express-validator';
import validateRequest from '../middleware/validateRequest.js';

export const updateOrderStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage(
      'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'
    ),
  validateRequest,
];

export const updateInventoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be an integer 0 or greater'),
  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be an integer 0 or greater'),
  validateRequest,
];

export const updateCustomerStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean (true or false)'),
  validateRequest,
];

export const salesSummaryValidator = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days parameter must be between 1 and 365'),
  validateRequest,
];
