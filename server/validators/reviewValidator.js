import { body, param } from 'express-validator';

export const reviewProductIdParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer').toInt(),
];

export const reviewIdParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Review ID must be a positive integer').toInt(),
];

export const createReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Review title must be 150 characters or fewer'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Review comment must be between 5 and 2000 characters'),
];
