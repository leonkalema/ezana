import { Router } from 'express';
import { DepositController } from '../controllers/deposit-controller.js';
import { authenticateToken } from '../middleware/auth-middleware.js';

const router = Router();

router.get('/config', DepositController.getConfig);

router.use(authenticateToken);

router.post('/create-order', DepositController.createOrder);
router.post('/:orderId/capture', DepositController.captureOrder);
router.post('/:orderId/cancel', DepositController.cancelOrder);

export default router;
