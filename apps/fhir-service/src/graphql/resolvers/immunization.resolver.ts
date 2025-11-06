import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { ImmunizationService } from '../../models/immunization/immunization.service';
import { FhirBundleOutput } from '../types/fhir-bundle-output.type';
import { ImmunizationType } from '../types/fhir-resource.type';
import { ImmunizationSearchInput } from '../types/fhir-search-inputs.type';
/**
 * GraphQL resolver for Immunization resources.
 * 
 * This resolver provides GraphQL operations for managing Immunization resources,
 * including queries for reading and searching, and mutations for creating, updating, and deleting.
 * 
 * The resolver follows FHIR REST API patterns adapted for GraphQL, providing:
 * - Individual resource operations (read, create, update, delete)
 * - Search operations with FHIR search parameters
 * - History tracking and version management
 * - Proper error handling and logging
 */
@Resolver(() => ImmunizationType)
export class ImmunizationResolver {
    private readonly logger = new Logger(ImmunizationResolver.name);

    constructor(private readonly immunizationService: ImmunizationService) { }

    /**
     * Read a single Immunization by ID.
     * 
     * @param id The logical ID of the Immunization resource
     * @returns The Immunization resource or null if not found
     */
    @Query(() => ImmunizationType, { nullable: true })
    async getImmunization(@Args('id', { type: () => ID }) id: string): Promise<ImmunizationType | null> {
        this.logger.debug(`GraphQL Query: Reading Immunization with ID: ${id}`);

        try {
            const result = await this.immunizationService.findById(id);
            this.logger.debug(`Successfully retrieved Immunization: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading Immunization ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for Immunizations with FHIR search parameters.
     *
     * @param search Input object containing FHIR search parameters
     * @returns Bundle containing matching Immunization resources
     */
    @Query(() => FhirBundleOutput, { nullable: true, description: 'Search for Immunizations with FHIR search parameters' })
    async getImmunizations(
        @Args('input', { type: () => ImmunizationSearchInput, nullable: true }) input?: ImmunizationSearchInput
    ): Promise<FhirBundleOutput> {
        this.logger.debug('GraphQL Query: Searching Immunizations with input:', input);
        try {
            const result = await this.immunizationService.search(input || {});
            this.logger.debug(`Search returned ${result.total} Immunizations`);
            return result;
        } catch (error) {
            this.logger.error(`Error searching Immunizations: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new Immunization resource.
     * 
     * @param immunization The Immunization resource to create
     * @returns The created Immunization resource with assigned ID
     */
    @Mutation(() => ImmunizationType)
    async createImmunization(@Args('immunization', { type: () => GraphQLJSON }) immunization: any): Promise<ImmunizationType> {
        this.logger.debug(`GraphQL Mutation: Creating new Immunization`);

        try {
            const result = await this.immunizationService.create(immunization);
            this.logger.debug(`Successfully created Immunization with ID: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error creating Immunization: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update an existing Immunization resource.
     * 
     * @param id The logical ID of the Immunization to update
     * @param immunization The updated Immunization resource
     * @returns The updated Immunization resource
     */
    @Mutation(() => ImmunizationType)
    async updateImmunization(
        @Args('id', { type: () => ID }) id: string,
        @Args('immunization', { type: () => GraphQLJSON }) immunization: any
    ): Promise<ImmunizationType> {
        this.logger.debug(`GraphQL Mutation: Updating Immunization with ID: ${id}`);

        try {
            const result = await this.immunizationService.update(id, immunization);
            this.logger.debug(`Successfully updated Immunization: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error updating Immunization ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete an Immunization resource.
     * 
     * @param id The logical ID of the Immunization to delete
     * @returns Success status
     */
    @Mutation(() => GraphQLJSON)
    async deleteImmunization(@Args('id', { type: () => ID }) id: string): Promise<any> {
        this.logger.debug(`GraphQL Mutation: Deleting Immunization with ID: ${id}`);

        try {
            const result = await this.immunizationService.delete(id);
            this.logger.debug(`Successfully deleted Immunization: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error deleting Immunization ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply JSON Patch operations to an Immunization resource.
     * 
     * @param id The logical ID of the Immunization to patch
     * @param patch Array of JSON Patch operations
     * @returns The patched Immunization resource
     */
    @Mutation(() => ImmunizationType)
    async patchImmunization(
        @Args('id', { type: () => ID }) id: string,
        @Args('patch', { type: () => [GraphQLJSON] }) patch: any[]
    ): Promise<ImmunizationType> {
        this.logger.debug(`GraphQL Mutation: Patching Immunization with ID: ${id}`);

        try {
            const result = await this.immunizationService.patch(id, patch);
            this.logger.debug(`Successfully patched Immunization: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error patching Immunization ${id}: ${error.message}`);
            throw error;
        }
    }
}
