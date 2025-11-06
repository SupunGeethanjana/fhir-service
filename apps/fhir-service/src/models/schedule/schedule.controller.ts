import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ScheduleHistory } from './entities/schedule-history.entity';
import { Schedule } from './entities/schedule.entity';
import { ScheduleService } from './schedule.service';

/**
 * Schedule Resource Controller
 *
 * Provides FHIR-compliant Schedule resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 *
 * All endpoints follow FHIR R4 specification for Schedule resources.
 */
@ApiTags('Schedule')
@Controller('Schedule')
export class ScheduleController extends GenericFhirController<Schedule, ScheduleHistory> {
    constructor(private readonly scheduleService: ScheduleService) {
        super(scheduleService);
    }

    // Additional Schedule-specific endpoints can be added here
}
