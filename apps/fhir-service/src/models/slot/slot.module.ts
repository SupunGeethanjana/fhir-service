import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { SlotHistory } from './entities/slot-history.entity';
import { Slot } from './entities/slot.entity';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';

/**
 * NestJS module for Slot resources.
 * 
 * This module configures all the dependencies needed for Slot resource management:
 * - TypeORM entities for data persistence
 * - Service layer for business logic
 * - Core module integration for shared search and database functionality
 * 
 * The module is designed to be imported by other modules (like GraphQL module)
 * that need access to Slot functionality.
 */
@Module({
    imports: [
        // Register the TypeORM entities for this module
        TypeOrmModule.forFeature([
            Slot,           // Current version table
            SlotHistory,    // History/audit table
        ]),

        // Import the core module for shared functionality
        forwardRef(() => CoreModule),
    ],

    controllers: [
        // Register the controller for HTTP endpoints
        SlotController,
    ],

    providers: [
        // Register the service for dependency injection
        SlotService,
    ],

    exports: [
        // Export the service so other modules can use it
        SlotService,
    ],
})
export class SlotModule { }
