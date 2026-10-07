import { Router } from 'express';
import { getDepartmentAnalytics } from '../controllers/departmentAnalyticsController';
import { authenticateRequest, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

// Only HOD or ADMIN can access department analytics
router.get('/analytics', requireRole('HOD', 'ADMIN'), getDepartmentAnalytics);

export default router;
