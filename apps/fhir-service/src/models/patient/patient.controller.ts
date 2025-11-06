import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse, ApiSuccessResponse, PaginatedResponse } from '../../common/dtos/api-response.dto';
import { MrnQueryDto } from '../../common/dtos/mrn-query.dto';
import { MrnItemDto } from '../../common/dtos/mrn-response.dto';
import { ResponseBuilder } from '../../common/dtos/response-builder';
import { SimpleMrnResponseDto } from '../../common/dtos/simple-mrn-response.dto';
import { HttpStatusCode } from '../../common/enums/fhir-enums';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { PatientHistory } from './entities/patient-history.entity';
import { Patient } from './entities/patient.entity';
import { PatientService } from './patient.service';

/**
 * Patient Resource Controller
 * 
 * Provides FHIR-compliant Patient resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 * - Custom MRN listing endpoints for dropdown population
 * 
 * All endpoints follow FHIR R4 specification for Patient resources.
 */
@ApiTags('Patient')
@Controller('Patient')
export class PatientController extends GenericFhirController<Patient, PatientHistory> {
  constructor(private readonly patientService: PatientService) {
    // Pass the injected service to the parent controller's constructor.
    super(patientService);
  }

  /**
   * Get paginated list of Medical Record Numbers (MRNs)
   * 
   * Retrieves a paginated list of MRNs with patient information suitable for
   * dropdown population, table views, or other UI components that need patient selection.
   * 
   * @param query - Pagination and filtering parameters
   * @returns Paginated MRN data with patient details
   */
  @Get('mrns')
  @ApiOperation({
    summary: 'Get paginated MRNs',
    description: 'Retrieve a paginated list of Medical Record Numbers with patient information for dropdown population or table views. Supports search, filtering, and pagination.',
    operationId: 'getMrnList'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results to return (1-1000, default: 100)', example: 100 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip for pagination (default: 0)', example: 0 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for partial MRN matching', example: '123' })
  @ApiQuery({ name: 'system', required: false, type: String, description: 'Filter by identifier system', example: 'http://hospital.org/mrn' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by patient active status', example: true })
  @ApiResponse({
    status: HttpStatusCode.OK,
    description: 'Successfully retrieved paginated MRN list',
    type: PaginatedResponse
  })
  @ApiResponse({
    status: HttpStatusCode.BAD_REQUEST,
    description: 'Invalid query parameters',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: ApiErrorResponse
  })
  async getMrnList(@Query() query: MrnQueryDto): Promise<PaginatedResponse<MrnItemDto> | ApiErrorResponse> {
    try {
      const result = await this.patientService.getMrnList(query);

      return ResponseBuilder.paginated(
        result.mrns,
        Math.floor(result.offset / (query.limit || 100)) + 1,
        query.limit || 100,
        result.total,
        'MRN list retrieved successfully'
      );
    } catch (error) {
      return ResponseBuilder.internalError('Failed to retrieve MRN list');
    }
  }

  /**
   * Get all Medical Record Numbers (MRNs) without pagination
   * 
   * Retrieves all MRNs from a specific identifier system in a single response without pagination. 
   * Ideal for simple dropdown lists or autocomplete components. Use with caution on large datasets.
   * 
   * @param system - Required identifier system to filter by
   * @param search - Optional search term to filter MRNs
   * @param activeOnly - Whether to only return active patients (default: true)
   * @returns All matching MRN data without pagination
   */
  @Get('all-mrns')
  @ApiOperation({
    summary: 'Get all MRNs without pagination',
    description: 'Retrieve all Medical Record Numbers from a specific identifier system in a single response without pagination. Perfect for dropdown lists, autocomplete, or small datasets. Use with caution on large patient databases.',
    operationId: 'getAllMrns'
  })
  @ApiQuery({
    name: 'system',
    required: false,
    type: String,
    description: 'Filter by identifier system (optional for debugging). Specify the identifier system to search within.',
    example: 'http://hospital.org/mrn'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for partial MRN matching. Filters MRNs containing this text.',
    example: '123'
  })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to only include active patients. Set to false to include inactive patients.',
    example: true
  })
  @ApiResponse({
    status: HttpStatusCode.OK,
    description: 'Successfully retrieved all MRNs',
    type: ApiSuccessResponse
  })
  @ApiResponse({
    status: HttpStatusCode.BAD_REQUEST,
    description: 'Invalid query parameters or missing required system parameter',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: ApiErrorResponse
  })
  @ApiResponse({
    status: 413,
    description: 'Response too large - consider using paginated endpoint /mrns instead',
    type: ApiErrorResponse
  })
  async getAllMrns(
    @Query('system') system?: string,
    @Query('search') search?: string,
    @Query('activeOnly') activeOnly?: string
  ): Promise<ApiSuccessResponse<SimpleMrnResponseDto> | ApiErrorResponse> {
    try {
      // Convert string to boolean (query params are always strings)
      const activeOnlyBool = activeOnly !== undefined ? activeOnly === 'true' : true;
      const result = await this.patientService.getAllMrns(system, search, activeOnlyBool);

      return ResponseBuilder.success(result, 'All MRNs retrieved successfully');
    } catch (error) {
      return ResponseBuilder.internalError('Failed to retrieve MRNs');
    }
  }
}