
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { MedicationStatementHistory } from './entities/medical-statement-history.entity';
import { MedicationStatement } from './entities/medical-statement.entity';
import { MedicationStatementController } from './medication-statement.controller';
import { MedicationStatementService } from './medication-statement.service';
@Module({
  imports: [TypeOrmModule.forFeature([MedicationStatement, MedicationStatementHistory]), forwardRef(() => CoreModule)],
  controllers: [MedicationStatementController],
  providers: [MedicationStatementService],
  exports: [MedicationStatementService],
})
export class MedicationStatementModule {}