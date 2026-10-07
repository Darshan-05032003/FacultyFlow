import { Router } from 'express';
import { simulateWorkload } from '../controllers/whatIfSimulatorController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

router.post('/simulate', simulateWorkload);

export default router;
