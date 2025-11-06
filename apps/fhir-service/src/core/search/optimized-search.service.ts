import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ParsedQs } from 'qs';
import { DataSource, Repository } from 'typeorm';
import {
    FhirBundleType,
    FhirFieldName,
    FhirJsonPath,
    FhirResourceType,
    FhirSearchMode,
    FhirSearchParameterName,
    FhirSearchParameterType,
    FhirSearchPrefix
} from '../../common/enums/fhir-enums';
import { FhirSearchParameter } from './fhir-search-parameter.entity';

/**
 * Enhanced service for executing optimized FHIR search operations.
 * 
 * This service extends the base GenericSearchService with index-aware query optimization:
 * - Detects when functional indexes are available for specific search parameters
 * - Uses optimized query paths when indexes exist
 * - Falls back to expression-based searches when needed
 * - Provides performance monitoring and analytics
 * 
 * @example
 * ```typescript
 * // Uses functional index: idx_patient_family_name
 * const results = await searchService.search('Patient', { name: 'Smith' });
 * 
 * // Uses functional index: idx_observation_code
 * const results = await searchService.search('Observation', { code: '8310-5' });
 * ```
 */
@Injectable()
export class OptimizedSearchService {
    private readonly logger = new Logger(OptimizedSearchService.name);

    // Index registry for optimization decisions
    private readonly functionalIndexes = new Map<string, Set<string>>([
        [FhirResourceType.PATIENT, new Set([
            FhirFieldName.NAME, FhirFieldName.GIVEN, FhirFieldName.BIRTH_DATE_PARAM, FhirFieldName.GENDER, FhirFieldName.ACTIVE, FhirFieldName.IDENTIFIER
        ])],
        [FhirResourceType.PRACTITIONER, new Set([
            FhirFieldName.NAME, FhirFieldName.GIVEN, FhirFieldName.FAMILY, FhirFieldName.IDENTIFIER, FhirFieldName.ACTIVE
        ])],
        [FhirResourceType.OBSERVATION, new Set([
            FhirFieldName.CODE, FhirFieldName.DATE, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.CATEGORY
        ])],
        [FhirResourceType.CONDITION, new Set([
            FhirFieldName.CODE, FhirFieldName.SUBJECT, FhirFieldName.CLINICAL_STATUS_PARAM, FhirFieldName.VERIFICATION_STATUS_PARAM
        ])],
        [FhirResourceType.ENCOUNTER, new Set([
            FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.CLASS, FhirFieldName.DATE
        ])],
        [FhirResourceType.PROCEDURE, new Set([
            FhirFieldName.CODE, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.DATE
        ])],
        [FhirResourceType.DIAGNOSTIC_REPORT, new Set([
            FhirFieldName.CODE, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.DATE
        ])],
        [FhirResourceType.SERVICE_REQUEST, new Set([
            FhirFieldName.CODE, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.INTENT, FhirFieldName.AUTHORED_ON_PARAM
        ])],
        [FhirResourceType.MEDICATION_REQUEST, new Set([
            FhirFieldName.MEDICATION, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.INTENT, FhirFieldName.AUTHORED_ON_PARAM
        ])],
        [FhirResourceType.MEDICATION_STATEMENT, new Set([
            FhirFieldName.MEDICATION, FhirFieldName.SUBJECT, FhirFieldName.STATUS, FhirFieldName.EFFECTIVE_DATE_PARAM
        ])],
        [FhirResourceType.COMPOSITION, new Set([
            FhirFieldName.SUBJECT, FhirFieldName.TYPE, FhirFieldName.STATUS, FhirFieldName.DATE
        ])],
        [FhirResourceType.FAMILY_MEMBER_HISTORY, new Set([
            FhirFieldName.PATIENT, FhirFieldName.STATUS, FhirFieldName.RELATIONSHIP, FhirFieldName.CONDITION_CODE_PARAM
        ])],
        [FhirResourceType.ALLERGY_INTOLERANCE, new Set([
            FhirFieldName.CODE, FhirFieldName.PATIENT, FhirFieldName.CLINICAL_STATUS_PARAM, FhirFieldName.VERIFICATION_STATUS_PARAM
        ])],
        [FhirResourceType.APPOINTMENT, new Set([
            FhirFieldName.PATIENT, FhirFieldName.PRACTITIONER, FhirFieldName.DATE, FhirFieldName.STATUS
        ])],
        [FhirResourceType.ORGANIZATION, new Set([
            FhirFieldName.NAME, FhirFieldName.IDENTIFIER, FhirFieldName.ACTIVE, FhirFieldName.TYPE
        ])],
        [FhirResourceType.LOCATION, new Set([
            FhirFieldName.NAME, FhirFieldName.IDENTIFIER, FhirFieldName.STATUS, FhirFieldName.TYPE
        ])],
        [FhirResourceType.MEDICATION, new Set([
            FhirFieldName.CODE, FhirFieldName.INGREDIENT, FhirFieldName.MANUFACTURER
        ])],
        [FhirResourceType.DEVICE, new Set([
            FhirFieldName.IDENTIFIER, FhirFieldName.TYPE, FhirFieldName.STATUS, FhirFieldName.PATIENT
        ])],
        [FhirResourceType.SPECIMEN, new Set([
            FhirFieldName.IDENTIFIER, FhirFieldName.TYPE, FhirFieldName.SUBJECT, FhirFieldName.STATUS
        ])]
    ]);

