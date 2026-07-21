import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiPagination } from '../types';

@Injectable()
export class ModelPaginationService {
  constructor(private config: ConfigService) {}

  getServerPageLink(
    offset: number,
    limit: number,
    dataLength: number,
    endpoint: string,
    params?: URLSearchParams,
  ): ApiPagination & { hasNextPage: boolean; hasPrevPage: boolean } {
    const port = this.config.get<number>('PORT', 3000);
    const baseUrl = this.config.get<string>(
      'BASE_URL',
      `http://localhost:${port}`,
    );
    const hasPrevPage = offset !== 0;
    const hasNextPage = dataLength > limit;

    let prev: string | null = null;
    let next: string | null = null;
    const urlParams = new URLSearchParams(params);
    if (hasPrevPage) {
      urlParams.set('limit', limit.toString());
      urlParams.set('offset', (offset - limit).toString());
      prev = `${baseUrl}${endpoint}?${urlParams}`;
    }
    if (hasNextPage) {
      urlParams.set('limit', limit.toString());
      urlParams.set('offset', (offset + limit).toString());
      next = `${baseUrl}${endpoint}?${urlParams}`;
    }

    const paging =
      prev || next
        ? {
            paging: { prev, next },
          }
        : {
            paging: null,
          };
    return {
      ...paging,
      hasPrevPage,
      hasNextPage,
    };
  }
}
