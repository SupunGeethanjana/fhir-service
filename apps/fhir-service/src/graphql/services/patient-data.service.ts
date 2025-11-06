import { Injectable, Logger } from '@nestjs/common';
import { AllergyIntoleranceService } from '../../models/allergy-intolerance/allergy-intolerance.service';
import { AppointmentService } from '../../models/appointment/appointment.service';
import { CarePlanService } from '../../models/care-plan/care-plan.service';
import { CareTeamService } from '../../models/care-team/care-team.service';
import { ClaimService } from '../../models/claim/claim.service';
import { CompositionService } from '../../models/composition/composition.service';
import { ConditionService } from '../../models/condition/condition.service';
import { CoverageService } from '../../models/coverage/coverage.service';
import { DeviceService } from '../../models/device/device.service';
import { DiagnosticReportService } from '../../models/diagnostic-report/diagnostic-report.service';
import { DocumentReferenceService } from '../../models/document-reference/document-reference.service';
import { EncounterService } from '../../models/encounter/encounter.service';
import { ExplanationOfBenefitService } from '../../models/explanation-of-benefit/explanation-of-benefit.service';
import { FamilyMemberHistoryService } from '../../models/family-member-history/family-member-history.service';
import { GoalService } from '../../models/goal/goal.service';
import { ImmunizationService } from '../../models/immunization/immunization.service';
import { LocationService } from '../../models/location/location.service';
import { MedicationAdministrationService } from '../../models/medication-administration/medication-administration.service';
import { MedicationRequestService } from '../../models/medication-request/medication-request.service';
import { MedicationStatementService } from '../../models/medication-statement/medication-statement.service';
import { MedicationService } from '../../models/medication/medication.service';
import { ObservationService } from '../../models/observation/observation.service';
import { OrganizationService } from '../../models/organization/organization.service';
import { PatientService } from '../../models/patient/patient.service';
import { PractitionerService } from '../../models/practitioner/practitioner.service';
import { ProcedureService } from '../../models/procedure/procedure.service';
import { ProvenanceService } from '../../models/provenance/provenance.service';
import { ScheduleService } from '../../models/schedule/schedule.service';
import { ServiceRequestService } from '../../models/service-request/service-request.service';
import { SlotService } from '../../models/slot/slot.service';
import { SpecimenService } from '../../models/specimen/specimen.service';
import { PatientDataType } from '../types/patient-data.type';

/**
 * Service for aggregating comprehensive patient data from all FHIR resources
 * GraphQL handles lazy loading automatically by only resolving requested fields
 */
@Injectable()
export class PatientDataService {
    private readonly logger = new Logger(PatientDataService.name);

    constructor(
        private readonly patientService: PatientService,
        private readonly practitionerService: PractitionerService,
        private readonly encounterService: EncounterService,
        private readonly allergyIntoleranceService: AllergyIntoleranceService,
        private readonly conditionService: ConditionService,
        private readonly procedureService: ProcedureService,
        private readonly medicationStatementService: MedicationStatementService,
        private readonly medicationRequestService: MedicationRequestService,
        private readonly observationService: ObservationService,
        private readonly familyMemberHistoryService: FamilyMemberHistoryService,
        private readonly diagnosticReportService: DiagnosticReportService,
        private readonly serviceRequestService: ServiceRequestService,
        private readonly appointmentService: AppointmentService,
        private readonly carePlanService: CarePlanService,
        private readonly compositionService: CompositionService,
        private readonly deviceService: DeviceService,
        private readonly immunizationService: ImmunizationService,
        private readonly locationService: LocationService,
        private readonly medicationService: MedicationService,
        private readonly organizationService: OrganizationService,
        private readonly slotService: SlotService,
        private readonly specimenService: SpecimenService,
        private readonly careTeamService: CareTeamService,
        private readonly claimService: ClaimService,
        private readonly coverageService: CoverageService,
        private readonly documentReferenceService: DocumentReferenceService,
        private readonly explanationOfBenefitService: ExplanationOfBenefitService,
        private readonly goalService: GoalService,
        private readonly medicationAdministrationService: MedicationAdministrationService,
        private readonly provenanceService: ProvenanceService,
        private readonly scheduleService: ScheduleService
    ) { }

