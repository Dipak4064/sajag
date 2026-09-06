import { Request, Response, NextFunction } from 'express';
import { usersService, UsersService } from './users.service';

export class UsersController {
  constructor(private service: UsersService = usersService) {}

  public getUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getUserRosterAndTally();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}

export const usersController = new UsersController();
