import { prisma } from '@/config/db';

export class TableRepository {
  static async findById(id: string) {
    return prisma.table.findUnique({
      where: { id },
      include: {
        restaurant: true,
        branch: true,
        floor: true,
      },
    });
  }

  static async findByNumber(number: string, branchId: string) {
    return prisma.table.findFirst({
      where: {
        number,
        branchId,
      },
    });
  }

  static async findAll(filters: { restaurantId?: string; branchId?: string } = {}) {
    const whereClause: any = {};
    if (filters.restaurantId) whereClause.restaurantId = filters.restaurantId;
    if (filters.branchId) whereClause.branchId = filters.branchId;

    return prisma.table.findMany({
      where: whereClause,
      include: {
        floor: true,
        restaurant: true,
        branch: true,
      },
      orderBy: { number: 'asc' },
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.table.update({
      where: { id },
      data: { status },
      include: { restaurant: true, branch: true },
    });
  }

  static async create(data: { number: string; guestsCount?: number; restaurantId: string; branchId: string; floorId?: string }) {
    return prisma.table.create({
      data: {
        number: data.number,
        guestsCount: data.guestsCount ?? 2,
        status: 'AVAILABLE',
        restaurantId: data.restaurantId,
        branchId: data.branchId,
        floorId: data.floorId,
      },
    });
  }

  static async updateGuests(id: string, guestsCount: number) {
    return prisma.table.update({
      where: { id },
      data: { guestsCount },
    });
  }

  static async delete(id: string) {
    return prisma.table.delete({
      where: { id },
    });
  }
}
