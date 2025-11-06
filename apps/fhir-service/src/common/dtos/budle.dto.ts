import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsIn,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { BaseFhirResourceDto } from './base-fhir-resource.dto';

/**
 * A DTO representing the `request` object within a Bundle entry.
 * It validates the essential fields for a transaction request.
 */
@InputType()
class BundleEntryRequestDto {
    /**
     * The HTTP method for this entry's operation (e.g., 'POST', 'PUT', 'DELETE').
     */
    @Field()
    @IsString()
    @IsNotEmpty()
    method: string;

    /**
     * The URL for the operation, which is the resource type (e.g., 'Patient', 'Observation').
     */
    @Field()
    @IsString()
    @IsNotEmpty()
    url: string;
}

/**
 * A DTO for validating a single entry within a FHIR Bundle.
 * Each entry represents one atomic operation (e.g., create a Patient).
 */
@InputType()
class BundleEntryDto {
    /**
     * A temporary, bundle-internal URL (like a UUID) used to link resources
     * together before they have a permanent server-assigned ID.
     */
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    fullUrl?: string;

    /**
     * The FHIR resource to be created or updated in this entry.
     * @ValidateNested tells class-validator to also validate this nested object
     * using the rules defined in the BaseFhirResourceDto.
     * @Type is a hint for class-transformer to know which class to instantiate.
     */
    @Field(() => BaseFhirResourceDto)
    @IsObject()
    @ValidateNested()
    @Type(() => BaseFhirResourceDto)
    resource: BaseFhirResourceDto;

    /**
     * The operation to be performed on the resource.
     */
    @Field(() => BundleEntryRequestDto)
    @IsObject()
    @ValidateNested()
    @Type(() => BundleEntryRequestDto)
    request: BundleEntryRequestDto;
}

/**
 * The main DTO for validating an incoming FHIR Bundle resource,
 * specifically configured to accept only bundles of type 'transaction'.
 */
@InputType()
export class BundleDto extends BaseFhirResourceDto {
    /**
     * The type of the Bundle. For our transaction endpoint, we strictly
     * enforce that this must be 'transaction'.
     * @IsIn(['transaction']) is a powerful validator that rejects any request
     * where the 'type' field is not exactly "transaction".
     */
    @Field()
    @IsIn(['transaction'])
    type: 'transaction';

    /**
     * The array of operations to be performed as part of the transaction.
     * @IsArray ensures the 'entry' property is an array.
     * @ValidateNested({ each: true }) tells class-validator to apply the validation
     * rules from BundleEntryDto to *each element* of the array. This is crucial
     * for ensuring the integrity of the entire bundle.
     */
    @Field(() => [BundleEntryDto])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BundleEntryDto)
    entry: BundleEntryDto[];

    /**
     * Optional identifier of the user or system submitting the bundle.
     * Used for audit logging and tracking who initiated the transaction.
     */
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    submittedBy?: string;

    /**
     * Optional identifier of the originating system.
     * Used for audit logging and tracking the source system of the transaction.
     */
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    sourceSystem?: string;
}