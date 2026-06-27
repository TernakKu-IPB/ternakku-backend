import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import morgan from 'morgan';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<'production' | 'development'>(
    'NODE_ENV',
    'development',
  );
  const baseUrl = configService.get<string>('BASE_URL', 'http://localhost');

  // Logger - Winston
  const loggerService = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(loggerService);

  // Logger - Morgan
  if (environment === 'production') {
    app.use(morgan('combined'));
  } else {
    app.use(morgan('dev'));
  }

  // Template engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Listen server
  await app.listen(port, () => {
    loggerService.log(
      `Server running in ${environment} mode at ${baseUrl}:${port}`,
    );
  });
}

void bootstrap();
