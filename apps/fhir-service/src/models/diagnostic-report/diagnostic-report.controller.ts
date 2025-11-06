import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { DiagnosticReportService } from './diagnostic-report.service';
import { DiagnosticReport } from './entities/diagnostic-report.entity';
import { DiagnosticReportHistory } from './entities/diagnostic-report-history.entity';

/**
 * Concrete controller for the DiagnosticReport resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('DiagnosticReport')
@Controller('DiagnosticReport') decorator sets the base path for all routes
 * in this controller to `/DiagnosticReport`.
 */
@ApiTags('DiagnosticReport')
@Controller('DiagnosticReport')
export class DiagnosticReportController extends GenericFhirController<DiagnosticReport, DiagnosticReportHistory> {
  constructor(private readonly diagnosticReportService: DiagnosticReportService) {
    // Pass the injected service to the parent controller's constructor.
    super(diagnosticReportService);
  }
}