/**
 * Rate limiting middleware
 * Implements rate limiting and quota tracking for API requests
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { credentialStore } from '../utils/credentialStore';

// Create a rate limiter for free tier bots (100 requests per day)
export const freeTierRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the 100 requests per day allowed on the free tier',
  },
  // Custom handler to check bot-specific usage
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded your daily request quota',
      dailyLimit: 100,
      resetAt: req.bot?.usageToday ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
  },
});

// Premium tier has higher limits
export const premiumTierRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10000, // limit each IP to 10,000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the 10,000 requests per day allowed on the premium tier',
  },
});

/**
 * Custom middleware to track API usage and enforce tier-specific rate limits
 */
export const trackApiUsage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.bot) {
    return next();
  }
  
  // Check if bot has already exceeded their daily limit
  if (req.bot.tier === 'free' && req.bot.usageToday >= 100) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded your daily request quota of 100 requests',
      dailyLimit: 100,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  if (req.bot.tier === 'premium' && req.bot.usageToday >= 10000) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded your daily request quota of 10,000 requests',
      dailyLimit: 10000,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  // Track usage
  credentialStore.trackUsage(req.bot.id);
  
  next();
};

/**
 * Middleware to apply the appropriate rate limit based on bot tier
 */
export const applyRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (!req.bot) {
    return next();
  }
  
  if (req.bot.tier === 'premium') {
    return premiumTierRateLimit(req, res, next);
  }
  
  return freeTierRateLimit(req, res, next);
};
