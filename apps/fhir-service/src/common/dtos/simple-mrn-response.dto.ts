/**
 * Simple response DTO for unpaginated MRN listing
 */
export interface SimpleMrnResponseDto {
    /**
     * Total number of MRNs returned
     */
    count: number;

    /**
     * Array of simple MRN items
     */
    mrns: SimpleMrnItemDto[];
}

/**
 * Simplified MRN item for dropdown usage
 */
export interface SimpleMrnItemDto {
    /**
     * The MRN value
     */
    value: string;

    /**
     * Display label for dropdown (MRN + Patient Name if available)
     */
    label: string;

    /**
     * The FHIR Patient ID (for reference)
     */
    patientId: string;

    /**
     * Whether the patient is active
     */
    active?: boolean;

    /**
     * The identifier system this MRN belongs to
     */
    system?: string;
}
