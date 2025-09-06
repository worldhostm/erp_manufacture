import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const signToken = (id: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'default-test-secret';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign({ id: id }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  } as SignOptions);
};

// Create and send token
const createSendToken = (user: any, statusCode: number, res: express.Response) => {
  const token = signToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (usually restricted to admin in production)
router.post('/register', [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'USER'])
    .withMessage('Invalid role'),
], async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { name, email, password, role, department, position, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'USER',
      department,
      position,
      phone
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, password } = req.body;

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update current user
// @route   PATCH /api/auth/me
// @access  Private
router.patch('/me', protect, [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody: any = {};
    const allowedFields = ['name', 'department', 'position', 'phone'];
    
    Object.keys(req.body).forEach(el => {
      if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
    });

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user!._id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
router.patch('/change-password', protect, [
  body('passwordCurrent')
    .notEmpty()
    .withMessage('Current password is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Get user from collection
    const user = await User.findById(req.user!._id).select('+password');
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if current password is correct
    if (!user.password || !(await bcrypt.compare(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Your current password is wrong', 401));
    }

    // Update password
    user.password = await bcrypt.hash(req.body.password, 12);
    await user.save();

    // Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
});

export default router;