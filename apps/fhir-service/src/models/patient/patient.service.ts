import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MrnQueryDto } from '../../common/dtos/mrn-query.dto';
import { MrnItemDto, MrnResponseDto } from '../../common/dtos/mrn-response.dto';
import { SimpleMrnItemDto, SimpleMrnResponseDto } from '../../common/dtos/simple-mrn-response.dto';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { PatientHistory } from './entities/patient-history.entity';
import { Patient } from './entities/patient.entity';

/**
 * Concrete service implementation for managing FHIR Patient resources.
 * 
 * This service extends the GenericFhirService to provide Patient-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * The service automatically handles:
 * - Patient resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in patient_history table
 * - Integration with FHIR search parameters
 * - Transaction support for bundle operations
 * 
 * Business rules and validations specific to Patient resources can be added
 * to this service while leveraging the robust foundation provided by the generic service.
 * 
 * @example
 * ```typescript
 * // Inject and use the service
 * constructor(private patientService: PatientService) {}
 * 
 * // Create a new patient
 * const patient = await this.patientService.create({
 *   resourceType: 'Patient',
 *   name: [{ family: 'Doe', given: ['John'] }],
 *   gender: 'male'
 * });
 * 
 * // Search for patients
 * const results = await this.patientService.search({ 
 *   family: 'Doe', 
 *   active: 'true' 
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://www.hl7.org/fhir/patient.html} FHIR Patient Resource Specification
 */
@Injectable()
export class PatientService extends GenericFhirService<Patient, PatientHistory> {

  /**
   * Specifies the FHIR resource type managed by this service.
   * Used by the generic service for proper resource type handling and validation.
   */
  protected readonly resourceType = 'Patient';

  /**
   * Initializes the Patient service with required dependencies.
   * 
   * The constructor performs dependency injection and configures the service
   * to work with Patient and PatientHistory entities. Logging is automatically
   * initialized by the parent class.
   * 
   * @param repo - TypeORM repository for current Patient entities
   * @param historyRepo - TypeORM repository for Patient history/audit trail  
   * @param dataSource - Database connection and transaction manager
   * @param searchService - FHIR search operations handler
   */
  constructor(
    @InjectRepository(Patient)
    protected readonly repo: Repository<Patient>,

    @InjectRepository(PatientHistory)
    protected readonly historyRepo: Repository<PatientHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Initialize parent service with core dependencies
    super(dataSource, searchService);

    // Configure repositories for Patient-specific operations
    // These assignments allow the generic service to operate on Patient entities
    this.currentRepo = repo;
    this.historyRepo = historyRepo;

    this.logger.log('Patient service initialized successfully');
  }

  // --- Patient-Specific Business Logic Can Be Added Here --- //

  /**
   * Example of Patient-specific business logic that could be implemented.
   * 
   * This method demonstrates how to add resource-specific functionality
   * while maintaining consistency with the FHIR specification.
   * 
   * @example
   * ```typescript
   * // Find patients by Medical Record Number
   * async findByMrn(mrn: string): Promise<Patient | null> {
   *   this.logger.debug(`Searching for patient with MRN: ${mrn}`);
   *   
   *   try {
   *     const searchResults = await this.search({
   *       identifier: `mrn|${mrn}`
   *     });
   *     
   *     if (searchResults.entry && searchResults.entry.length > 0) {
   *       this.logger.debug(`Found patient with MRN: ${mrn}`);
   *       return searchResults.entry[0].resource;
   *     }
   *     
   *     this.logger.debug(`No patient found with MRN: ${mrn}`);
   *     return null;
   *   } catch (error) {
   *     this.logger.error(`Error searching for patient with MRN ${mrn}:`, error);
   *     throw error;
   *   }
   * }
   * 
   * // Validate patient data before creation
   * async validateAndCreate(patientData: any): Promise<any> {
   *   this.logger.debug('Validating patient data before creation');
   *   
   *   // Add patient-specific validation logic here
   *   if (!patientData.name || patientData.name.length === 0) {
   *     throw new Error('Patient must have at least one name');
   *   }
   *   
   *   // Delegate to generic create method
   *   return this.create(patientData);
   * }
   * ```
   */

