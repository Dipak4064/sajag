import { Router } from 'express';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/quick-register', authController.quickRegister);
authRouter.post('/login', authController.login);
