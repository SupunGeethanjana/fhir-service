import { PartialType } from '@nestjs/swagger';
import { CreateDiagnosticReportDto } from './create-diagnostic-report.dto';

export class UpdateDiagnosticReportDto extends PartialType(
  CreateDiagnosticReportDto
) {}
