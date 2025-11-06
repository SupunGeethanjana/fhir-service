import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { AppointmentHistory } from './entities/appointment-history.entity';
import { Appointment } from './entities/appointment.entity';

/**
 * Concrete service for the Appointment resource.
 * 
 * This service is responsible for handling all business logic related to Appointment resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Appointment-specific configurations.
 */
@Injectable()
export class AppointmentService extends GenericFhirService<Appointment, AppointmentHistory> {

  /**
   * Sets the specific FHIR resource type that this service manages.
   * The generic service uses this string to correctly handle resourceType properties.
   */
  protected readonly resourceType = 'Appointment';

  /**
   * The constructor injects all necessary dependencies.
   * @param repo The TypeORM repository for the `Appointment` entity (the current table).
   * @param historyRepo The TypeORM repository for the `AppointmentHistory` entity.
   * @param dataSource The main TypeORM DataSource, used for managing database transactions.
   * @param searchService The shared, core search service for handling search logic.
   */
  constructor(
    @InjectRepository(Appointment)
    protected readonly repo: Repository<Appointment>,

    @InjectRepository(AppointmentHistory)
    protected readonly historyRepo: Repository<AppointmentHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Pass the core dependencies up to the parent GenericFhirService constructor.
    super(dataSource, searchService);

    // Assign the specific repositories for this resource to the generic properties
    // defined in the parent class. This "configures" the generic service to work
    // with the Appointment and AppointmentHistory tables.
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
  }
}
