import { usersRepository, UsersRepository } from './users.repository';

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async getUserRosterAndTally() {
    const users = await this.repo.findAllUsersRoster();
    const tally = {
      SAFE: users.filter((u: any) => u.status === 'SAFE').length,
      UNSAFE: users.filter((u: any) => u.status === 'UNSAFE').length,
      NO_RESPONSE: users.filter((u: any) => u.status === 'NO_RESPONSE').length,
      UNKNOWN: users.filter((u: any) => u.status === 'UNKNOWN').length,
      total: users.length
    };
    return { users, tally };
  }
}

export const usersService = new UsersService();
