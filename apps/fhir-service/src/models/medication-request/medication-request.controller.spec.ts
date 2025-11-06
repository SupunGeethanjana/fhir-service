import { Test, TestingModule } from '@nestjs/testing';
import { MedicationRequestController } from './medication-request.controller';
import { MedicationRequestService } from './medication-request.service';

describe('MedicationRequestController', () => {
  let controller: MedicationRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicationRequestController],
      providers: [MedicationRequestService],
    }).compile();

    controller = module.get<MedicationRequestController>(
      MedicationRequestController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
