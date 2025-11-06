import { Injectable, Logger } from '@nestjs/common';
import { Liquibase } from 'liquibase';
import { liquibaseConfig } from '../config/liquibase-config';

@Injectable()
export class LiquibaseRunnerService {
  private liquibaseInstance: Liquibase;
  private readonly logger = new Logger(LiquibaseRunnerService.name);
  private liquibaseEnabled: boolean;

  constructor() {
    this.liquibaseInstance = new Liquibase(liquibaseConfig);
    this.liquibaseEnabled = process.env.LIQUIBASE_ENABLED === 'true';
  }

  async update() {
    if (!this.liquibaseEnabled) {
      this.logger.log('Liquibase is disabled via environment configuration.');
      return;
    }

    try {
      await this.liquibaseInstance.update({});
      this.logger.log('Database updated successfully!');
    } catch (error) {
      this.logger.error('Error running Liquibase update:', error);
    }
  }

  async status() {
    if (!this.liquibaseEnabled) {
      this.logger.log('Liquibase is disabled via environment configuration.');
      return;
    }

    try {
      await this.liquibaseInstance.status();
      this.logger.log('Liquibase status checked successfully!');
    } catch (error) {
      this.logger.error('Error checking Liquibase status:', error);
    }
  }

  async rollback(tag: string) {
    if (!this.liquibaseEnabled) {
      this.logger.log('Liquibase is disabled via environment configuration.');
      return;
    }

    try {
      await this.liquibaseInstance.rollback({ tag });
      this.logger.log(`Liquibase rolled back to tag: ${tag}`);
    } catch (error) {
      this.logger.error('Error rolling back Liquibase:', error);
    }
  }
}
