import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  addItemToUserCart,
  changeCartItemQuantity,
  deleteCartItem,
  emptyUserCart,
  getUserCart,
  mergeGuestCart,
} from '../services/cartService.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getUserCart(req.user.id);
  return sendSuccess(res, { message: 'Cart retrieved successfully', data: { cart } });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const cart = await addItemToUserCart(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Item added to cart', data: { cart } });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await changeCartItemQuantity(req.user.id, req.params.itemId, req.body.quantity);
  return sendSuccess(res, { message: 'Cart quantity updated', data: { cart } });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await deleteCartItem(req.user.id, req.params.itemId);
  return sendSuccess(res, { message: 'Item removed from cart', data: { cart } });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await emptyUserCart(req.user.id);
  return sendSuccess(res, { message: 'Cart cleared', data: { cart } });
});

export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await mergeGuestCart(req.user.id, req.body.items);
  return sendSuccess(res, { message: 'Guest cart merged successfully', data: { cart } });
});
