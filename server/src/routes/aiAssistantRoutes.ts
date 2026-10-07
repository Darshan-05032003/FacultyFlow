import { Router } from 'express';
import { getAssistantResponse } from '../controllers/aiAssistantController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateRequest);

router.post('/assistant', getAssistantResponse);

export default router;
