import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParsedQs } from 'qs';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FhirResourceType, FhirSearchParameterType, FhirSearchPrefix } from '../../common/enums/fhir-enums';
import { FhirSearchParameter } from './fhir-search-parameter.entity';

/**
 * Mapping from FHIR search prefixes to SQL comparison operators.
 */
const PREFIX_TO_SQL_OPERATOR: Record<FhirSearchPrefix, string> = {
    [FhirSearchPrefix.EQ]: '=',
    [FhirSearchPrefix.NE]: '!=',
    [FhirSearchPrefix.GT]: '>',
    [FhirSearchPrefix.LT]: '<',
    [FhirSearchPrefix.GE]: '>=',
    [FhirSearchPrefix.LE]: '<=',
    [FhirSearchPrefix.SA]: '>',  // Starts after (for dates)
    [FhirSearchPrefix.EB]: '<',  // Ends before (for dates) 
    [FhirSearchPrefix.AP]: '='   // Approximately equal (treated as equal for now)
};

/**
 * Mapping from FHIR resource types to their corresponding TypeORM entity names.
 * This is necessary because TypeORM entity names don't always match the lowercase
 * conversion of FHIR resource types.
 */
const FHIR_RESOURCE_TO_ENTITY_MAP: Record<string, string> = {
    [FhirResourceType.PATIENT]: 'patient',
    [FhirResourceType.PRACTITIONER]: 'practitioner',
    [FhirResourceType.ENCOUNTER]: 'encounter',
    [FhirResourceType.OBSERVATION]: 'observation',
    [FhirResourceType.CONDITION]: 'condition',
    [FhirResourceType.PROCEDURE]: 'procedure',
    [FhirResourceType.ALLERGY_INTOLERANCE]: 'allergy_intolerance',
    [FhirResourceType.MEDICATION_STATEMENT]: 'medication_statement',
    [FhirResourceType.MEDICATION_REQUEST]: 'medication_request',
    [FhirResourceType.FAMILY_MEMBER_HISTORY]: 'family_member_history',
    [FhirResourceType.DIAGNOSTIC_REPORT]: 'diagnostic_report',
    [FhirResourceType.SERVICE_REQUEST]: 'service_request',
    [FhirResourceType.APPOINTMENT]: 'appointment',
    [FhirResourceType.COMPOSITION]: 'composition',
    [FhirResourceType.CODE_SYSTEM]: 'code_system',
    [FhirResourceType.VALUE_SET]: 'value_set',
    [FhirResourceType.ORGANIZATION]: 'organization',
    [FhirResourceType.LOCATION]: 'location',
    [FhirResourceType.MEDICATION]: 'medication',
    [FhirResourceType.DEVICE]: 'device',
    [FhirResourceType.SPECIMEN]: 'specimen'
};

/**
 * A parsed FHIR search parameter.
 *
 * This interface represents a search parameter value that has been parsed
 * to extract comparison operators (prefixes) and the actual search value.
 *
 * @example
 * ```typescript
 * // For "gt2021-01-01", this would be:
 * { prefix: FhirSearchPrefix.GT, value: '2021-01-01' }
 * 
 * // For "John", this would be:
 * { prefix: FhirSearchPrefix.EQ, value: 'John' }
 * ```
 */
export interface ParsedFhirParam {
    /**
     * The comparison operator to use for the search query.
     * Uses the FhirSearchPrefix enum for type safety.
     */
    prefix?: FhirSearchPrefix;

    /**
     * The actual value to search for, after prefix removal.
     */
    value: string;
}

/**
 * Service for executing FHIR search operations across different resource types.
 *
 * This service provides a generic, data-driven approach to FHIR searching by:
 * - Using metadata from the `fhir_search_params` table to determine valid search parameters
 * - Supporting all FHIR search parameter types (string, token, reference, date, number)
 * - Handling chained searches (e.g., `patient.name=John`)
 * - Building dynamic SQL queries based on search parameter definitions
 *
 * The service is designed to work with any FHIR resource type without requiring
 * resource-specific search logic, making it highly maintainable and extensible.
 *
 * @example
 * ```typescript
 * // Search for patients by name
 * const results = await searchService.search('Patient', { name: 'John' });
 * 
 * // Search for observations with date range
 * const results = await searchService.search('Observation', { date: 'gt2021-01-01' });
 * 
 * // Chained search for observations by patient name
 * const results = await searchService.search('Observation', { 'subject:Patient.name': 'John' });
 * ```
 */

