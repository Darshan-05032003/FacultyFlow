import { Router } from 'express';
import { 
  createActivity, 
  getMyActivities, 
  getActivityById, 
  updateActivity, 
  archiveActivity, 
  updateActivityStatus,
  getWorkloadSummary
} from '../controllers/activityController';
import { authenticateRequest } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { 
  createActivitySchema, 
  updateActivitySchema, 
  updateActivityStatusSchema 
} from '../validators/activityValidators';

const router = Router();

router.use(authenticateRequest);

router.post('/', validate(createActivitySchema), createActivity);
router.get('/', getMyActivities);
router.get('/summary', getWorkloadSummary); // Must be before /:id
router.get('/:id', getActivityById);
router.patch('/:id', validate(updateActivitySchema), updateActivity);
router.delete('/:id', archiveActivity);
router.patch('/:id/status', validate(updateActivityStatusSchema), updateActivityStatus);

export default router;
