import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Company from '../models/Company';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
router.get('/', [
  query('type').optional().isIn(['SUPPLIER', 'CUSTOMER', 'BOTH']).withMessage('Invalid company type'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      type,
      isActive,
      page = 1,
      limit = 10,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value
    const skip = (Number(page) - 1) * Number(limit);

    // Get companies with pagination
    const companies = await Company.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalCount = await Company.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        companies,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount,
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const company = await Company.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!company) {
      return next(new AppError('No company found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Manager/Admin)
router.post('/', restrictTo('ADMIN', 'MANAGER'), [
  body('name')
    .notEmpty()
    .withMessage('Company name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name cannot exceed 255 characters'),
  body('businessNumber')
    .optional()
    .trim()
    .matches(/^\d{3}-\d{2}-\d{5}$/)
    .withMessage('Business number format should be XXX-XX-XXXXX'),
  body('type')
    .notEmpty()
    .withMessage('Company type is required')
    .isIn(['SUPPLIER', 'CUSTOMER', 'BOTH'])
    .withMessage('Invalid company type'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid contact email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Check if company with same name already exists
    const existingCompany = await Company.findOne({ name: req.body.name });
    if (existingCompany) {
      return next(new AppError('Company with this name already exists', 400));
    }

    // Create company with createdBy field
    const companyData = {
      ...req.body,
      createdBy: req.user!._id
    };

    const newCompany = await Company.create(companyData);
    await newCompany.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        company: newCompany
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update company
// @route   PATCH /api/companies/:id
// @access  Private (Manager/Admin)
router.patch('/:id', restrictTo('ADMIN', 'MANAGER'), [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name cannot exceed 255 characters'),
  body('businessNumber')
    .optional()
    .trim()
    .matches(/^\d{3}-\d{2}-\d{5}$/)
    .withMessage('Business number format should be XXX-XX-XXXXX'),
  body('type')
    .optional()
    .isIn(['SUPPLIER', 'CUSTOMER', 'BOTH'])
    .withMessage('Invalid company type'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid contact email')
    .normalizeEmail(),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Check if company exists
    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(new AppError('No company found with that ID', 404));
    }

    // Check if trying to update name to existing name
    if (req.body.name && req.body.name !== company.name) {
      const existingCompany = await Company.findOne({ name: req.body.name });
      if (existingCompany) {
        return next(new AppError('Company with this name already exists', 400));
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        company: updatedCompany
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete company (soft delete)
// @route   DELETE /api/companies/:id
// @access  Private (Admin only)
router.delete('/:id', restrictTo('ADMIN'), async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return next(new AppError('No company found with that ID', 404));
    }

    // Soft delete by setting isActive to false
    await Company.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get companies by type (for dropdowns)
// @route   GET /api/companies/by-type/:type
// @access  Private
router.get('/by-type/:type', [
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { type } = req.params;
    const { isActive = 'true' } = req.query;

    if (!['SUPPLIER', 'CUSTOMER', 'BOTH'].includes(type)) {
      return next(new AppError('Invalid company type', 400));
    }

    const filter: any = {
      $or: [
        { type: type },
        { type: 'BOTH' }
      ]
    };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const companies = await Company.find(filter)
      .select('_id name type businessNumber')
      .sort('name');

    res.status(200).json({
      status: 'success',
      data: {
        companies
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;