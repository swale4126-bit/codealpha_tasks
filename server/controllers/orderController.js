import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  cancelOrder,
  getCustomerOrders,
  getOrderDetails,
  placeOrder,
} from '../services/orderService.js';

export const checkout = asyncHandler(async (req, res) => {
  const order = await placeOrder(req.user.id, req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Order placed successfully',
    data: { order },
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await getCustomerOrders(req.user.id, {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
  });

  return sendSuccess(res, {
    message: 'Orders retrieved successfully',
    data: { orders },
    meta,
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderDetails(req.params.id, req.user);
  return sendSuccess(res, {
    message: 'Order details retrieved',
    data: { order },
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await cancelOrder(req.params.id, req.user.id);
  return sendSuccess(res, {
    message: 'Order cancelled successfully and inventory restored',
    data: { order },
  });
});
