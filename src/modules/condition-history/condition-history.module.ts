import { Module } from '@nestjs/common';
import { ConditionHistoryService } from './condition-history.service';
import { ConditionHistoryController } from './condition-history.controller';

@Module({
  providers: [ConditionHistoryService],
  controllers: [ConditionHistoryController],
})
export class ConditionHistoryModule {}
