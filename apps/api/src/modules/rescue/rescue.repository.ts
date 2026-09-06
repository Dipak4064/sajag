import { prisma } from '../../shared/database/prisma';

export class RescueRepository {
  async findAllTeams() {
    return prisma.rescueTeam.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
        }
      }
    });
  }

  async findAvailableTeams() {
    return prisma.rescueTeam.findMany({
      where: { status: 'AVAILABLE' }
    });
  }

  async findAllSOSRequests(limit: number = 50) {
    return prisma.sOSRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: true,
        assignedTeam: true
      }
    });
  }

  async findActiveSOSRequests() {
    return prisma.sOSRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        assignedTeam: true
      }
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone }
    });
  }

  async findDefaultMunicipality() {
    return prisma.municipality.findFirst();
  }

  async createFallbackUser(data: {
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    status: any;
    municipalityId: string;
  }) {
    return prisma.user.create({ data });
  }

  async createSOSRequest(data: {
    userId: string;
    latitude: number;
    longitude: number;
    addressText?: string;
    description: string;
    numberOfPeople: number;
    medicalEmergency: any;
    contactNumber: string;
    status: any;
  }) {
    return prisma.sOSRequest.create({
      data,
      include: { user: true }
    });
  }

  async updateSOSStatus(id: string, data: { status: any; assignedTeamId?: string; resolvedAt?: Date }) {
    return prisma.sOSRequest.update({
      where: { id },
      data,
      include: { assignedTeam: true, user: true }
    });
  }

  async updateTeamStatus(teamId: string, status: any) {
    return prisma.rescueTeam.update({
      where: { id: teamId },
      data: { status }
    });
  }
}

export const rescueRepository = new RescueRepository();
