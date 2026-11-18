import AppError from '../utils/AppError.js';
import {
  createAddressForUser,
  deleteAddressForUser,
  findAddressesByUserId,
  setDefaultAddressForUser,
  updateAddressForUser,
} from '../models/addressModel.js';

export async function listMyAddresses(userId) {
  return findAddressesByUserId(userId);
}

export async function addMyAddress(userId, payload) {
  return createAddressForUser(userId, payload);
}

export async function editMyAddress(addressId, userId, payload) {
  const updated = await updateAddressForUser(addressId, userId, payload);
  if (!updated) {
    throw new AppError(404, 'Shipping address not found.');
  }
  return updated;
}

export async function makeDefaultAddress(addressId, userId) {
  const updated = await setDefaultAddressForUser(addressId, userId);
  if (!updated) {
    throw new AppError(404, 'Shipping address not found.');
  }
  return updated;
}

export async function removeMyAddress(addressId, userId) {
  const deleted = await deleteAddressForUser(addressId, userId);
  if (!deleted) {
    throw new AppError(404, 'Shipping address not found.');
  }
}
