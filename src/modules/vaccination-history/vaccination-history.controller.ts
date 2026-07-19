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
import { VaccinationHistoryService } from './vaccination-history.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { VaccinationHistoryValidation } from './vaccination-history.validation';
import type {
  CreateVaccinationHistory,
  UpdateVaccinationHistory,
  GetAllVaccinationHistory,
} from './vaccination-history.validation';
import { VaccinationHistory } from './vaccination-history.model';
import { ApiPagination } from '../../types';

@Controller('vaccination-histories')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class VaccinationHistoryController {
  constructor(private readonly service: VaccinationHistoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(VaccinationHistoryValidation.GET_ALL))
    query: GetAllVaccinationHistory,
  ): Promise<
    ApiResponse<
      {
        vaccinationHistories: (VaccinationHistory & {
          vaccine: { id: number; name: string };
          livestock: { id: number; name: string | null; tagId: string | null };
        })[];
      } & ApiPagination
    >
  > {
    const result = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Riwayat vaksinasi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(VaccinationHistoryValidation.CREATE))
    data: CreateVaccinationHistory,
  ): Promise<ApiResponse<VaccinationHistory>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Riwayat vaksinasi berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<VaccinationHistory>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail riwayat vaksinasi berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(VaccinationHistoryValidation.UPDATE))
    data: UpdateVaccinationHistory,
  ): Promise<ApiResponse<VaccinationHistory>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Riwayat vaksinasi berhasil diperbarui',
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
      message: 'Riwayat vaksinasi berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
