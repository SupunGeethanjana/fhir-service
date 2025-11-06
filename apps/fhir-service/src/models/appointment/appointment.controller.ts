import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHistory } from './entities/appointment-history.entity';

/**
 * Controller for FHIR Appointment resources.
 * Extends GenericFhirController to provide standard FHIR REST API endpoints.
 * 
 * @extends GenericFhirController<Appointment, AppointmentHistory>
 */
@ApiTags('Appointment')
@Controller('Appointment')
export class AppointmentController extends GenericFhirController<Appointment, AppointmentHistory> {
  
  /**
   * Constructor for AppointmentController.
   * 
   * @param appointmentService - The service that handles Appointment business logic
   */
  constructor(private readonly appointmentService: AppointmentService) {
    super(appointmentService);
  }
}
