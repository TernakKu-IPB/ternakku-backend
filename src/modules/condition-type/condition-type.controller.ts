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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConditionTypeService } from './condition-type.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse, ApiPagination } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConditionTypeValidation } from './condition-type.validation';
import type {
  CheckCodeConditionType,
  CreateConditionType,
  GetAllConditionType,
  UpdateConditionType,
} from './condition-type.validation';
import { ConditionType } from './condition-type.model';

@Controller('condition-types')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class ConditionTypeController {
  constructor(private readonly service: ConditionTypeService) {}

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  async getAllTemplates(
    @Query(new ZodValidationPipe(ConditionTypeValidation.GET_ALL))
    query: GetAllConditionType,
  ): Promise<ApiResponse<{ conditionTypes: ConditionType[] } & ApiPagination>> {
    const result = await this.service.getAllTemplates(query);
    return {
      message: 'Template jenis kondisi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(ConditionTypeValidation.GET_ALL))
    query: GetAllConditionType,
  ): Promise<ApiResponse<{ conditionTypes: ConditionType[] } & ApiPagination>> {
    const data = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Data jenis kondisi berhasil diambil',
      data,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail jenis kondisi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  async checkCode(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(ConditionTypeValidation.CHECK_CODE))
    query: CheckCodeConditionType,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const result = await this.service.checkCode(req.user.sub, query.code);
    return {
      message: `Kode ${query.code} ${result.isAvailable ? 'belum' : 'sudah'} ada`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(ConditionTypeValidation.CREATE))
    data: CreateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Jenis kondisi berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ConditionTypeValidation.UPDATE))
    data: UpdateConditionType,
  ): Promise<ApiResponse<ConditionType>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Jenis kondisi berhasil diperbarui',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    const result = await this.service.delete(req.user.sub, id);
    return {
      message: 'Jenis kondisi berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
