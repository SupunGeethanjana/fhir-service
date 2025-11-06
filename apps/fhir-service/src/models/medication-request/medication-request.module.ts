import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationRequestController } from './medication-request.controller';
import { MedicationRequestService } from './medication-request.service';
import { MedicationRequest } from './entities/medication-request.entity';
import { MedicationRequestHistory } from './entities/medication-request-history.entity';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicationRequest, MedicationRequestHistory]), forwardRef(() => CoreModule)],
  controllers: [MedicationRequestController],
  providers: [MedicationRequestService],
  exports: [MedicationRequestService],
})
export class MedicationRequestModule {}
