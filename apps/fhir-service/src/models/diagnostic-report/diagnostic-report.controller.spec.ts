import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticReportController } from './diagnostic-report.controller';
import { DiagnosticReportService } from './diagnostic-report.service';

describe('DiagnosticReportController', () => {
  let controller: DiagnosticReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticReportController],
      providers: [DiagnosticReportService],
    }).compile();

    controller = module.get<DiagnosticReportController>(
      DiagnosticReportController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
