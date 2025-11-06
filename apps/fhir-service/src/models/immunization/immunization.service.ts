import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ImmunizationHistory } from './entities/immunization-history.entity';
import { Immunization } from './entities/immunization.entity';

/**
 * Concrete service for the Immunization resource.
 * 
 * This service is responsible for handling all business logic related to Immunization resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Immunization-specific configurations.
 * 
 * Immunization resources represent the event of a patient being administered a vaccine
 * or a record of an immunization as reported by a patient, a clinician or another party.
 * This includes:
 * - Vaccine administration details
 * - Patient and practitioner references
 * - Clinical status and outcomes
 * - Administrative and regulatory information
 */
@Injectable()
export class ImmunizationService extends GenericFhirService<Immunization, ImmunizationHistory> {

    /**
     * Sets the specific FHIR resource type that this service manages.
     * The generic service uses this string to correctly handle resourceType properties.
     */
    protected readonly resourceType = 'Immunization';

    /**
     * The constructor injects all necessary dependencies.
     * @param repo The TypeORM repository for the `Immunization` entity (the current table).
     * @param historyRepo The TypeORM repository for the `ImmunizationHistory` entity.
     * @param dataSource The main TypeORM DataSource, used for managing database transactions.
     * @param searchService The shared, core search service for handling search logic.
     */
    constructor(
        @InjectRepository(Immunization)
        protected readonly repo: Repository<Immunization>,

        @InjectRepository(ImmunizationHistory)
        protected readonly historyRepo: Repository<ImmunizationHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Pass the core dependencies up to the parent GenericFhirService constructor.
        super(dataSource, searchService);

        // Assign the specific repositories for this resource to the generic properties
        // defined in the parent class. This "configures" the generic service to work
        // with the Immunization and ImmunizationHistory tables.
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }

    // --- Immunization-Specific Business Logic Can Be Added Here --- //

    /**
     * Example of Immunization-specific business logic that could be implemented.
     * 
     * This method demonstrates how to add resource-specific functionality
     * while maintaining consistency with the FHIR specification.
     * 
     * @example
     * ```typescript
     * // Find immunizations by patient
     * async findByPatient(patientId: string): Promise<Immunization[]> {
     *   this.logger.debug(`Searching for immunizations for patient: ${patientId}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       patient: patientId
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for immunizations by patient: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find immunizations by vaccine code
     * async findByVaccineCode(vaccineCode: string): Promise<Immunization[]> {
     *   this.logger.debug(`Searching for immunizations with vaccine code: ${vaccineCode}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       'vaccine-code': vaccineCode
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for immunizations by vaccine code: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find immunizations by date range
     * async findByDateRange(startDate: string, endDate: string): Promise<Immunization[]> {
     *   this.logger.debug(`Searching for immunizations between ${startDate} and ${endDate}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       date: `ge${startDate}`,
     *       date: `le${endDate}`
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for immunizations by date range: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Validate immunization status
     * async validateStatus(immunization: any): Promise<boolean> {
     *   const validStatuses = ['completed', 'entered-in-error', 'not-done'];
     *   return validStatuses.includes(immunization.status);
     * }
     * ```
     */
}
