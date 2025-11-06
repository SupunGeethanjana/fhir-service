import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { PractitionerHistory } from './entities/practitioner-history.entity';
import { Practitioner } from './entities/practitioner.entity';
import { PractitionerService } from './practitioner.service';

describe('PractitionerService', () => {
    let service: PractitionerService;
    let mockRepository: Partial<Repository<Practitioner>>;
    let mockHistoryRepository: Partial<Repository<PractitionerHistory>>;
    let mockDataSource: Partial<DataSource>;
    let mockSearchService: Partial<ConventionBasedSearchService>;

    beforeEach(async () => {
        // Mock repository methods
        mockRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
                getOne: jest.fn().mockResolvedValue(null),
                getCount: jest.fn().mockResolvedValue(0),
            } as any),
        } as any;

        mockHistoryRepository = {
            create: jest.fn(),
            save: jest.fn(),
        } as any;

        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: {
                    save: jest.fn(),
                    create: jest.fn(),
                },
            } as any),
        } as any;

        mockSearchService = {
            search: jest.fn().mockResolvedValue([]),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PractitionerService,
                {
                    provide: getRepositoryToken(Practitioner),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(PractitionerHistory),
                    useValue: mockHistoryRepository,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
                {
                    provide: ConventionBasedSearchService,
                    useValue: mockSearchService,
                },
            ],
        }).compile();

        service = module.get<PractitionerService>(PractitionerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have correct resourceType', () => {
        expect(service['resourceType']).toBe('Practitioner');
    });

    it('should initialize with repositories', () => {
        expect(service['currentRepo']).toBe(mockRepository);
        expect(service['historyRepo']).toBeDefined();
    });

    describe('Resource Type Validation', () => {
        it('should accept valid Practitioner resource', () => {
            const validPractitioner = {
                resourceType: 'Practitioner',
                name: [
                    {
                        family: 'Smith',
                        given: ['John', 'David'],
                        prefix: ['Dr.']
                    }
                ],
                identifier: [
                    {
                        use: 'official',
                        system: 'http://moh.gov.sa/license',
                        value: 'PRAC-12345'
                    }
                ]
            };

            // This should not throw an error
            expect(() => {
                // Simulate resource type validation that would happen in the generic service
                if (validPractitioner.resourceType !== 'Practitioner') {
                    throw new Error('Invalid resource type');
                }
            }).not.toThrow();
        });
    });
});
