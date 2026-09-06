import { sheltersRepository, SheltersRepository } from './shelters.repository';
import { calculateHaversineDistance } from '../../shared/utils/haversine';
import { ShelterEntity } from '#sajag-types';

export class ShelterService {
  constructor(private repo: SheltersRepository = sheltersRepository) {}

  public async findNearestShelters(
    latitude: number,
    longitude: number,
    limit: number = 5
  ): Promise<Array<ShelterEntity & { distanceMeters: number; availableBeds: number }>> {
    const shelters = await this.repo.findActiveShelters();

    const results = shelters
      .map((s: any) => {
        const distance = calculateHaversineDistance(
          latitude,
          longitude,
          s.latitude,
          s.longitude
        );
        const availableBeds = Math.max(0, s.totalCapacity - s.currentOccupancy);
        return {
          id: s.id,
          name: s.name,
          nameNe: s.nameNe || undefined,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address,
          totalCapacity: s.totalCapacity,
          currentOccupancy: s.currentOccupancy,
          hasMedicalFacility: s.hasMedicalFacility,
          hasFoodWater: s.hasFoodWater,
          hasBackupPower: s.hasBackupPower,
          isActive: s.isActive,
          distanceMeters: Math.round(distance),
          availableBeds
        };
      })
      .filter((s: any) => s.availableBeds > 0)
      .sort((a: any, b: any) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);

    return results;
  }
}

export const shelterService = new ShelterService();
