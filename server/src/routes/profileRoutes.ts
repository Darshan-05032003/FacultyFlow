import { Router } from 'express';
import { getMyProfile, updateMyProfile, getMyDepartment } from '../controllers/profileController';
import { authenticateRequest } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validators/profileValidators';

const router = Router();

router.use(authenticateRequest);

router.get('/', getMyProfile);
router.patch('/', validate(updateProfileSchema), updateMyProfile);
router.get('/department', getMyDepartment);

export default router;
