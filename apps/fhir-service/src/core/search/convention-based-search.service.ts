import { Injectable, Logger } from '@nestjs/common';
import { ParsedQs } from 'qs';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FhirResourceType, FhirSearchParameterType, FhirSearchPrefix } from '../../common/enums/fhir-enums';

/**
 * Convention-based FHIR search service that eliminates the need for the fhir_search_params table.
 * 
 * This service uses FHIR naming conventions and functional database indexes to provide
 * search capability without maintaining hundreds of search parameter definitions.
 * 
 * Benefits:
 * - No more search parameter table maintenance
 * - Automatic search capability for new resources
 * - Better performance through targeted functional indexes
 * - Simpler codebase with fewer edge cases
 */
@Injectable()
export class ConventionBasedSearchService {
    private readonly logger = new Logger(ConventionBasedSearchService.name);

    /**
     * Standard FHIR field mappings organized by search parameter type.
     * These follow FHIR specification conventions and work for 90% of use cases.
     */
    private readonly STANDARD_FIELD_MAPPINGS = {
        [FhirSearchParameterType.STRING]: new Map([
            ['name', ['name[*].family', 'name[*].given[*]', 'name[*].text']],
            ['family', ['name[*].family']],
            ['given', ['name[*].given[*]']],
            ['address', ['address[*].text', 'address[*].line[*]']],
            ['address-city', ['address[*].city']],
            ['address-state', ['address[*].state']],
            ['address-postalcode', ['address[*].postalCode']],
            ['address-country', ['address[*].country']],
            ['phone', ['telecom[?(@.system=="phone")].value']],
            ['email', ['telecom[?(@.system=="email")].value']],
            ['title', ['title']],
            ['description', ['description']],
            ['publisher', ['publisher']],
        ]),

        [FhirSearchParameterType.TOKEN]: new Map([
            ['_id', ['id']],
            ['identifier', ['identifier[*].value']],
            ['gender', ['gender']],
            ['active', ['active']],
            ['status', ['status']],
            ['code', ['code.coding[*].code']],
            ['category', ['category[*].coding[*].code']],
            ['type', ['type[*].coding[*].code', 'type.coding[*].code']],
            ['class', ['class.code']],
            ['deceased', ['deceasedBoolean']],
            ['clinical-status', ['clinicalStatus.coding[*].code']],
            ['verification-status', ['verificationStatus.coding[*].code']],
            ['intent', ['intent']],
            ['priority', ['priority.coding[*].code']],
        ]),

        [FhirSearchParameterType.DATE]: new Map([
            ['birthdate', ['birthDate']],
            ['date', ['effectiveDateTime', 'performedDateTime', 'period.start', 'start', 'date']],
            ['period', ['period.start', 'period.end']],
            ['authored-on', ['authoredOn']],
            ['onset-date', ['onsetDateTime']],
            ['recorded-date', ['recordedDate']],
            ['collected', ['collection.collectedDateTime']],
            ['last-updated', ['meta.lastUpdated']],
        ]),

        [FhirSearchParameterType.REFERENCE]: new Map([
            ['patient', ['patient.reference', 'subject.reference']],
            ['subject', ['subject.reference']],
            ['encounter', ['encounter.reference']],
            ['performer', ['performer[*].reference', 'performer[*].actor.reference']],
            ['practitioner', ['practitioner.reference', 'participant[*].individual.reference']],
            ['organization', ['managingOrganization.reference', 'organization.reference']],
            ['location', ['location.reference', 'location[*].location.reference']],
            ['based-on', ['basedOn[*].reference']],
            ['part-of', ['partOf.reference']],
            ['focus', ['focus[*].reference']],
            ['context', ['context.reference']],
        ]),

        [FhirSearchParameterType.NUMBER]: new Map([
            ['length', ['length.value']],
            ['duration', ['duration.value']],
            ['priority', ['priority']],
        ]),

        [FhirSearchParameterType.QUANTITY]: new Map([
            ['value-quantity', ['valueQuantity.value']],
            ['component-value-quantity', ['component[*].valueQuantity.value']],
        ]),
    };

