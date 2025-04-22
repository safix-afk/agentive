/**
 * Agent API Platform Server
 * Main entry point for the application
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import { swaggerSpec } from './utils/swagger';
import dotenv from 'dotenv';
import { AppDataSource, initializeDataSource } from './config/data-source';
import { logger, stream } from './utils/logger';
import { MetricsService } from './services/metricsService';

// Import middleware
import { 
  securityHeaders, 
  corsOptions, 
  globalRateLimiter 
} from './middleware/securityMiddleware';
import { 
  requestContextMiddleware, 
  notFoundHandler, 
  errorHandler 
} from './middleware/errorHandlerMiddleware';

// Import routes
import v1Routes from './routes/v1';
import v1SandboxRoutes from './routes/v1/sandboxRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(requestContextMiddleware);
app.use(morgan('combined', { stream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(securityHeaders);
app.use(globalRateLimiter);

// API routes with versioning
app.use('/v1', v1Routes);

// Sandbox routes (no auth required)
app.use('/sandbox/v1', v1SandboxRoutes);

// Legacy routes (for backward compatibility)
app.use('/sandbox', v1SandboxRoutes);

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    version: '1.0.0',
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint with API info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Agent API Platform',
    description: 'API platform for AI agents - "Stripe for bots"',
    version: '1.0.0',
    documentation: '/docs',
    apiV1: '/v1',
    sandbox: '/sandbox/v1',
    health: '/health',
    metrics: '/v1/metrics'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDataSource();
    logger.info('Database connection established');
    
    // Initialize metrics service
    const metricsService = MetricsService.getInstance();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/docs`);
      logger.info(`API V1 available at http://localhost:${PORT}/v1`);
      logger.info(`Sandbox environment available at http://localhost:${PORT}/sandbox/v1`);
      logger.info(`Metrics available at http://localhost:${PORT}/v1/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
