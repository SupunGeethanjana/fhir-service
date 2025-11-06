import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { DiagnosticReportController } from './diagnostic-report.controller';
import { DiagnosticReportService } from './diagnostic-report.service';
import { DiagnosticReport } from './entities/diagnostic-report.entity';
import { DiagnosticReportHistory } from './entities/diagnostic-report-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosticReport, DiagnosticReportHistory]), forwardRef(() => CoreModule)],
  controllers: [DiagnosticReportController],
  providers: [DiagnosticReportService],
  exports: [DiagnosticReportService],
})
export class DiagnosticReportModule {}