  /**
   * Retrieves a paginated list of Medical Record Numbers (MRNs) for dropdown population.
   * 
   * This method queries the Patient repository to fetch MRNs from the JSONB resource field
   * and supports pagination, search, and filtering capabilities.
   * 
   * @param queryDto - Query parameters for pagination and filtering
   * @returns Promise resolving to MrnResponseDto with paginated MRN data
   * 
   * @example
   * ```typescript
   * // Get paginated list of MRNs
   * const result = await this.patientService.getMrnList({
   *   limit: 50,
   *   offset: 0,
   *   search: '123'
   * });
   * ```
   */
  async getMrnList(queryDto: MrnQueryDto): Promise<MrnResponseDto> {
    this.logger.debug('Fetching MRN list for dropdown', queryDto);

    try {
      // Build the base query with MRN extraction from JSONB
      let query = this.repo
        .createQueryBuilder('patient')
        .select([
          'patient.id',
          'patient.last_updated',
          'patient.resource'
        ])
        .where('patient.deleted_at IS NULL') // Only active patient records
        .andWhere(`
          jsonb_path_exists(
            patient.resource, 
            '$.identifier[*] ? (@.type.coding[*].code == "MR" || @.use == "usual")'
          )
        `); // Only patients with MRN identifiers

      // Add search filter if provided
      if (queryDto.search) {
        query = query.andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
            WHERE (ident->>'value') ILIKE :search
            AND (
              ident->'type'->'coding'@>'[{"code":"MR"}]'::jsonb
              OR ident->>'use' = 'usual'
            )
          )
        `, { search: `%${queryDto.search}%` });
      }

      // Add system filter if provided
      if (queryDto.system) {
        query = query.andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
            WHERE (ident->>'system') = :system
          )
        `, { system: queryDto.system });
      }

      // Add active filter if provided
      if (queryDto.active !== undefined) {
        query = query.andWhere('(patient.resource->>\'active\')::boolean = :active', {
          active: queryDto.active
        });
      }

      // Get total count
      const totalCount = await query.getCount();

      // Apply pagination and ordering
      const results = await query
        .orderBy('patient.last_updated', 'DESC')
        .limit(queryDto.limit)
        .offset(queryDto.offset)
        .getMany();

      // Extract MRN data from JSONB
      const mrns: MrnItemDto[] = [];

      for (const patient of results) {
        const resource = patient.resource as any;

        // Find MRN identifier
        if (resource.identifier) {
          for (const identifier of resource.identifier) {
            // Check if this is an MRN identifier
            const isMrn = identifier.type?.coding?.some((coding: any) => coding.code === 'MR') ||
              identifier.use === 'usual';

            if (isMrn && identifier.value) {
              // Build display name from patient name
              let displayName = '';
              if (resource.name && resource.name.length > 0) {
                const name = resource.name[0];
                const given = name.given ? name.given.join(' ') : '';
                const family = name.family || '';
                displayName = `${given} ${family}`.trim();
              }

              mrns.push({
                mrn: identifier.value,
                system: identifier.system,
                patientId: patient.id,
                displayName: displayName || undefined,
                active: resource.active,
                lastUpdated: patient.lastUpdated
              });
              break; // Only take the first MRN per patient
            }
          }
        }
      }

      this.logger.debug(`Retrieved ${mrns.length} MRNs from ${totalCount} total patients`);

