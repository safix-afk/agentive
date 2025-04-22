/**
 * Authentication middleware
 * Handles API key validation and OAuth2 authentication
 */

import { Request, Response, NextFunction } from 'express';
import { credentialStore } from '../utils/credentialStore';

// Extend Express Request type to include bot property
declare global {
  namespace Express {
    interface Request {
      bot?: {
        id: string;
        name: string;
        tier: 'free' | 'premium';
        creditsRemaining: number;
        usageToday: number;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using API key
 * Looks for API key in X-API-Key header
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'Missing API key' 
    });
  }
  
  const bot = credentialStore.validateApiKey(apiKey);
  
  if (!bot) {
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: 'Invalid API key' 
    });
  }
  
  // Attach bot info to request for use in route handlers
  req.bot = {
    id: bot.id,
    name: bot.name,
    tier: bot.tier,
    creditsRemaining: bot.creditsRemaining,
    usageToday: bot.usageToday,
  };
  
  next();
};

/**
 * Middleware to check if bot has sufficient credits
 */
export const checkCredits = (req: Request, res: Response, next: NextFunction) => {
  if (!req.bot) {
    return res.status(401).json({ 
      error: 'Authentication required', 
      message: 'Bot information not available' 
    });
  }
  
  if (req.bot.creditsRemaining <= 0) {
    return res.status(403).json({ 
      error: 'Insufficient credits', 
      message: 'Please purchase more credits to continue using the API' 
    });
  }
  
  next();
};
