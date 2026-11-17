import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';

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

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check route (extended in Phase 4 to also report live PostgreSQL status)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'KoraMarket API is running',
    data: {
      service: 'koramarket-api',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
});

export default app;
