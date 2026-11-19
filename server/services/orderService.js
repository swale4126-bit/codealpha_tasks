import AppError from '../utils/AppError.js';
import { findAddressByIdForUser } from '../models/addressModel.js';
import {
  cancelOrderForUser,
  createOrderFromCart,
  findOrderById,
  findOrdersByUserId,
} from '../models/orderModel.js';

export async function placeOrder(userId, { addressId, shippingAddress, paymentMethod, notes }) {
  let resolvedAddress = shippingAddress;

  if (addressId) {
    const saved = await findAddressByIdForUser(addressId, userId);
    if (!saved) {
      throw new AppError(404, 'Selected shipping address not found.');
    }
    resolvedAddress = {
      recipientName: saved.recipientName,
      phone: saved.phone,
      streetLine1: saved.streetLine1,
      streetLine2: saved.streetLine2 || null,
      city: saved.city,
      state: saved.state,
      postalCode: saved.postalCode,
      country: saved.country || 'United States',
    };
  }

  if (!resolvedAddress) {
    throw new AppError(400, 'A valid shipping address is required.');
  }

  return createOrderFromCart({
    userId,
    shippingAddress: resolvedAddress,
    paymentMethod,
    notes,
  });
}

export async function getCustomerOrders(userId, queryParams) {
  return findOrdersByUserId(userId, queryParams);
}

export async function getOrderDetails(orderId, user) {
  const isAdmin = user.role === 'admin';
  const order = await findOrderById(orderId, isAdmin ? null : user.id);
  if (!order) {
    throw new AppError(404, 'Order not found.');
  }
  return order;
}

export async function cancelOrder(orderId, userId) {
  return cancelOrderForUser(orderId, userId);
}
