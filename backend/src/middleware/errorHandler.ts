import { Request, Response, NextFunction } from 'express';

/**
 * Global centralized error handling middleware.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error details:', err);
  
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Server encountered an unexpected error';
  
  res.status(status).json({
    status: 'error',
    statusCode: status,
    error: message,
  });
};
