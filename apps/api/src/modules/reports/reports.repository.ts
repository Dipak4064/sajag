import { prisma } from '../../shared/database/prisma';

export class ReportsRepository {
  async findDefaultUser() {
    return prisma.user.findFirst();
  }

  async createReport(data: {
    userId: string;
    disasterType: any;
    latitude: number;
    longitude: number;
    addressText?: string;
    description: string;
    mediaUrls: string;
  }) {
    return prisma.citizenReport.create({
      data,
      include: { user: true }
    });
  }

  async findAllReports(limit: number = 50) {
    return prisma.citizenReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true }
    });
  }

  async updateReportStatus(id: string, status: any) {
    return prisma.citizenReport.update({
      where: { id },
      data: { status }
    });
  }
}

export const reportsRepository = new ReportsRepository();
