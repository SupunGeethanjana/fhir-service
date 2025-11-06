import { Test, TestingModule } from '@nestjs/testing';
import { CodeSystemController } from './code-system.controller';
import { CodeSystemService } from './code-system.service';

describe('CodeSystemController', () => {
    let controller: CodeSystemController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CodeSystemController],
            providers: [CodeSystemService],
        }).compile();

        controller = module.get<CodeSystemController>(CodeSystemController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
