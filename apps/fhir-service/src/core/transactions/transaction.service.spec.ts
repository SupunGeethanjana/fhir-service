import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { BundleLogService } from '../bundles/bundle-log.service';
import { TransactionDuplicateDetectionService } from './detectors/transaction-duplicate-detection.service';
import { TransactionOperationHandlerService } from './handlers/transaction-operation-handler.service';
import { TransactionResourceMergeService } from './mergers/transaction-resource-merge.service';
import { FhirResourceServiceRegistry } from './registries/fhir-resource-service-registry.service';
import { TransactionService } from './transaction.service';
import { TransactionValidationService } from './validators/transaction-validation.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let dataSource: jest.Mocked<DataSource>;
  let bundleLogService: jest.Mocked<BundleLogService>;
  let validationService: jest.Mocked<TransactionValidationService>;
  let duplicateDetectionService: jest.Mocked<TransactionDuplicateDetectionService>;
  let operationHandlerService: jest.Mocked<TransactionOperationHandlerService>;
  let resourceMergeService: jest.Mocked<TransactionResourceMergeService>;
  let serviceRegistry: jest.Mocked<FhirResourceServiceRegistry>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // Create mocks
    mockEntityManager = {
      transaction: jest.fn(),
    } as any;

    dataSource = {
      transaction: jest.fn(),
    } as any;

    bundleLogService = {
      createBundleLog: jest.fn(),
      markBundleSuccess: jest.fn(),
      markBundleFailure: jest.fn(),
    } as any;

    validationService = {
      validateBundleStructure: jest.fn(),
      extractResourceIdFromUrl: jest.fn(),
      isResourceNotFoundError: jest.fn(),
    } as any;

    duplicateDetectionService = {
      checkBundleDuplicate: jest.fn(),
    } as any;

    operationHandlerService = {
      handleCreateOperation: jest.fn(),
      handleUpdateOperation: jest.fn(),
      handlePatchOperation: jest.fn(),
      handleDeleteOperation: jest.fn(),
    } as any;

    resourceMergeService = {
      checkForDuplicates: jest.fn(),
      mergePatientData: jest.fn(),
      getExistingResource: jest.fn(),
      mergePatchData: jest.fn(),
    } as any;

    serviceRegistry = {
      getServiceForResourceType: jest.fn(),
      getServiceMap: jest.fn(),
      isResourceTypeSupported: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: DataSource, useValue: dataSource },
        { provide: BundleLogService, useValue: bundleLogService },
        { provide: TransactionValidationService, useValue: validationService },
        { provide: TransactionDuplicateDetectionService, useValue: duplicateDetectionService },
        { provide: TransactionOperationHandlerService, useValue: operationHandlerService },
        { provide: TransactionResourceMergeService, useValue: resourceMergeService },
        { provide: FhirResourceServiceRegistry, useValue: serviceRegistry },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Bundle validation error handling', () => {
    it('should throw error for validation failures', async () => {
      const invalidBundle = {
        resourceType: 'InvalidType',
        type: 'transaction',
        entry: []
      };

      // Mock bundle log creation
      bundleLogService.createBundleLog.mockResolvedValue({ id: 'log-id' } as any);

      // Mock validation to throw error
      validationService.validateBundleStructure.mockImplementation(() => {
        throw new BadRequestException('Invalid bundle structure');
      });

      await expect(
        service.processTransactionBundle(invalidBundle as any)
      ).rejects.toThrow(BadRequestException);

      // Verify bundle failure was logged
      expect(bundleLogService.markBundleFailure).toHaveBeenCalled();
    });

    it('should handle duplicate detection', async () => {
      const validBundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [{
          resource: { resourceType: 'Patient', id: 'test' },
          request: { method: 'POST', url: 'Patient' }
        }]
      };

      // Mock successful setup
      bundleLogService.createBundleLog.mockResolvedValue({ id: 'log-id' } as any);
      serviceRegistry.getServiceMap.mockReturnValue(new Map());
      validationService.validateBundleStructure.mockImplementation(() => { });

      // Mock duplicate detection to return duplicate
      duplicateDetectionService.checkBundleDuplicate.mockResolvedValue({
        isDuplicate: true,
        duplicateType: 'CONTENT_HASH' as any,
        detectionMethod: 'CONTENT_HASH' as any
      });

      // Mock successful transaction processing
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockEntityManager);
      });

      operationHandlerService.handleCreateOperation.mockResolvedValue({
        response: { status: '201 Created', location: 'Patient/123' }
      });

      serviceRegistry.getServiceForResourceType.mockReturnValue({} as any);

      const result = await service.processTransactionBundle(validBundle as any);

      expect(result).toBeDefined();
      expect(duplicateDetectionService.checkBundleDuplicate).toHaveBeenCalled();
    });
  });

  describe('Transaction processing', () => {
    const validBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [{
        resource: {
          resourceType: 'Patient',
          id: 'test-patient'
        },
        request: {
          method: 'POST',
          url: 'Patient'
        },
        fullUrl: 'urn:uuid:test-patient'
      }]
    };

    it('should handle database errors gracefully', async () => {
      // Mock bundle log creation
      bundleLogService.createBundleLog.mockResolvedValue({ id: 'log-id' } as any);
      serviceRegistry.getServiceMap.mockReturnValue(new Map());
      validationService.validateBundleStructure.mockImplementation(() => { });
      duplicateDetectionService.checkBundleDuplicate.mockResolvedValue({ isDuplicate: false });

      // Mock transaction to throw database error
      const dbError = new Error('Connection timeout');
      dataSource.transaction.mockRejectedValue(dbError);

      await expect(
        service.processTransactionBundle(validBundle as any)
      ).rejects.toThrow(Error);

      // Verify bundle log failure was recorded
      expect(bundleLogService.markBundleFailure).toHaveBeenCalled();
    });

    it('should process valid transaction bundle successfully', async () => {
      // Mock successful bundle log creation
      bundleLogService.createBundleLog.mockResolvedValue({ id: 'log-id' } as any);
      bundleLogService.markBundleSuccess.mockResolvedValue(undefined);

      // Mock validation and duplicate detection
      serviceRegistry.getServiceMap.mockReturnValue(new Map());
      validationService.validateBundleStructure.mockImplementation(() => { });
      duplicateDetectionService.checkBundleDuplicate.mockResolvedValue({ isDuplicate: false });

      // Mock service registry
      const mockService = { create: jest.fn() };
      serviceRegistry.getServiceForResourceType.mockReturnValue(mockService as any);

      // Mock successful transaction
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockEntityManager);
      });

      // Mock successful operation handling
      operationHandlerService.handleCreateOperation.mockResolvedValue({
        response: {
          status: '201 Created',
          location: 'Patient/new-patient-id/_history/1'
        }
      });

      const result = await service.processTransactionBundle(validBundle as any);

      expect(result).toBeDefined();
      expect(result.resourceType).toBe('Bundle');
      expect(result.type).toBe('transaction-response');
      expect(result.entry).toHaveLength(1);
      expect(result.entry[0].response.status).toBe('201 Created');

      // Verify success was logged
      expect(bundleLogService.markBundleSuccess).toHaveBeenCalled();
    });

    it('should handle different HTTP methods', async () => {
      const bundleWithDifferentMethods = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: { resourceType: 'Patient', id: 'test1' },
            request: { method: 'POST', url: 'Patient' },
            fullUrl: 'urn:uuid:test1'
          },
          {
            resource: { resourceType: 'Patient', id: 'test2' },
            request: { method: 'PUT', url: 'Patient/test2' },
            fullUrl: 'urn:uuid:test2'
          },
          {
            resource: { resourceType: 'Patient', id: 'test3' },
            request: { method: 'PATCH', url: 'Patient/test3' },
            fullUrl: 'urn:uuid:test3'
          },
          {
            request: { method: 'DELETE', url: 'Patient/test4' }
          }
        ]
      };

      // Setup mocks
      bundleLogService.createBundleLog.mockResolvedValue({ id: 'log-id' } as any);
      serviceRegistry.getServiceMap.mockReturnValue(new Map());
      validationService.validateBundleStructure.mockImplementation(() => { });
      duplicateDetectionService.checkBundleDuplicate.mockResolvedValue({ isDuplicate: false });
      serviceRegistry.getServiceForResourceType.mockReturnValue({} as any);

      // Mock all operation handlers
      operationHandlerService.handleCreateOperation.mockResolvedValue({
        response: { status: '201 Created' }
      });
      operationHandlerService.handleUpdateOperation.mockResolvedValue({
        response: { status: '200 OK' }
      });
      operationHandlerService.handlePatchOperation.mockResolvedValue({
        response: { status: '200 OK' }
      });
      operationHandlerService.handleDeleteOperation.mockResolvedValue({
        response: { status: '204 No Content' }
      });

      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockEntityManager);
      });

      const result = await service.processTransactionBundle(bundleWithDifferentMethods as any);

      expect(result.entry).toHaveLength(4);
      expect(operationHandlerService.handleCreateOperation).toHaveBeenCalled();
      expect(operationHandlerService.handleUpdateOperation).toHaveBeenCalled();
      expect(operationHandlerService.handlePatchOperation).toHaveBeenCalled();
      expect(operationHandlerService.handleDeleteOperation).toHaveBeenCalled();
    });
  });
});
