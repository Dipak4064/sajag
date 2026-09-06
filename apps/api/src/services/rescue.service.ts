import { prisma } from '../db/prisma';
import { calculateHaversineDistance } from '../utils/haversine';
import { RescueTeamEntity } from '@sajag/types';

export class RescueService {
  /**
   * Finds nearest available rescue teams to given coordinates
   */
  public async findNearestAvailableTeams(
    latitude: number,
    longitude: number,
    limit: number = 5
  ): Promise<Array<RescueTeamEntity & { distanceMeters: number }>> {
    const teams = await prisma.rescueTeam.findMany({
      where: { status: 'AVAILABLE' }
    });

    const teamsWithDist = teams.map((t) => {
      const distance = calculateHaversineDistance(
        latitude,
        longitude,
        t.latitude,
        t.longitude
      );
      return {
        id: t.id,
        name: t.name,
        teamType: t.teamType as any,
        status: t.status as any,
        latitude: t.latitude,
        longitude: t.longitude,
        capacity: t.capacity,
        contactRadioFreq: t.contactRadioFreq || undefined,
        leadOfficerName: t.leadOfficerName,
        distanceMeters: Math.round(distance)
      };
    });

    return teamsWithDist.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, limit);
  }

  /**
   * Assigns rescue team to an SOS request
   */
  public async assignTeamToSOS(sosId: string, teamId: string) {
    const sos = await prisma.sOSRequest.update({
      where: { id: sosId },
      data: {
        status: 'ASSIGNED',
        assignedTeamId: teamId
      },
      include: { assignedTeam: true, user: true }
    });

    await prisma.rescueTeam.update({
      where: { id: teamId },
      data: { status: 'DISPATCHED' }
    });

    return sos;
  }
}

export const rescueService = new RescueService();
