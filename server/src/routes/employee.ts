import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Employee } from '../models/Employee';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateEmployee = [
  body('name').notEmpty().withMessage('이름은 필수입니다.').isLength({ max: 100 }).withMessage('이름은 100자를 초과할 수 없습니다.'),
  body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.').normalizeEmail(),
  body('department').notEmpty().withMessage('부서는 필수입니다.').isLength({ max: 100 }).withMessage('부서명은 100자를 초과할 수 없습니다.'),
  body('position').notEmpty().withMessage('직책은 필수입니다.').isLength({ max: 100 }).withMessage('직책은 100자를 초과할 수 없습니다.'),
  body('phone').optional().matches(/^[\d\-\+\(\)\s]+$/).withMessage('유효한 전화번호를 입력해주세요.'),
  body('hireDate').optional().isISO8601().withMessage('유효한 입사일을 입력해주세요.'),
  body('birthDate').optional().isISO8601().withMessage('유효한 생년월일을 입력해주세요.'),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('유효한 성별을 선택해주세요.'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).withMessage('유효한 상태를 선택해주세요.'),
];

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
router.get('/', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      department, 
      status = 'ACTIVE',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    let query: any = { isActive: true };

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameEng: { $regex: search, $options: 'i' } },
        { employeeNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('manager', 'name employeeNumber')
        .populate('createdBy', 'name email')
        .select('-bankAccount.accountNumber -salary') // Exclude sensitive data
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      status: 'success',
      data: {
        employees,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalCount: total,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('manager', 'name employeeNumber position department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: '직원을 찾을 수 없습니다.'
      });
    }

    // Check if user has permission to view sensitive data
    const canViewSensitive = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
    let responseData = employee.toObject();

    if (!canViewSensitive) {
      delete responseData.salary;
      delete responseData.bankAccount;
    }

    res.status(200).json({
      status: 'success',
      data: {
        employee: responseData
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private
router.post('/', validateEmployee, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ 
      email: req.body.email.toLowerCase(),
      isActive: true 
    });

    if (existingEmployee) {
      return res.status(400).json({
        status: 'error',
        message: '이미 등록된 이메일입니다.'
      });
    }

    const employeeData = {
      ...req.body,
      createdBy: req.user.id
    };

    const employee = new Employee(employeeData);
    await employee.save();

    // Populate references for response
    await employee.populate('manager', 'name employeeNumber');
    await employee.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: {
        employee
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `이미 등록된 ${field === 'email' ? '이메일' : field === 'employeeNumber' ? '사원번호' : field}입니다.`
      });
    }
    next(error);
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
router.put('/:id', validateEmployee, async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '입력 데이터에 오류가 있습니다.',
        errors: errors.array()
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: '직원을 찾을 수 없습니다.'
      });
    }

    // Check if email is being changed and already exists
    if (req.body.email && req.body.email.toLowerCase() !== employee.email) {
      const existingEmployee = await Employee.findOne({ 
        email: req.body.email.toLowerCase(),
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingEmployee) {
        return res.status(400).json({
          status: 'error',
          message: '이미 등록된 이메일입니다.'
        });
      }
    }

    // Update fields
    Object.assign(employee, req.body, { updatedBy: req.user.id });
    await employee.save();

    // Populate references for response
    await employee.populate('manager', 'name employeeNumber');
    await employee.populate('createdBy', 'name email');
    await employee.populate('updatedBy', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        employee
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `이미 등록된 ${field === 'email' ? '이메일' : field === 'employeeNumber' ? '사원번호' : field}입니다.`
      });
    }
    next(error);
  }
});

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: '직원을 찾을 수 없습니다.'
      });
    }

    // Soft delete
    employee.isActive = false;
    employee.status = 'TERMINATED';
    employee.updatedBy = req.user.id;
    await employee.save();

    res.status(200).json({
      status: 'success',
      message: '직원이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get employees by department
// @route   GET /api/employees/department/:department
// @access  Private
router.get('/department/:department', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const employees = await Employee.findByDepartment(req.params.department)
      .select('name employeeNumber position email phone status');

    res.status(200).json({
      status: 'success',
      data: {
        employees
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search employees
// @route   GET /api/employees/search/:term
// @access  Private
router.get('/search/:term', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const employees = await Employee.searchEmployees(req.params.term)
      .select('name nameEng employeeNumber department position email phone status');

    res.status(200).json({
      status: 'success',
      data: {
        employees
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get departments
// @route   GET /api/employees/departments/list
// @access  Private
router.get('/departments/list', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const departments = await Employee.distinct('department', { isActive: true });

    res.status(200).json({
      status: 'success',
      data: {
        departments: departments.sort()
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get positions
// @route   GET /api/employees/positions/list
// @access  Private
router.get('/positions/list', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const positions = await Employee.distinct('position', { isActive: true });

    res.status(200).json({
      status: 'success',
      data: {
        positions: positions.sort()
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update employee status
// @route   PATCH /api/employees/:id/status
// @access  Private
router.patch('/:id/status', [
  body('status').isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).withMessage('유효한 상태를 선택해주세요.')
], async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '유효한 상태를 선택해주세요.'
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        message: '직원을 찾을 수 없습니다.'
      });
    }

    employee.status = req.body.status;
    employee.updatedBy = req.user.id;
    await employee.save();

    res.status(200).json({
      status: 'success',
      message: '직원 상태가 업데이트되었습니다.',
      data: {
        employee: {
          _id: employee._id,
          name: employee.name,
          status: employee.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;