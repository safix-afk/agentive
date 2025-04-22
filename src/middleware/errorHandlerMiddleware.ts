import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metricsService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Define error types
export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;
  
  constructor(message: string, statusCode: number, errorCode: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Extend Express Request type to include request ID
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: [number, number];
    }
  }
}

/**
 * Middleware to add request ID and start time
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.id = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Record start time for request duration tracking
  req.startTime = process.hrtime();
  
  // Log request
  logger.info({
    message: 'Request received',
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Add response listener to log completion
  res.on('finish', () => {
    // Calculate request duration
    const duration = process.hrtime(req.startTime);
    const durationMs = (duration[0] * 1000) + (duration[1] / 1000000);
    
    // Log response
    logger.info({
      message: 'Request completed',
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs
    });
  });
  
  next();
};

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError('Resource not found', 404, 'NOT_FOUND');
  next(error);
};

/**
 * Middleware to handle all errors
 */
export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  // Get metrics service
  const metricsService = MetricsService.getInstance();
  
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = undefined;
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  } 
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  } 
  // Handle TypeORM errors
  else if (err.name === 'QueryFailedError') {
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'A database error occurred';
  }
  
  // Log error with appropriate level
  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod]({
    message: 'Request error',
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    errorCode,
    errorMessage: message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    details
  });
  
  // Track error in metrics
  const route = req.route ? 
    req.baseUrl + req.route.path.replace(/\/:(\w+)/g, '/:param') : 
    req.path;
  
  metricsService.incrementApiErrorCounter(
    route,
    errorCode,
    req.bot?.tier || 'unknown'
  );
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      requestId: req.id,
      ...(details && process.env.NODE_ENV !== 'production' ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
    }
  });
};
