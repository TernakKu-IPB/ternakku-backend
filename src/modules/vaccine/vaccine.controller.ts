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
import { VaccineService } from './vaccine.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Role } from '../auth/decorator/role.decarator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { VaccineValidation } from './vaccine.validation';
import type {
  CheckCodeVaccine,
  CreateVaccine,
  GetAllVaccine,
  UpdateVaccine,
} from './vaccine.validation';
import { Vaccine } from './vaccine.model';
import { ApiPagination, ApiResponse } from '../../types';

@Controller('vaccines')
export class VaccineController {
  constructor(private readonly service: VaccineService) {}

  @Get('check-code')
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async checkCode(
    @Query(new ZodValidationPipe(VaccineValidation.CHECK_CODE))
    query: CheckCodeVaccine,
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
    @Query(new ZodValidationPipe(VaccineValidation.GET_ALL))
    query: GetAllVaccine,
  ): Promise<ApiResponse<{ vaccines: Vaccine[] } & ApiPagination>> {
    const result = await this.service.getAll(query);
    return {
      message: 'Template vaksin berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.getDetail(id);
    return {
      message: 'Detail template vaksin berhasil diambil',
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
    @Body(new ZodValidationPipe(VaccineValidation.CREATE))
    data: CreateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.create(data);
    return {
      message: 'Template vaksin berhasil ditambahkan',
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
    @Body(new ZodValidationPipe(VaccineValidation.UPDATE))
    data: UpdateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.update(id, data);
    return {
      message: 'Template vaksin berhasil diperbarui',
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
      message: 'Template vaksin berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
