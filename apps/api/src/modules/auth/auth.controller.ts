import { Request, Response, NextFunction } from 'express';
import { authLoginSchema, authRegisterSchema } from '#sajag-validation';
import { authService, AuthService } from './auth.service';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = authRegisterSchema.parse(req.body);
      const result = await this.service.register(data);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = authLoginSchema.parse(req.body);
      const result = await this.service.login(data);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
