import { Test, TestingModule } from '@nestjs/testing';
import { ValueSetController } from './value-set.controller';
import { ValueSetService } from './value-set.service';

describe('ValueSetController', () => {
    let controller: ValueSetController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ValueSetController],
            providers: [ValueSetService],
        }).compile();

        controller = module.get<ValueSetController>(ValueSetController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
