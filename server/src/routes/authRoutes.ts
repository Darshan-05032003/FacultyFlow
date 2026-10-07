import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { authenticateRequest } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authValidators';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticateRequest, getMe);

export default router;
