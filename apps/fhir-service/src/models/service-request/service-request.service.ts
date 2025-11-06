import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ServiceRequestHistory } from './entities/service-request-history.entity';
import { ServiceRequest } from './entities/service-request.entity';

/**
 * Concrete service for the ServiceRequest resource.
 * 
 * This service is responsible for handling all business logic related to ServiceRequest resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on ServiceRequest-specific configurations.
 */
@Injectable()
export class ServiceRequestService extends GenericFhirService<ServiceRequest, ServiceRequestHistory> {

  /**
   * Sets the specific FHIR resource type that this service manages.
   * The generic service uses this string to correctly handle resourceType properties.
   */
  protected readonly resourceType = 'ServiceRequest';

  /**
   * The constructor injects all necessary dependencies.
   * @param repo The TypeORM repository for the `ServiceRequest` entity (the current table).
   * @param historyRepo The TypeORM repository for the `ServiceRequestHistory` entity.
   * @param dataSource The main TypeORM DataSource, used for managing database transactions.
   * @param searchService The shared, core search service for handling search logic.
   */
  constructor(
    @InjectRepository(ServiceRequest)
    protected readonly repo: Repository<ServiceRequest>,

    @InjectRepository(ServiceRequestHistory)
    protected readonly historyRepo: Repository<ServiceRequestHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Pass the core dependencies up to the parent GenericFhirService constructor.
    super(dataSource, searchService);

    // Assign the specific repositories for this resource to the generic properties
    // defined in the parent class. This "configures" the generic service to work
    // with the ServiceRequest and ServiceRequestHistory tables.
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
  }
}
