import { Field, ObjectType } from '@nestjs/graphql';
import {
    AllergyIntoleranceType,
    AppointmentType,
    CarePlanType,
    CareTeamType,
    ClaimType,
    CompositionType,
    ConditionType,
    CoverageType,
    DeviceType,
    DiagnosticReportType,
    DocumentReferenceType,
    EncounterType,
    ExplanationOfBenefitType,
    FamilyMemberHistoryType,
    GoalType,
    ImagingStudyType,
    ImmunizationType,
    LocationType,
    MediaType,
    MedicationAdministrationType,
    MedicationRequestType,
    MedicationStatementType,
    MedicationType,
    ObservationType,
    OrganizationType,
    PatientType,
    PractitionerRoleType,
    PractitionerType,
    ProcedureType,
    ProvenanceType,
    ScheduleType,
    ServiceRequestType,
    SlotType,
    SpecimenType
} from './fhir-resource.type';

/**
 * Comprehensive patient data aggregate containing all related FHIR resources
 */
@ObjectType()
export class PatientDataType {
    @Field(() => PatientType, { nullable: true })
    patient?: PatientType;

    @Field(() => [PractitionerType], { nullable: true })
    practitioners?: PractitionerType[];

    @Field(() => [PractitionerRoleType], { nullable: true })
    practitionerRoles?: PractitionerRoleType[];

    @Field(() => [EncounterType], { nullable: true })
    encounters?: EncounterType[];

    @Field(() => [AllergyIntoleranceType], { nullable: true })
    allergies?: AllergyIntoleranceType[];

    @Field(() => [ConditionType], { nullable: true })
    conditions?: ConditionType[];

    @Field(() => [ProcedureType], { nullable: true })
    procedures?: ProcedureType[];

    @Field(() => [MedicationStatementType], { nullable: true })
    medications?: MedicationStatementType[];

    @Field(() => [MedicationRequestType], { nullable: true })
    medicationRequests?: MedicationRequestType[];

    @Field(() => [ObservationType], { nullable: true })
    observations?: ObservationType[];

    @Field(() => [FamilyMemberHistoryType], { nullable: true })
    familyHistory?: FamilyMemberHistoryType[];

    @Field(() => [DiagnosticReportType], { nullable: true })
    diagnosticReports?: DiagnosticReportType[];

    @Field(() => [ServiceRequestType], { nullable: true })
    serviceRequests?: ServiceRequestType[];

    @Field(() => [AppointmentType], { nullable: true })
    appointments?: AppointmentType[];

    @Field(() => [CarePlanType], { nullable: true })
    carePlans?: CarePlanType[];

    @Field(() => [CompositionType], { nullable: true })
    compositions?: CompositionType[];

    @Field(() => [DeviceType], { nullable: true })
    devices?: DeviceType[];

    @Field(() => [LocationType], { nullable: true })
    locations?: LocationType[];

    @Field(() => [MedicationType], { nullable: true })
    medicationResources?: MedicationType[];

    @Field(() => [OrganizationType], { nullable: true })
    organizations?: OrganizationType[];

    @Field(() => [SpecimenType], { nullable: true })
    specimens?: SpecimenType[];

    @Field(() => [ImagingStudyType], { nullable: true })
    imagingStudies?: ImagingStudyType[];

    @Field(() => [MediaType], { nullable: true })
    media?: MediaType[];

    @Field(() => [ImmunizationType], { nullable: true })
    immunizations?: ImmunizationType[];


    @Field(() => [SlotType], { nullable: true })
    slots?: SlotType[];


    @Field(() => [CareTeamType], { nullable: true })
    careTeams?: CareTeamType[];

    @Field(() => [ClaimType], { nullable: true })
    claims?: ClaimType[];

    @Field(() => [CoverageType], { nullable: true })
    coverages?: CoverageType[];

    @Field(() => [DocumentReferenceType], { nullable: true })
    documentReferences?: DocumentReferenceType[];

    @Field(() => [ExplanationOfBenefitType], { nullable: true })
    explanationOfBenefits?: ExplanationOfBenefitType[];

    @Field(() => [GoalType], { nullable: true })
    goals?: GoalType[];

    @Field(() => [MedicationAdministrationType], { nullable: true })
    medicationAdministrations?: MedicationAdministrationType[];

    @Field(() => [ProvenanceType], { nullable: true })
    provenances?: ProvenanceType[];

    @Field(() => [ScheduleType], { nullable: true })
    schedules?: ScheduleType[];
}

/**
 * Input type for patient search by MRN
 */
@ObjectType()
export class PatientSearchInput {
    @Field()
    mrn: string;

    @Field({ nullable: true })
    system?: string; // Optional system for the identifier
}