    /**
     * Resource-specific field mappings that override the standard conventions.
     * Use sparingly - only when the standard conventions don't apply.
     */
    private readonly RESOURCE_SPECIFIC_OVERRIDES = new Map([
        ['Patient', new Map([
            ['link', ['link[*].other.reference']],
            ['general-practitioner', ['generalPractitioner[*].reference']],
            ['language', ['communication[*].language.coding[*].code']],
        ])],

        ['Observation', new Map([
            ['component-code', ['component[*].code.coding[*].code']],
            ['component-value-string', ['component[*].valueString']],
            ['value-string', ['valueString']],
            ['value-code', ['valueCodeableConcept.coding[*].code']],
            ['method', ['method.coding[*].code']],
            ['device', ['device.reference']],
            ['specimen', ['specimen.reference']],
        ])],

        ['Encounter', new Map([
            ['participant', ['participant[*].individual.reference']],
            ['service-provider', ['serviceProvider.reference']],
            ['diagnosis', ['diagnosis[*].condition.reference']],
            ['reason-code', ['reasonCode[*].coding[*].code']],
            ['reason-reference', ['reasonReference[*].reference']],
        ])],

        ['Condition', new Map([
            ['severity', ['severity.coding[*].code']],
            ['body-site', ['bodySite[*].coding[*].code']],
            ['stage', ['stage[*].summary.coding[*].code']],
            ['evidence', ['evidence[*].code[*].coding[*].code']],
            ['asserter', ['asserter.reference']],
        ])],

        ['Procedure', new Map([
            ['reason-code', ['reasonCode[*].coding[*].code']],
            ['reason-reference', ['reasonReference[*].reference']],
            ['body-site', ['bodySite[*].coding[*].code']],
            ['outcome', ['outcome.coding[*].code']],
            ['complication', ['complication[*].coding[*].code']],
            ['follow-up', ['followUp[*].coding[*].code']],
            ['used-reference', ['usedReference[*].reference']],
            ['used-code', ['usedCode[*].coding[*].code']],
        ])],

        ['Organization', new Map([
            ['alias', ['alias[*]']],
            ['endpoint', ['endpoint[*].reference']],
            ['partof', ['partOf.reference']],
        ])],

        ['Practitioner', new Map([
            ['qualification', ['qualification[*].code.coding[*].code']],
            ['specialty', ['qualification[*].code.coding[*].code']],
        ])],

        ['CodeSystem', new Map([
            ['name', ['name']],  // CodeSystem name is a simple string, not complex structure
            ['title', ['title']],
            ['url', ['url']],
            ['version', ['version']],
            ['status', ['status']],
            ['date', ['date']],
            ['publisher', ['publisher']],
            ['description', ['description']],
        ])],

        ['ValueSet', new Map([
            ['name', ['name']],  // ValueSet name is also a simple string
            ['title', ['title']],
            ['url', ['url']],
            ['version', ['version']],
            ['status', ['status']],
            ['date', ['date']],
            ['publisher', ['publisher']],
            ['description', ['description']],
        ])],

        ['CarePlan', new Map([
            ['status', ['status']],
            ['intent', ['intent']],
            ['category', ['category[*].coding[*].code']],
            ['subject', ['subject.reference']],
            ['encounter', ['encounter.reference']],
            ['date', ['created']],
            ['period', ['period.start', 'period.end']],
            ['performer', ['careTeam[*].reference', 'author.reference']],
            ['care-team', ['careTeam[*].reference']],
            ['goal', ['goal[*].reference']],
            ['activity-code', ['activity[*].detail.code.coding[*].code']],
            ['activity-reference', ['activity[*].reference.reference']],
            ['based-on', ['basedOn[*].reference']],
            ['replaces', ['replaces[*].reference']],
            ['part-of', ['partOf.reference']],
            ['instantiates-canonical', ['instantiatesCanonical[*]']],
            ['instantiates-uri', ['instantiatesUri[*]']],
        ])],
    ]);

