
import { Field, InputType, Int } from '@nestjs/graphql';
import { SearchPrefix, SortOrder } from '../resolvers/fhir-search.resolver';

/**
 * Date range input for temporal queries
 */
@InputType()
export class DateRangeInput {
    /** Start date (inclusive) */
    @Field({ nullable: true })
    start?: string;

    /** End date (inclusive) */
    @Field({ nullable: true })
    end?: string;

    /** Prefix for start date comparison */
    @Field(() => SearchPrefix, { nullable: true, defaultValue: SearchPrefix.GE })
    startPrefix?: SearchPrefix;

    /** Prefix for end date comparison */
    @Field(() => SearchPrefix, { nullable: true, defaultValue: SearchPrefix.LE })
    endPrefix?: SearchPrefix;
}

/**
 * Enhanced FHIR search input with comprehensive parameters
 */
@InputType()
export class FhirSearchInput {
    /** Family name */
    @Field({ nullable: true })
    family?: string;
    /** Given name */
    @Field({ nullable: true })
    given?: string;
    /** Combined name search */
    @Field({ nullable: true })
    name?: string;
    /** Identifier value */
    @Field({ nullable: true })
    identifier?: string;
    /** Identifier system */
    @Field({ nullable: true })
    identifierSystem?: string;
    /** Birthdate (YYYY-MM-DD) */
    @Field({ nullable: true })
    birthdate?: string;
    /** Birthdate range */
    @Field(() => DateRangeInput, { nullable: true })
    birthdateRange?: DateRangeInput;
    /** Gender */
    @Field({ nullable: true })
    gender?: string;
    /** Deceased flag */
    @Field({ nullable: true })
    deceased?: boolean;
    /** Phone number */
    @Field({ nullable: true })
    phone?: string;
    /** Email address */
    @Field({ nullable: true })
    email?: string;
    /** Address */
    @Field({ nullable: true })
    address?: string;
    /** City */
    @Field({ nullable: true })
    addressCity?: string;
    /** State */
    @Field({ nullable: true })
    addressState?: string;
    /** Postal code */
    @Field({ nullable: true })
    addressPostalCode?: string;
    /** Country */
    @Field({ nullable: true })
    addressCountry?: string;
    /** General practitioner reference */
    @Field({ nullable: true })
    generalPractitioner?: string;
    /** Organization reference */
    @Field({ nullable: true })
    organization?: string;
    /** Preferred language */
    @Field({ nullable: true })
    language?: string;
    /** Last updated date range */
    @Field(() => DateRangeInput, { nullable: true })
    lastUpdated?: DateRangeInput;
    /** Full-text search */
    @Field({ nullable: true })
    text?: string;
    /** Exact match modifier */
    @Field({ nullable: true })
    exact?: boolean;
    /** Contains modifier */
    @Field({ nullable: true })
    contains?: boolean;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
    /** Include related encounters */
    @Field({ nullable: true })
    includeEncounters?: boolean;
    /** Include related conditions */
    @Field({ nullable: true })
    includeConditions?: boolean;
    /** Include related observations */
    @Field({ nullable: true })
    includeObservations?: boolean;
    /** Include related practitioners */
    @Field({ nullable: true })
    includePractitioners?: boolean;
}

/**
 * Practitioner search input
 */
@InputType()
export class PractitionerSearchInput {
    /** Practitioner identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Practitioner name (full or partial) */
    @Field({ nullable: true })
    name?: string;
    /** Family name */
    @Field({ nullable: true })
    family?: string;
    /** Given name */
    @Field({ nullable: true })
    given?: string;
    /** Gender */
    @Field({ nullable: true })
    gender?: string;
    /** Active status */
    @Field({ nullable: true })
    active?: boolean;
    /** Telecom (phone/email) */
    @Field({ nullable: true })
    telecom?: string;
    /** Address */
    @Field({ nullable: true })
    address?: string;
    /** City */
    @Field({ nullable: true })
    addressCity?: string;
    /** State */
    @Field({ nullable: true })
    addressState?: string;
    /** Postal code */
    @Field({ nullable: true })
    addressPostalCode?: string;
    /** Country */
    @Field({ nullable: true })
    addressCountry?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
    /** Specialty code or text */
    @Field({ nullable: true })
    specialty?: string;
    /** Qualification code or text */
    @Field({ nullable: true })
    qualification?: string;
    /** Phone number */
    @Field({ nullable: true })
    phone?: string;
    /** Email address */
    @Field({ nullable: true })
    email?: string;
}