      return {
        total: totalCount,
        count: mrns.length,
        offset: queryDto.offset || 0,
        mrns
      };
    } catch (error) {
      this.logger.error('Error fetching MRN list:', error);
      throw error;
    }
  }

  /**
   * Retrieves all MRNs from a specific identifier system without pagination for simple dropdown usage.
   * 
   * This method fetches all MRNs from active patients within the specified identifier system
   * without pagination. Use with caution on large datasets as it returns all records.
   * 
   * @param system - Required identifier system to filter by (e.g., 'http://hospital.org/mrn')
   * @param search - Optional search term to filter MRNs
   * @param activeOnly - Whether to only return active patients (default: true)
   * @returns Promise resolving to SimpleMrnResponseDto with all MRNs
   * 
   * @example
   * ```typescript
   * // Get all MRNs from specific system
   * const allMrns = await this.patientService.getAllMrns('http://hospital.org/mrn');
   * 
   * // Get MRNs with search filter
   * const filteredMrns = await this.patientService.getAllMrns('http://hospital.org/mrn', '123');
   * ```
   */
  async getAllMrns(system?: string, search?: string, activeOnly = true): Promise<SimpleMrnResponseDto> {
    this.logger.debug('Fetching all MRNs without pagination', { system, search, activeOnly });

    try {
      let query = this.repo
        .createQueryBuilder('patient')
        .select(['patient.id', 'patient.resource'])
        .where('patient.deleted_at IS NULL');

      if (system) {
        query = query.andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
            WHERE (ident->>'system') = :systemParam
            AND (
              ident->'type'->'coding'@>'[{"code":"MR"}]'::jsonb
              OR ident->>'use' = 'usual'
            )
          )
        `, { systemParam: system });
      } else {
        query = query.andWhere(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
            WHERE (
              ident->'type'->'coding'@>'[{"code":"MR"}]'::jsonb
              OR ident->>'use' = 'usual'
            )
          )
        `);
      }

      if (activeOnly) {
        query = query.andWhere('(patient.resource->>\'active\')::boolean = true');
      }

      if (search) {
        if (system) {
          query = query.andWhere(`
            EXISTS (
              SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
              WHERE (ident->>'value') ILIKE :search
              AND (ident->>'system') = :searchSystem
              AND (
                ident->'type'->'coding'@>'[{"code":"MR"}]'::jsonb
                OR ident->>'use' = 'usual'
              )
            )
          `, { search: `%${search}%`, searchSystem: system });
        } else {
          query = query.andWhere(`
            EXISTS (
              SELECT 1 FROM jsonb_array_elements(patient.resource->'identifier') AS ident
              WHERE (ident->>'value') ILIKE :search
              AND (
                ident->'type'->'coding'@>'[{"code":"MR"}]'::jsonb
                OR ident->>'use' = 'usual'
              )
            )
          `, { search: `%${search}%` });
        }
      }

      const results = await query
        .orderBy('patient.last_updated', 'DESC')
        .getMany();

      this.logger.debug(`Found ${results.length} patients in database`);

      // Extract MRN data from JSONB
      const mrns: SimpleMrnItemDto[] = [];

      for (const patient of results) {
        const resource = patient.resource as any;

        // Find MRN identifier from the specified system (or any system if none specified)
        if (resource.identifier) {
          for (const identifier of resource.identifier) {

            // Check if this is an MRN identifier
            const isMrn = identifier.type?.coding?.some((coding: any) => coding.code === 'MR') ||
              identifier.use === 'usual';

            // Check system match (if system is specified)
            const isCorrectSystem = !system || identifier.system === system;

            if (isMrn && identifier.value && isCorrectSystem) {
              // Build display name from patient name
              let displayName = '';
              if (resource.name && resource.name.length > 0) {
                const name = resource.name[0];
                const given = name.given ? name.given.join(' ') : '';
                const family = name.family || '';
                displayName = `${given} ${family}`.trim();
              }

              // Create display label: "MRN - Patient Name" or just "MRN"
              const label = displayName
                ? `${identifier.value} - ${displayName}`
                : identifier.value;

              mrns.push({
                value: identifier.value,
                label,
                patientId: patient.id,
                active: resource.active,
                system: identifier.system
              });
              break; // Only take the first MRN per patient from the specified system
            }
          }
        }
      }

      this.logger.debug(`Retrieved ${mrns.length} MRNs from system ${system} without pagination`);

      return {
        count: mrns.length,
        mrns
      };
    } catch (error) {
      this.logger.error('Error fetching all MRNs:', error);
      throw error;
    }
  }
}