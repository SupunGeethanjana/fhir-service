import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticReportService } from './diagnostic-report.service';

describe('DiagnosticReportService', () => {
  let service: DiagnosticReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagnosticReportService],
    }).compile();

    service = module.get<DiagnosticReportService>(DiagnosticReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