/**
 * Observation search input
 */
@InputType()
export class ObservationSearchInput {
    /** LOINC or SNOMED code */
    @Field({ nullable: true })
    code?: string;
    /** Patient reference */
    @Field({ nullable: true })
    patient?: string;
    /** Encounter reference */
    @Field({ nullable: true })
    encounter?: string;
    /** Performer reference */
    @Field({ nullable: true })
    performer?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Category */
    @Field({ nullable: true })
    category?: string;
    /** Issued date */
    @Field({ nullable: true })
    issued?: string;
    /** Effective date/time */
    @Field({ nullable: true })
    effective?: string;
    /** Value */
    @Field({ nullable: true })
    value?: string;
    /** Interpretation */
    @Field({ nullable: true })
    interpretation?: string;
    /** Note */
    @Field({ nullable: true })
    note?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
    subject: any;
    valueString: any;
    valueQuantity: any;
    valueCode: any;
    date: any;
}

/**
 * Device search input
 */
@InputType()
export class DeviceSearchInput {
    /** Device identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Device type */
    @Field({ nullable: true })
    type?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Patient reference */
    @Field({ nullable: true })
    patient?: string;
    /** Organization reference */
    @Field({ nullable: true })
    organization?: string;
    /** Location reference */
    @Field({ nullable: true })
    location?: string;
    /** Manufacturer name or reference */
    @Field({ nullable: true })
    manufacturer?: string;
    /** Model name or reference */
    @Field({ nullable: true })
    model?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Location search input
 */
@InputType()
export class LocationSearchInput {
    /** Location identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Location name */
    @Field({ nullable: true })
    name?: string;
    /** Location type */
    @Field({ nullable: true })
    type?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Address */
    @Field({ nullable: true })
    address?: string;
    /** City */
    @Field({ nullable: true })
    addressCity?: string;
    /** State */
    @Field({ nullable: true })
    addressState?: string;
    /** Postal code */
    @Field({ nullable: true })
    addressPostalCode?: string;
    /** Country */
    @Field({ nullable: true })
    addressCountry?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Specimen search input
 */
@InputType()
export class SpecimenSearchInput {
    /** Patient reference */
    @Field({ nullable: true })
    patient?: string;
    /** Subject reference */
    @Field({ nullable: true })
    subject?: string;
    /** Specimen identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Specimen type */
    @Field({ nullable: true })
    type?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Collector reference */
    @Field({ nullable: true })
    collector?: string;
    /** Collection date range */
    @Field(() => DateRangeInput, { nullable: true })
    collectionDate?: DateRangeInput;
    /** Received time */
    @Field({ nullable: true })
    receivedTime?: string;
    /** Collection details */
    @Field({ nullable: true })
    collection?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Encounter search input
 */
@InputType()
export class EncounterSearchInput {
    /** Encounter identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Class */
    @Field({ nullable: true })
    class?: string;
    /** Encounter type */
    @Field({ nullable: true })
    type?: string;
    /** Patient reference */
    @Field({ nullable: true })
    patient?: string;
    /** Period */
    @Field({ nullable: true })
    period?: string;
    /** Reason code */
    @Field({ nullable: true })
    reasonCode?: string;
    /** Service provider reference */
    @Field({ nullable: true })
    serviceProvider?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}


/**
 * Composition search input
 *
 * Supports FHIR search parameters for Composition resource.
 * Includes patient, date, type, status, author, encounter, class, and more.
 */
@InputType()
export class CompositionSearchInput {
    /** Composition identifier */
    @Field({ nullable: true })
    identifier?: string;

    /** Patient reference (subject) */
    @Field({ nullable: true })
    patient?: string;

    /** Encounter reference */
    @Field({ nullable: true })
    encounter?: string;

    /** Date composition was created (YYYY-MM-DD or range) */
    @Field({ nullable: true })
    date?: string;

    /** Date range for composition */
    @Field(() => DateRangeInput, { nullable: true })
    dateRange?: DateRangeInput;

    /** Type (LOINC/SNOMED/other) */
    @Field({ nullable: true })
    type?: string;

    /** Class */
    @Field({ nullable: true })
    class?: string;

    /** Status (preliminary, final, amended, entered-in-error) */
    @Field({ nullable: true })
    status?: string;

    /** Author reference */
    @Field({ nullable: true })
    author?: string;

    /** Title */
    @Field({ nullable: true })
    title?: string;

