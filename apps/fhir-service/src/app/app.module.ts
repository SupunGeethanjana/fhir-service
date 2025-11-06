import { Module } from '@nestjs/common';
import { ConfigsModule } from '../config/configs.module';
import { CoreModule } from '../core/core.module';
import { GraphqlModule } from '../graphql/graphql.module';
import { LiquibaseRunnerService } from '../liquibase/liquibase-runner.service';
import { LiquibaseModule } from '../liquibase/liquibase.module';
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
import { ImagingStudyModule } from '../models/imaging-study/imaging-study.module';
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
import { ServiceRequestModule } from '../models/service-request/service-request.module';
import { SlotModule } from '../models/slot/slot.module';
import { SpecimenModule } from '../models/specimen/specimen.module';
import { ValueSetModule } from '../models/value-set/value-set.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Newly scaffolded FHIR resource modules
import { CareTeamModule } from '../models/care-team/care-team.module';
import { ClaimModule } from '../models/claim/claim.module';
import { CoverageModule } from '../models/coverage/coverage.module';
import { DocumentReferenceModule } from '../models/document-reference/document-reference.module';
import { ExplanationOfBenefitModule } from '../models/explanation-of-benefit/explanation-of-benefit.module';
import { GoalModule } from '../models/goal/goal.module';
import { MedicationAdministrationModule } from '../models/medication-administration/medication-administration.module';
import { ProvenanceModule } from '../models/provenance/provenance.module';

@Module({
  imports: [
    ConfigsModule,
    LiquibaseModule,
    CoreModule,
    PatientModule,
    PractitionerModule,
    EncounterModule,
    ConditionModule,
    ProcedureModule,
    MedicationStatementModule,
    FamilyMemberHistoryModule,
    DiagnosticReportModule,
    ObservationModule,
    CompositionModule,
    AllergyIntoleranceModule,
    MedicationRequestModule,
    ServiceRequestModule,
    AppointmentModule,
    CarePlanModule,
    OrganizationModule,
    LocationModule,
    MedicationModule,
    DeviceModule,
    SpecimenModule,
    CodeSystemModule,
    ValueSetModule,
    GraphqlModule,
    PractitionerRoleModule,
    SlotModule,
    ImmunizationModule,
    CareTeamModule,
    ClaimModule,
    CoverageModule,
    DocumentReferenceModule,
    ExplanationOfBenefitModule,
    GoalModule,
    MedicationAdministrationModule,
    ProvenanceModule,
    ImagingStudyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private liquibaseRunner: LiquibaseRunnerService) {
    this.liquibaseRunner.update();
  }
}
