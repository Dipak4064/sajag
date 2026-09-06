import { prisma } from '../../shared/database/prisma';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findDefaultMunicipality() {
    return prisma.municipality.findFirst();
  }

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: any;
    latitude: number;
    longitude: number;
    municipalityId: string;
  }) {
    return prisma.user.create({
      data
    });
  }

  async createQuickUser(data: {
    name: string;
    email: string;
    phone: string;
    photoUrl?: string;
    latitude: number;
    longitude: number;
    municipalityId: string;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        role: 'CITIZEN',
        passwordHash: null
      }
    });
  }
}

export const authRepository = new AuthRepository();
