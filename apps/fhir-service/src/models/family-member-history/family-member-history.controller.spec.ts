import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMemberHistoryController } from './family-member-history.controller';
import { FamilyMemberHistoryService } from './family-member-history.service';

describe('FamilyMemberHistoryController', () => {
  let controller: FamilyMemberHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyMemberHistoryController],
      providers: [FamilyMemberHistoryService],
    }).compile();

    controller = module.get<FamilyMemberHistoryController>(
      FamilyMemberHistoryController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
