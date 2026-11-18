import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  addMyAddress,
  editMyAddress,
  listMyAddresses,
  makeDefaultAddress,
  removeMyAddress,
} from '../services/addressService.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await listMyAddresses(req.user.id);
  return sendSuccess(res, {
    message: 'Shipping addresses retrieved',
    data: { addresses },
  });
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addMyAddress(req.user.id, req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Shipping address saved',
    data: { address },
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await editMyAddress(req.params.id, req.user.id, req.body);
  return sendSuccess(res, {
    message: 'Shipping address updated',
    data: { address },
  });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await makeDefaultAddress(req.params.id, req.user.id);
  return sendSuccess(res, {
    message: 'Default shipping address updated',
    data: { address },
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await removeMyAddress(req.params.id, req.user.id);
  return sendSuccess(res, {
    message: 'Shipping address deleted',
    data: null,
  });
});
