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
import { ConditionTypeService } from './condition-type.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Role } from '../auth/decorator/role.decarator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConditionTypeValidation } from './condition-type.validation';
import type {
  CheckCodeConditionType,
  CreateConditionType,
  UpdateConditionType,
} from './condition-type.validation';
import { ConditionType } from './condition-type.model';
import { ApiResponse } from '../../types';

@Controller('admin/condition-types')
@UseGuards(AuthGuard)
@VerifiedAccount(true)
@Role('admin')
export class AdminConditionTypeController {
  constructor(private readonly service: ConditionTypeService) {}

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  async checkCode(
    @Query(new ZodValidationPipe(ConditionTypeValidation.CHECK_CODE))
    query: CheckCodeConditionType,
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
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.getTemplateDetail(id);
    return {
      message: 'Detail template jenis kondisi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(ConditionTypeValidation.CREATE))
    data: CreateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.createTemplate(data);
    return {
      message: 'Template jenis kondisi berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ConditionTypeValidation.UPDATE))
    data: UpdateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.updateTemplate(id, data);
    return {
      message: 'Template jenis kondisi berhasil diperbarui',
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
      message: 'Template jenis kondisi berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
