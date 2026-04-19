import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto, SendMessageDto, ListThreadsDto, BroadcastDto } from './messaging.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async createThread(senderId: string, dto: CreateThreadDto) {
    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      include: { parentProfile: true },
    });

    // Determine parentId for the thread
    let parentId: string;
    if (senderUser?.parentProfile) {
      // Parent is creating the thread
      parentId = senderUser.parentProfile.id;
    } else if (dto.parentId) {
      // Admin/staff creating thread for a specific parent
      parentId = dto.parentId;
    } else {
      throw new ForbiddenException('parentId is required when admin or staff creates a thread');
    }

    const thread = await this.prisma.messageThread.create({
      data: {
        subject: dto.subject,
        parentId,
        messages: {
          create: {
            senderId,
            body: dto.message,
          },
        },
      },
      include: {
        messages: {
          include: { sender: { select: { id: true, email: true, role: true, parentProfile: true, staffProfile: true } } },
        },
        parent: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    return thread;
  }

  async getThreads(userId: string, filters: ListThreadsDto) {
    const { page = 1, limit = 20, search } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true },
    });

    const where: any = {};

    if (user?.parentProfile) {
      // Parent: see their own threads
      where.parentId = user.parentProfile.id;
    }
    // Admin/staff: see all threads (no filter by parentId)

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { parent: { firstName: { contains: search, mode: 'insensitive' } } },
        { parent: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, threads] = await Promise.all([
      this.prisma.messageThread.count({ where }),
      this.prisma.messageThread.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          parent: {
            include: { user: { select: { id: true, email: true, role: true } } },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, email: true, role: true, parentProfile: true, staffProfile: true } } },
          },
        },
      }),
    ]);

    // Add unread count per thread (messages where senderId != userId and readAt is null)
    const threadsWithUnread = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            readAt: null,
          },
        });
        return { ...thread, unreadCount };
      })
    );

    return { data: threadsWithUnread, total, page: Number(page), limit: Number(limit) };
  }

  async getThread(threadId: string, userId: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        parent: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, email: true, role: true, parentProfile: true, staffProfile: true },
            },
          },
        },
      },
    });

    if (!thread) throw new NotFoundException('Thread not found');

    // Mark messages as read
    await this.markAsRead(threadId, userId);

    return thread;
  }

  async sendMessage(threadId: string, senderId: string, dto: SendMessageDto) {
    const thread = await this.prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { threadId, senderId, body: dto.content },
        include: {
          sender: { select: { id: true, email: true, role: true, parentProfile: true, staffProfile: true } },
        },
      }),
      this.prisma.messageThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  async markAsRead(threadId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: { threadId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true },
    });

    const threadWhere: any = {};
    if (user?.parentProfile) {
      threadWhere.parentId = user.parentProfile.id;
    }

    const threads = await this.prisma.messageThread.findMany({
      where: threadWhere,
      select: { id: true },
    });

    const threadIds = threads.map((t) => t.id);
    if (threadIds.length === 0) return { count: 0 };

    const count = await this.prisma.message.count({
      where: { threadId: { in: threadIds }, senderId: { not: userId }, readAt: null },
    });

    return { count };
  }

  async createBroadcast(senderId: string, dto: BroadcastDto) {
    // Find all parents (optionally filtered by classroom)
    const parentWhere: any = {};
    if (dto.classroomId) {
      parentWhere.studentParents = {
        some: {
          student: { classrooms: { some: { id: dto.classroomId } } },
        },
      };
    }

    const parents = await this.prisma.parentProfile.findMany({ where: parentWhere });

    const threads = await Promise.all(
      parents.map((parent) =>
        this.prisma.messageThread.create({
          data: {
            subject: dto.subject,
            parentId: parent.id,
            messages: {
              create: { senderId, body: dto.message },
            },
          },
        })
      )
    );

    return { created: threads.length, message: `Broadcast sent to ${threads.length} parent(s)` };
  }
}
