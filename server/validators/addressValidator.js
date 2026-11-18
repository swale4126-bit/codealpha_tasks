import { body, param } from 'express-validator';

export const addressIdParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Address ID must be a positive integer').toInt(),
];

export const addressBodyValidation = [
  body('label')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Label must be 50 characters or fewer'),
  body('recipientName')
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Recipient name must be between 2 and 120 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 5, max: 30 })
    .withMessage('Phone number must be between 5 and 30 characters'),
  body('streetLine1')
    .trim()
    .notEmpty()
    .withMessage('Street address line 1 is required')
    .isLength({ max: 255 })
    .withMessage('Street address line 1 is too long'),
  body('streetLine2')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Street address line 2 is too long'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City is too long'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State / Province is required')
    .isLength({ max: 100 })
    .withMessage('State / Province is too long'),
  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .isLength({ max: 30 })
    .withMessage('Postal code is too long'),
  body('country')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country is too long'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];
