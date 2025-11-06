import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ObservationHistory } from './entities/observation-history.entity';
import { Observation } from './entities/observation.entity';

/**
 * Concrete service implementation for managing FHIR Observation resources.
 * 
 * This service extends the GenericFhirService to provide Observation-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * Observations are fundamental to healthcare data, representing measurements, assessments,
 * and other findings related to patient care. This service automatically handles:
 * - Observation resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in observation_history table
 * - Integration with FHIR search parameters (subject, code, date, etc.)
 * - Transaction support for bundle operations
 * 
 * Business rules and validations specific to Observation resources can be added
 * to this service while leveraging the robust foundation provided by the generic service.
 * 
 * @example
 * ```typescript
 * // Inject and use the service
 * constructor(private observationService: ObservationService) {}
 * 
 * // Create a new blood pressure observation
 * const observation = await this.observationService.create({
 *   resourceType: 'Observation',
 *   status: 'final',
 *   code: {
 *     coding: [{
 *       system: 'http://loinc.org',
 *       code: '85354-9',
 *       display: 'Blood pressure panel'
 *     }]
 *   },
 *   subject: { reference: 'Patient/patient-123' },
 *   effectiveDateTime: '2024-01-15T10:30:00Z',
 *   component: [
 *     {
 *       code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
 *       valueQuantity: { value: 120, unit: 'mmHg' }
 *     }
 *   ]
 * });
 * 
 * // Search for patient's vital signs
 * const vitals = await this.observationService.search({ 
 *   subject: 'Patient/patient-123',
 *   category: 'vital-signs',
 *   _sort: '-date'
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://www.hl7.org/fhir/observation.html} FHIR Observation Resource Specification
 */
@Injectable()
export class ObservationService extends GenericFhirService<Observation, ObservationHistory> {

  /**
   * Specifies the FHIR resource type managed by this service.
   * Used by the generic service for proper resource type handling and validation.
   */
  protected readonly resourceType = 'Observation';

  /**
   * Initializes the Observation service with required dependencies.
   * 
   * The constructor performs dependency injection and configures the service
   * to work with Observation and ObservationHistory entities. Logging is automatically
   * initialized by the parent class with the service name for easy identification.
   * 
   * @param repo - TypeORM repository for current Observation entities
   * @param historyRepo - TypeORM repository for Observation history/audit trail  
   * @param dataSource - Database connection and transaction manager
   * @param searchService - FHIR search operations handler
   */
  constructor(
    @InjectRepository(Observation)
    protected readonly repo: Repository<Observation>,

    @InjectRepository(ObservationHistory)
    protected readonly historyRepo: Repository<ObservationHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Initialize parent service with core dependencies
    super(dataSource, searchService);

    // Configure repositories for this specific resource type
    // This enables the generic service to perform database operations
    // on the correct Observation and ObservationHistory tables
    this.currentRepo = repo;
    this.historyRepo = historyRepo;

    this.logger.debug('Observation service initialized with repositories configured');
  }

  // --- Observation-Specific Business Logic Would Go Here --- //

  /**
   * Example method for Observation-specific operations.
   * 
   * Custom business logic for Observations can be implemented here,
   * such as validation rules, derived value calculations, or
   * integration with external systems.
   * 
   * @example
   * ```typescript
   * // Find all vital signs for a patient within a date range
   * async findVitalSignsByPatientAndDateRange(
   *   patientId: string, 
   *   startDate: string, 
   *   endDate: string
   * ): Promise<any[]> {
   *   return this.search({
   *     subject: `Patient/${patientId}`,
   *     category: 'vital-signs',
   *     date: `ge${startDate}`,
   *     date: `le${endDate}`,
   *     _sort: 'date'
   *   });
   * }
   * ```
   */
}