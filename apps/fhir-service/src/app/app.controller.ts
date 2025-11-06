import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse, ApiSuccessResponse } from '../common/dtos/api-response.dto';
import { ResponseBuilder } from '../common/dtos/response-builder';
import { AppService } from './app.service';

/**
 * Main Application Controller
 *
 * Provides basic application health and information endpoints.
 * This controller serves as the entry point for the FHIR service.
 */
@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  /**
   * Get basic application information and health status
   *
   * Returns basic information about the FHIR service including version,
   * status, and available endpoints. Useful for health checks and service discovery.
   *
   * @returns Basic application information
   */
  @Get()
  @ApiOperation({
    summary: 'Get application information',
    description:
      'Returns basic information about the FHIR service including version, status, and available endpoints. Useful for health checks and service discovery.',
    operationId: 'getAppInfo',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved application information',
    type: ApiSuccessResponse
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ApiErrorResponse
  })
  async getData(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
    try {
      const data = this.appService.getData();
      return ResponseBuilder.success(data, 'Application information retrieved successfully', 'APP_INFO_SUCCESS');
    } catch (error) {
      return ResponseBuilder.internalError('Failed to retrieve application information');
    }
  }
}