    constructor(
        @InjectRepository(FhirSearchParameter)
        private readonly searchParamRepo: Repository<FhirSearchParameter>,
        private readonly dataSource: DataSource,
    ) {
        this.logger.log('OptimizedSearchService initialized with index registry');
    }

    /**
     * Executes an optimized FHIR search using functional indexes where available.
     * 
     * @param resourceType - The FHIR resource type to search
     * @param queryParams - Query parameters from the HTTP request
     * @returns Promise resolving to search results and performance metrics
     */
    async search(resourceType: string, queryParams: ParsedQs) {
        const startTime = Date.now();
        const searchMetrics = {
            resourceType,
            totalParams: Object.keys(queryParams).length,
            optimizedParams: 0,
            fallbackParams: 0,
            resultCount: 0,
            duration: 0
        };

        this.logger.log('Starting optimized FHIR search', {
            resourceType,
            paramCount: searchMetrics.totalParams,
            params: Object.keys(queryParams)
        });

        const tableName = resourceType.toLowerCase();
        const queryBuilder = this.dataSource
            .getRepository(tableName)
            .createQueryBuilder(tableName)
            .select([
                `${tableName}.id`,
                `${tableName}.resource`,
                `${tableName}.versionId`,
                `${tableName}.lastUpdated`
            ]);

        // Handle pagination
        const count = parseInt((queryParams[FhirSearchParameterName.COUNT] as string) || '20', 10);
        const offset = parseInt((queryParams[FhirSearchParameterName.OFFSET] as string) || '0', 10);
        queryBuilder.take(count).skip(offset);

        // Extract and apply search criteria
        const searchCriteria = { ...queryParams };
        delete searchCriteria[FhirSearchParameterName.COUNT];
        delete searchCriteria[FhirSearchParameterName.OFFSET];

        // Process each search parameter with optimization
        for (const [paramName, value] of Object.entries(searchCriteria)) {
            const stringValue = value as string;

            try {
                if (paramName.includes('.')) {
                    // Handle chained searches
                    await this.applyChainedSearch(queryBuilder, resourceType, paramName, stringValue);
                    searchMetrics.fallbackParams++;
                } else {
                    // Check if we can use an optimized path
                    const applied = await this.applyOptimizedSearch(
                        queryBuilder,
                        resourceType,
                        paramName,
                        stringValue
                    );

                    if (applied) {
                        searchMetrics.optimizedParams++;
                    } else {
                        searchMetrics.fallbackParams++;
                    }
                }
            } catch (error) {
                this.logger.error('Error applying search parameter', {
                    resourceType,
                    parameter: paramName,
                    value: stringValue,
                    error: error.message
                });
                throw error;
            }
        }

        // Execute query and collect metrics
        const [results, total] = await queryBuilder.getManyAndCount();
        searchMetrics.resultCount = results.length;
        searchMetrics.duration = Date.now() - startTime;

        // Log performance metrics
        this.logger.log('Optimized search completed', {
            ...searchMetrics,
            totalMatches: total,
            optimizationRatio: searchMetrics.optimizedParams / (searchMetrics.optimizedParams + searchMetrics.fallbackParams) || 0,
            avgResultProcessingTime: searchMetrics.duration / Math.max(1, searchMetrics.resultCount)
        });

        // Return FHIR Bundle format
        return this.formatSearchResults(resourceType, results, total, count, offset);
    }

