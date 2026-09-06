import { prisma } from '../../shared/database/prisma';

export class DevicesRepository {
  async findAllWithLatestReading() {
    return prisma.device.findMany({
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });
  }

  async findByIdWithReadings(id: string, limit: number = 20) {
    return prisma.device.findUnique({
      where: { id },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: limit
        }
      }
    });
  }

  async findReadingsByDeviceId(deviceId: string, limit: number = 50) {
    return prisma.sensorReading.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}

export const devicesRepository = new DevicesRepository();
