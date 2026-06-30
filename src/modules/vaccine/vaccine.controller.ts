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
import { VaccineService } from './vaccine.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse, ApiPagination } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { VaccineValidation } from './vaccine.validation';
import type {
  CheckCodeVaccine,
  CreateVaccine,
  GetAllVaccine,
  UpdateVaccine,
} from './vaccine.validation';
import { Vaccine } from './vaccine.model';

@Controller('vaccines')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class VaccineController {
  constructor(private readonly service: VaccineService) {}

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  async getAllTemplates(
    @Query(new ZodValidationPipe(VaccineValidation.GET_ALL))
    query: GetAllVaccine,
  ): Promise<ApiResponse<{ vaccines: Vaccine[] } & ApiPagination>> {
    const result = await this.service.getAllTemplates(query);
    return {
      message: 'Template vaksin berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(VaccineValidation.GET_ALL))
    query: GetAllVaccine,
  ): Promise<ApiResponse<{ vaccines: Vaccine[] } & ApiPagination>> {
    const data = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Data vaksin berhasil diambil',
      data,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail vaksin berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  async checkCode(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(VaccineValidation.CHECK_CODE))
    query: CheckCodeVaccine,
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
    @Body(new ZodValidationPipe(VaccineValidation.CREATE))
    data: CreateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Vaksin berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(VaccineValidation.UPDATE))
    data: UpdateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Vaksin berhasil diperbarui',
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
      message: 'Vaksin berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
