import { Args, Query, Resolver } from '@nestjs/graphql';
import { TerminologyGraphQLService } from '../services/terminology-graphql.service';
import {
    CodeSystemSearchInput,
    CodeValidationInput,
    ConceptLookupInput,
    TerminologySearchInput,
    ValueSetDropdownInput,
    ValueSetExpandInput,
    ValueSetSearchInput,
} from '../types/terminology-input.type';
import {
    CodeSystem,
    CodeValidationResult,
    ConceptLookupResult,
    ExpandedValueSet,
    TerminologySearchResult,
    ValueSet,
    ValueSetDropdownResult,
} from '../types/terminology.type';

@Resolver()
export class TerminologyResolver {
    constructor(private readonly terminologyService: TerminologyGraphQLService) { }

    @Query(() => [CodeSystem], {
        name: 'searchCodeSystems',
        description: 'Search for FHIR CodeSystems with optional filtering and pagination',
    })
    async searchCodeSystems(
        @Args('input', { type: () => CodeSystemSearchInput, nullable: true })
        input: CodeSystemSearchInput = {},
    ): Promise<CodeSystem[]> {
        return this.terminologyService.searchCodeSystems(input);
    }

    @Query(() => [ValueSet], {
        name: 'searchValueSets',
        description: 'Search for FHIR ValueSets with optional filtering and pagination',
    })
    async searchValueSets(
        @Args('input', { type: () => ValueSetSearchInput, nullable: true })
        input: ValueSetSearchInput = {},
    ): Promise<ValueSet[]> {
        return this.terminologyService.searchValueSets(input);
    }

    @Query(() => CodeSystem, {
        name: 'getCodeSystem',
        description: 'Get a specific CodeSystem by ID',
        nullable: true,
    })
    async getCodeSystem(
        @Args('id', { type: () => String }) id: string,
    ): Promise<CodeSystem | null> {
        return this.terminologyService.getCodeSystem(id);
    }

    @Query(() => ValueSet, {
        name: 'getValueSet',
        description: 'Get a specific ValueSet by ID',
        nullable: true,
    })
    async getValueSet(
        @Args('id', { type: () => String }) id: string,
    ): Promise<ValueSet | null> {
        return this.terminologyService.getValueSet(id);
    }

    @Query(() => ConceptLookupResult, {
        name: 'lookupConcept',
        description: 'Look up a concept by code and system to get its details',
    })
    async lookupConcept(
        @Args('input', { type: () => ConceptLookupInput })
        input: ConceptLookupInput,
    ): Promise<ConceptLookupResult> {
        return this.terminologyService.lookupConcept(input);
    }

    @Query(() => ExpandedValueSet, {
        name: 'expandValueSet',
        description: 'Expand a ValueSet to get all its concepts with optional filtering and pagination',
    })
    async expandValueSet(
        @Args('input', { type: () => ValueSetExpandInput })
        input: ValueSetExpandInput,
    ): Promise<ExpandedValueSet> {
        return this.terminologyService.expandValueSet(input);
    }

    @Query(() => CodeValidationResult, {
        name: 'validateCode',
        description: 'Validate if a code exists in a specific ValueSet',
    })
    async validateCode(
        @Args('input', { type: () => CodeValidationInput })
        input: CodeValidationInput,
    ): Promise<CodeValidationResult> {
        return this.terminologyService.validateCode(input);
    }

    @Query(() => TerminologySearchResult, {
        name: 'searchTerminology',
        description: 'Search across all terminology resources (CodeSystems and ValueSets) with text and category filters',
    })
    async searchTerminology(
        @Args('input', { type: () => TerminologySearchInput, nullable: true })
        input: TerminologySearchInput = {},
    ): Promise<TerminologySearchResult> {
        return this.terminologyService.searchTerminology(input);
    }

    @Query(() => ValueSetDropdownResult, {
        name: 'getValueSetForDropdown',
        description: 'Get ValueSet concepts formatted specifically for dropdown UI components with filtering and sorting options',
    })
    async getValueSetForDropdown(
        @Args('input', { type: () => ValueSetDropdownInput })
        input: ValueSetDropdownInput,
    ): Promise<ValueSetDropdownResult> {
        return this.terminologyService.getValueSetForDropdown(input);
    }
}
