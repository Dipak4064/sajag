import { rescueRepository, RescueRepository } from './rescue.repository';
import { calculateHaversineDistance } from '../../shared/utils/haversine';
import { RescueTeamEntity } from '#sajag-types';

export class RescueService {
  constructor(private repo: RescueRepository = rescueRepository) {}

  public async findNearestAvailableTeams(
    latitude: number,
    longitude: number,
    limit: number = 5
  ): Promise<Array<RescueTeamEntity & { distanceMeters: number }>> {
    const teams = await this.repo.findAvailableTeams();

    const teamsWithDist = teams.map((t: any) => {
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

    return teamsWithDist.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters).slice(0, limit);
  }

  public async assignTeamToSOS(sosId: string, teamId: string) {
    const sos = await this.repo.updateSOSStatus(sosId, {
      status: 'ASSIGNED',
      assignedTeamId: teamId
    });

    await this.repo.updateTeamStatus(teamId, 'DISPATCHED');

    return sos;
  }
}

export const rescueService = new RescueService();
