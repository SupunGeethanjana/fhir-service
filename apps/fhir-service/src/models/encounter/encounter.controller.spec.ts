import { Test, TestingModule } from '@nestjs/testing';
import { EncounterController } from './encounter.controller';
import { EncounterService } from './encounter.service';

describe('EncounterController', () => {
  let controller: EncounterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncounterController],
      providers: [EncounterService],
    }).compile();

    controller = module.get<EncounterController>(EncounterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