@Injectable()
export class GenericSearchService {
    private readonly logger = new Logger(GenericSearchService.name);

    /**
     * Creates an instance of GenericSearchService.
     *
     * @param searchParamRepo - Repository for FHIR search parameter metadata
     * @param dataSource - TypeORM data source for dynamic query building
     */
    constructor(
        @InjectRepository(FhirSearchParameter)
        private readonly searchParamRepo: Repository<FhirSearchParameter>,
        private readonly dataSource: DataSource,
    ) {
        this.logger.log('GenericSearchService initialized');
    }

    /**
     * Parses a FHIR search parameter value to extract comparison prefix and value.
     *
     * FHIR search parameters can include prefixes to specify comparison operations,
     * particularly useful for date and number searches.
     *
     * @param value - The raw search parameter value (e.g., "gt2021-01-01", "John")
     * @returns Parsed parameter with prefix and cleaned value
     *
     * @example
     * ```typescript
     * parseParamValue("gt2021-01-01") // { prefix: FhirSearchPrefix.GT, value: '2021-01-01' }
     * parseParamValue("John")         // { prefix: FhirSearchPrefix.EQ, value: 'John' }
     * parseParamValue("le100")        // { prefix: FhirSearchPrefix.LE, value: '100' }
     * ```
     */
    private parseParamValue(value: string): ParsedFhirParam {
        // Build regex pattern from enum values
        const prefixPattern = Object.values(FhirSearchPrefix).join('|');
        const match = value.match(new RegExp(`^(${prefixPattern})(.*)`));

        if (match) {
            const prefix = match[1] as FhirSearchPrefix;
            const parsedValue = match[2];
            this.logger.debug('Parsed search parameter', {
                originalValue: value,
                prefix,
                parsedValue
            });
            return { prefix, value: parsedValue };
        }

        // Default to 'equals' if no prefix is specified
        return { prefix: FhirSearchPrefix.EQ, value };
    }

    /**
     * Converts FHIR search parameter prefixes to SQL comparison operators.
     *
     * @param prefix - The FHIR search prefix
     * @returns The corresponding SQL operator
     *
     * @example
     * ```typescript
     * getSqlOperator(FhirSearchPrefix.GT) // '>'
     * getSqlOperator(FhirSearchPrefix.LE) // '<='
     * getSqlOperator(FhirSearchPrefix.EQ) // '='
     * ```
     */
    private getSqlOperator(prefix: FhirSearchPrefix): string {
        return PREFIX_TO_SQL_OPERATOR[prefix] || PREFIX_TO_SQL_OPERATOR[FhirSearchPrefix.EQ];
    }

