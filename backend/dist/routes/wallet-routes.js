import { Router } from 'express';
import { WalletController } from '../controllers/wallet-controller.js';
import { authenticateToken } from '../middleware/auth-middleware.js';
const router = Router();
router.use(authenticateToken);
router.get('/balance', WalletController.getBalance);
router.get('/transactions', WalletController.getTransactions);
router.post('/deposit', WalletController.deposit);
export default router;
//# sourceMappingURL=wallet-routes.js.map