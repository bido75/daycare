import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto, ListFeeTypesDto } from './billing.dto';

@Injectable()
export class FeeTypesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeeTypeDto) {
    // Map frequency to isRecurring and recurringInterval
    const isRecurring = dto.frequency !== 'ONE_TIME';
    const recurringInterval = isRecurring ? dto.frequency : null;

    return this.prisma.feeType.create({
      data: {
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        isRecurring,
        recurringInterval,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(filters: ListFeeTypesDto) {
    const { search, category, active, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    const [total, data] = await Promise.all([
      this.prisma.feeType.count({ where }),
      this.prisma.feeType.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: data.map((ft) => ({
        ...ft,
        amount: Number(ft.amount),
        frequency: ft.isRecurring ? ft.recurringInterval : 'ONE_TIME',
      })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const feeType = await this.prisma.feeType.findUnique({ where: { id } });
    if (!feeType) throw new NotFoundException(`Fee type ${id} not found`);
    return {
      ...feeType,
      amount: Number(feeType.amount),
      frequency: feeType.isRecurring ? feeType.recurringInterval : 'ONE_TIME',
    };
  }

  async update(id: string, dto: UpdateFeeTypeDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.frequency !== undefined) {
      updateData.isRecurring = dto.frequency !== 'ONE_TIME';
      updateData.recurringInterval = dto.frequency !== 'ONE_TIME' ? dto.frequency : null;
    }

    const updated = await this.prisma.feeType.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updated,
      amount: Number(updated.amount),
      frequency: updated.isRecurring ? updated.recurringInterval : 'ONE_TIME',
    };
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.feeType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
