import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, ListDocumentsDto, VerifyDocumentDto } from './documents.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.upload(file, dto, user.userId);
  }

  @Get('expiring')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF')
  getExpiring(@Query('days') days?: string) {
    return this.documentsService.getExpiringDocuments(days ? parseInt(days, 10) : 30);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findAll(@Query() query: ListDocumentsDto, @CurrentUser() user: any) {
    return this.documentsService.findAll(query, user.role, user.userId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'STAFF', 'PARENT')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  verify(@Param('id') id: string, @Body() dto: VerifyDocumentDto) {
    return this.documentsService.verify(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
