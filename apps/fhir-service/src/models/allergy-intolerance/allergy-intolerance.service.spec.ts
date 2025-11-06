import { Test, TestingModule } from '@nestjs/testing';
import { AllergyIntoleranceService } from './allergy-intolerance.service';

describe('AllergyIntoleranceService', () => {
  let service: AllergyIntoleranceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllergyIntoleranceService],
    }).compile();

    service = module.get<AllergyIntoleranceService>(AllergyIntoleranceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
