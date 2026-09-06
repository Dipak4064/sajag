import { prisma } from '../../shared/database/prisma';

export class AdsRepository {
  async findActiveAds(where: any) {
    return prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async incrementImpressions(ids: string[]) {
    return prisma.advertisement.updateMany({
      where: { id: { in: ids } },
      data: { impressions: { increment: 1 } }
    });
  }

  async findAllAds() {
    return prisma.advertisement.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAdById(id: string) {
    return prisma.advertisement.findUnique({
      where: { id }
    });
  }

  async createAd(data: any) {
    return prisma.advertisement.create({ data });
  }

  async incrementClicks(id: string) {
    return prisma.advertisement.update({
      where: { id },
      data: { clicks: { increment: 1 } }
    });
  }

  async updateAd(id: string, data: any) {
    return prisma.advertisement.update({
      where: { id },
      data
    });
  }

  async deleteAd(id: string) {
    return prisma.advertisement.delete({
      where: { id }
    });
  }
}

export const adsRepository = new AdsRepository();
