import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { OrganizationHistory } from './entities/organization-history.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

/** The NestJS module for the Organization resource. */
@Module({
    imports: [TypeOrmModule.forFeature([Organization, OrganizationHistory]), forwardRef(() => CoreModule)],
    controllers: [OrganizationController],
    providers: [OrganizationService],
    exports: [OrganizationService],
})
export class OrganizationModule { }
