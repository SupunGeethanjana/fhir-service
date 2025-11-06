import { Test, TestingModule } from '@nestjs/testing';
import { GenericSearchService } from '../generic-search.service';

describe('GenericSearchService', () => {
  let service: GenericSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenericSearchService],
    }).compile();

    service = module.get<GenericSearchService>(GenericSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
