import { Test, TestingModule } from '@nestjs/testing';
import { MedicationStatementService } from './medication-statement.service';

describe('MedicationStatementService', () => {
  let service: MedicationStatementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicationStatementService],
    }).compile();

    service = module.get<MedicationStatementService>(MedicationStatementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
