import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { PatientDataService } from '../services/patient-data.service';
import { PatientDataType } from '../types/patient-data.type';

/**
 * GraphQL resolver for patient data queries
 */
@Resolver(() => PatientDataType)
export class PatientDataResolver {
    private readonly logger = new Logger(PatientDataResolver.name);

    constructor(
        private readonly patientDataService: PatientDataService
    ) { }

    /**
     * Query to retrieve comprehensive patient data by MRN
     * GraphQL handles lazy loading automatically - only requested fields are returned
     * 
     * Example query:
     * ```graphql
     * query GetPatientByMrn($mrn: String!, $system: String) {
     *   patientByMrn(mrn: $mrn, system: $system) {
     *     patient {
     *       id
     *       resourceType
     *       resource
     *       lastUpdated
     *     }
     *     encounters {
     *       id
     *       resource
     *       lastUpdated
     *     }
     *     allergies {
     *       id
     *       resource
     *       lastUpdated
     *     }
     *     immunizations {
     *       id
     *       resource
     *       lastUpdated
     *     }
     *     slots {
     *       id
     *       resource
     *       lastUpdated
     *     }
     *   }
     * }
     * ```
     */
    @Query(() => PatientDataType, {
        name: 'patientByMrn',
        description: 'Retrieve comprehensive patient data by Medical Record Number (MRN). GraphQL handles lazy loading automatically.',
        nullable: true
    })
    async getPatientByMrn(
        @Args('mrn', {
            type: () => String,
            description: 'Medical Record Number (MRN) of the patient'
        }) mrn: string,
        @Args('system', {
            type: () => String,
            nullable: true,
            description: 'Optional system identifier for the MRN (e.g., http://myhospital.org/mrn)'
        }) system?: string
    ): Promise<PatientDataType | null> {

        // Validate input
        if (!mrn || mrn.trim() === '') {
            this.logger.error('MRN is required and cannot be empty');
            throw new Error('MRN is required and cannot be empty');
        }

        this.logger.log(`GraphQL query for patient by MRN: ${mrn}`, { mrn, system });

        try {
            const patientData = await this.patientDataService.getPatientDataByMrn(mrn, system);

            // If no patient found, return null
            if (!patientData || !patientData.patient) {
                this.logger.warn(`No patient found for MRN: ${mrn}`, { mrn, system });
                return null;
            }

            this.logger.log(`Successfully retrieved patient data for MRN: ${mrn}`, {
                mrn,
                system,
                patientId: patientData.patient?.id,
                resourceCounts: {
                    practitioners: patientData.practitioners?.length || 0,
                    encounters: patientData.encounters?.length || 0,
                    allergies: patientData.allergies?.length || 0,
                    conditions: patientData.conditions?.length || 0,
                    procedures: patientData.procedures?.length || 0,
                    medications: patientData.medications?.length || 0,
                    medicationRequests: patientData.medicationRequests?.length || 0,
                    observations: patientData.observations?.length || 0,
                    familyHistory: patientData.familyHistory?.length || 0,
                    diagnosticReports: patientData.diagnosticReports?.length || 0,
                    serviceRequests: patientData.serviceRequests?.length || 0,
                    appointments: patientData.appointments?.length || 0,
                    compositions: patientData.compositions?.length || 0,
                    devices: patientData.devices?.length || 0,
                    immunizations: patientData.immunizations?.length || 0,
                    locations: patientData.locations?.length || 0,
                    medicationResources: patientData.medicationResources?.length || 0,
                    organizations: patientData.organizations?.length || 0,
                    slots: patientData.slots?.length || 0,
                    specimens: patientData.specimens?.length || 0
                }
            });

            return patientData;

        } catch (error) {
            this.logger.error(`Failed to retrieve patient data for MRN: ${mrn}`, {
                mrn,
                system,
                error: error.message,
                stack: error.stack
            });

            // For validation errors, throw them directly
            if (error.message.includes('required') || error.message.includes('empty')) {
                throw error;
            }

            // For other errors, return null instead of throwing for GraphQL
            this.logger.warn(`Returning null due to error for MRN: ${mrn}`);
            return null;
        }
    }
}
