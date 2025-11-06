import { Test, TestingModule } from '@nestjs/testing';
import { MedicationStatementController } from './medication-statement.controller';
import { MedicationStatementService } from './medication-statement.service';

describe('MedicationStatementController', () => {
  let controller: MedicationStatementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicationStatementController],
      providers: [MedicationStatementService],
    }).compile();

    controller = module.get<MedicationStatementController>(
      MedicationStatementController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
