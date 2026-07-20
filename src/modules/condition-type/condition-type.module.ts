import { Module } from '@nestjs/common';
import { ConditionTypeService } from './condition-type.service';
import { ConditionTypeController } from './condition-type.controller';

@Module({
  providers: [ConditionTypeService],
  controllers: [ConditionTypeController],
})
export class ConditionTypeModule {}
