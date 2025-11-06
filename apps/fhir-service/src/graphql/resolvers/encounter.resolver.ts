import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { EncounterService } from '../../models/encounter/encounter.service';
import { FhirBundleOutput } from '../types/fhir-bundle-output.type';
import { EncounterType } from '../types/fhir-resource.type';
import { EncounterSearchInput } from '../types/fhir-search-inputs.type';

/**
 * GraphQL resolver for FHIR Encounter resource mutations.
 *
 * Provides mutations for creating and updating Encounter resources using FHIR-compliant JSON objects.
 * All business logic is delegated to the EncounterService.
 */
@Resolver(() => EncounterType)
export class EncounterResolver {
    private readonly logger = new Logger(EncounterResolver.name);

    constructor(private readonly encounterService: EncounterService) { }

    /**
     * Read a single Encounter by ID.
     */
    @Query(() => EncounterType, { nullable: true, description: 'Get an Encounter resource by ID' })
    async getEncounter(@Args('id', { type: () => ID }) id: string): Promise<EncounterType | null> {
        this.logger.debug(`GraphQL Query: Reading Encounter with ID: ${id}`);
        try {
            const result = await this.encounterService.findById(id);
            this.logger.debug(`Successfully retrieved Encounter: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading Encounter ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for Encounters with FHIR search parameters.
     *
     * @param search Input object containing FHIR search parameters
     * @returns Bundle containing matching Encounter resources
     */
    @Query(() => FhirBundleOutput, { nullable: true, description: 'Search for Encounters with FHIR search parameters' })
    async getEncounters(
        @Args('input', { type: () => EncounterSearchInput, nullable: true }) input?: EncounterSearchInput
    ): Promise<FhirBundleOutput> {
        this.logger.debug('GraphQL Query: Searching Encounters with input:', input);
        try {
            const result = await this.encounterService.search(input || {});
            this.logger.debug(`Search returned ${result.total} Encounters`);
            return result;
        } catch (error) {
            this.logger.error(`Error searching Encounters: ${error.message}`);
            throw error;
        }
    }

    /**
     * GraphQL mutation to create a new Encounter resource.
     */
    @Mutation(() => EncounterType, { description: 'Create a new FHIR Encounter resource' })
    async createEncounter(
        @Args('resource', { type: () => GraphQLJSON }) resource: any
    ): Promise<EncounterType> {
        this.logger.debug('GraphQL Mutation: Creating new Encounter', { resourceType: resource?.resourceType });
        const created = await this.encounterService.create(resource);
        return {
            id: created.id,
            resourceType: created.resourceType,
            resource: created,
            versionId: created.meta?.versionId ? Number(created.meta.versionId) : undefined,
            lastUpdated: created.meta?.lastUpdated ? new Date(created.meta.lastUpdated) : undefined,
            txid: created.txid,
            deletedAt: created.deletedAt
        };
    }

    /**
     * GraphQL mutation to update an existing Encounter resource.
     */
    @Mutation(() => EncounterType, { description: 'Update an existing FHIR Encounter resource' })
    async updateEncounter(
        @Args('id', { type: () => String }) id: string,
        @Args('resource', { type: () => GraphQLJSON }) resource: any
    ): Promise<EncounterType> {
        this.logger.debug('GraphQL Mutation: Updating Encounter', { id, resourceType: resource?.resourceType });
        return this.encounterService.update(id, resource);
    }
}
