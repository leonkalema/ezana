import { Router } from 'express';
import { MatchmakingController } from '../controllers/matchmaking-controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth-middleware.js';

const router = Router();

// Protected routes (require authentication)
router.post('/join', authenticateToken, MatchmakingController.joinQueue);
router.post('/leave', authenticateToken, MatchmakingController.leaveQueue);
router.get('/status', authenticateToken, MatchmakingController.getQueueStatus);

// Public routes (optional authentication)
router.get('/stats', optionalAuth, MatchmakingController.getQueueStats);

export default router;
