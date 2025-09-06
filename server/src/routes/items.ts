import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Item from '../models/Item';
import Company from '../models/Company';
import { AppError } from '../middleware/errorHandler';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all items
// @route   GET /api/items
// @access  Private
router.get('/', [
  query('category').optional().isIn(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE']).withMessage('Invalid category'),
  query('supplierId').optional().isMongoId().withMessage('Invalid supplier ID'),
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
      category,
      supplierId,
      isActive,
      page = 1,
      limit = 10,
      search,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (category) filter.category = category;
    if (supplierId) filter.supplierId = supplierId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { specification: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value
    const skip = (Number(page) - 1) * Number(limit);

    // Get items with pagination and populate supplier
    const items = await Item.find(filter)
      .populate('supplierId', 'name type businessNumber')
      .populate('createdBy', 'name email')
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalCount = await Item.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        items,
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

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('supplierId', 'name type businessNumber email phone contactPerson')
      .populate('createdBy', 'name email');
    
    if (!item) {
      return next(new AppError('No item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        item
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new item
// @route   POST /api/items
// @access  Private (Manager/Admin)
router.post('/', restrictTo('ADMIN', 'MANAGER'), [
  body('code')
    .notEmpty()
    .withMessage('Item code is required')
    .trim()
    .toUpperCase()
    .isLength({ max: 50 })
    .withMessage('Item code cannot exceed 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Item name is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Item name cannot exceed 255 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE'])
    .withMessage('Invalid category'),
  body('supplierId')
    .optional()
    .isMongoId()
    .withMessage('Invalid supplier ID'),
  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Price cannot be negative');
      }
      return true;
    }),
  body('cost')
    .isNumeric()
    .withMessage('Cost must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Cost cannot be negative');
      }
      return true;
    }),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('maxStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock must be a non-negative integer'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }

    // Check if item with same code already exists
    const existingItem = await Item.findOne({ code: req.body.code });
    if (existingItem) {
      return next(new AppError('Item with this code already exists', 400));
    }

    // Validate supplier if provided
    if (req.body.supplierId) {
      const supplier = await Company.findById(req.body.supplierId);
      if (!supplier) {
        return next(new AppError('Supplier not found', 404));
      }
      if (!['SUPPLIER', 'BOTH'].includes(supplier.type)) {
        return next(new AppError('Selected company is not a supplier', 400));
      }
    }

    // Validate max stock vs min stock
    if (req.body.maxStock && req.body.minStock && req.body.maxStock < req.body.minStock) {
      return next(new AppError('Maximum stock must be greater than or equal to minimum stock', 400));
    }

    // Create item with createdBy field
    const itemData = {
      ...req.body,
      createdBy: req.user!._id
    };

    const newItem = await Item.create(itemData);
    await newItem.populate('supplierId', 'name type businessNumber');
    await newItem.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        item: newItem
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update item
// @route   PATCH /api/items/:id
// @access  Private (Manager/Admin)
router.patch('/:id', restrictTo('ADMIN', 'MANAGER'), [
  body('code')
    .optional()
    .notEmpty()
    .withMessage('Item code cannot be empty')
    .trim()
    .toUpperCase()
    .isLength({ max: 50 })
    .withMessage('Item code cannot exceed 50 characters'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Item name cannot be empty')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Item name cannot exceed 255 characters'),
  body('category')
    .optional()
    .isIn(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE'])
    .withMessage('Invalid category'),
  body('supplierId')
    .optional()
    .isMongoId()
    .withMessage('Invalid supplier ID'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Price cannot be negative');
      }
      return true;
    }),
  body('cost')
    .optional()
    .isNumeric()
    .withMessage('Cost must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Cost cannot be negative');
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

    // Check if item exists
    const item = await Item.findById(req.params.id);
    if (!item) {
      return next(new AppError('No item found with that ID', 404));
    }

    // Check if trying to update code to existing code
    if (req.body.code && req.body.code !== item.code) {
      const existingItem = await Item.findOne({ code: req.body.code });
      if (existingItem) {
        return next(new AppError('Item with this code already exists', 400));
      }
    }

    // Validate supplier if provided
    if (req.body.supplierId) {
      const supplier = await Company.findById(req.body.supplierId);
      if (!supplier) {
        return next(new AppError('Supplier not found', 404));
      }
      if (!['SUPPLIER', 'BOTH'].includes(supplier.type)) {
        return next(new AppError('Selected company is not a supplier', 400));
      }
    }

    // Validate max stock vs min stock
    const minStock = req.body.minStock !== undefined ? req.body.minStock : item.minStock;
    const maxStock = req.body.maxStock !== undefined ? req.body.maxStock : item.maxStock;
    
    if (maxStock && minStock && maxStock < minStock) {
      return next(new AppError('Maximum stock must be greater than or equal to minimum stock', 400));
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('supplierId', 'name type businessNumber')
      .populate('createdBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        item: updatedItem
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete item (soft delete)
// @route   DELETE /api/items/:id
// @access  Private (Admin only)
router.delete('/:id', restrictTo('ADMIN'), async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return next(new AppError('No item found with that ID', 404));
    }

    // Soft delete by setting isActive to false
    await Item.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get items by supplier
// @route   GET /api/items/by-supplier/:supplierId
// @access  Private
router.get('/by-supplier/:supplierId', [
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('category').optional().isIn(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE']).withMessage('Invalid category'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { supplierId } = req.params;
    const { isActive = 'true', category } = req.query;

    const filter: any = { supplierId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const items = await Item.find(filter)
      .select('_id code name category unit price cost minStock maxStock')
      .sort('name');

    res.status(200).json({
      status: 'success',
      data: {
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get items for dropdown (simplified data)
// @route   GET /api/items/dropdown
// @access  Private
router.get('/dropdown/list', [
  query('category').optional().isIn(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_PRODUCT', 'CONSUMABLE']).withMessage('Invalid category'),
  query('supplierId').optional().isMongoId().withMessage('Invalid supplier ID'),
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { category, supplierId } = req.query;

    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (supplierId) filter.supplierId = supplierId;

    const items = await Item.find(filter)
      .select('_id code name unit price category')
      .populate('supplierId', 'name')
      .sort('name');

    res.status(200).json({
      status: 'success',
      data: {
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;