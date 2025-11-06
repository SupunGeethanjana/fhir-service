import { Test, TestingModule } from '@nestjs/testing';
import { AllergyIntoleranceController } from './allergy-intolerance.controller';
import { AllergyIntoleranceService } from './allergy-intolerance.service';

describe('AllergyIntoleranceController', () => {
  let controller: AllergyIntoleranceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllergyIntoleranceController],
      providers: [AllergyIntoleranceService],
    }).compile();

    controller = module.get<AllergyIntoleranceController>(
      AllergyIntoleranceController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
