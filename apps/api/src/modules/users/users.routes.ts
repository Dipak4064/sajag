import { Router } from 'express';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/', usersController.getUsers);
usersRouter.post('/', usersController.createUser);
