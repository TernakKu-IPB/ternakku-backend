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
  GetAllConditionType,
  UpdateConditionType,
} from './condition-type.validation';
import { ConditionType } from './condition-type.model';
import { ApiPagination, ApiResponse } from '../../types';

@Controller('condition-types')
export class ConditionTypeController {
  constructor(private readonly service: ConditionTypeService) {}

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async checkCode(
    @Query(new ZodValidationPipe(ConditionTypeValidation.CHECK_CODE))
    query: CheckCodeConditionType,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const result = await this.service.checkCode(query.code);
    return {
      message: `Kode ${query.code} ${result.isAvailable ? 'belum' : 'sudah'} ada`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query(new ZodValidationPipe(ConditionTypeValidation.GET_ALL))
    query: GetAllConditionType,
  ): Promise<ApiResponse<{ conditionTypes: ConditionType[] } & ApiPagination>> {
    const result = await this.service.getAll(query);
    return {
      message: 'Template jenis kondisi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.getDetail(id);
    return {
      message: 'Detail template jenis kondisi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async create(
    @Body(new ZodValidationPipe(ConditionTypeValidation.CREATE))
    data: CreateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.create(data);
    return {
      message: 'Template jenis kondisi berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ConditionTypeValidation.UPDATE))
    data: UpdateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.update(id, data);
    return {
      message: 'Template jenis kondisi berhasil diperbarui',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    const result = await this.service.delete(id);
    return {
      message: 'Template jenis kondisi berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
