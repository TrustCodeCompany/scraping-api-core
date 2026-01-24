import { Request, Response, NextFunction } from 'express';
import {logger} from "@utils/logger";


export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    errors: {
      message: err.message || 'Internal Server Error',
      timeStamp: new Date().toISOString()
    }
  });
};
