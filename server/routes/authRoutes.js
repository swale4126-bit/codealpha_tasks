import { Router } from 'express';
import {
  getMe,
  login,
  register,
  updatePassword,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  changePasswordValidation,
  loginValidation,
  registerValidation,
  updateProfileValidation,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', authRateLimiter, registerValidation, validateRequest, register);
router.post('/login', authRateLimiter, loginValidation, validateRequest, login);

router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfileValidation, validateRequest, updateProfile);
router.patch('/password', authenticate, changePasswordValidation, validateRequest, updatePassword);

export default router;
