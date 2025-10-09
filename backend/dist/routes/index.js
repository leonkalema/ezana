import { Router } from 'express';
import authRoutes from './auth-routes.js';
import gameRoutes from './game-routes.js';
import matchmakingRoutes from './matchmaking-routes.js';
import walletRoutes from './wallet-routes.js';
const router = Router();
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Binojo Backend API'
    });
});
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/matchmaking', matchmakingRoutes);
router.use('/wallet', walletRoutes);
export default router;
//# sourceMappingURL=index.js.map