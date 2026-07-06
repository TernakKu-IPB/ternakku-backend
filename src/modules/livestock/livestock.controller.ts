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
import { LivestockService } from './livestock.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse, ApiPagination } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { LivestockValidation } from './livestock.validation';
import type {
  CreateLivestock,
  UpdateLivestock,
  GetAllLivestock,
} from './livestock.validation';
import { Livestock } from './livestock.model';

@Controller('livestocks')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class LivestockController {
  constructor(private readonly service: LivestockService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(LivestockValidation.GET_ALL))
    query: GetAllLivestock,
  ): Promise<
    ApiResponse<
      {
        livestocks: (Livestock & {
          animalType: { id: number; label: string };
        })[];
      } & ApiPagination
    >
  > {
    const result = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Data ternak berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Livestock>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail data ternak berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(LivestockValidation.CREATE))
    data: CreateLivestock,
  ): Promise<ApiResponse<Livestock>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Data ternak berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(LivestockValidation.UPDATE))
    data: UpdateLivestock,
  ): Promise<ApiResponse<Livestock>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Data ternak berhasil diperbarui',
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
      message: 'Data ternak berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
