import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';


/**
 * Base GraphQL type for all FHIR resources
 */
@ObjectType()
export class FhirResourceType {
    @Field(() => ID)
    id: string;

    @Field()
    resourceType: string;

    @Field(() => GraphQLJSON)
    resource: any;

    @Field({ nullable: true })
    versionId?: number;

    @Field(() => GraphQLISODateTime, { nullable: true })
    lastUpdated?: Date;

    @Field({ nullable: true })
    txid?: string;

    @Field(() => GraphQLISODateTime, { nullable: true })
    deletedAt?: Date;
}

/**
 * Schedule resource GraphQL type
 */
@ObjectType()
export class ScheduleType extends FhirResourceType {
    @Field()
    resourceType: 'Schedule';
}

/**
 * Patient resource GraphQL type
 */
@ObjectType()
export class PatientType extends FhirResourceType {
    @Field()
    resourceType: 'Patient';
}

/**
 * Practitioner resource GraphQL type
 */
@ObjectType()
export class PractitionerType extends FhirResourceType {
    @Field()
    resourceType: 'Practitioner';
}

/**
 * Observation resource GraphQL type  
 */
@ObjectType()
export class ObservationType extends FhirResourceType {
    @Field()
    resourceType: 'Observation';
}

/**
 * Condition resource GraphQL type
 */
@ObjectType()
export class ConditionType extends FhirResourceType {
    @Field()
    resourceType: 'Condition';
}

/**
 * Encounter resource GraphQL type
 */
@ObjectType()
export class EncounterType extends FhirResourceType {
    @Field()
    resourceType: 'Encounter';
}

/**
 * AllergyIntolerance resource GraphQL type
 */
@ObjectType()
export class AllergyIntoleranceType extends FhirResourceType {
    @Field()
    resourceType: 'AllergyIntolerance';
}

/**
 * Procedure resource GraphQL type
 */
@ObjectType()
export class ProcedureType extends FhirResourceType {
    @Field()
    resourceType: 'Procedure';
}

/**
 * MedicationStatement resource GraphQL type
 */
@ObjectType()
export class MedicationStatementType extends FhirResourceType {
    @Field()
    resourceType: 'MedicationStatement';
}

/**
 * MedicationRequest resource GraphQL type
 */
@ObjectType()
export class MedicationRequestType extends FhirResourceType {
    @Field()
    resourceType: 'MedicationRequest';
}

/**
 * DiagnosticReport resource GraphQL type
 */
@ObjectType()
export class DiagnosticReportType extends FhirResourceType {
    @Field()
    resourceType: 'DiagnosticReport';
}

/**
 * FamilyMemberHistory resource GraphQL type
 */
@ObjectType()
export class FamilyMemberHistoryType extends FhirResourceType {
    @Field()
    resourceType: 'FamilyMemberHistory';
}

/**
 * ServiceRequest resource GraphQL type
 */
@ObjectType()
export class ServiceRequestType extends FhirResourceType {
    @Field()
    resourceType: 'ServiceRequest';
}

/**
 * Appointment resource GraphQL type
 */
@ObjectType()
export class AppointmentType extends FhirResourceType {
    @Field()
    resourceType: 'Appointment';
}

/**
 * CarePlan resource GraphQL type
 */
@ObjectType()
export class CarePlanType extends FhirResourceType {
    @Field()
    resourceType: 'CarePlan';
}

/**
 * Composition resource GraphQL type
 */
@ObjectType()
export class CompositionType extends FhirResourceType {
    @Field()
    resourceType: 'Composition';
}

/**
 * Device resource GraphQL type
 */
@ObjectType()
export class DeviceType extends FhirResourceType {
    @Field()
    resourceType: 'Device';
}

/**
 * Location resource GraphQL type
 */
@ObjectType()
export class LocationType extends FhirResourceType {
    @Field()
    resourceType: 'Location';
}

/**
 * Medication resource GraphQL type
 */
@ObjectType()
export class MedicationType extends FhirResourceType {
    @Field()
    resourceType: 'Medication';
}

/**
 * Organization resource GraphQL type
 */
@ObjectType()
export class OrganizationType extends FhirResourceType {
    @Field()
    resourceType: 'Organization';
}

/**
 * Specimen resource GraphQL type
 */
@ObjectType()
export class SpecimenType extends FhirResourceType {
    @Field()
    resourceType: 'Specimen';
}

/**
 * ImagingStudy resource GraphQL type
 */
@ObjectType()
export class ImagingStudyType extends FhirResourceType {
    @Field()
    resourceType: 'ImagingStudy';
}

/**
 * Media resource GraphQL type
 */
@ObjectType()
export class MediaType extends FhirResourceType {
    @Field()
    resourceType: 'Media';
}

/**
 * Immunization resource GraphQL type
 */
@ObjectType()
export class ImmunizationType extends FhirResourceType {
    @Field()
    resourceType: 'Immunization';
}

/**
 * Slot resource GraphQL type
 */
@ObjectType()
export class SlotType extends FhirResourceType {
    @Field()
    resourceType: 'Slot';
}

/**
 * PractitionerRole resource GraphQL type
 */
@ObjectType()
export class PractitionerRoleType extends FhirResourceType {
    @Field()
    resourceType: 'PractitionerRole';
}

/**
 * CareTeam resource GraphQL type
 */
@ObjectType()
export class CareTeamType extends FhirResourceType {
    @Field()
    resourceType: 'CareTeam';
}

/**
 * Claim resource GraphQL type
 */
@ObjectType()
export class ClaimType extends FhirResourceType {
    @Field()
    resourceType: 'Claim';
}

/**
 * Coverage resource GraphQL type
 */
@ObjectType()
export class CoverageType extends FhirResourceType {
    @Field()
    resourceType: 'Coverage';
}

/**
 * Goal resource GraphQL type
 */
@ObjectType()
export class GoalType extends FhirResourceType {
    @Field()
    resourceType: 'Goal';
}

/**
 * DocumentReference resource GraphQL type
 */
@ObjectType()
export class DocumentReferenceType extends FhirResourceType {
    @Field()
    resourceType: 'DocumentReference';
}

/**
 * ExplanationOfBenefit resource GraphQL type
 */
@ObjectType()
export class ExplanationOfBenefitType extends FhirResourceType {
    @Field()
    resourceType: 'ExplanationOfBenefit';
}

/**
 * MedicationAdministration resource GraphQL type
 */
@ObjectType()
export class MedicationAdministrationType extends FhirResourceType {
    @Field()
    resourceType: 'MedicationAdministration';
}

/**
 * Provenance resource GraphQL type
 */
@ObjectType()
export class ProvenanceType extends FhirResourceType {
    @Field()
    resourceType: 'Provenance';
}
