import { Router } from 'express';
import { WithdrawalController } from '../controllers/withdrawal-controller.js';
import { authenticateToken } from '../middleware/auth-middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/config', WithdrawalController.getConfig);
router.post('/request', WithdrawalController.requestWithdrawal);
router.post('/:id/cancel', WithdrawalController.cancelWithdrawal);
router.get('/history', WithdrawalController.getWithdrawals);

export default router;
