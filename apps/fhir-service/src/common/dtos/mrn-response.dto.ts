import { ApiProperty } from '@nestjs/swagger';

/**
 * Individual MRN item in the response
 */
export class MrnItemDto {
    /**
     * The MRN value
     */
    @ApiProperty({
        description: 'The Medical Record Number',
        example: 'MRN123456',
        type: String
    })
    mrn: string;

    /**
     * The identifier system (if available)
     */
    @ApiProperty({
        description: 'The identifier system URI',
        example: 'http://hospital.org/mrn',
        required: false,
        type: String
    })
    system?: string;

    /**
     * The FHIR Patient ID
     */
    @ApiProperty({
        description: 'The FHIR Patient resource ID',
        example: 'patient-uuid-123',
        type: String
    })
    patientId: string;

    /**
     * Patient's display name (first + last name)
     */
    @ApiProperty({
        description: 'Patient display name (first and last name)',
        example: 'John Doe',
        required: false,
        type: String
    })
    displayName?: string;

    /**
     * Whether the patient is active
     */
    @ApiProperty({
        description: 'Whether the patient record is active',
        example: true,
        required: false,
        type: Boolean
    })
    active?: boolean;

    /**
     * When the patient record was last updated
     */
    @ApiProperty({
        description: 'When the patient record was last updated',
        example: '2025-07-22T10:30:00Z',
        type: Date
    })
    lastUpdated: Date;
}

/**
 * Response DTO for MRN listing
 */
export class MrnResponseDto {
    /**
     * Total number of MRNs available (before pagination)
     */
    @ApiProperty({
        description: 'Total number of MRNs available (before pagination)',
        example: 1250,
        type: Number
    })
    total: number;

    /**
     * Number of MRNs returned in this response
     */
    @ApiProperty({
        description: 'Number of MRNs returned in this response',
        example: 100,
        type: Number
    })
    count: number;

    /**
     * Offset used for pagination
     */
    @ApiProperty({
        description: 'Offset used for pagination',
        example: 0,
        type: Number
    })
    offset: number;

    /**
     * Array of MRN data
     */
    @ApiProperty({
        description: 'Array of MRN data',
        type: [MrnItemDto]
    })
    mrns: MrnItemDto[];
}
