import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadDocumentDto, ListDocumentsDto, VerifyDocumentDto } from './documents.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    dto: UploadDocumentDto,
    userId: string,
  ) {
    const ext = file.originalname.split('.').pop();
    const key = `documents/${dto.studentId}/${uuidv4()}.${ext}`;

    const { url } = await this.storage.uploadFile(file.buffer, key, file.mimetype);

    const doc = await this.prisma.document.create({
      data: {
        studentId: dto.studentId,
        type: dto.type,
        name: dto.name || file.originalname,
        s3Key: key,
        s3Url: url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });

    return doc;
  }

  async findAll(filters: ListDocumentsDto, userRole: string, userId: string) {
    const where: any = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.type) where.type = filters.type;
    if (filters.verified !== undefined) where.verified = filters.verified;

    // Parents can only see their children's documents
    if (userRole === 'PARENT') {
      const parent = await this.prisma.parentProfile.findUnique({
        where: { userId },
        include: { studentParents: { select: { studentId: true } } },
      });
      if (!parent) return { data: [], total: 0, page: filters.page, limit: filters.limit };
      const studentIds = parent.studentParents.map((sp) => sp.studentId);
      where.studentId = { in: studentIds };
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const downloadUrl = await this.storage.getSignedUrl(doc.s3Key);
    return { ...doc, downloadUrl };
  }

  async verify(id: string, dto: VerifyDocumentDto) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.document.update({
      where: { id },
      data: { verified: dto.verified },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async delete(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    await this.storage.deleteFile(doc.s3Key);
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }

  async getExpiringDocuments(daysAhead = 30) {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.prisma.document.findMany({
      where: {
        expiresAt: { gte: now, lte: future },
      },
      orderBy: { expiresAt: 'asc' },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
