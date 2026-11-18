import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import {
  changeUserPassword,
  editUserProfile,
  getUserProfile,
  loginUser,
  registerUser,
} from '../services/authService.js';

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;
  const result = await registerUser({ fullName, email, password, phone });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Signed in successfully',
    data: result,
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.id);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'User profile retrieved',
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const user = await editUserProfile(req.user.id, { fullName, phone });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await changeUserPassword(req.user.id, { currentPassword, newPassword });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Password updated successfully',
    data: null,
  });
});