    /**
     * Searches for FHIR resources that match the given query parameters.
     *
     * This method performs a data-driven search by:
     * 1. Looking up valid search parameters from the metadata table
     * 2. Building dynamic SQL queries based on parameter types
     * 3. Supporting pagination, chained searches, and all FHIR search parameter types
     * 4. Returning results in FHIR Bundle format
     *
     * @param resourceType - The FHIR resource type to search (e.g., 'Patient', 'Observation')
     * @param queryParams - Query parameters from the HTTP request
     * @returns A FHIR Bundle containing search results
     *
     * @throws {BadRequestException} When invalid chained search parameters are provided
     *
     * @example
     * ```typescript
     * // Basic search
     * const results = await search('Patient', { name: 'John', gender: 'male' });
     * 
     * // Search with pagination
     * const results = await search('Patient', { name: 'John', _count: '10', _offset: '20' });
     * 
     * // Date range search
     * const results = await search('Observation', { date: 'gt2021-01-01' });
     * 
     * // Chained search
     * const results = await search('Observation', { 'subject:Patient.name': 'John' });
     * ```
     */
    async search(resourceType: string, queryParams: ParsedQs) {
        const startTime = Date.now();
        this.logger.log('Starting FHIR search', {
            resourceType,
            queryParams: Object.keys(queryParams),
            paramCount: Object.keys(queryParams).length
        });

        // Map FHIR resource type to the actual entity name used in TypeORM
        const entityName = FHIR_RESOURCE_TO_ENTITY_MAP[resourceType] || resourceType.toLowerCase();
        const queryBuilder = this.dataSource
            .getRepository(entityName)
            .createQueryBuilder(entityName)
            .select(`${entityName}.resource`);

        // Handle pagination parameters
        const count = parseInt((queryParams._count as string) || '20', 10);
        const offset = parseInt((queryParams._offset as string) || '0', 10);
        queryBuilder.take(count).skip(offset);

        // Extract search criteria (excluding pagination parameters)
        const searchCriteria = { ...queryParams };
        delete searchCriteria._count;
        delete searchCriteria._offset;

        // Apply each search parameter
        let appliedParams = 0;
        for (const key in searchCriteria) {
            const value = searchCriteria[key] as string;

            try {
                if (key.includes('.')) {
                    // Handle chained search parameters (e.g., subject:Patient.name)
                    await this.applyChainedSearch(queryBuilder, resourceType, key, value);
                    appliedParams++;
                } else {
                    // Handle standard search parameters
                    const searchParamDef = await this.searchParamRepo.findOneBy({
                        resourceType,
                        name: key
                    });

                    if (!searchParamDef) {
                        this.logger.warn('Unknown search parameter ignored', {
                            resourceType,
                            parameter: key,
                            value
                        });
                        continue;
                    }

                    const paramName = `${key}_${Math.random().toString(36).substring(7)}`;
                    this.applyStandardSearch(queryBuilder, searchParamDef, value, paramName);
                    appliedParams++;
                }
            } catch (error) {
                this.logger.error('Error applying search parameter', {
                    resourceType,
                    parameter: key,
                    value,
                    error: error.message
                });
                throw error;
            }
        }

        // Execute the search query
        const [results, total] = await queryBuilder.getManyAndCount();
        const duration = Date.now() - startTime;

        this.logger.log('FHIR search completed', {
            resourceType,
            appliedParams,
            resultCount: results.length,
            totalMatches: total,
            duration: `${duration}ms`,
            pagination: { count, offset }
        });

        // Format results as FHIR Bundle
        const entries = results.map((r: any) => ({
            resource: r.resource,
            search: { mode: 'match' }
        }));

        return {
            resourceType: FhirResourceType.BUNDLE,
            id: uuidv4(),
            type: 'searchset',
            total,
            link: [{
                relation: 'self',
                url: `/${resourceType}?${new URLSearchParams(queryParams as any).toString()}`
            }],
            entry: entries,
        };
    }

