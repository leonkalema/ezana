import { Router } from 'express';
import authRoutes from './auth-routes.js';
import gameRoutes from './game-routes.js';
import matchmakingRoutes from './matchmaking-routes.js';
import walletRoutes from './wallet-routes.js';
import withdrawalRoutes from './withdrawal-routes.js';
import depositRoutes from './deposit-routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Binojo Backend API'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/matchmaking', matchmakingRoutes);
router.use('/wallet', walletRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/deposits', depositRoutes);

export default router;
