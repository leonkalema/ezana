import { Router } from 'express';
import { GameController } from '../controllers/game-controller.js';
import { validateRequest, validateParams } from '../middleware/validation-middleware.js';
import { authenticateToken } from '../middleware/auth-middleware.js';
import { createGameSchema, joinGameSchema, gameMoveSchema } from '../validation/schemas.js';
import { z } from 'zod';
const router = Router();
const gameCodeParamSchema = z.object({
    gameCode: z.string()
        .length(8, 'Game code must be exactly 8 characters')
        .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers')
});
router.use(authenticateToken);
router.post('/create', validateRequest(createGameSchema), GameController.createGame);
router.post('/join', validateRequest(joinGameSchema), GameController.joinGame);
router.get('/active', GameController.getActiveGames);
router.get('/:gameCode', validateParams(gameCodeParamSchema), GameController.getGame);
router.post('/move', validateRequest(gameMoveSchema), GameController.makeMove);
router.post('/:gameCode/abandon', validateParams(gameCodeParamSchema), GameController.abandonGame);
export default router;
//# sourceMappingURL=game-routes.js.map