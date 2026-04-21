import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailProviderFactory } from '../providers/provider-factory';
import {
  CreateEmailProviderDto,
  UpdateEmailProviderDto,
} from './email-integration.dto';

function maskSecret(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

function maskConfig(config: any): any {
  if (!config) return {};
  return {
    ...config,
    apiKey: config.apiKey ? maskSecret(config.apiKey) : undefined,
    pass: config.pass ? maskSecret(config.pass) : undefined,
  };
}

@Injectable()
export class EmailIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: EmailProviderFactory,
  ) {}

  async createProvider(dto: CreateEmailProviderDto) {
    const existing = await this.prisma.emailProvider.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Email provider '${dto.name}' already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.emailProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const provider = await this.prisma.emailProvider.create({
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

  async updateProvider(id: string, dto: UpdateEmailProviderDto) {
    const existing = await this.prisma.emailProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Email provider not found');

    const updateData: any = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.contexts !== undefined) updateData.contexts = dto.contexts;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.config !== undefined) {
      const currentConfig = existing.config as any;
      const newConfig: any = { ...currentConfig };

      if (dto.config.fromEmail !== undefined) newConfig.fromEmail = dto.config.fromEmail;
      if (dto.config.fromName !== undefined) newConfig.fromName = dto.config.fromName;
      if (dto.config.apiKey && !dto.config.apiKey.startsWith('****'))
        newConfig.apiKey = dto.config.apiKey;
      if (dto.config.host !== undefined) newConfig.host = dto.config.host;
      if (dto.config.port !== undefined) newConfig.port = dto.config.port;
      if (dto.config.user !== undefined) newConfig.user = dto.config.user;
      if (dto.config.pass && !dto.config.pass.startsWith('****'))
        newConfig.pass = dto.config.pass;
      if (dto.config.encryption !== undefined) newConfig.encryption = dto.config.encryption;

      updateData.config = newConfig;
    }

    const updated = await this.prisma.emailProvider.update({
      where: { id },
      data: updateData,
    });

    return { ...updated, config: maskConfig(updated.config) };
  }

  async deleteProvider(id: string) {
    const existing = await this.prisma.emailProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Email provider not found');
    await this.prisma.emailProvider.delete({ where: { id } });
    return { deleted: true };
  }

  async getProviders() {
    const providers = await this.prisma.emailProvider.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return providers.map((p) => ({ ...p, config: maskConfig(p.config) }));
  }

  async getProvider(id: string) {
    const provider = await this.prisma.emailProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Email provider not found');
    return { ...provider, config: maskConfig(provider.config) };
  }

  async setDefault(id: string) {
    const existing = await this.prisma.emailProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Email provider not found');

    await this.prisma.emailProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    const updated = await this.prisma.emailProvider.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });

    return { ...updated, config: maskConfig(updated.config) };
  }

  async testProvider(id: string, testEmail: string) {
    const providerImpl = await this.providerFactory.getProviderById(id);
    if (!providerImpl) throw new NotFoundException('Email provider not found');

    const result = await providerImpl.sendEmail({
      to: testEmail,
      subject: 'Test Email — Creative Kids Academy Integration',
      html: `<p>This is a test email from the Creative Kids Academy admin panel. Your email provider is configured correctly!</p>`,
      text: 'This is a test email from Creative Kids Academy. Your email provider is configured correctly!',
    });

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }
}