    /**
     * Retrieves comprehensive patient data by MRN (Medical Record Number)
     * GraphQL handles lazy loading automatically by only resolving requested fields
     */
    async getPatientDataByMrn(mrn: string, system?: string): Promise<PatientDataType> {
        const startTime = Date.now();

        // Validate input
        if (!mrn || mrn.trim() === '') {
            throw new Error('MRN is required and cannot be empty');
        }

        this.logger.log(`Retrieving comprehensive patient data for MRN: ${mrn}`, { mrn, system });

        try {
            // First, find the patient by MRN
            const patient = await this.findPatientByMrn(mrn.trim(), system?.trim());
            if (!patient) {
                this.logger.warn(`Patient with MRN ${mrn} not found${system ? ` in system ${system}` : ''}`, { mrn, system });
                // Return empty result instead of throwing error
                return {
                    patient: null,
                    practitioners: [],
                    encounters: [],
                    allergies: [],
                    conditions: [],
                    procedures: [],
                    medications: [],
                    medicationRequests: [],
                    observations: [],
                    familyHistory: [],
                    diagnosticReports: [],
                    serviceRequests: [],
                    appointments: [],
                    compositions: [],
                    devices: [],
                    immunizations: [],
                    locations: [],
                    medicationResources: [],
                    organizations: [],
                    slots: [],
                    specimens: [],
                    carePlans: [],
                    schedules: []
                };
            }

            const patientId = patient.id;
            this.logger.log(`Found patient with ID: ${patientId}`, { patientId, mrn });
            this.logger.log(`Starting to fetch related resources for patient: ${patientId}`);

            // Fetch all related resources in parallel for better performance
            const [
                practitionersBundle,
                encountersBundle,
                allergiesBundle,
                conditionsBundle,
                proceduresBundle,
                medicationsBundle,
                medicationRequestsBundle,
                observationsBundle,
                familyHistoryBundle,
                diagnosticReportsBundle,
                serviceRequestsBundle,
                appointmentsBundle,
                compositionsBundle,
                devicesBundle,
                immunizationsBundle,
                locationsBundle,
                medicationResourcesBundle,
                organizationsBundle,
                slotsBundle,
                specimensBundle,
                carePlansBundle,
                careTeamsBundle,
                claimsBundle,
                coveragesBundle,
                documentReferencesBundle,
                explanationOfBenefitsBundle,
                goalsBundle,
                medicationAdministrationsBundle,
                provenancesBundle,
                schedulesBundle
            ] = await Promise.allSettled([
                this.getPractitionersByPatient(patientId),
                this.getEncountersByPatient(patientId),
                this.getAllergiesByPatient(patientId),
                this.getConditionsByPatient(patientId),
                this.getProceduresByPatient(patientId),
                this.getMedicationsByPatient(patientId),
                this.getMedicationRequestsByPatient(patientId),
                this.getObservationsByPatient(patientId),
                this.getFamilyHistoryByPatient(patientId),
                this.getDiagnosticReportsByPatient(patientId),
                this.getServiceRequestsByPatient(patientId),
                this.getAppointmentsByPatient(patientId),
                this.getCompositionsByPatient(patientId),
                this.getDevicesByPatient(patientId),
                this.getImmunizationsByPatient(patientId),
                this.getLocationsByPatient(patientId),
                this.getMedicationResourcesByPatient(patientId),
                this.getOrganizationsByPatient(patientId),
                this.getSlotsByPatient(patientId),
                this.getSpecimensByPatient(patientId),
                this.getCarePlansByPatient(patientId),
                this.getCareTeamsByPatient(patientId),
                this.getClaimsByPatient(patientId),
                this.getCoveragesByPatient(patientId),
                this.getDocumentReferencesByPatient(patientId),
                this.getExplanationOfBenefitsByPatient(patientId),
                this.getGoalsByPatient(patientId),
                this.getMedicationAdministrationsByPatient(patientId),
                this.getProvenancesByPatient(patientId),
                this.getSchedulesByPatient(patientId)
            ]);

            // Extract resources from successful queries
            const resourceCounts: { [key: string]: number } = {};

            const practitioners = this.extractResourcesFromSettledResult(practitionersBundle, 'practitioners');
            const encounters = this.extractResourcesFromSettledResult(encountersBundle, 'encounters');
            const allergies = this.extractResourcesFromSettledResult(allergiesBundle, 'allergies');
            const conditions = this.extractResourcesFromSettledResult(conditionsBundle, 'conditions');
            const procedures = this.extractResourcesFromSettledResult(proceduresBundle, 'procedures');
            const medications = this.extractResourcesFromSettledResult(medicationsBundle, 'medications');
            const medicationRequests = this.extractResourcesFromSettledResult(medicationRequestsBundle, 'medicationRequests');
            const observations = this.extractResourcesFromSettledResult(observationsBundle, 'observations');
            const familyHistory = this.extractResourcesFromSettledResult(familyHistoryBundle, 'familyHistory');
            const diagnosticReports = this.extractResourcesFromSettledResult(diagnosticReportsBundle, 'diagnosticReports');
            const serviceRequests = this.extractResourcesFromSettledResult(serviceRequestsBundle, 'serviceRequests');
            const appointments = this.extractResourcesFromSettledResult(appointmentsBundle, 'appointments');
            const compositions = this.extractResourcesFromSettledResult(compositionsBundle, 'compositions');
            const devices = this.extractResourcesFromSettledResult(devicesBundle, 'devices');
            const immunizations = this.extractResourcesFromSettledResult(immunizationsBundle, 'immunizations');
            const locations = this.extractResourcesFromSettledResult(locationsBundle, 'locations');
            const medicationResources = this.extractResourcesFromSettledResult(medicationResourcesBundle, 'medicationResources');
            const organizations = this.extractResourcesFromSettledResult(organizationsBundle, 'organizations');
            const slots = this.extractResourcesFromSettledResult(slotsBundle, 'slots');
            const specimens = this.extractResourcesFromSettledResult(specimensBundle, 'specimens');
            const carePlans = this.extractResourcesFromSettledResult(carePlansBundle, 'carePlans');
            const careTeams = this.extractResourcesFromSettledResult(careTeamsBundle, 'careTeams');
            const claims = this.extractResourcesFromSettledResult(claimsBundle, 'claims');
            const coverages = this.extractResourcesFromSettledResult(coveragesBundle, 'coverages');
            const schedules = this.extractResourcesFromSettledResult(schedulesBundle, 'schedules');
            const documentReferences = this.extractResourcesFromSettledResult(documentReferencesBundle, 'documentReferences');
            const explanationOfBenefits = this.extractResourcesFromSettledResult(explanationOfBenefitsBundle, 'explanationOfBenefits');
            const goals = this.extractResourcesFromSettledResult(goalsBundle, 'goals');
            const medicationAdministrations = this.extractResourcesFromSettledResult(medicationAdministrationsBundle, 'medicationAdministrations');
            const provenances = this.extractResourcesFromSettledResult(provenancesBundle, 'provenances');
            // Track counts for logging
            resourceCounts.practitioners = practitioners.length;
            resourceCounts.encounters = encounters.length;
            resourceCounts.allergies = allergies.length;
            resourceCounts.conditions = conditions.length;
            resourceCounts.procedures = procedures.length;
            resourceCounts.medications = medications.length;
            resourceCounts.medicationRequests = medicationRequests.length;
            resourceCounts.observations = observations.length;
            resourceCounts.familyHistory = familyHistory.length;
            resourceCounts.diagnosticReports = diagnosticReports.length;
            resourceCounts.serviceRequests = serviceRequests.length;
            resourceCounts.appointments = appointments.length;
            resourceCounts.compositions = compositions.length;
            resourceCounts.devices = devices.length;
            resourceCounts.immunizations = immunizations.length;
            resourceCounts.locations = locations.length;
            resourceCounts.medicationResources = medicationResources.length;
            resourceCounts.organizations = organizations.length;
            resourceCounts.slots = slots.length;
            resourceCounts.specimens = specimens.length;
            resourceCounts.carePlans = carePlans.length;


            // Build the response with all resources
            const response: PatientDataType = {
                patient,
                practitioners,
                encounters,
                allergies,
                conditions,
                procedures,
                medications,
                medicationRequests,
                observations,
                familyHistory,
                diagnosticReports,
                serviceRequests,
                appointments,
                compositions,
                devices,
                immunizations,
                locations,
                medicationResources,
                organizations,
                slots,
                specimens,
                carePlans,
                careTeams,
                claims,
                coverages,
                documentReferences,
                explanationOfBenefits,
                goals,
                medicationAdministrations,
                provenances,
                schedules
            };

            const duration = Date.now() - startTime;
            this.logger.log(`Retrieved comprehensive patient data successfully`, {
                patientId,
                mrn,
                duration,
                totalResourceTypes: Object.keys(resourceCounts).length,
                resourceCounts
            });

            return response;

        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`Failed to retrieve patient data for MRN: ${mrn}`, {
                mrn,
                system,
                duration,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    // --- New resource fetchers for additional FHIR resources ---

    private async getCareTeamsByPatient(patientId: string) {
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching care teams for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying care team search with params:`, searchParams);
                const result = await this.careTeamService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Care teams search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} care teams using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Care team search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No care teams found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getCoveragesByPatient(patientId: string) {
        const searchPatterns = [
            { 'beneficiary': `Patient/${patientId}` },
            { 'beneficiary': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching coverages for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying coverage search with params:`, searchParams);
                const result = await this.coverageService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Coverages search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} coverages using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Coverage search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No coverages found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getDocumentReferencesByPatient(patientId: string) {
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching document references for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying document reference search with params:`, searchParams);
                const result = await this.documentReferenceService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Document references search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} document references using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Document reference search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No document references found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getExplanationOfBenefitsByPatient(patientId: string) {
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching explanation of benefits for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying explanation of benefit search with params:`, searchParams);
                const result = await this.explanationOfBenefitService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Explanation of benefits search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} explanation of benefits using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Explanation of benefit search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No explanation of benefits found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getGoalsByPatient(patientId: string) {
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching goals for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying goal search with params:`, searchParams);
                const result = await this.goalService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Goals search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} goals using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Goal search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No goals found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getMedicationAdministrationsByPatient(patientId: string) {
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching medication administrations for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying medication administration search with params:`, searchParams);
                const result = await this.medicationAdministrationService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Medication administrations search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} medication administrations using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Medication administration search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No medication administrations found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getProvenancesByPatient(patientId: string) {
        const searchPatterns = [
            { 'target': `Patient/${patientId}` },
            { 'target': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching provenances for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying provenance search with params:`, searchParams);
                const result = await this.provenanceService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Provenances search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} provenances using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Provenance search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No provenances found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    /**
     * Finds patient by MRN using FHIR identifier search
     */
    private async findPatientByMrn(mrn: string, system?: string): Promise<any> {
        try {
            // Build the search criteria using proper FHIR identifier format
            const searchParams: any = {};

            if (system) {
                // Use FHIR token format: system|value
                searchParams['identifier'] = `${system}|${mrn}`;
            } else {
                // Search for any identifier with the given value
                searchParams['identifier'] = mrn;
            }

            this.logger.debug(`Searching for patient with search params:`, { searchParams, mrn, system });

            const patientsBundle = await this.patientService.search(searchParams);
            const patients = this.extractResourcesFromBundle(patientsBundle);

            if (patients.length === 0) {
                this.logger.debug(`No patient found for MRN: ${mrn}`, { mrn, system });
                return null;
            }

            if (patients.length > 1) {
                this.logger.warn(`Multiple patients found for MRN: ${mrn}`, {
                    mrn,
                    system,
                    count: patients.length
                });
            }

            this.logger.debug(`Found patient for MRN: ${mrn}`, {
                mrn,
                system,
                patientId: patients[0].id
            });

            return patients[0];
        } catch (error) {
            this.logger.error(`Error finding patient by MRN: ${mrn}`, {
                mrn,
                system,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Extracts resources from a FHIR Bundle response
     */
    private extractResourcesFromBundle(bundle: any): any[] {
        if (!bundle || !bundle.entry || !Array.isArray(bundle.entry)) {
            return [];
        }

        return bundle.entry.map((entry: any) => ({
            id: entry.resource?.id,
            resourceType: entry.resource?.resourceType,
            resource: entry.resource,
            versionId: entry.resource?.meta?.versionId || null,
            lastUpdated: entry.resource?.meta?.lastUpdated ? new Date(entry.resource.meta.lastUpdated) : null,
            txid: entry.resource?.meta?.tag?.find((tag: any) => tag.system === 'http://fhir.local/txid')?.code || null,
            deletedAt: null
        }));
    }

    /**
     * Helper methods to fetch related resources by patient reference
     */
    private async getEncountersByPatient(patientId: string) {
        // Use simple reference search patterns that work with FHIR search
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching encounters for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying encounter search with params:`, searchParams);
                const result = await this.encounterService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Encounters search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} encounters using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Encounter search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No encounters found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getAllergiesByPatient(patientId: string) {
        // Use simple search patterns for allergies
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching allergies for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying allergy search with params:`, searchParams);
                const result = await this.allergyIntoleranceService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Allergies search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} allergies using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Allergy search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No allergies found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getConditionsByPatient(patientId: string) {
        // Use simple search patterns for conditions
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching conditions for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying condition search with params:`, searchParams);
                const result = await this.conditionService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Conditions search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} conditions using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Condition search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No conditions found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getProceduresByPatient(patientId: string) {
        // Use simple search patterns for procedures
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching procedures for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying procedure search with params:`, searchParams);
                const result = await this.procedureService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Procedures search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} procedures using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Procedure search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No procedures found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getMedicationsByPatient(patientId: string) {
        // Use simple search patterns for medications
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];

        this.logger.debug(`Searching medications for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying medication search with params:`, searchParams);
                const result = await this.medicationStatementService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Medications search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} medications using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Medication search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No medications found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getMedicationRequestsByPatient(patientId: string) {
        // Use simple search patterns for medication requests
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];

        this.logger.debug(`Searching medication requests for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying medication request search with params:`, searchParams);
                const result = await this.medicationRequestService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Medication requests search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} medication requests using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Medication request search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No medication requests found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getObservationsByPatient(patientId: string) {
        // Use simple search patterns for observations
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching observations for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying observation search with params:`, searchParams);
                const result = await this.observationService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Observations search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} observations using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Observation search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No observations found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getFamilyHistoryByPatient(patientId: string) {
        // Use simple search patterns for family history
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching family history for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying family history search with params:`, searchParams);
                const result = await this.familyMemberHistoryService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Family history search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} family history entries using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Family history search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No family history found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getDiagnosticReportsByPatient(patientId: string) {
        // Use simple search patterns for diagnostic reports
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];

        this.logger.debug(`Searching diagnostic reports for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying diagnostic report search with params:`, searchParams);
                const result = await this.diagnosticReportService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Diagnostic reports search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} diagnostic reports using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Diagnostic report search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No diagnostic reports found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getServiceRequestsByPatient(patientId: string) {
        // Use simple search patterns for service requests
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];

        this.logger.debug(`Searching service requests for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying service request search with params:`, searchParams);
                const result = await this.serviceRequestService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Service requests search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} service requests using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Service request search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No service requests found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getAppointmentsByPatient(patientId: string) {
        // Use FHIR-compliant search for appointments by participant.actor
        const searchPatterns = [
            { 'participant.actor': `Patient/${patientId}` },
            { 'participant.actor': patientId }
        ];

        this.logger.debug(`Searching appointments for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying appointment search with params:`, searchParams);
                const result = await this.appointmentService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Appointments search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} appointments using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Appointment search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No appointments found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getCompositionsByPatient(patientId: string) {
        // Use simple search patterns for compositions
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching compositions for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying composition search with params:`, searchParams);
                const result = await this.compositionService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Compositions search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} compositions using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Composition search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No compositions found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    /**
     * Helper method to safely extract resources from Promise.allSettled results
     */
    private extractResourcesFromSettledResult(settledResult: PromiseSettledResult<any>, resourceType: string): any[] {
        if (settledResult.status === 'fulfilled') {
            return this.extractResourcesFromBundle(settledResult.value);
        } else {
            this.logger.warn(`Failed to fetch ${resourceType}:`, {
                resourceType,
                error: settledResult.reason?.message || settledResult.reason
            });
            return [];
        }
    }

    private async getPractitionersByPatient(patientId: string) {
        // Aggregate practitioners referenced by encounters, procedures, and appointments
        this.logger.debug(`Aggregating practitioners for patient: ${patientId}`);
        const practitionerIds = new Set<string>();
        // 1. From Encounters
        try {
            const encountersBundle = await this.getEncountersByPatient(patientId);
            const encounters = this.extractResourcesFromBundle(encountersBundle);
            for (const enc of encounters) {
                const participants = enc.resource?.participant;
                if (Array.isArray(participants)) {
                    for (const p of participants) {
                        if (p.individual?.reference?.startsWith('Practitioner/')) {
                            practitionerIds.add(p.individual.reference.replace('Practitioner/', ''));
                        }
                    }
                }
                if (enc.resource?.serviceProvider?.reference?.startsWith('Practitioner/')) {
                    practitionerIds.add(enc.resource.serviceProvider.reference.replace('Practitioner/', ''));
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating practitioners from encounters:`, { error: error.message });
        }
        // 2. From Procedures
        try {
            const proceduresBundle = await this.getProceduresByPatient(patientId);
            const procedures = this.extractResourcesFromBundle(proceduresBundle);
            for (const proc of procedures) {
                if (proc.resource?.performer) {
                    for (const performer of proc.resource.performer) {
                        if (performer.actor?.reference?.startsWith('Practitioner/')) {
                            practitionerIds.add(performer.actor.reference.replace('Practitioner/', ''));
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating practitioners from procedures:`, { error: error.message });
        }
        // 3. From Appointments
        try {
            const appointmentsBundle = await this.getAppointmentsByPatient(patientId);
            const appointments = this.extractResourcesFromBundle(appointmentsBundle);
            for (const appt of appointments) {
                if (appt.resource?.participant) {
                    for (const part of appt.resource.participant) {
                        if (part.actor?.reference?.startsWith('Practitioner/')) {
                            practitionerIds.add(part.actor.reference.replace('Practitioner/', ''));
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating practitioners from appointments:`, { error: error.message });
        }
        // Fetch unique practitioners
        if (practitionerIds.size === 0) {
            this.logger.warn(`No practitioners found for patient ${patientId}`);
            return { entry: [] };
        }
        const practitionerPromises = Array.from(practitionerIds).map(id => this.practitionerService.findById(id).catch(() => null));
        const practitioners = (await Promise.all(practitionerPromises)).filter(p => p);
        this.logger.log(`Found ${practitioners.length} unique practitioners for patient ${patientId}`);
        return { entry: practitioners.map(resource => ({ resource })) };
    }

    private async getDevicesByPatient(patientId: string) {
        // Use simple search patterns for devices
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching devices for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying device search with params:`, searchParams);
                const result = await this.deviceService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Devices search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} devices using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Device search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No devices found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getLocationsByPatient(patientId: string) {
        // Aggregate locations referenced by encounters, appointments, and procedures
        this.logger.debug(`Aggregating locations for patient: ${patientId}`);
        const locationIds = new Set<string>();
        // 1. From Encounters
        try {
            const encountersBundle = await this.getEncountersByPatient(patientId);
            const encounters = this.extractResourcesFromBundle(encountersBundle);
            for (const enc of encounters) {
                if (enc.resource?.location) {
                    for (const loc of enc.resource.location) {
                        if (loc.location?.reference?.startsWith('Location/')) {
                            locationIds.add(loc.location.reference.replace('Location/', ''));
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating locations from encounters:`, { error: error.message });
        }
        // 2. From Appointments
        try {
            const appointmentsBundle = await this.getAppointmentsByPatient(patientId);
            const appointments = this.extractResourcesFromBundle(appointmentsBundle);
            for (const appt of appointments) {
                if (appt.resource?.location?.reference?.startsWith('Location/')) {
                    locationIds.add(appt.resource.location.reference.replace('Location/', ''));
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating locations from appointments:`, { error: error.message });
        }
        // 3. From Procedures
        try {
            const proceduresBundle = await this.getProceduresByPatient(patientId);
            const procedures = this.extractResourcesFromBundle(proceduresBundle);
            for (const proc of procedures) {
                if (proc.resource?.location?.reference?.startsWith('Location/')) {
                    locationIds.add(proc.resource.location.reference.replace('Location/', ''));
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating locations from procedures:`, { error: error.message });
        }
        if (locationIds.size === 0) {
            this.logger.warn(`No locations found for patient ${patientId}`);
            return { entry: [] };
        }
        const locationPromises = Array.from(locationIds).map(id => this.locationService.findById(id).catch(() => null));
        const locations = (await Promise.all(locationPromises)).filter(l => l);
        this.logger.log(`Found ${locations.length} unique locations for patient ${patientId}`);
        return { entry: locations.map(resource => ({ resource })) };
    }

    private async getMedicationResourcesByPatient(patientId: string) {
        // Search for Medication resources (different from MedicationStatement)
        // These are often referenced by MedicationStatement or MedicationRequest
        this.logger.debug(`Searching medication resources for patient: ${patientId}`);

        try {
            // For now, search all medications (you may want to refine this logic)
            const result = await this.medicationService.search({});
            const count = result?.entry?.length || 0;
            this.logger.debug(`Medication resources search result:`, {
                total: result?.total || 0,
                entryCount: count
            });

            if (count > 0) {
                this.logger.log(`Found ${count} medication resources`);
                return result;
            }
        } catch (error) {
            this.logger.debug(`Medication resource search failed:`, { error: error.message });
        }

        this.logger.warn(`No medication resources found for patient ${patientId}`);
        return { entry: [] };
    }

    private async getOrganizationsByPatient(patientId: string) {
        // Aggregate organizations referenced by encounters, procedures, and patient
        this.logger.debug(`Aggregating organizations for patient: ${patientId}`);
        const organizationIds = new Set<string>();
        // 1. From Encounters
        try {
            const encountersBundle = await this.getEncountersByPatient(patientId);
            const encounters = this.extractResourcesFromBundle(encountersBundle);
            for (const enc of encounters) {
                if (enc.resource?.serviceProvider?.reference?.startsWith('Organization/')) {
                    organizationIds.add(enc.resource.serviceProvider.reference.replace('Organization/', ''));
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating organizations from encounters:`, { error: error.message });
        }
        // 2. From Procedures
        try {
            const proceduresBundle = await this.getProceduresByPatient(patientId);
            const procedures = this.extractResourcesFromBundle(proceduresBundle);
            for (const proc of procedures) {
                if (proc.resource?.performer) {
                    for (const performer of proc.resource.performer) {
                        if (performer.actor?.reference?.startsWith('Organization/')) {
                            organizationIds.add(performer.actor.reference.replace('Organization/', ''));
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating organizations from procedures:`, { error: error.message });
        }
        // 3. From Patient
        try {
            const patient = await this.patientService.findById(patientId);
            if (patient?.managingOrganization?.reference?.startsWith('Organization/')) {
                organizationIds.add(patient.managingOrganization.reference.replace('Organization/', ''));
            }
        } catch (error) {
            this.logger.error(`Error aggregating organizations from patient:`, { error: error.message });
        }
        if (organizationIds.size === 0) {
            this.logger.warn(`No organizations found for patient ${patientId}`);
            return { entry: [] };
        }
        const orgPromises = Array.from(organizationIds).map(id => this.organizationService.findById(id).catch(() => null));
        const organizations = (await Promise.all(orgPromises)).filter(o => o);
        this.logger.log(`Found ${organizations.length} unique organizations for patient ${patientId}`);
        return { entry: organizations.map(resource => ({ resource })) };
    }

    private async getSpecimensByPatient(patientId: string) {
        // Aggregate devices referenced by patient and encounters
        this.logger.debug(`Aggregating devices for patient: ${patientId}`);
        const deviceIds = new Set<string>();
        // 1. From Device resources directly linked to patient
        try {
            const searchPatterns = [
                { 'patient': `Patient/${patientId}` },
                { 'patient': patientId },
                { 'subject': `Patient/${patientId}` },
                { 'subject': patientId }
            ];
            for (const searchParams of searchPatterns) {
                try {
                    const result = await this.deviceService.search(searchParams);
                    const entries = Array.isArray(result?.entry) ? result.entry : [];
                    for (const entry of entries) {
                        if (entry.resource?.id) {
                            deviceIds.add(entry.resource.id);
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error searching devices with params:`, { searchParams, error: error.message });
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating devices from patient search:`, { error: error.message });
        }
        // 2. From Encounters
        try {
            const encountersBundle = await this.getEncountersByPatient(patientId);
            const encounters = this.extractResourcesFromBundle(encountersBundle);
            for (const enc of encounters) {
                if (enc.resource?.device) {
                    for (const dev of enc.resource.device) {
                        if (dev.reference?.startsWith('Device/')) {
                            deviceIds.add(dev.reference.replace('Device/', ''));
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error aggregating devices from encounters:`, { error: error.message });
        }
        if (deviceIds.size === 0) {
            this.logger.warn(`No devices found for patient ${patientId}`);
            return { entry: [] };
        }
        const devicePromises = Array.from(deviceIds).map(id => this.deviceService.findById(id).catch(() => null));
        const devices = (await Promise.all(devicePromises)).filter(d => d);
        this.logger.log(`Found ${devices.length} unique devices for patient ${patientId}`);
        return { entry: devices.map(resource => ({ resource })) };
    }

    private async getCarePlansByPatient(patientId: string) {
        // Use simple search patterns for care plans
        const searchPatterns = [
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId },
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];

        this.logger.debug(`Searching care plans for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying care plan search with params:`, searchParams);
                const result = await this.carePlanService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Care plans search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} care plans using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.debug(`Care plan search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No care plans found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getImmunizationsByPatient(patientId: string) {
        // Use simple search patterns for immunizations
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId },
            { 'subject': `Patient/${patientId}` },
            { 'subject': patientId }
        ];

        this.logger.debug(`Searching immunizations for patient: ${patientId}`);

        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying immunization search with params:`, searchParams);
                const result = await this.immunizationService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Immunizations search result:`, {
                    searchParams,
                    total: result?.total || 0,
                    entryCount: count
                });

                if (count > 0) {
                    this.logger.log(`Found ${count} immunizations using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.error(`Immunization search failed with params:`, { searchParams, error: error.message });
            }
        }

        this.logger.warn(`No immunizations found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }


    private async getSlotsByPatient(patientId: string) {
        // Fetch slots via appointments and schedules for the patient
        this.logger.debug(`Fetching slots via appointments and schedules for patient: ${patientId}`);
        let slots: any[] = [];
        const slotRefs = new Set<string>();
        try {
            // 1. Slots via Appointments
            const appointmentsBundle = await this.getAppointmentsByPatient(patientId);
            const appointments = this.extractResourcesFromBundle(appointmentsBundle);
            for (const appt of appointments) {
                const apptSlots = appt.resource?.slot;
                if (Array.isArray(apptSlots)) {
                    apptSlots.forEach((ref: any) => {
                        if (typeof ref === 'string') {
                            slotRefs.add(ref.replace(/^Slot\//, ''));
                        } else if (ref.reference) {
                            slotRefs.add(ref.reference.replace(/^Slot\//, ''));
                        }
                    });
                }
            }

            // 2. Slots via Schedules where patient is an actor
            const schedulesBundle = await this.getSchedulesByPatient(patientId);
            const schedules = this.extractResourcesFromBundle(schedulesBundle);
            for (const schedule of schedules) {
                const scheduleId = schedule.resource?.id;
                if (scheduleId) {
                    // Find all slots for this schedule
                    try {
                        const slotSearchResult = await this.slotService.search({ schedule: `Schedule/${scheduleId}` });
                        const slotEntries = Array.isArray(slotSearchResult?.entry) ? slotSearchResult.entry : [];
                        for (const entry of slotEntries) {
                            const slotId = entry.resource?.id;
                            if (slotId) {
                                slotRefs.add(slotId);
                            }
                        }
                    } catch (slotErr) {
                        this.logger.debug(`Slot search failed for schedule ${scheduleId}:`, { error: slotErr.message });
                    }
                }
            }

            if (slotRefs.size === 0) {
                this.logger.warn(`No slot references found in appointments or schedules for patient ${patientId}`);
                return { entry: [] };
            }
            // Fetch each slot by ID (deduplicated)
            const slotPromises = Array.from(slotRefs).map(slotId => this.slotService.findById(slotId).catch(() => null));
            const slotResults = await Promise.all(slotPromises);
            slots = slotResults.filter(s => s);
            this.logger.log(`Found ${slots.length} unique slots for patient ${patientId} via appointments and schedules.`);
            return { entry: slots.map(slot => ({ resource: slot })) };
        } catch (error) {
            this.logger.error(`Error fetching slots for patient ${patientId} via appointments and schedules:`, { error: error.message });
            return { entry: [] };
        }
    }

    private async getClaimsByPatient(patientId: string) {
        const searchPatterns = [
            { 'patient': `Patient/${patientId}` },
            { 'patient': patientId }
        ];
        this.logger.debug(`Searching claims for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying claim search with params:`, searchParams);
                const result = await this.claimService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Claims search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} claims using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.error(`Claim search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No claims found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }

    private async getSchedulesByPatient(patientId: string) {
        // Use search patterns for schedules referencing the patient as actor
        const searchPatterns = [
            { 'actor': `Patient/${patientId}` },
            { 'actor': patientId }
        ];
        this.logger.debug(`Searching schedules for patient: ${patientId}`);
        for (const searchParams of searchPatterns) {
            try {
                this.logger.debug(`Trying schedule search with params:`, searchParams);
                const result = await this.scheduleService.search(searchParams);
                const count = result?.entry?.length || 0;
                this.logger.debug(`Schedules search result:`, { searchParams, total: result?.total || 0, entryCount: count });
                if (count > 0) {
                    this.logger.log(`Found ${count} schedules using search params:`, searchParams);
                    return result;
                }
            } catch (error) {
                this.logger.error(`Schedule search failed with params:`, { searchParams, error: error.message });
            }
        }
        this.logger.warn(`No schedules found for patient ${patientId} with any search pattern`);
        return { entry: [] };
    }
}
