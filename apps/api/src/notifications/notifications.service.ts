import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsDto } from './notifications.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string,
    sendEmail?: boolean,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: message,
        metadata: link ? { link } : undefined,
      },
    });

    if (sendEmail) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        this.emailService
          .sendTemplatedEmail(
            user.email,
            'notification',
            {
              title,
              message,
              actionUrl: link ? `${process.env.APP_URL ?? 'http://localhost:3000'}${link}` : undefined,
              actionText: 'View Details',
            },
            'notifications',
          )
          .catch(() => {});
      }
    }

    return notification;
  }

  async findAll(userId: string, filters: ListNotificationsDto) {
    const { page = 1, limit = 20, unreadOnly } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { data: notifications, total, page: Number(page), limit: Number(limit) };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // Trigger helpers used by other services
  async notifyRegistrationStatusChange(userId: string, status: string, childName: string) {
    return this.create(
      userId,
      'REGISTRATION',
      'Registration Update',
      `${childName}'s registration has been ${status.toLowerCase()}.`,
      '/parent/registration',
      true, // send email for registration status changes
    );
  }

  async notifyNewMessage(userId: string, senderName: string, threadId: string) {
    return this.create(
      userId,
      'MESSAGE',
      'New Message',
      `You have a new message from ${senderName}.`,
      `/parent/messages`,
      false,
    );
  }

  async notifyPaymentDue(userId: string, amount: string, dueDate: string) {
    return this.create(
      userId,
      'PAYMENT',
      'Payment Due',
      `A payment of $${amount} is due on ${dueDate}.`,
      '/parent/payments',
      true, // send email for billing notifications
    );
  }

  async notifyAttendanceAlert(userId: string, childName: string, type: string) {
    return this.create(
      userId,
      'ATTENDANCE',
      'Attendance Alert',
      `${childName} was marked ${type} today.`,
      '/parent/attendance',
      false,
    );
  }
}
