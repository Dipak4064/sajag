import { prisma } from '../../shared/database/prisma';

export class AlertsRepository {
  async findAllEvents(limit: number = 20) {
    return prisma.disasterEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        alerts: {
          include: {
            user: true,
            responses: true
          }
        }
      }
    });
  }

  async findActiveEvents() {
    return prisma.disasterEvent.findMany({
      where: {
        status: { in: ['DETECTED', 'ANALYZING', 'CONFIRMED', 'NOTIFYING'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        alerts: {
          include: {
            user: true,
            responses: true
          }
        }
      }
    });
  }
}

export const alertsRepository = new AlertsRepository();
