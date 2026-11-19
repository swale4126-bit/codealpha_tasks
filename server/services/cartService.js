import AppError from '../utils/AppError.js';
import { findProductByIdOrSlug } from '../models/productModel.js';
import {
  clearCartForUser,
  findCartItemByIdForUser,
  findCartItemByProductForUser,
  getCartByUserId,
  mergeItemsIntoUserCart,
  removeCartItemForUser,
  updateCartItemQuantityForUser,
  upsertCartItemForUser,
} from '../models/cartModel.js';

export async function getUserCart(userId) {
  return getCartByUserId(userId);
}

export async function addItemToUserCart(userId, { productId, quantity }) {
  const product = await findProductByIdOrSlug(productId, { includeInactive: false });
  if (!product) {
    throw new AppError(404, 'Product not found or no longer available.');
  }

  if (product.stockQuantity <= 0) {
    throw new AppError(400, `"${product.name}" is currently out of stock.`);
  }

  const existingItem = await findCartItemByProductForUser(productId, userId);
  const nextQuantity = (existingItem?.quantity || 0) + quantity;

  if (nextQuantity > product.stockQuantity) {
    throw new AppError(
      400,
      `Only ${product.stockQuantity} unit(s) of "${product.name}" available in stock.`
    );
  }

  return upsertCartItemForUser(userId, productId, nextQuantity);
}

export async function changeCartItemQuantity(userId, itemId, quantity) {
  const item = await findCartItemByIdForUser(itemId, userId);
  if (!item) {
    throw new AppError(404, 'Cart item not found.');
  }

  if (!item.is_active || item.deleted_at !== null) {
    throw new AppError(400, `"${item.name}" is no longer available.`);
  }

  if (quantity > item.stock_quantity) {
    throw new AppError(
      400,
      `Only ${item.stock_quantity} unit(s) of "${item.name}" available in stock.`
    );
  }

  return updateCartItemQuantityForUser(itemId, userId, quantity);
}

export async function deleteCartItem(userId, itemId) {
  const updatedCart = await removeCartItemForUser(itemId, userId);
  if (!updatedCart) {
    throw new AppError(404, 'Cart item not found.');
  }
  return updatedCart;
}

export async function emptyUserCart(userId) {
  return clearCartForUser(userId);
}

export async function mergeGuestCart(userId, items) {
  if (!items || items.length === 0) {
    return getCartByUserId(userId);
  }
  return mergeItemsIntoUserCart(userId, items);
}