    /**
     * Applies search parameter using optimized index path when available.
     * 
     * @param queryBuilder - The query builder to modify
     * @param resourceType - FHIR resource type
     * @param paramName - Search parameter name
     * @param value - Search value
     * @returns True if optimized path was used, false if fallback needed
     */
    private async applyOptimizedSearch(
        queryBuilder: any,
        resourceType: string,
        paramName: string,
        value: string
    ): Promise<boolean> {
        // Check if we have a functional index for this parameter
        const hasIndex = this.functionalIndexes.get(resourceType)?.has(paramName);

        if (!hasIndex) {
            // Fall back to expression-based search
            return await this.applyExpressionSearch(queryBuilder, resourceType, paramName, value);
        }

        // Use optimized index-aware query
        const uniqueParam = `${paramName}_${Math.random().toString(36).substring(7)}`;

        switch (resourceType) {
            case FhirResourceType.PATIENT:
                return this.applyPatientOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.PRACTITIONER:
                return this.applyPractitionerOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.OBSERVATION:
                return this.applyObservationOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.CONDITION:
                return this.applyConditionOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.ENCOUNTER:
                return this.applyEncounterOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.PROCEDURE:
                return this.applyProcedureOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.DIAGNOSTIC_REPORT:
                return this.applyDiagnosticReportOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.SERVICE_REQUEST:
                return this.applyServiceRequestOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.MEDICATION_REQUEST:
                return this.applyMedicationRequestOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.MEDICATION_STATEMENT:
                return this.applyMedicationStatementOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.COMPOSITION:
                return this.applyCompositionOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.FAMILY_MEMBER_HISTORY:
                return this.applyFamilyMemberHistoryOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.ALLERGY_INTOLERANCE:
                return this.applyAllergyIntoleranceOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.APPOINTMENT:
                return this.applyAppointmentOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.ORGANIZATION:
                return this.applyOrganizationOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.LOCATION:
                return this.applyLocationOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.MEDICATION:
                return this.applyMedicationOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.DEVICE:
                return this.applyDeviceOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            case FhirResourceType.SPECIMEN:
                return this.applySpecimenOptimizedSearch(queryBuilder, paramName, value, uniqueParam);
            default:
                return await this.applyExpressionSearch(queryBuilder, resourceType, paramName, value);
        }
    }

