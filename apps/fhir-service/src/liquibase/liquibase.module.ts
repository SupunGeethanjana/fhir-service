import { Module } from '@nestjs/common';
import { LiquibaseRunnerService } from './liquibase-runner.service';

@Module({
  providers: [LiquibaseRunnerService],
  exports: [LiquibaseRunnerService],
})
export class LiquibaseModule {}
