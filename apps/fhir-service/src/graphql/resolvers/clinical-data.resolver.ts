import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BundleDto } from '../../common/dtos/budle.dto';
import { TransactionService } from '../../core/transactions/transaction.service';
import { BundleInput } from '../types/bundle-input.type';
import { FhirBundleOutput } from '../types/fhir-bundle-output.type';

@Resolver()

export class ClinicalDataResolver {
    private readonly logger = new Logger(ClinicalDataResolver.name);
    constructor(
        @Inject(TransactionService)
        private readonly transactionService: TransactionService
    ) { }

    @Mutation(() => FhirBundleOutput)
    async saveClinicalData(
        @Args('bundle', { type: () => BundleInput }) bundle: BundleInput
    ): Promise<FhirBundleOutput> {
        this.logger.log('Received saveClinicalData mutation', { bundleType: bundle?.type, entryCount: bundle?.entry?.length });
        try {
            // Map BundleInput to BundleDto (shallow copy, assumes structure is compatible)
            const bundleDto: BundleDto = bundle as any;
            const result = await this.transactionService.processTransactionBundle(bundleDto, true);
            this.logger.log('Transaction bundle processed successfully', { bundleId: result.id });
            return {
                id: result.id,
                resourceType: result.resourceType,
                type: result.type,
                entry: result.entry,
            };
        } catch (error) {
            this.logger.error('Error processing transaction bundle', { error: error?.message, stack: error?.stack });
            throw new GraphQLError(
                error?.message || 'Failed to process clinical data bundle',
                {
                    extensions: {
                        code: error?.code || 'INTERNAL_SERVER_ERROR',
                        details: error?.details || null,
                    },
                    originalError: error,
                }
            );
        }
    }
}
