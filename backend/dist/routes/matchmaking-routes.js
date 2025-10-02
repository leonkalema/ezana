import { Router } from 'express';
import { MatchmakingController } from '../controllers/matchmaking-controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth-middleware.js';
const router = Router();
router.post('/join', authenticateToken, MatchmakingController.joinQueue);
router.post('/leave', authenticateToken, MatchmakingController.leaveQueue);
router.get('/status', authenticateToken, MatchmakingController.getQueueStatus);
router.get('/stats', optionalAuth, MatchmakingController.getQueueStats);
export default router;
//# sourceMappingURL=matchmaking-routes.js.map