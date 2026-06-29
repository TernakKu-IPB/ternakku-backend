import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './modules/user/user.module';
import { FarmModule } from './modules/farm/farm.module';

@Module({
  imports: [CommonModule, AuthModule, UserModule, FarmModule],
  controllers: [AppController],
})
export class AppModule {}
