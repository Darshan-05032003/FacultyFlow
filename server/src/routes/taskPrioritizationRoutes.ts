import { Router } from 'express';
import { getPriorities, getTopPriorities } from '../controllers/taskPrioritizationController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

router.get('/priorities', getPriorities);
router.get('/priorities/top', getTopPriorities);

export default router;
