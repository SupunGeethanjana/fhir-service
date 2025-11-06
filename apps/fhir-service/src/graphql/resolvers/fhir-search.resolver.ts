import { Logger } from '@nestjs/common';
import { Args, Field, Int, ObjectType, Query, registerEnumType, Resolver } from '@nestjs/graphql';
import { AllergyIntoleranceService } from '../../models/allergy-intolerance/allergy-intolerance.service';
import { AppointmentService } from '../../models/appointment/appointment.service';
import { CompositionService } from '../../models/composition/composition.service';
import { ConditionService } from '../../models/condition/condition.service';
import { DeviceService } from '../../models/device/device.service';
import { DiagnosticReportService } from '../../models/diagnostic-report/diagnostic-report.service';
import { EncounterService } from '../../models/encounter/encounter.service';
import { FamilyMemberHistoryService } from '../../models/family-member-history/family-member-history.service';
import { LocationService } from '../../models/location/location.service';
import { MedicationRequestService } from '../../models/medication-request/medication-request.service';
import { MedicationStatementService } from '../../models/medication-statement/medication-statement.service';
import { MedicationService } from '../../models/medication/medication.service';
import { ObservationService } from '../../models/observation/observation.service';
import { OrganizationService } from '../../models/organization/organization.service';
import { PatientService } from '../../models/patient/patient.service';
import { PractitionerService } from '../../models/practitioner/practitioner.service';
import { ProcedureService } from '../../models/procedure/procedure.service';
import { ServiceRequestService } from '../../models/service-request/service-request.service';
import { SpecimenService } from '../../models/specimen/specimen.service';
import { AllergyIntoleranceType, AppointmentType, CompositionType, ConditionType, DeviceType, DiagnosticReportType, EncounterType, FamilyMemberHistoryType, LocationType, MedicationRequestType, MedicationStatementType, MedicationType, ObservationType, OrganizationType, PatientType, PractitionerType, ProcedureType, ServiceRequestType, SpecimenType } from '../types/fhir-resource.type';
import { DateRangeInput, DeviceSearchInput, FhirSearchInput, LocationSearchInput, MedicationSearchInput, ObservationSearchInput, OrganizationSearchInput, PractitionerSearchInput, SpecimenSearchInput } from '../types/fhir-search-inputs.type';

/**
 * Search prefix modifiers for date and number comparisons
 */
export enum SearchPrefix {
    EQ = 'eq',  // Equal (default)
    NE = 'ne',  // Not equal
    GT = 'gt',  // Greater than
    LT = 'lt',  // Less than
    GE = 'ge',  // Greater than or equal
    LE = 'le',  // Less than or equal
    SA = 'sa',  // Starts after
    EB = 'eb',  // Ends before
    AP = 'ap'   // Approximately
}

registerEnumType(SearchPrefix, {
    name: 'SearchPrefix',
    description: 'Search prefix modifiers for date and number comparisons'
});

/**
 * Sort order enumeration
 */
export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

registerEnumType(SortOrder, {
    name: 'SortOrder',
    description: 'Sort order for search results'
});


/**
 * Enhanced search results with pagination and metadata
 */
@ObjectType()
export class PatientSearchResult {
    @Field(() => [PatientType])
    patients: PatientType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;

    @Field({ nullable: true })
    searchId?: string;  // For search continuation
}

