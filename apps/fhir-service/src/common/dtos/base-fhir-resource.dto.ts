import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Base DTO for all FHIR resources containing common fields
 */
export class BaseFhirResourceDto {
    /**
     * Logical id of this resource (optional for POST operations)
     */
    @IsString()
    @IsOptional()
    id?: string;

    /**
     * The type of the resource (e.g., 'Patient', 'Observation')
     */
    @IsString()
    @IsNotEmpty()
    resourceType: string;

    /**
     * Metadata about the resource
     */
    @IsObject()
    @IsOptional()
    meta?: any;
}