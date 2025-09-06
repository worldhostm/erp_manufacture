import express from 'express';
import Company from '../models/Company';
import User from '../models/User';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

// @desc    Clear all test data
// @route   DELETE /api/admin/clear-data
// @access  Private (Admin only)
router.delete('/clear-data', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    // Delete all companies except those created by current user for safety
    await Company.deleteMany({});
    
    // Delete all users except current admin
    await User.deleteMany({ _id: { $ne: req.user!._id } });

    res.status(200).json({
      status: 'success',
      message: 'All test data cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;