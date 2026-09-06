import { prisma } from '../../shared/database/prisma';

export class SheltersRepository {
  async findAllShelters() {
    return prisma.shelter.findMany({
      orderBy: { totalCapacity: 'desc' }
    });
  }

  async findActiveShelters() {
    return prisma.shelter.findMany({
      where: { isActive: true }
    });
  }
}

export const sheltersRepository = new SheltersRepository();
