import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_LIMIT = 100; // limit each IP to 100 requests per windowMs

/**
 * Basic in-memory rate limiting middleware.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let requestLogs = cache.get(ip) || [];
  // Clean logs older than 1 minute
  requestLogs = requestLogs.filter(timestamp => now - timestamp < WINDOW_MS);

  if (requestLogs.length >= MAX_LIMIT) {
    return res.status(429).json({
      status: 'error',
      statusCode: 429,
      error: 'Too many requests from this client. Please try again after a minute.',
    });
  }

  requestLogs.push(now);
  cache.set(ip, requestLogs);
  next();
};
