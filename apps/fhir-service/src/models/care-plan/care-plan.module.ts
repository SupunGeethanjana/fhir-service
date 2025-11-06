import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { CarePlanController } from './care-plan.controller';
import { CarePlanService } from './care-plan.service';
import { CarePlanHistory } from './entities/care-plan-history.entity';
import { CarePlan } from './entities/care-plan.entity';

/**
 * NestJS module for CarePlan FHIR resource management.
 * 
 * This module encapsulates all CarePlan-related functionality including:
 * - REST API endpoints via CarePlanController
 * - Business logic via CarePlanService
 * - Database entities via CarePlan and CarePlanHistory
 * - Integration with core FHIR services
 * 
 * The module uses forwardRef() for CoreModule to handle circular dependencies
 * that may arise from the interdependent nature of FHIR resource services.
 * 
 * CarePlan resources are used for:
 * - Treatment planning and care coordination
 * - Goal setting and tracking
 * - Care team communication
 * - Patient engagement workflows
 * - Clinical decision support
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([CarePlan, CarePlanHistory]),
        forwardRef(() => CoreModule)
    ],
    controllers: [CarePlanController],
    providers: [CarePlanService],
    exports: [CarePlanService],
})
export class CarePlanModule { }
