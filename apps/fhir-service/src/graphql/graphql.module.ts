import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ClinicalDataResolver } from './resolvers/clinical-data.resolver';
import { GraphQLJSONObjectScalar } from './types/json.scalar';

// Import resolvers
import { CompositionResolver } from './resolvers/composition.resolver';
import { EncounterResolver } from './resolvers/encounter.resolver';
import { FhirSearchResolver } from './resolvers/fhir-search.resolver';
import { ImmunizationResolver } from './resolvers/immunization.resolver';
import { MedicationResolver } from './resolvers/medication.resolver';
import { PatientDataResolver } from './resolvers/patient-data.resolver';
import { PractitionerRoleResolver } from './resolvers/practitioner-role.resolver';
import { SlotResolver } from './resolvers/slot.resolver';
import { TerminologyResolver } from './resolvers/terminology.resolver';

// Import services
import { PatientDataService } from './services/patient-data.service';
import { TerminologyGraphQLService } from './services/terminology-graphql.service';

// Import FHIR resource modules
import { AllergyIntoleranceModule } from '../models/allergy-intolerance/allergy-intolerance.module';
import { AppointmentModule } from '../models/appointment/appointment.module';
import { CarePlanModule } from '../models/care-plan/care-plan.module';
import { CareTeamModule } from '../models/care-team/care-team.module';
import { ClaimModule } from '../models/claim/claim.module';
import { CodeSystemModule } from '../models/code-system/code-system.module';
import { CompositionModule } from '../models/composition/composition.module';
import { ConditionModule } from '../models/condition/condition.module';
import { CoverageModule } from '../models/coverage/coverage.module';
import { DeviceModule } from '../models/device/device.module';
import { DiagnosticReportModule } from '../models/diagnostic-report/diagnostic-report.module';
import { DocumentReferenceModule } from '../models/document-reference/document-reference.module';
import { EncounterModule } from '../models/encounter/encounter.module';
import { ExplanationOfBenefitModule } from '../models/explanation-of-benefit/explanation-of-benefit.module';
import { FamilyMemberHistoryModule } from '../models/family-member-history/family-member-history.module';
import { GoalModule } from '../models/goal/goal.module';
import { ImmunizationModule } from '../models/immunization/immunization.module';
import { LocationModule } from '../models/location/location.module';
import { MedicationAdministrationModule } from '../models/medication-administration/medication-administration.module';
import { MedicationRequestModule } from '../models/medication-request/medication-request.module';
import { MedicationStatementModule } from '../models/medication-statement/medication-statement.module';
import { MedicationModule } from '../models/medication/medication.module';
import { ObservationModule } from '../models/observation/observation.module';
import { OrganizationModule } from '../models/organization/organization.module';
import { PatientModule } from '../models/patient/patient.module';
import { PractitionerRoleModule } from '../models/practitioner-role/practitioner-role.module';
import { PractitionerModule } from '../models/practitioner/practitioner.module';
import { ProcedureModule } from '../models/procedure/procedure.module';
import { ProvenanceModule } from '../models/provenance/provenance.module';
import { ScheduleModule } from '../models/schedule/schedule.module';
import { ServiceRequestModule } from '../models/service-request/service-request.module';
import { SlotModule } from '../models/slot/slot.module';
import { SpecimenModule } from '../models/specimen/specimen.module';
import { ValueSetModule } from '../models/value-set/value-set.module';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: true,
            introspection: true,
            path: '/fhir-service/graphql', // Explicit path with service prefix
            context: ({ req }) => ({ req }),
            formatError: (error) => {
                const logger = new Logger('GraphQLModule');
                logger.error('GraphQL Error:', error);
                return {
                    message: error.message,
                    code: error.extensions?.code,
                    path: error.path,
                };
            },
        }),

        // Import all FHIR resource modules
        PatientModule,
        PractitionerModule,
        PractitionerRoleModule,
        EncounterModule,
        AllergyIntoleranceModule,
        AppointmentModule,
        CarePlanModule,
        ConditionModule,
        DeviceModule,
        ProcedureModule,
        MedicationStatementModule,
        MedicationRequestModule,
        MedicationModule,
        ObservationModule,
        FamilyMemberHistoryModule,
        DiagnosticReportModule,
        ServiceRequestModule,
        AppointmentModule,
        CompositionModule,
        LocationModule,
        OrganizationModule,
        SpecimenModule,
        CodeSystemModule,
        ValueSetModule,
        ImmunizationModule,
        SlotModule,
        ScheduleModule,
        CareTeamModule,
        ClaimModule,
        CoverageModule,
        DocumentReferenceModule,
        ExplanationOfBenefitModule,
        GoalModule,
        MedicationAdministrationModule,
        ProvenanceModule,
    ],
    providers: [
        PatientDataResolver,
        FhirSearchResolver,
        TerminologyResolver,
        ImmunizationResolver,
        SlotResolver,
        PractitionerRoleResolver,
        EncounterResolver,
        CompositionResolver,
        MedicationResolver,
        ClinicalDataResolver,
        GraphQLJSONObjectScalar,
        PatientDataService,
        TerminologyGraphQLService,
    ],
    exports: [
        PatientDataService,
        TerminologyGraphQLService,
    ]
})
export class GraphqlModule { }
