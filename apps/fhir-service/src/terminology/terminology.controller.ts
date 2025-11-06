import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TerminologySearchService } from './terminology-search.service';

/**
 * Controller for FHIR terminology services - CodeSystem and ValueSet operations
 * Provides search functionality for all master data terminology resources
 */
@ApiTags('Terminology Services')
@Controller('fhir')
export class TerminologyController {
    constructor(private readonly terminologyService: TerminologySearchService) { }

    /**
     * Search CodeSystems
     * GET /fhir/CodeSystem?url=http://terminology.hl7.org/CodeSystem/allergies&version=1.0.0
     */
    @Get('CodeSystem')
    @ApiOperation({
        summary: 'Search CodeSystems',
        description: 'Search for CodeSystem resources containing terminology definitions'
    })
    @ApiQuery({ name: 'url', required: false, description: 'Canonical URL of the CodeSystem' })
    @ApiQuery({ name: 'name', required: false, description: 'Name of the CodeSystem' })
    @ApiQuery({ name: 'title', required: false, description: 'Title of the CodeSystem' })
    @ApiQuery({ name: 'status', required: false, description: 'Status (active, draft, retired)' })
    @ApiQuery({ name: 'version', required: false, description: 'Version of the CodeSystem' })
    @ApiQuery({ name: '_count', required: false, description: 'Number of results to return', type: 'number' })
    @ApiResponse({ status: 200, description: 'Bundle of CodeSystem resources' })
    async searchCodeSystems(@Query() query: any) {
        return this.terminologyService.searchCodeSystems(query);
    }

    /**
     * Get specific CodeSystem by ID
     * GET /fhir/CodeSystem/allergies
     */
    @Get('CodeSystem/:id')
    @ApiOperation({
        summary: 'Get CodeSystem by ID',
        description: 'Retrieve a specific CodeSystem resource by its logical ID'
    })
    @ApiParam({ name: 'id', description: 'CodeSystem ID (e.g., allergies, brand-medications)' })
    @ApiResponse({ status: 200, description: 'CodeSystem resource' })
    async getCodeSystem(@Param('id') id: string) {
        return this.terminologyService.getCodeSystem(id);
    }

    /**
     * Search ValueSets
     * GET /fhir/ValueSet?url=http://terminology.hl7.org/ValueSet/allergies
     */
    @Get('ValueSet')
    @ApiOperation({
        summary: 'Search ValueSets',
        description: 'Search for ValueSet resources containing code selections'
    })
    @ApiQuery({ name: 'url', required: false, description: 'Canonical URL of the ValueSet' })
    @ApiQuery({ name: 'name', required: false, description: 'Name of the ValueSet' })
    @ApiQuery({ name: 'title', required: false, description: 'Title of the ValueSet' })
    @ApiQuery({ name: 'status', required: false, description: 'Status (active, draft, retired)' })
    @ApiQuery({ name: '_count', required: false, description: 'Number of results to return', type: 'number' })
    @ApiResponse({ status: 200, description: 'Bundle of ValueSet resources' })
    async searchValueSets(@Query() query: any) {
        return this.terminologyService.searchValueSets(query);
    }

    /**
     * Get specific ValueSet by ID
     * GET /fhir/ValueSet/allergies-vs
     */
    @Get('ValueSet/:id')
    @ApiOperation({
        summary: 'Get ValueSet by ID',
        description: 'Retrieve a specific ValueSet resource by its logical ID'
    })
    @ApiParam({ name: 'id', description: 'ValueSet ID (e.g., allergies-vs, brand-medications-vs)' })
    @ApiResponse({ status: 200, description: 'ValueSet resource' })
    async getValueSet(@Param('id') id: string) {
        return this.terminologyService.getValueSet(id);
    }

    /**
     * CodeSystem $lookup operation - lookup a specific code
     * GET /fhir/CodeSystem/$lookup?system=http://terminology.hl7.org/CodeSystem/allergies&code=387322000
     */
    @Get('CodeSystem/$lookup')
    @ApiOperation({
        summary: 'Lookup code in CodeSystem',
        description: 'Look up a code in a CodeSystem and return its definition and properties'
    })
    @ApiQuery({ name: 'system', required: true, description: 'CodeSystem URL' })
    @ApiQuery({ name: 'code', required: true, description: 'Code to lookup' })
    @ApiQuery({ name: 'version', required: false, description: 'CodeSystem version' })
    @ApiResponse({ status: 200, description: 'Parameters resource with code information' })
    async lookupCode(@Query() query: { system: string; code: string; version?: string }) {
        return this.terminologyService.lookupCode(query.system, query.code, query.version);
    }

    /**
     * ValueSet $expand operation - expand ValueSet to get all codes
     * GET /fhir/ValueSet/$expand?url=http://terminology.hl7.org/ValueSet/allergies&count=100
     */
    @Get('ValueSet/$expand')
    @ApiOperation({
        summary: 'Expand ValueSet',
        description: 'Expand a ValueSet to return all codes it contains'
    })
    @ApiQuery({ name: 'url', required: true, description: 'ValueSet URL to expand' })
    @ApiQuery({ name: 'count', required: false, description: 'Maximum number of codes to return', type: 'number' })
    @ApiQuery({ name: 'offset', required: false, description: 'Starting position for paging', type: 'number' })
    @ApiQuery({ name: 'filter', required: false, description: 'Filter codes by text' })
    @ApiResponse({ status: 200, description: 'Expanded ValueSet with all codes' })
    async expandValueSet(@Query() query: { url: string; count?: number; offset?: number; filter?: string }) {
        return this.terminologyService.expandValueSet(query.url, query);
    }

    /**
     * ValueSet $validate-code operation - validate if a code is in the ValueSet
     * GET /fhir/ValueSet/$validate-code?url=http://terminology.hl7.org/ValueSet/allergies&code=387322000
     */
    @Get('ValueSet/$validate-code')
    @ApiOperation({
        summary: 'Validate code in ValueSet',
        description: 'Check if a code is valid within a specific ValueSet'
    })
    @ApiQuery({ name: 'url', required: true, description: 'ValueSet URL' })
    @ApiQuery({ name: 'code', required: true, description: 'Code to validate' })
    @ApiQuery({ name: 'system', required: false, description: 'CodeSystem URL' })
    @ApiResponse({ status: 200, description: 'Parameters resource with validation result' })
    async validateCode(@Query() query: { url: string; code: string; system?: string }) {
        return this.terminologyService.validateCode(query.url, query.code, query.system);
    }
}