    /**
     * Applies a chained search to the query builder.
     *
     * Chained searches allow searching across resource references, enabling queries like:
     * - `subject:Patient.name=John` (find observations for patients named John)
     * - `patient:Patient.birthdate=gt1990-01-01` (find resources for patients born after 1990)
     *
     * The method works by:
     * 1. Parsing the chained parameter to extract reference field and target parameter
     * 2. Creating a subquery on the target resource type
     * 3. Joining the results using the reference field
     *
     * @param queryBuilder - The main query builder to apply the chained search to
     * @param resourceType - The resource type being searched
     * @param key - The chained search parameter (e.g., "subject:Patient.name")
     * @param value - The search value
     *
     * @throws {BadRequestException} When the chained search parameter is malformed
     *
     * @example
     * ```typescript
     * // For key="subject:Patient.name" and value="John":
     * // 1. Creates subquery: SELECT id FROM patient WHERE name LIKE '%John%'
     * // 2. Adds condition: observation.subject LIKE ANY(SELECT 'Patient/' || id FROM subquery)
     * ```
     */
    private async applyChainedSearch(
        queryBuilder: any,
        resourceType: string,
        key: string,
        value: string
    ): Promise<void> {
        this.logger.debug('Applying chained search', { resourceType, key, value });

        const [referenceParam, chainedParam] = key.split('.', 2);
        const [refParamName, refResourceType] = referenceParam.split(':', 2);

        if (!refParamName || !refResourceType || !chainedParam) {
            const error = `Invalid chained search parameter: ${key}. Expected format: "field:ResourceType.parameter"`;
            this.logger.error('Invalid chained search parameter', {
                key,
                refParamName,
                refResourceType,
                chainedParam
            });
            throw new BadRequestException(error);
        }

        const targetEntityName = FHIR_RESOURCE_TO_ENTITY_MAP[refResourceType] || refResourceType.toLowerCase();
        const subQueryBuilder = this.dataSource
            .getRepository(targetEntityName)
            .createQueryBuilder(targetEntityName)
            .select(`${targetEntityName}.id`);

        // Find search parameter definition for the target resource
        const targetSearchDef = await this.searchParamRepo.findOneBy({
            resourceType: refResourceType,
            name: chainedParam
        });

        if (!targetSearchDef) {
            this.logger.warn('Target search parameter not found for chained search', {
                refResourceType,
                chainedParam
            });
            return;
        }

        // Apply the search condition to the subquery
        this.applyStandardSearch(subQueryBuilder, targetSearchDef, value, `sub_${chainedParam}`);

        // Find the reference parameter definition for the source resource
        const refSearchDef = await this.searchParamRepo.findOneBy({
            resourceType,
            name: refParamName
        });

        if (!refSearchDef) {
            this.logger.warn('Reference search parameter not found for chained search', {
                resourceType,
                refParamName
            });
            return;
        }

        // Build the chained search condition
        const subQuerySql = subQueryBuilder.getQuery();
        const subQueryParams = subQueryBuilder.getParameters();

        queryBuilder
            .andWhere(`(${refSearchDef.expression}) LIKE ANY (ARRAY(SELECT '"${refResourceType}/"' || id FROM (${subQuerySql}) AS sub))`)
            .setParameters(subQueryBuilder.getParameters());

        this.logger.debug('Chained search applied successfully', {
            resourceType,
            refParamName,
            refResourceType,
            chainedParam
        });
    }

    /**
     * Applies a standard (non-chained) search parameter to the query builder.
     *
     * This method dispatches to type-specific handlers based on the FHIR search parameter type.
     * Each handler implements the appropriate SQL logic for that parameter type.
     *
     * @param queryBuilder - The query builder to apply the search condition to
     * @param searchParamDef - The search parameter definition from metadata
     * @param value - The search value from the request
     * @param paramName - Unique parameter name to prevent SQL injection
     *
     * @example
     * ```typescript
     * // Date search: date=gt2021-01-01
     * // Dispatches to handleDateNumberSearch()
     * 
     * // String search: name=John
     * // Dispatches to handleStringSearch()
     * 
     * // Token search: identifier=system|value
     * // Dispatches to handleTokenSearch()
     * ```
     */
    private applyStandardSearch(
        queryBuilder: any,
        searchParamDef: FhirSearchParameter,
        value: string,
        paramName: string
    ): void {
        const { expression, type, name } = searchParamDef;

        this.logger.debug('Applying standard search', {
            type,
            name,
            value,
            expression: expression.substring(0, 50) + (expression.length > 50 ? '...' : '')
        });

        // Cast type to enum for type safety
        const paramType = type as FhirSearchParameterType;

        switch (paramType) {
            case FhirSearchParameterType.DATE:
            case FhirSearchParameterType.NUMBER:
                this.handleDateNumberSearch(queryBuilder, searchParamDef, value, paramName);
                break;

            case FhirSearchParameterType.STRING:
                this.handleStringSearch(queryBuilder, searchParamDef, value, paramName);
                break;

            case FhirSearchParameterType.TOKEN:
                this.handleTokenSearch(queryBuilder, searchParamDef, value, paramName);
                break;

            case FhirSearchParameterType.REFERENCE:
                this.handleReferenceSearch(queryBuilder, searchParamDef, value, paramName);
                break;

            default:
                this.logger.warn('Unknown search parameter type', { type, name });
                break;
        }
    }

