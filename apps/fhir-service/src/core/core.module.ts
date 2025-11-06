import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// All services that form the application's core infrastructure
import { BundleLogController } from './bundles/bundle-log.controller';
import { BundleLogService } from './bundles/bundle-log.service';
import { BundleController } from './bundles/bundle.controller';
import { SearchPerformanceController } from './performance/search-performance.controller';
import { SearchPerformanceService } from './performance/search-performance.service';
import { ConventionBasedSearchService } from './search/convention-based-search.service';
import { GenericSearchService } from './search/generic-search.service';
import { TransactionDuplicateDetectionService } from './transactions/detectors/transaction-duplicate-detection.service';
import { TransactionOperationHandlerService } from './transactions/handlers/transaction-operation-handler.service';
import { TransactionResourceMergeService } from './transactions/mergers/transaction-resource-merge.service';
import { FhirResourceServiceRegistry } from './transactions/registries/fhir-resource-service-registry.service';
import { TransactionService } from './transactions/transaction.service';
import { TransactionValidationService } from './transactions/validators/transaction-validation.service';

// The entities that support the core services
import { BundleLog } from './bundles/bundle-log.entity';
import { FhirSearchParameter } from './search/fhir-search-parameter.entity';

// Import all FHIR resource modules
import { AllergyIntoleranceModule } from '../models/allergy-intolerance/allergy-intolerance.module';
import { AppointmentModule } from '../models/appointment/appointment.module';
import { CarePlanModule } from '../models/care-plan/care-plan.module';
import { CodeSystemModule } from '../models/code-system/code-system.module';
import { CompositionModule } from '../models/composition/composition.module';
import { ConditionModule } from '../models/condition/condition.module';
import { DeviceModule } from '../models/device/device.module';
import { DiagnosticReportModule } from '../models/diagnostic-report/diagnostic-report.module';
import { EncounterModule } from '../models/encounter/encounter.module';
import { FamilyMemberHistoryModule } from '../models/family-member-history/family-member-history.module';
import { ImmunizationModule } from '../models/immunization/immunization.module';
import { LocationModule } from '../models/location/location.module';
import { MedicationRequestModule } from '../models/medication-request/medication-request.module';
import { MedicationStatementModule } from '../models/medication-statement/medication-statement.module';
import { MedicationModule } from '../models/medication/medication.module';
import { ObservationModule } from '../models/observation/observation.module';
import { OrganizationModule } from '../models/organization/organization.module';
import { PatientModule } from '../models/patient/patient.module';
import { PractitionerRoleModule } from '../models/practitioner-role/practitioner-role.module';
import { PractitionerModule } from '../models/practitioner/practitioner.module';
import { ProcedureModule } from '../models/procedure/procedure.module';
import { ScheduleModule } from '../models/schedule/schedule.module';
import { ServiceRequestModule } from '../models/service-request/service-request.module';
import { SlotModule } from '../models/slot/slot.module';
import { SpecimenModule } from '../models/specimen/specimen.module';
import { ValueSetModule } from '../models/value-set/value-set.module';

// Newly scaffolded FHIR resource modules
import { CareTeamModule } from '../models/care-team/care-team.module';
import { ClaimModule } from '../models/claim/claim.module';
import { CoverageModule } from '../models/coverage/coverage.module';
import { DocumentReferenceModule } from '../models/document-reference/document-reference.module';
import { ExplanationOfBenefitModule } from '../models/explanation-of-benefit/explanation-of-benefit.module';
import { GoalModule } from '../models/goal/goal.module';
import { ImagingStudyModule } from '../models/imaging-study/imaging-study.module';
import { MedicationAdministrationModule } from '../models/medication-administration/medication-administration.module';
import { ProvenanceModule } from '../models/provenance/provenance.module';

@Global() // Makes core services available everywhere
@Module({
    imports: [
        // Database
        TypeOrmModule.forFeature([BundleLog, FhirSearchParameter]),

        // FHIR resource modules with forward references to avoid circular dependencies
        forwardRef(() => AllergyIntoleranceModule),
        forwardRef(() => AppointmentModule),
        forwardRef(() => CarePlanModule),
        forwardRef(() => CodeSystemModule),
        forwardRef(() => CompositionModule),
        forwardRef(() => ConditionModule),
        forwardRef(() => DeviceModule),
        forwardRef(() => DiagnosticReportModule),
        forwardRef(() => EncounterModule),
        forwardRef(() => FamilyMemberHistoryModule),
        forwardRef(() => LocationModule),
        forwardRef(() => MedicationModule),
        forwardRef(() => MedicationRequestModule),
        forwardRef(() => MedicationStatementModule),
        forwardRef(() => ObservationModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => PatientModule),
        forwardRef(() => PractitionerModule),
        forwardRef(() => PractitionerRoleModule),
        forwardRef(() => ImmunizationModule),
        forwardRef(() => SlotModule),
        forwardRef(() => ScheduleModule),
        forwardRef(() => ProcedureModule),
        forwardRef(() => ServiceRequestModule),
        forwardRef(() => SpecimenModule),
        forwardRef(() => ValueSetModule),
        forwardRef(() => CareTeamModule),
        forwardRef(() => ClaimModule),
        forwardRef(() => CoverageModule),
        forwardRef(() => DocumentReferenceModule),
        forwardRef(() => ExplanationOfBenefitModule),
        forwardRef(() => GoalModule),
        forwardRef(() => MedicationAdministrationModule),
        forwardRef(() => ProvenanceModule),
        forwardRef(() => ImagingStudyModule),
    ],
    // Controllers that handle requests
    controllers: [
        BundleController,
        BundleLogController,
        SearchPerformanceController,
    ],
    // Provide all core services
    providers: [
        BundleLogService,
        GenericSearchService,
        ConventionBasedSearchService,
        TransactionService,
        TransactionValidationService,
        TransactionDuplicateDetectionService,
        TransactionOperationHandlerService,
        TransactionResourceMergeService,
        FhirResourceServiceRegistry,
        SearchPerformanceService,
    ],
    // Export them so other modules can use them
    exports: [
        BundleLogService,
        GenericSearchService,
        ConventionBasedSearchService,
        TransactionService,
        TransactionValidationService,
        TransactionDuplicateDetectionService,
        TransactionOperationHandlerService,
        TransactionResourceMergeService,
        FhirResourceServiceRegistry,
        SearchPerformanceService,
    ],
})
export class CoreModule { }
