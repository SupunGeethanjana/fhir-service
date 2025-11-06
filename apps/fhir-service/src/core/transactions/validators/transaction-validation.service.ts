import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BundleDto } from '../../../common/dtos/budle.dto';
import { FhirResourceService } from '../../../fhir-generics/fhir-resource-service.interface';

/**
 * Service responsible for validating FHIR transaction bundles
 */
@Injectable()
export class TransactionValidationService {
    private readonly logger = new Logger(TransactionValidationService.name);

    /**
     * Validates the basic structure and requirements of a FHIR transaction bundle
     */
    validateBundleStructure(bundle: BundleDto, serviceMap: Map<string, FhirResourceService>): void {
        if (!bundle) {
            throw new BadRequestException('Bundle is required');
        }

        if (bundle.resourceType !== 'Bundle') {
            throw new BadRequestException('Resource must be a Bundle');
        }

        if (bundle.type !== 'transaction') {
            throw new BadRequestException('Bundle type must be "transaction"');
        }

        if (!bundle.entry || bundle.entry.length === 0) {
            throw new BadRequestException('Transaction bundle must contain at least one entry');
        }

        // Validate each entry has required fields
        bundle.entry.forEach((entry, index) => {
            this.validateBundleEntry(entry, index, serviceMap);
        });
    }

    /**
     * Validates a single bundle entry
     */
    private validateBundleEntry(entry: any, index: number, serviceMap: Map<string, FhirResourceService>): void {
        if (!entry.resource) {
            throw new BadRequestException(`Entry ${index} is missing resource`);
        }

        if (!entry.request) {
            throw new BadRequestException(`Entry ${index} is missing request`);
        }

        if (!entry.request.method) {
            throw new BadRequestException(`Entry ${index} request is missing method`);
        }

        if (!entry.request.url) {
            throw new BadRequestException(`Entry ${index} request is missing URL`);
        }

        // Validate resource type is supported
        const resourceType = entry.resource.resourceType;
        if (!serviceMap.has(resourceType)) {
            throw new BadRequestException(
                `Entry ${index}: Unsupported resource type "${resourceType}"`
            );
        }

        // Validate HTTP method
        const supportedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!supportedMethods.includes(entry.request.method)) {
            throw new BadRequestException(
                `Entry ${index}: Unsupported HTTP method "${entry.request.method}"`
            );
        }
    }

    /**
     * Extracts the resource ID from a FHIR request URL
     */
    extractResourceIdFromUrl(requestUrl: string, expectedResourceType: string): string | null {
        try {
            // Remove leading slash if present
            const cleanUrl = requestUrl.startsWith('/') ? requestUrl.substring(1) : requestUrl;

            // Expected formats:
            // "Patient/123"
            // "resourceType/id"
            const parts = cleanUrl.split('/');

            if (parts.length >= 2) {
                const resourceType = parts[0];
                const resourceId = parts[1];

                // Validate that the resource type matches
                if (resourceType === expectedResourceType) {
                    return resourceId;
                }

                throw new BadRequestException(
                    `Resource type mismatch: URL contains '${resourceType}' but resource is '${expectedResourceType}'`
                );
            }

            return null;
        } catch (error) {
            this.logger.warn(`Failed to extract resource ID from URL: ${requestUrl}`, { error: error.message });
            return null;
        }
    }

    /**
     * Determines if an error indicates that a resource was not found
     */
    isResourceNotFoundError(error: any): boolean {
        // Check for common "not found" error patterns
        if (error.status === 404 || error.statusCode === 404) {
            return true;
        }

        // Check error message patterns
        const errorMessage = error.message?.toLowerCase() || '';
        const notFoundPatterns = [
            'not found',
            'does not exist',
            'resource not found',
            'entity not found',
            'no entity found'
        ];

        return notFoundPatterns.some(pattern => errorMessage.includes(pattern));
    }
}
