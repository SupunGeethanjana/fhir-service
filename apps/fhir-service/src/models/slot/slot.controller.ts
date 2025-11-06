import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { SlotHistory } from './entities/slot-history.entity';
import { Slot } from './entities/slot.entity';
import { SlotService } from './slot.service';

/**
 * Slot Resource Controller
 * 
 * Provides FHIR-compliant Slot resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 * - Slot-specific endpoints for scheduling
 * 
 * All endpoints follow FHIR R4 specification for Slot resources.
 * 
 * The Slot resource provides a time-slot that can be booked using an appointment.
 * It defines when a service or resource is available for booking.
 */
@ApiTags('Slot')
@Controller('Slot')
export class SlotController extends GenericFhirController<Slot, SlotHistory> {
    constructor(private readonly slotService: SlotService) {
        // Pass the injected service to the parent controller's constructor.
        super(slotService);
    }

    // Additional Slot-specific endpoints can be added here
    // Example:
    // @Get('available')
    // async getAvailableSlots(@Query() query: any) {
    //   return this.slotService.findAvailableSlots(query);
    // }
    //
    // @Get('by-schedule/:scheduleId')
    // async getBySchedule(@Param('scheduleId') scheduleId: string) {
    //   return this.slotService.findBySchedule(scheduleId);
    // }
}
