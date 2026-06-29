import { Module } from '@nestjs/common';
import { LivestockService } from './livestock.service';
import { LivestockController } from './livestock.controller';

@Module({
  providers: [LivestockService],
  controllers: [LivestockController],
})
export class LivestockModule {}
