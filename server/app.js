import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import { checkDbConnection } from './config/db.js';
import asyncHandler from './utils/asyncHandler.js';
import { sendSuccess } from './utils/response.js';
import errorHandler from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Security & HTTP middleware
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test' && !process.env.NODE_TEST_CONTEXT) {
  app.use(morgan('dev'));
}

app.use('/api', apiRateLimiter);

// Health check verifying both Express API and live PostgreSQL connectivity
app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    const dbStatus = await checkDbConnection();
    return sendSuccess(res, {
      message: 'KoraMarket API is running',
      data: {
        service: 'koramarket-api',
        environment: env.nodeEnv,
        database: dbStatus.database,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

// Resource routes
app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler (must be registered last)
app.use(errorHandler);

export default app;
