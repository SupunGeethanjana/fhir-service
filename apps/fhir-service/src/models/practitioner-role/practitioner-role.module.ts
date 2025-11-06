import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { PractitionerRoleHistory } from './entities/practitioner-role-history.entity';
import { PractitionerRole } from './entities/practitioner-role.entity';
import { PractitionerRoleController } from './practitioner-role.controller';
import { PractitionerRoleService } from './practitioner-role.service';

/**
 * NestJS module for PractitionerRole resources.
 * 
 * This module configures all the dependencies needed for PractitionerRole resource management:
 * - TypeORM entities for data persistence
 * - Service layer for business logic
 * - Core module integration for shared search and database functionality
 * 
 * The module is designed to be imported by other modules (like GraphQL module)
 * that need access to PractitionerRole functionality.
 */
@Module({
    imports: [
        // Register the TypeORM entities for this module
        TypeOrmModule.forFeature([
            PractitionerRole,           // Current version table
            PractitionerRoleHistory,    // History/audit table
        ]),

        // Import the core module for shared functionality
        forwardRef(() => CoreModule),
    ],

    controllers: [
        // Register the controller for HTTP endpoints
        PractitionerRoleController,
    ],

    providers: [
        // Register the service for dependency injection
        PractitionerRoleService,
    ],

    exports: [
        // Export the service so other modules can use it
        PractitionerRoleService,
    ],
})
export class PractitionerRoleModule { }
