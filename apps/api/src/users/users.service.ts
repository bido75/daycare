import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, role: true, isActive: true, createdAt: true, parentProfile: true, staffProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { success: true, data: { users, total, page, limit } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true, parentProfile: true, staffProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { success: true, data: { id: user.id, isActive: user.isActive }, message: 'User deactivated' };
  }
}
