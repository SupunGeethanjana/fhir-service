import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { MedicationService } from '../../models/medication/medication.service';
import { MedicationType } from '../types/fhir-resource.type';
import { MedicationSearchInput } from '../types/fhir-search-inputs.type';
import { FhirSearchResolver, MedicationSearchResult } from './fhir-search.resolver';

/**
 * MedicationResolver
 *
 * GraphQL resolver for retrieving available Medication resources.
 * Follows HL7 FHIR standards and Ayaan project coding guidelines.
 */
/**
 * GraphQL resolver for Medication resources.
 *
 * Follows FHIR REST API patterns adapted for GraphQL, providing:
 * - Individual resource operations (read)
 * - Search operations with FHIR search parameters
 * - Proper error handling and logging
 */
@Resolver(() => MedicationType)
export class MedicationResolver {
    private readonly logger = new Logger(MedicationResolver.name);

    constructor(
        private readonly medicationService: MedicationService,
        private readonly fhirSearchResolver: FhirSearchResolver
    ) { }

    /**
     * Read a single Medication by ID.
     *
     * @param id The logical ID of the Medication resource
     * @returns The Medication resource or null if not found
     */
    @Query(() => MedicationType, { nullable: true, description: 'Get a Medication resource by ID' })
    async getMedication(@Args('id', { type: () => ID }) id: string): Promise<MedicationType | null> {
        this.logger.debug(`GraphQL Query: Reading Medication with ID: ${id}`);
        try {
            const result = await this.medicationService.findById(id);
            this.logger.debug(`Successfully retrieved Medication: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading Medication ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for Medications with FHIR search parameters.
     *
     * @param search Input object containing FHIR search parameters
     * @returns Bundle containing matching Medication resources
     */
    @Query(() => MedicationSearchResult, { nullable: true, description: 'Search for Medications with FHIR search parameters' })
    async getMedications(
        @Args('input', { type: () => MedicationSearchInput, nullable: true }) input?: MedicationSearchInput
    ): Promise<MedicationSearchResult> {
        this.logger.debug('GraphQL Query: Searching Medications with input:', input);
        try {
            // Delegate to FhirSearchResolver's searchMedications
            // Note: searchMedications expects a non-null input
            const searchInput = input || {};
            // Call the method directly
            return await this.fhirSearchResolver.searchMedications(searchInput);
        } catch (error) {
            this.logger.error(`Error searching Medications: ${error.message}`);
            throw error;
        }
    }
}
