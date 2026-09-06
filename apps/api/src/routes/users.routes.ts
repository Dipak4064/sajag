import { Router } from 'express';
import { prisma } from '../db/prisma';

export const usersRouter = Router();

// GET /api/users
usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true
      }
    });

    const tally = {
      SAFE: users.filter((u) => u.status === 'SAFE').length,
      UNSAFE: users.filter((u) => u.status === 'UNSAFE').length,
      NO_RESPONSE: users.filter((u) => u.status === 'NO_RESPONSE').length,
      UNKNOWN: users.filter((u) => u.status === 'UNKNOWN').length,
      total: users.length
    };

    res.json({ success: true, data: { users, tally } });
  } catch (err) {
    next(err);
  }
});
