import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';
import { Condition } from './entities/condition.entity';
import { ConditionHistory } from './entities/condition-history.entity';
import { CoreModule } from '../../core/core.module';

/** The NestJS module for the Condition resource. */
@Module({
  imports: [TypeOrmModule.forFeature([Condition, ConditionHistory]), forwardRef(() => CoreModule)],
  controllers: [ConditionController],
  providers: [ConditionService],
  exports: [ConditionService],
})
export class ConditionModule {}