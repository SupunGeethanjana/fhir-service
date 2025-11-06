import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse, ApiSuccessResponse, ErrorListItem } from '../../common/dtos/api-response.dto';
import { BundleDto } from '../../common/dtos/budle.dto';
import { ResponseBuilder } from '../../common/dtos/response-builder';
import { ContentType, FhirResourceType, HttpMethod } from '../../common/enums/fhir-enums';
import { FhirTransactionException } from '../transactions/errors/transaction-error-handler';
import { TransactionService } from '../transactions/transaction.service';

/**
 * Controller for handling FHIR Bundle operations, specifically transaction bundles.
 * 
 * This controller provides endpoints for processing FHIR transaction bundles,
 * which allow atomic operations across multiple resources.
 * 
 * @class BundleController
 */
@Controller('Bundle')
@ApiTags('Bundle')
@ApiConsumes(ContentType.APPLICATION_FHIR_JSON, ContentType.APPLICATION_JSON)
@ApiProduces(ContentType.APPLICATION_FHIR_JSON, ContentType.APPLICATION_JSON)
export class BundleController {
    private readonly logger = new Logger(BundleController.name);

    constructor(private readonly transactionService: TransactionService) {
        this.logger.log('Bundle controller initialized');
    }

    /**
     * Process a FHIR transaction bundle.
     * 
     * This endpoint accepts a FHIR Bundle resource of type "transaction" and processes
     * all entries atomically. Either all operations succeed or all fail.
     * 
     * @param bundle - The FHIR transaction bundle to process, including optional metadata
     * @returns Promise<any> - FHIR Bundle of type "transaction-response"
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Process FHIR transaction bundle',
        description: 'Processes a FHIR transaction bundle atomically. All operations succeed or all fail together. Include submittedBy and sourceSystem in the bundle payload for audit tracking.',
        operationId: 'processTransactionBundle'
    })
    @ApiBody({
        description: 'FHIR Bundle resource of type "transaction" with optional audit metadata',
        type: BundleDto,
        examples: {
            'transaction-bundle': {
                summary: 'Example transaction bundle with audit metadata',
                description: 'A transaction bundle containing multiple FHIR resources and audit information',
                value: {
                    resourceType: FhirResourceType.BUNDLE,
                    type: 'transaction',
                    submittedBy: 'user123',
                    sourceSystem: 'EMR-SYSTEM-A',
                    entry: [
                        {
                            request: {
                                method: HttpMethod.POST,
                                url: FhirResourceType.PATIENT
                            },
                            resource: {
                                resourceType: FhirResourceType.PATIENT,
                                name: [
                                    {
                                        family: 'Doe',
                                        given: ['John']
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Transaction bundle processed successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid bundle format or unsupported operation',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error during transaction processing',
        type: ApiErrorResponse
    })
    async processTransactionBundle(
        @Body() bundle: BundleDto,
    ): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        this.logger.log(`Processing transaction bundle with ${bundle.entry?.length || 0} entries`, {
            submittedBy: bundle.submittedBy,
            sourceSystem: bundle.sourceSystem,
            entryCount: bundle.entry?.length || 0
        });

        try {
            const result = await this.transactionService.processTransactionBundle(bundle);
            this.logger.log('Transaction bundle processed successfully', {
                submittedBy: bundle.submittedBy,
                sourceSystem: bundle.sourceSystem,
                resultType: result.resourceType
            });

            return ResponseBuilder.success(
                result,
                'Transaction bundle processed successfully'
            );
        } catch (error) {
            this.logger.error('Failed to process transaction bundle', {
                submittedBy: bundle.submittedBy,
                sourceSystem: bundle.sourceSystem,
                entryCount: bundle.entry?.length || 0,
                error: error.message,
                stack: error.stack
            });

            // Handle categorized FHIR transaction exceptions
            if (error instanceof FhirTransactionException) {
                return ResponseBuilder.error(
                    error.details,
                    error.statusCode,
                    [new ErrorListItem(error.errorType, error.details)],
                    error.errorType
                );
            }

            // Handle uncategorized errors
            return ResponseBuilder.error(
                'Failed to process transaction bundle',
                500,
                [new ErrorListItem('TRANSACTION_ERROR', error.message)],
                'TRANSACTION_ERROR'
            );
        }
    }
}
