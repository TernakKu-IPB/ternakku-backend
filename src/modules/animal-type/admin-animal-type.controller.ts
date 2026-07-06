import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnimalTypeService } from './animal-type.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Role } from '../auth/decorator/role.decarator'; // Sesuaikan path import Role Anda
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AnimalTypeValidation } from './animal-type.validation';
import type {
  CheckCodeAnimalType,
  CreateAnimalType,
  UpdateAnimalType,
} from './animal-type.validation';
import { AnimalType } from './animal-type.model';
import { ApiResponse } from '../../types';

@Controller('admin/animal-types')
@UseGuards(AuthGuard)
@VerifiedAccount(true)
@Role('admin')
export class AdminAnimalTypeController {
  constructor(private readonly service: AnimalTypeService) {}

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  async checkCode(
    @Query(new ZodValidationPipe(AnimalTypeValidation.CHECK_CODE))
    query: CheckCodeAnimalType,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const result = await this.service.checkTemplateCode(query.code);
    return {
      message: `Kode ${query.code} ${result.isAvailable ? 'belum' : 'sudah'} ada`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.getTemplateDetail(id);
    return {
      message: 'Detail template jenis hewan berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(AnimalTypeValidation.CREATE))
    data: CreateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.createTemplate(data);
    return {
      message: 'Template jenis hewan berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(AnimalTypeValidation.UPDATE))
    data: UpdateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.updateTemplate(id, data);
    return {
      message: 'Template jenis hewan berhasil diperbarui',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    const result = await this.service.deleteTemplate(id);
    return {
      message: 'Template jenis hewan berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
