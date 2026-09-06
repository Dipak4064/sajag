import { prisma } from '../../shared/database/prisma';
import { calculateHaversineDistance } from '../../shared/utils/haversine';
import { UserEntity } from '#sajag-types';

export class GeofenceService {
  public async findUsersInRadius(
    centerLat: number,
    centerLng: number,
    radiusMeters: number = 5000
  ): Promise<Array<UserEntity & { distanceMeters: number }>> {
    const allUsers = await prisma.user.findMany({
      where: { role: 'CITIZEN' }
    });

    const affectedUsers: Array<UserEntity & { distanceMeters: number }> = [];

    for (const user of allUsers) {
      const distance = calculateHaversineDistance(
        centerLat,
        centerLng,
        user.latitude,
        user.longitude
      );

      if (distance <= radiusMeters) {
        affectedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email || undefined,
          phone: user.phone,
          latitude: user.latitude,
          longitude: user.longitude,
          status: user.status as any,
          role: user.role as any,
          municipalityId: user.municipalityId,
          distanceMeters: Math.round(distance)
        });
      }
    }

    return affectedUsers.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

export const geofenceService = new GeofenceService();
