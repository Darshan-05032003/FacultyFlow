import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import activityRoutes from './routes/activityRoutes';
import workloadRoutes from './routes/workloadAnalyticsRoutes';
import departmentRoutes from './routes/departmentAnalyticsRoutes';
import forecastRoutes from './routes/workloadForecastRoutes';
import priorityRoutes from './routes/taskPrioritizationRoutes';
import aiAssistantRoutes from './routes/aiAssistantRoutes';
import whatIfSimulatorRoutes from './routes/whatIfSimulatorRoutes';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Application = express();

// Security Middlewares
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parse Middlewares
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Basic Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/faculty/profile', profileRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/workload', workloadRoutes);
app.use('/api/v1/workload', forecastRoutes); // Mounts /api/v1/workload/forecast
app.use('/api/v1/workload', priorityRoutes); // Mounts /api/v1/workload/priorities
app.use('/api/v1/workload', whatIfSimulatorRoutes); // Mounts /api/v1/workload/simulate
app.use('/api/v1/ai', aiAssistantRoutes); // Mounts /api/v1/ai/assistant
app.use('/api/v1/departments', departmentRoutes);

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