    /**
     * Applies optimized Patient search using functional indexes.
     */
    private applyPatientOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.NAME:
                // Uses idx_patient_family_name
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME_FAMILY} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.GIVEN:
                // Uses idx_patient_given_name  
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME_GIVEN} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.BIRTH_DATE_PARAM: {
                // Uses idx_patient_birthdate
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.BIRTH_DATE}::date ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            case FhirFieldName.GENDER:
                // Uses idx_patient_gender
                queryBuilder.andWhere(
                    `${FhirJsonPath.GENDER} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.ACTIVE:
                // Uses idx_patient_active
                queryBuilder.andWhere(
                    `${FhirJsonPath.ACTIVE}::boolean = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue === 'true' }
                );
                break;

            case FhirFieldName.IDENTIFIER:
                // Uses idx_patient_identifier_value or idx_patient_identifier_system
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Patient search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Observation search using functional indexes.
     */
    private applyObservationOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                // Uses idx_observation_code
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                // Uses idx_observation_effective_date
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.EFFECTIVE_DATE_TIME}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            case FhirFieldName.SUBJECT:
                // Uses idx_observation_subject_ref
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                // Uses idx_observation_status
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.CATEGORY:
                // Uses idx_observation_category
                queryBuilder.andWhere(
                    `${FhirJsonPath.CATEGORY_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Observation search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Condition search using functional indexes.
     */
    private applyConditionOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.CLINICAL_STATUS_PARAM:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CLINICAL_STATUS_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.VERIFICATION_STATUS_PARAM:
                queryBuilder.andWhere(
                    `${FhirJsonPath.VERIFICATION_STATUS_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Condition search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Encounter search using functional indexes.
     */
    private applyEncounterOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.CLASS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CLASS_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.PERIOD_START}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized Encounter search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Practitioner search using functional indexes.
     */
    private applyPractitionerOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.NAME:
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME_FAMILY} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.GIVEN:
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME_GIVEN} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.FAMILY:
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME_FAMILY} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.IDENTIFIER:
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            case FhirFieldName.ACTIVE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.ACTIVE}::boolean = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue === 'true' }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Practitioner search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Procedure search using functional indexes.
     */
    private applyProcedureOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.PERFORMED_DATE_TIME}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized Procedure search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized DiagnosticReport search using functional indexes.
     */
    private applyDiagnosticReportOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.EFFECTIVE_DATE_TIME}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized DiagnosticReport search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized ServiceRequest search using functional indexes.
     */
    private applyServiceRequestOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.INTENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.INTENT} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.AUTHORED_ON_PARAM: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.AUTHORED_ON}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized ServiceRequest search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized MedicationRequest search using functional indexes.
     */
    private applyMedicationRequestOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.MEDICATION:
                queryBuilder.andWhere(
                    `${FhirJsonPath.MEDICATION_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.INTENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.INTENT} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.AUTHORED_ON_PARAM: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.AUTHORED_ON}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized MedicationRequest search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized MedicationStatement search using functional indexes.
     */
    private applyMedicationStatementOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.MEDICATION:
                queryBuilder.andWhere(
                    `${FhirJsonPath.MEDICATION_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.EFFECTIVE_DATE_PARAM: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.EFFECTIVE_DATE_TIME}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized MedicationStatement search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Composition search using functional indexes.
     */
    private applyCompositionOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.TYPE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.TYPE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.DATE}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            default:
                return false;
        }

        this.logger.debug('Applied optimized Composition search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized FamilyMemberHistory search using functional indexes.
     */
    private applyFamilyMemberHistoryOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.PATIENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.PATIENT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.RELATIONSHIP:
                queryBuilder.andWhere(
                    `${FhirJsonPath.RELATIONSHIP_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.CONDITION_CODE_PARAM:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CONDITION_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized FamilyMemberHistory search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized AllergyIntolerance search using functional indexes.
     */
    private applyAllergyIntoleranceOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.PATIENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.PATIENT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.CLINICAL_STATUS_PARAM:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CLINICAL_STATUS_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.VERIFICATION_STATUS_PARAM:
                queryBuilder.andWhere(
                    `${FhirJsonPath.VERIFICATION_STATUS_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized AllergyIntolerance search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Appointment search using functional indexes.
     */
    private applyAppointmentOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.PATIENT:
                queryBuilder.andWhere(
                    `(resource -> '${FhirFieldName.PARTICIPANT}' @> '[{"${FhirFieldName.ACTOR}": {"${FhirFieldName.REFERENCE}": "${cleanValue}"}}]')`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.PRACTITIONER:
                queryBuilder.andWhere(
                    `(resource -> '${FhirFieldName.PARTICIPANT}' @> '[{"${FhirFieldName.ACTOR}": {"${FhirFieldName.REFERENCE}": "${cleanValue}"}}]')`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.DATE: {
                const operator = this.getDateOperator(prefix);
                queryBuilder.andWhere(
                    `${FhirJsonPath.APPOINTMENT_START}::timestamp ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Appointment search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Organization search using functional indexes.
     */
    private applyOrganizationOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.NAME:
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.IDENTIFIER:
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            case FhirFieldName.ACTIVE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.ACTIVE}::boolean = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue === 'true' }
                );
                break;

            case FhirFieldName.TYPE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.TYPE_ARRAY_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Organization search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Location search using functional indexes.
     */
    private applyLocationOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.NAME:
                queryBuilder.andWhere(
                    `${FhirJsonPath.NAME} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirFieldName.IDENTIFIER:
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.TYPE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.TYPE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Location search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Medication search using functional indexes.
     */
    private applyMedicationOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.CODE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.CODE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.INGREDIENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.INGREDIENT_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.MANUFACTURER:
                queryBuilder.andWhere(
                    `${FhirJsonPath.MANUFACTURER_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Medication search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Device search using functional indexes.
     */
    private applyDeviceOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.IDENTIFIER:
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            case FhirFieldName.TYPE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.TYPE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.PATIENT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.PATIENT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Device search', { paramName, value });
        return true;
    }

    /**
     * Applies optimized Specimen search using functional indexes.
     */
    private applySpecimenOptimizedSearch(
        queryBuilder: any,
        paramName: string,
        value: string,
        uniqueParam: string
    ): boolean {
        const { prefix, value: cleanValue } = this.parseSearchValue(value);

        switch (paramName) {
            case FhirFieldName.IDENTIFIER:
                if (cleanValue.includes('|')) {
                    const [system, code] = cleanValue.split('|');
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_SYSTEM} = :${uniqueParam}_sys AND ${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}_val`,
                        { [`${uniqueParam}_sys`]: system, [`${uniqueParam}_val`]: code }
                    );
                } else {
                    queryBuilder.andWhere(
                        `${FhirJsonPath.IDENTIFIER_VALUE} = :${uniqueParam}`,
                        { [uniqueParam]: cleanValue }
                    );
                }
                break;

            case FhirFieldName.TYPE:
                queryBuilder.andWhere(
                    `${FhirJsonPath.TYPE_CODING_CODE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.SUBJECT:
                queryBuilder.andWhere(
                    `${FhirJsonPath.SUBJECT_REFERENCE} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            case FhirFieldName.STATUS:
                queryBuilder.andWhere(
                    `${FhirJsonPath.STATUS} = :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;

            default:
                return false;
        }

        this.logger.debug('Applied optimized Specimen search', { paramName, value });
        return true;
    }

    /**
     * Fallback to expression-based search when no functional index is available.
     */
    private async applyExpressionSearch(
        queryBuilder: any,
        resourceType: string,
        paramName: string,
        value: string
    ): Promise<boolean> {
        const searchParamDef = await this.searchParamRepo.findOneBy({
            resourceType,
            name: paramName
        });

        if (!searchParamDef) {
            this.logger.warn('Unknown search parameter', { resourceType, paramName });
            return false;
        }

        // Use the existing expression-based logic from GenericSearchService
        const { expression, type } = searchParamDef;
        const { prefix, value: cleanValue } = this.parseSearchValue(value);
        const uniqueParam = `${paramName}_${Math.random().toString(36).substring(7)}`;

        switch (type) {
            case FhirSearchParameterType.DATE:
            case FhirSearchParameterType.NUMBER: {
                const operator = type === FhirSearchParameterType.DATE ? this.getDateOperator(prefix) : this.getNumericOperator(prefix);
                const castType = type === FhirSearchParameterType.DATE ? '::timestamp' : '::numeric';
                queryBuilder.andWhere(
                    `(${expression})${castType} ${operator} :${uniqueParam}`,
                    { [uniqueParam]: cleanValue }
                );
                break;
            }

            case FhirSearchParameterType.STRING:
                queryBuilder.andWhere(
                    `${expression} ILIKE :${uniqueParam}`,
                    { [uniqueParam]: `%${cleanValue}%` }
                );
                break;

            case FhirSearchParameterType.TOKEN:
                if (paramName === FhirSearchParameterName.ID) {
                    queryBuilder.andWhere(`${expression} = :${uniqueParam}`, { [uniqueParam]: cleanValue });
                } else {
                    queryBuilder.andWhere(`${expression} = :${uniqueParam}`, { [uniqueParam]: cleanValue });
                }
                break;

            case FhirSearchParameterType.REFERENCE:
                queryBuilder.andWhere(`${expression} LIKE :${uniqueParam}`, { [uniqueParam]: `%${cleanValue}%` });
                break;
        }

        this.logger.debug('Applied expression-based search', { resourceType, paramName, type });
        return true;
    }

    /**
     * Handles chained search parameters (e.g., subject:Patient.name).
     */
    private async applyChainedSearch(
        queryBuilder: any,
        resourceType: string,
        key: string,
        value: string
    ): Promise<void> {
        // Implementation similar to GenericSearchService but with optimization awareness
        this.logger.debug('Applying chained search (fallback)', { resourceType, key, value });

        // For now, use the same logic as the base service
        // TODO: Implement index-aware chained search optimization
    }

    /**
     * Parses search value to extract prefix and clean value.
     */
    private parseSearchValue(value: string): { prefix?: string; value: string } {
        const prefixes = [
            FhirSearchPrefix.EQ,
            FhirSearchPrefix.NE,
            FhirSearchPrefix.GT,
            FhirSearchPrefix.LT,
            FhirSearchPrefix.GE,
            FhirSearchPrefix.LE
        ];

        for (const prefix of prefixes) {
            if (value.startsWith(prefix)) {
                return { prefix, value: value.substring(prefix.length) };
            }
        }

        return { prefix: FhirSearchPrefix.EQ, value };
    }

    /**
     * Gets SQL operator for date comparisons.
     */
    private getDateOperator(prefix?: string): string {
        switch (prefix) {
            case FhirSearchPrefix.GT: return '>';
            case FhirSearchPrefix.LT: return '<';
            case FhirSearchPrefix.GE: return '>=';
            case FhirSearchPrefix.LE: return '<=';
            case FhirSearchPrefix.NE: return '!=';
            default: return '=';
        }
    }

    /**
     * Gets SQL operator for numeric comparisons.
     */
    private getNumericOperator(prefix?: string): string {
        return this.getDateOperator(prefix); // Same logic
    }

    /**
     * Formats search results as FHIR Bundle.
     */
    private formatSearchResults(
        resourceType: string,
        results: any[],
        total: number,
        count: number,
        offset: number
    ) {
        return {
            resourceType: FhirResourceType.BUNDLE,
            type: FhirBundleType.SEARCHSET,
            total,
            entry: results.map(result => ({
                resource: result.resource,
                search: { mode: FhirSearchMode.MATCH }
            })),
            link: [
                {
                    relation: 'self',
                    url: `${resourceType}?_count=${count}&_offset=${offset}`
                }
            ]
        };
    }
}
