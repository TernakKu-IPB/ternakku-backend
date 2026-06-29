import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import winston from 'winston';
import { PrismaService } from './prisma.service';
import { JwtService } from './jwt.service';
import { MailService } from './mail.service';
import { ModelPaginationService } from './model-pagination.service';
import { FarmService } from './farm.service';
import { AnimalTypeService } from './animal-type.service';
import { ConditionTypeService } from './condition-type.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        level:
          config.get<'production' | 'development'>('NODE_ENV') === 'production'
            ? 'info'
            : 'debug',
        format: winston.format.json(),
        transports: [new winston.transports.Console()],
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '28d') },
      }),
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: config.getOrThrow<string>('MAILER_USER'),
            pass: config.getOrThrow<string>('MAILER_PASSWORD'),
          },
        },
        defaults: {
          from: config.getOrThrow<string>('MAILER_USER'),
        },
        template: {
          dir: join(__dirname, '..', '..', 'templates'),
          adapter: new EjsAdapter(),
        },
      }),
    }),
  ],
  providers: [
    PrismaService,
    JwtService,
    MailService,
    ModelPaginationService,
    FarmService,
    AnimalTypeService,
    ConditionTypeService,
  ],
  exports: [
    PrismaService,
    JwtService,
    MailService,
    ModelPaginationService,
    FarmService,
    AnimalTypeService,
    ConditionTypeService,
  ],
})
export class CommonModule {}