    /** Section code */
    @Field({ nullable: true })
    section?: string;

    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;

    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;

    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Medication search input
 */
@InputType()
export class MedicationSearchInput {
    /** Medication identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Medication code */
    @Field({ nullable: true })
    code?: string;
    /** Form */
    @Field({ nullable: true })
    form?: string;
    /** Ingredient */
    @Field({ nullable: true })
    ingredient?: string;
    /** Manufacturer reference */
    @Field({ nullable: true })
    manufacturer?: string;
    /** Status */
    @Field({ nullable: true })
    status?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Organization search input
 */
@InputType()
export class OrganizationSearchInput {
    /** Organization name */
    @Field({ nullable: true })
    name?: string;
    /** Organization identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Organization type */
    @Field({ nullable: true })
    type?: string;
    /** Active status */
    @Field({ nullable: true })
    active?: boolean;
    /** Address */
    @Field({ nullable: true })
    address?: string;
    /** City */
    @Field({ nullable: true })
    addressCity?: string;
    /** State */
    @Field({ nullable: true })
    addressState?: string;
    /** Postal code */
    @Field({ nullable: true })
    addressPostalCode?: string;
    /** Country */
    @Field({ nullable: true })
    addressCountry?: string;
    /** Phone number */
    @Field({ nullable: true })
    phone?: string;
    /** Email address */
    @Field({ nullable: true })
    email?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}


/**
 * Immunization search input
 *
 * Supports FHIR search parameters for Immunization resource.
 * Includes patient, date, vaccine-code, status, lot-number, performer, location, and more.
 */
@InputType()
export class ImmunizationSearchInput {
    /** Immunization identifier */
    @Field({ nullable: true })
    identifier?: string;

    /** Patient reference (subject) */
    @Field({ nullable: true })
    patient?: string;

    /** Encounter reference */
    @Field({ nullable: true })
    encounter?: string;

    /** Date immunization was administered (YYYY-MM-DD or range) */
    @Field({ nullable: true })
    date?: string;

    /** Date range for immunization */
    @Field(() => DateRangeInput, { nullable: true })
    dateRange?: DateRangeInput;

    /** Vaccine code (CVX/SNOMED/other) */
    @Field({ nullable: true })
    vaccineCode?: string;

    /** Status (completed, entered-in-error, not-done) */
    @Field({ nullable: true })
    status?: string;

    /** Status reason */
    @Field({ nullable: true })
    statusReason?: string;

    /** Lot number */
    @Field({ nullable: true })
    lotNumber?: string;

    /** Performer reference */
    @Field({ nullable: true })
    performer?: string;

    /** Location reference */
    @Field({ nullable: true })
    location?: string;

    /** Manufacturer reference */
    @Field({ nullable: true })
    manufacturer?: string;

    /** Reaction code */
    @Field({ nullable: true })
    reaction?: string;

    /** Reaction date */
    @Field({ nullable: true })
    reactionDate?: string;

    /** Reason code */
    @Field({ nullable: true })
    reasonCode?: string;

    /** Reason reference */
    @Field({ nullable: true })
    reasonReference?: string;

    /** Series name */
    @Field({ nullable: true })
    series?: string;

    /** Target disease */
    @Field({ nullable: true })
    targetDisease?: string;

    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;

    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;

    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}

/**
 * Slot search input
 */
@InputType()
export class SlotSearchInput {
    /** Slot identifier */
    @Field({ nullable: true })
    identifier?: string;
    /** Schedule reference */
    @Field({ nullable: true })
    schedule?: string;
    /** Status (busy, free, etc.) */
    @Field({ nullable: true })
    status?: string;
    /** Start date/time (YYYY-MM-DDThh:mm:ss) */
    @Field({ nullable: true })
    start?: string;
    /** End date/time (YYYY-MM-DDThh:mm:ss) */
    @Field({ nullable: true })
    end?: string;
    /** Service type */
    @Field({ nullable: true })
    serviceType?: string;
    /** Specialty */
    @Field({ nullable: true })
    specialty?: string;
    /** Appointment type */
    @Field({ nullable: true })
    appointmentType?: string;
    /** Actor (Practitioner, Location, etc.) */
    @Field({ nullable: true })
    actor?: string;
    /** Pagination: limit */
    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;
    /** Pagination: offset */
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
    /** Sort by field */
    @Field({ nullable: true })
    sortBy?: string;
    /** Sort order */
    @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
    sortOrder?: SortOrder;
}