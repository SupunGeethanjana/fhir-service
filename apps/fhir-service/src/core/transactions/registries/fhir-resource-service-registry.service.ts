import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ImmunizationService } from 'apps/fhir-service/src/models/immunization/immunization.service';
import { PractitionerRoleService } from 'apps/fhir-service/src/models/practitioner-role/practitioner-role.service';
import { SlotService } from 'apps/fhir-service/src/models/slot/slot.service';
import { FhirResourceType } from '../../../common/enums/fhir-enums';
import { FhirResourceService } from '../../../fhir-generics/fhir-resource-service.interface';
import { AllergyIntoleranceService } from '../../../models/allergy-intolerance/allergy-intolerance.service';
import { AppointmentService } from '../../../models/appointment/appointment.service';
import { CarePlanService } from '../../../models/care-plan/care-plan.service';
import { CodeSystemService } from '../../../models/code-system/code-system.service';
import { CompositionService } from '../../../models/composition/composition.service';
import { ConditionService } from '../../../models/condition/condition.service';
import { DeviceService } from '../../../models/device/device.service';
import { DiagnosticReportService } from '../../../models/diagnostic-report/diagnostic-report.service';
import { EncounterService } from '../../../models/encounter/encounter.service';
import { FamilyMemberHistoryService } from '../../../models/family-member-history/family-member-history.service';
import { LocationService } from '../../../models/location/location.service';
import { MedicationRequestService } from '../../../models/medication-request/medication-request.service';
import { MedicationStatementService } from '../../../models/medication-statement/medication-statement.service';
import { MedicationService } from '../../../models/medication/medication.service';
import { ObservationService } from '../../../models/observation/observation.service';
import { OrganizationService } from '../../../models/organization/organization.service';
import { PatientService } from '../../../models/patient/patient.service';
import { PractitionerService } from '../../../models/practitioner/practitioner.service';
import { ProcedureService } from '../../../models/procedure/procedure.service';
import { ServiceRequestService } from '../../../models/service-request/service-request.service';
import { SpecimenService } from '../../../models/specimen/specimen.service';
import { ValueSetService } from '../../../models/value-set/value-set.service';

import { CareTeamService } from '../../../models/care-team/care-team.service';
import { ClaimService } from '../../../models/claim/claim.service';
import { CoverageService } from '../../../models/coverage/coverage.service';
import { DocumentReferenceService } from '../../../models/document-reference/document-reference.service';
import { ExplanationOfBenefitService } from '../../../models/explanation-of-benefit/explanation-of-benefit.service';
import { GoalService } from '../../../models/goal/goal.service';
import { ImagingStudyService } from '../../../models/imaging-study/imaging-study.service';
import { MedicationAdministrationService } from '../../../models/medication-administration/medication-administration.service';
import { ProvenanceService } from '../../../models/provenance/provenance.service';
import { ScheduleService } from '../../../models/schedule/schedule.service';

/**
 * Service registry for managing all FHIR resource services
 * Centralizes service mapping and provides easy access to services by resource type
 */
@Injectable()
export class FhirResourceServiceRegistry implements OnModuleInit {
    private readonly logger = new Logger(FhirResourceServiceRegistry.name);
    private serviceMap: Map<string, FhirResourceService>;

    constructor(
        @Inject(forwardRef(() => PatientService))
        private readonly patientService: PatientService,
        @Inject(forwardRef(() => PractitionerService))
        private readonly practitionerService: PractitionerService,
        @Inject(forwardRef(() => PractitionerRoleService))
        private readonly practitionerRoleService: PractitionerRoleService,
        @Inject(forwardRef(() => ObservationService))
        private readonly observationService: ObservationService,
        @Inject(forwardRef(() => ImmunizationService))
        private readonly immunizationService: ImmunizationService,
        @Inject(forwardRef(() => SlotService))
        private readonly slotService: SlotService,
        @Inject(forwardRef(() => ScheduleService))
        private readonly scheduleService: ScheduleService,
        @Inject(forwardRef(() => CompositionService))
        private readonly compositionService: CompositionService,
        @Inject(forwardRef(() => EncounterService))
        private readonly encounterService: EncounterService,
        @Inject(forwardRef(() => ConditionService))
        private readonly conditionService: ConditionService,
        @Inject(forwardRef(() => DeviceService))
        private readonly deviceService: DeviceService,
        @Inject(forwardRef(() => ProcedureService))
        private readonly procedureService: ProcedureService,
        @Inject(forwardRef(() => MedicationStatementService))
        private readonly medStatementService: MedicationStatementService,
        @Inject(forwardRef(() => FamilyMemberHistoryService))
        private readonly fmhService: FamilyMemberHistoryService,
        @Inject(forwardRef(() => DiagnosticReportService))
        private readonly dxReportService: DiagnosticReportService,
        @Inject(forwardRef(() => AllergyIntoleranceService))
        private readonly allergyIntoleranceService: AllergyIntoleranceService,
        @Inject(forwardRef(() => MedicationRequestService))
        private readonly medicationRequestService: MedicationRequestService,
        @Inject(forwardRef(() => ServiceRequestService))
        private readonly serviceRequestService: ServiceRequestService,
        @Inject(forwardRef(() => AppointmentService))
        private readonly appointmentService: AppointmentService,
        @Inject(forwardRef(() => CarePlanService))
        private readonly carePlanService: CarePlanService,
        @Inject(forwardRef(() => OrganizationService))
        private readonly organizationService: OrganizationService,
        @Inject(forwardRef(() => LocationService))
        private readonly locationService: LocationService,
        @Inject(forwardRef(() => MedicationService))
        private readonly medicationService: MedicationService,
        @Inject(forwardRef(() => SpecimenService))
        private readonly specimenService: SpecimenService,
        @Inject(forwardRef(() => CodeSystemService))
        private readonly codeSystemService: CodeSystemService,
        @Inject(forwardRef(() => ValueSetService))
        private readonly valueSetService: ValueSetService,
        @Inject(forwardRef(() => CareTeamService))
        private readonly careTeamService: CareTeamService,
        @Inject(forwardRef(() => ClaimService))
        private readonly claimService: ClaimService,
        @Inject(forwardRef(() => CoverageService))
        private readonly coverageService: CoverageService,
        @Inject(forwardRef(() => DocumentReferenceService))
        private readonly documentReferenceService: DocumentReferenceService,
        @Inject(forwardRef(() => ExplanationOfBenefitService))
        private readonly explanationOfBenefitService: ExplanationOfBenefitService,
        @Inject(forwardRef(() => GoalService))
        private readonly goalService: GoalService,
        @Inject(forwardRef(() => MedicationAdministrationService))
        private readonly medicationAdministrationService: MedicationAdministrationService,
        @Inject(forwardRef(() => ProvenanceService))
        private readonly provenanceService: ProvenanceService,
        @Inject(forwardRef(() => ImagingStudyService))
        private readonly imagingStudyService: ImagingStudyService,
    ) { }

