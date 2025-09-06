import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import User from '../models/User';

interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Getting token and check if it's there
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const jwtSecret = process.env.JWT_SECRET || 'default-test-secret';

    const decoded = jwt.verify(token, jwtSecret) as { id: string; iat: number };

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+password');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    return next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'default-test-secret';
      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret) as { id: string };
          const currentUser = await User.findById(decoded.id);
          
          if (currentUser && currentUser.isActive) {
            req.user = currentUser;
          }
        } catch (error) {
          // Token is invalid, but that's OK for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};