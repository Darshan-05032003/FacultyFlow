import { Router } from 'express';
import { getWorkloadAnalytics } from '../controllers/workloadAnalyticsController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

router.get('/analytics', getWorkloadAnalytics);

export default router;
