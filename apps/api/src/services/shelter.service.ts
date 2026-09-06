import { prisma } from '../db/prisma';
import { calculateHaversineDistance } from '../utils/haversine';
import { ShelterEntity } from '@sajag/types';

export class ShelterService {
  /**
   * Finds nearest active emergency shelters with remaining capacity
   */
  public async findNearestShelters(
    latitude: number,
    longitude: number,
    limit: number = 5
  ): Promise<Array<ShelterEntity & { distanceMeters: number; availableBeds: number }>> {
    const shelters = await prisma.shelter.findMany({
      where: { isActive: true }
    });

    const results = shelters
      .map((s) => {
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
      .filter((s) => s.availableBeds > 0)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);

    return results;
  }
}

export const shelterService = new ShelterService();
