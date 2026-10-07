import { Router } from 'express';
import { getForecast } from '../controllers/workloadForecastController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

router.get('/forecast', getForecast);

export default router;
