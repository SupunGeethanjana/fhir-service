import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllergyIntoleranceController } from './allergy-intolerance.controller';
import { AllergyIntoleranceService } from './allergy-intolerance.service';
import { AllergyIntolerance } from './entities/allergy-intolerance.entity';
import { AllergyIntoleranceHistory } from './entities/allergy-intolerance-history.entity';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [TypeOrmModule.forFeature([AllergyIntolerance, AllergyIntoleranceHistory]), forwardRef(() => CoreModule)],
  controllers: [AllergyIntoleranceController],
  providers: [AllergyIntoleranceService],
  exports: [AllergyIntoleranceService],
})
export class AllergyIntoleranceModule {}
