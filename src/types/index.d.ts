import { HttpStatus } from '@nestjs/common';

export interface ApiResponse<T> {
  message: string;
  data: T;
  statusCode: HttpStatus;
}

export type ApiPagination = {
  paging: {
    prev: string | null;
    next: string | null;
  } | null;
};

export interface JwtPayload {
  sub: number;
  type: 'access_token' | 'reset_password' | 'refresh_token';
}
