import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(protect);

router.get('/work-orders', async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    res.status(200).json({ status: 'success', data: { workOrders: [] } });
  } catch (error) {
    next(error);
  }
});

export default router;