    /**
     * Initialize the service map after all dependencies are injected
     */
    onModuleInit(): void {
        this.logger.log('>>> [FhirResourceServiceRegistry] onModuleInit START');
        this.logger.log('Initializing FHIR resource service mappings');
        this.serviceMap = this.createServiceMap();
        this.logRegisteredServices();
        this.logger.log('<<< [FhirResourceServiceRegistry] onModuleInit END');
    }

    /**
     * Gets the appropriate service for a given resource type
     */
    getServiceForResourceType(resourceType: string): FhirResourceService {
        const service = this.serviceMap.get(resourceType);
        if (!service) {
            throw new Error(`Unsupported resource type: ${resourceType}`);
        }
        return service;
    }

    /**
     * Gets the service map for external use
     */
    getServiceMap(): Map<string, FhirResourceService> {
        return this.serviceMap;
    }

    /**
     * Checks if a resource type is supported
     */
    isResourceTypeSupported(resourceType: string): boolean {
        return this.serviceMap.has(resourceType);
    }

    /**
     * Gets list of all supported resource types
     */
    getSupportedResourceTypes(): string[] {
        return Array.from(this.serviceMap.keys());
    }

    /**
     * Creates the mapping between resource types and their corresponding services
     */
    private createServiceMap(): Map<string, FhirResourceService> {
        return new Map<string, FhirResourceService>([
            [FhirResourceType.PATIENT.toString(), this.patientService],
            [FhirResourceType.PRACTITIONER.toString(), this.practitionerService],
            [FhirResourceType.PRACTITIONER_ROLE.toString(), this.practitionerRoleService],
            [FhirResourceType.IMMUNIZATION.toString(), this.immunizationService],
            [FhirResourceType.SLOT.toString(), this.slotService],
            [FhirResourceType.SCHEDULE.toString(), this.scheduleService],
            [FhirResourceType.OBSERVATION.toString(), this.observationService],
            [FhirResourceType.COMPOSITION.toString(), this.compositionService],
            [FhirResourceType.ENCOUNTER.toString(), this.encounterService],
            [FhirResourceType.CONDITION.toString(), this.conditionService],
            [FhirResourceType.DEVICE.toString(), this.deviceService],
            [FhirResourceType.PROCEDURE.toString(), this.procedureService],
            [FhirResourceType.MEDICATION_STATEMENT.toString(), this.medStatementService],
            [FhirResourceType.FAMILY_MEMBER_HISTORY.toString(), this.fmhService],
            [FhirResourceType.DIAGNOSTIC_REPORT.toString(), this.dxReportService],
            [FhirResourceType.ALLERGY_INTOLERANCE.toString(), this.allergyIntoleranceService],
            [FhirResourceType.MEDICATION_REQUEST.toString(), this.medicationRequestService],
            [FhirResourceType.SERVICE_REQUEST.toString(), this.serviceRequestService],
            [FhirResourceType.APPOINTMENT.toString(), this.appointmentService],
            [FhirResourceType.CARE_PLAN.toString(), this.carePlanService],
            [FhirResourceType.ORGANIZATION.toString(), this.organizationService],
            [FhirResourceType.LOCATION.toString(), this.locationService],
            [FhirResourceType.MEDICATION.toString(), this.medicationService],
            [FhirResourceType.SPECIMEN.toString(), this.specimenService],
            [FhirResourceType.CODE_SYSTEM.toString(), this.codeSystemService],
            [FhirResourceType.VALUE_SET.toString(), this.valueSetService],
            [FhirResourceType.CARE_TEAM.toString(), this.careTeamService],
            [FhirResourceType.CLAIM.toString(), this.claimService],
            [FhirResourceType.COVERAGE.toString(), this.coverageService],
            [FhirResourceType.DOCUMENT_REFERENCE.toString(), this.documentReferenceService],
            [FhirResourceType.EXPLANATION_OF_BENEFIT.toString(), this.explanationOfBenefitService],
            [FhirResourceType.GOAL.toString(), this.goalService],
            [FhirResourceType.MEDICATION_ADMINISTRATION.toString(), this.medicationAdministrationService],
            [FhirResourceType.PROVENANCE.toString(), this.provenanceService],
            [FhirResourceType.IMAGING_STUDY.toString(), this.imagingStudyService],
        ]);
    }

    /**
     * Logs registered services for debugging
     */
    private logRegisteredServices(): void {
        const supportedTypes = this.getSupportedResourceTypes();
        this.logger.log(`Registered ${supportedTypes.length} FHIR resource services: ${supportedTypes.join(', ')}`);
    }
}
