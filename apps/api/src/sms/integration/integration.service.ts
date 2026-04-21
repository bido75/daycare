import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsProviderFactory } from '../providers/provider-factory';
import { CreateProviderDto, UpdateProviderDto } from './integration.dto';

function maskSecret(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

function maskConfig(config: any): any {
  if (!config) return {};
  return {
    ...config,
    authToken: config.authToken ? maskSecret(config.authToken) : undefined,
    apiKey: config.apiKey ? maskSecret(config.apiKey) : undefined,
    accountSid: config.accountSid ? maskSecret(config.accountSid) : undefined,
    fromNumber: config.fromNumber,
  };
}

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: SmsProviderFactory,
  ) {}

  async createProvider(dto: CreateProviderDto) {
    const existing = await this.prisma.smsProvider.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Provider '${dto.name}' already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.smsProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const provider = await this.prisma.smsProvider.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        config: dto.config as any,
        contexts: dto.contexts,
        isActive: dto.isActive ?? false,
        isDefault: dto.isDefault ?? false,
      },
    });

    return { ...provider, config: maskConfig(provider.config) };
  }

  async updateProvider(id: string, dto: UpdateProviderDto) {
    const existing = await this.prisma.smsProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Provider not found');

    const updateData: any = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.contexts !== undefined) updateData.contexts = dto.contexts;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.config !== undefined) {
      const currentConfig = existing.config as any;
      const newConfig: any = { ...currentConfig };

      if (dto.config.fromNumber !== undefined) newConfig.fromNumber = dto.config.fromNumber;
      if (dto.config.accountSid && !dto.config.accountSid.startsWith('****'))
        newConfig.accountSid = dto.config.accountSid;
      if (dto.config.authToken && !dto.config.authToken.startsWith('****'))
        newConfig.authToken = dto.config.authToken;
      if (dto.config.username !== undefined) newConfig.username = dto.config.username;
      if (dto.config.apiKey && !dto.config.apiKey.startsWith('****'))
        newConfig.apiKey = dto.config.apiKey;

      updateData.config = newConfig;
    }

    const updated = await this.prisma.smsProvider.update({
      where: { id },
      data: updateData,
    });

    return { ...updated, config: maskConfig(updated.config) };
  }

  async deleteProvider(id: string) {
    const existing = await this.prisma.smsProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Provider not found');

    await this.prisma.smsProvider.delete({ where: { id } });
    return { deleted: true };
  }

  async getProviders() {
    const providers = await this.prisma.smsProvider.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { smsLogs: true } },
      },
    });

    return providers.map((p) => ({
      ...p,
      config: maskConfig(p.config),
    }));
  }

  async getProvider(id: string) {
    const provider = await this.prisma.smsProvider.findUnique({
      where: { id },
      include: { _count: { select: { smsLogs: true } } },
    });

    if (!provider) throw new NotFoundException('Provider not found');

    return { ...provider, config: maskConfig(provider.config) };
  }

  async setDefault(id: string) {
    const existing = await this.prisma.smsProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Provider not found');

    await this.prisma.smsProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    const updated = await this.prisma.smsProvider.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });

    return { ...updated, config: maskConfig(updated.config) };
  }

  async testProvider(id: string, testPhoneNumber: string) {
    const providerImpl = await this.providerFactory.getProviderById(id);
    if (!providerImpl) throw new NotFoundException('Provider not found');

    const result = await providerImpl.sendSms({
      internalMessageId: `test_${Date.now()}`,
      to: testPhoneNumber,
      body: 'This is a test message from Creative Kids Academy SMS integration. Your provider is configured correctly!',
      attempt: 1,
      meta: { context: 'test' },
    });

    return {
      success: result.status !== 'failed',
      status: result.status,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    };
  }

  async getProviderForContext(context: string) {
    const record = await this.prisma.smsProvider.findFirst({
      where: { isActive: true, contexts: { has: context } },
    });

    if (!record) {
      return this.prisma.smsProvider.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    return record;
  }
}
