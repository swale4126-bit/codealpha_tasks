import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import { signAccessToken } from '../utils/jwt.js';
import {
  createUserWithCart,
  findUserByEmailWithPassword,
  findUserById,
  findUserByIdWithPassword,
  updateUserPassword,
  updateUserProfile,
} from '../models/userModel.js';

export async function registerUser({ fullName, email, password, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmailWithPassword(normalizedEmail);

  if (existing) {
    throw new AppError(409, 'An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, env.security.bcryptSaltRounds);
  const user = await createUserWithCart({
    fullName,
    email: normalizedEmail,
    passwordHash,
    phone,
  });

  const token = signAccessToken(user);
  return { user, token };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const userWithPassword = await findUserByEmailWithPassword(normalizedEmail);

  if (!userWithPassword) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (!userWithPassword.isActive) {
    throw new AppError(403, 'Your account has been deactivated. Please contact support.');
  }

  const isPasswordValid = await bcrypt.compare(password, userWithPassword.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const publicUser = {
    id: userWithPassword.id,
    fullName: userWithPassword.fullName,
    email: userWithPassword.email,
    phone: userWithPassword.phone,
    role: userWithPassword.role,
    isActive: userWithPassword.isActive,
    createdAt: userWithPassword.createdAt,
    updatedAt: userWithPassword.updatedAt,
  };
  const token = signAccessToken(publicUser);
  return { user: publicUser, token };
}

export async function getUserProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }
  return user;
}

export async function editUserProfile(userId, { fullName, phone }) {
  if (fullName === undefined && phone === undefined) {
    throw new AppError(400, 'Please provide at least one field to update.');
  }

  const updated = await updateUserProfile(userId, { fullName, phone });
  if (!updated) {
    throw new AppError(404, 'User not found.');
  }
  return updated;
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const userWithPassword = await findUserByIdWithPassword(userId);
  if (!userWithPassword) {
    throw new AppError(404, 'User not found.');
  }

  const matchesCurrent = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
  if (!matchesCurrent) {
    throw new AppError(400, 'Current password is incorrect.');
  }

  if (currentPassword === newPassword) {
    throw new AppError(400, 'New password must be different from your current password.');
  }

  const newHash = await bcrypt.hash(newPassword, env.security.bcryptSaltRounds);
  await updateUserPassword(userId, newHash);
}
