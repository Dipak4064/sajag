import { devicesRepository, DevicesRepository } from './devices.repository';
import { AppError } from '../../shared/errors/app-error';

export class DevicesService {
  constructor(private repo: DevicesRepository = devicesRepository) {}

  private connectedSince() {
    return new Date(Date.now() - 5 * 60 * 1000);
  }

  async getAllDevices(connectedOnly = false) {
    return this.repo.findAllWithLatestReading(connectedOnly ? this.connectedSince() : undefined);
  }

  async getDeviceById(id: string, requireConnected = false) {
    const device = await this.repo.findByIdWithReadings(id, 20, requireConnected ? this.connectedSince() : undefined);
    if (!device) {
      throw AppError.notFound('Device not found');
    }
    return device;
  }

  async getDeviceReadings(id: string, limit: number = 50, requireConnected = false) {
    const readings = await this.repo.findReadingsByDeviceId(id, limit, requireConnected ? this.connectedSince() : undefined);
    if (!readings) {
      throw AppError.notFound(requireConnected ? 'Connected device not found' : 'Device not found');
    }
    return readings;
  }

  async getConnectedTelemetry(id: string, limit: number = 50) {
    const device = await this.repo.findByIdWithReadings(id, limit, this.connectedSince());
    if (!device) {
      throw AppError.notFound('Connected device not found');
    }
    return device;
  }
}

export const devicesService = new DevicesService();
