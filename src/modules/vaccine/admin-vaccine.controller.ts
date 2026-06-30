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
  UseGuards,
} from '@nestjs/common';
import { VaccineService } from './vaccine.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Role } from '../auth/decorator/role.decarator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { VaccineValidation } from './vaccine.validation';
import type { CreateVaccine, UpdateVaccine } from './vaccine.validation';
import { Vaccine } from './vaccine.model';
import { ApiResponse } from '../../types';

@Controller('admin/vaccines')
@UseGuards(AuthGuard)
@VerifiedAccount(true)
@Role('admin')
export class AdminVaccineController {
  constructor(private readonly service: VaccineService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.getTemplateDetail(id);
    return {
      message: 'Detail template vaksin berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(VaccineValidation.CREATE))
    data: CreateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.createTemplate(data);
    return {
      message: 'Template vaksin berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(VaccineValidation.UPDATE))
    data: UpdateVaccine,
  ): Promise<ApiResponse<Vaccine>> {
    const result = await this.service.updateTemplate(id, data);
    return {
      message: 'Template vaksin berhasil diperbarui',
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
      message: 'Template vaksin berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
