import { Test, TestingModule } from '@nestjs/testing';
import { LiquibaseRunnerService } from './liquibase-runner.service';

describe('LiquibaseRunnerService', () => {
  let service: LiquibaseRunnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiquibaseRunnerService],
    }).compile();

    service = module.get<LiquibaseRunnerService>(LiquibaseRunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
