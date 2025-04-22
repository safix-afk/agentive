import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createHmac } from 'crypto';
import helmet from 'helmet';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { ApiError } from './errorHandlerMiddleware';
import { AppDataSource } from '../config/data-source';
import { BotCredential } from '../entities/BotCredential';
import { CreditBalance } from '../entities/CreditBalance';
import { logger } from '../utils/logger';

// Initialize Redis client if Redis URL is provided
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

/**
 * Apply Helmet security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*.stripe.com"],
      connectSrc: ["'self'", "api.stripe.com"],
      frameSrc: ["'self'", "js.stripe.com", "hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding in iframes
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow popups
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Configure CORS options
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check against whitelist
    const whitelist = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];
    if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Global rate limiter to prevent abuse
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  // Use Redis as store if available
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient!.call(...args),
    prefix: 'rl:global:',
  }) : undefined,
});

/**
 * API key authentication middleware with database lookup
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new ApiError('API key is required', 401, 'MISSING_API_KEY');
    }
    
    // Get bot repository
    const botRepository = AppDataSource.getRepository(BotCredential);
    const creditBalanceRepository = AppDataSource.getRepository(CreditBalance);
    
    // Find bot by API key
    const bot = await botRepository.findOne({
      where: { apiKey, isActive: true },
      relations: ['creditBalance'],
    });
    
    if (!bot) {
      throw new ApiError('Invalid API key', 401, 'INVALID_API_KEY');
    }
    
    // Check if credit balance needs to be reset
    if (bot.creditBalance && new Date() > bot.creditBalance.resetDate) {
      bot.creditBalance.usageToday = 0;
      bot.creditBalance.resetDate = getNextResetDate();
      await creditBalanceRepository.save(bot.creditBalance);
    }
    
    // Update last login timestamp
    bot.lastLoginAt = new Date();
    await botRepository.save(bot);
    
    // Attach bot info to request
    req.bot = {
      id: bot.id,
      name: bot.name,
      tier: bot.tier,
      creditsRemaining: bot.creditBalance?.creditsRemaining || 0,
      usageToday: bot.creditBalance?.usageToday || 0,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if bot has sufficient credits
 */
export const checkCredits = (req: Request, res: Response, next: NextFunction) => {
  if (!req.bot) {
    return next(new ApiError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }
  
  if (req.bot.creditsRemaining <= 0) {
    return next(new ApiError('Insufficient credits', 403, 'INSUFFICIENT_CREDITS', {
      creditsRemaining: 0,
      message: 'Please purchase more credits to continue using the API',
    }));
  }
  
  next();
};

/**
 * Tier-specific rate limiter
 */
export const tierRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.bot) {
    return next(new ApiError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }
  
  try {
    // Get credit balance repository
    const creditBalanceRepository = AppDataSource.getRepository(CreditBalance);
    
    // Get bot's credit balance
    const creditBalance = await creditBalanceRepository.findOne({
      where: { botId: req.bot.id },
    });
    
    if (!creditBalance) {
      return next(new ApiError('Credit balance not found', 500, 'CREDIT_BALANCE_NOT_FOUND'));
    }
    
    // Check if bot has exceeded daily limit
    if (creditBalance.usageToday >= creditBalance.dailyLimit) {
      return next(new ApiError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', {
        usageToday: creditBalance.usageToday,
        dailyLimit: creditBalance.dailyLimit,
        resetAt: creditBalance.resetDate.toISOString(),
      }));
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', creditBalance.dailyLimit.toString());
    res.setHeader('X-RateLimit-Remaining', (creditBalance.dailyLimit - creditBalance.usageToday).toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(creditBalance.resetDate.getTime() / 1000).toString());
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify HMAC signature for webhook payloads
 */
export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.header('X-Bot-API-Signature');
    const payload = req.body;
    
    if (!signature) {
      throw new ApiError('Signature is required', 401, 'MISSING_SIGNATURE');
    }
    
    // Extract timestamp and signature parts
    const [timestampPart, signaturePart] = signature.split(',');
    if (!timestampPart || !signaturePart) {
      throw new ApiError('Invalid signature format', 401, 'INVALID_SIGNATURE_FORMAT');
    }
    
    const timestamp = timestampPart.replace('t=', '');
    const providedSignature = signaturePart.replace('v1=', '');
    
    // Get secret from request (in a real app, you'd look this up from the database)
    const secret = req.header('X-Bot-API-Secret') || process.env.WEBHOOK_SECRET || '';
    
    // Recreate the signed payload string
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    
    // Generate expected signature
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    // Compare signatures
    if (providedSignature !== expectedSignature) {
      throw new ApiError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Get the next usage reset date (midnight tomorrow)
 */
function getNextResetDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