    /**
     * Functional index mappings for optimized queries.
     * These correspond to actual database indexes for better performance.
     */
    private readonly FUNCTIONAL_INDEX_MAPPINGS = new Map([
        // Patient indexes
        ['Patient.name.family', 'resource->\'name\'->0->>\'family\''],
        ['Patient.name.given', 'resource->\'name\'->0->\'given\'->>0'],
        ['Patient.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['Patient.gender', 'resource->>\'gender\''],
        ['Patient.birthDate', 'resource->>\'birthDate\''],
        ['Patient.active', 'resource->>\'active\''],
        ['Patient.address.city', 'resource->\'address\'->0->>\'city\''],
        ['Patient.address.state', 'resource->\'address\'->0->>\'state\''],
        ['Patient.address.postalCode', 'resource->\'address\'->0->>\'postalCode\''],
        ['Patient.telecom.phone', 'resource->\'telecom\'->0->>\'value\''],

        // Observation indexes
        ['Observation.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['Observation.status', 'resource->>\'status\''],
        ['Observation.effectiveDateTime', 'resource->>\'effectiveDateTime\''],
        ['Observation.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Observation.category', 'resource->\'category\'->0->\'coding\'->0->>\'code\''],
        ['Observation.valueString', 'resource->>\'valueString\''],
        ['Observation.valueQuantity.value', 'resource->\'valueQuantity\'->>\'value\''],
        ['Observation.performer.reference', 'resource->\'performer\'->0->>\'reference\''],

        // Encounter indexes
        ['Encounter.status', 'resource->>\'status\''],
        ['Encounter.class', 'resource->\'class\'->>\'code\''],
        ['Encounter.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Encounter.period.start', 'resource->\'period\'->>\'start\''],
        ['Encounter.period.end', 'resource->\'period\'->>\'end\''],
        ['Encounter.type', 'resource->\'type\'->0->\'coding\'->0->>\'code\''],
        ['Encounter.serviceProvider.reference', 'resource->\'serviceProvider\'->>\'reference\''],

        // Condition indexes
        ['Condition.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['Condition.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Condition.clinicalStatus', 'resource->\'clinicalStatus\'->\'coding\'->0->>\'code\''],
        ['Condition.verificationStatus', 'resource->\'verificationStatus\'->\'coding\'->0->>\'code\''],
        ['Condition.category', 'resource->\'category\'->0->\'coding\'->0->>\'code\''],
        ['Condition.severity', 'resource->\'severity\'->\'coding\'->0->>\'code\''],
        ['Condition.onsetDateTime', 'resource->>\'onsetDateTime\''],
        ['Condition.recordedDate', 'resource->>\'recordedDate\''],

        // Procedure indexes
        ['Procedure.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['Procedure.status', 'resource->>\'status\''],
        ['Procedure.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Procedure.performedDateTime', 'resource->>\'performedDateTime\''],
        ['Procedure.category', 'resource->\'category\'->\'coding\'->0->>\'code\''],
        ['Procedure.performer.reference', 'resource->\'performer\'->0->\'actor\'->>\'reference\''],

        // Organization indexes
        ['Organization.name', 'resource->>\'name\''],
        ['Organization.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['Organization.active', 'resource->>\'active\''],
        ['Organization.type', 'resource->\'type\'->0->\'coding\'->0->>\'code\''],
        ['Organization.address.city', 'resource->\'address\'->0->>\'city\''],
        ['Organization.address.state', 'resource->\'address\'->0->>\'state\''],

        // Practitioner indexes
        ['Practitioner.name.family', 'resource->\'name\'->0->>\'family\''],
        ['Practitioner.name.given', 'resource->\'name\'->0->\'given\'->>0'],
        ['Practitioner.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['Practitioner.active', 'resource->>\'active\''],
        ['Practitioner.gender', 'resource->>\'gender\''],
        ['Practitioner.qualification.code', 'resource->\'qualification\'->0->\'code\'->\'coding\'->0->>\'code\''],

        // CodeSystem indexes
        ['CodeSystem.name', 'resource->>\'name\''],
        ['CodeSystem.title', 'resource->>\'title\''],
        ['CodeSystem.url', 'resource->>\'url\''],
        ['CodeSystem.status', 'resource->>\'status\''],
        ['CodeSystem.version', 'resource->>\'version\''],
        ['CodeSystem.publisher', 'resource->>\'publisher\''],
        ['CodeSystem.date', 'resource->>\'date\''],

        // ValueSet indexes
        ['ValueSet.name', 'resource->>\'name\''],
        ['ValueSet.title', 'resource->>\'title\''],
        ['ValueSet.url', 'resource->>\'url\''],
        ['ValueSet.status', 'resource->>\'status\''],
        ['ValueSet.version', 'resource->>\'version\''],
        ['ValueSet.publisher', 'resource->>\'publisher\''],
        ['ValueSet.date', 'resource->>\'date\''],

        // CarePlan indexes
        ['CarePlan.status', 'resource->>\'status\''],
        ['CarePlan.intent', 'resource->>\'intent\''],
        ['CarePlan.category', 'resource->\'category\'->0->\'coding\'->0->>\'code\''],
        ['CarePlan.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['CarePlan.encounter.reference', 'resource->\'encounter\'->>\'reference\''],
        ['CarePlan.created', 'resource->>\'created\''],
        ['CarePlan.period.start', 'resource->\'period\'->>\'start\''],
        ['CarePlan.period.end', 'resource->\'period\'->>\'end\''],
        ['CarePlan.author.reference', 'resource->\'author\'->>\'reference\''],
        ['CarePlan.careTeam.reference', 'resource->\'careTeam\'->0->>\'reference\''],
        ['CarePlan.goal.reference', 'resource->\'goal\'->0->>\'reference\''],
        ['CarePlan.activity.code', 'resource->\'activity\'->0->\'detail\'->\'code\'->\'coding\'->0->>\'code\''],
        ['CarePlan.basedOn.reference', 'resource->\'basedOn\'->0->>\'reference\''],
        ['CarePlan.replaces.reference', 'resource->\'replaces\'->0->>\'reference\''],
        ['CarePlan.partOf.reference', 'resource->\'partOf\'->>\'reference\''],
        ['CarePlan.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['CarePlan.identifier.system', 'resource->\'identifier\'->0->>\'system\''],

        // AllergyIntolerance indexes
        ['AllergyIntolerance.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['AllergyIntolerance.patient.reference', 'resource->\'patient\'->>\'reference\''],
        ['AllergyIntolerance.clinicalStatus', 'resource->\'clinicalStatus\'->\'coding\'->0->>\'code\''],
        ['AllergyIntolerance.verificationStatus', 'resource->\'verificationStatus\'->\'coding\'->0->>\'code\''],
        ['AllergyIntolerance.type', 'resource->>\'type\''],
        ['AllergyIntolerance.category', 'resource->0'],
        ['AllergyIntolerance.criticality', 'resource->>\'criticality\''],

        // MedicationRequest indexes
        ['MedicationRequest.status', 'resource->>\'status\''],
        ['MedicationRequest.intent', 'resource->>\'intent\''],
        ['MedicationRequest.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['MedicationRequest.medication.reference', 'resource->\'medicationReference\'->>\'reference\''],
        ['MedicationRequest.medication.code', 'resource->\'medicationCodeableConcept\'->\'coding\'->0->>\'code\''],
        ['MedicationRequest.authoredOn', 'resource->>\'authoredOn\''],
        ['MedicationRequest.requester.reference', 'resource->\'requester\'->>\'reference\''],

        // MedicationStatement indexes
        ['MedicationStatement.status', 'resource->>\'status\''],
        ['MedicationStatement.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['MedicationStatement.medication.reference', 'resource->\'medicationReference\'->>\'reference\''],
        ['MedicationStatement.medication.code', 'resource->\'medicationCodeableConcept\'->\'coding\'->0->>\'code\''],
        ['MedicationStatement.effectiveDateTime', 'resource->>\'effectiveDateTime\''],

        // FamilyMemberHistory indexes
        ['FamilyMemberHistory.patient.reference', 'resource->\'patient\'->>\'reference\''],
        ['FamilyMemberHistory.status', 'resource->>\'status\''],
        ['FamilyMemberHistory.relationship', 'resource->\'relationship\'->\'coding\'->0->>\'code\''],
        ['FamilyMemberHistory.condition.code', 'resource->\'condition\'->0->\'code\'->\'coding\'->0->>\'code\''],

        // DiagnosticReport indexes
        ['DiagnosticReport.status', 'resource->>\'status\''],
        ['DiagnosticReport.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['DiagnosticReport.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['DiagnosticReport.category', 'resource->\'category\'->0->\'coding\'->0->>\'code\''],
        ['DiagnosticReport.effectiveDateTime', 'resource->>\'effectiveDateTime\''],
        ['DiagnosticReport.performer.reference', 'resource->\'performer\'->0->>\'reference\''],

        // ServiceRequest indexes
        ['ServiceRequest.status', 'resource->>\'status\''],
        ['ServiceRequest.intent', 'resource->>\'intent\''],
        ['ServiceRequest.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['ServiceRequest.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['ServiceRequest.category', 'resource->\'category\'->0->\'coding\'->0->>\'code\''],
        ['ServiceRequest.authoredOn', 'resource->>\'authoredOn\''],
        ['ServiceRequest.requester.reference', 'resource->\'requester\'->>\'reference\''],

        // Appointment indexes
        ['Appointment.status', 'resource->>\'status\''],
        ['Appointment.serviceType', 'resource->\'serviceType\'->0->\'coding\'->0->>\'code\''],
        ['Appointment.appointmentType', 'resource->\'appointmentType\'->\'coding\'->0->>\'code\''],
        ['Appointment.start', 'resource->>\'start\''],
        ['Appointment.end', 'resource->>\'end\''],
        ['Appointment.participant.actor.reference', 'resource->\'participant\'->0->\'actor\'->>\'reference\''],

        // Composition indexes
        ['Composition.status', 'resource->>\'status\''],
        ['Composition.type', 'resource->\'type\'->\'coding\'->0->>\'code\''],
        ['Composition.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Composition.date', 'resource->>\'date\''],
        ['Composition.author.reference', 'resource->\'author\'->0->>\'reference\''],
        ['Composition.title', 'resource->>\'title\''],

        // Location indexes
        ['Location.name', 'resource->>\'name\''],
        ['Location.status', 'resource->>\'status\''],
        ['Location.type', 'resource->\'type\'->0->\'coding\'->0->>\'code\''],
        ['Location.address.city', 'resource->\'address\'->>\'city\''],
        ['Location.address.state', 'resource->\'address\'->>\'state\''],
        ['Location.managingOrganization.reference', 'resource->\'managingOrganization\'->>\'reference\''],

        // Medication indexes
        ['Medication.code', 'resource->\'code\'->\'coding\'->0->>\'code\''],
        ['Medication.status', 'resource->>\'status\''],
        ['Medication.manufacturer.reference', 'resource->\'manufacturer\'->>\'reference\''],
        ['Medication.form', 'resource->\'form\'->\'coding\'->0->>\'code\''],

        // Device indexes
        ['Device.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['Device.status', 'resource->>\'status\''],
        ['Device.type', 'resource->\'type\'->\'coding\'->0->>\'code\''],
        ['Device.manufacturer', 'resource->>\'manufacturer\''],
        ['Device.deviceName.name', 'resource->\'deviceName\'->0->>\'name\''],
        ['Device.patient.reference', 'resource->\'patient\'->>\'reference\''],

        // Specimen indexes
        ['Specimen.identifier.value', 'resource->\'identifier\'->0->>\'value\''],
        ['Specimen.status', 'resource->>\'status\''],
        ['Specimen.type', 'resource->\'type\'->\'coding\'->0->>\'code\''],
        ['Specimen.subject.reference', 'resource->\'subject\'->>\'reference\''],
        ['Specimen.collection.collectedDateTime', 'resource->\'collection\'->>\'collectedDateTime\''],
        ['Specimen.collection.collector.reference', 'resource->\'collection\'->\'collector\'->>\'reference\''],
    ]);

    /**
     * Entity name mappings for FHIR resource types
     */
    private readonly ENTITY_NAME_MAP: Record<string, string> = {
        'Patient': 'patient',
        'Observation': 'observation',
        'Encounter': 'encounter',
        'Condition': 'condition',
        'Procedure': 'procedure',
        'Organization': 'organization',
        'Practitioner': 'practitioner',
        'CodeSystem': 'code_system',
        'ValueSet': 'value_set',
        'AllergyIntolerance': 'allergy_intolerance',
        'MedicationRequest': 'medication_request',
        'MedicationStatement': 'medication_statement',
        'FamilyMemberHistory': 'family_member_history',
        'DiagnosticReport': 'diagnostic_report',
        'ServiceRequest': 'service_request',
        'Appointment': 'appointment',
        'CarePlan': 'care_plan',
        'Composition': 'composition',
        'Location': 'location',
        'Medication': 'medication',
        'Device': 'device',
        'Specimen': 'specimen',
    };

    constructor(private readonly dataSource: DataSource) {
        this.logger.log('ConventionBasedSearchService initialized');
    }

    /**
     * Check if the current database connection is in an aborted transaction state.
     * This helps detect if we should avoid executing queries that will fail.
     */
    private async checkTransactionState(): Promise<boolean> {
        try {
            // Try a simple query to check if the connection is healthy
            await this.dataSource.query('SELECT 1');
            return true;
        } catch (error) {
            if (error.message?.includes('current transaction is aborted')) {
                this.logger.warn('Detected aborted transaction state - search operations may fail');
                return false;
            }
            // For other errors, assume the connection is healthy
            return true;
        }
    }

    /**
     * Creates a query builder with proper transaction state handling.
     * If the current transaction is aborted, it will use a fresh connection.
     */
    private async createQueryBuilder(entityName: string) {
        try {
            // Try to create a query builder with the existing connection
            const queryBuilder = this.dataSource
                .getRepository(entityName)
                .createQueryBuilder(entityName)
                .select(`${entityName}.resource`);

            // Test the connection with a simple operation
            await this.dataSource.query('SELECT 1');

            return { queryBuilder, needsCleanup: false };
        } catch (error) {
            if (error.message?.includes('current transaction is aborted')) {
                this.logger.debug('Current transaction is aborted, creating fresh connection for search');

                // Create a fresh query runner for read-only operations
                const queryRunner = this.dataSource.createQueryRunner();
                await queryRunner.connect();

                const queryBuilder = queryRunner.manager
                    .getRepository(entityName)
                    .createQueryBuilder(entityName)
                    .select(`${entityName}.resource`);

                return { queryBuilder, queryRunner, needsCleanup: true };
            }
            throw error;
        }
    }

    /**
     * Main search method that builds and executes FHIR search queries.
     */
    async search(resourceType: string, queryParams: ParsedQs) {
        const startTime = Date.now();
        this.logger.debug(`Convention-based search for ${resourceType}`, {
            queryParams: Object.keys(queryParams),
            paramCount: Object.keys(queryParams).length
        });

        // Get entity name and create query builder (with fallback for aborted transactions)
        const entityName = this.getEntityName(resourceType);
        let queryBuilderInfo: any;

        try {
            queryBuilderInfo = await this.createQueryBuilder(entityName);
        } catch (error) {
            this.logger.error('Failed to create query builder for search', {
                resourceType,
                error: error.message
            });
            throw new Error(`Cannot perform search for ${resourceType} - database connection error: ${error.message}`);
        }

        const { queryBuilder, queryRunner, needsCleanup } = queryBuilderInfo;

        // Handle pagination
        const count = parseInt((queryParams._count as string) || '20', 10);
        const offset = parseInt((queryParams._offset as string) || '0', 10);
        queryBuilder.take(count).skip(offset);

        // Extract search criteria (excluding pagination parameters)
        const searchCriteria = { ...queryParams };
        delete searchCriteria._count;
        delete searchCriteria._offset;

        // Apply search parameters with enhanced error handling
        let appliedParams = 0;
        for (const [paramName, value] of Object.entries(searchCriteria)) {
            if (paramName.startsWith('_')) continue; // Skip control parameters

            try {
                const paramType = this.inferParameterType(paramName, value as string);
                const success = await this.applySearchParameter(
                    queryBuilder,
                    resourceType,
                    paramName,
                    value as string,
                    paramType
                );

                if (success) appliedParams++;
            } catch (error) {
                this.logger.error('Error applying search parameter', {
                    resourceType,
                    parameter: paramName,
                    value,
                    error: error.message
                });

                // Check if this is a transaction abortion error
                if (error.message?.includes('current transaction is aborted')) {
                    throw new Error(`Cannot apply search parameter ${paramName} - transaction has been aborted: ${error.message}`);
                }

                // Continue with other parameters instead of failing completely
            }
        }

        // Execute query with proper error handling
        let results: any[], total: number;
        try {
            // Add debugging to see the actual SQL query
            const sql = queryBuilder.getQuery();
            const parameters = queryBuilder.getParameters();
            this.logger.debug('Executing SQL query', { sql, parameters });

            [results, total] = await queryBuilder.getManyAndCount();
        } catch (error) {
            this.logger.error('Convention-based search query failed', {
                resourceType,
                appliedParams,
                error: error.message,
                duration: Date.now() - startTime
            });

            // Check if this is a transaction abortion error
            if (error.message?.includes('current transaction is aborted')) {
                throw new Error(`Search operation cannot proceed - transaction has been aborted: ${error.message}`);
            }

            // Re-throw the original error
            throw error;
        } finally {
            // Clean up query runner if we created a fresh one
            if (needsCleanup && queryRunner) {
                try {
                    await queryRunner.release();
                } catch (cleanupError) {
                    this.logger.warn('Failed to release query runner', { error: cleanupError.message });
                }
            }
        }

        const duration = Date.now() - startTime;

        this.logger.log('Convention-based search completed', {
            resourceType,
            appliedParams,
            resultCount: results.length,
            totalMatches: total,
            duration: `${duration}ms`,
            pagination: { count, offset }
        });

        // Return FHIR Bundle
        return {
            resourceType: FhirResourceType.BUNDLE,
            id: uuidv4(),
            type: 'searchset',
            total,
            link: [{
                relation: 'self',
                url: `/${resourceType}?${new URLSearchParams(queryParams as any).toString()}`
            }],
            entry: results.map((r: any) => ({
                resource: r.resource,
                search: { mode: 'match' }
            })),
        };
    }

    /**
     * Apply a single search parameter to the query builder.
     */
    private async applySearchParameter(
        queryBuilder: any,
        resourceType: string,
        paramName: string,
        value: string,
        paramType: FhirSearchParameterType
    ): Promise<boolean> {
        this.logger.debug(`Applying search parameter: ${paramName}, type: ${paramType}, value: ${value}`);

        // Special handling for identifier searches across all identifiers
        if (paramName === 'identifier' && paramType === FhirSearchParameterType.TOKEN) {
            this.logger.debug(`Using specialized identifier search for ${paramName}`);
            return this.applyIdentifierSearch(queryBuilder, value);
        }

        const fieldPaths = this.getFieldPaths(resourceType, paramName, paramType);
        if (!fieldPaths.length) {
            this.logger.warn(`No field mapping found for ${resourceType}.${paramName}`);
            return false;
        }

        const uniqueParam = `${paramName}_${Math.random().toString(36).substring(7)}`;

        // Check for optimized functional index
        const indexKey = `${resourceType}.${fieldPaths[0]}`;
        const functionalIndex = this.FUNCTIONAL_INDEX_MAPPINGS.get(indexKey);

        if (functionalIndex) {
            this.logger.debug(`Using functional index for ${resourceType}.${paramName}`);
            return this.applyOptimizedQuery(queryBuilder, functionalIndex, value, paramType, uniqueParam);
        }

        // Fall back to JSONPath query
        this.logger.debug(`Using JSONPath query for ${resourceType}.${paramName}`);
        return this.applyJSONPathQuery(queryBuilder, fieldPaths, value, paramType, uniqueParam);
    }

    /**
     * Apply specialized identifier search across all identifiers in the array.
     * Handles both system|value format and value-only searches.
     */
    private applyIdentifierSearch(queryBuilder: any, value: string): boolean {
        try {
            const uniqueParam = `identifier_${Math.random().toString(36).substring(7)}`;

            // Check if value contains system|value format
            if (value.includes('|')) {
                const [system, identifierValue] = value.split('|', 2);

                if (system && identifierValue) {
                    // Search for specific system and value using @> operator
                    queryBuilder.andWhere(`resource @> :${uniqueParam}`, {
                        [uniqueParam]: JSON.stringify({
                            identifier: [{ system: system, value: identifierValue }]
                        })
                    });
                } else if (identifierValue) {
                    // Only value provided (empty system) - search all identifiers for this value
                    queryBuilder.andWhere(`resource @> :${uniqueParam}`, {
                        [uniqueParam]: JSON.stringify({
                            identifier: [{ value: identifierValue }]
                        })
                    });
                }
            } else {
                // Search across all identifiers for the value (no system specified)
                queryBuilder.andWhere(`resource @> :${uniqueParam}`, {
                    [uniqueParam]: JSON.stringify({
                        identifier: [{ value: value }]
                    })
                });
            }

            return true;
        } catch (error) {
            this.logger.error('Error applying identifier search', {
                value,
                error: error.message
            });

            // Check if this is a transaction abortion error
            if (error.message?.includes('current transaction is aborted')) {
                throw error; // Re-throw transaction errors immediately
            }

            return false;
        }
    }

    /**
     * Get field paths for a search parameter, checking overrides first.
     */
    private getFieldPaths(resourceType: string, paramName: string, paramType: FhirSearchParameterType): string[] {
        // Check resource-specific overrides first
        const resourceOverrides = this.RESOURCE_SPECIFIC_OVERRIDES.get(resourceType);
        if (resourceOverrides?.has(paramName)) {
            return resourceOverrides.get(paramName)!;
        }

        // Check standard mappings
        const standardMappings = this.STANDARD_FIELD_MAPPINGS[paramType];
        if (standardMappings?.has(paramName)) {
            return standardMappings.get(paramName)!;
        }

        // Fall back to convention-based derivation
        return this.deriveFieldPaths(paramName, paramType);
    }

    /**
     * Derive field paths based on FHIR naming conventions.
     */
    private deriveFieldPaths(paramName: string, paramType: FhirSearchParameterType): string[] {
        // Simple convention: parameter name maps to field name
        switch (paramType) {
            case FhirSearchParameterType.TOKEN:
                return [paramName];
            case FhirSearchParameterType.STRING:
                return [paramName];
            case FhirSearchParameterType.DATE:
                return [paramName, `${paramName}DateTime`];
            case FhirSearchParameterType.REFERENCE:
                return [`${paramName}.reference`];
            default:
                return [paramName];
        }
    }

    /**
     * Apply an optimized query using functional indexes.
     */
    private applyOptimizedQuery(
        queryBuilder: any,
        functionalIndex: string,
        value: string,
        paramType: FhirSearchParameterType,
        uniqueParam: string
    ): boolean {
        try {
            switch (paramType) {
                case FhirSearchParameterType.STRING:
                    queryBuilder.andWhere(`${functionalIndex} ILIKE :${uniqueParam}`, {
                        [uniqueParam]: `%${value}%`
                    });
                    break;

                case FhirSearchParameterType.TOKEN:
                    queryBuilder.andWhere(`${functionalIndex} = :${uniqueParam}`, {
                        [uniqueParam]: value
                    });
                    break;

                case FhirSearchParameterType.DATE:
                    const { prefix, value: dateValue } = this.parseSearchValue(value);
                    const operator = this.getOperator(prefix);
                    queryBuilder.andWhere(`${functionalIndex}::date ${operator} :${uniqueParam}`, {
                        [uniqueParam]: dateValue
                    });
                    break;

                case FhirSearchParameterType.REFERENCE:
                    queryBuilder.andWhere(`${functionalIndex} LIKE :${uniqueParam}`, {
                        [uniqueParam]: `%${value}%`
                    });
                    break;

                default:
                    return false;
            }

            return true;
        } catch (error) {
            this.logger.error('Error applying optimized query', {
                functionalIndex,
                paramType,
                value,
                error: error.message
            });

            // Check if this is a transaction abortion error
            if (error.message?.includes('current transaction is aborted')) {
                throw error; // Re-throw transaction errors immediately
            }

            return false; // Return false for other errors to allow fallback
        }
    }

    /**
     * Apply a JSONPath-based query (fallback when no functional index exists).
     */
    private applyJSONPathQuery(
        queryBuilder: any,
        fieldPaths: string[],
        value: string,
        paramType: FhirSearchParameterType,
        uniqueParam: string
    ): boolean {
        try {
            // Build OR conditions for multiple field paths
            const conditions: string[] = [];
            const parameters: Record<string, any> = {};

            fieldPaths.forEach((fieldPath, index) => {
                const jsonbPath = this.convertToJSONB(fieldPath);
                const paramKey = `${uniqueParam}_${index}`;

                switch (paramType) {
                    case FhirSearchParameterType.STRING:
                        conditions.push(`${jsonbPath} ILIKE :${paramKey}`);
                        parameters[paramKey] = `%${value}%`;
                        break;

                    case FhirSearchParameterType.TOKEN:
                        conditions.push(`${jsonbPath} = :${paramKey}`);
                        parameters[paramKey] = value;
                        break;

                    case FhirSearchParameterType.DATE:
                        const { prefix, value: dateValue } = this.parseSearchValue(value);
                        const operator = this.getOperator(prefix);
                        conditions.push(`${jsonbPath}::date ${operator} :${paramKey}`);
                        parameters[paramKey] = dateValue;
                        break;

                    case FhirSearchParameterType.REFERENCE:
                        conditions.push(`${jsonbPath} LIKE :${paramKey}`);
                        parameters[paramKey] = `%${value}%`;
                        break;
                }
            });

            if (conditions.length > 0) {
                queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);
                return true;
            }

            return false;
        } catch (error) {
            this.logger.error('Error applying JSONPath query', {
                fieldPaths,
                paramType,
                value,
                error: error.message
            });

            // Check if this is a transaction abortion error
            if (error.message?.includes('current transaction is aborted')) {
                throw error; // Re-throw transaction errors immediately
            }

            return false; // Return false for other errors to allow graceful degradation
        }
    }

    /**
     * Convert JSONPath-style field paths to PostgreSQL JSONB syntax.
     */
    private convertToJSONB(fieldPath: string): string {
        // Handle array access patterns like "name[*].family"
        let path = fieldPath.replace(/\[\*\]/g, '->0');
        path = path.replace(/\[(\d+)\]/g, '->$1');

        const segments = path.split('.');
        let result = 'resource';

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            if (segment.includes('->')) {
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

        return result;
    }

    /**
     * Infer the parameter type based on name and value patterns.
     */
    private inferParameterType(paramName: string, value: string): FhirSearchParameterType {
        // Token parameters (check parameter names first - these take priority)
        if (paramName === '_id' || paramName.includes('identifier') ||
            paramName.includes('status') || paramName.includes('code') ||
            paramName.includes('gender') || paramName.includes('active') ||
            ['true', 'false'].includes(value.toLowerCase())) {
            return FhirSearchParameterType.TOKEN;
        }

        // Reference parameters
        if (paramName.includes('patient') || paramName.includes('subject') ||
            paramName.includes('encounter') || paramName.includes('practitioner') ||
            value.includes('/')) {
            return FhirSearchParameterType.REFERENCE;
        }

        // Date parameters
        if (paramName.includes('date') || paramName.includes('time') ||
            /^\d{4}-\d{2}-\d{2}/.test(value) || /^(gt|lt|ge|le|sa|eb|ap)/.test(value)) {
            return FhirSearchParameterType.DATE;
        }

        // Default to string for name, address, text searches
        return FhirSearchParameterType.STRING;
    }

    /**
     * Parse search value to extract prefix and clean value.
     */
    private parseSearchValue(value: string): { prefix: FhirSearchPrefix; value: string } {
        const prefixMatch = value.match(/^(eq|ne|gt|lt|ge|le|sa|eb|ap)(.+)$/);

        if (prefixMatch) {
            return {
                prefix: prefixMatch[1] as FhirSearchPrefix,
                value: prefixMatch[2]
            };
        }

        return { prefix: FhirSearchPrefix.EQ, value };
    }

    /**
     * Get SQL operator for search prefix.
     */
    private getOperator(prefix: FhirSearchPrefix): string {
        const operators = {
            [FhirSearchPrefix.EQ]: '=',
            [FhirSearchPrefix.NE]: '!=',
            [FhirSearchPrefix.GT]: '>',
            [FhirSearchPrefix.LT]: '<',
            [FhirSearchPrefix.GE]: '>=',
            [FhirSearchPrefix.LE]: '<=',
            [FhirSearchPrefix.SA]: '>',
            [FhirSearchPrefix.EB]: '<',
            [FhirSearchPrefix.AP]: '='
        };
        return operators[prefix] || '=';
    }

    /**
     * Get entity name for resource type.
     */
    private getEntityName(resourceType: string): string {
        return this.ENTITY_NAME_MAP[resourceType] || resourceType.toLowerCase();
    }
}
