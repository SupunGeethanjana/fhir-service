import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { MedicationRequestHistory } from './entities/medication-request-history.entity';
import { MedicationRequest } from './entities/medication-request.entity';

/**
 * Concrete service implementation for managing FHIR MedicationRequest resources.
 * 
 * This service extends the GenericFhirService to provide MedicationRequest-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * MedicationRequest resources represent orders or prescriptions for medications,
 * including detailed information about dosage, timing, and administration instructions.
 * This service automatically handles:
 * - MedicationRequest resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in medication_request_history table
 * - Integration with FHIR search parameters (patient, medication, status, etc.)
 * - Transaction support for bundle operations
 * 
 * Business rules and validations specific to MedicationRequest resources can be added
 * to this service while leveraging the robust foundation provided by the generic service.
 * 
 * @example
 * ```typescript
 * // Inject and use the service
 * constructor(private medicationRequestService: MedicationRequestService) {}
 * 
 * // Create a new medication request
 * const medicationRequest = await this.medicationRequestService.create({
 *   resourceType: 'MedicationRequest',
 *   status: 'active',
 *   intent: 'order',
 *   medicationCodeableConcept: {
 *     coding: [{
 *       system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
 *       code: '313782',
 *       display: 'Acetaminophen 325 MG Oral Tablet'
 *     }]
 *   },
 *   subject: { reference: 'Patient/patient-123' },
 *   dosageInstruction: [{
 *     text: '1 tablet every 6 hours as needed for pain',
 *     timing: { repeat: { frequency: 4, period: 1, periodUnit: 'd' } }
 *   }]
 * });
 * 
 * // Search for medication requests
 * const results = await this.medicationRequestService.search({ 
 *   patient: 'Patient/patient-123', 
 *   status: 'active' 
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://www.hl7.org/fhir/medicationrequest.html} FHIR MedicationRequest Resource Specification
 */
@Injectable()
export class MedicationRequestService extends GenericFhirService<MedicationRequest, MedicationRequestHistory> {

  /**
   * The FHIR resource type that this service manages.
   * Used by the generic service for proper resource type handling and logging.
   */
  protected readonly resourceType = 'MedicationRequest';

  /**
   * Initializes the MedicationRequest service with required dependencies and repositories.
   * 
   * Configures the inherited generic service with MedicationRequest-specific repositories
   * and ensures proper integration with the FHIR resource management framework.
   * 
   * @param repo - TypeORM repository for the MedicationRequest entity (current version table)
   * @param historyRepo - TypeORM repository for the MedicationRequestHistory entity (audit trail table)
   * @param dataSource - TypeORM DataSource for database operations and transaction management
   * @param searchService - Generic search service for handling FHIR search operations
   */
  constructor(
    @InjectRepository(MedicationRequest)
    protected readonly repo: Repository<MedicationRequest>,

    @InjectRepository(MedicationRequestHistory)
    protected readonly historyRepo: Repository<MedicationRequestHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    super(dataSource, searchService);

    // Configure the generic service with MedicationRequest-specific repositories
    this.currentRepo = repo;
    this.historyRepo = historyRepo;

    this.logger.log('MedicationRequest service initialized successfully');
  }
}
