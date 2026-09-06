import { devicesRepository, DevicesRepository } from './devices.repository';
import { AppError } from '../../shared/errors/app-error';

export class DevicesService {
  constructor(private repo: DevicesRepository = devicesRepository) {}

  async getAllDevices() {
    return this.repo.findAllWithLatestReading();
  }

  async getDeviceById(id: string) {
    const device = await this.repo.findByIdWithReadings(id, 20);
    if (!device) {
      throw AppError.notFound('Device not found');
    }
    return device;
  }

  async getDeviceReadings(id: string, limit: number = 50) {
    return this.repo.findReadingsByDeviceId(id, limit);
  }
}

export const devicesService = new DevicesService();
