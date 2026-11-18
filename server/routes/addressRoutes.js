import { Router } from 'express';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '../controllers/addressController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import { addressBodyValidation, addressIdParamValidation } from '../validators/addressValidator.js';

const router = Router();

// All address routes require an authenticated user
router.use(authenticate);

router.get('/', getAddresses);
router.post('/', addressBodyValidation, validateRequest, createAddress);
router.put(
  '/:id',
  addressIdParamValidation,
  addressBodyValidation,
  validateRequest,
  updateAddress
);
router.patch('/:id/default', addressIdParamValidation, validateRequest, setDefaultAddress);
router.delete('/:id', addressIdParamValidation, validateRequest, deleteAddress);

export default router;
