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
import { ConditionHistoryService } from './condition-history.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConditionHistoryValidation } from './condition-history.validation';
import type {
  CreateConditionHistory,
  UpdateConditionHistory,
  GetAllConditionHistory,
} from './condition-history.validation';
import { ConditionHistory } from './condition-history.model';
import { ApiPagination } from '../../types';

@Controller('condition-histories')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class ConditionHistoryController {
  constructor(private readonly service: ConditionHistoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(ConditionHistoryValidation.GET_ALL))
    query: GetAllConditionHistory,
  ): Promise<
    ApiResponse<{ conditionHistories: ConditionHistory[] } & ApiPagination>
  > {
    const result = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Riwayat kondisi ternak berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<ConditionHistory>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail riwayat kondisi ternak berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(ConditionHistoryValidation.CREATE))
    data: CreateConditionHistory,
  ): Promise<ApiResponse<ConditionHistory>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Riwayat kondisi ternak berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(ConditionHistoryValidation.UPDATE))
    data: UpdateConditionHistory,
  ): Promise<ApiResponse<ConditionHistory>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Riwayat kondisi ternak berhasil diperbarui',
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
      message: 'Riwayat kondisi ternak berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
