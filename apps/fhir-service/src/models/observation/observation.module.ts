import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationController } from './observation.controller';
import { ObservationService } from './observation.service';
import { Observation } from './entities/observation.entity';
import { ObservationHistory } from './entities/observation-history.entity';
import { CoreModule } from '../../core/core.module';

/**
 * The NestJS module that encapsulates all components related to the Observation resource.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Observation, ObservationHistory]),
    forwardRef(() => CoreModule),
  ],
  controllers: [ObservationController],
  providers: [ObservationService],
  exports: [ObservationService],
})
export class ObservationModule {}