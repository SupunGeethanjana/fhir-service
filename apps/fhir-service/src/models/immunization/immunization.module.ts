import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ImmunizationHistory } from './entities/immunization-history.entity';
import { Immunization } from './entities/immunization.entity';
import { ImmunizationController } from './immunization.controller';
import { ImmunizationService } from './immunization.service';

/**
 * NestJS module for Immunization resources.
 * 
 * This module configures all the dependencies needed for Immunization resource management:
 * - TypeORM entities for data persistence
 * - Service layer for business logic
 * - Core module integration for shared search and database functionality
 * 
 * The module is designed to be imported by other modules (like GraphQL module)
 * that need access to Immunization functionality.
 */
@Module({
    imports: [
        // Register the TypeORM entities for this module
        TypeOrmModule.forFeature([
            Immunization,           // Current version table
            ImmunizationHistory,    // History/audit table
        ]),

        // Import the core module for shared functionality
        forwardRef(() => CoreModule),
    ],

    controllers: [
        // Register the controller for HTTP endpoints
        ImmunizationController,
    ],

    providers: [
        // Register the service for dependency injection
        ImmunizationService,
    ],

    exports: [
        // Export the service so other modules can use it
        ImmunizationService,
    ],
})
export class ImmunizationModule { }
