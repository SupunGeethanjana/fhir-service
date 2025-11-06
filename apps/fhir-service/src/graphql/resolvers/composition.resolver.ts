import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { CompositionService } from '../../models/composition/composition.service';
import { FhirBundleOutput } from '../types/fhir-bundle-output.type';
import { CompositionType } from '../types/fhir-resource.type';
import { CompositionSearchInput } from '../types/fhir-search-inputs.type';

@Resolver(() => CompositionType)
export class CompositionResolver {
    private readonly logger = new Logger(CompositionResolver.name);

    constructor(private readonly compositionService: CompositionService) { }

    /**
     * Read a single Composition by ID.
     */
    @Query(() => CompositionType, { nullable: true, description: 'Get a Composition resource by ID' })
    async getComposition(@Args('id', { type: () => ID }) id: string): Promise<CompositionType | null> {
        this.logger.debug(`GraphQL Query: Reading Composition with ID: ${id}`);
        try {
            const result = await this.compositionService.findById(id);
            this.logger.debug(`Successfully retrieved Composition: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading Composition ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for Compositions with FHIR search parameters.
     *
     * @param search Input object containing FHIR search parameters
     * @returns Bundle containing matching Composition resources
     */
    @Query(() => FhirBundleOutput, { nullable: true, description: 'Search for Compositions with FHIR search parameters' })
    async getCompositions(
        @Args('input', { type: () => CompositionSearchInput, nullable: true }) input?: CompositionSearchInput
    ): Promise<FhirBundleOutput> {
        this.logger.debug('GraphQL Query: Searching Compositions with input:', input);
        try {
            const result = await this.compositionService.search(input || {});
            this.logger.debug(`Search returned ${result.total} Compositions`);
            return result;
        } catch (error) {
            this.logger.error(`Error searching Compositions: ${error.message}`);
            throw error;
        }
    }

    @Mutation(() => CompositionType, { description: 'Create a new FHIR Composition resource' })
    async createComposition(
        @Args('resource', { type: () => GraphQLJSON }) resource: any
    ): Promise<CompositionType> {
        this.logger.debug('GraphQL Mutation: Creating new Composition', { resourceType: resource?.resourceType });
        return this.compositionService.create(resource);
    }

    @Mutation(() => CompositionType, { description: 'Update an existing FHIR Composition resource' })
    async updateComposition(
        @Args('id', { type: () => String }) id: string,
        @Args('resource', { type: () => GraphQLJSON }) resource: any
    ): Promise<CompositionType> {
        this.logger.debug('GraphQL Mutation: Updating Composition', { id, resourceType: resource?.resourceType });
        return this.compositionService.update(id, resource);
    }
}