@ObjectType()
export class PractitionerSearchResult {
    @Field(() => [PractitionerType])
    practitioners: PractitionerType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class ObservationSearchResult {
    @Field(() => [ObservationType])
    observations: ObservationType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class DeviceSearchResult {
    @Field(() => [DeviceType])
    devices: DeviceType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class LocationSearchResult {
    @Field(() => [LocationType])
    locations: LocationType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class MedicationSearchResult {
    @Field(() => [MedicationType])
    medications: MedicationType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class OrganizationSearchResult {
    @Field(() => [OrganizationType])
    organizations: OrganizationType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

@ObjectType()
export class SpecimenSearchResult {
    @Field(() => [SpecimenType])
    specimens: SpecimenType[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Boolean)
    hasMore: boolean;
}

/**
 * Comprehensive patient data with related resources
 */
@ObjectType()
export class PatientWithClinicalData {
    @Field(() => PatientType)
    patient: PatientType;

    // Clinical encounters and conditions
    @Field(() => [EncounterType], { nullable: true })
    encounters?: EncounterType[];

    @Field(() => [ConditionType], { nullable: true })
    conditions?: ConditionType[];

    @Field(() => [ObservationType], { nullable: true })
    observations?: ObservationType[];

    @Field(() => [PractitionerType], { nullable: true })
    practitioners?: PractitionerType[];

    // Allergies and intolerances
    @Field(() => [AllergyIntoleranceType], { nullable: true })
    allergies?: AllergyIntoleranceType[];

    // Procedures and diagnostic reports
    @Field(() => [ProcedureType], { nullable: true })
    procedures?: ProcedureType[];

    @Field(() => [DiagnosticReportType], { nullable: true })
    diagnosticReports?: DiagnosticReportType[];

    @Field(() => [ServiceRequestType], { nullable: true })
    serviceRequests?: ServiceRequestType[];

    // Medications
    @Field(() => [MedicationRequestType], { nullable: true })
    medicationRequests?: MedicationRequestType[];

    @Field(() => [MedicationStatementType], { nullable: true })
    medicationStatements?: MedicationStatementType[];

    // Family history and appointments
    @Field(() => [FamilyMemberHistoryType], { nullable: true })
    familyHistory?: FamilyMemberHistoryType[];

    @Field(() => [AppointmentType], { nullable: true })
    appointments?: AppointmentType[];

    // Documents and compositions
    @Field(() => [CompositionType], { nullable: true })
    compositions?: CompositionType[];

    // Totals for pagination info
    @Field({ nullable: true })
    totalEncounters?: number;

    @Field({ nullable: true })
    totalConditions?: number;

    @Field({ nullable: true })
    totalObservations?: number;

    @Field({ nullable: true })
    totalAllergies?: number;

    @Field({ nullable: true })
    totalProcedures?: number;

    @Field({ nullable: true })
    totalDiagnosticReports?: number;

    @Field({ nullable: true })
    totalServiceRequests?: number;

    @Field({ nullable: true })
    totalMedicationRequests?: number;

    @Field({ nullable: true })
    totalMedicationStatements?: number;

    @Field({ nullable: true })
    totalFamilyHistory?: number;

    @Field({ nullable: true })
    totalAppointments?: number;

    @Field({ nullable: true })
    totalCompositions?: number;
}

/**
 * Enhanced GraphQL resolver for FHIR search operations
 * 
 * Provides efficient search capabilities with the ability to fetch
 * related resources in a single query, reducing network overhead
 * and improving client performance.
 */
@Resolver()
export class FhirSearchResolver {
    private readonly logger = new Logger(FhirSearchResolver.name);

    constructor(
        private readonly patientService: PatientService,
        private readonly practitionerService: PractitionerService,
        private readonly observationService: ObservationService,
        private readonly conditionService: ConditionService,
        private readonly encounterService: EncounterService,
        private readonly allergyIntoleranceService: AllergyIntoleranceService,
        private readonly procedureService: ProcedureService,
        private readonly diagnosticReportService: DiagnosticReportService,
        private readonly serviceRequestService: ServiceRequestService,
        private readonly medicationRequestService: MedicationRequestService,
        private readonly medicationStatementService: MedicationStatementService,
        private readonly familyMemberHistoryService: FamilyMemberHistoryService,
        private readonly appointmentService: AppointmentService,
        private readonly compositionService: CompositionService,
        private readonly deviceService: DeviceService,
        private readonly locationService: LocationService,
        private readonly medicationService: MedicationService,
        private readonly organizationService: OrganizationService,
        private readonly specimenService: SpecimenService,
    ) { }

    /**
     * Enhanced search for patients with comprehensive parameters
     * 
     * @example
     * query EnhancedPatientSearch($search: FhirSearchInput!) {
     *   searchPatientsEnhanced(search: $search) {
     *     patients {
     *       id
     *       resource
     *       lastUpdated
     *     }
     *     total
     *     hasMore
     *     searchId
     *   }
     * }
     * 
     * @example
     * query PatientSearchWithDateRange {
     *   searchPatientsEnhanced(search: { 
     *     family: "Smith", 
     *     birthdateRange: {
     *       start: "1980-01-01",
     *       end: "1990-12-31"
     *     }
     *   }) {
     *     patients {
     *       id
     *       resource
     *     }
     *     total
     *   }
     * }
     */
    @Query(() => PatientSearchResult)
    async searchPatientsEnhanced(
        @Args('search', { type: () => FhirSearchInput }) search: FhirSearchInput
    ): Promise<PatientSearchResult> {
        this.logger.log(`Enhanced Patient search: ${JSON.stringify(search)}`);

        try {
            const queryParams = this.buildPatientQueryParams(search);
            const searchResult = await this.patientService.search(queryParams);

            return {
                patients: searchResult.entry?.map(entry => ({
                    id: entry.resource.id,
                    resourceType: entry.resource.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource.meta?.versionId ? parseInt(entry.resource.meta.versionId) : undefined,
                    lastUpdated: entry.resource.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : undefined,
                    txid: (entry.resource as any).txid,
                    deletedAt: (entry.resource as any).deletedAt
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50),
                searchId: `search_${Date.now()}`
            };

        } catch (error) {
            this.logger.error(`Enhanced Patient search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Enhanced practitioner search with comprehensive filtering
     * 
     * @example
     * query SearchPractitioners($search: PractitionerSearchInput!) {
     *   searchPractitionersEnhanced(search: $search) {
     *     practitioners {
     *       id
     *       resource
     *     }
     *     total
     *     hasMore
     *   }
     * }
     */
    @Query(() => PractitionerSearchResult)
    async searchPractitionersEnhanced(
        @Args('search', { type: () => PractitionerSearchInput }) search: PractitionerSearchInput
    ): Promise<PractitionerSearchResult> {
        this.logger.log(`Enhanced Practitioner search: ${JSON.stringify(search)}`);

        try {
            const queryParams = this.buildPractitionerQueryParams(search);
            const searchResult = await this.practitionerService.search(queryParams);

            return {
                practitioners: searchResult.entry?.map(entry => ({
                    id: entry.resource.id,
                    resourceType: entry.resource.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource.meta?.versionId ? parseInt(entry.resource.meta.versionId) : undefined,
                    lastUpdated: entry.resource.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : undefined,
                    txid: (entry.resource as any).txid,
                    deletedAt: (entry.resource as any).deletedAt
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };

        } catch (error) {
            this.logger.error(`Enhanced Practitioner search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Enhanced observation search with clinical parameters
     * 
     * @example
     * query SearchObservations($search: ObservationSearchInput!) {
     *   searchObservationsEnhanced(search: $search) {
     *     observations {
     *       id
     *       resource
     *     }
     *     total
     *     hasMore
     *   }
     * }
     */
    @Query(() => ObservationSearchResult)
    async searchObservationsEnhanced(
        @Args('search', { type: () => ObservationSearchInput }) search: ObservationSearchInput
    ): Promise<ObservationSearchResult> {
        this.logger.log(`Enhanced Observation search: ${JSON.stringify(search)}`);

        try {
            const queryParams = this.buildObservationQueryParams(search);
            const searchResult = await this.observationService.search(queryParams);

            return {
                observations: searchResult.entry?.map(entry => ({
                    id: entry.resource.id,
                    resourceType: entry.resource.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource.meta?.versionId ? parseInt(entry.resource.meta.versionId) : undefined,
                    lastUpdated: entry.resource.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : undefined,
                    txid: (entry.resource as any).txid,
                    deletedAt: (entry.resource as any).deletedAt
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };

        } catch (error) {
            this.logger.error(`Enhanced Observation search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Advanced comprehensive search across multiple resource types
     * 
     * @example
     * query ComprehensiveSearch($family: String!) {
     *   comprehensiveSearchEnhanced(family: $family, includeTimeline: true) {
     *     patient {
     *       id
     *       resource
     *     }
     *     encounters {
     *       id
     *       resource
     *     }
     *     conditions {
     *       id
     *       resource
     *     }
     *     observations {
     *       id
     *       resource
     *     }
     *     allergies {
     *       id
     *       resource
     *     }
     *     procedures {
     *       id
     *       resource
     *     }
     *     diagnosticReports {
     *       id
     *       resource
     *     }
     *     serviceRequests {
     *       id
     *       resource
     *     }
     *     medicationRequests {
     *       id
     *       resource
     *     }
     *     medicationStatements {
     *       id
     *       resource
     *     }
     *     familyHistory {
     *       id
     *       resource
     *     }
     *     appointments {
     *       id
     *       resource
     *     }
     *     compositions {
     *       id
     *       resource
     *     }
     *     totalEncounters
     *     totalConditions
     *     totalObservations
     *     totalAllergies
     *     totalProcedures
     *     totalDiagnosticReports
     *     totalServiceRequests
     *     totalMedicationRequests
     *     totalMedicationStatements
     *     totalFamilyHistory
     *     totalAppointments
     *     totalCompositions
     *   }
     * }
     */
    @Query(() => [PatientWithClinicalData])
    async comprehensiveSearchEnhanced(
        @Args('family', { type: () => String }) family: string,
        @Args('includeTimeline', { nullable: true, type: () => Boolean, defaultValue: false }) includeTimeline?: boolean,
        @Args('dateRange', { nullable: true, type: () => DateRangeInput }) dateRange?: DateRangeInput,
        @Args('limit', { nullable: true, type: () => Int, defaultValue: 10 }) limit?: number
    ): Promise<PatientWithClinicalData[]> {
        this.logger.log(`Enhanced comprehensive search: family=${family}, includeTimeline=${includeTimeline}`);

        try {
            // Search for patients
            const patientQueryParams: Record<string, string> = {
                family,
                _count: limit?.toString() || '10'
            };

            const patientResult = await this.patientService.search(patientQueryParams);
            const results: PatientWithClinicalData[] = [];

            if (!patientResult.entry?.length) {
                return results;
            }

            // For each patient, fetch related resources
            for (const patientEntry of patientResult.entry) {
                const patientId = patientEntry.resource.id;

                const patient = {
                    id: patientEntry.resource.id,
                    resourceType: patientEntry.resource.resourceType,
                    resource: patientEntry.resource,
                    versionId: patientEntry.resource.meta?.versionId ? parseInt(patientEntry.resource.meta.versionId) : undefined,
                    lastUpdated: patientEntry.resource.meta?.lastUpdated ? new Date(patientEntry.resource.meta.lastUpdated) : undefined,
                    txid: (patientEntry.resource as any).txid,
                    deletedAt: (patientEntry.resource as any).deletedAt
                };

                // Build search parameters for related resources
                const relatedQueryParams: Record<string, string> = {
                    patient: patientId,
                    _count: '50'
                };

                // Add date range if specified
                if (dateRange?.start || dateRange?.end) {
                    const dateParam = this.buildDateRangeParam(dateRange);
                    if (dateParam) {
                        relatedQueryParams.date = dateParam;
                    }
                }

                // Fetch related resources in parallel
                const [
                    encounterResult,
                    conditionResult,
                    observationResult,
                    allergyResult,
                    procedureResult,
                    diagnosticReportResult,
                    serviceRequestResult,
                    medicationRequestResult,
                    medicationStatementResult,
                    familyHistoryResult,
                    appointmentResult,
                    compositionResult
                ] = await Promise.all([
                    this.encounterService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.conditionService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.observationService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.allergyIntoleranceService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.procedureService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.diagnosticReportService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.serviceRequestService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.medicationRequestService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.medicationStatementService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.familyMemberHistoryService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.appointmentService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 })),
                    this.compositionService.search(relatedQueryParams).catch(() => ({ entry: [], total: 0 }))
                ]);

                // Helper function to map entries to standard format
                const mapEntries = (entries: any[]) => entries?.map(entry => ({
                    id: entry.resource.id,
                    resourceType: entry.resource.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource.meta?.versionId ? parseInt(entry.resource.meta.versionId) : undefined,
                    lastUpdated: entry.resource.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : undefined,
                    txid: (entry.resource as any).txid,
                    deletedAt: (entry.resource as any).deletedAt
                })) || [];

                // Map all resource types
                const encounters = mapEntries(encounterResult.entry);
                const conditions = mapEntries(conditionResult.entry);
                const observations = mapEntries(observationResult.entry);
                const allergies = mapEntries(allergyResult.entry);
                const procedures = mapEntries(procedureResult.entry);
                const diagnosticReports = mapEntries(diagnosticReportResult.entry);
                const serviceRequests = mapEntries(serviceRequestResult.entry);
                const medicationRequests = mapEntries(medicationRequestResult.entry);
                const medicationStatements = mapEntries(medicationStatementResult.entry);
                const familyHistory = mapEntries(familyHistoryResult.entry);
                const appointments = mapEntries(appointmentResult.entry);
                const compositions = mapEntries(compositionResult.entry);

                results.push({
                    patient,
                    encounters,
                    conditions,
                    observations,
                    allergies,
                    procedures,
                    diagnosticReports,
                    serviceRequests,
                    medicationRequests,
                    medicationStatements,
                    familyHistory,
                    appointments,
                    compositions,
                    totalEncounters: encounterResult.total || 0,
                    totalConditions: conditionResult.total || 0,
                    totalObservations: observationResult.total || 0,
                    totalAllergies: allergyResult.total || 0,
                    totalProcedures: procedureResult.total || 0,
                    totalDiagnosticReports: diagnosticReportResult.total || 0,
                    totalServiceRequests: serviceRequestResult.total || 0,
                    totalMedicationRequests: medicationRequestResult.total || 0,
                    totalMedicationStatements: medicationStatementResult.total || 0,
                    totalFamilyHistory: familyHistoryResult.total || 0,
                    totalAppointments: appointmentResult.total || 0,
                    totalCompositions: compositionResult.total || 0
                });
            }

            return results;

        } catch (error) {
            this.logger.error(`Enhanced comprehensive search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Legacy search methods for backward compatibility
     */

    /**
     * Simple patient search (legacy method)
     */
    @Query(() => PatientSearchResult)
    async searchPatients(
        @Args('search', { type: () => FhirSearchInput }) search: FhirSearchInput
    ): Promise<PatientSearchResult> {
        // Delegate to enhanced search
        return this.searchPatientsEnhanced(search);
    }

    /**
     * Simple practitioner search (legacy method)
     * 
     * @example
     * query SearchPractitioners {
     *   searchPractitioners(name: "John Smith") {
     *     id
     *     resourceType
     *     resource
     *   }
     * }
     * 
     * @example
     * query SearchPractitionersByIdentifier {
     *   searchPractitioners(identifier: "PRN123456") {
     *     id
     *     resourceType
     *     resource
     *   }
     * }
     */
    @Query(() => [PractitionerType])
    async searchPractitioners(
        @Args('name', { nullable: true, type: () => String }) name?: string,
        @Args('identifier', { nullable: true, type: () => String }) identifier?: string,
        @Args('limit', { nullable: true, type: () => Int, defaultValue: 50 }) limit?: number
    ): Promise<PractitionerType[]> {
        const search: PractitionerSearchInput = {
            name,
            identifier,
            limit
        };

        const result = await this.searchPractitionersEnhanced(search);
        return result.practitioners;
    }

    /**
     * Helper methods for building query parameters
     */

    private buildPatientQueryParams(search: FhirSearchInput): Record<string, string> {
        const queryParams: Record<string, string> = {};

        // Basic demographics
        if (search.family) queryParams.family = search.family;
        if (search.given) queryParams.given = search.given;
        if (search.name) queryParams.name = search.name;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.gender) queryParams.gender = search.gender;
        if (search.deceased !== undefined) queryParams.deceased = search.deceased.toString();

        // Date handling
        if (search.birthdate) {
            queryParams.birthdate = search.birthdate;
        } else if (search.birthdateRange) {
            const dateParam = this.buildDateRangeParam(search.birthdateRange);
            if (dateParam) queryParams.birthdate = dateParam;
        }

        // Contact info
        if (search.phone) queryParams.phone = search.phone;
        if (search.email) queryParams.email = search.email;
        if (search.address) queryParams.address = search.address;
        if (search.addressCity) queryParams['address-city'] = search.addressCity;
        if (search.addressState) queryParams['address-state'] = search.addressState;
        if (search.addressPostalCode) queryParams['address-postalcode'] = search.addressPostalCode;
        if (search.addressCountry) queryParams['address-country'] = search.addressCountry;

        // Clinical
        if (search.generalPractitioner) queryParams['general-practitioner'] = search.generalPractitioner;
        if (search.organization) queryParams.organization = search.organization;
        if (search.language) queryParams.language = search.language;

        // Text search
        if (search.text) queryParams._text = search.text;

        // Modifiers
        if (search.exact) queryParams._exact = 'true';
        if (search.contains) queryParams._contains = 'true';

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildPractitionerQueryParams(search: PractitionerSearchInput): Record<string, string> {
        const queryParams: Record<string, string> = {};

        if (search.name) queryParams.name = search.name;
        if (search.family) queryParams.family = search.family;
        if (search.given) queryParams.given = search.given;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.specialty) queryParams.specialty = search.specialty;
        if (search.qualification) queryParams.qualification = search.qualification;
        if (search.active !== undefined) queryParams.active = search.active.toString();
        if (search.phone) queryParams.phone = search.phone;
        if (search.email) queryParams.email = search.email;
        if (search.address) queryParams.address = search.address;

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildObservationQueryParams(search: ObservationSearchInput): Record<string, string> {
        const queryParams: Record<string, string> = {};

        if (search.patient) queryParams.patient = search.patient;
        if (search.subject) queryParams.subject = search.subject;
        if (search.category) queryParams.category = search.category;
        if (search.code) queryParams.code = search.code;
        if (search.encounter) queryParams.encounter = search.encounter;
        if (search.performer) queryParams.performer = search.performer;
        if (search.status) queryParams.status = search.status;
        if (search.valueString) queryParams['value-string'] = search.valueString;
        if (search.valueQuantity) queryParams['value-quantity'] = search.valueQuantity;
        if (search.valueCode) queryParams['value-code'] = search.valueCode;

        // Date handling
        if (search.date) {
            const dateParam = this.buildDateRangeParam(search.date);
            if (dateParam) queryParams.date = dateParam;
        }

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildDateRangeParam(dateRange: DateRangeInput): string | null {
        const parts: string[] = [];

        if (dateRange.start) {
            const prefix = dateRange.startPrefix || SearchPrefix.GE;
            parts.push(`${prefix}${dateRange.start}`);
        }

        if (dateRange.end) {
            const prefix = dateRange.endPrefix || SearchPrefix.LE;
            parts.push(`${prefix}${dateRange.end}`);
        }

        return parts.length > 0 ? parts.join(',') : null;
    }

    /**
     * Search devices
     */

    async searchDevices(
        @Args('search', { type: () => DeviceSearchInput }) search: DeviceSearchInput
    ): Promise<DeviceSearchResult> {
        try {
            const queryParams = this.buildDeviceSearchParams(search);
            const searchResult = await this.deviceService.search(queryParams);

            return {
                devices: searchResult.entry?.map(entry => ({
                    id: entry.resource?.id,
                    resourceType: entry.resource?.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource?.meta?.versionId || null,
                    lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                    txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                    deletedAt: null
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };
        } catch (error) {
            this.logger.error(`Device search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Search locations
     */

    async searchLocations(
        @Args('search', { type: () => LocationSearchInput }) search: LocationSearchInput
    ): Promise<LocationSearchResult> {
        try {
            const queryParams = this.buildLocationSearchParams(search);
            const searchResult = await this.locationService.search(queryParams);

            return {
                locations: searchResult.entry?.map(entry => ({
                    id: entry.resource?.id,
                    resourceType: entry.resource?.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource?.meta?.versionId || null,
                    lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                    txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                    deletedAt: null
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };
        } catch (error) {
            this.logger.error(`Location search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Search medications (paginated)
     */
    async searchMedications(
        @Args('search', { type: () => MedicationSearchInput }) search: MedicationSearchInput
    ): Promise<MedicationSearchResult> {
        try {
            const queryParams = this.buildMedicationSearchParams(search);
            const searchResult = await this.medicationService.search(queryParams);

            return {
                medications: searchResult.entry?.map(entry => ({
                    id: entry.resource?.id,
                    resourceType: entry.resource?.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource?.meta?.versionId || null,
                    lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                    txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                    deletedAt: null
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };
        } catch (error) {
            this.logger.error(`Medication search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Search medications (non-paginated, returns all matches as array)
     */
    async searchMedicationsAll(
        @Args('search', { type: () => MedicationSearchInput }) search: MedicationSearchInput
    ): Promise<MedicationType[]> {
        try {
            // Override pagination to fetch all (or a large number)
            const queryParams = this.buildMedicationSearchParams({ ...search, limit: 1000, offset: 0 });
            const searchResult = await this.medicationService.search(queryParams);
            return searchResult.entry?.map(entry => ({
                id: entry.resource?.id,
                resourceType: entry.resource?.resourceType,
                resource: entry.resource,
                versionId: entry.resource?.meta?.versionId || null,
                lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                deletedAt: null
            })) || [];
        } catch (error) {
            this.logger.error(`Medication search (all) failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Search organizations
     */

    async searchOrganizations(
        @Args('search', { type: () => OrganizationSearchInput }) search: OrganizationSearchInput
    ): Promise<OrganizationSearchResult> {
        try {
            const queryParams = this.buildOrganizationSearchParams(search);
            const searchResult = await this.organizationService.search(queryParams);

            return {
                organizations: searchResult.entry?.map(entry => ({
                    id: entry.resource?.id,
                    resourceType: entry.resource?.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource?.meta?.versionId || null,
                    lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                    txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                    deletedAt: null
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };
        } catch (error) {
            this.logger.error(`Organization search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Search specimens
     */
    async searchSpecimens(
        @Args('search', { type: () => SpecimenSearchInput }) search: SpecimenSearchInput
    ): Promise<SpecimenSearchResult> {
        try {
            const queryParams = this.buildSpecimenSearchParams(search);
            const searchResult = await this.specimenService.search(queryParams);

            return {
                specimens: searchResult.entry?.map(entry => ({
                    id: entry.resource?.id,
                    resourceType: entry.resource?.resourceType,
                    resource: entry.resource,
                    versionId: entry.resource?.meta?.versionId || null,
                    lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
                    txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
                    deletedAt: null
                })) || [],
                total: searchResult.total || 0,
                limit: search.limit || 50,
                offset: search.offset || 0,
                hasMore: (searchResult.total || 0) > (search.offset || 0) + (search.limit || 50)
            };
        } catch (error) {
            this.logger.error(`Specimen search failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Helper methods for building search parameters for new resources
     */
    private buildDeviceSearchParams(search: DeviceSearchInput): any {
        const queryParams: any = {};

        if (search.patient) queryParams.patient = search.patient;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.type) queryParams.type = search.type;
        if (search.status) queryParams.status = search.status;
        if (search.manufacturer) queryParams.manufacturer = search.manufacturer;
        if (search.model) queryParams.model = search.model;

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildLocationSearchParams(search: LocationSearchInput): any {
        const queryParams: any = {};

        if (search.name) queryParams.name = search.name;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.type) queryParams.type = search.type;
        if (search.status) queryParams.status = search.status;
        if (search.address) queryParams.address = search.address;
        if (search.addressCity) queryParams['address-city'] = search.addressCity;
        if (search.addressState) queryParams['address-state'] = search.addressState;
        if (search.addressPostalCode) queryParams['address-postalcode'] = search.addressPostalCode;

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildMedicationSearchParams(search: MedicationSearchInput): any {
        const queryParams: any = {};

        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.code) queryParams.code = search.code;
        if (search.form) queryParams.form = search.form;
        if (search.ingredient) queryParams.ingredient = search.ingredient;
        if (search.manufacturer) queryParams.manufacturer = search.manufacturer;
        if (search.status) queryParams.status = search.status;

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildOrganizationSearchParams(search: OrganizationSearchInput): any {
        const queryParams: any = {};

        if (search.name) queryParams.name = search.name;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.type) queryParams.type = search.type;
        if (search.active !== undefined) queryParams.active = search.active.toString();
        if (search.address) queryParams.address = search.address;
        if (search.addressCity) queryParams['address-city'] = search.addressCity;
        if (search.addressState) queryParams['address-state'] = search.addressState;
        if (search.addressPostalCode) queryParams['address-postalcode'] = search.addressPostalCode;
        if (search.phone) queryParams.phone = search.phone;
        if (search.email) queryParams.email = search.email;

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }

    private buildSpecimenSearchParams(search: SpecimenSearchInput): any {
        const queryParams: any = {};

        if (search.patient) queryParams.patient = search.patient;
        if (search.subject) queryParams.subject = search.subject;
        if (search.identifier) queryParams.identifier = search.identifier;
        if (search.type) queryParams.type = search.type;
        if (search.status) queryParams.status = search.status;
        if (search.collector) queryParams.collector = search.collector;

        // Date handling
        if (search.collectionDate) {
            const dateParam = this.buildDateRangeParam(search.collectionDate);
            if (dateParam) queryParams['collection-date'] = dateParam;
        }

        // Pagination
        queryParams._count = search.limit?.toString() || '50';
        queryParams._offset = search.offset?.toString() || '0';

        // Sorting
        if (search.sortBy) {
            const sortOrder = search.sortOrder === SortOrder.DESC ? '-' : '';
            queryParams._sort = `${sortOrder}${search.sortBy}`;
        }

        return queryParams;
    }
}