    /**
     * Handles date and number search parameters with comparison prefix support.
     * 
     * @param queryBuilder - The query builder to apply the search condition to
     * @param searchParamDef - The search parameter definition
     * @param value - The search value (may include prefix like "gt2021-01-01")
     * @param paramName - Unique parameter name for SQL binding
     */
    private handleDateNumberSearch(
        queryBuilder: any,
        searchParamDef: FhirSearchParameter,
        value: string,
        paramName: string
    ): void {
        const { expression, type } = searchParamDef;
        const { prefix, value: parsedValue } = this.parseParamValue(value);
        const operator = this.getSqlOperator(prefix);
        const castType = type === FhirSearchParameterType.DATE ? '::date' : '::numeric';

        // Convert JSONPath expression to PostgreSQL JSONB query
        const jsonbQuery = this.convertToJsonbQuery(expression);
        queryBuilder.andWhere(
            `(${jsonbQuery})${castType} ${operator} :${paramName}`,
            { [paramName]: parsedValue }
        );

        this.logger.debug('Applied date/number search', {
            type,
            operator,
            castType,
            parsedValue,
            expression,
            jsonbQuery
        });
    }

    /**
     * Handles string search parameters with case-insensitive partial matching.
     * 
     * @param queryBuilder - The query builder to apply the search condition to
     * @param searchParamDef - The search parameter definition
     * @param value - The search value
     * @param paramName - Unique parameter name for SQL binding
     */
    private handleStringSearch(
        queryBuilder: any,
        searchParamDef: FhirSearchParameter,
        value: string,
        paramName: string
    ): void {
        const { expression } = searchParamDef;

        // Convert JSONPath expression to PostgreSQL JSONB query
        const jsonbQuery = this.convertToJsonbQuery(expression);
        queryBuilder.andWhere(
            `${jsonbQuery} ILIKE :${paramName}`,
            { [paramName]: `%${value}%` }
        );

        this.logger.debug('Applied string search', {
            originalExpression: expression,
            jsonbQuery,
            value
        });
    }

    /**
     * Handles token search parameters for exact matching of codes and identifiers.
     * 
     * @param queryBuilder - The query builder to apply the search condition to
     * @param searchParamDef - The search parameter definition
     * @param value - The search value (may include system|value format)
     * @param paramName - Unique parameter name for SQL binding
     */
    private handleTokenSearch(
        queryBuilder: any,
        searchParamDef: FhirSearchParameter,
        value: string,
        paramName: string
    ): void {
        const { expression, name } = searchParamDef;

        if (name === 'identifier') {
            // Handle system|value format for identifiers
            const [system, code] = value.split('|');
            const jsonbQuery = this.convertToJsonbQuery(expression);
            queryBuilder.andWhere(
                `(${jsonbQuery}) @> :${paramName}`,
                { [paramName]: JSON.stringify([{ system, value: code }]) }
            );

            this.logger.debug('Applied identifier token search', { system, code, expression, jsonbQuery });
        } else if (name === '_id') {
            // Direct ID matching - convert JSONPath to JSONB syntax
            const jsonbQuery = this.convertToJsonbQuery(expression);
            queryBuilder.andWhere(
                `${jsonbQuery} = :${paramName}`,
                { [paramName]: value }
            );

            this.logger.debug('Applied _id search', { value, expression, jsonbQuery });
        } else {
            // Generic token matching - convert JSONPath to JSONB syntax
            const jsonbQuery = this.convertToJsonbQuery(expression);
            queryBuilder.andWhere(
                `${jsonbQuery} = :${paramName}`,
                { [paramName]: value }
            );

            this.logger.debug('Applied generic token search', { value, expression, jsonbQuery });
        }
    }

