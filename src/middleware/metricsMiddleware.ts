import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../services/metricsService';

/**
 * Middleware to collect metrics for HTTP requests
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Record start time
  const startTime = process.hrtime();
  
  // Get metrics service
  const metricsService = MetricsService.getInstance();
  
  // Add response listener to capture metrics after request is completed
  res.on('finish', () => {
    // Calculate request duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationInSeconds = seconds + nanoseconds / 1e9;
    
    // Get route path (normalize dynamic routes)
    const route = req.route ? 
      req.baseUrl + req.route.path.replace(/\/:(\w+)/g, '/:param') : 
      req.path;
    
    // Get bot tier if available
    const botTier = req.bot?.tier || 'unknown';
    
    // Increment request counter
    metricsService.incrementHttpRequestCounter(
      req.method,
      route,
      res.statusCode,
      botTier
    );
    
    // Record request duration
    metricsService.observeHttpRequestDuration(
      req.method,
      route,
      res.statusCode,
      durationInSeconds
    );
    
    // Track errors (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      metricsService.incrementApiErrorCounter(route, errorType, botTier);
    }
  });
  
  next();
};
