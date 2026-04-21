import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto, UpdateRegistrationStatusDto, ListRegistrationsDto } from './registration.dto';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private storageService: StorageService,
  ) {}

  async create(userId: string, dto: CreateRegistrationDto) {
    // Get parent profile
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });
    if (!parentProfile) {
      throw new ForbiddenException('Parent profile not found');
    }

    // Create the student record + registration in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          allergies: dto.allergies,
          medicalNotes: dto.medicalNotes,
          isActive: false,
          emergencyContacts: dto.emergencyContacts
            ? {
                create: dto.emergencyContacts.map((ec) => ({
                  firstName: ec.firstName,
                  lastName: ec.lastName,
                  relationship: ec.relationship,
                  phone: ec.phone,
                  email: ec.email,
                })),
              }
            : undefined,
          authorizedPickups: dto.authorizedPickups
            ? {
                create: dto.authorizedPickups.map((ap) => ({
                  firstName: ap.firstName,
                  lastName: ap.lastName,
                  relationship: ap.relationship,
                  phone: ap.phone,
                  photoUrl: ap.photoUrl,
                })),
              }
            : undefined,
        },
      });

      // Link student to parent
      await tx.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parentProfile.id,
          relationship: 'Parent',
          isPrimary: true,
        },
      });

      const registration = await tx.registration.create({
        data: {
          studentId: student.id,
          classroomId: dto.classroomId,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          schedule: dto.schedule ?? {},
          notes: dto.notes,
          status: 'PENDING',
        },
        include: {
          student: true,
          classroom: true,
        },
      });

      return registration;
    });

    // Send confirmation email to parent (fire-and-forget)
    const parentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (parentUser) {
      this.emailService
        .sendTemplatedEmail(
          parentUser.email,
          'registrationSubmitted',
          { childName: `${dto.firstName} ${dto.lastName}`, parentName: parentProfile.firstName },
          'notifications',
        )
        .catch(() => {});
    }

    return result;
  }

  async findAll(filters: ListRegistrationsDto & { userId?: string; userRole?: string }) {
    const { status, search, page = 1, limit = 20, userId, userRole } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Parents can only see their own registrations
    if (userRole === 'PARENT' && userId) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId },
      });
      if (parentProfile) {
        where.student = {
          studentParents: {
            some: { parentId: parentProfile.id },
          },
        };
      }
    }

    const [total, registrations] = await Promise.all([
      this.prisma.registration.count({ where }),
      this.prisma.registration.findMany({
        where,
        include: {
          student: {
            include: {
              studentParents: {
                include: {
                  parent: {
                    include: { user: { select: { email: true } } },
                  },
                },
              },
            },
          },
          classroom: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Resolve student photo URLs
    const resolved = await Promise.all(
      registrations.map(async (reg) => {
        if (reg.student?.photoUrl && !reg.student.photoUrl.startsWith('http')) {
          const signedUrl = await this.storageService.getSignedUrl(reg.student.photoUrl, 86400);
          return { ...reg, student: { ...reg.student, photoUrl: signedUrl } };
        }
        return reg;
      }),
    );

    return {
      data: resolved,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            emergencyContacts: true,
            authorizedPickups: true,
            studentParents: {
              include: {
                parent: {
                  include: { user: { select: { email: true, role: true } } },
                },
              },
            },
          },
        },
        classroom: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }

    return registration;
  }

  async updateStatus(id: string, dto: UpdateRegistrationStatusDto) {
    const registration = await this.findOne(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedReg = await tx.registration.update({
        where: { id },
        data: {
          status: dto.status.toUpperCase(),
          notes: dto.adminNotes !== undefined ? dto.adminNotes : registration.notes,
        },
        include: { student: true, classroom: true },
      });

      // On approval: activate student, assign to classroom
      if (dto.status.toUpperCase() === 'APPROVED') {
        await tx.student.update({
          where: { id: registration.studentId },
          data: {
            isActive: true,
            enrollmentDate: new Date(),
            classrooms: {
              connect: { id: registration.classroomId },
            },
          },
        });
      }

      return updatedReg;
    });

    // Send status email to parent (fire-and-forget)
    const primaryParent = registration.student.studentParents?.[0]?.parent;
    if (primaryParent?.user?.email) {
      const childName = `${registration.student.firstName} ${registration.student.lastName}`;
      const parentName = primaryParent.firstName ?? '';
      const statusUpper = dto.status.toUpperCase();

      if (statusUpper === 'APPROVED') {
        this.emailService
          .sendTemplatedEmail(
            primaryParent.user.email,
            'registrationApproval',
            { childName, parentName },
            'notifications',
          )
          .catch(() => {});
      } else if (statusUpper === 'REJECTED') {
        this.emailService
          .sendTemplatedEmail(
            primaryParent.user.email,
            'registrationRejection',
            { childName, parentName, reason: dto.adminNotes },
            'notifications',
          )
          .catch(() => {});
      }
    }

    return updated;
  }
}
