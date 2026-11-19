import { body, param, query as queryValidator } from 'express-validator';

export const orderIdParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer').toInt(),
];

export const listOrdersQueryValidation = [
  queryValidator('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),
  queryValidator('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50')
    .toInt(),
  queryValidator('status')
    .optional({ values: 'falsy' })
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status filter'),
];

export const createOrderValidation = [
  body('paymentMethod')
    .isIn(['cash_on_delivery', 'simulated_card'])
    .withMessage('paymentMethod must be either "cash_on_delivery" or "simulated_card"'),
  body('addressId')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('addressId must be a positive integer')
    .toInt(),
  body('shippingAddress')
    .if(body('addressId').not().exists())
    .isObject()
    .withMessage('shippingAddress object is required when addressId is not provided'),
  body('shippingAddress.recipientName')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Recipient name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Recipient name must be between 2 and 120 characters'),
  body('shippingAddress.phone')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 5, max: 30 })
    .withMessage('Phone number must be between 5 and 30 characters'),
  body('shippingAddress.streetLine1')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Street address line 1 is required'),
  body('shippingAddress.city')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('State / Province is required'),
  body('shippingAddress.postalCode')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be 500 characters or fewer'),
];
