import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ServiceRequestService } from './service-request.service';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestHistory } from './entities/service-request-history.entity';

/**
 * Controller for FHIR ServiceRequest resources.
 * Extends GenericFhirController to provide standard FHIR REST API endpoints.
 * 
 * @extends GenericFhirController<ServiceRequest, ServiceRequestHistory>
 */
@ApiTags('ServiceRequest')
@Controller('ServiceRequest')
export class ServiceRequestController extends GenericFhirController<ServiceRequest, ServiceRequestHistory> {
  
  /**
   * Constructor for ServiceRequestController.
   * 
   * @param serviceRequestService - The service that handles ServiceRequest business logic
   */
  constructor(private readonly serviceRequestService: ServiceRequestService) {
    super(serviceRequestService);
  }
}
