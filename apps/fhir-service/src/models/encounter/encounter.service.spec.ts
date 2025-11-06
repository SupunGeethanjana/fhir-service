import { Test, TestingModule } from '@nestjs/testing';
import { EncounterService } from './encounter.service';

describe('EncounterService', () => {
  let service: EncounterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncounterService],
    }).compile();

    service = module.get<EncounterService>(EncounterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
