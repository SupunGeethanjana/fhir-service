import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DeviceType, LocationType, MedicationType, ObservationType, OrganizationType, PatientType, PractitionerType, SpecimenType } from '../types/fhir-resource.type';

/**
 * Generic FHIR search result type
 */
@ObjectType({ isAbstract: true })
export class FhirSearchResult<T> {
    @Field(() => [Object])
    resources: T[];

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
export class PatientSearchResult extends FhirSearchResult<PatientType> {
    @Field(() => [PatientType])
    resources: PatientType[];
    @Field({ nullable: true })
    searchId?: string;
}

@ObjectType()
export class PractitionerSearchResult extends FhirSearchResult<PractitionerType> {
    @Field(() => [PractitionerType])
    resources: PractitionerType[];
}

@ObjectType()
export class ObservationSearchResult extends FhirSearchResult<ObservationType> {
    @Field(() => [ObservationType])
    resources: ObservationType[];
}

@ObjectType()
export class DeviceSearchResult extends FhirSearchResult<DeviceType> {
    @Field(() => [DeviceType])
    resources: DeviceType[];
}

@ObjectType()
export class LocationSearchResult extends FhirSearchResult<LocationType> {
    @Field(() => [LocationType])
    resources: LocationType[];
}

@ObjectType()
export class MedicationSearchResult extends FhirSearchResult<MedicationType> {
    @Field(() => [MedicationType])
    resources: MedicationType[];
}

@ObjectType()
export class OrganizationSearchResult extends FhirSearchResult<OrganizationType> {
    @Field(() => [OrganizationType])
    resources: OrganizationType[];
}

@ObjectType()
export class SpecimenSearchResult extends FhirSearchResult<SpecimenType> {
    @Field(() => [SpecimenType])
    resources: SpecimenType[];
}
