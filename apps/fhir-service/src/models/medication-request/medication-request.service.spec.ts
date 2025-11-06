import { Test, TestingModule } from '@nestjs/testing';
import { MedicationRequestService } from './medication-request.service';

describe('MedicationRequestService', () => {
  let service: MedicationRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicationRequestService],
    }).compile();

    service = module.get<MedicationRequestService>(MedicationRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
