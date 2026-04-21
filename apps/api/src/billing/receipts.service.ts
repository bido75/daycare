import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListReceiptsDto } from './billing.dto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const lastReceipt = await this.prisma.receipt.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: 'desc' },
    });
    const nextSeq = lastReceipt
      ? parseInt(lastReceipt.receiptNumber.split('-')[2] || '0', 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  async create(paymentId: string, data: { invoiceId: string }) {
    // Check if receipt already exists for this payment
    const existing = await this.prisma.receipt.findUnique({
      where: { paymentId },
    });
    if (existing) return existing;

    const receiptNumber = await this.generateReceiptNumber();

    return this.prisma.receipt.create({
      data: {
        paymentId,
        invoiceId: data.invoiceId,
        receiptNumber,
        issuedAt: new Date(),
      },
    });
  }

  async findAll(filters: ListReceiptsDto, userRole?: string, userId?: string) {
    const { parentId, invoiceId, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (invoiceId) where.invoiceId = invoiceId;

    if (userRole === 'PARENT' && userId) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId },
      });
      if (parentProfile) {
        where.invoice = { parentId: parentProfile.id };
      } else {
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      }
    } else if (parentId) {
      where.invoice = { parentId };
    }

    if (dateFrom || dateTo) {
      where.issuedAt = {};
      if (dateFrom) where.issuedAt.gte = new Date(dateFrom);
      if (dateTo) where.issuedAt.lte = new Date(dateTo);
    }

    const [total, receipts] = await Promise.all([
      this.prisma.receipt.count({ where }),
      this.prisma.receipt.findMany({
        where,
        include: {
          payment: true,
          invoice: {
            include: {
              items: { include: { feeType: true } },
              parent: { include: { user: true } },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    return {
      data: receipts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: true,
        invoice: {
          include: {
            items: { include: { feeType: true } },
            parent: { include: { user: true } },
          },
        },
      },
    });

    if (!receipt) throw new NotFoundException(`Receipt ${id} not found`);
    return receipt;
  }

  async generateReceiptPdf(id: string): Promise<Buffer> {
    const receipt = await this.findOne(id);
    const invoice = receipt.invoice as any;
    const parent = invoice.parent;
    const payment = receipt.payment as any;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const primaryColor = rgb(0.31, 0.27, 0.9); // #4f46e5
    const darkColor = rgb(0.1, 0.1, 0.1);
    const grayColor = rgb(0.5, 0.5, 0.5);

    let y = height - 50;

    // Header
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: primaryColor,
    });

    page.drawText('Creative Kids Academy', {
      x: 40,
      y: height - 45,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText('RECEIPT', {
      x: width - 120,
      y: height - 45,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Receipt #: ${receipt.receiptNumber}`, {
      x: 40,
      y: height - 75,
      size: 11,
      font: regularFont,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(
      `Date: ${new Date(receipt.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      {
        x: width - 220,
        y: height - 75,
        size: 11,
        font: regularFont,
        color: rgb(0.9, 0.9, 0.9),
      },
    );

    y = height - 140;

    // Billed To
    page.drawText('BILLED TO', {
      x: 40,
      y,
      size: 10,
      font: boldFont,
      color: grayColor,
    });
    y -= 18;
    page.drawText(`${parent.firstName} ${parent.lastName}`, {
      x: 40,
      y,
      size: 12,
      font: boldFont,
      color: darkColor,
    });
    y -= 16;
    page.drawText(parent.user.email, {
      x: 40,
      y,
      size: 10,
      font: regularFont,
      color: darkColor,
    });
    if (parent.phone) {
      y -= 14;
      page.drawText(parent.phone, {
        x: 40,
        y,
        size: 10,
        font: regularFont,
        color: darkColor,
      });
    }

    // Invoice info
    page.drawText(`Invoice: ${invoice.invoiceNumber}`, {
      x: width - 220,
      y: height - 140,
      size: 11,
      font: regularFont,
      color: darkColor,
    });
    page.drawText(
      `Payment Method: ${payment.method}`,
      {
        x: width - 220,
        y: height - 156,
        size: 11,
        font: regularFont,
        color: darkColor,
      },
    );
    if (payment.transactionRef) {
      page.drawText(`Ref: ${payment.transactionRef}`, {
        x: width - 220,
        y: height - 172,
        size: 10,
        font: regularFont,
        color: grayColor,
      });
    }

    y -= 40;

    // Line items table header
    page.drawRectangle({
      x: 40,
      y: y - 5,
      width: width - 80,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText('Description', { x: 50, y: y + 5, size: 10, font: boldFont, color: darkColor });
    page.drawText('Qty', { x: 340, y: y + 5, size: 10, font: boldFont, color: darkColor });
    page.drawText('Unit Price', { x: 380, y: y + 5, size: 10, font: boldFont, color: darkColor });
    page.drawText('Total', { x: 480, y: y + 5, size: 10, font: boldFont, color: darkColor });

    y -= 20;

    // Line items
    for (const item of invoice.items) {
      page.drawText(item.description.substring(0, 45), {
        x: 50, y, size: 10, font: regularFont, color: darkColor,
      });
      page.drawText(String(item.quantity), { x: 340, y, size: 10, font: regularFont, color: darkColor });
      page.drawText(`$${Number(item.unitPrice).toFixed(2)}`, { x: 380, y, size: 10, font: regularFont, color: darkColor });
      page.drawText(`$${Number(item.totalPrice).toFixed(2)}`, { x: 480, y, size: 10, font: regularFont, color: darkColor });
      y -= 18;
    }

    // Divider
    y -= 10;
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 20;

    // Totals
    const totals = [
      { label: 'Subtotal', value: Number(invoice.subtotal) },
      { label: 'Tax', value: Number(invoice.taxAmount) },
      { label: 'Discount', value: -Number(invoice.discountAmount) },
    ];

    for (const t of totals) {
      page.drawText(t.label, { x: 380, y, size: 10, font: regularFont, color: grayColor });
      page.drawText(`$${t.value.toFixed(2)}`, { x: 480, y, size: 10, font: regularFont, color: darkColor });
      y -= 16;
    }

    y -= 5;
    page.drawText('Amount Paid', { x: 380, y, size: 12, font: boldFont, color: primaryColor });
    page.drawText(`$${Number(payment.amount).toFixed(2)}`, {
      x: 480, y, size: 12, font: boldFont, color: primaryColor,
    });

    // Footer
    page.drawText('Thank you for your payment!', {
      x: 40,
      y: 60,
      size: 12,
      font: boldFont,
      color: primaryColor,
    });
    page.drawText('Creative Kids Academy · This receipt was generated automatically.', {
      x: 40,
      y: 40,
      size: 9,
      font: regularFont,
      color: grayColor,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
