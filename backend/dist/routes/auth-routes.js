import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { validateRequest } from '../middleware/validation-middleware.js';
import { authenticateToken } from '../middleware/auth-middleware.js';
import { createUserSchema, loginSchema } from '../validation/schemas.js';
const router = Router();
router.post('/register', validateRequest(createUserSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/profile', authenticateToken, AuthController.getProfile);
export default router;
//# sourceMappingURL=auth-routes.js.map