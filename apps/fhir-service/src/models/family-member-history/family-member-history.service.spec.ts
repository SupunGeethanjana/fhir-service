import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMemberHistoryService } from './family-member-history.service';

describe('FamilyMemberHistoryService', () => {
  let service: FamilyMemberHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyMemberHistoryService],
    }).compile();

    service = module.get<FamilyMemberHistoryService>(
      FamilyMemberHistoryService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
