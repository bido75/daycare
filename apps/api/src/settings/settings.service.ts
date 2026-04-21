import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<string, any> = {
  academy_profile: {
    name: 'Creative Kids Academy',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    description: '',
    taxId: '',
    licenseNumber: '',
  },
  notification_preferences: {
    emailNotifications: true,
    smsNotifications: false,
    parentWelcomeEmail: true,
    attendanceAlerts: true,
    paymentReminders: true,
    paymentReminderDaysBefore: 3,
    documentExpiryAlerts: true,
    documentExpiryDaysBefore: 30,
    dailyReportNotify: true,
  },
  fee_structure: {
    currency: 'USD',
    taxRate: 0,
    lateFeeEnabled: false,
    lateFeeAmount: 25,
    lateFeeGraceDays: 5,
    autoInvoiceEnabled: false,
    invoiceDayOfMonth: 1,
  },
  operating_hours: {
    timezone: 'America/New_York',
    weekdays: {
      monday: { open: '07:00', close: '18:00', closed: false },
      tuesday: { open: '07:00', close: '18:00', closed: false },
      wednesday: { open: '07:00', close: '18:00', closed: false },
      thursday: { open: '07:00', close: '18:00', closed: false },
      friday: { open: '07:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '14:00', closed: true },
      sunday: { open: '08:00', close: '14:00', closed: true },
    },
    holidays: [],
    lateCheckInMinutes: 15,
  },
  document_requirements: {
    requiredDocuments: [
      { type: 'BIRTH_CERT', label: 'Birth Certificate', required: true, expiryRequired: false },
      { type: 'IMMUNIZATION', label: 'Immunization Records', required: true, expiryRequired: true },
      { type: 'MEDICAL', label: 'Medical Form', required: true, expiryRequired: true },
      { type: 'ID_CARD', label: 'Parent/Guardian ID', required: false, expiryRequired: false },
      { type: 'ENROLLMENT_FORM', label: 'Enrollment Form', required: true, expiryRequired: false },
    ],
  },
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<any> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) return { success: true, data: this.getDefaults(key) };
    return { success: true, data: setting.value };
  }

  async set(key: string, value: any): Promise<any> {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return { success: true, data: setting.value };
  }

  async getAll(): Promise<any> {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, any> = {};

    // Fill in defaults for keys not in DB
    for (const key of Object.keys(DEFAULTS)) {
      result[key] = DEFAULTS[key];
    }

    // Override with DB values
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return { success: true, data: result };
  }

  getDefaults(key: string): any {
    return DEFAULTS[key] ?? null;
  }
}