    /**
     * Handles reference search parameters for linking between resources.
     * 
     * @param queryBuilder - The query builder to apply the search condition to
     * @param searchParamDef - The search parameter definition
     * @param value - The search value (reference pattern)
     * @param paramName - Unique parameter name for SQL binding
     */
    private handleReferenceSearch(
        queryBuilder: any,
        searchParamDef: FhirSearchParameter,
        value: string,
        paramName: string
    ): void {
        const { expression } = searchParamDef;

        // Convert JSONPath expression to PostgreSQL JSONB query
        const jsonbQuery = this.convertToJsonbQuery(expression);
        queryBuilder.andWhere(
            `${jsonbQuery} LIKE :${paramName}`,
            { [paramName]: `%${value}%` }
        );

        this.logger.debug('Applied reference search', {
            value,
            expression,
            jsonbQuery
        });
    }

    /**
     * Converts a JSONPath expression to PostgreSQL JSONB query syntax.
     *
     * This method transforms JSONPath expressions (which don't work directly in PostgreSQL)
     * into proper PostgreSQL JSONB operators. It handles common FHIR JSONPath patterns
     * like array access and nested object navigation.
     *
     * @param jsonPath - The JSONPath expression from the search parameter definition
     * @returns A PostgreSQL JSONB query expression
     *
     * @example
     * ```typescript
     * convertToJsonbQuery("$.name[*].family") 
     * // Returns: "resource->'name'->0->>'family'"
     * 
     * convertToJsonbQuery("$.telecom[*].value")
     * // Returns: "resource->'telecom'->0->>'value'"
     * 
     * convertToJsonbQuery("$.gender")
     * // Returns: "resource->>'gender'"
     * 
     * convertToJsonbQuery("$.id")
     * // Returns: "resource->>'id'"
     * ```
     */
    private convertToJsonbQuery(jsonPath: string): string {
        this.logger.debug('Converting JSONPath to JSONB query', { jsonPath });

        // Handle special cases and invalid formats
        if (!jsonPath) {
            this.logger.warn('Empty JSONPath expression provided');
            return 'resource';
        }

        // If it's already a PostgreSQL JSONB expression, return as-is
        if (jsonPath.includes('resource->') || jsonPath.includes('->>')) {
            this.logger.debug('Expression already in PostgreSQL JSONB format', { jsonPath });
            return jsonPath;
        }

        // Handle non-JSONPath formats (legacy table.field format)
        if (!jsonPath.startsWith('$') && jsonPath.includes('.')) {
            this.logger.warn('Converting legacy table.field format to JSONPath', { jsonPath });
            const fieldName = jsonPath.split('.').pop() || 'id';
            jsonPath = `$.${fieldName}`;
        }

        // Remove the root $ and clean up the path
        let path = jsonPath.replace(/^\$\.?/, '');

        // Handle simple field access like "id", "status"
        if (!path || path === jsonPath) {
            path = jsonPath.replace(/^\$\.?/, '') || 'id';
        }

        // Handle array access patterns like "name[*].family"
        // Convert [*] or [0] to ->0 (we'll use index 0 for simplicity in search)
        path = path.replace(/\[\*\]/g, '->0');
        path = path.replace(/\[(\d+)\]/g, '->$1');

        // Split the path into segments
        const segments = path.split('.');

        let result = 'resource';

        // Build the JSONB path
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (segment.includes('->')) {
                // This segment already has array access
                const [field, ...arrayParts] = segment.split('->');
                result += `->'${field}'`;
                for (const arrayPart of arrayParts) {
                    result += `->${arrayPart}`;
                }
            } else if (i === segments.length - 1) {
                // Last segment - use ->> to get text value
                result += `->>'${segment}'`;
            } else {
                // Intermediate segment - use -> to navigate
                result += `->'${segment}'`;
            }
        }

        this.logger.debug('JSONPath converted to JSONB query', {
            original: jsonPath,
            converted: result
        });

        return result;
    }
}
