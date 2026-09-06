import { prisma } from '../../shared/database/prisma';

export class DevicesRepository {
  async findAllWithLatestReading(connectedSince?: Date) {
    return prisma.device.findMany({
      where: connectedSince ? { status: 'ONLINE', lastHeartbeat: { gte: connectedSince } } : undefined,
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });
  }

  async findByIdWithReadings(id: string, limit: number = 20, connectedSince?: Date) {
    return prisma.device.findFirst({
      where: {
        OR: [{ id }, { deviceId: id }],
        ...(connectedSince ? { status: 'ONLINE', lastHeartbeat: { gte: connectedSince } } : {})
      },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: limit
        }
      }
    });
  }

  async findDeviceByPublicId(id: string, connectedSince?: Date) {
    return prisma.device.findFirst({
      where: {
        OR: [{ id }, { deviceId: id }],
        ...(connectedSince ? { status: 'ONLINE', lastHeartbeat: { gte: connectedSince } } : {})
      },
      select: { id: true, deviceId: true, name: true, status: true, lastHeartbeat: true }
    });
  }

  async findReadingsByDeviceId(deviceId: string, limit: number = 50, connectedSince?: Date) {
    const device = await this.findDeviceByPublicId(deviceId, connectedSince);
    if (!device) return null;
    return prisma.sensorReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}

export const devicesRepository = new DevicesRepository();
