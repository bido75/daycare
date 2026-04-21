export class AcademyProfileDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  description?: string;
  taxId?: string;
  licenseNumber?: string;
}

export class NotificationPreferencesDto {
  emailNotifications: boolean;
  smsNotifications: boolean;
  parentWelcomeEmail: boolean;
  attendanceAlerts: boolean;
  paymentReminders: boolean;
  paymentReminderDaysBefore: number;
  documentExpiryAlerts: boolean;
  documentExpiryDaysBefore: number;
  dailyReportNotify: boolean;
}

export class FeeStructureDto {
  currency: string;
  taxRate: number;
  lateFeeEnabled: boolean;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  autoInvoiceEnabled: boolean;
  invoiceDayOfMonth: number;
}

export class WeekdayScheduleDto {
  open: string;
  close: string;
  closed: boolean;
}

export class OperatingHoursDto {
  timezone: string;
  weekdays: {
    monday: WeekdayScheduleDto;
    tuesday: WeekdayScheduleDto;
    wednesday: WeekdayScheduleDto;
    thursday: WeekdayScheduleDto;
    friday: WeekdayScheduleDto;
    saturday: WeekdayScheduleDto;
    sunday: WeekdayScheduleDto;
  };
  holidays: Array<{ date: string; name: string }>;
  lateCheckInMinutes: number;
}

export class DocumentRequirementsDto {
  requiredDocuments: Array<{
    type: string;
    label: string;
    required: boolean;
    expiryRequired: boolean;
  }>;
}

export class UpdateSettingDto {
  value: any;
}
