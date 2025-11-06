import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompositionController } from './composition.controller';
import { CompositionService } from './composition.service';
import { Composition } from './entities/composition.entity';
import { CompositionHistory } from './entities/composition-history.entity';
import { CoreModule } from '../../core/core.module';

/** The NestJS module for the Composition resource. */
@Module({
  imports: [TypeOrmModule.forFeature([Composition, CompositionHistory]), forwardRef(() => CoreModule)],
  controllers: [CompositionController],
  providers: [CompositionService],
  exports: [CompositionService],
})
export class CompositionModule {}