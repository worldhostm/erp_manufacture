import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Company from '../models/Company';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get('/', [
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const {
      isActive,
      page = 1,
      limit = 10,
      search,
      sort = '-createdAt'
    } = req.query;

    const filter: any = {
      $or: [
        { type: 'SUPPLIER' },
        { type: 'BOTH' }
      ]
    };
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$and = [
        { $or: [{ type: 'SUPPLIER' }, { type: 'BOTH' }] },
        { $or: [
          { name: { $regex: search, $options: 'i' } },
          { businessNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]}
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const suppliers = await Company.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Company.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        suppliers,
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

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const supplier = await Company.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!supplier) {
      return next(new AppError('No supplier found with that ID', 404));
    }

    if (supplier.type !== 'SUPPLIER' && supplier.type !== 'BOTH') {
      return next(new AppError('This company is not a supplier', 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        supplier
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Manager/Admin)
router.post('/', restrictTo('ADMIN', 'MANAGER'), [
  body('name')
    .notEmpty()
    .withMessage('Supplier name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Supplier name cannot exceed 255 characters'),
  body('businessNumber')
    .optional()
    .trim()
    .matches(/^\d{3}-\d{2}-\d{5}$/)
    .withMessage('Business number format should be XXX-XX-XXXXX'),
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
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contact person name cannot exceed 100 characters'),
  body('contactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Contact phone cannot exceed 20 characters'),
  body('ceo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('CEO name cannot exceed 100 characters'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const existingCompany = await Company.findOne({ name: req.body.name });
    if (existingCompany) {
      return next(new AppError('Company with this name already exists', 400));
    }

    const supplierData = {
      ...req.body,
      type: 'SUPPLIER',
      createdBy: req.user!._id
    };

    const newSupplier = await Company.create(supplierData);
    await newSupplier.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        supplier: newSupplier
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update supplier
// @route   PATCH /api/suppliers/:id
// @access  Private (Manager/Admin)
router.patch('/:id', restrictTo('ADMIN', 'MANAGER'), [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Supplier name cannot be empty')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Supplier name cannot exceed 255 characters'),
  body('businessNumber')
    .optional()
    .trim()
    .matches(/^\d{3}-\d{2}-\d{5}$/)
    .withMessage('Business number format should be XXX-XX-XXXXX'),
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    const supplier = await Company.findById(req.params.id);
    if (!supplier) {
      return next(new AppError('No supplier found with that ID', 404));
    }

    if (supplier.type !== 'SUPPLIER' && supplier.type !== 'BOTH') {
      return next(new AppError('This company is not a supplier', 400));
    }

    if (req.body.name && req.body.name !== supplier.name) {
      const existingCompany = await Company.findOne({ name: req.body.name });
      if (existingCompany) {
        return next(new AppError('Company with this name already exists', 400));
      }
    }

    const updatedSupplier = await Company.findByIdAndUpdate(
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
        supplier: updatedSupplier
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete supplier (soft delete)
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
router.delete('/:id', restrictTo('ADMIN'), async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const supplier = await Company.findById(req.params.id);
    
    if (!supplier) {
      return next(new AppError('No supplier found with that ID', 404));
    }

    if (supplier.type !== 'SUPPLIER' && supplier.type !== 'BOTH') {
      return next(new AppError('This company is not a supplier', 400));
    }

    await Company.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

export default router;