import { prisma } from '../../shared/database/prisma';

export class UsersRepository {
  async findAllUsersRoster() {
    return prisma.user.findMany({
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
  }
}

export const usersRepository = new UsersRepository();
