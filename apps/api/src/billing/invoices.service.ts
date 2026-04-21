import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  ListInvoicesDto,
  BulkCreateInvoiceDto,
} from './billing.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });
    const nextSeq = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0', 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  async create(dto: CreateInvoiceDto, createdById: string) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { id: dto.parentProfileId },
      include: { user: true },
    });
    if (!parent) throw new NotFoundException('Parent profile not found');

    const invoiceNumber = await this.generateInvoiceNumber();

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        parentId: dto.parentProfileId,
        status: 'PENDING',
        dueDate: new Date(dto.dueDate),
        subtotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        paidAmount: 0,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            feeTypeId: item.feeTypeId || null,
            studentId: item.studentId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        items: true,
        parent: { include: { user: true } },
      },
    });

    return this.formatInvoice(invoice);
  }

  async findAll(filters: ListInvoicesDto, userRole?: string, userId?: string) {
    const { status, parentId, studentId, dateFrom, dateTo, page = 1, limit = 20 } =
      filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // PARENT role sees only own invoices
    if (userRole === 'PARENT' && userId) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId },
      });
      if (parentProfile) {
        where.parentId = parentProfile.id;
      } else {
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      }
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (status) where.status = status.toUpperCase();

    if (studentId) {
      where.items = { some: { studentId } };
    }

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }

    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          items: { include: { feeType: true, student: true } },
          payments: true,
          parent: { include: { user: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: invoices.map((inv) => this.formatInvoice(inv)),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string, userRole?: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { feeType: true, student: true } },
        payments: { include: { receipt: true } },
        parent: { include: { user: true } },
      },
    });

    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    // PARENT role can only see own invoices
    if (userRole === 'PARENT' && userId) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId },
      });
      if (!parentProfile || invoice.parentId !== parentProfile.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.formatInvoice(invoice);
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    const updateData: any = {};
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.status !== undefined) updateData.status = dto.status;

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { feeType: true, student: true } },
        payments: true,
        parent: { include: { user: true } },
      },
    });

    return this.formatInvoice(updated);
  }

  async void(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot void a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'VOID' },
    });
  }

  async sendReminder(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { parent: { include: { user: true } }, items: true },
    });

    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);

    const parentEmail = invoice.parent.user.email;
    const parentName = `${invoice.parent.firstName} ${invoice.parent.lastName}`;

    await this.emailService.sendEmail(
      parentEmail,
      `Payment Reminder - Invoice ${invoice.invoiceNumber}`,
      `
        <h2>Payment Reminder</h2>
        <p>Dear ${parentName},</p>
        <p>This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> for <strong>$${Number(invoice.totalAmount).toFixed(2)}</strong> is due on <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.</p>
        <p>Please log in to your parent portal to make a payment.</p>
        <p>Thank you,<br/>Creative Kids Academy</p>
      `,
      { context: 'billing' },
    );

    return { message: 'Reminder sent successfully' };
  }

  async getInvoiceStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [outstanding, overdueCount, paidThisMonth, allPaidInvoices] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.invoice.count({
        where: { status: 'OVERDUE' },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, paidAt: true },
      }),
    ]);

    // Build monthly revenue (last 6 months)
    const revenueByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    }
    for (const p of allPaidInvoices) {
      if (p.paidAt) {
        const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
        if (key in revenueByMonth) {
          revenueByMonth[key] += Number(p.amount);
        }
      }
    }

    const outstandingBalance =
      Number(outstanding._sum.totalAmount ?? 0) -
      Number(outstanding._sum.paidAmount ?? 0);

    return {
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      overdueCount,
      paidThisMonth: Number(paidThisMonth._sum.totalAmount ?? 0),
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      })),
    };
  }

  async bulkCreate(dto: BulkCreateInvoiceDto, createdById: string) {
    const feeType = await this.prisma.feeType.findUnique({
      where: { id: dto.feeTypeId },
    });
    if (!feeType) throw new NotFoundException('Fee type not found');

    const invoices = await Promise.all(
      dto.parentIds.map((parentId) =>
        this.create(
          {
            parentProfileId: parentId,
            items: [
              {
                feeTypeId: dto.feeTypeId,
                description: feeType.name,
                quantity: 1,
                unitPrice: Number(feeType.amount),
              },
            ],
            dueDate: dto.dueDate,
          },
          createdById,
        ),
      ),
    );

    return { created: invoices.length, invoices };
  }

  private formatInvoice(inv: any) {
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      discountAmount: Number(inv.discountAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      balanceDue: Number(inv.totalAmount) - Number(inv.paidAmount),
      items: inv.items?.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      payments: inv.payments?.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }
}
